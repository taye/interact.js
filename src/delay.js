const signals = require('./utils/signals');
const actions = require('./actions/base');

signals.on('interaction-new', function (interaction) {
  interaction.delayTimer = null;
});

signals.on('interaction-prepared', function ({ interaction }) {
  const delay = interaction.target.options[interaction.prepared.name].delay;

  if (delay > 0) {
    interaction.delayTimer = setTimeout(() => {
      interaction.start(interaction.prepared, interaction.target, interaction.element);
    }, delay);
  }
});

for (const action of actions.names) {
  signals.on('interaction-before-start-' + action, preventImmediateMove);
}

signals.on('interaction-move-done', function ({ interaction }) {
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
