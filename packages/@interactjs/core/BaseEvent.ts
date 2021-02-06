import type { Interactable } from '@interactjs/core/Interactable'
import type { Interaction, InteractionProxy } from '@interactjs/core/Interaction'
import type { ActionName } from '@interactjs/core/scope'

export class BaseEvent<T extends ActionName | null = never> {
  type: string
  target: EventTarget
  currentTarget: Node
  interactable: Interactable
  _interaction: Interaction<T>
  timeStamp: any
  immediatePropagationStopped = false
  propagationStopped = false

  constructor (interaction: Interaction<T>) {
    this._interaction = interaction
  }

  preventDefault () {}

  /**
   * Don't call any other listeners (even on the current target)
   */
  stopPropagation () {
    this.propagationStopped = true
  }

  /**
   * Don't call listeners on the remaining targets
   */
  stopImmediatePropagation () {
    this.immediatePropagationStopped = this.propagationStopped = true
  }
}

// defined outside of class definition to avoid assignment of undefined during
// construction
export interface BaseEvent<T extends ActionName> {
  interaction: InteractionProxy<T>
}

// getters and setters defined here to support typescript 3.6 and below which
// don't support getter and setters in .d.ts files
Object.defineProperty(BaseEvent.prototype, 'interaction', {
  get (this: BaseEvent) {
    return this._interaction._proxy
  },
  set (this: BaseEvent) {},
})
