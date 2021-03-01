import drag from '@interactjs/actions/drag/plugin'
import autoStart from '@interactjs/auto-start/base'

import interactablePreventDefault from './interactablePreventDefault'
import * as helpers from './tests/_helpers'

test('core/interactablePreventDefault', () => {
  const { scope, interactable } = helpers.testEnv({
    plugins: [interactablePreventDefault, autoStart, drag],
  })

  const { MouseEvent, Event } = scope.window as any

  interactable.draggable({})

  const mouseEvent: MouseEvent = new MouseEvent('mousedown', { bubbles: true })
  const nativeDragStart: Event = new Event('dragstart', { bubbles: true })

  nativeDragStart.preventDefault = jest.fn()

  scope.document.body.dispatchEvent(mouseEvent)
  scope.document.body.dispatchEvent(nativeDragStart)

  // native dragstart is prevented on interactable
  expect(nativeDragStart.preventDefault).toHaveBeenCalledTimes(1)
})
