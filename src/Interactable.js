'use strict';

var scope = require('./scope'),
    utils = require('./utils'),
    events = require('./utils/events'),
    actionBase = require('./actions/base');

/*\
 * Interactable
 [ property ]
 **
 * Object type returned by @interact
\*/
function Interactable (element, options) {
    this._element = element;
    this._iEvents = this._iEvents || {};

    var _window;

    if (utils.trySelector(element)) {
        this.selector = element;

        var context = options && options.context;

        _window = context? scope.getWindow(context) : scope.window;

        if (context && (_window.Node
                ? context instanceof _window.Node
                : (utils.isElement(context) || context === _window.document))) {

            this._context = context;
        }
    }
    else {
        _window = scope.getWindow(element);

        if (utils.isElement(element, _window)) {

            if (scope.PointerEvent) {
                events.add(this._element, scope.pEventTypes.down, scope.listeners.pointerDown );
                events.add(this._element, scope.pEventTypes.move, scope.listeners.pointerHover);
            }
            else {
                events.add(this._element, 'mousedown' , scope.listeners.pointerDown );
                events.add(this._element, 'mousemove' , scope.listeners.pointerHover);
                events.add(this._element, 'touchstart', scope.listeners.pointerDown );
                events.add(this._element, 'touchmove' , scope.listeners.pointerHover);
            }
        }
    }

    this._doc = _window.document;

    if (!utils.contains(scope.documents, this._doc)) {
        scope.listenToDocument(this._doc);
    }

    scope.interactables.push(this);

    this.set(options);
}

Interactable.prototype = {
    setOnEvents: function (action, phases) {
        if (action === 'drop') {
            if (utils.isFunction(phases.ondrop)          ) { this.ondrop           = phases.ondrop          ; }
            if (utils.isFunction(phases.ondropactivate)  ) { this.ondropactivate   = phases.ondropactivate  ; }
            if (utils.isFunction(phases.ondropdeactivate)) { this.ondropdeactivate = phases.ondropdeactivate; }
            if (utils.isFunction(phases.ondragenter)     ) { this.ondragenter      = phases.ondragenter     ; }
            if (utils.isFunction(phases.ondragleave)     ) { this.ondragleave      = phases.ondragleave     ; }
            if (utils.isFunction(phases.ondropmove)      ) { this.ondropmove       = phases.ondropmove      ; }
        }
        else {
            action = 'on' + action;

            if (utils.isFunction(phases.onstart)       ) { this[action + 'start'         ] = phases.onstart         ; }
            if (utils.isFunction(phases.onmove)        ) { this[action + 'move'          ] = phases.onmove          ; }
            if (utils.isFunction(phases.onend)         ) { this[action + 'end'           ] = phases.onend           ; }
            if (utils.isFunction(phases.oninertiastart)) { this[action + 'inertiastart'  ] = phases.oninertiastart  ; }
        }

        return this;
    },

    setPerAction: function (action, options) {
        // for all the default per-action options
        for (var option in options) {
            // if this option exists for this action
            if (option in scope.defaultOptions[action]) {
                // if the option in the options arg is an object value
                if (utils.isObject(options[option])) {
                    // duplicate the object
                    this.options[action][option] = utils.extend(this.options[action][option] || {}, options[option]);

                    if (utils.isObject(scope.defaultOptions.perAction[option]) && 'enabled' in scope.defaultOptions.perAction[option]) {
                        this.options[action][option].enabled = options[option].enabled === false? false : true;
                    }
                }
                else if (utils.isBool(options[option]) && utils.isObject(scope.defaultOptions.perAction[option])) {
                    this.options[action][option].enabled = options[option];
                }
                else if (options[option] !== undefined) {
                    // or if it's not undefined, do a plain assignment
                    this.options[action][option] = options[option];
                }
            }
        }
    },

    /*\
     * Interactable.autoScroll
     [ method ]
     **
     * Deprecated. Add an `autoscroll` property to the options object
     * passed to @Interactable.draggable or @Interactable.resizable instead.
     *
     * Returns or sets whether dragging and resizing near the edges of the
     * window/container trigger autoScroll for this Interactable
     *
     = (object) Object with autoScroll properties
     *
     * or
     *
     - options (object | boolean) #optional
     * options can be:
     * - an object with margin, distance and interval properties,
     * - true or false to enable or disable autoScroll or
     = (Interactable) this Interactable
    \*/
    autoScroll: function (options) {
        if (utils.isObject(options)) {
            options = utils.extend({ actions: ['drag', 'resize']}, options);
        }
        else if (utils.isBool(options)) {
            options = { actions: ['drag', 'resize'], enabled: options };
        }

        return this.setOptions('autoScroll', options);
    },

    /*\
     * Interactable.snap
     [ method ]
     **
     * Deprecated. Add a `snap` property to the options object passed
     * to @Interactable.draggable or @Interactable.resizable instead.
     *
     * Returns or sets if and how action coordinates are snapped. By
     * default, snapping is relative to the pointer coordinates. You can
     * change this by setting the
     * [`elementOrigin`](https://github.com/taye/interact.js/pull/72).
     **
     = (boolean | object) `false` if snap is disabled; object with snap properties if snap is enabled
     **
     * or
     **
     - options (object | boolean | null) #optional
     = (Interactable) this Interactable
     > Usage
     | interact(document.querySelector('#thing')).snap({
     |     targets: [
     |         // snap to this specific point
     |         {
     |             x: 100,
     |             y: 100,
     |             range: 25
     |         },
     |         // give this function the x and y page coords and snap to the object returned
     |         function (x, y) {
     |             return {
     |                 x: x,
     |                 y: (75 + 50 * Math.sin(x * 0.04)),
     |                 range: 40
     |             };
     |         },
     |         // create a function that snaps to a grid
     |         interact.createSnapGrid({
     |             x: 50,
     |             y: 50,
     |             range: 10,              // optional
     |             offset: { x: 5, y: 10 } // optional
     |         })
     |     ],
     |     // do not snap during normal movement.
     |     // Instead, trigger only one snapped move event
     |     // immediately before the end event.
     |     endOnly: true,
     |
     |     relativePoints: [
     |         { x: 0, y: 0 },  // snap relative to the top left of the element
     |         { x: 1, y: 1 },  // and also to the bottom right
     |     ],  
     |
     |     // offset the snap target coordinates
     |     // can be an object with x/y or 'startCoords'
     |     offset: { x: 50, y: 50 }
     |   }
     | });
    \*/
    snap: function (options) {
        var ret = this.setOptions('snap', options);

        if (ret === this) { return this; }

        return ret.drag;
    },

    setOptions: function (option, options) {
        var actions = options && utils.isArray(options.actions)
                ? options.actions
                : ['drag'];

        var i;

        if (utils.isObject(options) || utils.isBool(options)) {
            for (i = 0; i < actions.length; i++) {
                var action = /resize/.test(actions[i])? 'resize' : actions[i];

                if (!utils.isObject(this.options[action])) { continue; }

                var thisOption = this.options[action][option];

                if (utils.isObject(options)) {
                    utils.extend(thisOption, options);
                    thisOption.enabled = options.enabled === false? false: true;

                    if (option === 'snap') {
                        if (thisOption.mode === 'grid') {
                            thisOption.targets = [
                                scope.interact.createSnapGrid(utils.extend({
                                    offset: thisOption.gridOffset || { x: 0, y: 0 }
                                }, thisOption.grid || {}))
                            ];
                        }
                        else if (thisOption.mode === 'anchor') {
                            thisOption.targets = thisOption.anchors;
                        }
                        else if (thisOption.mode === 'path') {
                            thisOption.targets = thisOption.paths;
                        }

                        if ('elementOrigin' in options) {
                            thisOption.relativePoints = [options.elementOrigin];
                        }
                    }
                }
                else if (utils.isBool(options)) {
                    thisOption.enabled = options;
                }
            }

            return this;
        }

        var ret = {},
            allActions = ['drag', 'resize', 'gesture'];

        for (i = 0; i < allActions.length; i++) {
            if (option in scope.defaultOptions[allActions[i]]) {
                ret[allActions[i]] = this.options[allActions[i]][option];
            }
        }

        return ret;
    },


    /*\
     * Interactable.inertia
     [ method ]
     **
     * Deprecated. Add an `inertia` property to the options object passed
     * to @Interactable.draggable or @Interactable.resizable instead.
     *
     * Returns or sets if and how events continue to run after the pointer is released
     **
     = (boolean | object) `false` if inertia is disabled; `object` with inertia properties if inertia is enabled
     **
     * or
     **
     - options (object | boolean | null) #optional
     = (Interactable) this Interactable
     > Usage
     | // enable and use default settings
     | interact(element).inertia(true);
     |
     | // enable and use custom settings
     | interact(element).inertia({
     |     // value greater than 0
     |     // high values slow the object down more quickly
     |     resistance     : 16,
     |
     |     // the minimum launch speed (pixels per second) that results in inertia start
     |     minSpeed       : 200,
     |
     |     // inertia will stop when the object slows down to this speed
     |     endSpeed       : 20,
     |
     |     // boolean; should actions be resumed when the pointer goes down during inertia
     |     allowResume    : true,
     |
     |     // boolean; should the jump when resuming from inertia be ignored in event.dx/dy
     |     zeroResumeDelta: false,
     |
     |     // if snap/restrict are set to be endOnly and inertia is enabled, releasing
     |     // the pointer without triggering inertia will animate from the release
     |     // point to the snaped/restricted point in the given amount of time (ms)
     |     smoothEndDuration: 300,
     |
     |     // an array of action types that can have inertia (no gesture)
     |     actions        : ['drag', 'resize']
     | });
     |
     | // reset custom settings and use all defaults
     | interact(element).inertia(null);
    \*/
    inertia: function (options) {
        var ret = this.setOptions('inertia', options);

        if (ret === this) { return this; }

        return ret.drag;
    },

    getAction: function (pointer, event, interaction, element) {
        var action = this.defaultActionChecker(pointer, interaction, element);

        if (this.options.actionChecker) {
            return this.options.actionChecker(pointer, event, action, this, element, interaction);
        }

        return action;
    },

    defaultActionChecker: actionBase.defaultActionChecker,

    /*\
     * Interactable.actionChecker
     [ method ]
     *
     * Gets or sets the function used to check action to be performed on
     * pointerDown
     *
     - checker (function | null) #optional A function which takes a pointer event, defaultAction string, interactable, element and interaction as parameters and returns an object with name property 'drag' 'resize' or 'gesture' and optionally an `edges` object with boolean 'top', 'left', 'bottom' and right props.
     = (Function | Interactable) The checker function or this Interactable
     *
     | interact('.resize-drag')
     |   .resizable(true)
     |   .draggable(true)
     |   .actionChecker(function (pointer, event, action, interactable, element, interaction) {
     |
     |   if (interact.matchesSelector(event.target, '.drag-handle') {
     |     // force drag with handle target
     |     action.name = drag;
     |   }
     |   else {
     |     // resize from the top and right edges
     |     action.name  = 'resize';
     |     action.edges = { top: true, right: true };
     |   }
     |
     |   return action;
     | });
    \*/
    actionChecker: function (checker) {
        if (utils.isFunction(checker)) {
            this.options.actionChecker = checker;

            return this;
        }

        if (checker === null) {
            delete this.options.actionChecker;

            return this;
        }

        return this.options.actionChecker;
    },

    /*\
     * Interactable.getRect
     [ method ]
     *
     * The default function to get an Interactables bounding rect. Can be
     * overridden using @Interactable.rectChecker.
     *
     - element (Element) #optional The element to measure.
     = (object) The object's bounding rectangle.
     o {
     o     top   : 0,
     o     left  : 0,
     o     bottom: 0,
     o     right : 0,
     o     width : 0,
     o     height: 0
     o }
    \*/
    getRect: function rectCheck (element) {
        element = element || this._element;

        if (this.selector && !(utils.isElement(element))) {
            element = this._context.querySelector(this.selector);
        }

        return utils.getElementRect(element);
    },

    /*\
     * Interactable.rectChecker
     [ method ]
     *
     * Returns or sets the function used to calculate the interactable's
     * element's rectangle
     *
     - checker (function) #optional A function which returns this Interactable's bounding rectangle. See @Interactable.getRect
     = (function | object) The checker function or this Interactable
    \*/
    rectChecker: function (checker) {
        if (utils.isFunction(checker)) {
            this.getRect = checker;

            return this;
        }

        if (checker === null) {
            delete this.options.getRect;

            return this;
        }

        return this.getRect;
    },

    /*\
     * Interactable.styleCursor
     [ method ]
     *
     * Returns or sets whether the action that would be performed when the
     * mouse on the element are checked on `mousemove` so that the cursor
     * may be styled appropriately
     *
     - newValue (boolean) #optional
     = (boolean | Interactable) The current setting or this Interactable
    \*/
    styleCursor: function (newValue) {
        if (utils.isBool(newValue)) {
            this.options.styleCursor = newValue;

            return this;
        }

        if (newValue === null) {
            delete this.options.styleCursor;

            return this;
        }

        return this.options.styleCursor;
    },

    /*\
     * Interactable.preventDefault
     [ method ]
     *
     * Returns or sets whether to prevent the browser's default behaviour
     * in response to pointer events. Can be set to:
     *  - `'always'` to always prevent
     *  - `'never'` to never prevent
     *  - `'auto'` to let interact.js try to determine what would be best
     *
     - newValue (string) #optional `true`, `false` or `'auto'`
     = (string | Interactable) The current setting or this Interactable
    \*/
    preventDefault: function (newValue) {
        if (/^(always|never|auto)$/.test(newValue)) {
            this.options.preventDefault = newValue;
            return this;
        }

        if (utils.isBool(newValue)) {
            this.options.preventDefault = newValue? 'always' : 'never';
            return this;
        }

        return this.options.preventDefault;
    },

    /*\
     * Interactable.origin
     [ method ]
     *
     * Gets or sets the origin of the Interactable's element.  The x and y
     * of the origin will be subtracted from action event coordinates.
     *
     - origin (object | string) #optional An object eg. { x: 0, y: 0 } or string 'parent', 'self' or any CSS selector
     * OR
     - origin (Element) #optional An HTML or SVG Element whose rect will be used
     **
     = (object) The current origin or this Interactable
    \*/
    origin: function (newValue) {
        if (utils.trySelector(newValue)) {
            this.options.origin = newValue;
            return this;
        }
        else if (utils.isObject(newValue)) {
            this.options.origin = newValue;
            return this;
        }

        return this.options.origin;
    },

    /*\
     * Interactable.deltaSource
     [ method ]
     *
     * Returns or sets the mouse coordinate types used to calculate the
     * movement of the pointer.
     *
     - newValue (string) #optional Use 'client' if you will be scrolling while interacting; Use 'page' if you want autoScroll to work
     = (string | object) The current deltaSource or this Interactable
    \*/
    deltaSource: function (newValue) {
        if (newValue === 'page' || newValue === 'client') {
            this.options.deltaSource = newValue;

            return this;
        }

        return this.options.deltaSource;
    },

    /*\
     * Interactable.restrict
     [ method ]
     **
     * Deprecated. Add a `restrict` property to the options object passed to
     * @Interactable.draggable, @Interactable.resizable or @Interactable.gesturable instead.
     *
     * Returns or sets the rectangles within which actions on this
     * interactable (after snap calculations) are restricted. By default,
     * restricting is relative to the pointer coordinates. You can change
     * this by setting the
     * [`elementRect`](https://github.com/taye/interact.js/pull/72).
     **
     - options (object) #optional an object with keys drag, resize, and/or gesture whose values are rects, Elements, CSS selectors, or 'parent' or 'self'
     = (object) The current restrictions object or this Interactable
     **
     | interact(element).restrict({
     |     // the rect will be `interact.getElementRect(element.parentNode)`
     |     drag: element.parentNode,
     |
     |     // x and y are relative to the the interactable's origin
     |     resize: { x: 100, y: 100, width: 200, height: 200 }
     | })
     |
     | interact('.draggable').restrict({
     |     // the rect will be the selected element's parent
     |     drag: 'parent',
     |
     |     // do not restrict during normal movement.
     |     // Instead, trigger only one restricted move event
     |     // immediately before the end event.
     |     endOnly: true,
     |
     |     // https://github.com/taye/interact.js/pull/72#issue-41813493
     |     elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
     | });
    \*/
    restrict: function (options) {
        if (!utils.isObject(options)) {
            return this.setOptions('restrict', options);
        }

        var actions = ['drag', 'resize', 'gesture'],
            ret;

        for (var i = 0; i < actions.length; i++) {
            var action = actions[i];

            if (action in options) {
                var perAction = utils.extend({
                        actions: [action],
                        restriction: options[action]
                    }, options);

                ret = this.setOptions('restrict', perAction);
            }
        }

        return ret;
    },

    /*\
     * Interactable.context
     [ method ]
     *
     * Gets the selector context Node of the Interactable. The default is `window.document`.
     *
     = (Node) The context Node of this Interactable
     **
    \*/
    context: function () {
        return this._context;
    },

    _context: scope.document,

    /*\
     * Interactable.ignoreFrom
     [ method ]
     *
     * If the target of the `mousedown`, `pointerdown` or `touchstart`
     * event or any of it's parents match the given CSS selector or
     * Element, no drag/resize/gesture is started.
     *
     - newValue (string | Element | null) #optional a CSS selector string, an Element or `null` to not ignore any elements
     = (string | Element | object) The current ignoreFrom value or this Interactable
     **
     | interact(element, { ignoreFrom: document.getElementById('no-action') });
     | // or
     | interact(element).ignoreFrom('input, textarea, a');
    \*/
    ignoreFrom: function (newValue) {
        if (utils.trySelector(newValue)) {            // CSS selector to match event.target
            this.options.ignoreFrom = newValue;
            return this;
        }

        if (utils.isElement(newValue)) {              // specific element
            this.options.ignoreFrom = newValue;
            return this;
        }

        return this.options.ignoreFrom;
    },

    /*\
     * Interactable.allowFrom
     [ method ]
     *
     * A drag/resize/gesture is started only If the target of the
     * `mousedown`, `pointerdown` or `touchstart` event or any of it's
     * parents match the given CSS selector or Element.
     *
     - newValue (string | Element | null) #optional a CSS selector string, an Element or `null` to allow from any element
     = (string | Element | object) The current allowFrom value or this Interactable
     **
     | interact(element, { allowFrom: document.getElementById('drag-handle') });
     | // or
     | interact(element).allowFrom('.handle');
    \*/
    allowFrom: function (newValue) {
        if (utils.trySelector(newValue)) {            // CSS selector to match event.target
            this.options.allowFrom = newValue;
            return this;
        }

        if (utils.isElement(newValue)) {              // specific element
            this.options.allowFrom = newValue;
            return this;
        }

        return this.options.allowFrom;
    },

    /*\
     * Interactable.element
     [ method ]
     *
     * If this is not a selector Interactable, it returns the element this
     * interactable represents
     *
     = (Element) HTML / SVG Element
    \*/
    element: function () {
        return this._element;
    },

    /*\
     * Interactable.fire
     [ method ]
     *
     * Calls listeners for the given InteractEvent type bound globally
     * and directly to this Interactable
     *
     - iEvent (InteractEvent) The InteractEvent object to be fired on this Interactable
     = (Interactable) this Interactable
    \*/
    fire: function (iEvent) {
        if (!(iEvent && iEvent.type) || !utils.contains(scope.eventTypes, iEvent.type)) {
            return this;
        }

        var listeners,
            i,
            len,
            onEvent = 'on' + iEvent.type,
            funcName = '';

        // Interactable#on() listeners
        if (iEvent.type in this._iEvents) {
            listeners = this._iEvents[iEvent.type];

            for (i = 0, len = listeners.length; i < len && !iEvent.immediatePropagationStopped; i++) {
                funcName = listeners[i].name;
                listeners[i](iEvent);
            }
        }

        // interactable.onevent listener
        if (utils.isFunction(this[onEvent])) {
            funcName = this[onEvent].name;
            this[onEvent](iEvent);
        }

        // interact.on() listeners
        if (iEvent.type in scope.globalEvents && (listeners = scope.globalEvents[iEvent.type]))  {

            for (i = 0, len = listeners.length; i < len && !iEvent.immediatePropagationStopped; i++) {
                funcName = listeners[i].name;
                listeners[i](iEvent);
            }
        }

        return this;
    },

    /*\
     * Interactable.on
     [ method ]
     *
     * Binds a listener for an InteractEvent or DOM event.
     *
     - eventType  (string | array | object) The types of events to listen for
     - listener   (function) The function to be called on the given event(s)
     - useCapture (boolean) #optional useCapture flag for addEventListener
     = (object) This Interactable
    \*/
    on: function (eventType, listener, useCapture) {
        var i;

        if (utils.isString(eventType) && eventType.search(' ') !== -1) {
            eventType = eventType.trim().split(/ +/);
        }

        if (utils.isArray(eventType)) {
            for (i = 0; i < eventType.length; i++) {
                this.on(eventType[i], listener, useCapture);
            }

            return this;
        }

        if (utils.isObject(eventType)) {
            for (var prop in eventType) {
                this.on(prop, eventType[prop], listener);
            }

            return this;
        }

        if (eventType === 'wheel') {
            eventType = scope.wheelEvent;
        }

        // convert to boolean
        useCapture = useCapture? true: false;

        if (utils.contains(scope.eventTypes, eventType)) {
            // if this type of event was never bound to this Interactable
            if (!(eventType in this._iEvents)) {
                this._iEvents[eventType] = [listener];
            }
            else {
                this._iEvents[eventType].push(listener);
            }
        }
        // delegated event for selector
        else if (this.selector) {
            events.addDelegate(this.selector, this._context, eventType, listener, useCapture);
        }
        else {
            events.add(this._element, eventType, listener, useCapture);
        }

        return this;
    },

    /*\
     * Interactable.off
     [ method ]
     *
     * Removes an InteractEvent or DOM event listener
     *
     - eventType  (string | array | object) The types of events that were listened for
     - listener   (function) The listener function to be removed
     - useCapture (boolean) #optional useCapture flag for removeEventListener
     = (object) This Interactable
    \*/
    off: function (eventType, listener, useCapture) {
        var i;

        if (utils.isString(eventType) && eventType.search(' ') !== -1) {
            eventType = eventType.trim().split(/ +/);
        }

        if (utils.isArray(eventType)) {
            for (i = 0; i < eventType.length; i++) {
                this.off(eventType[i], listener, useCapture);
            }

            return this;
        }

        if (utils.isObject(eventType)) {
            for (var prop in eventType) {
                this.off(prop, eventType[prop], listener);
            }

            return this;
        }

        var eventList,
            index = -1;

        // convert to boolean
        useCapture = useCapture? true: false;

        if (eventType === 'wheel') {
            eventType = scope.wheelEvent;
        }

        // if it is an action event type
        if (utils.contains(scope.eventTypes, eventType)) {
            eventList = this._iEvents[eventType];

            if (eventList && (index = utils.indexOf(eventList, listener)) !== -1) {
                this._iEvents[eventType].splice(index, 1);
            }
        }
        // delegated event
        else if (this.selector) {
            events.removeDelegate(this.selector, this._context, eventType, listener, useCapture);
        }
        // remove listener from this Interatable's element
        else {
            events.remove(this._element, eventType, listener, useCapture);
        }

        return this;
    },

    /*\
     * Interactable.set
     [ method ]
     *
     * Reset the options of this Interactable
     - options (object) The new settings to apply
     = (object) This Interactablw
    \*/
    set: function (options) {
        if (!utils.isObject(options)) {
            options = {};
        }

        this.options = utils.extend({}, scope.defaultOptions.base);

        var i,
            len,
            actions = ['drag', 'drop', 'resize', 'gesture'],
            methods = ['draggable', 'dropzone', 'resizable', 'gesturable'],
            perActions = utils.extend(utils.extend({}, scope.defaultOptions.perAction), options[action] || {});

        for (i = 0; i < actions.length; i++) {
            var action = actions[i];

            this.options[action] = utils.extend({}, scope.defaultOptions[action]);

            this.setPerAction(action, perActions);

            this[methods[i]](options[action]);
        }

        var settings = [
                'accept', 'actionChecker', 'allowFrom', 'deltaSource',
                'dropChecker', 'ignoreFrom', 'origin', 'preventDefault',
                'rectChecker'
            ];

        for (i = 0, len = settings.length; i < len; i++) {
            var setting = settings[i];

            this.options[setting] = scope.defaultOptions.base[setting];

            if (setting in options) {
                this[setting](options[setting]);
            }
        }

        return this;
    },

    /*\
     * Interactable.unset
     [ method ]
     *
     * Remove this interactable from the list of interactables and remove
     * it's drag, drop, resize and gesture capabilities
     *
     = (object) @interact
    \*/
    unset: function () {
        events.remove(this._element, 'all');

        if (!utils.isString(this.selector)) {
            events.remove(this, 'all');
            if (this.options.styleCursor) {
                this._element.style.cursor = '';
            }
        }
        else {
            // remove delegated events
            for (var type in scope.delegatedEvents) {
                var delegated = scope.delegatedEvents[type];

                for (var i = 0; i < delegated.selectors.length; i++) {
                    if (delegated.selectors[i] === this.selector
                        && delegated.contexts[i] === this._context) {

                        delegated.selectors.splice(i, 1);
                        delegated.contexts .splice(i, 1);
                        delegated.listeners.splice(i, 1);

                        // remove the arrays if they are empty
                        if (!delegated.selectors.length) {
                            scope.delegatedEvents[type] = null;
                        }
                    }

                    events.remove(this._context, type, events.delegateListener);
                    events.remove(this._context, type, events.delegateUseCapture, true);

                    break;
                }
            }
        }

        this.dropzone(false);

        scope.interactables.splice(utils.indexOf(scope.interactables, this), 1);

        return scope.interact;
    }
};

module.exports = Interactable;
