function install (scope) {
  const {
    autoStart,
    interactions,
    defaults,
  } = scope;

  defaults.perAction.hold = 0;
  defaults.perAction.delay = 0;

  interactions.signals.on('new', function (interaction) {
    interaction.autoStartHoldTimer = null;
  });

  autoStart.signals.on('prepared', function ({ interaction }) {
    const hold = getHoldDuration(interaction);

    if (hold > 0) {
      interaction.autoStartHoldTimer = setTimeout(() => {
        interaction.start(interaction.prepared, interaction.target, interaction.element);
      }, hold);
    }
  });

  interactions.signals.on('move', function ({ interaction, duplicate }) {
    if (interaction.pointerWasMoved && !duplicate) {
      clearTimeout(interaction.autoStartHoldTimer);
    }
  });

  // prevent regular down->move autoStart
  autoStart.signals.on('before-start', function ({ interaction }) {
    const hold = getHoldDuration(interaction);

    if (hold > 0) {
      interaction.prepared.name = null;
    }
  });
}

function getHoldDuration (interaction) {
  const actionName = interaction.prepared && interaction.prepared.name;

  if (!actionName) { return null; }

  const options = interaction.target.options;

  return options[actionName].hold || options[actionName].delay;
}

export default {
  install,
  getHoldDuration,
};
