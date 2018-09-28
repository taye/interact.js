import { jsdom } from '@interactjs/_dev/test/domator';
import test from '@interactjs/_dev/test/test';
import { default as interact, scope } from '../interact';
import interactions from '@interactjs/core/interactions';

test('interact export', t => {
  scope.init(jsdom('').defaultView);
  interactions.install(scope);

  const interactable1 = interact('selector');
  t.assert(interactable1 instanceof scope.Interactable,
    'interact function returns Interactable instance');
  t.equal(interact('selector'), interactable1,
    'same interactable is returned with same target and context');
  t.equal(scope.interactables.list.length, 1,
    'new interactables are added to list');

  interactable1.unset();
  t.equal(scope.interactables.list.length, 0,
    'unset interactables are removed');

  const constructsUniqueMessage =
    'unique contexts make unique interactables with identical targets';

  const doc1 = jsdom('');
  const doc2 = jsdom('');
  const results = [
    ['repeat'  , doc1],
    ['repeat'  , doc2],
    [doc1      , doc1],
    [doc2.body , doc2],
  ].reduce((acc, [target, context]) => {
    const interactable = interact(target, { context });

    if (acc.includes(interactable)) {
      t.fail(constructsUniqueMessage);
    }

    acc.push({ interactable, target, context });
    return acc;
  }, []);

  t.pass(constructsUniqueMessage);

  const getsUniqueMessage =
    'interactions.get returns correct result with identical targets and different contexts';

  for (const { interactable, target, context } of results) {
    if (scope.interactables.get(target, { context }) !== interactable) {
      t.fail(getsUniqueMessage);
    }
  }

  t.pass(getsUniqueMessage);

  scope.interactables.list.forEach(i => i.unset());

  delete scope.Interactable;

  t.end();
});
