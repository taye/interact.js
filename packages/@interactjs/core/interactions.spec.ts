import Interaction from './Interaction'
import interactions from './interactions'
import * as helpers from './tests/_helpers'

describe('core/interactions', () => {
  test('interactions', () => {
    let scope = helpers.mockScope()

    const interaction = scope.interactions.new({ pointerType: 'TEST' })

    // new Interaction is pushed to scope.interactions
    expect(scope.interactions.list[0]).toBe(interaction)
    // interactions object added to scope
    expect(scope.interactions).toBeInstanceOf(Object)

    const listeners = scope.interactions.listeners

    expect(interactions.methodNames.every((m: string) => typeof listeners[m] === 'function')).toBe(true)

    scope = helpers.mockScope()

    const newInteraction = scope.interactions.new({})

    expect(typeof scope.interactions).toBe('object')
    expect(typeof scope.interactions.new).toBe('function')
    expect(newInteraction instanceof Interaction).toBe(true)
    expect(typeof newInteraction._scopeFire).toBe('function')

    expect(scope.actions).toBeInstanceOf(Object)
    expect(scope.actions.map).toEqual({})
    expect(scope.actions.methodDict).toEqual({})
  })

  test('interactions document event options', () => {
    const { scope } = helpers.testEnv()
    const doc = scope.document

    let options = {}
    scope.browser = { isIOS: false } as any
    scope.fire('scope:add-document', { doc, scope, options } as any)

    // no doc options.event.passive is added when not iOS
    expect(options).toEqual({})

    options = {}

    scope.browser.isIOS = true
    scope.fire('scope:add-document', { doc, scope, options } as any)

    // doc options.event.passive is set to false for iOS
    expect(options).toEqual({ events: { passive: false } })
  })

  test('interactions removes pointers on targeting removed elements', () => {
    const { interaction, scope } = helpers.testEnv()

    const {
      TouchEvent,
      Touch = function (_t: any) {
        return _t
      },
    } = scope.window as any
    const div1 = scope.document.body.appendChild(scope.document.createElement('div'))
    const div2 = scope.document.body.appendChild(scope.document.createElement('div'))

    const touch1Init = { bubbles: true, changedTouches: [new Touch({ identifier: 1, target: div1 })] }
    const touch2Init = { bubbles: true, changedTouches: [new Touch({ identifier: 2, target: div2 })] }

    interaction.pointerType = 'touch'
    div1.dispatchEvent(new TouchEvent('touchstart', touch1Init))
    div1.dispatchEvent(new TouchEvent('touchmove', touch1Init))

    expect(scope.interactions.list).toHaveLength(1)

    // down pointer added to interaction
    expect(interaction.pointers).toHaveLength(1)
    // _latestPointer target is down target
    expect(interaction._latestPointer.eventTarget).toBe(div1)

    div1.remove()

    div2.dispatchEvent(new TouchEvent('touchstart', touch2Init))

    // interaction with removed element is reused for new pointer
    expect(scope.interactions.list).toEqual([interaction])

    // pointer on removed element is removed from existing interaction and new pointerdown is added
    expect(interaction.pointers).toHaveLength(1)
  })
})
