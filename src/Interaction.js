'use strict';

var scope = require('./scope');
var utils = require('./utils');
var animationFrame = utils.raf;
var InteractEvent = require('./InteractEvent');
var events = require('./utils/events');
var browser = require('./utils/browser');

function Interaction () {
    this.target          = null; // current interactable being interacted with
    this.element         = null; // the target element of the interactable
    this.dropTarget      = null; // the dropzone a drag target might be dropped into
    this.dropElement     = null; // the element at the time of checking
    this.prevDropTarget  = null; // the dropzone that was recently dragged away from
    this.prevDropElement = null; // the element at the time of checking

    this.prepared        = {     // action that's ready to be fired on next move event
        name : null,
        axis : null,
        edges: null
    };

    this.matches         = [];   // all selectors that are matched by target element
    this.matchElements   = [];   // corresponding elements

    this.inertiaStatus = {
        active       : false,
        smoothEnd    : false,

        startEvent: null,
        upCoords: {},

        xe: 0, ye: 0,
        sx: 0, sy: 0,

        t0: 0,
        vx0: 0, vys: 0,
        duration: 0,

        resumeDx: 0,
        resumeDy: 0,

        lambda_v0: 0,
        one_ve_v0: 0,
        i  : null
    };

    if (scope.isFunction(Function.prototype.bind)) {
        this.boundInertiaFrame = this.inertiaFrame.bind(this);
        this.boundSmoothEndFrame = this.smoothEndFrame.bind(this);
    }
    else {
        var that = this;

        this.boundInertiaFrame = function () { return that.inertiaFrame(); };
        this.boundSmoothEndFrame = function () { return that.smoothEndFrame(); };
    }

    this.activeDrops = {
        dropzones: [],      // the dropzones that are mentioned below
        elements : [],      // elements of dropzones that accept the target draggable
        rects    : []       // the rects of the elements mentioned above
    };

    // keep track of added pointers
    this.pointers    = [];
    this.pointerIds  = [];
    this.downTargets = [];
    this.downTimes   = [];
    this.holdTimers  = [];

    // Previous native pointer move event coordinates
    this.prevCoords = {
        page     : { x: 0, y: 0 },
        client   : { x: 0, y: 0 },
        timeStamp: 0
    };
    // current native pointer move event coordinates
    this.curCoords = {
        page     : { x: 0, y: 0 },
        client   : { x: 0, y: 0 },
        timeStamp: 0
    };

    // Starting InteractEvent pointer coordinates
    this.startCoords = {
        page     : { x: 0, y: 0 },
        client   : { x: 0, y: 0 },
        timeStamp: 0
    };

    // Change in coordinates and time of the pointer
    this.pointerDelta = {
        page     : { x: 0, y: 0, vx: 0, vy: 0, speed: 0 },
        client   : { x: 0, y: 0, vx: 0, vy: 0, speed: 0 },
        timeStamp: 0
    };

    this.downEvent   = null;    // pointerdown/mousedown/touchstart event
    this.downPointer = {};

    this._eventTarget    = null;
    this._curEventTarget = null;

    this.prevEvent = null;      // previous action event
    this.tapTime   = 0;         // time of the most recent tap event
    this.prevTap   = null;

    this.startOffset    = { left: 0, right: 0, top: 0, bottom: 0 };
    this.restrictOffset = { left: 0, right: 0, top: 0, bottom: 0 };
    this.snapOffsets    = [];

    this.gesture = {
        start: { x: 0, y: 0 },

        startDistance: 0,   // distance between two touches of touchStart
        prevDistance : 0,
        distance     : 0,

        scale: 1,           // gesture.distance / gesture.startDistance

        startAngle: 0,      // angle of line joining two touches
        prevAngle : 0       // angle of the previous gesture event
    };

    this.snapStatus = {
        x       : 0, y       : 0,
        dx      : 0, dy      : 0,
        realX   : 0, realY   : 0,
        snappedX: 0, snappedY: 0,
        targets : [],
        locked  : false,
        changed : false
    };

    this.restrictStatus = {
        dx         : 0, dy         : 0,
        restrictedX: 0, restrictedY: 0,
        snap       : null,
        restricted : false,
        changed    : false
    };

    this.restrictStatus.snap = this.snapStatus;

    this.pointerIsDown   = false;
    this.pointerWasMoved = false;
    this.gesturing       = false;
    this.dragging        = false;
    this.resizing        = false;
    this.resizeAxes      = 'xy';

    this.mouse = false;

    scope.interactions.push(this);
}

// Check if action is enabled globally and the current target supports it
// If so, return the validated action. Otherwise, return null
function validateAction (action, interactable) {
    if (!scope.isObject(action)) { return null; }

    var actionName = action.name,
        options = interactable.options;

    if ((  (actionName  === 'resize'   && options.resize.enabled )
        || (actionName      === 'drag'     && options.drag.enabled  )
        || (actionName      === 'gesture'  && options.gesture.enabled))
        && scope.actionIsEnabled[actionName]) {

        if (actionName === 'resize' || actionName === 'resizeyx') {
            actionName = 'resizexy';
        }

        return action;
    }
    return null;
}

function getActionCursor (action) {
    var cursor = '';

    if (action.name === 'drag') {
        cursor =  scope.actionCursors.drag;
    }
    if (action.name === 'resize') {
        if (action.axis) {
            cursor =  scope.actionCursors[action.name + action.axis];
        }
        else if (action.edges) {
            var cursorKey = 'resize',
                edgeNames = ['top', 'bottom', 'left', 'right'];

            for (var i = 0; i < 4; i++) {
                if (action.edges[edgeNames[i]]) {
                    cursorKey += edgeNames[i];
                }
            }

            cursor = scope.actionCursors[cursorKey];
        }
    }

    return cursor;
}

function preventOriginalDefault () {
    this.originalEvent.preventDefault();
}

Interaction.prototype = {
    getPageXY  : function (pointer, xy) { return   utils.getPageXY(pointer, xy, this); },
    getClientXY: function (pointer, xy) { return utils.getClientXY(pointer, xy, this); },
    setEventXY : function (target, ptr) { return  utils.setEventXY(target, ptr, this); },

    pointerOver: function (pointer, event, eventTarget) {
        if (this.prepared.name || !this.mouse) { return; }

        var curMatches = [],
            curMatchElements = [],
            prevTargetElement = this.element;

        this.addPointer(pointer);

        if (this.target
            && (scope.testIgnore(this.target, this.element, eventTarget)
            || !scope.testAllow(this.target, this.element, eventTarget))) {
            // if the eventTarget should be ignored or shouldn't be allowed
            // clear the previous target
            this.target = null;
            this.element = null;
            this.matches = [];
            this.matchElements = [];
        }

        var elementInteractable = scope.interactables.get(eventTarget),
            elementAction = (elementInteractable
            && !scope.testIgnore(elementInteractable, eventTarget, eventTarget)
            && scope.testAllow(elementInteractable, eventTarget, eventTarget)
            && validateAction(
                elementInteractable.getAction(pointer, event, this, eventTarget),
                elementInteractable));

        if (elementAction && !scope.withinInteractionLimit(elementInteractable, eventTarget, elementAction)) {
            elementAction = null;
        }

        function pushCurMatches (interactable, selector) {
            if (interactable
                && scope.inContext(interactable, eventTarget)
                && !scope.testIgnore(interactable, eventTarget, eventTarget)
                && scope.testAllow(interactable, eventTarget, eventTarget)
                && scope.matchesSelector(eventTarget, selector)) {

                curMatches.push(interactable);
                curMatchElements.push(eventTarget);
            }
        }

        if (elementAction) {
            this.target = elementInteractable;
            this.element = eventTarget;
            this.matches = [];
            this.matchElements = [];
        }
        else {
            scope.interactables.forEachSelector(pushCurMatches);

            if (this.validateSelector(pointer, event, curMatches, curMatchElements)) {
                this.matches = curMatches;
                this.matchElements = curMatchElements;

                this.pointerHover(pointer, event, this.matches, this.matchElements);
                events.add(eventTarget,
                    scope.PointerEvent? scope.pEventTypes.move : 'mousemove',
                    scope.listeners.pointerHover);
            }
            else if (this.target) {
                if (scope.nodeContains(prevTargetElement, eventTarget)) {
                    this.pointerHover(pointer, event, this.matches, this.matchElements);
                    events.add(this.element,
                        scope.PointerEvent? scope.pEventTypes.move : 'mousemove',
                        scope.listeners.pointerHover);
                }
                else {
                    this.target = null;
                    this.element = null;
                    this.matches = [];
                    this.matchElements = [];
                }
            }
        }
    },

    // Check what action would be performed on pointerMove target if a mouse
    // button were pressed and change the cursor accordingly
    pointerHover: function (pointer, event, eventTarget, curEventTarget, matches, matchElements) {
        var target = this.target;

        if (!this.prepared.name && this.mouse) {

            var action;

            // update pointer coords for defaultActionChecker to use
            this.setEventXY(this.curCoords, pointer);

            if (matches) {
                action = this.validateSelector(pointer, event, matches, matchElements);
            }
            else if (target) {
                action = validateAction(target.getAction(this.pointers[0], event, this, this.element), this.target);
            }

            if (target && target.options.styleCursor) {
                if (action) {
                    target._doc.documentElement.style.cursor = getActionCursor(action);
                }
                else {
                    target._doc.documentElement.style.cursor = '';
                }
            }
        }
        else if (this.prepared.name) {
            this.checkAndPreventDefault(event, target, this.element);
        }
    },

    pointerOut: function (pointer, event, eventTarget) {
        if (this.prepared.name) { return; }

        // Remove temporary event listeners for selector Interactables
        if (!scope.interactables.get(eventTarget)) {
            events.remove(eventTarget,
                scope.PointerEvent? scope.pEventTypes.move : 'mousemove',
                scope.listeners.pointerHover);
        }

        if (this.target && this.target.options.styleCursor && !this.interacting()) {
            this.target._doc.documentElement.style.cursor = '';
        }
    },

    selectorDown: function (pointer, event, eventTarget, curEventTarget) {
        var that = this,
        // copy event to be used in timeout for IE8
            eventCopy = events.useAttachEvent? utils.extend({}, event) : event,
            element = eventTarget,
            pointerIndex = this.addPointer(pointer),
            action;

        this.holdTimers[pointerIndex] = setTimeout(function () {
            that.pointerHold(events.useAttachEvent? eventCopy : pointer, eventCopy, eventTarget, curEventTarget);
        }, scope.defaultOptions._holdDuration);

        this.pointerIsDown = true;

        // Check if the down event hits the current inertia target
        if (this.inertiaStatus.active && this.target.selector) {
            // climb up the DOM tree from the event target
            while (utils.isElement(element)) {

                // if this element is the current inertia target element
                if (element === this.element
                        // and the prospective action is the same as the ongoing one
                    && validateAction(this.target.getAction(pointer, event, this, this.element), this.target).name === this.prepared.name) {

                    // stop inertia so that the next move will be a normal one
                    animationFrame.cancel(this.inertiaStatus.i);
                    this.inertiaStatus.active = false;

                    this.collectEventTargets(pointer, event, eventTarget, 'down');
                    return;
                }
                element = scope.parentElement(element);
            }
        }

        // do nothing if interacting
        if (this.interacting()) {
            this.collectEventTargets(pointer, event, eventTarget, 'down');
            return;
        }

        function pushMatches (interactable, selector, context) {
            var elements = scope.ie8MatchesSelector
                ? context.querySelectorAll(selector)
                : undefined;

            if (scope.inContext(interactable, element)
                && !scope.testIgnore(interactable, element, eventTarget)
                && scope.testAllow(interactable, element, eventTarget)
                && scope.matchesSelector(element, selector, elements)) {

                that.matches.push(interactable);
                that.matchElements.push(element);
            }
        }

        // update pointer coords for defaultActionChecker to use
        this.setEventXY(this.curCoords, pointer);
        this.downEvent = event;

        while (utils.isElement(element) && !action) {
            this.matches = [];
            this.matchElements = [];

            scope.interactables.forEachSelector(pushMatches);

            action = this.validateSelector(pointer, event, this.matches, this.matchElements);
            element = scope.parentElement(element);
        }

        if (action) {
            this.prepared.name  = action.name;
            this.prepared.axis  = action.axis;
            this.prepared.edges = action.edges;

            this.collectEventTargets(pointer, event, eventTarget, 'down');

            return this.pointerDown(pointer, event, eventTarget, curEventTarget, action);
        }
        else {
            // do these now since pointerDown isn't being called from here
            this.downTimes[pointerIndex] = new Date().getTime();
            this.downTargets[pointerIndex] = eventTarget;
            utils.extend(this.downPointer, pointer);

            utils.copyCoords(this.prevCoords, this.curCoords);
            this.pointerWasMoved = false;
        }

        this.collectEventTargets(pointer, event, eventTarget, 'down');
    },

    // Determine action to be performed on next pointerMove and add appropriate
    // style and event Listeners
    pointerDown: function (pointer, event, eventTarget, curEventTarget, forceAction) {
        if (!forceAction && !this.inertiaStatus.active && this.pointerWasMoved && this.prepared.name) {
            this.checkAndPreventDefault(event, this.target, this.element);

            return;
        }

        this.pointerIsDown = true;
        this.downEvent = event;

        var pointerIndex = this.addPointer(pointer),
            action;

        // If it is the second touch of a multi-touch gesture, keep the target
        // the same if a target was set by the first touch
        // Otherwise, set the target if there is no action prepared
        if ((this.pointerIds.length < 2 && !this.target) || !this.prepared.name) {

            var interactable = scope.interactables.get(curEventTarget);

            if (interactable
                && !scope.testIgnore(interactable, curEventTarget, eventTarget)
                && scope.testAllow(interactable, curEventTarget, eventTarget)
                && (action = validateAction(forceAction || interactable.getAction(pointer, event, this, curEventTarget), interactable, eventTarget))
                && scope.withinInteractionLimit(interactable, curEventTarget, action)) {
                this.target = interactable;
                this.element = curEventTarget;
            }
        }

        var target = this.target,
            options = target && target.options;

        if (target && (forceAction || !this.prepared.name)) {
            action = action || validateAction(forceAction || target.getAction(pointer, event, this, curEventTarget), target, this.element);

            this.setEventXY(this.startCoords);

            if (!action) { return; }

            if (options.styleCursor) {
                target._doc.documentElement.style.cursor = getActionCursor(action);
            }

            this.resizeAxes = action.name === 'resize'? action.axis : null;

            if (action === 'gesture' && this.pointerIds.length < 2) {
                action = null;
            }

            this.prepared.name  = action.name;
            this.prepared.axis  = action.axis;
            this.prepared.edges = action.edges;

            this.snapStatus.snappedX = this.snapStatus.snappedY =
                this.restrictStatus.restrictedX = this.restrictStatus.restrictedY = NaN;

            this.downTimes[pointerIndex] = new Date().getTime();
            this.downTargets[pointerIndex] = eventTarget;
            utils.extend(this.downPointer, pointer);

            this.setEventXY(this.prevCoords);
            this.pointerWasMoved = false;

            this.checkAndPreventDefault(event, target, this.element);
        }
        // if inertia is active try to resume action
        else if (this.inertiaStatus.active
            && curEventTarget === this.element
            && validateAction(target.getAction(pointer, event, this, this.element), target).name === this.prepared.name) {

            animationFrame.cancel(this.inertiaStatus.i);
            this.inertiaStatus.active = false;

            this.checkAndPreventDefault(event, target, this.element);
        }
    },

    setModifications: function (coords, preEnd) {
        var target         = this.target,
            shouldMove     = true,
            shouldSnap     = scope.checkSnap(target, this.prepared.name)     && (!target.options[this.prepared.name].snap.endOnly     || preEnd),
            shouldRestrict = scope.checkRestrict(target, this.prepared.name) && (!target.options[this.prepared.name].restrict.endOnly || preEnd);

        if (shouldSnap    ) { this.setSnapping   (coords); } else { this.snapStatus    .locked     = false; }
        if (shouldRestrict) { this.setRestriction(coords); } else { this.restrictStatus.restricted = false; }

        if (shouldSnap && this.snapStatus.locked && !this.snapStatus.changed) {
            shouldMove = shouldRestrict && this.restrictStatus.restricted && this.restrictStatus.changed;
        }
        else if (shouldRestrict && this.restrictStatus.restricted && !this.restrictStatus.changed) {
            shouldMove = false;
        }

        return shouldMove;
    },

    setStartOffsets: function (action, interactable, element) {
        var rect = interactable.getRect(element),
            origin = scope.getOriginXY(interactable, element),
            snap = interactable.options[this.prepared.name].snap,
            restrict = interactable.options[this.prepared.name].restrict,
            width, height;

        if (rect) {
            this.startOffset.left = this.startCoords.page.x - rect.left;
            this.startOffset.top  = this.startCoords.page.y - rect.top;

            this.startOffset.right  = rect.right  - this.startCoords.page.x;
            this.startOffset.bottom = rect.bottom - this.startCoords.page.y;

            if ('width' in rect) { width = rect.width; }
            else { width = rect.right - rect.left; }
            if ('height' in rect) { height = rect.height; }
            else { height = rect.bottom - rect.top; }
        }
        else {
            this.startOffset.left = this.startOffset.top = this.startOffset.right = this.startOffset.bottom = 0;
        }

        this.snapOffsets.splice(0);

        var snapOffset = snap && snap.offset === 'startCoords'
            ? {
            x: this.startCoords.page.x - origin.x,
            y: this.startCoords.page.y - origin.y
        }
            : snap && snap.offset || { x: 0, y: 0 };

        if (rect && snap && snap.relativePoints && snap.relativePoints.length) {
            for (var i = 0; i < snap.relativePoints.length; i++) {
                this.snapOffsets.push({
                    x: this.startOffset.left - (width  * snap.relativePoints[i].x) + snapOffset.x,
                    y: this.startOffset.top  - (height * snap.relativePoints[i].y) + snapOffset.y
                });
            }
        }
        else {
            this.snapOffsets.push(snapOffset);
        }

        if (rect && restrict.elementRect) {
            this.restrictOffset.left = this.startOffset.left - (width  * restrict.elementRect.left);
            this.restrictOffset.top  = this.startOffset.top  - (height * restrict.elementRect.top);

            this.restrictOffset.right  = this.startOffset.right  - (width  * (1 - restrict.elementRect.right));
            this.restrictOffset.bottom = this.startOffset.bottom - (height * (1 - restrict.elementRect.bottom));
        }
        else {
            this.restrictOffset.left = this.restrictOffset.top = this.restrictOffset.right = this.restrictOffset.bottom = 0;
        }
    },

    /*\
     * Interaction.start
     [ method ]
     *
     * Start an action with the given Interactable and Element as tartgets. The
     * action must be enabled for the target Interactable and an appropriate number
     * of pointers must be held down – 1 for drag/resize, 2 for gesture.
     *
     * Use it with `interactable.<action>able({ manualStart: false })` to always
     * [start actions manually](https://github.com/taye/interact.js/issues/114)
     *
     - action       (object)  The action to be performed - drag, resize, etc.
     - interactable (Interactable) The Interactable to target
     - element      (Element) The DOM Element to target
     = (object) interact
     **
     | interact(target)
     |   .draggable({
     |     // disable the default drag start by down->move
     |     manualStart: true
     |   })
     |   // start dragging after the user holds the pointer down
     |   .on('hold', function (event) {
     |     var interaction = event.interaction;
     |
     |     if (!interaction.interacting()) {
     |       interaction.start({ name: 'drag' },
     |                         event.interactable,
     |                         event.currentTarget);
     |     }
     | });
     \*/
    start: function (action, interactable, element) {
        if (this.interacting()
            || !this.pointerIsDown
            || this.pointerIds.length < (action.name === 'gesture'? 2 : 1)) {
            return;
        }

        // if this interaction had been removed after stopping
        // add it back
        if (scope.indexOf(scope.interactions, this) === -1) {
            scope.interactions.push(this);
        }

        this.prepared.name  = action.name;
        this.prepared.axis  = action.axis;
        this.prepared.edges = action.edges;
        this.target         = interactable;
        this.element        = element;

        this.setEventXY(this.startCoords);
        this.setStartOffsets(action.name, interactable, element);
        this.setModifications(this.startCoords.page);

        this.prevEvent = this[this.prepared.name + 'Start'](this.downEvent);
    },

    pointerMove: function (pointer, event, eventTarget, curEventTarget, preEnd) {
        this.recordPointer(pointer);

        this.setEventXY(this.curCoords, (pointer instanceof InteractEvent)
            ? this.inertiaStatus.startEvent
            : undefined);

        var duplicateMove = (this.curCoords.page.x === this.prevCoords.page.x
        && this.curCoords.page.y === this.prevCoords.page.y
        && this.curCoords.client.x === this.prevCoords.client.x
        && this.curCoords.client.y === this.prevCoords.client.y);

        var dx, dy,
            pointerIndex = this.mouse? 0 : scope.indexOf(this.pointerIds, utils.getPointerId(pointer));

        // register movement greater than pointerMoveTolerance
        if (this.pointerIsDown && !this.pointerWasMoved) {
            dx = this.curCoords.client.x - this.startCoords.client.x;
            dy = this.curCoords.client.y - this.startCoords.client.y;

            this.pointerWasMoved = utils.hypot(dx, dy) > scope.pointerMoveTolerance;
        }

        if (!duplicateMove && (!this.pointerIsDown || this.pointerWasMoved)) {
            if (this.pointerIsDown) {
                clearTimeout(this.holdTimers[pointerIndex]);
            }

            this.collectEventTargets(pointer, event, eventTarget, 'move');
        }

        if (!this.pointerIsDown) { return; }

        if (duplicateMove && this.pointerWasMoved && !preEnd) {
            this.checkAndPreventDefault(event, this.target, this.element);
            return;
        }

        // set pointer coordinate, time changes and speeds
        utils.setEventDeltas(this.pointerDelta, this.prevCoords, this.curCoords);

        if (!this.prepared.name) { return; }

        if (this.pointerWasMoved
                // ignore movement while inertia is active
            && (!this.inertiaStatus.active || (pointer instanceof InteractEvent && /inertiastart/.test(pointer.type)))) {

            // if just starting an action, calculate the pointer speed now
            if (!this.interacting()) {
                utils.setEventDeltas(this.pointerDelta, this.prevCoords, this.curCoords);

                // check if a drag is in the correct axis
                if (this.prepared.name === 'drag') {
                    var absX = Math.abs(dx),
                        absY = Math.abs(dy),
                        targetAxis = this.target.options.drag.axis,
                        axis = (absX > absY ? 'x' : absX < absY ? 'y' : 'xy');

                    // if the movement isn't in the axis of the interactable
                    if (axis !== 'xy' && targetAxis !== 'xy' && targetAxis !== axis) {
                        // cancel the prepared action
                        this.prepared.name = null;

                        // then try to get a drag from another ineractable

                        var element = eventTarget;

                        // check element interactables
                        while (utils.isElement(element)) {
                            var elementInteractable = scope.interactables.get(element);

                            if (elementInteractable
                                && elementInteractable !== this.target
                                && !elementInteractable.options.drag.manualStart
                                && elementInteractable.getAction(this.downPointer, this.downEvent, this, element).name === 'drag'
                                && scope.checkAxis(axis, elementInteractable)) {

                                this.prepared.name = 'drag';
                                this.target = elementInteractable;
                                this.element = element;
                                break;
                            }

                            element = scope.parentElement(element);
                        }

                        // if there's no drag from element interactables,
                        // check the selector interactables
                        if (!this.prepared.name) {
                            var thisInteraction = this;

                            var getDraggable = function (interactable, selector, context) {
                                var elements = scope.ie8MatchesSelector
                                    ? context.querySelectorAll(selector)
                                    : undefined;

                                if (interactable === thisInteraction.target) { return; }

                                if (scope.inContext(interactable, eventTarget)
                                    && !interactable.options.drag.manualStart
                                    && !scope.testIgnore(interactable, element, eventTarget)
                                    && scope.testAllow(interactable, element, eventTarget)
                                    && scope.matchesSelector(element, selector, elements)
                                    && interactable.getAction(thisInteraction.downPointer, thisInteraction.downEvent, thisInteraction, element).name === 'drag'
                                    && scope.checkAxis(axis, interactable)
                                    && scope.withinInteractionLimit(interactable, element, 'drag')) {

                                    return interactable;
                                }
                            };

                            element = eventTarget;

                            while (utils.isElement(element)) {
                                var selectorInteractable = scope.interactables.forEachSelector(getDraggable);

                                if (selectorInteractable) {
                                    this.prepared.name = 'drag';
                                    this.target = selectorInteractable;
                                    this.element = element;
                                    break;
                                }

                                element = scope.parentElement(element);
                            }
                        }
                    }
                }
            }

            var starting = !!this.prepared.name && !this.interacting();

            if (starting
                && (this.target.options[this.prepared.name].manualStart
                || !scope.withinInteractionLimit(this.target, this.element, this.prepared))) {
                this.stop(event);
                return;
            }

            if (this.prepared.name && this.target) {
                if (starting) {
                    this.start(this.prepared, this.target, this.element);
                }

                var shouldMove = this.setModifications(this.curCoords.page, preEnd);

                // move if snapping or restriction doesn't prevent it
                if (shouldMove || starting) {
                    this.prevEvent = this[this.prepared.name + 'Move'](event);
                }

                this.checkAndPreventDefault(event, this.target, this.element);
            }
        }

        utils.copyCoords(this.prevCoords, this.curCoords);

        if (this.dragging || this.resizing) {
            this.autoScrollMove(pointer);
        }
    },

    dragStart: function (event) {
        var dragEvent = new InteractEvent(this, event, 'drag', 'start', this.element);

        this.dragging = true;
        this.target.fire(dragEvent);

        // reset active dropzones
        this.activeDrops.dropzones = [];
        this.activeDrops.elements  = [];
        this.activeDrops.rects     = [];

        if (!this.dynamicDrop) {
            this.setActiveDrops(this.element);
        }

        var dropEvents = this.getDropEvents(event, dragEvent);

        if (dropEvents.activate) {
            this.fireActiveDrops(dropEvents.activate);
        }

        return dragEvent;
    },

    dragMove: function (event) {
        var target = this.target,
            dragEvent  = new InteractEvent(this, event, 'drag', 'move', this.element),
            draggableElement = this.element,
            drop = this.getDrop(event, draggableElement);

        this.dropTarget = drop.dropzone;
        this.dropElement = drop.element;

        var dropEvents = this.getDropEvents(event, dragEvent);

        target.fire(dragEvent);

        if (dropEvents.leave) { this.prevDropTarget.fire(dropEvents.leave); }
        if (dropEvents.enter) {     this.dropTarget.fire(dropEvents.enter); }
        if (dropEvents.move ) {     this.dropTarget.fire(dropEvents.move ); }

        this.prevDropTarget  = this.dropTarget;
        this.prevDropElement = this.dropElement;

        return dragEvent;
    },

    resizeStart: function (event) {
        var resizeEvent = new InteractEvent(this, event, 'resize', 'start', this.element);

        if (this.prepared.edges) {
            var startRect = this.target.getRect(this.element);

            if (this.target.options.resize.square) {
                var squareEdges = utils.extend({}, this.prepared.edges);

                squareEdges.top    = squareEdges.top    || (squareEdges.left   && !squareEdges.bottom);
                squareEdges.left   = squareEdges.left   || (squareEdges.top    && !squareEdges.right );
                squareEdges.bottom = squareEdges.bottom || (squareEdges.right  && !squareEdges.top   );
                squareEdges.right  = squareEdges.right  || (squareEdges.bottom && !squareEdges.left  );

                this.prepared._squareEdges = squareEdges;
            }
            else {
                this.prepared._squareEdges = null;
            }

            this.resizeRects = {
                start     : startRect,
                current   : utils.extend({}, startRect),
                restricted: utils.extend({}, startRect),
                previous  : utils.extend({}, startRect),
                delta     : {
                    left: 0, right : 0, width : 0,
                    top : 0, bottom: 0, height: 0
                }
            };

            resizeEvent.rect = this.resizeRects.restricted;
            resizeEvent.deltaRect = this.resizeRects.delta;
        }

        this.target.fire(resizeEvent);

        this.resizing = true;

        return resizeEvent;
    },

    resizeMove: function (event) {
        var resizeEvent = new InteractEvent(this, event, 'resize', 'move', this.element);

        var edges = this.prepared.edges,
            invert = this.target.options.resize.invert,
            invertible = invert === 'reposition' || invert === 'negate';

        if (edges) {
            var dx = resizeEvent.dx,
                dy = resizeEvent.dy,

                start      = this.resizeRects.start,
                current    = this.resizeRects.current,
                restricted = this.resizeRects.restricted,
                delta      = this.resizeRects.delta,
                previous   = utils.extend(this.resizeRects.previous, restricted);

            if (this.target.options.resize.square) {
                var originalEdges = edges;

                edges = this.prepared._squareEdges;

                if ((originalEdges.left && originalEdges.bottom)
                    || (originalEdges.right && originalEdges.top)) {
                    dy = -dx;
                }
                else if (originalEdges.left || originalEdges.right) { dy = dx; }
                else if (originalEdges.top || originalEdges.bottom) { dx = dy; }
            }

            // update the 'current' rect without modifications
            if (edges.top   ) { current.top    += dy; }
            if (edges.bottom) { current.bottom += dy; }
            if (edges.left  ) { current.left   += dx; }
            if (edges.right ) { current.right  += dx; }

            if (invertible) {
                // if invertible, copy the current rect
                utils.extend(restricted, current);

                if (invert === 'reposition') {
                    // swap edge values if necessary to keep width/height positive
                    var swap;

                    if (restricted.top > restricted.bottom) {
                        swap = restricted.top;

                        restricted.top = restricted.bottom;
                        restricted.bottom = swap;
                    }
                    if (restricted.left > restricted.right) {
                        swap = restricted.left;

                        restricted.left = restricted.right;
                        restricted.right = swap;
                    }
                }
            }
            else {
                // if not invertible, restrict to minimum of 0x0 rect
                restricted.top    = Math.min(current.top, start.bottom);
                restricted.bottom = Math.max(current.bottom, start.top);
                restricted.left   = Math.min(current.left, start.right);
                restricted.right  = Math.max(current.right, start.left);
            }

            restricted.width  = restricted.right  - restricted.left;
            restricted.height = restricted.bottom - restricted.top ;

            for (var edge in restricted) {
                delta[edge] = restricted[edge] - previous[edge];
            }

            resizeEvent.edges = this.prepared.edges;
            resizeEvent.rect = restricted;
            resizeEvent.deltaRect = delta;
        }

        this.target.fire(resizeEvent);

        return resizeEvent;
    },

    gestureStart: function (event) {
        var gestureEvent = new InteractEvent(this, event, 'gesture', 'start', this.element);

        gestureEvent.ds = 0;

        this.gesture.startDistance = this.gesture.prevDistance = gestureEvent.distance;
        this.gesture.startAngle = this.gesture.prevAngle = gestureEvent.angle;
        this.gesture.scale = 1;

        this.gesturing = true;

        this.target.fire(gestureEvent);

        return gestureEvent;
    },

    gestureMove: function (event) {
        if (!this.pointerIds.length) {
            return this.prevEvent;
        }

        var gestureEvent;

        gestureEvent = new InteractEvent(this, event, 'gesture', 'move', this.element);
        gestureEvent.ds = gestureEvent.scale - this.gesture.scale;

        this.target.fire(gestureEvent);

        this.gesture.prevAngle = gestureEvent.angle;
        this.gesture.prevDistance = gestureEvent.distance;

        if (gestureEvent.scale !== Infinity &&
            gestureEvent.scale !== null &&
            gestureEvent.scale !== undefined  &&
            !isNaN(gestureEvent.scale)) {

            this.gesture.scale = gestureEvent.scale;
        }

        return gestureEvent;
    },

    pointerHold: function (pointer, event, eventTarget) {
        this.collectEventTargets(pointer, event, eventTarget, 'hold');
    },

    pointerUp: function (pointer, event, eventTarget, curEventTarget) {
        var pointerIndex = this.mouse? 0 : scope.indexOf(this.pointerIds, utils.getPointerId(pointer));

        clearTimeout(this.holdTimers[pointerIndex]);

        this.collectEventTargets(pointer, event, eventTarget, 'up' );
        this.collectEventTargets(pointer, event, eventTarget, 'tap');

        this.pointerEnd(pointer, event, eventTarget, curEventTarget);

        this.removePointer(pointer);
    },

    pointerCancel: function (pointer, event, eventTarget, curEventTarget) {
        var pointerIndex = this.mouse? 0 : scope.indexOf(this.pointerIds, utils.getPointerId(pointer));

        clearTimeout(this.holdTimers[pointerIndex]);

        this.collectEventTargets(pointer, event, eventTarget, 'cancel');
        this.pointerEnd(pointer, event, eventTarget, curEventTarget);

        this.removePointer(pointer);
    },

    // http://www.quirksmode.org/dom/events/click.html
    // >Events leading to dblclick
    //
    // IE8 doesn't fire down event before dblclick.
    // This workaround tries to fire a tap and doubletap after dblclick
    ie8Dblclick: function (pointer, event, eventTarget) {
        if (this.prevTap
            && event.clientX === this.prevTap.clientX
            && event.clientY === this.prevTap.clientY
            && eventTarget   === this.prevTap.target) {

            this.downTargets[0] = eventTarget;
            this.downTimes[0] = new Date().getTime();
            this.collectEventTargets(pointer, event, eventTarget, 'tap');
        }
    },

    // End interact move events and stop auto-scroll unless inertia is enabled
    pointerEnd: function (pointer, event, eventTarget, curEventTarget) {
        var endEvent,
            target = this.target,
            options = target && target.options,
            inertiaOptions = options && this.prepared.name && options[this.prepared.name].inertia,
            inertiaStatus = this.inertiaStatus;

        if (this.interacting()) {

            if (inertiaStatus.active) { return; }

            var pointerSpeed,
                now = new Date().getTime(),
                inertiaPossible = false,
                inertia = false,
                smoothEnd = false,
                endSnap = scope.checkSnap(target, this.prepared.name) && options[this.prepared.name].snap.endOnly,
                endRestrict = scope.checkRestrict(target, this.prepared.name) && options[this.prepared.name].restrict.endOnly,
                dx = 0,
                dy = 0,
                startEvent;

            if (this.dragging) {
                if      (options.drag.axis === 'x' ) { pointerSpeed = Math.abs(this.pointerDelta.client.vx); }
                else if (options.drag.axis === 'y' ) { pointerSpeed = Math.abs(this.pointerDelta.client.vy); }
                else   /*options.drag.axis === 'xy'*/{ pointerSpeed = this.pointerDelta.client.speed; }
            }
            else {
                pointerSpeed = this.pointerDelta.client.speed;
            }

            // check if inertia should be started
            inertiaPossible = (inertiaOptions && inertiaOptions.enabled
            && this.prepared.name !== 'gesture'
            && event !== inertiaStatus.startEvent);

            inertia = (inertiaPossible
            && (now - this.curCoords.timeStamp) < 50
            && pointerSpeed > inertiaOptions.minSpeed
            && pointerSpeed > inertiaOptions.endSpeed);

            if (inertiaPossible && !inertia && (endSnap || endRestrict)) {

                var snapRestrict = {};

                snapRestrict.snap = snapRestrict.restrict = snapRestrict;

                if (endSnap) {
                    this.setSnapping(this.curCoords.page, snapRestrict);
                    if (snapRestrict.locked) {
                        dx += snapRestrict.dx;
                        dy += snapRestrict.dy;
                    }
                }

                if (endRestrict) {
                    this.setRestriction(this.curCoords.page, snapRestrict);
                    if (snapRestrict.restricted) {
                        dx += snapRestrict.dx;
                        dy += snapRestrict.dy;
                    }
                }

                if (dx || dy) {
                    smoothEnd = true;
                }
            }

            if (inertia || smoothEnd) {
                utils.copyCoords(inertiaStatus.upCoords, this.curCoords);

                this.pointers[0] = inertiaStatus.startEvent = startEvent =
                    new InteractEvent(this, event, this.prepared.name, 'inertiastart', this.element);

                inertiaStatus.t0 = now;

                target.fire(inertiaStatus.startEvent);

                if (inertia) {
                    inertiaStatus.vx0 = this.pointerDelta.client.vx;
                    inertiaStatus.vy0 = this.pointerDelta.client.vy;
                    inertiaStatus.v0 = pointerSpeed;

                    this.calcInertia(inertiaStatus);

                    var page = utils.extend({}, this.curCoords.page),
                        origin = scope.getOriginXY(target, this.element),
                        statusObject;

                    page.x = page.x + inertiaStatus.xe - origin.x;
                    page.y = page.y + inertiaStatus.ye - origin.y;

                    statusObject = {
                        useStatusXY: true,
                        x: page.x,
                        y: page.y,
                        dx: 0,
                        dy: 0,
                        snap: null
                    };

                    statusObject.snap = statusObject;

                    dx = dy = 0;

                    if (endSnap) {
                        var snap = this.setSnapping(this.curCoords.page, statusObject);

                        if (snap.locked) {
                            dx += snap.dx;
                            dy += snap.dy;
                        }
                    }

                    if (endRestrict) {
                        var restrict = this.setRestriction(this.curCoords.page, statusObject);

                        if (restrict.restricted) {
                            dx += restrict.dx;
                            dy += restrict.dy;
                        }
                    }

                    inertiaStatus.modifiedXe += dx;
                    inertiaStatus.modifiedYe += dy;

                    inertiaStatus.i = animationFrame.request(this.boundInertiaFrame);
                }
                else {
                    inertiaStatus.smoothEnd = true;
                    inertiaStatus.xe = dx;
                    inertiaStatus.ye = dy;

                    inertiaStatus.sx = inertiaStatus.sy = 0;

                    inertiaStatus.i = animationFrame.request(this.boundSmoothEndFrame);
                }

                inertiaStatus.active = true;
                return;
            }

            if (endSnap || endRestrict) {
                // fire a move event at the snapped coordinates
                this.pointerMove(pointer, event, eventTarget, curEventTarget, true);
            }
        }

        if (this.dragging) {
            endEvent = new InteractEvent(this, event, 'drag', 'end', this.element);

            var draggableElement = this.element,
                drop = this.getDrop(event, draggableElement);

            this.dropTarget = drop.dropzone;
            this.dropElement = drop.element;

            var dropEvents = this.getDropEvents(event, endEvent);

            if (dropEvents.leave) { this.prevDropTarget.fire(dropEvents.leave); }
            if (dropEvents.enter) {     this.dropTarget.fire(dropEvents.enter); }
            if (dropEvents.drop ) {     this.dropTarget.fire(dropEvents.drop ); }
            if (dropEvents.deactivate) {
                this.fireActiveDrops(dropEvents.deactivate);
            }

            target.fire(endEvent);
        }
        else if (this.resizing) {
            endEvent = new InteractEvent(this, event, 'resize', 'end', this.element);
            target.fire(endEvent);
        }
        else if (this.gesturing) {
            endEvent = new InteractEvent(this, event, 'gesture', 'end', this.element);
            target.fire(endEvent);
        }

        this.stop(event);
    },

    collectDrops: function (element) {
        var drops = [],
            elements = [],
            i;

        element = element || this.element;

        // collect all dropzones and their elements which qualify for a drop
        for (i = 0; i < scope.interactables.length; i++) {
            if (!scope.interactables[i].options.drop.enabled) { continue; }

            var current = scope.interactables[i],
                accept = current.options.drop.accept;

            // test the draggable element against the dropzone's accept setting
            if ((utils.isElement(accept) && accept !== element)
                || (scope.isString(accept)
                && !scope.matchesSelector(element, accept))) {

                continue;
            }

            // query for new elements if necessary
            var dropElements = current.selector? current._context.querySelectorAll(current.selector) : [current._element];

            for (var j = 0, len = dropElements.length; j < len; j++) {
                var currentElement = dropElements[j];

                if (currentElement === element) {
                    continue;
                }

                drops.push(current);
                elements.push(currentElement);
            }
        }

        return {
            dropzones: drops,
            elements: elements
        };
    },

    fireActiveDrops: function (event) {
        var i,
            current,
            currentElement,
            prevElement;

        // loop through all active dropzones and trigger event
        for (i = 0; i < this.activeDrops.dropzones.length; i++) {
            current = this.activeDrops.dropzones[i];
            currentElement = this.activeDrops.elements [i];

            // prevent trigger of duplicate events on same element
            if (currentElement !== prevElement) {
                // set current element as event target
                event.target = currentElement;
                current.fire(event);
            }
            prevElement = currentElement;
        }
    },

    // Collect a new set of possible drops and save them in activeDrops.
    // setActiveDrops should always be called when a drag has just started or a
    // drag event happens while dynamicDrop is true
    setActiveDrops: function (dragElement) {
        // get dropzones and their elements that could receive the draggable
        var possibleDrops = this.collectDrops(dragElement, true);

        this.activeDrops.dropzones = possibleDrops.dropzones;
        this.activeDrops.elements  = possibleDrops.elements;
        this.activeDrops.rects     = [];

        for (var i = 0; i < this.activeDrops.dropzones.length; i++) {
            this.activeDrops.rects[i] = this.activeDrops.dropzones[i].getRect(this.activeDrops.elements[i]);
        }
    },

    getDrop: function (event, dragElement) {
        var validDrops = [];

        if (scope.dynamicDrop) {
            this.setActiveDrops(dragElement);
        }

        // collect all dropzones and their elements which qualify for a drop
        for (var j = 0; j < this.activeDrops.dropzones.length; j++) {
            var current        = this.activeDrops.dropzones[j],
                currentElement = this.activeDrops.elements [j],
                rect           = this.activeDrops.rects    [j];

            validDrops.push(current.dropCheck(this.pointers[0], event, this.target, dragElement, currentElement, rect)
                ? currentElement
                : null);
        }

        // get the most appropriate dropzone based on DOM depth and order
        var dropIndex = scope.indexOfDeepestElement(validDrops),
            dropzone  = this.activeDrops.dropzones[dropIndex] || null,
            element   = this.activeDrops.elements [dropIndex] || null;

        return {
            dropzone: dropzone,
            element: element
        };
    },

    getDropEvents: function (pointerEvent, dragEvent) {
        var dropEvents = {
            enter     : null,
            leave     : null,
            activate  : null,
            deactivate: null,
            move      : null,
            drop      : null
        };

        if (this.dropElement !== this.prevDropElement) {
            // if there was a prevDropTarget, create a dragleave event
            if (this.prevDropTarget) {
                dropEvents.leave = {
                    target       : this.prevDropElement,
                    dropzone     : this.prevDropTarget,
                    relatedTarget: dragEvent.target,
                    draggable    : dragEvent.interactable,
                    dragEvent    : dragEvent,
                    interaction  : this,
                    timeStamp    : dragEvent.timeStamp,
                    type         : 'dragleave'
                };

                dragEvent.dragLeave = this.prevDropElement;
                dragEvent.prevDropzone = this.prevDropTarget;
            }
            // if the dropTarget is not null, create a dragenter event
            if (this.dropTarget) {
                dropEvents.enter = {
                    target       : this.dropElement,
                    dropzone     : this.dropTarget,
                    relatedTarget: dragEvent.target,
                    draggable    : dragEvent.interactable,
                    dragEvent    : dragEvent,
                    interaction  : this,
                    timeStamp    : dragEvent.timeStamp,
                    type         : 'dragenter'
                };

                dragEvent.dragEnter = this.dropElement;
                dragEvent.dropzone = this.dropTarget;
            }
        }

        if (dragEvent.type === 'dragend' && this.dropTarget) {
            dropEvents.drop = {
                target       : this.dropElement,
                dropzone     : this.dropTarget,
                relatedTarget: dragEvent.target,
                draggable    : dragEvent.interactable,
                dragEvent    : dragEvent,
                interaction  : this,
                timeStamp    : dragEvent.timeStamp,
                type         : 'drop'
            };

            dragEvent.dropzone = this.dropTarget;
        }
        if (dragEvent.type === 'dragstart') {
            dropEvents.activate = {
                target       : null,
                dropzone     : null,
                relatedTarget: dragEvent.target,
                draggable    : dragEvent.interactable,
                dragEvent    : dragEvent,
                interaction  : this,
                timeStamp    : dragEvent.timeStamp,
                type         : 'dropactivate'
            };
        }
        if (dragEvent.type === 'dragend') {
            dropEvents.deactivate = {
                target       : null,
                dropzone     : null,
                relatedTarget: dragEvent.target,
                draggable    : dragEvent.interactable,
                dragEvent    : dragEvent,
                interaction  : this,
                timeStamp    : dragEvent.timeStamp,
                type         : 'dropdeactivate'
            };
        }
        if (dragEvent.type === 'dragmove' && this.dropTarget) {
            dropEvents.move = {
                target       : this.dropElement,
                dropzone     : this.dropTarget,
                relatedTarget: dragEvent.target,
                draggable    : dragEvent.interactable,
                dragEvent    : dragEvent,
                interaction  : this,
                dragmove     : dragEvent,
                timeStamp    : dragEvent.timeStamp,
                type         : 'dropmove'
            };
            dragEvent.dropzone = this.dropTarget;
        }

        return dropEvents;
    },

    currentAction: function () {
        return (this.dragging && 'drag') || (this.resizing && 'resize') || (this.gesturing && 'gesture') || null;
    },

    interacting: function () {
        return this.dragging || this.resizing || this.gesturing;
    },

    clearTargets: function () {
        this.target = this.element = null;

        this.dropTarget = this.dropElement = this.prevDropTarget = this.prevDropElement = null;
    },

    stop: function (event) {
        if (this.interacting()) {
            scope.autoScroll.stop();
            this.matches = [];
            this.matchElements = [];

            var target = this.target;

            if (target.options.styleCursor) {
                target._doc.documentElement.style.cursor = '';
            }

            // prevent Default only if were previously interacting
            if (event && scope.isFunction(event.preventDefault)) {
                this.checkAndPreventDefault(event, target, this.element);
            }

            if (this.dragging) {
                this.activeDrops.dropzones = this.activeDrops.elements = this.activeDrops.rects = null;
            }
        }

        this.clearTargets();

        this.pointerIsDown = this.snapStatus.locked = this.dragging = this.resizing = this.gesturing = false;
        this.prepared.name = this.prevEvent = null;
        this.inertiaStatus.resumeDx = this.inertiaStatus.resumeDy = 0;

        // remove pointers if their ID isn't in this.pointerIds
        for (var i = 0; i < this.pointers.length; i++) {
            if (scope.indexOf(this.pointerIds, utils.getPointerId(this.pointers[i])) === -1) {
                this.pointers.splice(i, 1);
            }
        }

        for (i = 0; i < scope.interactions.length; i++) {
            // remove this interaction if it's not the only one of it's type
            if (scope.interactions[i] !== this && scope.interactions[i].mouse === this.mouse) {
                scope.interactions.splice(scope.indexOf(scope.interactions, this), 1);
            }
        }
    },

    inertiaFrame: function () {
        var inertiaStatus = this.inertiaStatus,
            options = this.target.options[this.prepared.name].inertia,
            lambda = options.resistance,
            t = new Date().getTime() / 1000 - inertiaStatus.t0;

        if (t < inertiaStatus.te) {

            var progress =  1 - (Math.exp(-lambda * t) - inertiaStatus.lambda_v0) / inertiaStatus.one_ve_v0;

            if (inertiaStatus.modifiedXe === inertiaStatus.xe && inertiaStatus.modifiedYe === inertiaStatus.ye) {
                inertiaStatus.sx = inertiaStatus.xe * progress;
                inertiaStatus.sy = inertiaStatus.ye * progress;
            }
            else {
                var quadPoint = scope.getQuadraticCurvePoint(
                    0, 0,
                    inertiaStatus.xe, inertiaStatus.ye,
                    inertiaStatus.modifiedXe, inertiaStatus.modifiedYe,
                    progress);

                inertiaStatus.sx = quadPoint.x;
                inertiaStatus.sy = quadPoint.y;
            }

            this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

            inertiaStatus.i = animationFrame.request(this.boundInertiaFrame);
        }
        else {
            inertiaStatus.sx = inertiaStatus.modifiedXe;
            inertiaStatus.sy = inertiaStatus.modifiedYe;

            this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

            inertiaStatus.active = false;
            this.pointerEnd(inertiaStatus.startEvent, inertiaStatus.startEvent);
        }
    },

    smoothEndFrame: function () {
        var inertiaStatus = this.inertiaStatus,
            t = new Date().getTime() - inertiaStatus.t0,
            duration = this.target.options[this.prepared.name].inertia.smoothEndDuration;

        if (t < duration) {
            inertiaStatus.sx = scope.easeOutQuad(t, 0, inertiaStatus.xe, duration);
            inertiaStatus.sy = scope.easeOutQuad(t, 0, inertiaStatus.ye, duration);

            this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

            inertiaStatus.i = animationFrame.request(this.boundSmoothEndFrame);
        }
        else {
            inertiaStatus.sx = inertiaStatus.xe;
            inertiaStatus.sy = inertiaStatus.ye;

            this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

            inertiaStatus.active = false;
            inertiaStatus.smoothEnd = false;

            this.pointerEnd(inertiaStatus.startEvent, inertiaStatus.startEvent);
        }
    },

    addPointer: function (pointer) {
        var id = utils.getPointerId(pointer),
            index = this.mouse? 0 : scope.indexOf(this.pointerIds, id);

        if (index === -1) {
            index = this.pointerIds.length;
        }

        this.pointerIds[index] = id;
        this.pointers[index] = pointer;

        return index;
    },

    removePointer: function (pointer) {
        var id = utils.getPointerId(pointer),
            index = this.mouse? 0 : scope.indexOf(this.pointerIds, id);

        if (index === -1) { return; }

        if (!this.interacting()) {
            this.pointers.splice(index, 1);
        }

        this.pointerIds .splice(index, 1);
        this.downTargets.splice(index, 1);
        this.downTimes  .splice(index, 1);
        this.holdTimers .splice(index, 1);
    },

    recordPointer: function (pointer) {
        // Do not update pointers while inertia is active.
        // The inertia start event should be this.pointers[0]
        if (this.inertiaStatus.active) { return; }

        var index = this.mouse? 0: scope.indexOf(this.pointerIds, utils.getPointerId(pointer));

        if (index === -1) { return; }

        this.pointers[index] = pointer;
    },

    collectEventTargets: function (pointer, event, eventTarget, eventType) {
        var pointerIndex = this.mouse? 0 : scope.indexOf(this.pointerIds, utils.getPointerId(pointer));

        // do not fire a tap event if the pointer was moved before being lifted
        if (eventType === 'tap' && (this.pointerWasMoved
                // or if the pointerup target is different to the pointerdown target
            || !(this.downTargets[pointerIndex] && this.downTargets[pointerIndex] === eventTarget))) {
            return;
        }

        var targets = [],
            elements = [],
            element = eventTarget;

        function collectSelectors (interactable, selector, context) {
            var els = scope.ie8MatchesSelector
                ? context.querySelectorAll(selector)
                : undefined;

            if (interactable._iEvents[eventType]
                && utils.isElement(element)
                && scope.inContext(interactable, element)
                && !scope.testIgnore(interactable, element, eventTarget)
                && scope.testAllow(interactable, element, eventTarget)
                && scope.matchesSelector(element, selector, els)) {

                targets.push(interactable);
                elements.push(element);
            }
        }


        var interact = scope.interact;

        while (element) {
            if (interact.isSet(element) && interact(element)._iEvents[eventType]) {
                targets.push(interact(element));
                elements.push(element);
            }

            scope.interactables.forEachSelector(collectSelectors);

            element = scope.parentElement(element);
        }

        // create the tap event even if there are no listeners so that
        // doubletap can still be created and fired
        if (targets.length || eventType === 'tap') {
            this.firePointers(pointer, event, eventTarget, targets, elements, eventType);
        }
    },

    firePointers: function (pointer, event, eventTarget, targets, elements, eventType) {
        var pointerIndex = this.mouse? 0 : scope.indexOf(utils.getPointerId(pointer)),
            pointerEvent = {},
            i,
        // for tap events
            interval, createNewDoubleTap;

        // if it's a doubletap then the event properties would have been
        // copied from the tap event and provided as the pointer argument
        if (eventType === 'doubletap') {
            pointerEvent = pointer;
        }
        else {
            utils.extend(pointerEvent, event);
            if (event !== pointer) {
                utils.extend(pointerEvent, pointer);
            }

            pointerEvent.preventDefault           = preventOriginalDefault;
            pointerEvent.stopPropagation          = InteractEvent.prototype.stopPropagation;
            pointerEvent.stopImmediatePropagation = InteractEvent.prototype.stopImmediatePropagation;
            pointerEvent.interaction              = this;

            pointerEvent.timeStamp     = new Date().getTime();
            pointerEvent.originalEvent = event;
            pointerEvent.type          = eventType;
            pointerEvent.pointerId     = utils.getPointerId(pointer);
            pointerEvent.pointerType   = this.mouse? 'mouse' : !browser.supportsPointerEvent? 'touch'
                : scope.isString(pointer.pointerType)
                ? pointer.pointerType
                : [,,'touch', 'pen', 'mouse'][pointer.pointerType];
        }

        if (eventType === 'tap') {
            pointerEvent.dt = pointerEvent.timeStamp - this.downTimes[pointerIndex];

            interval = pointerEvent.timeStamp - this.tapTime;
            createNewDoubleTap = !!(this.prevTap && this.prevTap.type !== 'doubletap'
            && this.prevTap.target === pointerEvent.target
            && interval < 500);

            pointerEvent.double = createNewDoubleTap;

            this.tapTime = pointerEvent.timeStamp;
        }

        for (i = 0; i < targets.length; i++) {
            pointerEvent.currentTarget = elements[i];
            pointerEvent.interactable = targets[i];
            targets[i].fire(pointerEvent);

            if (pointerEvent.immediatePropagationStopped
                ||(pointerEvent.propagationStopped && elements[i + 1] !== pointerEvent.currentTarget)) {
                break;
            }
        }

        if (createNewDoubleTap) {
            var doubleTap = {};

            utils.extend(doubleTap, pointerEvent);

            doubleTap.dt   = interval;
            doubleTap.type = 'doubletap';

            this.collectEventTargets(doubleTap, event, eventTarget, 'doubletap');

            this.prevTap = doubleTap;
        }
        else if (eventType === 'tap') {
            this.prevTap = pointerEvent;
        }
    },

    validateSelector: function (pointer, event, matches, matchElements) {
        for (var i = 0, len = matches.length; i < len; i++) {
            var match = matches[i],
                matchElement = matchElements[i],
                action = validateAction(match.getAction(pointer, event, this, matchElement), match);

            if (action && scope.withinInteractionLimit(match, matchElement, action)) {
                this.target = match;
                this.element = matchElement;

                return action;
            }
        }
    },

    setSnapping: function (pageCoords, status) {
        var snap = this.target.options[this.prepared.name].snap,
            targets = [],
            target,
            page,
            i;

        status = status || this.snapStatus;

        if (status.useStatusXY) {
            page = { x: status.x, y: status.y };
        }
        else {
            var origin = scope.getOriginXY(this.target, this.element);

            page = utils.extend({}, pageCoords);

            page.x -= origin.x;
            page.y -= origin.y;
        }

        status.realX = page.x;
        status.realY = page.y;

        page.x = page.x - this.inertiaStatus.resumeDx;
        page.y = page.y - this.inertiaStatus.resumeDy;

        var len = snap.targets? snap.targets.length : 0;

        for (var relIndex = 0; relIndex < this.snapOffsets.length; relIndex++) {
            var relative = {
                x: page.x - this.snapOffsets[relIndex].x,
                y: page.y - this.snapOffsets[relIndex].y
            };

            for (i = 0; i < len; i++) {
                if (scope.isFunction(snap.targets[i])) {
                    target = snap.targets[i](relative.x, relative.y, this);
                }
                else {
                    target = snap.targets[i];
                }

                if (!target) { continue; }

                targets.push({
                    x: scope.isNumber(target.x) ? (target.x + this.snapOffsets[relIndex].x) : relative.x,
                    y: scope.isNumber(target.y) ? (target.y + this.snapOffsets[relIndex].y) : relative.y,

                    range: scope.isNumber(target.range)? target.range: snap.range
                });
            }
        }

        var closest = {
            target: null,
            inRange: false,
            distance: 0,
            range: 0,
            dx: 0,
            dy: 0
        };

        for (i = 0, len = targets.length; i < len; i++) {
            target = targets[i];

            var range = target.range,
                dx = target.x - page.x,
                dy = target.y - page.y,
                distance = utils.hypot(dx, dy),
                inRange = distance <= range;

            // Infinite targets count as being out of range
            // compared to non infinite ones that are in range
            if (range === Infinity && closest.inRange && closest.range !== Infinity) {
                inRange = false;
            }

            if (!closest.target || (inRange
                    // is the closest target in range?
                    ? (closest.inRange && range !== Infinity
                    // the pointer is relatively deeper in this target
                    ? distance / range < closest.distance / closest.range
                    // this target has Infinite range and the closest doesn't
                    : (range === Infinity && closest.range !== Infinity)
                    // OR this target is closer that the previous closest
                || distance < closest.distance)
                    // The other is not in range and the pointer is closer to this target
                    : (!closest.inRange && distance < closest.distance))) {

                if (range === Infinity) {
                    inRange = true;
                }

                closest.target = target;
                closest.distance = distance;
                closest.range = range;
                closest.inRange = inRange;
                closest.dx = dx;
                closest.dy = dy;

                status.range = range;
            }
        }

        var snapChanged;

        if (closest.target) {
            snapChanged = (status.snappedX !== closest.target.x || status.snappedY !== closest.target.y);

            status.snappedX = closest.target.x;
            status.snappedY = closest.target.y;
        }
        else {
            snapChanged = true;

            status.snappedX = NaN;
            status.snappedY = NaN;
        }

        status.dx = closest.dx;
        status.dy = closest.dy;

        status.changed = (snapChanged || (closest.inRange && !status.locked));
        status.locked = closest.inRange;

        return status;
    },

    setRestriction: function (pageCoords, status) {
        var target = this.target,
            restrict = target && target.options[this.prepared.name].restrict,
            restriction = restrict && restrict.restriction,
            page;

        if (!restriction) {
            return status;
        }

        status = status || this.restrictStatus;

        page = status.useStatusXY
            ? page = { x: status.x, y: status.y }
            : page = utils.extend({}, pageCoords);

        if (status.snap && status.snap.locked) {
            page.x += status.snap.dx || 0;
            page.y += status.snap.dy || 0;
        }

        page.x -= this.inertiaStatus.resumeDx;
        page.y -= this.inertiaStatus.resumeDy;

        status.dx = 0;
        status.dy = 0;
        status.restricted = false;

        var rect, restrictedX, restrictedY;

        if (scope.isString(restriction)) {
            if (restriction === 'parent') {
                restriction = scope.parentElement(this.element);
            }
            else if (restriction === 'self') {
                restriction = target.getRect(this.element);
            }
            else {
                restriction = scope.closest(this.element, restriction);
            }

            if (!restriction) { return status; }
        }

        if (scope.isFunction(restriction)) {
            restriction = restriction(page.x, page.y, this.element);
        }

        if (utils.isElement(restriction)) {
            restriction = scope.getElementRect(restriction);
        }

        rect = restriction;

        if (!restriction) {
            restrictedX = page.x;
            restrictedY = page.y;
        }
        // object is assumed to have
        // x, y, width, height or
        // left, top, right, bottom
        else if ('x' in restriction && 'y' in restriction) {
            restrictedX = Math.max(Math.min(rect.x + rect.width  - this.restrictOffset.right , page.x), rect.x + this.restrictOffset.left);
            restrictedY = Math.max(Math.min(rect.y + rect.height - this.restrictOffset.bottom, page.y), rect.y + this.restrictOffset.top );
        }
        else {
            restrictedX = Math.max(Math.min(rect.right  - this.restrictOffset.right , page.x), rect.left + this.restrictOffset.left);
            restrictedY = Math.max(Math.min(rect.bottom - this.restrictOffset.bottom, page.y), rect.top  + this.restrictOffset.top );
        }

        status.dx = restrictedX - page.x;
        status.dy = restrictedY - page.y;

        status.changed = status.restrictedX !== restrictedX || status.restrictedY !== restrictedY;
        status.restricted = !!(status.dx || status.dy);

        status.restrictedX = restrictedX;
        status.restrictedY = restrictedY;

        return status;
    },

    checkAndPreventDefault: function (event, interactable, element) {
        if (!(interactable = interactable || this.target)) { return; }

        var options = interactable.options,
            prevent = options.preventDefault;

        if (prevent === 'auto' && element && !/^(input|select|textarea)$/i.test(event.target.nodeName)) {
            // do not preventDefault on pointerdown if the prepared action is a drag
            // and dragging can only start from a certain direction - this allows
            // a touch to pan the viewport if a drag isn't in the right direction
            if (/down|start/i.test(event.type)
                && this.prepared.name === 'drag' && options.drag.axis !== 'xy') {

                return;
            }

            // with manualStart, only preventDefault while interacting
            if (options[this.prepared.name] && options[this.prepared.name].manualStart
                && !this.interacting()) {
                return;
            }

            event.preventDefault();
            return;
        }

        if (prevent === 'always') {
            event.preventDefault();
            return;
        }
    },

    calcInertia: function (status) {
        var inertiaOptions = this.target.options[this.prepared.name].inertia,
            lambda = inertiaOptions.resistance,
            inertiaDur = -Math.log(inertiaOptions.endSpeed / status.v0) / lambda;

        status.x0 = this.prevEvent.pageX;
        status.y0 = this.prevEvent.pageY;
        status.t0 = status.startEvent.timeStamp / 1000;
        status.sx = status.sy = 0;

        status.modifiedXe = status.xe = (status.vx0 - inertiaDur) / lambda;
        status.modifiedYe = status.ye = (status.vy0 - inertiaDur) / lambda;
        status.te = inertiaDur;

        status.lambda_v0 = lambda / status.v0;
        status.one_ve_v0 = 1 - inertiaOptions.endSpeed / status.v0;
    },

    autoScrollMove: function (pointer) {
        if (!(this.interacting()
            && scope.checkAutoScroll(this.target, this.prepared.name))) {
            return;
        }

        if (this.inertiaStatus.active) {
            scope.autoScroll.x = scope.autoScroll.y = 0;
            return;
        }

        var top,
            right,
            bottom,
            left,
            options = this.target.options[this.prepared.name].autoScroll,
            container = options.container || scope.getWindow(this.element);

        if (scope.isWindow(container)) {
            left   = pointer.clientX < scope.autoScroll.margin;
            top    = pointer.clientY < scope.autoScroll.margin;
            right  = pointer.clientX > container.innerWidth  - scope.autoScroll.margin;
            bottom = pointer.clientY > container.innerHeight - scope.autoScroll.margin;
        }
        else {
            var rect = scope.getElementRect(container);

            left   = pointer.clientX < rect.left   + scope.autoScroll.margin;
            top    = pointer.clientY < rect.top    + scope.autoScroll.margin;
            right  = pointer.clientX > rect.right  - scope.autoScroll.margin;
            bottom = pointer.clientY > rect.bottom - scope.autoScroll.margin;
        }

        scope.autoScroll.x = (right ? 1: left? -1: 0);
        scope.autoScroll.y = (bottom? 1:  top? -1: 0);

        if (!scope.autoScroll.isScrolling) {
            // set the autoScroll properties to those of the target
            scope.autoScroll.margin = options.margin;
            scope.autoScroll.speed  = options.speed;

            scope.autoScroll.start(this);
        }
    },

    _updateEventTargets: function (target, currentTarget) {
        this._eventTarget    = target;
        this._curEventTarget = currentTarget;
    }

};

module.exports = Interaction;
