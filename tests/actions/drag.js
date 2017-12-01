const test = require('../test');
const helpers = require('../helpers');
const Signals = require('../../src/utils/Signals');

const drag = require('../../src/actions/drag');

function mockScope () {
  return helpers.mockScope({
    actions: {
      names: [],
      methodDict: {},
    },
    InteractEvent: { signals: Signals.new() },
    Interactable: {
      prototype: {},
      signals: Signals.new(),
      eventTypes: [],
    },
  });
}

test('drag action init', t => {
  const scope = mockScope();

  drag.init(scope);

  t.ok(scope.actions.names.includes('drag'), '"drag" in actions.names');
  t.equal(scope.actions.methodDict.drag, 'draggable');
  t.equal(typeof scope.Interactable.prototype.draggable, 'function');

  t.end();
});

test('Interactable.draggable method', t => {
  const interactable = {
    options: {
      drag: {},
    },
    draggable: drag.draggable,
    setPerAction: () => calledSetPerAction = true,
    setOnEvents: () => calledSetOnEvents = true,
  };
  let calledSetPerAction = false;
  let calledSetOnEvents = false;

  t.equal(interactable.draggable(), interactable.options.drag,
    'interactable.draggable() returns interactable.options.drag object');

  interactable.draggable(true);
  t.ok(interactable.options.drag.enabled,
    'calling `interactable.draggable(true)` enables dragging');

  interactable.draggable(false);
  t.notOk(interactable.options.drag.enabled,
    'calling `interactable.draggable(false)` disables dragging');

  interactable.draggable({});
  t.ok(interactable.options.drag.enabled,
    'calling `interactable.draggable({})` enables dragging');
  t.ok(calledSetOnEvents,
    'calling `interactable.draggable({})` calls this.setOnEvents');
  t.ok(calledSetPerAction,
    'calling `interactable.draggable({})` calls this.setPerAction');


  interactable.draggable({ enabled: false });
  t.notOk(interactable.options.drag.enabled,
    'calling `interactable.draggable({ enabled: false })` disables dragging');

  const axisSettings = {
    lockAxis: ['x', 'y', 'xy', 'start'],
    startAxis: ['x', 'y', 'xy'],
  };

  for (const axis in axisSettings) {
    for (let i = 0; i < axisSettings[axis].length; i++) {
      const options = {};
      const value = axisSettings[axis][i];

      options[axis] = value;

      interactable.draggable(options);
      t.equal(interactable.options.drag[axis], value,
        '`' + axis + ': "' + value + '"` is set correctly');

      delete interactable.options.drag[axis];
    }
  }

  t.end();
});

test('drag axis', t => {
  const scope = mockScope();
  const Interaction = require('../../src/Interaction');

  Interaction.init(scope);
  drag.init(scope);

  const interaction = scope.Interaction.new({});
  const element = {};
  const interactable = {
    options: {
      drag: {},
    },
    target: element,
  };
  const iEvent = { type: 'dragmove' };

  const opposites = { x: 'y', y: 'x' };
  const eventCoords = {
    pageX:   -1, pageY:   -2,
    clientX: -3, clientY: -4,
    dx:      -5, dy:      -6,
  };
  const startPage   = { x: 0, y: 1 };
  const startClient = { x: 2, y: 3 };
  const deltaPage   = { x: 4, y: 5,  vx: 6,  vy: 7,  speed: 8  };
  const deltaClient = { x: 9, y: 10, vx: 11, vy: 12, speed: 13 };

  resetCoords();
  interaction.prepared = { name: 'drag', axis: 'xy' };
  interaction.target = interactable;

  t.test('xy (any direction)', tt => {
    scope.Interaction.signals.fire('before-action-move', { interaction });

    tt.deepEqual(interaction.startCoords.page, startPage,
      'startCoords.page is not modified');
    tt.deepEqual(interaction.startCoords.client, startClient,
      'startCoords.client is not modified');
    tt.deepEqual(interaction.pointerDelta.page, deltaPage,
      'pointerDelta.page is not modified');
    tt.deepEqual(interaction.pointerDelta.client, deltaClient,
      'pointerDelta.client is not modified');

    scope.InteractEvent.signals.fire('new', { iEvent, interaction });

    tt.equal(iEvent.pageX, eventCoords.pageX, 'pageX is not modified');
    tt.equal(iEvent.pageY, eventCoords.pageY, 'pageY is not modified');
    tt.equal(iEvent.dx, eventCoords.dx, 'dx is not modified');
    tt.equal(iEvent.dy, eventCoords.dy, 'dy is not modified');

    tt.end();
  });

  for (const axis in opposites) {
    const opposite = opposites[axis];
    const Opposite = opposite.toUpperCase();
    const Axis = axis.toUpperCase();

    t.test(axis + '-axis', tt => {

      resetCoords();
      interaction.prepared.axis = axis;

      scope.InteractEvent.signals.fire('new', { iEvent, interaction });

      tt.equal(iEvent['d' + opposite], 0,
        'd' + opposite + ' is zero');
      tt.equal(iEvent['d' + axis], eventCoords['d' + axis],
        'd' + axis + ' is not modified');

      tt.equal(iEvent['page' + Opposite], startPage[opposite],
        'page' + Opposite + ' is startCoords value');
      tt.equal(iEvent['page' + Axis], eventCoords['page' + Axis],
        'page' + Axis + ' is not modified');

      tt.equal(iEvent['client' + Opposite], startClient[opposite],
        'client' + Opposite + ' is startCoords value');
      tt.equal(iEvent['client' + Axis], eventCoords['client' + Axis],
        'client' + Axis + ' is not modified');

      tt.end();
    });
  }

  t.end();

  function resetCoords () {
    const { extend } = require('../../src/utils');

    extend(iEvent, eventCoords);
    extend(interaction.startCoords.page  , startPage);
    extend(interaction.startCoords.client, startClient);

    extend(interaction.pointerDelta.page  , deltaPage);
    extend(interaction.pointerDelta.client, deltaClient);
  }

});
