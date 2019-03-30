import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'
import snapEdges from '../snap/edges'

test('modifiers/snap/edges', (t) => {
  const rect = { top: 0, left: 0, bottom: 100, right: 100 }
  const {
    interaction,
    interactable,
  } = helpers.testEnv({ rect })
  interaction.interactable = interactable
  interaction._interacting = true

  const target0 = Object.freeze({
    left: 50,
    right: 150,
    top: 0,
    bottom: 100,
  })
  const options = {
    targets: [
      { ...target0 },
    ],
    range: Infinity,
  }
  const pageCoords = Object.freeze({ x: 0, y: 0 })
  const arg = {
    interaction,
    interactable: interaction.interactable,
    state: null,
    pageCoords,
    coords: { ...pageCoords },
    offset: [{ x: 0, y: 0 }],
  }

  // resize from top left
  interaction.prepared.edges = { top: true, left: true }

  arg.state = { options }
  snapEdges.start(arg)
  snapEdges.set(arg)

  t.deepEqual(
    arg.coords,
    { x: target0.left, y: target0.top },
    'modified coords are correct')

  // resize from bottom right
  interaction.prepared.edges = { bottom: true, right: true }

  arg.state = { options }
  snapEdges.start(arg)
  snapEdges.set(arg)

  t.deepEqual(
    arg.coords,
    { x: target0.right, y: target0.bottom },
    'modified coord are correct')

  t.end()
})
