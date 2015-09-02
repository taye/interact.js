'use strict';

var arr = require('./arr'),
    isType = require('./isType'),
    domUtils = require('./domUtils'),
    indexOf  = arr.indexOf,
    contains = arr.contains,
    getWindow = require('./window').getWindow,

    useAttachEvent = ('attachEvent' in window) && !('addEventListener' in window),
    addEvent       = useAttachEvent?  'attachEvent': 'addEventListener',
    removeEvent    = useAttachEvent?  'detachEvent': 'removeEventListener',
    on             = useAttachEvent? 'on': '',

    elements          = [],
    targets           = [],
    attachedListeners = [],

    // {
    //      type: {
    //          selectors: ['selector', ...],
    //          contexts : [document, ...],
    //          listeners: [[listener, useCapture], ...]
    //      }
    //  }
    delegatedEvents = {},
    documents = [];


function add (element, type, listener, useCapture) {
    var elementIndex = indexOf(elements, element),
        target = targets[elementIndex];

    if (!target) {
        target = {
            events: {},
            typeCount: 0
        };

        elementIndex = elements.push(element) - 1;
        targets.push(target);

        attachedListeners.push((useAttachEvent ? {
                supplied: [],
                wrapped : [],
                useCount: []
            } : null));
    }

    if (!target.events[type]) {
        target.events[type] = [];
        target.typeCount++;
    }

    if (!contains(target.events[type], listener)) {
        var ret;

        if (useAttachEvent) {
            var listeners = attachedListeners[elementIndex],
                listenerIndex = indexOf(listeners.supplied, listener);

            var wrapped = listeners.wrapped[listenerIndex] || function (event) {
                if (!event.immediatePropagationStopped) {
                    event.target = event.srcElement;
                    event.currentTarget = element;

                    event.preventDefault = event.preventDefault || preventDef;
                    event.stopPropagation = event.stopPropagation || stopProp;
                    event.stopImmediatePropagation = event.stopImmediatePropagation || stopImmProp;

                    if (/mouse|click/.test(event.type)) {
                        event.pageX = event.clientX + getWindow(element).document.documentElement.scrollLeft;
                        event.pageY = event.clientY + getWindow(element).document.documentElement.scrollTop;
                    }

                    listener(event);
                }
            };

            ret = element[addEvent](on + type, wrapped, !!useCapture);

            if (listenerIndex === -1) {
                listeners.supplied.push(listener);
                listeners.wrapped.push(wrapped);
                listeners.useCount.push(1);
            }
            else {
                listeners.useCount[listenerIndex]++;
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
    var i,
        elementIndex = indexOf(elements, element),
        target = targets[elementIndex],
        listeners,
        listenerIndex,
        wrapped = listener;

    if (!target || !target.events) {
        return;
    }

    if (useAttachEvent) {
        listeners = attachedListeners[elementIndex];
        listenerIndex = indexOf(listeners.supplied, listener);
        wrapped = listeners.wrapped[listenerIndex];
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
        var len = target.events[type].length;

        if (listener === 'all') {
            for (i = 0; i < len; i++) {
                remove(element, type, target.events[type][i], !!useCapture);
            }
            return;
        } else {
            for (i = 0; i < len; i++) {
                if (target.events[type][i] === listener) {
                    element[removeEvent](on + type, wrapped, !!useCapture);
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
            listeners: []
        };

        // add delegate listener functions
        for (var i = 0; i < documents.length; i++) {
            add(documents[i], type, delegateListener);
            add(documents[i], type, delegateUseCapture, true);
        }
    }

    var delegated = delegatedEvents[type],
        index;

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
    var delegated = delegatedEvents[type],
        matchFound = false,
        index;

    if (!delegated) { return; }

    // count from last index of delegated to 0
    for (index = delegated.selectors.length - 1; index >= 0; index--) {
        // look for matching selector and context Node
        if (delegated.selectors[index] === selector
            && delegated.contexts[index] === context) {

            var listeners = delegated.listeners[index];

            // each item of the listeners array is an array: [function, useCaptureFlag]
            for (var i = listeners.length - 1; i >= 0; i--) {
                var fn = listeners[i][0],
                    useCap = listeners[i][1];

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
    var fakeEvent = {},
        delegated = delegatedEvents[event.type],
        eventTarget = domUtils.getActualElement(event.path
                                                   ? event.path[0]
                                                   : event.target),
        element = eventTarget;

    useCapture = useCapture? true: false;

    // duplicate the event so that currentTarget can be changed
    for (var prop in event) {
        fakeEvent[prop] = event[prop];
    }

    fakeEvent.originalEvent = event;
    fakeEvent.preventDefault = preventOriginalDefault;

    // climb up document tree looking for selector matches
    while (isType.isElement(element)) {
        for (var i = 0; i < delegated.selectors.length; i++) {
            var selector = delegated.selectors[i],
                context = delegated.contexts[i];

            if (domUtils.matchesSelector(element, selector)
                && domUtils.nodeContains(context, eventTarget)
                && domUtils.nodeContains(context, element)) {

                var listeners = delegated.listeners[i];

                fakeEvent.currentTarget = element;

                for (var j = 0; j < listeners.length; j++) {
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
    add: add,
    remove: remove,

    addDelegate: addDelegate,
    removeDelegate: removeDelegate,

    delegateListener: delegateListener,
    delegateUseCapture: delegateUseCapture,
    delegatedEvents: delegatedEvents,
    documents: documents,

    useAttachEvent: useAttachEvent,

    _elements: elements,
    _targets: targets,
    _attachedListeners: attachedListeners
};