import type { Scope } from '@interactjs/core/scope'
import * as helpers from '@interactjs/core/tests/_helpers'
import extend from '@interactjs/utils/extend'
import { coordsToEvent, newCoords } from '@interactjs/utils/pointerUtils'

import type { GestureEvent } from './plugin'
import gesture from './plugin'

function getGestureProps (event: GestureEvent) {
  return helpers.getProps(event, ['type', 'angle', 'distance', 'scale', 'ds', 'da'])
}

describe('actions/gesture', () => {
  test('action init', () => {
    const scope: Scope = helpers.mockScope()

    scope.usePlugin(gesture)

    expect(scope.actions.map.gesture).toBeTruthy()
    expect(scope.actions.methodDict.gesture).toBe('gesturable')
    expect(scope.Interactable.prototype.gesturable).toBeInstanceOf(Function)
  })

  test('interactable.gesturable() method', () => {
    const rect = Object.freeze({ top: 100, left: 200, bottom: 300, right: 400 })
    const { scope, interaction, interactable, target: element, coords, down, start, move } = helpers.testEnv({
      plugins: [gesture],
      rect,
    })
    const events: GestureEvent[] = []
    const event2 = coordsToEvent(newCoords())
    event2.coords.pointerId = 2

    scope.usePlugin(gesture)

    interactable.rectChecker(() => ({ ...rect }))
    interactable.gesturable(true)
    interactable.on('gesturestart gesturemove gestureend', (event: GestureEvent) => {
      events.push(event)
    })
    interaction.pointerType = 'touch'

    // 0 ➡ 1
    extend(coords.page, { x: 0, y: 0 })
    extend(event2.coords.page, { x: 100, y: 0 })

    const checkArg = {
      action: null,
      interactable,
      interaction,
      element,
      rect,
      buttons: 0,
    }

    down()

    scope.fire('auto-start:check', checkArg)
    // not allowed with 1 pointer
    expect(checkArg.action).toBeFalsy()

    interaction.pointerDown(event2, event2, element)
    scope.fire('auto-start:check', checkArg)
    // allowed with 2 pointers
    expect(checkArg.action).toBeTruthy()

    start({ name: 'gesture' })

    // start interaction properties are correct,
    expect(interaction.gesture).toEqual({
      angle: 0,
      distance: 100,
      scale: 1,
      startAngle: 0,
      startDistance: 100,
    })

    // start event properties are correct,
    expect(getGestureProps(events[0])).toEqual({
      type: 'gesturestart',
      angle: 0,
      distance: 100,
      scale: 1,
      ds: 0,
      da: 0,
    })

    // 0
    // ⬇
    // 1
    extend(event2.coords.page, { x: 0, y: 50 })
    interaction.pointerMove(event2, event2, element)

    // move interaction properties are correct,
    expect(interaction.gesture).toEqual({
      angle: 90,
      distance: 50,
      scale: 0.5,
      startAngle: 0,
      startDistance: 100,
    })

    // move event properties are correct,
    expect(getGestureProps(events[1])).toEqual({
      type: 'gesturemove',
      angle: 90,
      distance: 50,
      scale: 0.5,
      ds: -0.5,
      da: 90,
    })

    // 1 ⬅ 0
    extend(coords.page, { x: 50, y: 50 })
    move()

    // move interaction properties are correct,
    expect(interaction.gesture).toEqual({
      angle: 180,
      distance: 50,
      scale: 0.5,
      startAngle: 0,
      startDistance: 100,
    })

    // move event properties are correct,
    expect(getGestureProps(events[2])).toEqual({
      type: 'gesturemove',
      angle: 180,
      distance: 50,
      scale: 0.5,
      ds: 0,
      da: 90,
    })

    interaction.pointerUp(event2, event2, element, element)

    // move interaction properties are correct,
    expect(interaction.gesture).toEqual({
      angle: 180,
      distance: 50,
      scale: 0.5,
      startAngle: 0,
      startDistance: 100,
    })

    // end event properties are correct,
    expect(getGestureProps(events[3])).toEqual({
      type: 'gestureend',
      angle: 180,
      distance: 50,
      scale: 0.5,
      ds: 0,
      da: 0,
    })

    // 0
    // ⬇
    // 1
    interaction.pointerDown(event2, event2, element)
    extend(coords.page, { x: 0, y: -150 })
    checkArg.action = null
    scope.fire('auto-start:check', checkArg)
    interaction.pointerMove(event2, event2, element)

    // not allowed with re-added second pointers
    expect(checkArg.action).toBeTruthy()

    interaction.start({ name: 'gesture' }, interactable, element)

    // move interaction properties are correct,
    expect(interaction.gesture).toEqual({
      angle: 90,
      distance: 200,
      scale: 1,
      startAngle: 90,
      startDistance: 200,
    })

    // second start event properties are correct,
    expect(getGestureProps(events[4])).toEqual({
      type: 'gesturestart',
      angle: 90,
      distance: 200,
      scale: 1,
      ds: 0,
      da: 0,
    })

    // correct number of events fired
    expect(events).toHaveLength(5)
  })
})
