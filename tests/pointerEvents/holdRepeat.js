const test = require('../test');

test('holdRepeat count', t => {
  const pointerEvents = require('../../src/pointerEvents/base');
  require('../../src/pointerEvents/holdRepeat');

  const pointerEvent = {
    type: 'hold',
  };

  pointerEvents.signals.fire('new', { pointerEvent });
  t.equal(pointerEvent.count, 1, 'first hold count is 1 with count previously undefined');

  const count = 20;
  pointerEvent.count = count;
  pointerEvents.signals.fire('new', { pointerEvent });
  t.equal(pointerEvent.count, count + 1, 'existing hold count is incremented');

  t.end();
});

test('holdRepeat onFired', t => {
  const pointerEvents = require('../../src/pointerEvents/base');
  const Eventable = require('../../src/Eventable');
  const Interaction = require('../../src/Interaction');
  require('../../src/pointerEvents/holdRepeat');

  const interaction = new Interaction({});
  const pointerEvent = {
    type: 'hold',
  };
  const eventTarget = {};
  const eventable = new Eventable(Object.assign({}, pointerEvents.defaults, {
    holdRepeatInterval: 0,
  }));
  const signalArg = {
    interaction,
    pointerEvent,
    eventTarget,
    targets: [{
      eventable,
    }],
  };

  pointerEvents.signals.fire('fired', signalArg);
  t.notOk('holdIntervalHandle' in interaction,
    'interaction interval handle was not saved with 0 holdRepeatInterval');

  eventable.options.holdRepeatInterval = 10;
  pointerEvents.signals.fire('fired', signalArg);
  t.ok('holdIntervalHandle' in interaction,
    'interaction interval handle was saved with interval > 0');

  pointerEvent.type = 'NOT_HOLD';
  delete interaction.holdIntervalHandle;
  pointerEvents.signals.fire('fired', signalArg);
  t.notOk('holdIntervalHandle' in interaction,
    'interaction interval handle is not saved if pointerEvent.type is not "hold"');

  t.end();
});
