import test from '@interactjs/_dev/test/test'
import drag from '@interactjs/actions/drag'
import { autoStart } from '@interactjs/auto-start'
import interactablePreventDefault from './interactablePreventDefault'
import * as helpers from './tests/_helpers'

test('interactablePreventDefault', (t) => {
  const {
    scope,
    interactable,
  } = helpers.testEnv({
    plugins: [interactablePreventDefault, autoStart, drag],
  })

  const {
    MouseEvent,
    Event,
  } = scope.window as any

  interactable.draggable({})

  const mouseEvent: MouseEvent = new MouseEvent('mousedown', { bubbles: true })
  const nativeDragStart: Event = new Event('dragstart', { bubbles: true })
  let nativeDragStartPrevented = false

  nativeDragStart.preventDefault = () => {
    nativeDragStartPrevented = true
  }

  scope.document.body.dispatchEvent(mouseEvent)
  scope.document.body.dispatchEvent(nativeDragStart)

  t.ok(nativeDragStartPrevented, 'native dragstart is prevented on interactable ')

  t.end()
})
