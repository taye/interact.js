import type { ActionName } from '@interactjs/core/scope'
import * as helpers from '@interactjs/core/tests/_helpers'
import type { Element } from '@interactjs/types/index'
import extend from '@interactjs/utils/extend'
import is from '@interactjs/utils/is'

import modifiersBase from './base'

test('modifiers/base', () => {
  const { scope, target, interaction, interactable, coords, event } = helpers.testEnv({
    plugins: [modifiersBase],
  })

  // modifiers prop is added new Interaction
  expect(is.object(interaction.modification)).toBe(true)

  coords.client = coords.page

  const testAction = { name: 'test' as ActionName }
  const element = target as Element
  const startCoords = { x: 100, y: 200 }
  const moveCoords = { x: 400, y: 500 }
  const options: any = { target: { x: 100, y: 100 }, setStart: true }
  let firedEvents: any[] = []

  interactable.rectChecker(() => ({ top: 0, left: 0, bottom: 50, right: 50 }))
  interactable.on('teststart testmove testend', (e) => firedEvents.push(e))

  extend(coords.page, startCoords)
  interaction.pointerDown(event, event, element)
  ;(interactable.options as any).test = {
    enabled: true,
    modifiers: [
      {
        options,
        methods: targetModifier,
      },
    ],
  }

  interaction.start(testAction, interactable, element)

  // modifier methods.start() was called
  expect(options.started).toBe(true)

  // modifier methods.set() was called
  expect(options.setted).toBe(true)

  // start event coords are modified
  expect(interaction.prevEvent.page).toEqual(options.target)

  // interaction.coords.start are restored after action start phase
  expect(interaction.coords.start.page).toEqual(startCoords)

  // interaction.coords.cur are restored after action start phase
  expect(interaction.coords.cur.page).toEqual(startCoords)

  extend(coords.page, moveCoords)
  interaction.pointerMove(event, event, element)

  // interaction.coords.cur are restored after action move phase
  expect(interaction.coords.cur.page).toEqual(moveCoords)

  // interaction.coords.start are restored after action move phase
  expect(interaction.coords.start.page).toEqual(startCoords)

  // move event start coords are modified
  expect({ x: interaction.prevEvent.x0, y: interaction.prevEvent.y0 }).toEqual({ x: 100, y: 100 })

  firedEvents = []
  scope.interactions.pointerMoveTolerance = 0
  interaction.pointerMove(event, event, element)
  // duplicate result coords are ignored
  expect(firedEvents).toHaveLength(0)

  interaction.stop()

  // modifier methods.stop() was called
  expect(options.stopped).toBe(true)

  // don't set start
  options.setStart = null
  // add second modifier
  ;(interactable.options as any).test.modifiers.push({
    options,
    methods: doubleModifier,
  })

  extend(coords.page, startCoords)
  interaction.pointerDown(event, event, element)
  interaction.start(testAction, interactable, element)

  // modifier methods.set() was not called on start phase without options.setStart
  expect(options.setted).toBeUndefined()

  // start event coords are not modified without options.setStart
  expect(interaction.prevEvent.page).toEqual({ x: 100, y: 200 })

  // interaction.coords.start are not modified without options.setStart
  expect(interaction.coords.start.page).toEqual({ x: 100, y: 200 })

  extend(coords.page, moveCoords)
  interaction.pointerMove(event, event, element)

  // move event coords are modified by all modifiers
  expect(interaction.prevEvent.page).toEqual({ x: 200, y: 200 })

  interaction.pointerMove(event, event, element)

  expect(() => {
    interaction._scopeFire('interactions:action-resume', {
      interaction,
      phase: 'resume',
      iEvent: {} as any,
      event,
    })
  }).not.toThrow()

  interaction.stop()

  interaction.pointerUp(event, event, element, element)
  // interaction coords after stopping are as expected
  expect(interaction.coords.cur.page).toEqual(moveCoords)
})

const targetModifier = {
  start ({ state }: any) {
    state.options.started = true
  },
  set ({ state, coords }: any) {
    const { target } = state.options

    coords.x = target.x
    coords.y = target.y

    state.options.setted = true
  },
  stop ({ state }: any) {
    state.options.stopped = true
    delete state.options.started
    delete state.options.setted
  },
}

const doubleModifier = {
  start () {},
  set ({ coords }: any) {
    coords.x *= 2
    coords.y *= 2
  },
}
