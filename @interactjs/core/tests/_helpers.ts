/* eslint-disable no-restricted-syntax */
import { doc } from '@interactjs/_dev/test/domator'
import * as utils from '@interactjs/utils/index'
import { MockCoords } from '@interactjs/utils/pointerUtils'
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

  const scope = createScope().init(window)

  scope.interact = Object.assign(() => {}, { use () {} }) as any

  return scope
}

export function getProps<T extends object, K extends keyof T> (src: T, props: K[]) {
  return props.reduce((acc, prop) => {
    if (prop in src) {
      acc[prop] = src[prop]
    }

    return acc
  }, {} as Pick<T, K>)
}

export function testEnv<T extends Interact.Target = HTMLElement> ({
  plugins = [],
  target,
  rect = {  top: 0, left: 0, bottom: 0, right: 0  },
}: {
  plugins?: Interact.Plugin[]
  target?: T
  rect?: Interact.Rect
} = {}) {
  const scope: Interact.Scope = mockScope()

  for (const plugin of plugins) {
    scope.usePlugin(plugin)
  }

  if (!target) {
    (target as unknown as HTMLElement) = scope.document.body
  }

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
    start: (action: Interact.ActionProps) => interaction.start(action, interactable, target as HTMLElement),
    stop: () => interaction.stop(),
    down: () => interaction.pointerDown(event, event, target as HTMLElement),
    move: (force?: boolean) => force ? interaction.move() : interaction.pointerMove(event, event, target as HTMLElement),
    up: () => interaction.pointerMove(event, event, target as HTMLElement),
  }
}

export function timeout (n) {
  return new Promise(resolve => setTimeout(resolve, n))
}

export function ltrbwh (left: number, top: number, right: number, bottom: number, width: number, height: number) {
  return { left, top, right, bottom, width, height }
}
