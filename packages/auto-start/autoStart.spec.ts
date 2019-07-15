import test from '@interactjs/_dev/test/test'
import drag from '@interactjs/actions/drag'
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
    'prepares action'
  )

  t.deepEqual(
    interaction.rect,
    rect as any,
    'set interaction.rect'
  )

  t.equal(element.style.cursor, 'move', 'sets drag cursor')

  let checkerArgs

  interactable.draggable({
    cursorChecker (...args) {
      checkerArgs = args

      return 'custom-cursor'
    },
  })

  interaction.pointerDown(event, event, element)

  t.deepEqual(
    checkerArgs,
    [{ name: 'drag', axis: 'xy' }, interactable, element],
    'calls cursorChecker with expected args'
  )

  interaction.pointerDown(event, event, element)
  t.equal(element.style.cursor, 'custom-cursor', 'uses cursorChecker value')

  t.end()
})
