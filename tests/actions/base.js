const test = require('../test');

test('export', t => {
  const actions = require('../../src/actions/base');

  t.assert(actions.names instanceof Array);
  t.assert(actions.methodDict instanceof Object);

  t.end();
});

test('firePrepared function', t => {
  const Interactable  = require('../../src/Interactable');
  const Interaction   = require('../../src/Interaction');
  const InteractEvent = require('../../src/InteractEvent');
  const actions       = require('../../src/actions/base');

  const interaction = new Interaction({});
  const element = {};
  const interactable = new Interactable(element, { origin: { x: 0, y: 0 } });
  const action = { name: 'resize' };
  const phase = 'TEST_PHASE';

  let event = null;

  interaction.prepared = action;
  interaction.target = interactable;
  interaction.element = element;
  interaction.prevEvent = {};

  // this method should be called from actions.firePrepared
  interactable.fire = firedEvent => {
    event = firedEvent;
  };

  actions.firePrepared(interaction, {}, phase);

  t.ok(event instanceof InteractEvent,
    'InteractEvent is fired');

  t.equal(event.type, action.name + phase,
    'event type');

  t.equal(event, interaction.prevEvent,
    'interaction.prevEvent is updated');

  t.equal(event.interactable, interactable,
    'event.interactable');

  t.equal(event.target, element,
    'event.target');

  interactable.unset();

  t.end();
});
