import test from '@interactjs/_dev/test/test'
import drag from '@interactjs/actions/drag'
import * as helpers from '@interactjs/core/tests/_helpers'
import extend from '@interactjs/utils/extend'
import inertia from './index'

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

  let fired: any[] = []
  let modifierCallPhases: Interact.EventPhase[] = []

  coords.client = coords.page
  scope.now = () => coords.timeStamp
  interactable.draggable({ inertia: true }).on('dragstart dragmove dragend draginertiastart', e => fired.push(e))

  // test inertia without modifiers or throw
  downStartMoveUp({ x: 100, y: 0, dt: 1000 })
  t.notOk(state.active, '{ modifiers: [] } && !thrown: inertia is not activated')

  // test inertia without modifiers and with throw
  downStartMoveUp({ x: 100, y: 0, dt: 10 })
  t.ok(state.active, 'thrown: inertia is activated')

  interactable.draggable({ modifiers: [changeModifier as any] })

  // test inertia with { endOnly: false } modifier and with throw
  downStartMoveUp({ x: 100, y: 0, dt: 10 })
  t.deepEqual(modifierCallPhases, ['move', 'inertiastart'], '{ endOnly: false } && thrown: modifier is called from pointerUp')
  t.deepEqual(
    fired.map(({ page, type }) => ({ ...page, type })),
    [
      { x: 0, y: 0, type: 'dragstart' },
      { x: modifierChange, y: modifierChange, type: 'dragmove' },
    ],
    '{ endOnly: false } && thrown: move, inertiastart, and end InteractEvents are modified',
  )

  // test inertia with { endOnly: true } modifier and with throw
  changeModifier.options.endOnly = true
  downStartMoveUp({ x: 100, y: 0, dt: 10 })
  t.deepEqual(modifierCallPhases, ['inertiastart'], '{ endOnly: true } && thrown: modifier is called from pointerUp')
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
  t.deepEqual(modifierCallPhases, ['inertiastart'], '{ endOnly: true } && !thrown: modifier is called from pointerUp')

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
})
