const { indexOf } = require('./arr');

const listeners = {
  // signalName: [listeners],
};

const signals = {
  on: function (name, listener) {
    if (!listeners[name]) {
      listeners[name] = [listener];
      return;
    }

    listeners[name].push(listener);
  },
  off: function (name, listener) {
    if (!listeners[name]) { return; }

    const index = indexOf(listeners[name], listener);

    if (index !== -1) {
      listeners[name].splice(index, 1);
    }
  },
  fire: function (name, arg) {
    const targetListeners = listeners[name];

    if (!targetListeners) { return; }

    for (let i = 0; i < targetListeners.length; i++) {
      if (targetListeners[i](arg, name) === false) {
        return;
      }
    }
  },
  listeners: listeners,
};

module.exports = signals;
