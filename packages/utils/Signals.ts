type SignalListener = (signalArg: any, sinalName: string) => (void | boolean)

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

  fire (name: string, arg: any): void | false {
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
