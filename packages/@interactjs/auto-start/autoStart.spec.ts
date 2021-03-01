import drag from '@interactjs/actions/drag/plugin'
import * as helpers from '@interactjs/core/tests/_helpers'

import autoStart from './base'

test('autoStart', () => {
  const rect = { top: 100, left: 200, bottom: 300, right: 400 }
  const { interaction, interactable, event, coords, target: element } = helpers.testEnv({
    plugins: [autoStart, drag],
    rect,
  })

  interactable.draggable(true)
  interaction.pointerType = coords.pointerType = 'mouse'
  coords.buttons = 1

  interaction.pointerDown(event, event, element)

  // prepares action
  expect(interaction.prepared).toEqual({ name: 'drag', axis: 'xy', edges: undefined })

  // set interaction.rect
  expect(interaction.rect).toEqual({ ...rect, width: rect.right - rect.left, height: rect.bottom - rect.top })

  // sets drag cursor
  expect(element.style.cursor).toBe('move')

  let checkerArgs: any[]

  interactable.draggable({
    cursorChecker (...args) {
      checkerArgs = args

      return 'custom-cursor'
    },
  })

  interaction.pointerDown(event, event, element)

  // calls cursorChecker with expected args
  expect(checkerArgs).toEqual([{ name: 'drag', axis: 'xy', edges: undefined }, interactable, element, false])

  interaction.pointerDown(event, event, element)
  // uses cursorChecker value
  expect(element.style.cursor).toBe('custom-cursor')

  coords.page.x += 10
  coords.client.x += 10
  interaction.pointerMove(event, event, element)
  // down -> move starts action
  expect(interaction._interacting).toBe(true)

  // calls cursorChecker with true for interacting arg
  expect(checkerArgs).toEqual([{ name: 'drag', axis: 'xy', edges: undefined }, interactable, element, true])
})
