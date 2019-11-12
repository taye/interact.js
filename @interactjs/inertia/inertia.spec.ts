import test from '@interactjs/_dev/test/test'
import drag from '../actions/drag'
import { EventPhase } from '../core/InteractEvent'
import * as helpers from '../core/tests/_helpers'
import inertia from './index'

test('inertia', t => {
  const {
    scope,
    interaction,
    target,
    interactable,
    coords,
    event,
  } = helpers.testEnv({ plugins: [inertia, drag] })
  const element = target as HTMLElement
  const modifierChange = 5
  const testModifier = {
    options: { endOnly: false },
    methods: {
      set ({ coords: modifierCoords, phase }) {
        modifierCoords.x = modifierChange
        modifierCoords.y = modifierChange
        modifierCallPhases.push(phase)
      },
    },
  }

  let fired = []
  let modifierCallPhases = []

  coords.client = coords.page
  scope.now = () => coords.timeStamp
  interactable.draggable({ inertia: true }).on('dragstart dragmove dragend draginertiastart', e => fired.push(e))

  // test inertia without modifiers or throw
  downStartMoveUp({ x: 100, y: 0, dt: 1000 })
  t.notOk(interaction.inertia.active, '{ modifiers: [] } && !thrown: inertia is not activated')

  // test inertia without modifiers and with throw
  downStartMoveUp({ x: 100, y: 0, dt: 10 })
  t.ok(interaction.inertia.active, 'thrown: inertia is activated')

  interactable.draggable({ modifiers: [testModifier as any] })

  // test inertia with { endOnly: false } modifier and with throw
  downStartMoveUp({ x: 100, y: 0, dt: 10 })
  t.deepEqual(modifierCallPhases, [EventPhase.Move], '{ endOnly: false } && thrown: modifier is not called from pointerUp (requireEndOnly)')
  t.deepEqual(
    fired.map(({ page, type }) => ({ ...page, type })),
    [
      { x: 0, y: 0, type: 'dragstart' },
      { x: modifierChange, y: modifierChange, type: 'dragmove' },
      { x: modifierChange, y: modifierChange, type: 'draginertiastart' },
    ],
    '{ endOnly: false } && thrown: move, inertiastart, and end InteractEvents are modified'
  )

  // test inertia with { endOnly: true } modifier and with throw
  testModifier.options.endOnly = true
  downStartMoveUp({ x: 100, y: 0, dt: 10 })
  t.deepEqual(modifierCallPhases, [EventPhase.InertiaStart], '{ endOnly: true } && thrown: modifier is called from pointerUp')
  const modified = helpers.getProps(interaction.inertia, ['modifiedXe', 'modifiedYe'])
  t.deepEqual(
    modified,
    {
      // modified target minus move coords
      modifiedXe: modifierChange - 100,
      modifiedYe: modifierChange - 0,
    },
    '{ endOnly: true } && thrown: inertia target coords are correct')

  // test smoothEnd with { endOnly: false } modifier
  testModifier.options.endOnly = false
  downStartMoveUp({ x: 1, y: 0, dt: 1000 })
  t.notOk(interaction.inertia.active, '{ endOnly: false } && !thrown: inertia smoothEnd is not activated')
  t.deepEqual(modifierCallPhases, [EventPhase.Move, EventPhase.InertiaStart], '{ endOnly: false } && !thrown: modifier is called from pointerUp')

  // test smoothEnd with { endOnly: true } modifier
  testModifier.options.endOnly = true
  downStartMoveUp({ x: 1, y: 0, dt: 1000 })
  t.ok(interaction.inertia.active, '{ endOnly: true } && !thrown: inertia smoothEnd is activated')
  t.deepEqual(modifierCallPhases, [EventPhase.InertiaStart], '{ endOnly: true } && !thrown: modifier is called from pointerUp')

  interaction.stop()
  t.end()

  function downStartMoveUp ({ x, y, dt }) {
    fired = []
    modifierCallPhases = []
    coords.timeStamp = 0
    interaction.stop()

    Object.assign(coords.page, { x: 0, y: 0 })
    interaction.pointerDown(event, event, element)

    interaction.start({ name: 'drag' }, interactable, element)

    Object.assign(coords.page, { x, y })
    coords.timeStamp = dt
    interaction.pointerMove(event, event, element)
    interaction.pointerUp(event, event, element, element)
  }
})
