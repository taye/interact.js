const test = require('../test');

test('pointerEvents.types', t => {
  const pointerEvents = require('../../src/pointerEvents/base');

  t.deepEqual(pointerEvents.types,
    [
      'down',
      'move',
      'up',
      'cancel',
      'tap',
      'doubletap',
      'hold',
    ],
    'pointerEvents.types is as expected');

  t.end();
});

test('fire', t => {
  const pointerEvents = require('../../src/pointerEvents/base');
  const Eventable     = require('../../src/Eventable');

  const eventable = new Eventable(pointerEvents.defaults);
  const type = 'TEST';
  const element = {};
  const eventTarget = {};
  const TEST_PROP = ['TEST_PROP'];
  let firedEvent;

  eventable.on(type, event => firedEvent = event);

  pointerEvents.fire({
    type,
    eventTarget,
    pointer: {},
    event: {},
    interaction: {},
    targets: [{
      eventable,
      element,
      props: {
        TEST_PROP,
      },
    }]});

  t.ok(firedEvent instanceof pointerEvents.PointerEvent,
    'Fired event is an instance of pointerEvents.PointerEvent');
  t.equal(firedEvent.type, type,
    'Fired event type is correct');
  t.equal(firedEvent.currentTarget, element,
    'Fired event currentTarget is correct');
  t.equal(firedEvent.target, eventTarget,
    'Fired event target is correct');
  t.equal(firedEvent.TEST_PROP, TEST_PROP,
    'Fired event has props from target.props');

  t.end();
});

test('collectEventTargets', t => {
  const pointerEvents = require('../../src/pointerEvents/base');
  const Interaction = require('../../src/Interaction');
  const Eventable = require('../../src/Eventable');
  const type = 'TEST';
  const TEST_PROP = ['TEST_PROP'];
  const target = {
    TEST_PROP,
    eventable: new Eventable(pointerEvents.defaults),
  };
  let collectedTargets;

  function onCollect ({ targets }) {
    targets.push(target);

    collectedTargets = targets;
  }

  pointerEvents.signals.on('collect-targets', onCollect);
  pointerEvents.collectEventTargets({
    interaction: new Interaction(),
    pointer: {},
    event: {},
    eventTarget: {},
    type,
  });

  t.deepEqual(collectedTargets, [target]);

  pointerEvents.signals.off('collect-targets', onCollect);

  t.end();
});
