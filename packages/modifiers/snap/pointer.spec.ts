import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'
import snap from '../snap/pointer'

test('modifiers/snap', (t) => {
  const {
    interaction,
    interactable,
  } = helpers.testEnv()
  const origin = { x: 120, y: 120 }

  interactable.options.TEST = { origin }
  interaction.interactable = interactable
  interaction.prepared = { name: 'TEST' }
  interaction._interacting = true

  let funcArgs = null
  const target0 = Object.freeze({ x:  50, y:  100 })
  // eslint-disable-next-line no-restricted-syntax, no-shadow
  const targetFunc = (x, y, _interaction, offset, index, ...unexpected) => {
    funcArgs = { x, y, offset, index, unexpected }
    return target0
  }
  const relativePoint = { x: 0, y: 0 }
  const options = {
    offset: null,
    offsetWithOrigin: true,
    targets: [
      target0,
      targetFunc,
    ],
    range: Infinity,
    relativePoints: [relativePoint],
  }

  const state = {
    options,
    realX: 0,
    realY: 0,
  }
  const pageCoords = Object.freeze({ x: 200, y: 300 })
  const arg = {
    interaction,
    interactable,
    state,
    pageCoords,
    coords: { ...pageCoords },
    rect: { top: 0, left: 0, bottom: 100, right: 100, width: 100, height: 100 },
    startOffset: { top: 0, left: 0, bottom: 0, right: 0 },
  } as any

  snap.start(arg)
  snap.set(arg)

  t.deepEqual(
    arg.coords,
    { x: target0.x + origin.x, y: target0.y + origin.y },
    'snaps to target and adds origin which will be subtracted by InteractEvent'
  )

  arg.coords = { ...pageCoords }
  state.options.targets = [targetFunc]
  snap.start(arg)
  snap.set(arg)

  t.deepEqual(
    funcArgs,
    {
      x: pageCoords.x - origin.x,
      y: pageCoords.y - origin.y,
      offset: {
        x: origin.x,
        y: origin.y,
        relativePoint,
        index: 0,
      },
      index: 0,
      unexpected: [],
    },
    'x, y, interaction, offset, index are passed to target function; origin subtracted from x, y'
  )

  arg.coords = { ...pageCoords }
  options.offset = { x: 300, y: 300 }
  options.offsetWithOrigin = false
  snap.start(arg)
  snap.set(arg)

  t.deepEqual(
    arg.coords,
    { x: target0.x + 300, y: target0.y + 300 },
    'origin not added to target when !options.offsetWithOrigin'
  )

  t.deepEqual(
    { x: funcArgs.x, y: funcArgs.y },
    { x: pageCoords.x - origin.x - 300, y: pageCoords.y - origin.y - 300 },
    'origin still subtracted from function target x, y args when !options.offsetWithOrigin'
  )

  t.end()
})
