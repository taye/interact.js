import { Eventable } from './Eventable'

test('core/Eventable', () => {
  const eventable = new Eventable()
  const type = 'TEST'

  const testEvent = {
    type,
    immediatePropagationStopped: false,
  }
  let firedEvent: any
  const listener = (event: any) => {
    firedEvent = event
  }

  eventable.on(type, listener)
  eventable.fire(testEvent)

  // on'd listener is called
  expect(firedEvent).toBe(testEvent)

  firedEvent = undefined
  eventable.off(type, listener)
  eventable.fire(testEvent)

  // off'd listener is not called
  expect(firedEvent).toBeUndefined()

  testEvent.immediatePropagationStopped = true
  eventable.on(type, listener)
  eventable.fire(testEvent)

  // listener is not called with immediatePropagationStopped
  expect(firedEvent).toBeUndefined()
})
