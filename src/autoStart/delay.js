const autoStart   = require('./index');
const Interaction = require('../Interaction');
const actions     = require('../actions');

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

for (const action of actions.names) {
  autoStart.signals.on('before-start-' + action, preventImmediateMove);
}

Interaction.signals.on('move', function ({ interaction, duplicate }) {
  if (interaction.pointerWasMoved && !duplicate) {
    clearTimeout(interaction.delayTimer);
  }
});

function preventImmediateMove ({ interaction }) {
  const actionName = interaction.prepared.name;

  if (!actionName) { return; }

  const delay = interaction.target.options[actionName].delay;

  if (delay > 0) {
    interaction.prepared.name = null;
  }
}
