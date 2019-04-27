export type SignalListener = (signalArg: PartialSignalArg, sinalName?: string) => (void | boolean)

export interface SignalArg<T extends Interact.ActionName = any> {
  interaction: Interact.Interaction<T>
  Interactable: Interact.Interactable
  iEvent: Interact.InteractEvent<T>
  element: Interact.EventTarget
  coords: Interact.Point
  event: Interact.PointerEventType
  phase: Interact.EventPhase
  [index: string]: any
}

export type PartialSignalArg = Partial<SignalArg>

class Signals {
  listeners: {
    [signalName: string]: SignalListener[],
  } = {}

  on (name: string, listener: SignalListener) {
    if (!this.listeners[name]) {
      this.listeners[name] = [listener]
      return
    }

    this.listeners[name].push(listener)
  }

  off (name: string, listener: SignalListener) {
    if (!this.listeners[name]) { return }

    const index = this.listeners[name].indexOf(listener)

    if (index !== -1) {
      this.listeners[name].splice(index, 1)
    }
  }

  fire (name: string, arg: Partial<SignalArg>): void | false {
    const targetListeners = this.listeners[name]

    if (!targetListeners) { return }

    for (const listener of targetListeners) {
      if (listener(arg, name) === false) {
        return false
      }
    }
  }
}

export default Signals
