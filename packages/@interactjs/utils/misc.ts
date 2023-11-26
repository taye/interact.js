import type { ActionName, ActionProps } from '@interactjs/core/types'

import { window } from './window'

export function warnOnce<T>(this: T, method: (...args: any[]) => any, message: string) {
  let warned = false

  return function (this: T) {
    if (!warned) {
      ;(window as any).console.warn(message)
      warned = true
    }

    return method.apply(this, arguments)
  }
}

export function copyAction<T extends ActionName>(dest: ActionProps<any>, src: ActionProps<T>) {
  dest.name = src.name
  dest.axis = src.axis
  dest.edges = src.edges

  return dest
}

export const sign = (n: number) => (n >= 0 ? 1 : -1)
