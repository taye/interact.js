import type Interaction from '@interactjs/core/Interaction'
import type { Scope, Plugin } from '@interactjs/core/scope'

import basePlugin from './base'

declare module '@interactjs/core/options' {
  interface PerActionDefaults {
    hold?: number
    delay?: number
  }
}

declare module '@interactjs/core/Interaction' {
  interface Interaction {
    autoStartHoldTimer?: any
  }
}

function install (scope: Scope) {
  const { defaults } = scope

  scope.usePlugin(basePlugin)

  defaults.perAction.hold = 0
  defaults.perAction.delay = 0
}

function getHoldDuration (interaction: Interaction) {
  const actionName = interaction.prepared && interaction.prepared.name

  if (!actionName) {
    return null
  }

  const options = interaction.interactable.options

  return options[actionName].hold || options[actionName].delay
}

const hold: Plugin = {
  id: 'auto-start/hold',
  install,
  listeners: {
    'interactions:new': ({ interaction }) => {
      interaction.autoStartHoldTimer = null
    },

    'autoStart:prepared': ({ interaction }) => {
      const hold = getHoldDuration(interaction)

      if (hold > 0) {
        interaction.autoStartHoldTimer = setTimeout(() => {
          interaction.start(interaction.prepared, interaction.interactable, interaction.element)
        }, hold)
      }
    },

    'interactions:move': ({ interaction, duplicate }) => {
      if (interaction.autoStartHoldTimer && interaction.pointerWasMoved && !duplicate) {
        clearTimeout(interaction.autoStartHoldTimer)
        interaction.autoStartHoldTimer = null
      }
    },

    // prevent regular down->move autoStart
    'autoStart:before-start': ({ interaction }) => {
      const holdDuration = getHoldDuration(interaction)

      if (holdDuration > 0) {
        interaction.prepared.name = null
      }
    },
  },
  getHoldDuration,
}
export default hold
