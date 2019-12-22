function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { contains } from "./arr.js";
import * as domUtils from "./domUtils.js";
import * as is from "./is.js";
import pExtend from "./pointerExtend.js";
import * as pointerUtils from "./pointerUtils.js";
const elements = [];
const targets = [];
const delegatedEvents = {};
const documents = [];

function add(element, type, listener, optionalArg) {
  const options = getOptions(optionalArg);
  let elementIndex = elements.indexOf(element);
  let target = targets[elementIndex];

  if (!target) {
    target = {
      events: {},
      typeCount: 0
    };
    elementIndex = elements.push(element) - 1;
    targets.push(target);
  }

  if (!target.events[type]) {
    target.events[type] = [];
    target.typeCount++;
  }

  if (!contains(target.events[type], listener)) {
    element.addEventListener(type, listener, events.supportsOptions ? options : !!options.capture);
    target.events[type].push(listener);
  }
}

function remove(element, type, listener, optionalArg) {
  const options = getOptions(optionalArg);
  const elementIndex = elements.indexOf(element);
  const target = targets[elementIndex];

  if (!target || !target.events) {
    return;
  }

  if (type === 'all') {
    for (type in target.events) {
      if (target.events.hasOwnProperty(type)) {
        remove(element, type, 'all');
      }
    }

    return;
  }

  if (target.events[type]) {
    const len = target.events[type].length;

    if (listener === 'all') {
      for (let i = 0; i < len; i++) {
        remove(element, type, target.events[type][i], options);
      }

      return;
    } else {
      for (let i = 0; i < len; i++) {
        if (target.events[type][i] === listener) {
          element.removeEventListener(type, listener, events.supportsOptions ? options : !!options.capture);
          target.events[type].splice(i, 1);
          break;
        }
      }
    }

    if (target.events[type] && target.events[type].length === 0) {
      target.events[type] = null;
      target.typeCount--;
    }
  }

  if (!target.typeCount) {
    targets.splice(elementIndex, 1);
    elements.splice(elementIndex, 1);
  }
}

function addDelegate(selector, context, type, listener, optionalArg) {
  const options = getOptions(optionalArg);

  if (!delegatedEvents[type]) {
    delegatedEvents[type] = {
      contexts: [],
      listeners: [],
      selectors: []
    }; // add delegate listener functions

    for (const doc of documents) {
      add(doc, type, delegateListener);
      add(doc, type, delegateUseCapture, true);
    }
  }

  const delegated = delegatedEvents[type];
  let index;

  for (index = delegated.selectors.length - 1; index >= 0; index--) {
    if (delegated.selectors[index] === selector && delegated.contexts[index] === context) {
      break;
    }
  }

  if (index === -1) {
    index = delegated.selectors.length;
    delegated.selectors.push(selector);
    delegated.contexts.push(context);
    delegated.listeners.push([]);
  } // keep listener and capture and passive flags


  delegated.listeners[index].push([listener, !!options.capture, options.passive]);
}

function removeDelegate(selector, context, type, listener, optionalArg) {
  const options = getOptions(optionalArg);
  const delegated = delegatedEvents[type];
  let matchFound = false;
  let index;

  if (!delegated) {
    return;
  } // count from last index of delegated to 0


  for (index = delegated.selectors.length - 1; index >= 0; index--) {
    // look for matching selector and context Node
    if (delegated.selectors[index] === selector && delegated.contexts[index] === context) {
      const listeners = delegated.listeners[index]; // each item of the listeners array is an array: [function, capture, passive]

      for (let i = listeners.length - 1; i >= 0; i--) {
        const [fn, capture, passive] = listeners[i]; // check if the listener functions and capture and passive flags match

        if (fn === listener && capture === !!options.capture && passive === options.passive) {
          // remove the listener from the array of listeners
          listeners.splice(i, 1); // if all listeners for this interactable have been removed
          // remove the interactable from the delegated arrays

          if (!listeners.length) {
            delegated.selectors.splice(index, 1);
            delegated.contexts.splice(index, 1);
            delegated.listeners.splice(index, 1); // remove delegate function from context

            remove(context, type, delegateListener);
            remove(context, type, delegateUseCapture, true); // remove the arrays if they are empty

            if (!delegated.selectors.length) {
              delegatedEvents[type] = null;
            }
          } // only remove one listener


          matchFound = true;
          break;
        }
      }

      if (matchFound) {
        break;
      }
    }
  }
} // bound to the interactable context when a DOM event
// listener is added to a selector interactable


function delegateListener(event, optionalArg) {
  const options = getOptions(optionalArg);
  const fakeEvent = new FakeEvent(event);
  const delegated = delegatedEvents[event.type];
  const [eventTarget] = pointerUtils.getEventTargets(event);
  let element = eventTarget; // climb up document tree looking for selector matches

  while (is.element(element)) {
    for (let i = 0; i < delegated.selectors.length; i++) {
      const selector = delegated.selectors[i];
      const context = delegated.contexts[i];

      if (domUtils.matchesSelector(element, selector) && domUtils.nodeContains(context, eventTarget) && domUtils.nodeContains(context, element)) {
        const listeners = delegated.listeners[i];
        fakeEvent.currentTarget = element;

        for (const [fn, capture, passive] of listeners) {
          if (capture === !!options.capture && passive === options.passive) {
            fn(fakeEvent);
          }
        }
      }
    }

    element = domUtils.parentNode(element);
  }
}

function delegateUseCapture(event) {
  return delegateListener.call(this, event, true);
}

function getOptions(param) {
  return is.object(param) ? param : {
    capture: param
  };
}

export class FakeEvent {
  constructor(originalEvent) {
    this.originalEvent = originalEvent;

    _defineProperty(this, "currentTarget", void 0);

    // duplicate the event so that currentTarget can be changed
    pExtend(this, originalEvent);
  }

  preventOriginalDefault() {
    this.originalEvent.preventDefault();
  }

  stopPropagation() {
    this.originalEvent.stopPropagation();
  }

  stopImmediatePropagation() {
    this.originalEvent.stopImmediatePropagation();
  }

}
const events = {
  add,
  remove,
  addDelegate,
  removeDelegate,
  delegateListener,
  delegateUseCapture,
  delegatedEvents,
  documents,
  supportsOptions: false,
  supportsPassive: false,
  _elements: elements,
  _targets: targets,

  init(window) {
    window.document.createElement('div').addEventListener('test', null, {
      get capture() {
        return events.supportsOptions = true;
      },

      get passive() {
        return events.supportsPassive = true;
      }

    });
  }

};
export default events;
//# sourceMappingURL=events.js.map