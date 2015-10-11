const Interaction = require('./Interaction');
const actions = require('./actions/base');

Interaction.signals.on('new', function (interaction) {
  interaction.delayTimer = null;
});

Interaction.signals.on('prepared', function ({ interaction }) {
  const delay = interaction.target.options[interaction.prepared.name].delay;

  if (delay > 0) {
    interaction.delayTimer = setTimeout(() => {
      interaction.start(interaction.prepared, interaction.target, interaction.element);
    }, delay);
  }
});

for (const action of actions.names) {
  Interaction.signals.on('before-start-' + action, preventImmediateMove);
}

Interaction.signals.on('move-done', function ({ interaction }) {
  if (interaction.pointerWasMoved) {
    clearTimeout(interaction.delayTimer);
  }
});

function preventImmediateMove ({ interaction }) {
  const delay = interaction.target.options[interaction.prepared.name].delay;

  if (delay > 0) {
    interaction.prepared.name = null;
  }
}
