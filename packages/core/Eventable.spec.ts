import test from '@interactjs/_dev/test/test'
import Eventable from './Eventable'

test('Eventable', (t) => {
  const eventable = new Eventable()
  const type = 'TEST'

  const testEvent = {
    type,
    immediatePropagationStopped: false,
  }
  let firedEvent
  const listener = (event) => { firedEvent = event }

  eventable.on(type, listener)
  eventable.fire(testEvent)

  t.equal(firedEvent, testEvent, 'on\'d listener is called')

  firedEvent = undefined
  eventable.off(type, listener)
  eventable.fire(testEvent)

  t.equal(firedEvent, undefined, 'off\'d listener is not called')

  testEvent.immediatePropagationStopped = true
  eventable.on(type, listener)
  eventable.fire(testEvent)

  t.equal(firedEvent, undefined, 'listener is not called with immediatePropagationStopped')

  t.end()
})
