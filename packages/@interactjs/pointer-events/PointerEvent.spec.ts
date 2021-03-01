import * as helpers from '@interactjs/core/tests/_helpers'
import * as pointerUtils from '@interactjs/utils/pointerUtils'

import PointerEvent from './PointerEvent'

test('PointerEvent constructor', () => {
  const type = 'TEST_EVENT'
  const pointerId = -100
  const testPointerProp = ['TEST_POINTER_PROP']
  const pointer = {
    pointerId,
    testPointerProp,
    pointerType: 'TEST_POINTER_TYPE',
  } as any
  const testEventProp = ['TEST_EVENT_PROP']
  const event = {
    testEventProp,
  } as any
  const { interaction } = helpers.testEnv()
  const eventTarget = {} as Element
  const pointerEvent = new PointerEvent(type, pointer, event, eventTarget, interaction as any, 0) as any

  // pointerEvent is extended form pointer
  expect(pointerEvent.testPointerProp).toBe(testPointerProp)
  // pointerEvent is extended form Event
  expect(pointerEvent.testEventProp).toBe(testEventProp)

  // type is set correctly
  expect(pointerEvent.type).toBe(type)
  // pointerType is set correctly
  expect(pointerEvent.pointerType).toBe(pointerUtils.getPointerType(pointer))
  // pointerId is set correctly
  expect(pointerEvent.pointerId).toBe(pointerId)
  // originalEvent is set correctly
  expect(pointerEvent.originalEvent).toBe(event)
  // interaction is set correctly
  expect(pointerEvent.interaction).toBe(interaction._proxy)
  // target is set correctly
  expect(pointerEvent.target).toBe(eventTarget)
  // currentTarget is null
  expect(pointerEvent.currentTarget).toBeNull()
})

test('PointerEvent methods', () => {
  const methodContexts = {} as any
  const event: any = ['preventDefault', 'stopPropagation', 'stopImmediatePropagation'].reduce(
    (acc, methodName) => {
      acc[methodName] = function () {
        methodContexts[methodName] = this
      }
      return acc
    },
    helpers.newPointer(),
  )
  const pointerEvent = new PointerEvent('TEST', {} as any, event, null, {} as any, 0)

  pointerEvent.preventDefault()
  // PointerEvent.preventDefault() calls preventDefault of originalEvent
  expect(methodContexts.preventDefault).toBe(event)

  // propagationStopped is false before call to stopPropagation
  expect(pointerEvent.propagationStopped).toBe(false)
  pointerEvent.stopPropagation()
  // stopPropagation sets propagationStopped to true
  expect(pointerEvent.propagationStopped).toBe(true)
  // PointerEvent.stopPropagation() does not call stopPropagation of originalEvent
  // immediatePropagationStopped is false before call to stopImmediatePropagation
  expect(methodContexts.stopPropagation).toBeUndefined()

  expect(pointerEvent.immediatePropagationStopped).toBe(false)
  pointerEvent.stopImmediatePropagation()
  // PointerEvent.stopImmediatePropagation() does not call stopImmediatePropagation of originalEvent
  expect(methodContexts.stopImmediatePropagation).toBeUndefined()
  // stopImmediatePropagation sets immediatePropagationStopped to true
  expect(pointerEvent.immediatePropagationStopped).toBe(true)

  const origin = { x: 20, y: 30 }
  pointerEvent._subtractOrigin(origin)

  // subtractOrigin updates pageX correctly
  expect(pointerEvent.pageX).toBe(event.pageX - origin.x)
  // subtractOrigin updates pageY correctly
  expect(pointerEvent.pageY).toBe(event.pageY - origin.y)
  // subtractOrigin updates clientX correctly
  expect(pointerEvent.clientX).toBe(event.clientX - origin.x)
  // subtractOrigin updates clientY correctly
  expect(pointerEvent.clientY).toBe(event.clientY - origin.y)

  pointerEvent._addOrigin(origin)
  // addOrigin with the subtracted origin reverts to original coordinates
  expect(['pageX', 'pageY', 'clientX', 'clientY'].every((prop) => pointerEvent[prop] === event[prop])).toBe(
    true,
  )
})
