import test from '@interactjs/_dev/test/test'
import drag from '@interactjs/actions/drag/plugin'
import * as helpers from '@interactjs/core/tests/_helpers'
import * as Interact from '@interactjs/types/index'
import extend from '@interactjs/utils/extend'

import inertia from './plugin'

test('inertia', t => {
  const {
    scope,
    interaction,
    down,
    start,
    move,
    up,
    interactable,
    coords,
  } = helpers.testEnv({ plugins: [inertia, drag], rect: { left: 0, top: 0, bottom: 100, right: 100 } })

  const state = interaction.inertia
  const modifierChange = 5
  const changeModifier = {
    options: { endOnly: false },
    methods: {
      set ({ coords: modifierCoords, phase }: any) {
        modifierCoords.x = modifierChange
        modifierCoords.y = modifierChange
        modifierCallPhases.push(phase)
      },
    },
  }

  let fired: Array<Interact.InteractEvent<'drag'>> = []
  let modifierCallPhases: Interact.EventPhase[] = []

  coords.client = coords.page
  scope.now = () => coords.timeStamp
  interactable
    .draggable({ inertia: true })
    .on(Object.keys(scope.actions.phases).map(p => `drag${p}`), e => fired.push(e))

  // test inertia without modifiers or throw
  downStartMoveUp({ x: 100, y: 0, dt: 1000 })
  t.notOk(state.active, '{ modifiers: [] } && !thrown: inertia is not activated')

  // test inertia without modifiers and with throw
  downStartMoveUp({ x: 100, y: 0, dt: 10 })
  t.ok(state.active, 'thrown: inertia is activated')

  interactable.draggable({ modifiers: [changeModifier as any] })

  // test inertia with { endOnly: false } modifier and with throw
  downStartMoveUp({ x: 100, y: 0, dt: 10 })
  t.deepEqual(modifierCallPhases, ['move', 'inertiastart', 'inertiastart'], '{ endOnly: false } && thrown: modifier is called from pointerUp inertia calc and phase')
  t.deepEqual(
    fired.map(({ page, type }) => ({ ...page, type })),
    [
      { x: 0, y: 0, type: 'dragstart' },
      { x: modifierChange, y: modifierChange, type: 'dragmove' },
      { x: modifierChange, y: modifierChange, type: 'draginertiastart' },
    ],
    '{ endOnly: false } && thrown: move, inertiastart, and end InteractEvents are modified',
  )

  // test inertia with { endOnly: true } modifier and with throw
  changeModifier.options.endOnly = true
  downStartMoveUp({ x: 100, y: 0, dt: 10 })
  t.deepEqual(modifierCallPhases, ['inertiastart'], '{ endOnly: true } && thrown: modifier is called from pointerUp inertia calc')
  t.deepEqual(
    state.modifiedOffset,
    {
      // modified target minus move coords
      x: modifierChange - 100,
      y: modifierChange - 0,
    },
    '{ endOnly: true } && thrown: inertia target coords are correct',
  )

  // test smoothEnd with { endOnly: false } modifier
  changeModifier.options.endOnly = false
  downStartMoveUp({ x: 1, y: 0, dt: 1000 })
  t.notOk(state.active, '{ endOnly: false } && !thrown: inertia smoothEnd is not activated')
  t.deepEqual(modifierCallPhases, ['move', 'inertiastart'], '{ endOnly: false } && !thrown: modifier is called from pointerUp')

  // test smoothEnd with { endOnly: true } modifier
  changeModifier.options.endOnly = true
  downStartMoveUp({ x: 1, y: 0, dt: 1000 })
  t.ok(state.active, '{ endOnly: true } && !thrown: inertia smoothEnd is activated')
  t.deepEqual(modifierCallPhases, ['inertiastart'], '{ endOnly: true } && !thrown: modifier is called from pointerUp smooth end check')

  interactable.draggable({
    modifiers: [{
      options: { endOnly: true },
      methods: {
        set ({ coords: modifiedCoords, phase }) {
          extend(modifiedCoords, { x: 300, y: 400 })
          modifierCallPhases.push(phase)
        },
      },
      enable: null,
      disable: null,
    }],
  })

  downStartMoveUp({ x: 50, y: 70, dt: 1000 })
  coords.timeStamp = 100
  t.deepEqual(
    state.targetOffset,
    { x: 250, y: 330 },
  )

  extend(coords.page, { x: 50, y: 100 })
  down()
  t.ok(interaction._interacting && !state.active, 'inertia is stopped on resume')
  t.deepEqual(
    { coords: interaction.coords.cur.page, rect: interaction.rect },
    { coords: coords.page, rect: { left: 50, top: 70, right: 150, bottom: 170, width: 100, height: 100 } },
    'interaction coords are updated to down coords on resume',
  )
  t.deepEqual(
    lastEvent().page,
    coords.page,
    'action resume event coords are set correctly',
  )

  move()
  t.deepEqual(
    { coords: interaction.coords.cur.page, rect: interaction.rect },
    { coords: coords.page, rect: { left: 50, top: 70, right: 150, bottom: 170, width: 100, height: 100 } },
    'interaction coords are correct on duplicate move after resume',
  )
  t.deepEqual(
    lastEvent().page,
    coords.page,
    'action move event coords on duplicate move after resume is correct',
  )

  extend(coords.page, { x: 200, y: 250 })
  move()
  up()
  t.notDeepEqual(
    state.targetOffset,
    coords.page,
    'second release inertia target is not the pointer event coords',
  )
  t.notDeepEqual(
    state.targetOffset,
    { x: 300, y: 400 },
    'second release inertia target is not the modified target',
  )
  t.deepEqual(
    helpers.getProps(lastEvent(), ['type', 'page', 'rect'] as const),
    { type: 'draginertiastart', page: coords.page, rect: { left: 200, top: 220, right: 300, bottom: 320, width: 100, height: 100 } },
    'inertiastart is fired at non preEnd modified coords',
  )

  down()
  extend(coords.page, { x: 150, y: 400 })
  move()
  t.deepEqual(
    { coords: interaction.coords.cur.page, rect: interaction.rect },
    { coords: coords.page, rect: { left: 150, top: 370, right: 250, bottom: 470, width: 100, height: 100 } },
    'interaction coords after second resume are correct',
  )
  t.deepEqual(
    helpers.getProps(lastEvent(), ['type', 'page', 'rect'] as const),
    { type: 'dragmove', page: coords.page, rect: { left: 150, top: 370, right: 250, bottom: 470, width: 100, height: 100 } },
    'action move event after second resume is fired at non preEnd modified coords',
  )

  interaction.stop()
  t.end()

  function downStartMoveUp ({ x, y, dt }: any) {
    fired = []
    modifierCallPhases = []
    coords.timeStamp = 0
    interaction.stop()

    Object.assign(coords.page, { x: 0, y: 0 })
    down()

    start({ name: 'drag' })

    Object.assign(coords.page, { x, y })
    coords.timeStamp = dt
    move()
    up()
  }

  function lastEvent () {
    return fired[fired.length - 1]
  }
})
