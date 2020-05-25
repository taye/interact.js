import d from '@interactjs/_dev/test/domator'
import test from '@interactjs/_dev/test/test'
import drag from '@interactjs/actions/drag/plugin'

import * as helpers from './tests/_helpers'

test('Interactable copies and extends defaults', t => {
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

  const div = d('div')
  const interactable = scope.interactables.new(div, { test: specified })

  t.deepEqual(interactable.options.test.specified, specified.specified,
    'specified options are properly set')
  t.deepEqual(interactable.options.test.fromDefault, defaults.actions.test.fromDefault,
    'default options are properly set')
  t.notEqual(interactable.options.test.fromDefault, defaults.actions.test.fromDefault,
    'defaults are not aliased')

  defaults.actions.test.fromDefault.c = 3
  t.notOk('c' in interactable.options.test.fromDefault,
    'modifying defaults does not affect constructed interactables')

  t.end()
})

test('Interactable unset correctly', t => {
  const scope = helpers.mockScope() as any

  const div = d('div')
  const interactable = scope.interactables.new(div)

  const mappingInfo = div[scope.id][0]

  scope.fire('interactable:unset', { interactable })

  t.strictEqual(mappingInfo.context, null,
    'unset mappingInfo context')

  t.strictEqual(mappingInfo.interactable, null,
    'unset mappingInfo interactable')

  t.strictEqual(div[scope.id].length, 0,
    'unset target are removed')

  t.end()
})

test('Interactable copies and extends per action defaults', t => {
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

  const div = d('div')
  const interactable = scope.interactables.new(div, {})
  ;(interactable as any).testize({ testOption: { specified: 'parent' } })

  t.deepEqual((interactable.options as any).test, {
    enabled: false,
    origin: { x: 0, y: 0 },

    testOption: {
      fromDefault: { a: 1, b: 2 },
      specified: 'parent',
    },
  }, 'specified options are properly set')
  t.deepEqual(
    (interactable.options as any).test.testOption.fromDefault,
    (defaults.perAction as any).testOption.fromDefault,
    'default options are properly set')
  t.notEqual(
    (interactable.options as any).test.testOption.fromDefault,
    (defaults.perAction as any).testOption.fromDefault,
    'defaults are not aliased')

  ;(defaults.perAction as any).testOption.fromDefault.c = 3
  t.notOk('c' in (interactable.options as any).test.testOption.fromDefault,
    'modifying defaults does not affect constructed interactables')

  t.end()
})

test('Interactable.updatePerActionListeners', t => {
  const scope = helpers.mockScope()

  let fired: any[] = []
  function addToFired (event: any) { fired.push(event) }

  scope.actions.methodDict = { test: 'testize' } as any
  ;(scope.Interactable.prototype as any).testize = function (options: any) {
    this.setPerAction('test', options)
  }

  ;(scope.defaults.actions as any).test = {}

  const interactable = scope.interactables.new('target')

  interactable.setPerAction('test' as any, {
    listeners: [{
      start: addToFired,
      move: addToFired,
      end: addToFired,
    }],
  })

  interactable.fire({ type: 'teststart' })
  t.deepEqual(fired.map(e => e.type), ['teststart'])

  interactable.fire({ type: 'testmove' })
  t.deepEqual(fired.map(e => e.type), ['teststart', 'testmove'])

  interactable.fire({ type: 'testnotadded' })
  t.deepEqual(fired.map(e => e.type), ['teststart', 'testmove'])

  interactable.fire({ type: 'testend' })
  t.deepEqual(fired.map(e => e.type), ['teststart', 'testmove', 'testend'])

  fired = []
  interactable.setPerAction('test' as any, {
    listeners: [{ start: addToFired }],
  })

  interactable.fire({ type: 'teststart' })
  interactable.fire({ type: 'testmove' })
  interactable.fire({ type: 'testend' })
  t.deepEqual(fired.map(e => e.type), ['teststart'])

  fired = []
  interactable.setPerAction('test' as any, {
    listeners: null,
  })

  interactable.fire({ type: 'teststart' })
  interactable.fire({ type: 'testmove' })
  interactable.fire({ type: 'testend' })
  t.deepEqual(fired, [])

  t.end()
})

test('Interactable.{on,off}', t => {
  const {
    interactable: elInteractable,
    interact,
    target: element,
  } = helpers.testEnv({ plugins: [drag] })

  let fired: Array<{ type: any }> = []
  const listener = (e: { type: any }) => fired.push(e)
  const selectorInteractable = interact('html')

  elInteractable.on('dragstart click', listener)
  selectorInteractable.on('dragstart click change', listener)

  elInteractable.fire({ type: 'dragstart' })
  t.equal(fired.length, 1)
  t.equal(fired[0].type, 'dragstart')

  elInteractable.off('dragstart', listener)
  fired = []
  elInteractable.fire({ type: 'dragstart' })
  t.deepEqual(fired, [])

  element.click()
  t.deepEqual(fired.map(e => e.type), ['click', 'click'])

  selectorInteractable.off('click', listener)
  fired = []
  element.click()
  t.deepEqual(fired.map(e => e.type), ['click'])

  fired = []
  selectorInteractable.fire({ type: 'dragstart' })
  t.deepEqual(fired.map(e => e.type), ['dragstart'])

  selectorInteractable.off('dragstart', listener)
  fired = []
  selectorInteractable.fire({ type: 'dragstart' })
  t.deepEqual(fired, [])

  t.end()
})
