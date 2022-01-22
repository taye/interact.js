import drag from '@interactjs/actions/drag/plugin'
import * as helpers from '@interactjs/core/tests/_helpers'

import autoStart from './base'

test('autoStart', () => {
  window.PointerEvent = null

  document.body.innerHTML = `
    <style>
    #target { position: absolute; top: 100px; left: 200px; bottom: 300px; right: 400px }
    </style>
    <div id=target></div>
  `

  Object.assign(document.body.style)

  const {
    interaction,
    interactable,
    event,
    coords,
    target: element,
    down,
  } = helpers.testEnv({
    plugins: [autoStart, drag],
    target: document.getElementById('target'),
  })

  interactable.draggable(true)
  interaction.pointerType = coords.pointerType = 'mouse'
  coords.buttons = 1

  down()

  // prepares action
  expect(interaction.prepared).toEqual({ name: 'drag', axis: 'xy', edges: undefined })

  // set interaction.rect
  expect(interaction.rect).toEqual(
    helpers.getProps(element.getBoundingClientRect(), ['top', 'left', 'bottom', 'right', 'width', 'height']),
  )

  // sets drag cursor
  expect(element.style.cursor).toBe('move')

  const cursorChecker = jest.fn(() => 'pointer')

  interactable.draggable({
    cursorChecker,
  })

  interaction.pointerDown(event, event, element)

  // calls cursorChecker with expected args
  expect(cursorChecker).toHaveBeenCalledWith(
    { name: 'drag', axis: 'xy', edges: undefined },
    interactable,
    element,
    false,
  )

  interaction.pointerDown(event, event, element)
  // uses cursorChecker value
  expect(element.style.cursor).toBe('pointer')

  coords.page.x += 10
  coords.client.x += 10
  interaction.pointerMove(event, event, element)
  // down -> move starts action
  expect(interaction._interacting).toBe(true)

  // calls cursorChecker with true for interacting arg
  expect(cursorChecker).toHaveBeenCalledWith(
    { name: 'drag', axis: 'xy', edges: undefined },
    interactable,
    element,
    true,
  )
})
