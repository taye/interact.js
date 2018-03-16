import test from './test';
import * as helpers from './helpers';
import reflow from '../src/reflow';
import win from '../src/utils/window';

test('reflow', t => {
  const scope = helpers.mockScope({
    autoStart: {},
  });

  Object.assign(scope.actions, { test: {}, names: ['test'] });

  reflow.init(scope);

  t.ok(
    scope.Interactable.prototype.reflow instanceof Function,
    'reflow method is added to Interactable.prototype'
  );

  const fired = [];
  const interactable = helpers.newInteractable(scope, win.window);
  const rect = Object.freeze({ top: 100, left: 200, bottom: 300, right: 400 });
  interactable.fire = iEvent => fired.push(iEvent);
  interactable.target = {};
  interactable.options.test = {};
  interactable.rectChecker(() => rect);

  scope.autoStart.withinInteractionLimit = () => false;
  interactable.reflow({ name: 'test' });
  t.equal(fired.length, 0, 'follows scope.autoStart.withinInteractionLimit');

  // modify move coords
  scope.Interaction.signals.on('before-action-move', ({ interaction }) => {
    interaction.curCoords.page = {
      x: rect.left + 100,
      y: rect.top - 50,
    };
  });

  scope.autoStart.withinInteractionLimit = () => true;
  interactable.reflow({ name: 'test' });

  const phases = ['reflow', 'start', 'move', 'end'];

  for (const [index, phase] of Object.entries(phases)) {
    t.equal(fired[index].type, `test${phase}`, `event #${index} is ${phase}`);
  }

  const interaction = fired[0].interaction;

  t.deepEqual(
    interaction.startCoords.page,
    {
      x: rect.left,
      y: rect.top,
    },
    'uses element top left for event coords'
  );

  const reflowMove = fired[2];

  t.deepEqual(
    reflowMove.delta,
    { x: 100, y: -50 },
    'move delta is correct with modified interaction coords'
  );

  t.notOk(
    interaction.pointerIsDown,
    'reflow pointer was lifted'
  );

  t.equal(
    interaction.pointers.length,
    0,
    'reflow pointer was removed from interaction'
  );

  t.notOk(
    scope.interactions.includes(interaction),
    'interaction is removed from list'
  );

  t.end();
});
