type Scope = import ('@interactjs/core/scope').Scope

declare module '@interactjs/core/defaultOptions' {
  interface PerActionDefaults {
    hold?: number
    delay?: number
  }
}

function install (scope: Scope) {
  const {
    autoStart,
    interactions,
    defaults,
  } = scope

  defaults.perAction.hold = 0
  defaults.perAction.delay = 0

  interactions.signals.on('new', (interaction) => {
    interaction.autoStartHoldTimer = null
  })

  autoStart.signals.on('prepared', ({ interaction }) => {
    const hold = getHoldDuration(interaction)

    if (hold > 0) {
      interaction.autoStartHoldTimer = setTimeout(() => {
        interaction.start(interaction.prepared, interaction.target, interaction.element)
      }, hold)
    }
  })

  interactions.signals.on('move', ({ interaction, duplicate }) => {
    if (interaction.pointerWasMoved && !duplicate) {
      clearTimeout(interaction.autoStartHoldTimer)
    }
  })

  // prevent regular down->move autoStart
  autoStart.signals.on('before-start', ({ interaction }) => {
    const hold = getHoldDuration(interaction)

    if (hold > 0) {
      interaction.prepared.name = null
    }
  })
}

function getHoldDuration (interaction) {
  const actionName = interaction.prepared && interaction.prepared.name

  if (!actionName) { return null }

  const options = interaction.target.options

  return options[actionName].hold || options[actionName].delay
}

export default {
  install,
  getHoldDuration,
}
