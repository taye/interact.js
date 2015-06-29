/**
 * interact.js v1.2.4
 *
 * Copyright (c) 2012-2015 Taye Adeyemi <dev@taye.me>
 * Open source under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */

    'use strict';

    // return early if there's no window to work with (eg. Node.js)
    if (!require('./utils/window').window) { return; }

    var scope = require('./scope'),
        utils = require('./utils'),
        browser = utils.browser,
        events = require('./utils/events'),
        Interactable = require('./Interactable'),
        InteractEvent = require('./InteractEvent'),
        Interaction = require('./Interaction');

    scope.dynamicDrop     = false;

    // Things related to autoScroll
    scope.autoScroll = require('./autoScroll');

    // Less Precision with touch input
    scope.margin = browser.supportsTouch || browser.supportsPointerEvent? 20: 10;

    scope.pointerMoveTolerance = 1;

    // for ignoring browser's simulated mouse events
    scope.prevTouchTime = 0;

    // Allow this many interactions to happen simultaneously
    scope.maxInteractions = Infinity;

    scope.actionIsEnabled = {
        drag   : true,
        resize : true,
        gesture: true
    };

    // because Webkit and Opera still use 'mousewheel' event type
    scope.wheelEvent = 'onmousewheel' in scope.document? 'mousewheel': 'wheel';

    scope.eventTypes = [
        'down',
        'move',
        'up',
        'cancel',
        'tap',
        'doubletap',
        'hold'
    ];

    scope.globalEvents = {};

    scope.listeners = {};

    var interactionListeners = [
        'dragStart', 'dragMove', 'resizeStart', 'resizeMove', 'gestureStart', 'gestureMove',
        'pointerOver', 'pointerOut', 'pointerHover', 'selectorDown',
        'pointerDown', 'pointerMove', 'pointerUp', 'pointerCancel', 'pointerEnd',
        'addPointer', 'removePointer', 'recordPointer', 'autoScrollMove'
    ];

    scope.getOriginXY = function (interactable, element) {
        var origin = interactable
                ? interactable.options.origin
                : scope.defaultOptions.origin;

        if (origin === 'parent') {
            origin = utils.parentElement(element);
        }
        else if (origin === 'self') {
            origin = interactable.getRect(element);
        }
        else if (utils.trySelector(origin)) {
            origin = utils.closest(element, origin) || { x: 0, y: 0 };
        }

        if (utils.isFunction(origin)) {
            origin = origin(interactable && element);
        }

        if (utils.isElement(origin))  {
            origin = utils.getElementRect(origin);
        }

        origin.x = ('x' in origin)? origin.x : origin.left;
        origin.y = ('y' in origin)? origin.y : origin.top;

        return origin;
    };

    scope.inContext = function (interactable, element) {
        return interactable._context === element.ownerDocument
                || utils.nodeContains(interactable._context, element);
    };

    scope.testIgnore = function (interactable, interactableElement, element) {
        var ignoreFrom = interactable.options.ignoreFrom;

        if (!ignoreFrom || !utils.isElement(element)) { return false; }

        if (utils.isString(ignoreFrom)) {
            return utils.matchesUpTo(element, ignoreFrom, interactableElement);
        }
        else if (utils.isElement(ignoreFrom)) {
            return utils.nodeContains(ignoreFrom, element);
        }

        return false;
    };

    scope.testAllow = function (interactable, interactableElement, element) {
        var allowFrom = interactable.options.allowFrom;

        if (!allowFrom) { return true; }

        if (!utils.isElement(element)) { return false; }

        if (utils.isString(allowFrom)) {
            return utils.matchesUpTo(element, allowFrom, interactableElement);
        }
        else if (utils.isElement(allowFrom)) {
            return utils.nodeContains(allowFrom, element);
        }

        return false;
    };

    scope.checkAxis = function (axis, interactable) {
        if (!interactable) { return false; }

        var thisAxis = interactable.options.drag.axis;

        return (axis === 'xy' || thisAxis === 'xy' || thisAxis === axis);
    };

    scope.checkSnap = function (interactable, action) {
        var options = interactable.options;

        if (/^resize/.test(action)) {
            action = 'resize';
        }

        return options[action].snap && options[action].snap.enabled;
    };

    scope.checkRestrict = function (interactable, action) {
        var options = interactable.options;

        if (/^resize/.test(action)) {
            action = 'resize';
        }

        return  options[action].restrict && options[action].restrict.enabled;
    };

    scope.checkAutoScroll = function (interactable, action) {
        var options = interactable.options;

        if (/^resize/.test(action)) {
            action = 'resize';
        }

        return  options[action].autoScroll && options[action].autoScroll.enabled;
    };

    for (var i = 0, len = interactionListeners.length; i < len; i++) {
        var listenerName = interactionListeners[i];

        scope.listeners[listenerName] = Interaction.doOnInteractions(listenerName);
    }

    scope.interactables.indexOfElement = function indexOfElement (element, context) {
        context = context || scope.document;

        for (var i = 0; i < this.length; i++) {
            var interactable = this[i];

            if ((interactable.selector === element
                && (interactable._context === context))
                || (!interactable.selector && interactable._element === element)) {

                return i;
            }
        }
        return -1;
    };

    scope.interactables.get = function interactableGet (element, options) {
        return this[this.indexOfElement(element, options && options.context)];
    };

    scope.interactables.forEachSelector = function (callback) {
        for (var i = 0; i < this.length; i++) {
            var interactable = this[i];

            if (!interactable.selector) {
                continue;
            }

            var ret = callback(interactable, interactable.selector, interactable._context, i, this);

            if (ret !== undefined) {
                return ret;
            }
        }
    };

    /*\
     * interact
     [ method ]
     *
     * The methods of this variable can be used to set elements as
     * interactables and also to change various default settings.
     *
     * Calling it as a function and passing an element or a valid CSS selector
     * string returns an Interactable object which has various methods to
     * configure it.
     *
     - element (Element | string) The HTML or SVG Element to interact with or CSS selector
     = (object) An @Interactable
     *
     > Usage
     | interact(document.getElementById('draggable')).draggable(true);
     |
     | var rectables = interact('rect');
     | rectables
     |     .gesturable(true)
     |     .on('gesturemove', function (event) {
     |         // something cool...
     |     })
     |     .autoScroll(true);
    \*/
    function interact (element, options) {
        return scope.interactables.get(element, options) || new Interactable(element, options);
    }

    Interactable.prototype.snap = utils.warnOnce(Interactable.prototype.snap,
         'Interactable#snap is deprecated. See the new documentation for snapping at http://interactjs.io/docs/snapping');
    Interactable.prototype.restrict = utils.warnOnce(Interactable.prototype.restrict,
         'Interactable#restrict is deprecated. See the new documentation for resticting at http://interactjs.io/docs/restriction');
    Interactable.prototype.inertia = utils.warnOnce(Interactable.prototype.inertia,
         'Interactable#inertia is deprecated. See the new documentation for inertia at http://interactjs.io/docs/inertia');
    Interactable.prototype.autoScroll = utils.warnOnce(Interactable.prototype.autoScroll,
         'Interactable#autoScroll is deprecated. See the new documentation for autoScroll at http://interactjs.io/docs/#autoscroll');
    Interactable.prototype.squareResize = utils.warnOnce(Interactable.prototype.squareResize,
         'Interactable#squareResize is deprecated. See http://interactjs.io/docs/#resize-square');

    /*\
     * interact.isSet
     [ method ]
     *
     * Check if an element has been set
     - element (Element) The Element being searched for
     = (boolean) Indicates if the element or CSS selector was previously passed to interact
    \*/
    interact.isSet = function(element, options) {
        return scope.interactables.indexOfElement(element, options && options.context) !== -1;
    };

    /*\
     * interact.on
     [ method ]
     *
     * Adds a global listener for an InteractEvent or adds a DOM event to
     * `document`
     *
     - type       (string | array | object) The types of events to listen for
     - listener   (function) The function to be called on the given event(s)
     - useCapture (boolean) #optional useCapture flag for addEventListener
     = (object) interact
    \*/
    interact.on = function (type, listener, useCapture) {
        if (utils.isString(type) && type.search(' ') !== -1) {
            type = type.trim().split(/ +/);
        }

        if (utils.isArray(type)) {
            for (var i = 0; i < type.length; i++) {
                interact.on(type[i], listener, useCapture);
            }

            return interact;
        }

        if (utils.isObject(type)) {
            for (var prop in type) {
                interact.on(prop, type[prop], listener);
            }

            return interact;
        }

        // if it is an InteractEvent type, add listener to globalEvents
        if (utils.contains(scope.eventTypes, type)) {
            // if this type of event was never bound
            if (!scope.globalEvents[type]) {
                scope.globalEvents[type] = [listener];
            }
            else {
                scope.globalEvents[type].push(listener);
            }
        }
        // If non InteractEvent type, addEventListener to document
        else {
            events.add(scope.document, type, listener, useCapture);
        }

        return interact;
    };

    /*\
     * interact.off
     [ method ]
     *
     * Removes a global InteractEvent listener or DOM event from `document`
     *
     - type       (string | array | object) The types of events that were listened for
     - listener   (function) The listener function to be removed
     - useCapture (boolean) #optional useCapture flag for removeEventListener
     = (object) interact
     \*/
    interact.off = function (type, listener, useCapture) {
        if (utils.isString(type) && type.search(' ') !== -1) {
            type = type.trim().split(/ +/);
        }

        if (utils.isArray(type)) {
            for (var i = 0; i < type.length; i++) {
                interact.off(type[i], listener, useCapture);
            }

            return interact;
        }

        if (utils.isObject(type)) {
            for (var prop in type) {
                interact.off(prop, type[prop], listener);
            }

            return interact;
        }

        if (!utils.contains(scope.eventTypes, type)) {
            events.remove(scope.document, type, listener, useCapture);
        }
        else {
            var index;

            if (type in scope.globalEvents
                && (index = utils.indexOf(scope.globalEvents[type], listener)) !== -1) {
                scope.globalEvents[type].splice(index, 1);
            }
        }

        return interact;
    };

    /*\
     * interact.enableDragging
     [ method ]
     *
     * Deprecated.
     *
     * Returns or sets whether dragging is enabled for any Interactables
     *
     - newValue (boolean) #optional `true` to allow the action; `false` to disable action for all Interactables
     = (boolean | object) The current setting or interact
    \*/
    interact.enableDragging = utils.warnOnce(function (newValue) {
        if (newValue !== null && newValue !== undefined) {
            scope.actionIsEnabled.drag = newValue;

            return interact;
        }
        return scope.actionIsEnabled.drag;
    }, 'interact.enableDragging is deprecated and will soon be removed.');

    /*\
     * interact.enableResizing
     [ method ]
     *
     * Deprecated.
     *
     * Returns or sets whether resizing is enabled for any Interactables
     *
     - newValue (boolean) #optional `true` to allow the action; `false` to disable action for all Interactables
     = (boolean | object) The current setting or interact
    \*/
    interact.enableResizing = utils.warnOnce(function (newValue) {
        if (newValue !== null && newValue !== undefined) {
            scope.actionIsEnabled.resize = newValue;

            return interact;
        }
        return scope.actionIsEnabled.resize;
    }, 'interact.enableResizing is deprecated and will soon be removed.');

    /*\
     * interact.enableGesturing
     [ method ]
     *
     * Deprecated.
     *
     * Returns or sets whether gesturing is enabled for any Interactables
     *
     - newValue (boolean) #optional `true` to allow the action; `false` to disable action for all Interactables
     = (boolean | object) The current setting or interact
    \*/
    interact.enableGesturing = utils.warnOnce(function (newValue) {
        if (newValue !== null && newValue !== undefined) {
            scope.actionIsEnabled.gesture = newValue;

            return interact;
        }
        return scope.actionIsEnabled.gesture;
    }, 'interact.enableGesturing is deprecated and will soon be removed.');

    interact.eventTypes = scope.eventTypes;

    /*\
     * interact.debug
     [ method ]
     *
     * Returns an object which exposes internal data
     = (object) An object with properties that outline the current state and expose internal functions and variables
    \*/
    interact.debug = function () {
        return scope;
    };

    // expose the functions used to calculate multi-touch properties
    interact.getTouchAverage  = utils.touchAverage;
    interact.getTouchBBox     = utils.touchBBox;
    interact.getTouchDistance = utils.touchDistance;
    interact.getTouchAngle    = utils.touchAngle;

    interact.getElementRect   = utils.getElementRect;
    interact.matchesSelector  = utils.matchesSelector;
    interact.closest          = utils.closest;

    /*\
     * interact.margin
     [ method ]
     *
     * Returns or sets the margin for autocheck resizing used in
     * @Interactable.getAction. That is the distance from the bottom and right
     * edges of an element clicking in which will start resizing
     *
     - newValue (number) #optional
     = (number | interact) The current margin value or interact
    \*/
    interact.margin = function (newvalue) {
        if (utils.isNumber(newvalue)) {
            scope.margin = newvalue;

            return interact;
        }
        return scope.margin;
    };

    /*\
     * interact.supportsTouch
     [ method ]
     *
     = (boolean) Whether or not the browser supports touch input
    \*/
    interact.supportsTouch = function () {
        return browser.supportsTouch;
    };

    /*\
     * interact.supportsPointerEvent
     [ method ]
     *
     = (boolean) Whether or not the browser supports PointerEvents
    \*/
    interact.supportsPointerEvent = function () {
        return browser.supportsPointerEvent;
    };

    /*\
     * interact.stop
     [ method ]
     *
     * Cancels all interactions (end events are not fired)
     *
     - event (Event) An event on which to call preventDefault()
     = (object) interact
    \*/
    interact.stop = function (event) {
        for (var i = scope.interactions.length - 1; i > 0; i--) {
            scope.interactions[i].stop(event);
        }

        return interact;
    };

    /*\
     * interact.dynamicDrop
     [ method ]
     *
     * Returns or sets whether the dimensions of dropzone elements are
     * calculated on every dragmove or only on dragstart for the default
     * dropChecker
     *
     - newValue (boolean) #optional True to check on each move. False to check only before start
     = (boolean | interact) The current setting or interact
    \*/
    interact.dynamicDrop = function (newValue) {
        if (utils.isBool(newValue)) {
            //if (dragging && dynamicDrop !== newValue && !newValue) {
                //calcRects(dropzones);
            //}

            scope.dynamicDrop = newValue;

            return interact;
        }
        return scope.dynamicDrop;
    };

    /*\
     * interact.pointerMoveTolerance
     [ method ]
     * Returns or sets the distance the pointer must be moved before an action
     * sequence occurs. This also affects tolerance for tap events.
     *
     - newValue (number) #optional The movement from the start position must be greater than this value
     = (number | Interactable) The current setting or interact
    \*/
    interact.pointerMoveTolerance = function (newValue) {
        if (utils.isNumber(newValue)) {
            scope.pointerMoveTolerance = newValue;

            return this;
        }

        return scope.pointerMoveTolerance;
    };

    /*\
     * interact.maxInteractions
     [ method ]
     **
     * Returns or sets the maximum number of concurrent interactions allowed.
     * By default only 1 interaction is allowed at a time (for backwards
     * compatibility). To allow multiple interactions on the same Interactables
     * and elements, you need to enable it in the draggable, resizable and
     * gesturable `'max'` and `'maxPerElement'` options.
     **
     - newValue (number) #optional Any number. newValue <= 0 means no interactions.
    \*/
    interact.maxInteractions = function (newValue) {
        if (utils.isNumber(newValue)) {
            scope.maxInteractions = newValue;

            return this;
        }

        return scope.maxInteractions;
    };

    interact.createSnapGrid = function (grid) {
        return function (x, y) {
            var offsetX = 0,
                offsetY = 0;

            if (utils.isObject(grid.offset)) {
                offsetX = grid.offset.x;
                offsetY = grid.offset.y;
            }

            var gridx = Math.round((x - offsetX) / grid.x),
                gridy = Math.round((y - offsetY) / grid.y),

                newX = gridx * grid.x + offsetX,
                newY = gridy * grid.y + offsetY;

            return {
                x: newX,
                y: newY,
                range: grid.range
            };
        };
    };

    function endAllInteractions (event) {
        for (var i = 0; i < scope.interactions.length; i++) {
            scope.interactions[i].pointerEnd(event, event);
        }
    }

    function listenToDocument (doc) {
        if (utils.contains(scope.documents, doc)) { return; }

        var win = doc.defaultView || doc.parentWindow;

        // add delegate event listener
        for (var eventType in scope.delegatedEvents) {
            events.add(doc, eventType, events.delegateListener);
            events.add(doc, eventType, events.delegateUseCapture, true);
        }

        if (scope.PointerEvent) {
            if (scope.PointerEvent === win.MSPointerEvent) {
                scope.pEventTypes = {
                    up: 'MSPointerUp', down: 'MSPointerDown', over: 'mouseover',
                    out: 'mouseout', move: 'MSPointerMove', cancel: 'MSPointerCancel' };
            }
            else {
                scope.pEventTypes = {
                    up: 'pointerup', down: 'pointerdown', over: 'pointerover',
                    out: 'pointerout', move: 'pointermove', cancel: 'pointercancel' };
            }

            events.add(doc, scope.pEventTypes.down  , scope.listeners.selectorDown );
            events.add(doc, scope.pEventTypes.move  , scope.listeners.pointerMove  );
            events.add(doc, scope.pEventTypes.over  , scope.listeners.pointerOver  );
            events.add(doc, scope.pEventTypes.out   , scope.listeners.pointerOut   );
            events.add(doc, scope.pEventTypes.up    , scope.listeners.pointerUp    );
            events.add(doc, scope.pEventTypes.cancel, scope.listeners.pointerCancel);

            // autoscroll
            events.add(doc, scope.pEventTypes.move, scope.listeners.autoScrollMove);
        }
        else {
            events.add(doc, 'mousedown', scope.listeners.selectorDown);
            events.add(doc, 'mousemove', scope.listeners.pointerMove );
            events.add(doc, 'mouseup'  , scope.listeners.pointerUp   );
            events.add(doc, 'mouseover', scope.listeners.pointerOver );
            events.add(doc, 'mouseout' , scope.listeners.pointerOut  );

            events.add(doc, 'touchstart' , scope.listeners.selectorDown );
            events.add(doc, 'touchmove'  , scope.listeners.pointerMove  );
            events.add(doc, 'touchend'   , scope.listeners.pointerUp    );
            events.add(doc, 'touchcancel', scope.listeners.pointerCancel);

            // autoscroll
            events.add(doc, 'mousemove', scope.listeners.autoScrollMove);
            events.add(doc, 'touchmove', scope.listeners.autoScrollMove);
        }

        events.add(win, 'blur', endAllInteractions);

        try {
            if (win.frameElement) {
                var parentDoc = win.frameElement.ownerDocument,
                    parentWindow = parentDoc.defaultView;

                events.add(parentDoc   , 'mouseup'      , scope.listeners.pointerEnd);
                events.add(parentDoc   , 'touchend'     , scope.listeners.pointerEnd);
                events.add(parentDoc   , 'touchcancel'  , scope.listeners.pointerEnd);
                events.add(parentDoc   , 'pointerup'    , scope.listeners.pointerEnd);
                events.add(parentDoc   , 'MSPointerUp'  , scope.listeners.pointerEnd);
                events.add(parentWindow, 'blur'         , endAllInteractions );
            }
        }
        catch (error) {
            interact.windowParentError = error;
        }

        if (events.useAttachEvent) {
            // For IE's lack of Event#preventDefault
            events.add(doc, 'selectstart', function (event) {
                var interaction = scope.interactions[0];

                if (interaction.currentAction()) {
                    interaction.checkAndPreventDefault(event);
                }
            });

            // For IE's bad dblclick event sequence
            events.add(doc, 'dblclick', Interaction.doOnInteractions('ie8Dblclick'));
        }

        scope.documents.push(doc);
        events.documents.push(doc);
    }

    listenToDocument(scope.document);

    scope.interact = interact;
    scope.Interactable = Interactable;
    scope.Interaction = Interaction;
    scope.InteractEvent = InteractEvent;
    scope.listenToDocument = scope.listenToDocument;

    module.exports = interact;

    require('./actions/resize');
    require('./actions/drag');
    require('./actions/gesture');
