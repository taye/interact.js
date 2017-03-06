const autoStart   = require('./base');
const Interaction = require('../Interaction');

Interaction.signals.on('new', function (interaction) {
  interaction.delayTimer = null;
});

autoStart.signals.on('prepared', function ({ interaction }) {
  const actionName = interaction.prepared.name;

  if (!actionName) { return; }

  const delay = interaction.target.options[actionName].delay;

  if (delay > 0) {
    interaction.delayTimer = setTimeout(() => {
      interaction.start(interaction.prepared, interaction.target, interaction.element);
    }, delay);
  }
});

Interaction.signals.on('move', function ({ interaction, duplicate }) {
  if (interaction.pointerWasMoved && !duplicate) {
    clearTimeout(interaction.delayTimer);
  }
});

// prevent regular down->move autoStart
autoStart.signals.on('before-start', function ({ interaction }) {
  const actionName = interaction.prepared.name;

  if (!actionName) { return; }

  const delay = interaction.target.options[actionName].delay;

  if (delay > 0) {
    interaction.prepared.name = null;
  }
});
