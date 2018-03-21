import test from './test';
import * as helpers from './helpers';

import Interaction from '../src/Interaction';
import Signals from '../src/utils/Signals';
import interactions from '../src/interactions';

test('interactions', t => {
  let scope = helpers.mockScope();

  interactions.init(scope);

  const interaction = interactions.newInteraction(
    { pointerType: 'TEST' },
    scope
  );

  t.equal(scope.interactions.list[0], interaction,
    'new Interaction is pushed to scope.interactions');

  interactions.init(scope);

  t.ok(scope.interactions instanceof Object, 'interactions object added to scope');

  const listeners = scope.interactions.listeners;

  t.ok(interactions.methodNames.reduce((acc, m) => acc && typeof listeners[m] === 'function', true),
    'interactions object added to scope');

  scope = helpers.mockScope();

  interactions.init(scope);
  const newInteraction = scope.interactions.new({});

  t.assert(typeof scope.interactions === 'object');
  t.assert(scope.interactions.signals instanceof Signals);
  t.assert(typeof scope.interactions.new === 'function');
  t.assert(newInteraction instanceof Interaction);
  t.equal(newInteraction._signals, scope.interactions.signals);

  t.assert(typeof scope.actions === 'object');
  t.deepEqual(scope.actions.names, []);
  t.deepEqual(scope.actions.methodDict, {});

  t.end();
});

