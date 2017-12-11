const test = require('./test');
const interact = require('../src/interact');
const scope = require('../src/scope');
const interactions = require('../src/interactions');
const { jsdom } = require('jsdom');

test('interact export', t => {
  const Interactable = require('../src/Interactable');
  interactions.init(scope);

  const interactable1 = interact('selector');
  t.assert(interactable1 instanceof Interactable,
    'interact function returns Interactable instance');
  t.equal(interact('selector'), interactable1,
    'same interactable is returned with same target and context');

  interactable1.unset();
  t.equal(scope.interactables.length, 0,
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

  scope.interactables.forEach(i => i.unset());

  t.end();
});
