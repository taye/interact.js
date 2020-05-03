import test from '@interactjs/_dev/test/test'
import drag from '@interactjs/actions/drag/plugin'
import * as helpers from '@interactjs/core/tests/_helpers'

import autoStart from './base'

test('autoStart', t => {
  const rect = { top: 100, left: 200, bottom: 300, right: 400 }
  const {
    interaction,
    interactable,
    event,
    coords,
    target: element,
  } = helpers.testEnv({
    plugins: [autoStart, drag],
    rect,
  })

  interactable.draggable(true)
  interaction.pointerType = coords.pointerType = 'mouse'
  coords.buttons = 1

  interaction.pointerDown(event, event, element)

  t.deepEqual(
    interaction.prepared,
    { name: 'drag', axis: 'xy', edges: undefined },
    'prepares action',
  )

  t.deepEqual(
    interaction.rect,
    { ...rect, width: rect.right - rect.left, height: rect.bottom - rect.top },
    'set interaction.rect',
  )

  t.equal(element.style.cursor, 'move', 'sets drag cursor')

  let checkerArgs: any[]

  interactable.draggable({
    cursorChecker (...args) {
      checkerArgs = args

      return 'custom-cursor'
    },
  })

  interaction.pointerDown(event, event, element)

  t.deepEqual(
    checkerArgs,
    [{ name: 'drag', axis: 'xy', edges: undefined }, interactable, element, false],
    'calls cursorChecker with expected args',
  )

  interaction.pointerDown(event, event, element)
  t.equal(element.style.cursor, 'custom-cursor', 'uses cursorChecker value')

  coords.page.x += 10
  coords.client.x += 10
  interaction.pointerMove(event, event, element)
  t.ok(interaction._interacting, 'down -> move starts action')

  t.deepEqual(
    checkerArgs,
    [{ name: 'drag', axis: 'xy', edges: undefined }, interactable, element, true],
    'calls cursorChecker with true for interacting arg',
  )

  t.end()
})
