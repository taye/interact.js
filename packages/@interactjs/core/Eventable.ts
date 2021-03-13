import type { Listener, ListenersArg, Rect } from '@interactjs/types/index'
import * as arr from '@interactjs/utils/arr'
import extend from '@interactjs/utils/extend'
import type { NormalizedListeners } from '@interactjs/utils/normalizeListeners'
import normalize from '@interactjs/utils/normalizeListeners'

function fireUntilImmediateStopped (event: any, listeners: Listener[]) {
  for (const listener of listeners) {
    if (event.immediatePropagationStopped) {
      break
    }

    listener(event)
  }
}

export class Eventable {
  options: any
  types: NormalizedListeners = {}
  propagationStopped = false
  immediatePropagationStopped = false
  global: any

  constructor (options?: { [index: string]: any }) {
    this.options = extend({}, options || {})
  }

  fire<T extends { type: string, propagationStopped?: boolean }> (event: T) {
    let listeners: Listener[]
    const global = this.global

    // Interactable#on() listeners
    // tslint:disable no-conditional-assignment
    if ((listeners = this.types[event.type])) {
      fireUntilImmediateStopped(event, listeners)
    }

    // interact.on() listeners
    if (!event.propagationStopped && global && (listeners = global[event.type])) {
      fireUntilImmediateStopped(event, listeners)
    }
  }

  on (type: string, listener: ListenersArg) {
    const listeners = normalize(type, listener)

    for (type in listeners) {
      this.types[type] = arr.merge(this.types[type] || [], listeners[type])
    }
  }

  off (type: string, listener: ListenersArg) {
    const listeners = normalize(type, listener)

    for (type in listeners) {
      const eventList = this.types[type]

      if (!eventList || !eventList.length) {
        continue
      }

      for (const subListener of listeners[type]) {
        const index = eventList.indexOf(subListener)

        if (index !== -1) {
          eventList.splice(index, 1)
        }
      }
    }
  }

  getRect (_element: Element): Rect {
    return null
  }
}
