import drag from '@interactjs/actions/drag/plugin'
import pointerEvents from '@interactjs/pointer-events/plugin'
import userEvent from '@testing-library/user-event'

import * as helpers from './tests/_helpers'

describe('core/Interactable', () => {
  test('Interactable copies and extends defaults', () => {
    const scope = helpers.mockScope() as any
    const { defaults } = scope

    scope.actions.methodDict = { test: 'testize' }

    scope.Interactable.prototype.testize = function (options: any) {
      this.setPerAction('test', options)
    }

    defaults.actions.test = {
      fromDefault: { a: 1, b: 2 },
      specified: { c: 1, d: 2 },
    }

    const specified = { specified: 'parent' }

    const div = scope.document.createElement('div')
    const interactable = scope.interactables.new(div, { test: specified })

    // specified options are properly set
    expect(interactable.options.test.specified).toEqual(specified.specified)
    // default options are properly set
    expect(interactable.options.test.fromDefault).toEqual(defaults.actions.test.fromDefault)
    // defaults are not aliased
    expect(interactable.options.test.fromDefault).not.toBe(defaults.actions.test.fromDefault)

    defaults.actions.test.fromDefault.c = 3
    // modifying defaults does not affect constructed interactables
    expect('c' in interactable.options.test.fromDefault).not.toBe(true)
    div.remove()
  })

  test('Interactable unset correctly', () => {
    const scope = helpers.mockScope()

    const div = scope.document.createElement('div')
    const interactable = scope.interactables.new(div)

    expect(div[scope.id]).toHaveLength(1)

    interactable.unset()

    // clears target mapping
    expect(div[scope.id]).toHaveLength(0)

    div.remove()
  })

  test('Interactable copies and extends per action defaults', () => {
    const scope = helpers.mockScope()
    const { defaults } = scope

    scope.actions.methodDict = { test: 'testize' } as any
    ;(scope.Interactable.prototype as any).testize = function (options: any) {
      this.setPerAction('test', options)
    }
    ;(defaults.perAction as any).testOption = {
      fromDefault: { a: 1, b: 2 },
      specified: null,
    }
    ;(defaults.actions as any).test = { testOption: (defaults.perAction as any).testOption }

    const div = scope.document.createElement('div')
    const interactable = scope.interactables.new(div, {})
    ;(interactable as any).testize({ testOption: { specified: 'parent' } })

    // specified options are properly set
    expect((interactable.options as any).test).toEqual({
      enabled: false,
      origin: { x: 0, y: 0 },

      testOption: {
        fromDefault: { a: 1, b: 2 },
        specified: 'parent',
      },
    })
    // default options are properly set
    expect((interactable.options as any).test.testOption.fromDefault).toEqual(
      (defaults.perAction as any).testOption.fromDefault,
    )
    // defaults are not aliased
    expect((interactable.options as any).test.testOption.fromDefault).not.toBe(
      (defaults.perAction as any).testOption.fromDefault,
    )
    ;(defaults.perAction as any).testOption.fromDefault.c = 3
    // modifying defaults does not affect constructed interactables
    expect('c' in (interactable.options as any).test.testOption.fromDefault).toBe(false)
    div.remove()
  })

  test('Interactable.updatePerActionListeners', () => {
    const scope = helpers.mockScope()

    let fired: any[] = []
    function addToFired(event: any) {
      fired.push(event)
    }

    scope.actions.methodDict = { test: 'testize' } as any
    ;(scope.Interactable.prototype as any).testize = function (options: any) {
      this.setPerAction('test', options)
    }
    ;(scope.defaults.actions as any).test = {}

    const interactable = scope.interactables.new('target')

    interactable.setPerAction('test' as any, {
      listeners: [
        {
          start: addToFired,
          move: addToFired,
          end: addToFired,
        },
      ],
    })

    interactable.fire({ type: 'teststart' })
    expect(fired.map((e) => e.type)).toEqual(['teststart'])

    interactable.fire({ type: 'testmove' })
    expect(fired.map((e) => e.type)).toEqual(['teststart', 'testmove'])

    interactable.fire({ type: 'testnotadded' })
    expect(fired.map((e) => e.type)).toEqual(['teststart', 'testmove'])

    interactable.fire({ type: 'testend' })
    expect(fired.map((e) => e.type)).toEqual(['teststart', 'testmove', 'testend'])

    fired = []
    interactable.setPerAction('test' as any, {
      listeners: [{ start: addToFired }],
    })

    interactable.fire({ type: 'teststart' })
    interactable.fire({ type: 'testmove' })
    interactable.fire({ type: 'testend' })
    expect(fired.map((e) => e.type)).toEqual(['teststart'])

    fired = []
    interactable.setPerAction('test' as any, {
      listeners: null,
    })

    interactable.fire({ type: 'teststart' })
    interactable.fire({ type: 'testmove' })
    interactable.fire({ type: 'testend' })
    expect(fired).toEqual([])
  })

  test('Interactable.{on,off}', () => {
    const { interactable: elInteractable, interact, target: element } = helpers.testEnv({ plugins: [drag] })

    let fired: Array<{ type: any }> = []
    const listener = (e: { type: any }) => fired.push(e)
    const selectorInteractable = interact('html')

    elInteractable.on('dragstart click', listener)
    selectorInteractable.on('dragstart click change', listener)

    elInteractable.fire({ type: 'dragstart' })
    expect(fired).toHaveLength(1)
    expect(fired[0].type).toBe('dragstart')

    elInteractable.off('dragstart', listener)
    fired = []
    elInteractable.fire({ type: 'dragstart' })
    expect(fired).toEqual([])

    element.click()
    expect(fired.map((e) => e.type)).toEqual(['click', 'click'])

    selectorInteractable.off('click', listener)
    fired = []
    element.click()
    expect(fired.map((e) => e.type)).toEqual(['click'])

    fired = []
    selectorInteractable.fire({ type: 'dragstart' })
    expect(fired.map((e) => e.type)).toEqual(['dragstart'])

    selectorInteractable.off('dragstart', listener)
    fired = []
    selectorInteractable.fire({ type: 'dragstart' })
    expect(fired).toEqual([])
  })

  test('Interactable.checker', () => {
    const scope = helpers.mockScope()

    const div = scope.document.createElement('div')
    const interactable = scope.interactables.new(div)
    const checker = jest.fn()

    interactable.rectChecker(checker)
    interactable.getRect(div)
    expect(checker).toHaveBeenCalledWith(div)

    div.remove()
  })

  test('custom target function matching', () => {
    const { scope, interact } = helpers.testEnv()

    const doc1 = scope.window.document
    const iframe = document.body.appendChild(document.createElement('iframe'))
    const doc2 = iframe.contentWindow.document

    const targetFunc = (element: HTMLElement) => element === doc1.head

    // same function target returns previously created
    expect(interact(targetFunc)).toBe(interact(targetFunc))
    // same function target with `unique: true` returns new interactable
    expect(interact(targetFunc, { unique: true })).not.toBe(interact(targetFunc))
    // passing node matches function target
    expect(interact(targetFunc)._matches(doc1.head)).toBe(true)
    // failing node does not match function target
    expect(interact(targetFunc)._matches(doc1.body)).toBe(false)
    // failing context does not match function target
    expect(interact(targetFunc, { context: doc2 })._matches(doc1.head, scope.document)).toBe(false)

    for (const interactable of [...scope.interactables.list]) {
      interactable.unset()
    }

    for (const { doc } of scope.documents) {
      ;(interact as any).removeDocument(doc)
    }
  })

  test('custom target function events', () => {
    const { scope, interact } = helpers.testEnv()
    const targetFunc = (element: HTMLElement) => element === scope.document.head
    targetFunc.addEventListener = jest.fn()
    targetFunc.removeEventListener = jest.fn()

    interact(targetFunc).on('pointerdown', () => undefined, { passive: true })
    interact(targetFunc).on('click', () => undefined)

    expect(targetFunc.addEventListener.mock.calls).toEqual([
      ['pointerdown', expect.any(Function), { passive: true, capture: false }],
      ['click', expect.any(Function), { passive: false, capture: false }],
    ])

    for (const interactable of [...scope.interactables.list]) {
      interactable.unset()
    }

    expect(targetFunc.removeEventListener.mock.calls).toEqual([
      ['pointerdown', expect.any(Function), { passive: true, capture: false }],
      ['click', expect.any(Function), { passive: false, capture: false }],
    ])

    for (const { doc } of scope.documents) {
      ;(interact as any).removeDocument(doc)
    }
  })

  test('`options.unique === true`', () => {
    const { scope, interact } = helpers.testEnv()
    const { document } = scope

    const firstCreatedUnique = interact('.foo', { unique: true })
    expect(interact.isSet(firstCreatedUnique.target, { unique: true })).toBe(false)
    expect(interact(firstCreatedUnique.target)).not.toBe(firstCreatedUnique)
    expect(interact.isSet(firstCreatedUnique.target)).toBe(true)

    expect(interact(document.body, { unique: false })).toBe(interact(document.body))
    expect(interact('.foo', { unique: false })).toBe(interact('.foo'))

    expect(interact(document.body, { unique: true })).not.toBe(interact(document.body))
    expect(interact('.foo', { unique: true })).not.toBe(interact('.foo'))

    expect(interact(document.body, { unique: true })).not.toBe(interact(document.body, { unique: true }))
    expect(interact('.foo', { unique: true })).not.toBe(interact('.foo', { unique: true }))
  })

  test('`options.unique === true` with pointer-events', async () => {
    const { scope, interact } = helpers.testEnv({ plugins: [pointerEvents] })
    const { document } = scope

    const body1 = interact(document.body, { unique: true })
    const body2 = interact(document.body, { unique: true })

    const htmlSelector1 = interact('html', { unique: true })
    const htmlSelector2 = interact('html', { unique: true })

    const recordEvent = jest.fn()

    ;[body1, body2, htmlSelector1, htmlSelector2].forEach((interactable) => {
      interactable.on('down up tap', (event) =>
        recordEvent(event.type, event.currentTarget, event.interactable),
      )
    })

    const user = userEvent.setup()
    await user.click(document.body)

    // a set of events for each unique interactable
    expect(recordEvent.mock.calls).toEqual([
      ['down', document.body, body1],
      ['down', document.body, body2],
      ['down', document.documentElement, htmlSelector1],
      ['down', document.documentElement, htmlSelector2],
      ['up', document.body, body1],
      ['up', document.body, body2],
      ['up', document.documentElement, htmlSelector1],
      ['up', document.documentElement, htmlSelector2],
      ['tap', document.body, body1],
      ['tap', document.body, body2],
      ['tap', document.documentElement, htmlSelector1],
      ['tap', document.documentElement, htmlSelector2],
    ])
  })
})
