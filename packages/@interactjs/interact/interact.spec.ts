import { JSDOM } from 'jsdom'

import { Scope } from '@interactjs/core/scope'

test('interact export', () => {
  const scope = new Scope()
  const interact = scope.interactStatic

  scope.init(new JSDOM('').window)

  const interactable1 = interact('selector')
  // interact function returns Interactable instance
  expect(interactable1).toBeInstanceOf(scope.Interactable)
  // same interactable is returned with same target and context
  expect(interact('selector')).toBe(interactable1)
  // new interactables are added to list
  expect(scope.interactables.list).toHaveLength(1)

  interactable1.unset()
  // unset interactables are removed
  expect(scope.interactables.list).toHaveLength(0)
  // unset interactions are removed
  expect(scope.interactions.list).toHaveLength(0)

  const doc1 = new JSDOM('').window.document
  const doc2 = new JSDOM('').window.document
  const results = [
    ['repeat', doc1],
    ['repeat', doc2],
    [doc1, doc1],
    [doc2.body, doc2],
  ].reduce((acc, [target, context]) => {
    const interactable = interact(target, { context })

    // unique contexts make unique interactables with identical targets
    expect(acc.some((e) => e.interactable === interactable)).toBe(false)

    acc.push({ interactable, target, context })
    return acc
  }, [])

  for (const { interactable, target, context } of results) {
    // interactions.get returns correct result with identical targets and different contexts
    expect(scope.interactables.get(target, { context })).toBe(interactable)
  }

  const doc3 = new JSDOM('').window.document

  const prevDocCount = scope.documents.length

  interact.addDocument(doc3, { events: { passive: false } })
  // interact.addDocument() adds to scope with options
  expect(scope.documents[prevDocCount]).toEqual({ doc: doc3, options: { events: { passive: false } } })

  interact.removeDocument(doc3)
  // interact.removeDocument() removes document from scope
  expect(scope.documents).toHaveLength(prevDocCount)

  scope.interactables.list.forEach((i) => i.unset())

  const plugin1 = {
    id: 'test-1',
    install () {
      plugin1.count++
    },
    count: 0,
  }
  const plugin2 = {
    id: '',
    install () {
      plugin2.count++
    },
    count: 0,
  }

  interact.use(plugin1)
  interact.use(plugin2)

  // new plugin install methods are called
  expect([plugin1.count, plugin2.count]).toEqual([1, 1])

  interact.use({ ...plugin1 })
  // different plugin object with same id not installed
  expect([plugin1.count, plugin2.count]).toEqual([1, 1])

  interact.use(plugin2)
  // plugin without id not re-installed
  expect([plugin1.count, plugin2.count]).toEqual([1, 1])
})
