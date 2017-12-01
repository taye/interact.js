const test = require('../test');
const helpers = require('../helpers');

function mockScope () {
  return helpers.mockScope({
    pointerEvents: {
      defaults: {},
      signals: require('../../src/utils/Signals').new(),
      types: [],
      fire: () => {},
    },
  });
}

test('holdRepeat count', t => {
  const scope = mockScope();
  const pointerEvent = {
    type: 'hold',
  };

  require('../../src/pointerEvents/holdRepeat').init(scope);

  scope.pointerEvents.signals.fire('new', { pointerEvent });
  t.equal(pointerEvent.count, 1, 'first hold count is 1 with count previously undefined');

  const count = 20;
  pointerEvent.count = count;
  scope.pointerEvents.signals.fire('new', { pointerEvent });
  t.equal(pointerEvent.count, count + 1, 'existing hold count is incremented');

  t.end();
});

test('holdRepeat onFired', t => {
  const scope = mockScope();
  const Eventable = require('../../src/Eventable');
  require('../../src/Interaction').init(scope);
  require('../../src/pointerEvents/holdRepeat').init(scope);

  const interaction = scope.Interaction.new({});
  const pointerEvent = {
    type: 'hold',
  };
  const eventTarget = {};
  const eventable = new Eventable(Object.assign({}, scope.pointerEvents.defaults, {
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

  scope.pointerEvents.signals.fire('fired', signalArg);
  t.notOk('holdIntervalHandle' in interaction,
    'interaction interval handle was not saved with 0 holdRepeatInterval');

  eventable.options.holdRepeatInterval = 10;
  scope.pointerEvents.signals.fire('fired', signalArg);
  t.ok('holdIntervalHandle' in interaction,
    'interaction interval handle was saved with interval > 0');

  clearInterval(interaction.holdIntervalHandle);

  pointerEvent.type = 'NOT_HOLD';
  delete interaction.holdIntervalHandle;
  scope.pointerEvents.signals.fire('fired', signalArg);
  t.notOk('holdIntervalHandle' in interaction,
    'interaction interval handle is not saved if pointerEvent.type is not "hold"');

  t.end();
});
