import test from '@interactjs/_dev/test/test'
import Interaction from '@interactjs/core/Interaction'
import * as helpers from '@interactjs/core/tests/_helpers'
import pointerUtils from '@interactjs/utils/pointerUtils'
import Signals from '@interactjs/utils/Signals'
import PointerEvent from './PointerEvent'

test('PointerEvent constructor', (t) => {
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
  const interaction = new Interaction({ signals: new Signals() } as any)
  const eventTarget = {} as Element
  const pointerEvent = new PointerEvent(type, pointer, event, eventTarget, interaction, 0) as any

  t.equal(pointerEvent.testPointerProp, testPointerProp,
    'pointerEvent is extended form pointer')
  t.equal(pointerEvent.testEventProp, testEventProp,
    'pointerEvent is extended form Event')

  t.equal(pointerEvent.type, type,
    'type is set correctly')
  t.equal(pointerEvent.pointerType, pointerUtils.getPointerType(pointer),
    'pointerType is set correctly')
  t.equal(pointerEvent.pointerId, pointerId,
    'pointerId is set correctly')
  t.equal(pointerEvent.originalEvent, event,
    'originalEvent is set correctly')
  t.equal(pointerEvent.interaction, interaction._proxy,
    'interaction is set correctly')
  t.equal(pointerEvent.target, eventTarget,
    'target is set correctly')
  t.equal(pointerEvent.currentTarget, null,
    'currentTarget is null')

  t.end()
})

test('PointerEvent methods', (t) => {
  const methodContexts = {} as any
  const event: any = ['preventDefault', 'stopPropagation', 'stopImmediatePropagation']
    .reduce((acc, methodName) => {
      acc[methodName] = function () { methodContexts[methodName] = this }
      return acc
    }, helpers.newPointer())
  const pointerEvent = new PointerEvent('TEST', {} as any, event, null, {} as any, 0)

  pointerEvent.preventDefault()
  t.equal(methodContexts.preventDefault, event,
    'PointerEvent.preventDefault() calls preventDefault of originalEvent')

  t.notOk(pointerEvent.propagationStopped,
    'propagationStopped is false before call to stopPropagation')
  pointerEvent.stopPropagation()
  t.ok(pointerEvent.propagationStopped,
    'stopPropagation sets propagationStopped to true')
  t.equal(methodContexts.stopPropagation, undefined,
    'PointerEvent.stopPropagation() does not call stopPropagation of originalEvent')

  t.notOk(pointerEvent.immediatePropagationStopped,
    'immediatePropagationStopped is false before call to stopImmediatePropagation')
  pointerEvent.stopImmediatePropagation()
  t.equal(methodContexts.stopImmediatePropagation, undefined,
    'PointerEvent.stopImmediatePropagation() does not call stopImmediatePropagation of originalEvent')
  t.ok(pointerEvent.immediatePropagationStopped,
    'stopImmediatePropagation sets immediatePropagationStopped to true')

  const origin = { x: 20, y: 30 }
  pointerEvent._subtractOrigin(origin)

  t.equal(pointerEvent.pageX,   event.pageX   - origin.x, 'subtractOrigin updates pageX correctly')
  t.equal(pointerEvent.pageY,   event.pageY   - origin.y, 'subtractOrigin updates pageY correctly')
  t.equal(pointerEvent.clientX, event.clientX - origin.x, 'subtractOrigin updates clientX correctly')
  t.equal(pointerEvent.clientY, event.clientY - origin.y, 'subtractOrigin updates clientY correctly')

  pointerEvent._addOrigin(origin)
  t.ok(['pageX', 'pageY', 'clientX', 'clientY'].reduce((allEqual, prop) => allEqual && pointerEvent[prop] === event[prop], true),
    'addOrigin with the subtracted origin reverts to original coordinates')

  t.end()
})
