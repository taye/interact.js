const arr       = require('./arr');
const isType    = require('./isType');
const domUtils  = require('./domUtils');
const indexOf   = arr.indexOf;
const contains  = arr.contains;
const getWindow = require('./window').getWindow;

const useAttachEvent = ('attachEvent' in window) && !('addEventListener' in window);
const addEvent       = useAttachEvent?  'attachEvent': 'addEventListener';
const removeEvent    = useAttachEvent?  'detachEvent': 'removeEventListener';
const on             = useAttachEvent? 'on': '';

const elements          = [];
const targets           = [];
const attachedListeners = [];

// {
//   type: {
//     selectors: ['selector', ...],
//     contexts : [document, ...],
//     listeners: [[listener, useCapture], ...]
//   }
//  }
const delegatedEvents = {};

const documents = [];

function add (element, type, listener, useCapture) {
  let elementIndex = indexOf(elements, element);
  let target = targets[elementIndex];

  if (!target) {
    target = {
      events: {},
      typeCount: 0,
    };

    elementIndex = elements.push(element) - 1;
    targets.push(target);

    attachedListeners.push((useAttachEvent ? {
      supplied: [],
      wrapped : [],
      useCount: [],
    } : null));
  }

  if (!target.events[type]) {
    target.events[type] = [];
    target.typeCount++;
  }

  if (!contains(target.events[type], listener)) {
    let ret;

    if (useAttachEvent) {
      const { supplied, wrapped, useCount } = attachedListeners[elementIndex];
      const listenerIndex = indexOf(supplied, listener);

      const wrappedListener = wrapped[listenerIndex] || function (event) {
        if (!event.immediatePropagationStopped) {
          event.target = event.srcElement;
          event.currentTarget = element;

          event.preventDefault           = event.preventDefault           || preventDef;
          event.stopPropagation          = event.stopPropagation          || stopProp;
          event.stopImmediatePropagation = event.stopImmediatePropagation || stopImmProp;

          if (/mouse|click/.test(event.type)) {
            event.pageX = event.clientX + getWindow(element).document.documentElement.scrollLeft;
            event.pageY = event.clientY + getWindow(element).document.documentElement.scrollTop;
          }

          listener(event);
        }
      };

      ret = element[addEvent](on + type, wrappedListener, !!useCapture);

      if (listenerIndex === -1) {
        supplied.push(listener);
        wrapped.push(wrappedListener);
        useCount.push(1);
      }
      else {
        useCount[listenerIndex]++;
      }
    }
    else {
      ret = element[addEvent](type, listener, !!useCapture);
    }
    target.events[type].push(listener);

    return ret;
  }
}

function remove (element, type, listener, useCapture) {
  const elementIndex = indexOf(elements, element);
  const target = targets[elementIndex];

  if (!target || !target.events) {
    return;
  }

  let wrappedListener = listener;
  let listeners;
  let listenerIndex;

  if (useAttachEvent) {
    listeners = attachedListeners[elementIndex];
    listenerIndex = indexOf(listeners.supplied, listener);
    wrappedListener = listeners.wrapped[listenerIndex];
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
        remove(element, type, target.events[type][i], !!useCapture);
      }
      return;
    }
    else {
      for (let i = 0; i < len; i++) {
        if (target.events[type][i] === listener) {
          element[removeEvent](on + type, wrappedListener, !!useCapture);
          target.events[type].splice(i, 1);

          if (useAttachEvent && listeners) {
            listeners.useCount[listenerIndex]--;
            if (listeners.useCount[listenerIndex] === 0) {
              listeners.supplied.splice(listenerIndex, 1);
              listeners.wrapped.splice(listenerIndex, 1);
              listeners.useCount.splice(listenerIndex, 1);
            }
          }

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
    attachedListeners.splice(elementIndex, 1);
  }
}

function addDelegate (selector, context, type, listener, useCapture) {
  if (!delegatedEvents[type]) {
    delegatedEvents[type] = {
      selectors: [],
      contexts : [],
      listeners: [],
    };

    // add delegate listener functions
    for (let i = 0; i < documents.length; i++) {
      add(documents[i], type, delegateListener);
      add(documents[i], type, delegateUseCapture, true);
    }
  }

  const delegated = delegatedEvents[type];
  let index;

  for (index = delegated.selectors.length - 1; index >= 0; index--) {
    if (delegated.selectors[index] === selector
        && delegated.contexts[index] === context) {
      break;
    }
  }

  if (index === -1) {
    index = delegated.selectors.length;

    delegated.selectors.push(selector);
    delegated.contexts .push(context);
    delegated.listeners.push([]);
  }

  // keep listener and useCapture flag
  delegated.listeners[index].push([listener, useCapture]);
}

function removeDelegate (selector, context, type, listener, useCapture) {
  const delegated = delegatedEvents[type];
  let matchFound = false;
  let index;

  if (!delegated) { return; }

  // count from last index of delegated to 0
  for (index = delegated.selectors.length - 1; index >= 0; index--) {
    // look for matching selector and context Node
    if (delegated.selectors[index] === selector
        && delegated.contexts[index] === context) {

      const listeners = delegated.listeners[index];

      // each item of the listeners array is an array: [function, useCaptureFlag]
      for (let i = listeners.length - 1; i >= 0; i--) {
        const fn = listeners[i][0];
        const useCap = listeners[i][1];

        // check if the listener functions and useCapture flags match
        if (fn === listener && useCap === useCapture) {
          // remove the listener from the array of listeners
          listeners.splice(i, 1);

          // if all listeners for this interactable have been removed
          // remove the interactable from the delegated arrays
          if (!listeners.length) {
            delegated.selectors.splice(index, 1);
            delegated.contexts .splice(index, 1);
            delegated.listeners.splice(index, 1);

            // remove delegate function from context
            remove(context, type, delegateListener);
            remove(context, type, delegateUseCapture, true);

            // remove the arrays if they are empty
            if (!delegated.selectors.length) {
              delegatedEvents[type] = null;
            }
          }

          // only remove one listener
          matchFound = true;
          break;
        }
      }

      if (matchFound) { break; }
    }
  }
}

// bound to the interactable context when a DOM event
// listener is added to a selector interactable
function delegateListener (event, useCapture) {
  const fakeEvent = {};
  const delegated = delegatedEvents[event.type];
  const eventTarget = (domUtils.getActualElement(event.path
    ? event.path[0]
    : event.target));
  let element = eventTarget;

  useCapture = useCapture? true: false;

  // duplicate the event so that currentTarget can be changed
  for (const prop in event) {
    fakeEvent[prop] = event[prop];
  }

  fakeEvent.originalEvent = event;
  fakeEvent.preventDefault = preventOriginalDefault;

  // climb up document tree looking for selector matches
  while (isType.isElement(element)) {
    for (let i = 0; i < delegated.selectors.length; i++) {
      const selector = delegated.selectors[i];
      const context = delegated.contexts[i];

      if (domUtils.matchesSelector(element, selector)
          && domUtils.nodeContains(context, eventTarget)
          && domUtils.nodeContains(context, element)) {

        const listeners = delegated.listeners[i];

        fakeEvent.currentTarget = element;

        for (let j = 0; j < listeners.length; j++) {
          if (listeners[j][1] === useCapture) {
            listeners[j][0](fakeEvent);
          }
        }
      }
    }

    element = domUtils.parentElement(element);
  }
}

function delegateUseCapture (event) {
  return delegateListener.call(this, event, true);
}

function preventDef () {
  this.returnValue = false;
}

function preventOriginalDefault () {
  this.originalEvent.preventDefault();
}

function stopProp () {
  this.cancelBubble = true;
}

function stopImmProp () {
  this.cancelBubble = true;
  this.immediatePropagationStopped = true;
}

module.exports = {
  add,
  remove,

  addDelegate,
  removeDelegate,

  delegateListener,
  delegateUseCapture,
  delegatedEvents,
  documents,

  useAttachEvent,

  _elements: elements,
  _targets: targets,
  _attachedListeners: attachedListeners,
};
