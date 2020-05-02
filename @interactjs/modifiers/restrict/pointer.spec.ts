import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'

import { restrict } from '../restrict/pointer'

test('restrict larger than restriction', t => {
  const edges = { left: 0, top: 0, right: 200, bottom: 200 }
  const rect = { ...edges, width: 200, height: 200 }
  const {
    interaction,
  } = helpers.testEnv({ rect })

  const restriction = { left: 100, top: 50, right: 150, bottom: 150 }
  const options = {
    ...restrict.defaults,
    restriction: null as any,
    elementRect: { left: 0, top: 0, right: 1, bottom: 1 },
  }
  const state = { options, offset: null as any }
  const arg: any = {
    interaction,
    state,
    rect,
    startOffset: rect,
    coords: { x: 0, y: 0 },
    pageCoords: { x: 0, y: 0 },
  }

  options.restriction = () => null as any
  t.doesNotThrow(() => {
    restrict.start(arg as any)
    restrict.set(arg as any)
  }, 'no errors with null-resolving restriction')

  options.restriction = restriction
  restrict.start(arg as any)

  arg.coords = { x: 0, y: 0 }
  restrict.set(arg)
  t.deepEqual(
    arg.coords,
    { x: 0, y: 0 },
    'allows top and left edge values to be lower than the restriction',
  )

  arg.coords = { x: restriction.left + 10, y: restriction.top + 10 }
  restrict.set(arg)
  t.deepEqual(
    arg.coords,
    { x: restriction.left - rect.left, y: restriction.top - rect.top },
    'keeps the top left edge values lower than the restriction',
  )

  arg.coords = { x: restriction.right - rect.right - 10, y: restriction.bottom - rect.right - 10 }
  restrict.set(arg)
  t.deepEqual(
    arg.coords,
    { x: restriction.right - rect.right, y: restriction.bottom - rect.right },
    'keeps the bottom right edge values higher than the restriction',
  )

  t.end()
})
