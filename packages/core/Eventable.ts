import * as arr  from '@interactjs/utils/arr';
import extend    from '@interactjs/utils/extend';
import normalize from '@interactjs/utils/normalizeListeners';

function fireUntilImmediateStopped (event, listeners) {
  for (const listener of listeners) {
    if (event.immediatePropagationStopped) { break; }

    listener(event);
  }
}

class Eventable {
  options: any;
  types = {};
  propagationStopped = false;
  immediatePropagationStopped = false;
  global: any;

  constructor (options?: { [index: string]: any }) {
    this.options = extend({}, options || {});
  }

  fire (event: any) {
    let listeners;
    const global = this.global;

    // Interactable#on() listeners
    if ((listeners = this.types[event.type])) {
      fireUntilImmediateStopped(event, listeners);
    }

    // interact.on() listeners
    if (!event.propagationStopped && global && (listeners = global[event.type]))  {
      fireUntilImmediateStopped(event, listeners);
    }
  }

  on (type, listener) {
    const listeners = normalize(type, listener);

    for (type in listeners) {
      this.types[type] = arr.merge(this.types[type] || [], listeners[type]);
    }
  }

  off (type, listener) {
    const listeners = normalize(type, listener);

    for (type in listeners) {
      const eventList = this.types[type];

      if (!eventList || !eventList.length) { continue; }

      for (listener of listeners[type]) {
        const index = eventList.indexOf(listener);

        if (index !== -1) {
          eventList.splice(index, 1);
        }
      }
    }
  }
}

export default Eventable;
