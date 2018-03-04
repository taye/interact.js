import test from './test';
import helpers from './helpers';

import Interaction from '../src/Interaction';
import Signals from '../src/utils/Signals';
import interactions from '../src/interactions';

test('interactions', t => {
  let scope = helpers.mockScope();
  const interaction = interactions.newInteraction(
    { pointerType: 'TEST' },
    scope
  );

  t.equal(scope.interactions[0], interaction,
    'new Interaction is pushed to scope.interactions');

  interactions.init(scope);

  t.ok(scope.interactions instanceof Object, 'interactions object added to scope');

  const listeners = scope.Interaction.listeners;

  t.ok(interactions.methodNames.reduce((acc, m) => acc && typeof listeners[m] === 'function', true),
    'interactions object added to scope');

  scope = helpers.mockScope();

  interactions.init(scope);
  const newInteraction = scope.Interaction.new({});

  t.assert(typeof scope.Interaction === 'object');
  t.assert(scope.Interaction.signals instanceof Signals);
  t.assert(typeof scope.Interaction.new === 'function');
  t.assert(newInteraction instanceof Interaction);
  t.equal(newInteraction._signals, scope.Interaction.signals);

  t.assert(typeof scope.actions === 'object');
  t.deepEqual(scope.actions.names, []);
  t.deepEqual(scope.actions.methodDict, {});

  t.end();
});

