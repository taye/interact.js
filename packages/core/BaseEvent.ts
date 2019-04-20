import Interactable from './Interactable'
import Interaction from './Interaction'
import { ActionName } from './scope'

export enum EventPhase {
  Start = 'start',
  Move = 'move',
  End = 'end',
  _NONE = '',
}

export class BaseEvent<T extends ActionName = any> {
  type: string
  target: EventTarget
  currentTarget: EventTarget
  interactable: Interactable
  _interaction: Interaction<T>
  timeStamp: any
  immediatePropagationStopped = false
  propagationStopped = false

  get interaction () {
    return this._interaction._proxy
  }

  constructor (interaction) {
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

export default BaseEvent
