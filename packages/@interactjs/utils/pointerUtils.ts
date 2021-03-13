import type { InteractEvent } from '@interactjs/core/InteractEvent'
import type { CoordsSetMember, PointerType, Point, PointerEventType, Element } from '@interactjs/types/index'

import browser from './browser'
import dom from './domObjects'
import * as domUtils from './domUtils'
import hypot from './hypot'
import is from './is'
import pointerExtend from './pointerExtend'

export function copyCoords (dest: CoordsSetMember, src: CoordsSetMember) {
  dest.page = dest.page || ({} as any)
  dest.page.x = src.page.x
  dest.page.y = src.page.y

  dest.client = dest.client || ({} as any)
  dest.client.x = src.client.x
  dest.client.y = src.client.y

  dest.timeStamp = src.timeStamp
}

export function setCoordDeltas (targetObj: CoordsSetMember, prev: CoordsSetMember, cur: CoordsSetMember) {
  targetObj.page.x = cur.page.x - prev.page.x
  targetObj.page.y = cur.page.y - prev.page.y
  targetObj.client.x = cur.client.x - prev.client.x
  targetObj.client.y = cur.client.y - prev.client.y
  targetObj.timeStamp = cur.timeStamp - prev.timeStamp
}

export function setCoordVelocity (targetObj: CoordsSetMember, delta: CoordsSetMember) {
  const dt = Math.max(delta.timeStamp / 1000, 0.001)

  targetObj.page.x = delta.page.x / dt
  targetObj.page.y = delta.page.y / dt
  targetObj.client.x = delta.client.x / dt
  targetObj.client.y = delta.client.y / dt
  targetObj.timeStamp = dt
}

export function setZeroCoords (targetObj: CoordsSetMember) {
  targetObj.page.x = 0
  targetObj.page.y = 0
  targetObj.client.x = 0
  targetObj.client.y = 0
}

export function isNativePointer (pointer: any) {
  return pointer instanceof dom.Event || pointer instanceof dom.Touch
}

// Get specified X/Y coords for mouse or event.touches[0]
export function getXY (type: string, pointer: PointerType | InteractEvent, xy: Point) {
  xy = xy || ({} as Point)
  type = type || 'page'

  xy.x = pointer[(type + 'X') as keyof PointerType]
  xy.y = pointer[(type + 'Y') as keyof PointerType]

  return xy
}

export function getPageXY (pointer: PointerType | InteractEvent, page?: Point) {
  page = page || { x: 0, y: 0 }

  // Opera Mobile handles the viewport and scrolling oddly
  if (browser.isOperaMobile && isNativePointer(pointer)) {
    getXY('screen', pointer, page)

    page.x += window.scrollX
    page.y += window.scrollY
  } else {
    getXY('page', pointer, page)
  }

  return page
}

export function getClientXY (pointer: PointerType, client: Point) {
  client = client || ({} as any)

  if (browser.isOperaMobile && isNativePointer(pointer)) {
    // Opera Mobile handles the viewport and scrolling oddly
    getXY('screen', pointer, client)
  } else {
    getXY('client', pointer, client)
  }

  return client
}

export function getPointerId (pointer: { pointerId?: number, identifier?: number, type?: string }) {
  return is.number(pointer.pointerId) ? pointer.pointerId! : pointer.identifier!
}

export function setCoords (dest: CoordsSetMember, pointers: any[], timeStamp: number) {
  const pointer = pointers.length > 1 ? pointerAverage(pointers) : pointers[0]

  getPageXY(pointer, dest.page)
  getClientXY(pointer, dest.client)

  dest.timeStamp = timeStamp
}

export function getTouchPair (event: TouchEvent | PointerType[]) {
  const touches: PointerType[] = []

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
      } else if (event.touches.length === 0) {
        touches[0] = event.changedTouches[0]
        touches[1] = event.changedTouches[1]
      }
    } else {
      touches[0] = event.touches[0]
      touches[1] = event.touches[1]
    }
  }

  return touches
}

export function pointerAverage (pointers: PointerType[]) {
  const average = {
    pageX: 0,
    pageY: 0,
    clientX: 0,
    clientY: 0,
    screenX: 0,
    screenY: 0,
  }

  type CoordKeys = keyof typeof average

  for (const pointer of pointers) {
    for (const prop in average) {
      average[prop as CoordKeys] += pointer[prop as CoordKeys]
    }
  }
  for (const prop in average) {
    average[prop as CoordKeys] /= pointers.length
  }

  return average
}

export function touchBBox (event: PointerType[]) {
  if (!event.length) {
    return null
  }

  const touches = getTouchPair(event)
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
}

export function touchDistance (event: PointerType[] | TouchEvent, deltaSource: string) {
  const sourceX = (deltaSource + 'X') as 'pageX'
  const sourceY = (deltaSource + 'Y') as 'pageY'
  const touches = getTouchPair(event)

  const dx = touches[0][sourceX] - touches[1][sourceX]
  const dy = touches[0][sourceY] - touches[1][sourceY]

  return hypot(dx, dy)
}

export function touchAngle (event: PointerType[] | TouchEvent, deltaSource: string) {
  const sourceX = (deltaSource + 'X') as 'pageX'
  const sourceY = (deltaSource + 'Y') as 'pageY'
  const touches = getTouchPair(event)
  const dx = touches[1][sourceX] - touches[0][sourceX]
  const dy = touches[1][sourceY] - touches[0][sourceY]
  const angle = (180 * Math.atan2(dy, dx)) / Math.PI

  return angle
}

export function getPointerType (pointer: { pointerType?: string, identifier?: number, type?: string }) {
  return is.string(pointer.pointerType)
    ? pointer.pointerType
    : is.number(pointer.pointerType)
      ? [undefined, undefined, 'touch', 'pen', 'mouse'][pointer.pointerType]!
      : // if the PointerEvent API isn't available, then the "pointer" must
    // be either a MouseEvent, TouchEvent, or Touch object
      /touch/.test(pointer.type || '') || pointer instanceof dom.Touch
        ? 'touch'
        : 'mouse'
}

// [ event.target, event.currentTarget ]
export function getEventTargets (event: Event) {
  const path = is.func(event.composedPath)
    ? (event.composedPath() as Element[])
    : ((event as unknown) as { path: Element[] }).path

  return [
    domUtils.getActualElement(path ? path[0] : (event.target as Element)),
    domUtils.getActualElement(event.currentTarget as Element),
  ]
}

export function newCoords (): CoordsSetMember {
  return {
    page: { x: 0, y: 0 },
    client: { x: 0, y: 0 },
    timeStamp: 0,
  }
}

export function coordsToEvent (coords: MockCoords) {
  const event = {
    coords,
    get page () {
      return this.coords.page
    },
    get client () {
      return this.coords.client
    },
    get timeStamp () {
      return this.coords.timeStamp
    },
    get pageX () {
      return this.coords.page.x
    },
    get pageY () {
      return this.coords.page.y
    },
    get clientX () {
      return this.coords.client.x
    },
    get clientY () {
      return this.coords.client.y
    },
    get pointerId () {
      return this.coords.pointerId
    },
    get target () {
      return this.coords.target
    },
    get type () {
      return this.coords.type
    },
    get pointerType () {
      return this.coords.pointerType
    },
    get buttons () {
      return this.coords.buttons
    },
    preventDefault () {},
  }

  return event as typeof event & PointerType & PointerEventType
}

export interface MockCoords {
  page: Point
  client: Point
  timeStamp?: number
  pointerId?: any
  target?: any
  type?: string
  pointerType?: string
  buttons?: number
}

export { pointerExtend }
