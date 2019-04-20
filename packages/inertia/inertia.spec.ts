import test from '@interactjs/_dev/test/test'
import drag from '@interactjs/actions/drag'
import * as helpers from '@interactjs/core/tests/_helpers'
import inertia from './'

test('inertia', (t) => {
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
    options: { endOnly: true },
    methods: { set ({ coords: modifierCoords }) {
      modifierCoords.x += modifierChange
      modifierCoords.y += modifierChange
      modifierCallCount++
    } },
  }

  let modifierCallCount = 0

  coords.client = coords.page
  scope.now = () => coords.timeStamp
  interactable.draggable({ inertia: true })

  // test inertia without modifiers or throw
  downStartMoveUp({ x: 100, y: 0, dt: 1000 })
  t.notOk(interaction.inertia.active, '{ modifiers: [] } && !thrown: inertia is not activated')

  // test inertia without modifiers and with throw
  downStartMoveUp({ x: 100, y: 0, dt: 10 })
  t.ok(interaction.inertia.active, 'thrown: inertia is activated')

  interactable.draggable({ modifiers: [testModifier as any] })

  // test inertia with { endOnly: true } modifier and with throw
  downStartMoveUp({ x: 100, y: 0, dt: 10 })
  t.equal(modifierCallCount, 1, '{ endOnly: true } && thrown: modifier is not called from pointerUp')
  t.deepEqual(
    helpers.getProps(interaction.inertia, ['modifiedXe', 'modifiedYe']),
    {
      modifiedXe: interaction.inertia.xe + modifierChange,
      modifiedYe: interaction.inertia.ye + modifierChange,
    },
    '{ endOnly: true } && thrown: inertia target coords are correct')

  // test smoothEnd with { endOnly: false } modifier
  testModifier.options.endOnly = false
  downStartMoveUp({ x: 1, y: 0, dt: 1000 })
  t.notOk(interaction.inertia.active, '{ endOnly: false } && !thrown: inertia smoothEnd is not activated')
  t.equal(modifierCallCount, 2, '{ endOnly: false } && !thrown: modifier is called from pointerUp')

  // test smoothEnd with { endOnly: true } modifier
  testModifier.options.endOnly = true
  downStartMoveUp({ x: 1, y: 0, dt: 1000 })
  t.ok(interaction.inertia.active, '{ endOnly: true } && !thrown: inertia smoothEnd is activated')
  t.equal(modifierCallCount, 1, '{ endOnly: true } && !thrown: modifier is not called from pointerUp')

  interaction.stop()
  t.end()

  function downStartMoveUp ({ x, y, dt }) {
    modifierCallCount = 0
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
