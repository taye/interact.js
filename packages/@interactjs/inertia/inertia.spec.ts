import drag from '@interactjs/actions/drag/plugin'
import type { EventPhase, InteractEvent } from '@interactjs/core/InteractEvent'
import * as helpers from '@interactjs/core/tests/_helpers'
import extend from '@interactjs/utils/extend'

import inertia from './plugin'

test('inertia', () => {
  const { scope, interaction, down, start, move, up, interactable, coords } = helpers.testEnv({
    plugins: [inertia, drag],
    rect: { left: 0, top: 0, bottom: 100, right: 100 },
  })

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

  let fired: Array<InteractEvent<'drag'>> = []
  let modifierCallPhases: EventPhase[] = []

  coords.client = coords.page
  scope.now = () => coords.timeStamp
  interactable.draggable({ inertia: true }).on(
    Object.keys(scope.actions.phases).map((p) => `drag${p}`),
    (e) => fired.push(e),
  )

  // test inertia without modifiers or throw
  downStartMoveUp({ x: 100, y: 0, dt: 1000 })
  // { modifiers: [] } && !thrown: inertia is not activated
  expect(state.active).toBe(false)

  // test inertia without modifiers and with throw
  downStartMoveUp({ x: 100, y: 0, dt: 10 })
  // thrown: inertia is activated
  expect(state.active && state.timeout).toBeTruthy()

  interactable.draggable({ modifiers: [changeModifier as any] })

  // test inertia with { endOnly: false } modifier and with throw
  downStartMoveUp({ x: 100, y: 0, dt: 10 })
  // { endOnly: false } && thrown: modifier is called from pointerUp inertia calc and phase
  expect(modifierCallPhases).toEqual(['move', 'inertiastart', 'inertiastart'])
  // { endOnly: false } && thrown: move, inertiastart, and end InteractEvents are modified
  expect(fired.map(({ page, type }) => ({ ...page, type }))).toEqual([
    { x: 0, y: 0, type: 'dragstart' },
    { x: modifierChange, y: modifierChange, type: 'dragmove' },
    { x: modifierChange, y: modifierChange, type: 'draginertiastart' },
  ])

  // test inertia with { endOnly: true } modifier and with throw
  changeModifier.options.endOnly = true
  downStartMoveUp({ x: 100, y: 0, dt: 10 })
  // { endOnly: true } && thrown: modifier is called from pointerUp inertia calc
  expect(modifierCallPhases).toEqual(['inertiastart'])
  // { endOnly: true } && thrown: inertia target coords are correct
  expect(state.modifiedOffset).toEqual({
    // modified target minus move coords
    x: modifierChange - 100,
    y: modifierChange - 0,
  })

  // test smoothEnd with { endOnly: false } modifier
  changeModifier.options.endOnly = false
  downStartMoveUp({ x: 1, y: 0, dt: 1000 })
  // { endOnly: false } && !thrown: inertia smoothEnd is not activated
  expect(state.active).toBe(false)
  // { endOnly: false } && !thrown: modifier is called from pointerUp
  expect(modifierCallPhases).toEqual(['move', 'inertiastart'])

  // test smoothEnd with { endOnly: true } modifier
  changeModifier.options.endOnly = true
  downStartMoveUp({ x: 1, y: 0, dt: 1000 })
  // { endOnly: true } && !thrown: inertia smoothEnd is activated
  expect(state.active).toBe(true)
  // { endOnly: true } && !thrown: modifier is called from pointerUp smooth end check
  expect(modifierCallPhases).toEqual(['inertiastart'])

  interactable.draggable({
    modifiers: [
      {
        options: { endOnly: true },
        methods: {
          set ({ coords: modifiedCoords, phase }) {
            extend(modifiedCoords, { x: 300, y: 400 })
            modifierCallPhases.push(phase)
          },
        },
        enable: null,
        disable: null,
      },
    ],
  })

  downStartMoveUp({ x: 50, y: 70, dt: 1000 })
  coords.timeStamp = 100
  expect(state.targetOffset).toEqual({ x: 250, y: 330 })

  extend(coords.page, { x: 50, y: 100 })
  down()
  // inertia is stopped on resume
  expect(interaction._interacting && !state.active).toBe(true)
  // interaction coords are updated to down coords on resume
  expect({ coords: interaction.coords.cur.page, rect: interaction.rect }).toEqual({
    coords: coords.page,
    rect: { left: 50, top: 70, right: 150, bottom: 170, width: 100, height: 100 },
  })
  // action resume event coords are set correctly
  expect(lastEvent().page).toEqual(coords.page)

  move()
  // interaction coords are correct on duplicate move after resume
  expect({ coords: interaction.coords.cur.page, rect: interaction.rect }).toEqual({
    coords: coords.page,
    rect: { left: 50, top: 70, right: 150, bottom: 170, width: 100, height: 100 },
  })
  // second release inertia target is not the modified target
  // second release inertia target is not the pointer event coords
  // action move event coords on duplicate move after resume is correct
  expect(lastEvent().page).toEqual(coords.page)

  extend(coords.page, { x: 200, y: 250 })
  move()
  up()
  expect(state.targetOffset).not.toEqual(coords.page)
  expect(state.targetOffset).not.toEqual({ x: 300, y: 400 })
  // inertiastart is fired at non preEnd modified coords
  expect(helpers.getProps(lastEvent(), ['type', 'page', 'rect'] as const)).toEqual({
    type: 'draginertiastart',
    page: coords.page,
    rect: { left: 200, top: 220, right: 300, bottom: 320, width: 100, height: 100 },
  })

  down()
  extend(coords.page, { x: 150, y: 400 })
  move()
  // interaction coords after second resume are correct
  expect({ coords: interaction.coords.cur.page, rect: interaction.rect }).toEqual({
    coords: coords.page,
    rect: { left: 150, top: 370, right: 250, bottom: 470, width: 100, height: 100 },
  })
  // action move event after second resume is fired at non preEnd modified coords
  expect(helpers.getProps(lastEvent(), ['type', 'page', 'rect'] as const)).toEqual({
    type: 'dragmove',
    page: coords.page,
    rect: { left: 150, top: 370, right: 250, bottom: 470, width: 100, height: 100 },
  })

  interaction.stop()

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
