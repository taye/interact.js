import test from '@interactjs/_dev/test/test'
import resize from '@interactjs/actions/resize/plugin'
import * as helpers from '@interactjs/core/tests/_helpers'
import * as Interact from '@interactjs/types/index'

import aspectRatio, { AspectRatioOptions } from './aspectRatio'
import modifiersBase from './base'
import restrictSize from './restrict/size'

const { ltrbwh } = helpers

test('modifiers/aspectRatio', t => {
  const rect = Object.freeze({ left: 0, top: 0, right: 10, bottom: 20, width: 10, height: 20 })
  const {
    interactable,
    interaction,
    event,
    coords,
    target,
  } = helpers.testEnv({
    plugins: [modifiersBase, resize],
    rect,
  })

  coords.client = coords.page

  const options: AspectRatioOptions = {}
  let lastRect: Interact.FullRect = null

  interactable.resizable({
    edges: { left: true, top: true, right: true, bottom: true },
    modifiers: [aspectRatio(options)],
    listeners: { move (e) { lastRect = e.rect } },
  })

  options.equalDelta = true
  downStartMoveUp({ x: 2, y: 4.33, edges: { left: true, top: true } })
  t.deepEqual(
    lastRect,
    ltrbwh(2, 2, 10, 20, 8, 18),
    '`equalDelta: true, 1 { left: true, top: true }',
  )

  downStartMoveUp({ x: 30, y: 2, edges: { bottom: true } })
  t.deepEqual(
    lastRect,
    ltrbwh(0, 0, 12, 22, 12, 22),
    'equalDelta: true, 2, edges: { bottom: true }',
  )

  options.equalDelta = false
  options.ratio = 2
  downStartMoveUp({ x: -5, y: 2, edges: { left: true } })
  t.deepEqual(
    lastRect,
    ltrbwh(-5, 12.5, 10, 20, 15, 7.5),
    'equalDelta: false, ratio: 2, edges: { left: true }',
  )

  // combine with restrictSize
  options.modifiers = [restrictSize({
    max: { width: 20, height: 20 },
  })]
  options.equalDelta = false
  options.ratio = 2
  downStartMoveUp({ x: 20, y: 0, edges: { right: true } })
  t.deepEqual(
    lastRect,
    ltrbwh(0, 0, 20, 10, 20, 10),
    'restrictSize with critical prmary edge',
  )

  downStartMoveUp({ x: 20, y: 20, edges: { bottom: true } })
  t.deepEqual(
    lastRect,
    ltrbwh(0, 0, 20, 10, 20, 10),
    'restrictSize with critical secondary edge',
  )
  t.end()

  function downStartMoveUp ({ x, y, edges }: { x: number, y: number, edges: Interact.EdgeOptions }) {
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
