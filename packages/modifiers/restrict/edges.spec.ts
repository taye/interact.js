import test from '@interactjs/_dev/test/test'
import Interaction from '@interactjs/core/Interaction'
import { mockSignals } from '@interactjs/core/tests/_helpers'
import restrictEdges from '../restrict/edges'

test('restrictEdges', (t) => {
  const interaction = new Interaction({ signals: mockSignals() } as any)
  interaction.prepared = {} as any
  interaction.prepared.edges = { top: true, bottom: true, left: true, right: true }
  interaction.resizeRects = {} as any
  interaction.resizeRects.inverted = { x: 10, y: 20, width: 300, height: 200 } as any
  interaction._interacting = true

  const options: any = { enabled: true }
  const coords = { x: 40, y: 40 }
  const offset = { top: 0, left: 0, bottom: 0, right: 0 }
  const state = { options, offset }
  const arg = { interaction, state } as any

  arg.coords = { ...coords }

  // outer restriction
  options.outer = { top: 100, left: 100, bottom: 200, right: 200 }
  restrictEdges.set(arg)

  t.deepEqual(
    arg.coords,
    { x: coords.y + 60, y: coords.y + 60 },
    'outer restriction is applied correctly'
  )

  arg.coords = { ...coords }

  // inner restriction
  options.outer = null
  options.inner = { top: 0, left: 0, bottom: 10, right: 10 }
  restrictEdges.set(arg)

  t.deepEqual(
    arg.coords,
    { x: coords.x - 40, y: coords.y - 40 },
    'inner restriction is applied correctly'
  )

  // offset
  Object.assign(offset, {
    top: 100,
    left: 100,
    bottom: 200,
    right: 200,
  })
  arg.coords = { ...coords }

  options.outer = { top: 100, left: 100, bottom: 200, right: 200 }
  options.inner = null
  restrictEdges.set(arg)

  t.deepEqual(
    arg.coords,
    { x: coords.x + 160, y: coords.x + 160 },
    'outer restriction is applied correctly with offset'
  )

  // start
  interaction.modifiers = {} as any
  interaction.modifiers.startOffset = { top: 5, left: 10, bottom: -8, right: -16 }
  interaction.interactable = {
    getRect () {
      return { top: 500, left: 900 }
    },
  } as any

  options.offset = 'self'
  restrictEdges.start(arg)

  t.deepEqual(
    arg.state.offset,
    { top: 505, left: 910, bottom: 508, right: 916 },
    'start gets x/y from selector string'
  )

  t.end()
})
