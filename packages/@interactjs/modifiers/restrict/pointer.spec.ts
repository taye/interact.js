import * as helpers from '@interactjs/core/tests/_helpers'

import { restrict } from '../restrict/pointer'

test('restrict larger than restriction', () => {
  const edges = { left: 0, top: 0, right: 200, bottom: 200 }
  const rect = { ...edges, width: 200, height: 200 }
  const { interaction } = helpers.testEnv({ rect })

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
  expect(() => {
    restrict.start(arg as any)
    restrict.set(arg as any)
  }).not.toThrow()

  options.restriction = restriction
  restrict.start(arg as any)

  arg.coords = { x: 0, y: 0 }
  restrict.set(arg)
  // allows top and left edge values to be lower than the restriction
  expect(arg.coords).toEqual({ x: 0, y: 0 })

  arg.coords = { x: restriction.left + 10, y: restriction.top + 10 }
  restrict.set(arg)
  // keeps the top left edge values lower than the restriction
  expect(arg.coords).toEqual({ x: restriction.left - rect.left, y: restriction.top - rect.top })

  arg.coords = { x: restriction.right - rect.right - 10, y: restriction.bottom - rect.right - 10 }
  restrict.set(arg)
  // keeps the bottom right edge values higher than the restriction
  expect(arg.coords).toEqual({ x: restriction.right - rect.right, y: restriction.bottom - rect.right })
})
