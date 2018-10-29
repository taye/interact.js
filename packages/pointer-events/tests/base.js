import test from '@interactjs/_dev/test/test';
import * as helpers from '@interactjs/core/tests/helpers';
import interactions from '@interactjs/core/interactions';

import Interaction from '@interactjs/core/Interaction';
import Eventable     from '@interactjs/core/Eventable';
import Signals from '@interactjs/utils/Signals';
import pointerEvents from '../base';

test('pointerEvents.types', t => {

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

test('pointerEvents.fire', t => {
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

  const tapTime = 500;
  const interaction = Object.assign(
    new Interaction({ signals: new Signals() }),
    { tapTime: -1, prevTap: null });

  interaction.updatePointer({}, {});

  const tapEvent = Object.assign(new pointerEvents.PointerEvent('tap', {}, {}, null, interaction), {
    timeStamp: tapTime,
  });

  pointerEvents.fire({
    pointerEvent: tapEvent,
    interaction,
    targets: [{
      eventable,
      element,
    }]});

  t.equal(interaction.tapTime, tapTime,
    'interaction.tapTime is updated');
  t.equal(interaction.prevTap, tapEvent,
    'interaction.prevTap is updated');

  t.end();
});

test('pointerEvents.collectEventTargets', t => {
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
    interaction: new Interaction({ signals: helpers.mockSignals() }),
    pointer: {},
    event: {},
    eventTarget: {},
    type,
  });

  t.deepEqual(collectedTargets, [target]);

  pointerEvents.signals.off('collect-targets', onCollect);

  t.end();
});

test('pointerEvents Interaction update-pointer signal', t => {
  const scope = helpers.mockScope();

  interactions.install(scope);
  pointerEvents.install(scope);

  const interaction = scope.interactions.new({});
  const initialHold = { duration: Infinity, timeout: null };
  const event = {};

  interaction.updatePointer(helpers.newPointer(0), event, null, false);
  t.deepEqual(interaction.pointers.map(p => p.hold), [initialHold], 'set hold info for move on new pointer');

  interaction.removePointer(helpers.newPointer(0), event);

  interaction.updatePointer(helpers.newPointer(0), event, null, true);
  t.deepEqual(interaction.pointers.map(p => p.hold), [initialHold]);

  interaction.updatePointer(helpers.newPointer(5), event, null, true);
  t.deepEqual(interaction.pointers.map(p => p.hold), [initialHold, initialHold]);

  t.end();
});

test('pointerEvents Interaction remove-pointer signal', t => {
  const scope = helpers.mockScope();

  interactions.install(scope);
  pointerEvents.install(scope);

  const interaction = scope.interactions.new({});

  const ids = [0, 1, 2, 3];
  const removals = [
    { id: 0, remain: [1, 2, 3], message: 'first of 4'  },
    { id: 2, remain: [1,    3], message: 'middle of 3' },
    { id: 3, remain: [1      ], message: 'last of 2'   },
    { id: 1, remain: [       ], message: 'final'       },
  ];

  for (const id of ids) {
    const index = interaction.updatePointer({ pointerId: id }, {}, true);
    // use the ids as the pointerInfo.hold value for this test
    interaction.pointers[index].hold = id;
  }

  for (const removal of removals) {
    interaction.removePointer({ pointerId: removal.id });

    t.deepEqual(interaction.pointers.map(p => p.hold), removal.remain,
      `${removal.message} - remaining interaction.holdTimers is correct`);
  }

  t.end();
});
