import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'
import * as Interact from '@interactjs/types/index'
import extend from '@interactjs/utils/extend'
import is from '@interactjs/utils/is'

import modifiersBase from './base'

test('modifiers/base', t => {
  const {
    scope,
    target,
    interaction,
    interactable,
    coords,
    event,
  } = helpers.testEnv({ plugins: [modifiersBase] })

  t.ok(is.object(interaction.modification), 'modifiers prop is added new Interaction')

  coords.client = coords.page

  const testAction = { name: 'test' as Interact.ActionName }
  const element = target as Interact.Element
  const startCoords = { x: 100, y: 200 }
  const moveCoords = { x: 400, y: 500 }
  const options: any = { target: { x: 100, y: 100 }, setStart: true }
  let firedEvents = []

  interactable.rectChecker(() => ({ top: 0, left: 0, bottom: 50, right: 50 }))
  interactable.on('teststart testmove testend', e => firedEvents.push(e))

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

  t.ok(
    options.started,
    'modifier methods.start() was called',
  )

  t.ok(
    options.setted,
    'modifier methods.set() was called',
  )

  t.deepEqual(
    interaction.prevEvent.page,
    options.target,
    'start event coords are modified')

  t.deepEqual(
    interaction.coords.start.page,
    startCoords,
    'interaction.coords.start are restored after action start phase')

  t.deepEqual(
    interaction.coords.cur.page,
    startCoords,
    'interaction.coords.cur are restored after action start phase')

  extend(coords.page, moveCoords)
  interaction.pointerMove(event, event, element)

  t.deepEqual(
    interaction.coords.cur.page,
    moveCoords,
    'interaction.coords.cur are restored after action move phase')

  t.deepEqual(
    interaction.coords.start.page,
    startCoords,
    'interaction.coords.start are restored after action move phase')

  t.deepEqual(
    { x: interaction.prevEvent.x0, y: interaction.prevEvent.y0 },
    { x: 100, y: 100 },
    'move event start coords are modified')

  firedEvents = []
  scope.interactions.pointerMoveTolerance = 0
  interaction.pointerMove(event, event, element)
  t.equal(firedEvents.length, 0, 'duplicate result coords are ignored')

  interaction.stop()

  t.ok(
    options.stopped,
    'modifier methods.stop() was called',
  )

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

  t.notOk(
    options.setted,
    'modifier methods.set() was not called on start phase without options.setStart',
  )

  t.deepEqual(
    interaction.prevEvent.page,
    { x: 100, y: 200 },
    'start event coords are not modified without options.setStart')

  t.deepEqual(
    interaction.coords.start.page,
    { x: 100, y: 200 },
    'interaction.coords.start are not modified without options.setStart')

  extend(coords.page, moveCoords)
  interaction.pointerMove(event, event, element)

  t.deepEqual(
    interaction.prevEvent.page,
    { x: 200, y: 200 },
    'move event coords are modified by all modifiers')

  interaction.pointerMove(event, event, element)

  t.doesNotThrow(() => {
    interaction._scopeFire('interactions:action-resume', {
      interaction,
      phase: 'resume',
      iEvent: {} as any,
      event,
    })
  }, 'action-resume doesn\'t throw errors')

  interaction.stop()

  interaction.pointerUp(event, event, element, element)
  t.deepEqual(
    interaction.coords.cur.page,
    moveCoords,
    'interaction coords after stopping are as expected')

  t.end()
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
