import browser from './browser'
import dom from './domObjects'
import * as domUtils from './domUtils'
import hypot from './hypot'
import * as is from './is'
import pointerExtend from './pointerExtend'

const pointerUtils = {
  copyCoords (dest, src) {
    dest.page = dest.page || {}
    dest.page.x = src.page.x
    dest.page.y = src.page.y

    dest.client = dest.client || {}
    dest.client.x = src.client.x
    dest.client.y = src.client.y

    dest.timeStamp = src.timeStamp
  },

  setCoordDeltas (targetObj, prev, cur) {
    targetObj.page.x    = cur.page.x    - prev.page.x
    targetObj.page.y    = cur.page.y    - prev.page.y
    targetObj.client.x  = cur.client.x  - prev.client.x
    targetObj.client.y  = cur.client.y  - prev.client.y
    targetObj.timeStamp = cur.timeStamp - prev.timeStamp
  },

  setCoordVelocity (targetObj, delta) {
    const dt = Math.max(delta.timeStamp / 1000, 0.001)

    targetObj.page.x   = delta.page.x / dt
    targetObj.page.y   = delta.page.y / dt
    targetObj.client.x = delta.client.x / dt
    targetObj.client.y = delta.client.y / dt
    targetObj.timeStamp = dt
  },

  isNativePointer  (pointer) {
    return (pointer instanceof dom.Event || pointer instanceof dom.Touch)
  },

  // Get specified X/Y coords for mouse or event.touches[0]
  getXY (type, pointer, xy) {
    xy = xy || {}
    type = type || 'page'

    xy.x = pointer[type + 'X']
    xy.y = pointer[type + 'Y']

    return xy
  },

  getPageXY (pointer: Interact.PointerType | Interact.InteractEvent, page?: Interact.Point) {
    page = page || { x: 0, y: 0 }

    // Opera Mobile handles the viewport and scrolling oddly
    if (browser.isOperaMobile && pointerUtils.isNativePointer(pointer)) {
      pointerUtils.getXY('screen', pointer, page)

      page.x += window.scrollX
      page.y += window.scrollY
    }
    else {
      pointerUtils.getXY('page', pointer, page)
    }

    return page
  },

  getClientXY (pointer, client) {
    client = client || {}

    if (browser.isOperaMobile && pointerUtils.isNativePointer(pointer)) {
      // Opera Mobile handles the viewport and scrolling oddly
      pointerUtils.getXY('screen', pointer, client)
    }
    else {
      pointerUtils.getXY('client', pointer, client)
    }

    return client
  },

  getPointerId (pointer) {
    return is.number(pointer.pointerId) ? pointer.pointerId : pointer.identifier
  },

  setCoords (targetObj, pointers: any[], timeStamp: number) {
    const pointer = (pointers.length > 1
      ? pointerUtils.pointerAverage(pointers)
      : pointers[0])

    const tmpXY = {} as { x: number, y: number }

    pointerUtils.getPageXY(pointer, tmpXY)
    targetObj.page.x = tmpXY.x
    targetObj.page.y = tmpXY.y

    pointerUtils.getClientXY(pointer, tmpXY)
    targetObj.client.x = tmpXY.x
    targetObj.client.y = tmpXY.y

    targetObj.timeStamp = timeStamp
  },

  pointerExtend,

  getTouchPair (event) {
    const touches = []

    // array of touches is supplied
    if (is.array(event)) {
      touches[0] = event[0]
      touches[1] = event[1]
    }
    // an event
    else {
      if (event.type === 'touchend') {
        if (event.touches.length === 1) {
          touches[0] = event.touches[0]
          touches[1] = event.changedTouches[0]
        }
        else if (event.touches.length === 0) {
          touches[0] = event.changedTouches[0]
          touches[1] = event.changedTouches[1]
        }
      }
      else {
        touches[0] = event.touches[0]
        touches[1] = event.touches[1]
      }
    }

    return touches
  },

  pointerAverage (pointers: PointerEvent[] | Event[]) {
    const average = {
      pageX  : 0,
      pageY  : 0,
      clientX: 0,
      clientY: 0,
      screenX: 0,
      screenY: 0,
    }

    for (const pointer of pointers) {
      for (const prop in average) {
        average[prop] += pointer[prop]
      }
    }
    for (const prop in average) {
      average[prop] /= pointers.length
    }

    return average
  },

  touchBBox (event: Event | Array<(Interact.PointerType) | TouchEvent>) {
    if (!(event as any).length &&
        !((event as TouchEvent).touches &&
          (event as TouchEvent).touches.length > 1)) {
      return null
    }

    const touches = pointerUtils.getTouchPair(event)
    const minX = Math.min(touches[0].pageX, touches[1].pageX)
    const minY = Math.min(touches[0].pageY, touches[1].pageY)
    const maxX = Math.max(touches[0].pageX, touches[1].pageX)
    const maxY = Math.max(touches[0].pageY, touches[1].pageY)

    return {
      x: minX,
      y: minY,
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY,
      width: maxX - minX,
      height: maxY - minY,
    }
  },

  touchDistance (event, deltaSource) {
    const sourceX = deltaSource + 'X'
    const sourceY = deltaSource + 'Y'
    const touches = pointerUtils.getTouchPair(event)

    const dx = touches[0][sourceX] - touches[1][sourceX]
    const dy = touches[0][sourceY] - touches[1][sourceY]

    return hypot(dx, dy)
  },

  touchAngle (event, deltaSource) {
    const sourceX = deltaSource + 'X'
    const sourceY = deltaSource + 'Y'
    const touches = pointerUtils.getTouchPair(event)
    const dx = touches[1][sourceX] - touches[0][sourceX]
    const dy = touches[1][sourceY] - touches[0][sourceY]
    const angle = 180 * Math.atan2(dy, dx) / Math.PI

    return  angle
  },

  getPointerType (pointer) {
    return is.string(pointer.pointerType)
      ? pointer.pointerType
      : is.number(pointer.pointerType)
        ? [undefined, undefined, 'touch', 'pen', 'mouse'][pointer.pointerType]
        // if the PointerEvent API isn't available, then the "pointer" must
        // be either a MouseEvent, TouchEvent, or Touch object
        : /touch/.test(pointer.type) || pointer instanceof dom.Touch
          ? 'touch'
          : 'mouse'
  },

  // [ event.target, event.currentTarget ]
  getEventTargets (event) {
    const path = is.func(event.composedPath) ? event.composedPath() : event.path

    return [
      domUtils.getActualElement(path ? path[0] : event.target),
      domUtils.getActualElement(event.currentTarget),
    ]
  },

  newCoords () {
    return {
      page     : { x: 0, y: 0 },
      client   : { x: 0, y: 0 },
      timeStamp: 0,
    }
  },

  coordsToEvent (coords: MockCoords) {
    const event = {
      coords,
      get page () { return this.coords.page },
      get client () { return this.coords.client },
      get timeStamp () { return this.coords.timeStamp },
      get pageX () { return this.coords.page.x },
      get pageY () { return this.coords.page.y },
      get clientX () { return this.coords.client.x },
      get clientY () { return this.coords.client.y },
      get pointerId () { return this.coords.pointerId },
      get target () { return this.coords.target },
      get type () { return this.coords.type },
      get pointerType () { return this.coords.pointerType },
    }

    return event as typeof event & Interact.PointerType & Interact.PointerEventType
  },
}

export default pointerUtils

export interface MockCoords {
  page: Interact.Point
  client: Interact.Point
  timeStamp?: number
  pointerId?: any
  target?: any
  type?: string
  pointerType?: string
}
