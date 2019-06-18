/* eslint-disable no-restricted-syntax */
import { doc } from '@interactjs/_dev/test/domator'
import * as utils from '@interactjs/utils'
import { MockCoords } from '@interactjs/utils/pointerUtils'
import Signals from '@interactjs/utils/Signals'
import Eventable from '../Eventable'
import { createScope } from '../scope'

let counter = 0

export function unique () {
  return (counter++)
}

export function uniqueProps (obj) {
  for (const prop in obj) {
    if (!obj.hasOwnProperty(prop)) { continue }

    if (utils.is.object(obj)) {
      uniqueProps(obj[prop])
    }
    else {
      obj[prop] = (counter++)
    }
  }
}

export function newCoordsSet (n = 0) {
  return {
    start: {
      page     : { x: n++, y: n++ },
      client   : { x: n++, y: n++ },
      timeStamp: n++,
    },
    cur: {
      page     : { x: n++, y: n++ },
      client   : { x: n++, y: n++ },
      timeStamp: n++,
    },
    prev: {
      page     : { x: n++, y: n++ },
      client   : { x: n++, y: n++ },
      timeStamp: n++,
    },
    delta: {
      page     : { x: n++, y: n++ },
      client   : { x: n++, y: n++ },
      timeStamp: n++,
    },
    velocity: {
      page     : { x: n++, y: n++ },
      client   : { x: n++, y: n++ },
      timeStamp: n++,
    },
  }
}

export function newPointer (n = 50) {
  return {
    pointerId: n++,
    pageX: n++,
    pageY: n++,
    clientX: n++,
    clientY: n++,
  } as Interact.PointerType
}

export function mockScope (options = {} as any) {
  const document = options.document || doc
  const window = document.defaultView

  const scope: any = createScope().init(window)

  scope.interact = Object.assign(() => {}, { use () {} }) as any

  return scope
}

export function mockSignals () {
  return {
    on () {},
    off () {},
    fire () {},
  } as unknown as any
}

export function mockInteractable (props = {}) {
  return Object.assign(
    {
      _signals: new Signals(),
      _actions: {
        names: [],
        methodDict: {},
      },
      options: {
        deltaSource: 'page',
      },
      target: {},
      events: new Eventable(),
      getRect () {
        return this.element
          ? utils.dom.getElementClientRect(this.element)
          : { left: 0, top: 0, right: 0, bottom: 0 }
      },
      fire (event) {
        this.events.fire(event)
      },
    },
    props) as any
}

export function getProps<T extends {}, K extends keyof T> (src: T, props: K[]) {
  return props.reduce((acc, prop) => {
    acc[prop] = src[prop]
    return acc
  }, {} as Pick<T, K>)
}

export function testEnv ({
  plugins = [],
  target,
  rect = {  top: 0, left: 0, bottom: 0, right: 0  },
}: {
  plugins?: Interact.Plugin[],
  target?: Interact.Target,
  rect?: Interact.Rect,
} = {}) {
  const scope: Interact.Scope = mockScope()

  for (const plugin of plugins) {
    scope.usePlugin(plugin)
  }

  target = target || scope.document.body

  const interaction = scope.interactions.new({})
  const interactable = scope.interactables.new(target)
  const coords = utils.pointer.newCoords() as MockCoords

  coords.target = target
  const event = utils.pointer.coordsToEvent(coords)

  interactable.rectChecker(() => ({ ...rect }))

  return {
    scope,
    interaction,
    target,
    interactable,
    coords,
    event,
  }
}

export function timeout (n) {
  return new Promise((resolve) => setTimeout(resolve, n))
}
