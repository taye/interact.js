import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'
import * as utils from '@interactjs/utils'
import modifiersBase from './base'

test('modifiers/base', (t) => {
  const {
    scope,
    target,
    interaction,
    interactable,
  } = helpers.testEnv({ plugins: [modifiersBase] })

  scope.actions.eventTypes.push('TESTstart', 'TESTmove', 'TESTend')

  t.ok(utils.is.object(interaction.modifiers), 'modifiers prop is added new Interaction')

  const element = target as Element
  const startEvent = {
    pageX: 100,
    pageY: 200,
    clientX: 100,
    clientY: 200,
    target: element,
  } as any
  const moveEvent = {
    pageX: 400,
    pageY: 500,
    clientX: 400,
    clientY: 500,
    target: element,
  } as any
  const options: any = { target: { x: 100, y: 100 }, setStart: true }
  let firedEvents = []

  interactable.rectChecker(() => ({ top: 0, left: 0, bottom: 50, right: 50 }))
  interactable.on('TESTstart TESTmove TESTend', (event) => firedEvents.push(event))
  interaction.pointerDown(startEvent, startEvent, element)

  interactable.options.TEST = {
    enabled: true,
    modifiers: [
      {
        options,
        methods: targetModifier,
      },
    ],
  }

  interaction.start({ name: 'TEST' }, interactable, element)

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
    { x: 100, y: 200 },
    'interaction.coords.start are restored after action start phase')

  t.deepEqual(
    interaction.coords.cur.page,
    { x: 100, y: 200 },
    'interaction.coords.cur are restored after action start phase')

  interaction.pointerMove(moveEvent, moveEvent, element)

  t.deepEqual(
    interaction.coords.cur.page,
    { x: moveEvent.pageX, y: moveEvent.pageY },
    'interaction.coords.cur are restored after action move phase')

  t.deepEqual(
    interaction.coords.start.page,
    { x: startEvent.pageX, y: startEvent.pageY },
    'interaction.coords.start are restored after action move phase')

  t.deepEqual(
    { x: interaction.prevEvent.x0, y: interaction.prevEvent.y0 },
    { x: 100, y: 100 },
    'move event start coords are modified')

  firedEvents = []
  const similarMoveEvent = { ...moveEvent, pageX: moveEvent.pageX + 0.5 }
  interaction.pointerMove(similarMoveEvent, similarMoveEvent, element)
  t.equal(firedEvents.length, 0, 'duplicate result coords are ignored')

  interaction.stop()

  t.ok(
    options.stopped,
    'modifier methods.stop() was called',
  )

  // don't set start
  options.setStart = null
  // add second modifier
  interactable.options.TEST.modifiers.push({
    options,
    methods: doubleModifier,
  })

  interaction.pointerDown(startEvent, startEvent, element)
  interaction.start({ name: 'TEST' }, interactable, element)

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

  interaction.pointerMove(moveEvent, moveEvent, element)

  t.deepEqual(
    interaction.prevEvent.page,
    { x: 200, y: 200 },
    'move event coords are modified by all modifiers')

  // modifier options.type
  scope.modifiers.target = modifiersBase.makeModifier(targetModifier)
  options.type = 'target'
  options.started = false
  interactable.options.TEST = {
    enabled: true,
    modifiers: [
      options,
    ],
  }
  interaction.stop()
  interaction.start({ name: 'TEST' }, interactable, element)

  t.ok(options.started, 'gets `scpe.modifiers[options.type]`')

  interaction.pointerMove(moveEvent, moveEvent, element)

  t.doesNotThrow(() => {
    interaction._signals.fire('action-resume', {
      interaction,
    })
  })

  interaction.stop()

  t.end()
})

const targetModifier = {
  start ({ state }) {
    state.options.started = true
  },
  set ({ state, coords }) {
    const { target } = state.options

    coords.x = target.x
    coords.y = target.y

    state.options.setted = true
  },
  stop ({ state }) {
    state.options.stopped = true
    delete state.options.started
    delete state.options.setted
  },
}

const doubleModifier = {
  start () {},
  set ({ coords }) {
    coords.x *= 2
    coords.y *= 2
  },
}
