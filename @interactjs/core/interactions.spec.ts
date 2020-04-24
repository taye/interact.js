import test from '@interactjs/_dev/test/test'

import Interaction from './Interaction'
import interactions from './interactions'
import * as helpers from './tests/_helpers'

test('interactions', t => {
  let scope = helpers.mockScope()

  const interaction = scope.interactions.new({ pointerType: 'TEST' })

  t.equal(scope.interactions.list[0], interaction,
    'new Interaction is pushed to scope.interactions')

  t.ok(scope.interactions instanceof Object, 'interactions object added to scope')

  const listeners = scope.interactions.listeners

  t.ok(interactions.methodNames.reduce((acc: boolean, m: string) => acc && typeof listeners[m] === 'function', true),
    'interactions object added to scope')

  scope = helpers.mockScope()

  const newInteraction = scope.interactions.new({})

  t.equal(typeof scope.interactions, 'object')
  t.equal(typeof scope.interactions.new, 'function')
  t.assert(newInteraction instanceof Interaction)
  t.equal(typeof newInteraction._scopeFire, 'function')

  t.assert(typeof scope.actions === 'object')
  t.deepEqual(scope.actions.map, {})
  t.deepEqual(scope.actions.methodDict, {})

  t.end()
})

test('interactions document event options', t => {
  const { scope } = helpers.testEnv()
  const doc = scope.document

  let options = {}
  scope.browser = { isIOS: false } as any
  scope.fire('scope:add-document', { doc, scope, options } as any)

  t.deepEqual(
    options,
    {},
    'no doc options.event.passive is added when not iOS')

  options = {}

  scope.browser.isIOS = true
  scope.fire('scope:add-document', { doc, scope, options } as any)

  t.deepEqual(
    options,
    { events: { passive: false } },
    'doc options.event.passive is set to false for iOS')

  t.end()
})

test('interactions removes pointers on targeting removed elements', t => {
  const {
    interaction,
    scope,
  } = helpers.testEnv()

  const { TouchEvent, Touch = function (_t: any) { return _t } } = scope.window as any
  const div1 = scope.document.body.appendChild(scope.document.createElement('div'))
  const div2 = scope.document.body.appendChild(scope.document.createElement('div'))

  const touch1Init = { bubbles: true, changedTouches: [new Touch({ identifier: 1, target: div1 })] }
  const touch2Init = { bubbles: true, changedTouches: [new Touch({ identifier: 2, target: div2 })] }

  interaction.pointerType = 'touch'
  div1.dispatchEvent(new TouchEvent('touchstart', touch1Init))
  div1.dispatchEvent(new TouchEvent('touchmove', touch1Init))

  t.equal(
    scope.interactions.list.length,
    1)

  t.equal(interaction.pointers.length, 1, 'down pointer added to interaction')
  t.equal(interaction._latestPointer.eventTarget, div1, '_latestPointer target is down target')

  div1.remove()

  div2.dispatchEvent(new TouchEvent('touchstart', touch2Init))

  t.deepEqual(
    scope.interactions.list,
    [interaction],
    'interaction with removed element is reused for new pointer')

  t.equal(
    interaction.pointers.length,
    1,
    'pointer on removed element is removed from existing interaction and new pointerdown is added')

  t.end()
})
