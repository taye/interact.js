import type { PointerType, Rect, Target } from '@interactjs/types/index'
import extend from '@interactjs/utils/extend'
import is from '@interactjs/utils/is'
import * as pointerUtils from '@interactjs/utils/pointerUtils'

import type { ActionProps } from '../Interaction'
import type { Plugin, ActionName } from '../scope'
import { Scope } from '../scope'

let counter = 0

export function unique () {
  return counter++
}

export function uniqueProps (obj: any) {
  for (const prop in obj) {
    if (!obj.hasOwnProperty(prop)) {
      continue
    }

    if (is.object(obj)) {
      uniqueProps(obj[prop])
    } else {
      obj[prop] = counter++
    }
  }
}

export function newCoordsSet (n = 0) {
  return {
    start: {
      page: { x: n++, y: n++ },
      client: { x: n++, y: n++ },
      timeStamp: n++,
    },
    cur: {
      page: { x: n++, y: n++ },
      client: { x: n++, y: n++ },
      timeStamp: n++,
    },
    prev: {
      page: { x: n++, y: n++ },
      client: { x: n++, y: n++ },
      timeStamp: n++,
    },
    delta: {
      page: { x: n++, y: n++ },
      client: { x: n++, y: n++ },
      timeStamp: n++,
    },
    velocity: {
      page: { x: n++, y: n++ },
      client: { x: n++, y: n++ },
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
  } as PointerType
}

export function mockScope ({ document = window.document } = {} as any) {
  const window = document.defaultView

  const scope = new Scope().init(window)

  extend(scope.actions.phaselessTypes, { teststart: true, testmove: true, testend: true })

  return scope
}

export function getProps<T extends { [key: string]: any }, K extends keyof T> (src: T, props: readonly K[]) {
  return props.reduce((acc, prop) => {
    if (prop in src) {
      acc[prop] = src[prop]
    }

    return acc
  }, {} as Pick<T, K>)
}

export function testEnv<T extends Target = HTMLElement> ({
  plugins = [],
  target,
  rect,
  document = window.document,
}: {
  plugins?: Plugin[]
  target?: T
  rect?: Rect
  document?: Document
} = {}) {
  const scope = mockScope({ document })

  for (const plugin of plugins) {
    scope.usePlugin(plugin)
  }

  if (!target) {
    ;(target as unknown as HTMLElement) = scope.document.body
  }

  const interaction = scope.interactions.new({})
  const interactable = scope.interactables.new(target)
  const coords: pointerUtils.MockCoords = pointerUtils.newCoords()

  coords.target = target
  const event = pointerUtils.coordsToEvent(coords)

  if (rect) {
    interactable.rectChecker(() => ({ ...rect }))
  }

  return {
    scope,
    interaction,
    target,
    interactable,
    coords,
    event,
    interact: scope.interactStatic,
    start: <T extends ActionName>(action: ActionProps<T>) =>
      interaction.start(action, interactable, target as HTMLElement),
    stop: () => interaction.stop(),
    down: () => interaction.pointerDown(event, event, target as HTMLElement),
    move: (force?: boolean) =>
      force ? interaction.move() : interaction.pointerMove(event, event, target as HTMLElement),
    up: () => interaction.pointerUp(event, event, target as HTMLElement, target as HTMLElement),
  }
}

export function timeout (n: number) {
  return new Promise((resolve) => setTimeout(resolve, n))
}

export function ltrbwh (
  left: number,
  top: number,
  right: number,
  bottom: number,
  width: number,
  height: number,
) {
  return { left, top, right, bottom, width, height }
}
