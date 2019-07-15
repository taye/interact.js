import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'
import rectUtils from '@interactjs/utils/rect'
import base from './../base'
import restrictSize from './../restrict/size'

test('restrictSize', t => {
  const {
    interaction,
  } = helpers.testEnv()
  const edges = { left: true, top: true }
  const rect = { left: 0, top: 0, right: 200, bottom: 300 }

  interaction.prepared = { name: null }
  interaction.prepared.edges = edges
  interaction.resizeRects = {} as any
  interaction.resizeRects.inverted = rectUtils.xywhToTlbr(rect)
  interaction.modifiers = {} as any
  interaction._interacting = true

  const options = {
    min: { width:  60, height:  50 } as any,
    max: { width: 300, height: 350 } as any,
  }
  const startCoords = Object.freeze({ x: 0, y: 0 })
  const offset = { top: 0, bottom: 0, left: 0, right: 0 }
  const state = {
    options,
    offset,
    methods: restrictSize,
  }
  const arg = {
    interaction,
    states: [state],
    coords: startCoords,
    pageCoords: startCoords,
    options,
    state: null,
  }

  interaction.modifiers.startOffset = base.getRectOffset(rect, startCoords)
  base.startAll(arg)
  arg.state = state

  const move1 = Object.freeze({ x: -50, y: -40 })
  arg.coords = { ...move1 }
  restrictSize.set(arg as any)

  t.deepEqual(arg.coords, move1, 'within both min and max')

  const move2 = Object.freeze({ x: -200, y: -300 })
  arg.coords = { ...move2 }
  restrictSize.set(arg as any)

  t.deepEqual(arg.coords, { x: -100, y: -50 }, 'outside max')

  const move3 = Object.freeze({ x: 250, y: 320 })
  arg.coords = { ...move3 }
  restrictSize.set(arg as any)

  t.deepEqual(arg.coords, { x: 140, y: 250 }, 'outside min')

  // min and max function restrictions
  let minFuncArgs
  let maxFuncArgs

  options.min = (...args) => {
    minFuncArgs = args
    return null
  }
  options.max = (...args) => {
    maxFuncArgs = args
    return null
  }

  restrictSize.set(arg as any)

  t.deepEqual(
    minFuncArgs,
    [arg.coords.x, arg.coords.y, interaction],
    'correct args are passed to min function restriction',
  )

  t.deepEqual(
    maxFuncArgs,
    [arg.coords.x, arg.coords.y, interaction],
    'correct args are passed to max function restriction',
  )

  t.end()
})
