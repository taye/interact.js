import * as arr from '@interactjs/utils/arr'
import extend from '@interactjs/utils/extend'
import normalize, { NormalizedListeners } from '@interactjs/utils/normalizeListeners'
import { EventPhase, InteractEvent } from './InteractEvent'
import { ActionName } from './scope'

function fireUntilImmediateStopped<
T extends ActionName,
P extends EventPhase,
> (event: InteractEvent<T, P>, listeners: Interact.Listener[]) {
  for (const listener of listeners) {
    if (event.immediatePropagationStopped) { break }

    listener(event)
  }
}

class Eventable {
  options: any
  types: NormalizedListeners = {}
  propagationStopped = false
  immediatePropagationStopped = false
  global: any

  constructor (options?: { [index: string]: any }) {
    this.options = extend({}, options || {})
  }

  fire (event: any) {
    let listeners
    const global = this.global

    // Interactable#on() listeners
    // tslint:disable no-conditional-assignment
    if ((listeners = this.types[event.type])) {
      fireUntilImmediateStopped(event, listeners)
    }

    // interact.on() listeners
    if (!event.propagationStopped && global && (listeners = global[event.type]))  {
      fireUntilImmediateStopped(event, listeners)
    }
  }

  on (type: string, listener: Interact.ListenersArg) {
    const listeners = normalize(type, listener)

    for (type in listeners) {
      this.types[type] = arr.merge(this.types[type] || [], listeners[type])
    }
  }

  off (type: string, listener: Interact.ListenersArg) {
    const listeners = normalize(type, listener)

    for (type in listeners) {
      const eventList = this.types[type]

      if (!eventList || !eventList.length) { continue }

      for (const subListener of listeners[type]) {
        const index = eventList.indexOf(subListener)

        if (index !== -1) {
          eventList.splice(index, 1)
        }
      }
    }
  }
}

export default Eventable
