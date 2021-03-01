import PromisePolyfill from 'promise-polyfill'

import type { InteractEvent } from '@interactjs/core/InteractEvent'
import type { ActionName } from '@interactjs/core/scope'
import * as helpers from '@interactjs/core/tests/_helpers'
import type { Point } from '@interactjs/types/index'

import reflow from './plugin'

const testAction = { name: 'TEST' as ActionName }

describe('reflow', () => {
  test('sync', () => {
    const rect = Object.freeze({ top: 100, left: 200, bottom: 300, right: 400 })

    const { scope, interactable } = helpers.testEnv({ plugins: [reflow], rect })

    Object.assign(scope.actions, { TEST: {}, names: ['TEST'] })

    // reflow method is added to Interactable.prototype
    expect(scope.Interactable.prototype.reflow instanceof Function).toBe(true)

    const fired: InteractEvent[] = []
    let beforeReflowDelta: Point

    interactable.fire = ((iEvent: any) => {
      fired.push(iEvent)
    }) as any
    ;(interactable.target as any) = {}
    ;(interactable.options as any).TEST = { enabled: true }
    interactable.rectChecker(() => ({ ...rect }))

    // modify move coords
    scope.addListeners({
      'interactions:before-action-move': ({ interaction }) => {
        interaction.coords.cur.page = {
          x: rect.left + 100,
          y: rect.top - 50,
        }
      },
      'interactions:before-action-reflow': ({ interaction }) => {
        beforeReflowDelta = { ...interaction.coords.delta.page }
      },
    })

    interactable.reflow(testAction)

    const phases = ['reflow', 'start', 'move', 'end']

    for (const index in phases) {
      const phase = phases[index]
      // `event #${index} is ${phase}`
      expect(fired[index].type).toBe(`TEST${phase}`)
    }

    const interaction = fired[0]._interaction

    // uses element top left for event coords
    expect(interaction.coords.start.page).toEqual({
      x: rect.left,
      y: rect.top,
    })

    const reflowMove = fired[2]

    // interaction delta is zero before-action-reflow
    expect(beforeReflowDelta!).toEqual({ x: 0, y: 0 })
    // move delta is correct with modified interaction coords
    expect(reflowMove.delta).toEqual({ x: 100, y: -50 })
    // reflow pointer was lifted
    expect(interaction.pointerIsDown).toBe(false)
    // reflow pointer was removed from interaction
    expect(interaction.pointers).toHaveLength(0)
    // interaction is removed from list
    expect(scope.interactions.list).not.toContain(interaction)
  })

  test('async', async () => {
    const { scope } = helpers.testEnv({ plugins: [reflow] })

    Object.assign(scope.actions, { TEST: {}, names: ['TEST'] })

    let reflowEvent: any
    let promise

    const interactable = scope.interactables.new(scope.window)
    const rect = Object.freeze({ top: 100, left: 200, bottom: 300, right: 400 })
    interactable.rectChecker(() => ({ ...rect }))
    interactable.fire = ((iEvent: any) => {
      reflowEvent = iEvent
    }) as any
    ;(interactable.options as any).TEST = { enabled: true }

    // test with Promise implementation
    ;(scope.window as any).Promise = PromisePolyfill

    promise = interactable.reflow(testAction)
    // method returns a Promise if available
    expect(promise instanceof (scope.window as any).Promise).toBe(true)
    // reflow may end synchronously
    expect(reflowEvent.interaction.interacting()).toBe(false)

    // returned Promise resolves to interactable
    expect(await promise).toBe(interactable)

    let stoppedFromTimeout: boolean
    // block the end of the reflow interaction and stop it after a timeout
    scope.addListeners({
      'interactions:before-action-end': ({ interaction }) => {
        setTimeout(() => {
          interaction.stop()
          stoppedFromTimeout = true
        }, 0)
        return false
      },
    })

    stoppedFromTimeout = false
    promise = interactable.reflow(testAction)

    // interaction continues if end is blocked
    expect(reflowEvent.interaction.interacting() && !stoppedFromTimeout).toBe(true)
    await promise
    // interaction is stopped after promise is resolved
    expect(reflowEvent.interaction.interacting() && stoppedFromTimeout).toBe(false)

    // test without Promise implementation
    stoppedFromTimeout = false
    ;(scope.window as any).Promise = undefined

    promise = interactable.reflow(testAction)
    // method returns null if no Proise is avilable
    expect(promise).toBeNull()
    // interaction continues if end is blocked without Promise
    expect(reflowEvent.interaction.interacting() && !stoppedFromTimeout).toBe(true)

    setTimeout(() => {
      // interaction is stopped after timeout without Promised
      expect(reflowEvent.interaction.interacting() || !stoppedFromTimeout).toBe(false)
    }, 0)
  })
})
