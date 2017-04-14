const Interaction   = require('../Interaction');
const InteractEvent = require('../InteractEvent');

const actions = {
  firePrepared,
  names: [],
  methodDict: {},
};

Interaction.signals.on('action-start', function ({ interaction, event }) {
  interaction._interacting = true;
  firePrepared(interaction, event, 'start');
});

Interaction.signals.on('action-move', function ({ interaction, event, preEnd }) {
  firePrepared(interaction, event, 'move', preEnd);

  // if the action was ended in a listener
  if (!interaction.interacting()) { return false; }
});

Interaction.signals.on('action-end', function ({ interaction, event }) {
  firePrepared(interaction, event, 'end');
});

function firePrepared (interaction, event, phase, preEnd) {
  const actionName = interaction.prepared.name;

  const newEvent = new InteractEvent(interaction, event, actionName, phase, interaction.element, null, preEnd);

  interaction.target.fire(newEvent);
  interaction.prevEvent = newEvent;
}

module.exports = actions;
