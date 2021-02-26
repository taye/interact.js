import type { InteractEvent } from '@interactjs/core/InteractEvent'
import type { Interactable } from '@interactjs/core/Interactable'
import * as helpers from '@interactjs/core/tests/_helpers'
import extend from '@interactjs/utils/extend'
import * as pointerUtils from '@interactjs/utils/pointerUtils'

import drag from './plugin'

describe('actions/drag', () => {
  test('drag action init', () => {
    const scope = helpers.mockScope()

    scope.usePlugin(drag)

    expect(scope.actions.map.drag).toBeTruthy()
    expect(scope.actions.methodDict.drag).toBe('draggable')
    expect(typeof scope.Interactable.prototype.draggable).toBe('function')
  })

  describe('interactable.draggable method', () => {
    const interactable = ({
      options: {
        drag: {},
      },
      draggable: drag.draggable,
      setPerAction: () => {
        calledSetPerAction = true
      },
      setOnEvents: () => {
        calledSetOnEvents = true
      },
    } as unknown) as Interactable
    let calledSetPerAction = false
    let calledSetOnEvents = false

    test('args types', () => {
      expect(interactable.draggable()).toEqual(interactable.options.drag)

      interactable.draggable(true)
      expect(interactable.options.drag.enabled).toBe(true)

      interactable.draggable(false)
      expect(interactable.options.drag.enabled).toBe(false)

      interactable.draggable({})
      expect(interactable.options.drag.enabled).toBe(true)
      expect(calledSetOnEvents).toBe(true)
      expect(calledSetPerAction).toBe(true)

      interactable.draggable({ enabled: false })
      expect(interactable.options.drag.enabled).toBe(false)
    })

    const axisSettings = {
      lockAxis: ['x', 'y', 'xy', 'start'],
      startAxis: ['x', 'y', 'xy'],
    }

    for (const axis in axisSettings) {
      for (const value of axisSettings[axis]) {
        test(`\`${axis}: ${value}\` is set correctly`, () => {
          interactable.draggable({ [axis]: value })
          expect(interactable.options.drag[axis]).toBe(value)
        })
      }
    }
  })

  describe('drag axis', () => {
    const scope = helpers.mockScope()

    scope.usePlugin(drag)

    const interaction = scope.interactions.new({})
    const element = {}
    const interactable = {
      options: {
        drag: {},
      },
      target: element,
    } as Interactable
    const iEvent = { page: {}, client: {}, delta: {}, type: 'dragmove' } as InteractEvent

    const opposites = { x: 'y', y: 'x' }
    const eventCoords = {
      page: { x: -1, y: -2 },
      client: { x: -3, y: -4 },
      delta: { x: -5, y: -6 },
      timeStamp: 0,
    }
    const coords = helpers.newCoordsSet()

    resetCoords()
    interaction.prepared = { name: 'drag', axis: 'xy' }
    interaction.interactable = interactable

    test('xy (any direction)', () => {
      scope.fire('interactions:before-action-move', { interaction } as any)

      expect(interaction.coords.start).toEqual(coords.start)
      expect(interaction.coords.delta).toEqual(coords.delta)

      scope.fire('interactions:action-move', { iEvent, interaction } as any)

      expect(iEvent.page).toEqual(eventCoords.page)
      expect(iEvent.delta).toEqual(eventCoords.delta)
    })

    for (const axis in opposites) {
      const opposite = opposites[axis]

      test(`${axis}-axis`, () => {
        resetCoords()
        interaction.prepared.axis = axis as any

        scope.fire('interactions:action-move', { iEvent, interaction } as any)

        expect(iEvent.delta).toEqual({
          [opposite]: 0,
          [axis]: eventCoords.delta[axis],
        })

        expect(iEvent.page).toEqual({
          [opposite]: coords.start.page[opposite],
          [axis]: eventCoords.page[axis],
        })

        expect(iEvent.page[axis]).toBe(eventCoords.page[axis])

        expect(iEvent.client[opposite]).toBe(coords.start.client[opposite])
        expect(iEvent.client[axis]).toBe(eventCoords.client[axis])
      })
    }

    function resetCoords () {
      pointerUtils.copyCoords(iEvent, eventCoords)
      extend(iEvent.delta, eventCoords.delta)

      for (const prop in coords) {
        pointerUtils.copyCoords(interaction.coords[prop], coords[prop])
      }
    }
  })
})
