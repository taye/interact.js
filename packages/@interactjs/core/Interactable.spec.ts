import drag from '@interactjs/actions/drag/plugin'

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
    const scope = helpers.mockScope() as any

    const div = scope.document.createElement('div')
    const interactable = scope.interactables.new(div)

    const mappingInfo = div[scope.id][0]

    scope.fire('interactable:unset', { interactable })

    // unset mappingInfo context
    expect(mappingInfo.context).toBeNull()

    // unset mappingInfo interactable
    expect(mappingInfo.interactable).toBeNull()

    // unset target are removed
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
    function addToFired (event: any) {
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
})
