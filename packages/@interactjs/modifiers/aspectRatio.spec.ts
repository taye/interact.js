import resize from '@interactjs/actions/resize/plugin'
import * as helpers from '@interactjs/core/tests/_helpers'
import type { FullRect, EdgeOptions } from '@interactjs/types/index'

import type { AspectRatioOptions } from './aspectRatio'
import aspectRatio from './aspectRatio'
import modifiersBase from './base'
import restrictSize from './restrict/size'

const { ltrbwh } = helpers

test('modifiers/aspectRatio', () => {
  const rect = Object.freeze({ left: 0, top: 0, right: 10, bottom: 20, width: 10, height: 20 })
  const { interactable, interaction, event, coords, target } = helpers.testEnv({
    plugins: [modifiersBase, resize],
    rect,
  })

  coords.client = coords.page

  const options: AspectRatioOptions = {}
  let lastRect: FullRect = null

  interactable.resizable({
    edges: { left: true, top: true, right: true, bottom: true },
    modifiers: [aspectRatio(options)],
    listeners: {
      move (e) {
        lastRect = e.rect
      },
    },
  })

  options.equalDelta = true
  downStartMoveUp({ x: 2, y: 4.33, edges: { left: true, top: true } })
  // `equalDelta: true, 1 { left: true, top: true }
  expect(lastRect).toEqual(ltrbwh(2, 2, 10, 20, 8, 18))

  downStartMoveUp({ x: 30, y: 2, edges: { bottom: true } })
  // equalDelta: true, 2, edges: { bottom: true }
  expect(lastRect).toEqual(ltrbwh(0, 0, 12, 22, 12, 22))

  options.equalDelta = false
  options.ratio = 2
  downStartMoveUp({ x: -5, y: 2, edges: { left: true } })
  // equalDelta: false, ratio: 2, edges: { left: true }
  expect(lastRect).toEqual(ltrbwh(-5, 12.5, 10, 20, 15, 7.5))

  // combine with restrictSize
  options.modifiers = [
    restrictSize({
      max: { width: 20, height: 20 },
    }),
  ]
  options.equalDelta = false
  options.ratio = 2
  downStartMoveUp({ x: 20, y: 0, edges: { right: true } })
  // restrictSize with critical prmary edge
  expect(lastRect).toEqual(ltrbwh(0, 0, 20, 10, 20, 10))

  downStartMoveUp({ x: 20, y: 20, edges: { bottom: true } })
  // restrictSize with critical secondary edge
  expect(lastRect).toEqual(ltrbwh(0, 0, 20, 10, 20, 10))

  function downStartMoveUp ({ x, y, edges }: { x: number, y: number, edges: EdgeOptions }) {
    coords.timeStamp = 0
    interaction.stop()
    lastRect = null

    Object.assign(coords.page, { x: 0, y: 0 })
    interaction.pointerDown(event, event, target)

    interaction.start({ name: 'resize', edges }, interactable, target)

    Object.assign(coords.page, { x, y })
    interaction.pointerMove(event, event, target)
    interaction.pointerMove(event, event, target)
    interaction.pointerUp(event, event, target, target)
  }
})
