import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'
import * as Interact from '@interactjs/types/index'
import extend from '@interactjs/utils/extend'
import { coordsToEvent, newCoords } from '@interactjs/utils/pointerUtils'

import gesture from './plugin'

function getGestureProps (event: Interact.GestureEvent) {
  return helpers.getProps(event, ['type', 'angle', 'distance', 'scale', 'ds', 'da'])
}

test('gesture action init', t => {
  const scope: Interact.Scope = helpers.mockScope()

  scope.usePlugin(gesture)

  t.ok(scope.actions.map.gesture, '"gesture" in actions.names')
  t.equal(scope.actions.methodDict.gesture, 'gesturable')
  t.equal(typeof scope.Interactable.prototype.gesturable, 'function')

  t.end()
})

test('Interactable.gesturable method', t => {
  const rect = Object.freeze({ top: 100, left: 200, bottom: 300, right: 400 })
  const {
    scope,
    interaction,
    interactable,
    target: element,
    coords,
    down,
    start,
    move,
  } = helpers.testEnv({ plugins: [gesture], rect })
  const events: Interact.GestureEvent[] = []
  const event2 = coordsToEvent(newCoords())
  event2.coords.pointerId = 2

  scope.usePlugin(gesture)

  interactable.rectChecker(() => ({ ...rect }))
  interactable.gesturable(true)
  interactable.on('gesturestart gesturemove gestureend', (event: Interact.GestureEvent) => {
    events.push(event)
  })
  interaction.pointerType = 'touch'

  // 0 --> 1
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
  t.notOk(checkArg.action, 'not allowed with 1 pointer')

  interaction.pointerDown(event2, event2, element)
  scope.fire('auto-start:check', checkArg)
  t.ok(checkArg.action, 'allowed with 2 pointers')

  start({ name: 'gesture' })

  t.deepEqual(
    interaction.gesture,
    {
      angle: 0,
      distance: 100,
      scale: 1,
      startAngle: 0,
      startDistance: 100,
    },
    'start interaction properties are correct')

  t.deepEqual(
    getGestureProps(events[0]),
    {
      type: 'gesturestart',
      angle: 0,
      distance: 100,
      scale: 1,
      ds: 0,
      da: 0,
    },
    'start event properties are correct')

  // 0
  // |
  // v
  // 1
  extend(event2.coords.page, { x: 0, y: 50 })
  interaction.pointerMove(event2, event2, element)

  t.deepEqual(
    interaction.gesture,
    {
      angle: 90,
      distance: 50,
      scale: 0.5,
      startAngle: 0,
      startDistance: 100,
    },
    'move interaction properties are correct')

  t.deepEqual(
    getGestureProps(events[1]),
    {
      type: 'gesturemove',
      angle: 90,
      distance: 50,
      scale: 0.5,
      ds: -0.5,
      da: 90,
    },
    'move event properties are correct')

  // 1 <-- 0
  extend(coords.page, { x: 50, y: 50 })
  move()

  t.deepEqual(
    interaction.gesture,
    {
      angle: 180,
      distance: 50,
      scale: 0.5,
      startAngle: 0,
      startDistance: 100,
    },
    'move interaction properties are correct')

  t.deepEqual(
    getGestureProps(events[2]),
    {
      type: 'gesturemove',
      angle: 180,
      distance: 50,
      scale: 0.5,
      ds: 0,
      da: 90,
    },
    'move event properties are correct')

  interaction.pointerUp(event2, event2, element, element)

  t.deepEqual(
    interaction.gesture,
    {
      angle: 180,
      distance: 50,
      scale: 0.5,
      startAngle: 0,
      startDistance: 100,
    },
    'move interaction properties are correct')

  t.deepEqual(
    getGestureProps(events[3]),
    {
      type: 'gestureend',
      angle: 180,
      distance: 50,
      scale: 0.5,
      ds: 0,
      da: 0,
    },
    'end event properties are correct')

  // 0
  // |
  // v
  // 1
  interaction.pointerDown(event2, event2, element)
  extend(coords.page, { x: 0, y: -150 })
  checkArg.action = null
  scope.fire('auto-start:check', checkArg)
  interaction.pointerMove(event2, event2, element)

  t.ok(
    checkArg.action,
    'not allowed with re-added second pointers',
  )

  interaction.start({ name: 'gesture' }, interactable, element)

  t.deepEqual(
    interaction.gesture,
    {
      angle: 90,
      distance: 200,
      scale: 1,
      startAngle: 90,
      startDistance: 200,
    },
    'move interaction properties are correct')

  t.deepEqual(
    getGestureProps(events[4]),
    {
      type: 'gesturestart',
      angle: 90,
      distance: 200,
      scale: 1,
      ds: 0,
      da: 0,
    },
    'second start event properties are correct')

  t.equal(events.length, 5, 'correct number of events fired')

  t.end()
})
