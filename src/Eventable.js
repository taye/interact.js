const { indexOf } = require('./utils/arr');

function fireUntilImmediateStopped (event, listeners) {
  for (let i = 0, len = listeners.length; i < len && !event.immediatePropagationStopped; i++) {
    listeners[i](event);
  }
}

class Eventable {
  fire (event) {
    let listeners;
    const onEvent = 'on' + event.type;
    const global = this.global;

    // Interactable#on() listeners
    if ((listeners = this[event.type])) {
      fireUntilImmediateStopped(event, listeners);
    }

    // interactable.onevent listener
    if (this[onEvent]) {
      this[onEvent](event);
    }

    // interact.on() listeners
    if (!event.propagationStopped && global && (listeners = global[event.type]))  {
      fireUntilImmediateStopped(event, listeners);
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

module.exports = Eventable;
