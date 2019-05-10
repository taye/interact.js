import { JSDOM } from '@interactjs/_dev/test/domator'
import test from '@interactjs/_dev/test/test'
import interact, { scope } from './interact'

test('interact export', (t) => {
  scope.init(new JSDOM('').window)

  const interactable1 = interact('selector')
  t.assert(interactable1 instanceof scope.Interactable,
    'interact function returns Interactable instance')
  t.equal(interact('selector'), interactable1,
    'same interactable is returned with same target and context')
  t.equal(scope.interactables.list.length, 1,
    'new interactables are added to list')

  interactable1.unset()
  t.equal(scope.interactables.list.length, 0,
    'unset interactables are removed')
  t.strictEqual(scope.interactions.list.length, 0,
    'unset interactions are removed')

  const constructsUniqueMessage =
    'unique contexts make unique interactables with identical targets'

  const doc1 = new JSDOM('').window.document
  const doc2 = new JSDOM('').window.document
  const results = [
    ['repeat', doc1],
    ['repeat', doc2],
    [doc1, doc1],
    [doc2.body, doc2],
  ].reduce((acc, [target, context]) => {
    const interactable = interact(target, { context })

    if (acc.includes(interactable)) {
      t.fail(constructsUniqueMessage)
    }

    acc.push({ interactable, target, context })
    return acc
  }, [])

  t.pass(constructsUniqueMessage)

  const getsUniqueMessage =
    'interactions.get returns correct result with identical targets and different contexts'

  for (const { interactable, target, context } of results) {
    if (scope.interactables.get(target, { context }) !== interactable) {
      t.fail(getsUniqueMessage)
    }
  }

  t.pass(getsUniqueMessage)

  const doc3 = new JSDOM('').window.document

  const prevDocCount = scope.documents.length

  interact.addDocument(doc3, { events: { passive: false } })
  t.deepEqual(
    scope.documents[prevDocCount],
    { doc: doc3, options: { events: { passive: false } } },
    'interact.addDocument() adds to scope with options')

  interact.removeDocument(doc3)
  t.equal(
    scope.documents.length,
    prevDocCount,
    'interact.removeDocument() removes document from scope')

  scope.interactables.list.forEach((i) => i.unset())

  const plugin1 = { id: 'test-1', install () { plugin1.count++ }, count: 0 }
  const plugin2 = { id: undefined, install () { plugin2.count++ }, count: 0 }

  interact.use(plugin1)
  interact.use(plugin2)

  t.deepEqual([plugin1.count, plugin2.count], [1, 1], 'new plugin install methods are called')

  interact.use({ ...plugin1 })
  t.deepEqual([plugin1.count, plugin2.count], [1, 1], 'different plugin object with same id not installed')

  interact.use(plugin2)
  t.deepEqual([plugin1.count, plugin2.count], [1, 1], 'plugin without id not re-installed')

  t.end()
})
