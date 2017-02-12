const Interaction   = require('../Interaction');
const InteractEvent = require('../InteractEvent');

const actions = {
  firePrepared,
  names: [],
  methodDict: {},
};

Interaction.signals.on('action-start', function ({ interaction, event }) {
  firePrepared(interaction, event, 'start');
  interaction._interacting = true;
});

Interaction.signals.on('action-move', function ({ interaction, event }) {
  firePrepared(interaction, event, 'move');

  // if the action was ended in a listener
  if (!interaction.interacting()) { return false; }
});

Interaction.signals.on('action-end', function ({ interaction, event }) {
  firePrepared(interaction, event, 'end');
});

function firePrepared (interaction, event, phase) {
  const actionName = interaction.prepared.name;

  const newEvent = new InteractEvent(interaction, event, actionName, phase, interaction.element);

  interaction.target.fire(newEvent);
  interaction.prevEvent = newEvent;
}

module.exports = actions;
