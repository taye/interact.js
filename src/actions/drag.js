'use strict';

var base = require('./base'),
    scope = base.scope,
    utils = require('../utils'),
    Interaction = require('../Interaction'),
    InteractEvent = require('../InteractEvent'),
    Interactable = require('../Interactable');


base.addEventTypes([
    'dragstart',
    'dragmove',
    'draginertiastart',
    'dragend',
    'dragenter',
    'dragleave',
    'dropactivate',
    'dropdeactivate',
    'dropmove',
    'drop'
]);

base.checkers.push(function (pointer, event, interactable) {
return scope.actionIsEnabled.drag && interactable.options.drag.enabled
    ? { name: 'drag' }
    : null;
});

Interaction.prototype.dragStart = function (event) {
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
};

Interaction.prototype.dragMove = function (event) {
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
};

Interaction.prototype.dragEnd = function (event) {
    var endEvent = new InteractEvent(this, event, 'drag', 'end', this.element);

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

    this.target.fire(endEvent);
};

Interaction.prototype.collectDrops = function (element) {
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
            || (utils.isString(accept)
            && !utils.matchesSelector(element, accept))) {

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
};

Interaction.prototype.fireActiveDrops = function (event) {
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
};

// Collect a new set of possible drops and save them in activeDrops.
// setActiveDrops should always be called when a drag has just started or a
// drag event happens while dynamicDrop is true
Interaction.prototype.setActiveDrops = function (dragElement) {
    // get dropzones and their elements that could receive the draggable
    var possibleDrops = this.collectDrops(dragElement, true);

    this.activeDrops.dropzones = possibleDrops.dropzones;
    this.activeDrops.elements  = possibleDrops.elements;
    this.activeDrops.rects     = [];

    for (var i = 0; i < this.activeDrops.dropzones.length; i++) {
        this.activeDrops.rects[i] = this.activeDrops.dropzones[i].getRect(this.activeDrops.elements[i]);
    }
};

Interaction.prototype.getDrop = function (event, dragElement) {
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
    var dropIndex = utils.indexOfDeepestElement(validDrops),
        dropzone  = this.activeDrops.dropzones[dropIndex] || null,
        element   = this.activeDrops.elements [dropIndex] || null;

    return {
        dropzone: dropzone,
        element: element
    };
};

Interaction.prototype.getDropEvents = function (pointerEvent, dragEvent) {
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
};

/*\
 * Interactable.draggable
 [ method ]
 *
 * Gets or sets whether drag actions can be performed on the
 * Interactable
 *
 = (boolean) Indicates if this can be the target of drag events
 | var isDraggable = interact('ul li').draggable();
 * or
 - options (boolean | object) #optional true/false or An object with event listeners to be fired on drag events (object makes the Interactable draggable)
 = (object) This Interactable
 | interact(element).draggable({
 |     onstart: function (event) {},
 |     onmove : function (event) {},
 |     onend  : function (event) {},
 |
 |     // the axis in which the first movement must be
 |     // for the drag sequence to start
 |     // 'xy' by default - any direction
 |     axis: 'x' || 'y' || 'xy',
 |
 |     // max number of drags that can happen concurrently
 |     // with elements of this Interactable. Infinity by default
 |     max: Infinity,
 |
 |     // max number of drags that can target the same element+Interactable
 |     // 1 by default
 |     maxPerElement: 2
 | });
\*/
Interactable.prototype.draggable = function (options) {
    if (utils.isObject(options)) {
        this.options.drag.enabled = options.enabled === false? false: true;
        this.setPerAction('drag', options);
        this.setOnEvents('drag', options);

        if (/^x$|^y$|^xy$/.test(options.axis)) {
            this.options.drag.axis = options.axis;
        }
        else if (options.axis === null) {
            delete this.options.drag.axis;
        }

        return this;
    }

    if (utils.isBool(options)) {
        this.options.drag.enabled = options;

        return this;
    }

    return this.options.drag;
};

/*\
 * Interactable.dropzone
 [ method ]
 *
 * Returns or sets whether elements can be dropped onto this
 * Interactable to trigger drop events
 *
 * Dropzones can receive the following events:
 *  - `dropactivate` and `dropdeactivate` when an acceptable drag starts and ends
 *  - `dragenter` and `dragleave` when a draggable enters and leaves the dropzone
 *  - `dragmove` when a draggable that has entered the dropzone is moved
 *  - `drop` when a draggable is dropped into this dropzone
 *
 *  Use the `accept` option to allow only elements that match the given CSS selector or element.
 *
 *  Use the `overlap` option to set how drops are checked for. The allowed values are:
 *   - `'pointer'`, the pointer must be over the dropzone (default)
 *   - `'center'`, the draggable element's center must be over the dropzone
 *   - a number from 0-1 which is the `(intersection area) / (draggable area)`.
 *       e.g. `0.5` for drop to happen when half of the area of the
 *       draggable is over the dropzone
 *
 - options (boolean | object | null) #optional The new value to be set.
 | interact('.drop').dropzone({
 |   accept: '.can-drop' || document.getElementById('single-drop'),
 |   overlap: 'pointer' || 'center' || zeroToOne
 | }
 = (boolean | object) The current setting or this Interactable
\*/
Interactable.prototype.dropzone = function (options) {
    if (utils.isObject(options)) {
        this.options.drop.enabled = options.enabled === false? false: true;
        this.setOnEvents('drop', options);
        this.accept(options.accept);

        if (/^(pointer|center)$/.test(options.overlap)) {
            this.options.drop.overlap = options.overlap;
        }
        else if (utils.isNumber(options.overlap)) {
            this.options.drop.overlap = Math.max(Math.min(1, options.overlap), 0);
        }

        return this;
    }

    if (utils.isBool(options)) {
        this.options.drop.enabled = options;

        return this;
    }

    return this.options.drop;
};

Interactable.prototype.dropCheck = function (pointer, event, draggable, draggableElement, dropElement, rect) {
    var dropped = false;

    // if the dropzone has no rect (eg. display: none)
    // call the custom dropChecker or just return false
    if (!(rect = rect || this.getRect(dropElement))) {
        return (this.options.dropChecker
            ? this.options.dropChecker(pointer, event, dropped, this, dropElement, draggable, draggableElement)
            : false);
    }

    var dropOverlap = this.options.drop.overlap;

    if (dropOverlap === 'pointer') {
        var page = utils.getPageXY(pointer),
            origin = scope.getOriginXY(draggable, draggableElement),
            horizontal,
            vertical;

        page.x += origin.x;
        page.y += origin.y;

        horizontal = (page.x > rect.left) && (page.x < rect.right);
        vertical   = (page.y > rect.top ) && (page.y < rect.bottom);

        dropped = horizontal && vertical;
    }

    var dragRect = draggable.getRect(draggableElement);

    if (dropOverlap === 'center') {
        var cx = dragRect.left + dragRect.width  / 2,
            cy = dragRect.top  + dragRect.height / 2;

        dropped = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
    }

    if (utils.isNumber(dropOverlap)) {
        var overlapArea  = (Math.max(0, Math.min(rect.right , dragRect.right ) - Math.max(rect.left, dragRect.left))
                          * Math.max(0, Math.min(rect.bottom, dragRect.bottom) - Math.max(rect.top , dragRect.top ))),
            overlapRatio = overlapArea / (dragRect.width * dragRect.height);

        dropped = overlapRatio >= dropOverlap;
    }

    if (this.options.dropChecker) {
        dropped = this.options.dropChecker(pointer, dropped, this, dropElement, draggable, draggableElement);
    }

    return dropped;
};

/*\
 * Interactable.dropChecker
 [ method ]
 *
 * Gets or sets the function used to check if a dragged element is
 * over this Interactable.
 *
 - checker (function) #optional The function that will be called when checking for a drop
 = (Function | Interactable) The checker function or this Interactable
 *
 * The checker function takes the following arguments:
 *
 - pointer (Touch | PointerEvent | MouseEvent) The pointer/event that ends a drag
 - event (TouchEvent | PointerEvent | MouseEvent) The event related to the pointer
 - dropped (boolean) The value from the default drop check
 - dropzone (Interactable) The dropzone interactable
 - dropElement (Element) The dropzone element
 - draggable (Interactable) The Interactable being dragged
 - draggableElement (Element) The actual element that's being dragged
 *
 > Usage:
 | interact(target)
 | .dropChecker(function(pointer,           // Touch/PointerEvent/MouseEvent
 |                       event,             // TouchEvent/PointerEvent/MouseEvent
 |                       dropped,           // result of the default checker
 |                       dropzone,          // dropzone Interactable
 |                       dropElement,       // dropzone elemnt
 |                       draggable,         // draggable Interactable
 |                       draggableElement) {// draggable element
 |
 |   return dropped && event.target.hasAttribute('allow-drop');
 | }
\*/
Interactable.prototype.dropChecker = function (checker) {
    if (utils.isFunction(checker)) {
        this.options.dropChecker = checker;

        return this;
    }
    if (checker === null) {
        delete this.options.getRect;

        return this;
    }

    return this.options.dropChecker;
};

/*\
 * Interactable.accept
 [ method ]
 *
 * Deprecated. add an `accept` property to the options object passed to
 * @Interactable.dropzone instead.
 *
 * Gets or sets the Element or CSS selector match that this
 * Interactable accepts if it is a dropzone.
 *
 - newValue (Element | string | null) #optional
 * If it is an Element, then only that element can be dropped into this dropzone.
 * If it is a string, the element being dragged must match it as a selector.
 * If it is null, the accept options is cleared - it accepts any element.
 *
 = (string | Element | null | Interactable) The current accept option if given `undefined` or this Interactable
\*/
Interactable.prototype.accept = function (newValue) {
    if (utils.isElement(newValue)) {
        this.options.drop.accept = newValue;

        return this;
    }

    // test if it is a valid CSS selector
    if (utils.trySelector(newValue)) {
        this.options.drop.accept = newValue;

        return this;
    }

    if (newValue === null) {
        delete this.options.drop.accept;

        return this;
    }

    return this.options.drop.accept;
};
