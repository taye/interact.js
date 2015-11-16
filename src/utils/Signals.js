const { indexOf } = require('./arr');

class Signals {
  constructor () {
    this.listeners = {
      // signalName: [listeners],
    };
  }

  on (name, listener) {
    if (!this.listeners[name]) {
      this.listeners[name] = [listener];
      return;
    }

    this.listeners[name].push(listener);
  }

  off (name, listener) {
    if (!this.listeners[name]) { return; }

    const index = indexOf(this.listeners[name], listener);

    if (index !== -1) {
      this.listeners[name].splice(index, 1);
    }
  }

  fire (name, arg) {
    const targetListeners = this.listeners[name];

    if (!targetListeners) { return; }

    for (let i = 0; i < targetListeners.length; i++) {
      if (targetListeners[i](arg, name) === false) {
        return;
      }
    }
  }
}

Signals.new = function () {
  return new Signals();
};

module.exports = Signals;
