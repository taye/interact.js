import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'
import * as Interact from '@interactjs/types/index'

import resize from './plugin'

const { ltrbwh } = helpers

test('resize', t => {
  const rect = Object.freeze({ left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 })
  const {
    scope,
    interactable,
    interaction,
    coords,
    target,
    down,
    start,
    move,
  } = helpers.testEnv({
    plugins: [resize],
    rect,
  })

  const element = target as HTMLElement
  const checkArg = {
    action: null,
    interactable,
    interaction,
    element,
    rect,
    buttons: 0,
  }

  t.ok(scope.actions.map.resize, '"resize" in actions.names')
  t.equal(scope.actions.methodDict.resize, 'resizable')
  t.equal(typeof scope.Interactable.prototype.resizable, 'function', 'Interactable.resizable method is added')

  interactable.resizable({
    edges: { left: true, top: true, right: true, bottom: true },
    // use margin greater than width and height
    margin: Infinity,
  })

  // resize top left
  down()
  scope.fire('auto-start:check', checkArg)
  t.deepEqual(
    checkArg.action,
    {
      name: 'resize',
      edges: { left: true, top: true, right: false, bottom: false },
    },
    'resize top left',
  )

  // resize top right
  coords.page.x = 10
  move()

  scope.fire('auto-start:check', checkArg)
  t.deepEqual(
    checkArg.action,
    {
      name: 'resize',
      edges: { left: false, top: true, right: true, bottom: false },
    },
    'resize top right',
  )

  // resize bottom right
  coords.page.y = 10
  move()

  scope.fire('auto-start:check', checkArg)
  t.deepEqual(
    checkArg.action,
    {
      name: 'resize',
      edges: { left: false, top: false, right: true, bottom: true },
    },
    'resize bottom right',
  )

  const zeroRect = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }
  let resizeEvent: Interact.ResizeEvent = null

  interactable.on('resizestart resizemove resizeend', e => {
    resizeEvent = e
  })

  coords.page.x = rect.right
  coords.page.y = rect.bottom
  down()
  start({ name: 'resize', edges: { bottom: true, right: true } })

  t.deepEqual(
    interaction._rects,
    {
      start: rect,
      corrected: rect,
      previous: rect,
      delta: zeroRect,
    },
    'sets starting correct interaction._rects',
  )
  t.deepEqual(
    interaction.rect,
    rect,
    'sets starting correct interaction.rect',
  )
  t.ok(hasResizeProps(resizeEvent), 'resizestart event has extra resize props')

  coords.page.x = -100
  coords.page.y = -200
  resizeEvent = null
  move()

  t.deepEqual(
    interaction._rects,
    {
      start: rect,
      corrected: zeroRect,
      previous: rect,
      delta: ltrbwh(0, 0, -rect.width, -rect.bottom, -rect.width, -rect.height),
    },
    "`invert: 'none'` interaction._rects are correct",
  )
  t.deepEqual(
    interaction.rect,
    ltrbwh(0, 0, -100, -200, -100, -200),
    "`invert: 'none'` interaction.rect is correct",
  )
  t.ok(hasResizeProps(resizeEvent), 'resizemove event has extra resize props')

  interactable.options.resize.invert = 'reposition'
  interaction.move()

  t.deepEqual(
    interaction._rects,
    {
      start: rect,
      corrected: ltrbwh(-100, -200, 0, 0, 100, 200),
      previous: interaction._rects.previous, // not testing previous
      delta: ltrbwh(-100, -200, 0, 0, 100, 200),
    },
    "`invert: 'reposition'` interaction._rects",
  )

  interaction.move()
  interactable.options.resize.invert = 'negate'
  interaction.move()

  t.deepEqual(
    interaction._rects,
    {
      start: rect,
      corrected: ltrbwh(0, 0, -100, -200, -100, -200),
      previous: interaction._rects.previous, // not testing previous
      delta: ltrbwh(100, 200, -100, -200, -200, -400),
    },
    "invert: 'negate' interaction._rects",
  )

  resizeEvent = null
  interaction.end()
  t.ok(hasResizeProps(resizeEvent), 'resizeend event has extra resize props')

  t.end()
})

function hasResizeProps (event: Interact.ResizeEvent) {
  return !!(event.deltaRect && event.rect && event.edges)
}
