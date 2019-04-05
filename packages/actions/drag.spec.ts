import test from '@interactjs/_dev/test/test'
import { ActionName } from '@interactjs/core/scope'
import * as helpers from '@interactjs/core/tests/_helpers'
import { extend } from '@interactjs/utils'
import pointerUtils from '@interactjs/utils/pointerUtils'
import drag from './drag'

test('drag action init', (t) => {
  const scope = helpers.mockScope()

  scope.usePlugin(drag)

  t.ok(scope.actions.names.includes(ActionName.Drag), '"drag" in actions.names')
  t.equal(scope.actions.methodDict.drag, 'draggable')
  t.equal(typeof scope.Interactable.prototype.draggable, 'function')

  t.end()
})

test('Interactable.draggable method', (t) => {
  const interactable = {
    options: {
      drag: {},
    },
    draggable: drag.draggable,
    setPerAction: () => { calledSetPerAction = true },
    setOnEvents: () => { calledSetOnEvents = true },
  } as unknown as Interact.Interactable
  let calledSetPerAction = false
  let calledSetOnEvents = false

  t.equal(interactable.draggable(), interactable.options.drag,
    'interactable.draggable() returns interactable.options.drag object')

  interactable.draggable(true)
  t.ok(interactable.options.drag.enabled,
    'calling `interactable.draggable(true)` enables dragging')

  interactable.draggable(false)
  t.notOk(interactable.options.drag.enabled,
    'calling `interactable.draggable(false)` disables dragging')

  interactable.draggable({})
  t.ok(interactable.options.drag.enabled,
    'calling `interactable.draggable({})` enables dragging')
  t.ok(calledSetOnEvents,
    'calling `interactable.draggable({})` calls this.setOnEvents')
  t.ok(calledSetPerAction,
    'calling `interactable.draggable({})` calls this.setPerAction')

  interactable.draggable({ enabled: false })
  t.notOk(interactable.options.drag.enabled,
    'calling `interactable.draggable({ enabled: false })` disables dragging')

  const axisSettings = {
    lockAxis: ['x', 'y', 'xy', 'start'],
    startAxis: ['x', 'y', 'xy'],
  }

  for (const axis in axisSettings) {
    for (const value of axisSettings[axis]) {
      const options = {}

      options[axis] = value

      interactable.draggable(options)
      t.equal(interactable.options.drag[axis], value,
        '`' + axis + ': "' + value + '"` is set correctly')

      delete interactable.options.drag[axis]
    }
  }

  t.end()
})

test('drag axis', (t) => {
  const scope = helpers.mockScope()

  scope.usePlugin(drag)

  const interaction = scope.interactions.new({})
  const element = {}
  const interactable = {
    options: {
      drag: {},
    },
    target: element,
  } as Interact.Interactable
  const iEvent = { page: {}, client: {}, delta: {}, type: 'dragmove' } as Interact.InteractEvent

  const opposites = { x: 'y', y: 'x' }
  const eventCoords = {
    page: { x: -1, y: -2 },
    client: { x: -3, y: -4 },
    delta: { x: -5, y: -6 },
  }
  const coords = helpers.newCoordsSet()

  resetCoords()
  interaction.prepared = { name: 'drag', axis: 'xy' }
  interaction.interact = interactable

  t.test('xy (any direction)', (tt) => {
    scope.interactions.signals.fire('before-action-move', { interaction })

    tt.deepEqual(interaction.coords.start, coords.start,
      'coords.start is not modified')
    tt.deepEqual(interaction.coords.delta, coords.delta,
      'coords.delta is not modified')

    scope.interactions.signals.fire('action-move', { iEvent, interaction })

    tt.deepEqual(iEvent.page, eventCoords.page, 'page coords are not modified')
    tt.deepEqual(iEvent.delta, eventCoords.delta, 'delta is not modified')

    tt.end()
  })

  for (const axis in opposites) {
    const opposite = opposites[axis]

    t.test(axis + '-axis', (tt) => {
      resetCoords()
      interaction.prepared.axis = axis as any

      scope.interactions.signals.fire('action-move', { iEvent, interaction })

      tt.deepEqual(
        iEvent.delta,
        {
          [opposite]: 0,
          [axis]: eventCoords.delta[axis],
        },
        `opposite axis (${opposite}) delta is 0; target axis (${axis}) delta is not modified`)

      tt.deepEqual(
        iEvent.page,
        {
          [opposite]: coords.start.page[opposite],
          [axis]: eventCoords.page[axis],
        },
        `page.${opposite} is coords.start value`
      )

      tt.equal(
        iEvent.page[axis],
        eventCoords.page[axis],
        `page.${axis} is not modified`
      )

      tt.equal(
        iEvent.client[opposite],
        coords.start.client[opposite],
        `client.${opposite} is coords.start value`
      )
      tt.equal(
        iEvent.client[axis],
        eventCoords.client[axis],
        `client.${axis} is not modified`
      )

      tt.end()
    })
  }

  t.end()

  function resetCoords () {
    pointerUtils.copyCoords(iEvent, eventCoords)
    extend(iEvent.delta, eventCoords.delta)

    for (const prop in coords) {
      pointerUtils.copyCoords(interaction.coords[prop], coords[prop])
    }
  }
})
