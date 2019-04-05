import test from '@interactjs/_dev/test/test'
import { ActionName } from '@interactjs/core/scope'
import * as helpers from '@interactjs/core/tests/_helpers'
import * as utils from '@interactjs/utils'
import gesture from './gesture'

function getGestureProps (event: Interact.GestureEvent) {
  return helpers.getProps(event, ['type', 'angle', 'distance', 'scale', 'ds', 'da'])
}

test('gesture action init', (t) => {
  const scope: Interact.Scope = helpers.mockScope()

  scope.usePlugin(gesture)

  t.ok(scope.actions.names.includes(ActionName.Gesture), '"gesture" in actions.names')
  t.equal(scope.actions.methodDict.gesture, 'gesturable')
  t.equal(typeof scope.Interactable.prototype.gesturable, 'function')

  t.end()
})

test('Interactable.gesturable method', (t) => {
  const scope: Interact.Scope = helpers.mockScope()

  scope.usePlugin(gesture)

  const interaction = scope.interactions.new({})
  const element = scope.document.body
  const interactable = scope.interactables.new(element).gesturable(true)
  const rect = Object.freeze({ top: 100, left: 200, bottom: 300, right: 400 })
  const touches = [
    utils.pointer.coordsToEvent(utils.pointer.newCoords()),
    utils.pointer.coordsToEvent(utils.pointer.newCoords()),
  ].map(
    (touch, index) => Object.assign(touch.coords, {
      pointerId: index,
      client: touch.page,
    }) && touch
  )
  const events: Interact.GestureEvent[] = []

  interactable.rectChecker(() => ({ ...rect }))
  interactable.on('gesturestart gesturemove gestureend', (event: Interact.GestureEvent) => {
    events.push(event)
  })

  // 0 --> 1
  utils.extend(touches[0].page, { x: 0, y: 0 })
  utils.extend(touches[1].page, { x: 100, y: 0 })

  interaction.pointerDown(touches[0], touches[0], element)

  t.notOk(
    gesture.checker(touches[0], touches[0], interactable, element, interaction),
    'not allowed with 1 pointer',
  )

  interaction.pointerDown(touches[1], touches[1], element)

  t.ok(
    gesture.checker(touches[1], touches[1], interactable, element, interaction),
    'allowed with 2 pointers',
  )

  interaction.start({ name: ActionName.Gesture }, interactable, element)

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
  utils.extend(touches[1].page, { x: 0, y: 50 })

  interaction.pointerMove(touches[1], touches[1], element)

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
  utils.extend(touches[0].page, { x: 50, y: 50 })
  interaction.pointerMove(touches[0], touches[0], element)

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

  interaction.pointerUp(touches[1], touches[1], element, element)

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
  interaction.pointerDown(touches[1], touches[1], element)
  utils.extend(touches[0].page, { x: 0, y: -150 })
  interaction.pointerMove(touches[1], touches[1], element)

  t.ok(
    gesture.checker(touches[0], touches[0], interactable, element, interaction),
    'not allowed with re-added second pointers',
  )

  interaction.start({ name: ActionName.Gesture }, interactable, element)

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
