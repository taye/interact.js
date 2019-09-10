import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'
import resize from './resize'

test('resize', t => {
  const rect = Object.freeze({ left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 })
  const {
    scope,
    interactable,
    interaction,
    event,
    coords,
    target,
  } = helpers.testEnv({
    plugins: [resize],
    rect,
  })

  const element = target as HTMLElement

  t.ok(scope.actions.names.includes('resize' as any), '"resize" in actions.names')
  t.equal(scope.actions.methodDict.resize, 'resizable')
  t.equal(typeof scope.Interactable.prototype.resizable, 'function', 'Interactable.resizable method is added')

  interactable.resizable({
    edges: { left: true, top: true, right: true, bottom: true },
    // use margin greater than width and height
    margin: Infinity,
  })

  // resize top left
  interaction.updatePointer(event, event, element, true)

  t.deepEqual(
    resize.checker(event, event, interactable, element, interaction, rect),
    {
      name: 'resize',
      edges: { left: true, top: true, right: false, bottom: false },
    },
    'resize top left',
  )

  // resize top right
  coords.page.x = 10
  interaction.updatePointer(event, event, element, true)

  t.deepEqual(
    resize.checker(event, event, interactable, element, interaction, rect),
    {
      name: 'resize',
      edges: { left: false, top: true, right: true, bottom: false },
    },
    'resize top right',
  )

  // resize bottom right
  coords.page.y = 10
  interaction.updatePointer(event, event, element, true)

  t.deepEqual(
    resize.checker(event, event, interactable, element, interaction, rect),
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
  interaction.updatePointer(event, event, element, true)
  interaction.start({ name: 'resize', edges: { bottom: true, right: true } }, interactable, element)

  t.deepEqual(
    interaction.resizeRects,
    {
      start: rect,
      current: helpers.getProps(rect, ['top', 'left', 'bottom', 'right']),
      inverted: rect,
      previous: rect,
      delta: zeroRect,
    },
    'sets starting interaction.resizeRect props',
  )
  t.ok(hasResizeProps(resizeEvent), 'resizestart event has extra resize props')

  coords.page.x = -100
  coords.page.y = -200
  resizeEvent = null
  interaction.pointerMove(event, event, element)

  t.deepEqual(
    interaction.resizeRects,
    {
      start: rect,
      current: { left: 0, top: 0, right: -100, bottom: -200 },
      inverted: zeroRect,
      previous: rect,
      delta: { ...zeroRect, right: -rect.width, bottom: -rect.bottom, width: -rect.width, height: -rect.height },
    },
    "invert: 'none'",
  )
  t.ok(hasResizeProps(resizeEvent), 'resizemove event has extra resize props')

  interactable.options.resize.invert = 'reposition'
  interaction.move()

  t.deepEqual(
    interaction.resizeRects,
    {
      start: rect,
      current: { left: 0, top: 0, right: -100, bottom: -200 },
      inverted: { ...zeroRect, left: -100, top: -200, width: 100, height: 200 },
      previous: interaction.resizeRects.previous, // not testing previous
      delta: { ...zeroRect, left: -100, top: -200, width: 100, height: 200 },
    },
    "invert: 'reposition'",
  )

  interactable.options.resize.invert = 'none'
  interaction.move()
  interactable.options.resize.invert = 'negate'
  interaction.move()

  t.deepEqual(
    interaction.resizeRects,
    {
      start: rect,
      current: { left: 0, top: 0, right: -100, bottom: -200 },
      inverted: { ...zeroRect, right: -100, bottom: -200, width: -100, height: -200 },
      previous: interaction.resizeRects.previous, // not testing previous
      delta: { ...zeroRect, right: -100, bottom: -200, width: -100, height: -200 },
    },
    "invert: 'negate'",
  )

  resizeEvent = null
  interaction.end()
  t.ok(hasResizeProps(resizeEvent), 'resizeend event has extra resize props')

  t.end()
})

function hasResizeProps (event: Interact.ResizeEvent) {
  return !!(event.deltaRect && event.rect && event.edges)
}
