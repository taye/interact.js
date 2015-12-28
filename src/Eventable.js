const { indexOf } = require('./utils/arr');

class Eventable {
  fire (event) {
    let listeners;
    const onEvent = 'on' + event.type;

    // Interactable#on() listeners
    if (event.type in this) {
      listeners = this[event.type];

      for (let i = 0, len = listeners.length; i < len && !event.immediatePropagationStopped; i++) {
        listeners[i](event);
      }
    }

    // interactable.onevent listener
    if (this[onEvent]) {
      this[onEvent](event);
    }

    // interact.on() listeners
    if (event.type in this.global && (listeners = this.global[event.type]))  {

      for (let i = 0, len = listeners.length; i < len && !event.immediatePropagationStopped; i++) {
        listeners[i](event);
      }
    }
  }

  on (eventType, listener) {
    // if this type of event was never bound
    if (!(eventType in this)) {
      this[eventType] = [listener];
    }
    else {
      this[eventType].push(listener);
    }
  }

  off (eventType, listener) {
    // if it is an action event type
    const eventList = this[eventType];
    const index     = eventList? indexOf(eventList, listener) : -1;

    if (index !== -1) {
      this[eventType].splice(index, 1);
    }
  }
}

Eventable.prototype.types = [];

module.exports = Eventable;
