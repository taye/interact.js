import test from '@interactjs/_dev/test/test'
import drag from '@interactjs/actions/drag/plugin'
import * as helpers from '@interactjs/core/tests/_helpers'
import extend from '@interactjs/utils/extend'

import modifiersBase from '../base'
import snap from '../snap/pointer'

test('modifiers/snap', t => {
  const rect = helpers.ltrbwh(0, 0, 100, 100, 100, 100)
  const {
    interaction,
    interactable,
    coords,
    down,
    move,
    start,
    stop,
  } = helpers.testEnv({
    plugins: [modifiersBase, drag],
    rect,
  })

  coords.client = coords.page

  const origin = { x: 120, y: 120 }
  let funcArgs = null
  const target0 = Object.freeze({ x:  50, y:  100 })
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

  let lastEventModifiers: any[] = null
  interactable.draggable({
    origin,
    modifiers: [snap(options)],
  }).on('dragmove dragstart dragend', e => { lastEventModifiers = e.modifiers })

  down()
  start({ name: 'drag' })
  extend(coords.page, { x: 50, y: 50 })
  move()

  t.deepEqual(
    Object.keys(lastEventModifiers[0]).sort(),
    ['delta', 'distance', 'inRange', 'range', 'target'],
    'event.modifiers entry has expected props',
  )

  t.deepEqual(
    helpers.getProps(lastEventModifiers[0].target, ['x', 'y']),
    { x: target0.x + origin.x, y: target0.y + origin.y },
    'snaps to target and adds origin which will be subtracted by InteractEvent',
  )

  options.targets = [targetFunc]
  down()
  start({ name: 'drag' })
  move(true)
  stop()

  t.deepEqual(
    funcArgs,
    {
      x: coords.page.x - origin.x,
      y: coords.page.y - origin.y,
      offset: {
        x: origin.x,
        y: origin.y,
        relativePoint,
        index: 0,
      },
      index: 0,
      unexpected: [],
    },
    'x, y, interaction, offset, index are passed to target function; origin subtracted from x, y',
  )

  options.offset = { x: 300, y: 300 }
  options.offsetWithOrigin = false

  down()
  start({ name: 'drag' })
  move(true)

  const { startOffset } = interaction.modification
  const relativeOffset = {
    x: options.offset.x + startOffset.left,
    y: options.offset.y + startOffset.top,
  }

  t.deepEqual(
    helpers.getProps(lastEventModifiers[0].target, ['source', 'range', 'offset']),
    { source: targetFunc, range: Infinity, offset: { ...relativeOffset, index: 0, relativePoint } },
    'event.modifiers entry has source element of options.targets array, range, and offset',
  )

  t.deepEqual(
    helpers.getProps(lastEventModifiers[0].target, ['x', 'y']),
    {
      x: target0.x + relativeOffset.x,
      y: target0.y + relativeOffset.y,
    },
    'origin not added to target when !options.offsetWithOrigin',
  )

  t.deepEqual(
    { x: funcArgs.x, y: funcArgs.y },
    {
      x: coords.page.x - origin.x - relativeOffset.x,
      y: coords.page.y - origin.y - relativeOffset.y,
    },
    'origin still subtracted from function target x, y args when !options.offsetWithOrigin',
  )

  t.end()
})
