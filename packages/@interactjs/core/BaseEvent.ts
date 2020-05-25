import * as Interact from '@interactjs/types/index'

export class BaseEvent<T extends Interact.ActionName = any> {
  type: string
  target: EventTarget
  currentTarget: EventTarget
  interactable: Interact.Interactable
  _interaction: Interact.Interaction<T>
  timeStamp: any
  immediatePropagationStopped = false
  propagationStopped = false

  constructor (interaction: Interact.Interaction) {
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
export interface BaseEvent<T extends Interact.ActionName = any> {
  interaction: Interact.InteractionProxy<T>
}

// getters and setters defined here to support typescript 3.6 and below which
// don't support getter and setters in .d.ts files
Object.defineProperty(BaseEvent.prototype, 'interaction', {
  get (this: BaseEvent) { return this._interaction._proxy },
  set (this: BaseEvent) {},
})

export default BaseEvent
