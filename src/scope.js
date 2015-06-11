'use strict';


var browser = require('./utils/browser');

var scope = {};
var extend = require('./utils/extend');
var utils = require('./utils/isType');

extend(scope, require('./utils/window'));
extend(scope, require('./utils/domObjects'));
extend(scope, require('./utils/arr.js'));
extend(scope, require('./utils/isType'));

scope.pEventTypes = null;

scope.documents       = [];   // all documents being listened to

scope.interactables   = [];   // all set interactables
scope.interactions    = [];   // all interactions

scope.dynamicDrop     = false;

scope.defaultOptions = require('./defaultOptions');

// Things related to autoScroll
scope.autoScroll = require('./autoScroll');

// Less Precision with touch input
scope.margin = browser.supportsTouch || browser.supportsPointerEvent? 20: 10;

scope.pointerMoveTolerance = 1;

// for ignoring browser's simulated mouse events
scope.prevTouchTime = 0;

// Allow this many interactions to happen simultaneously
scope.maxInteractions = Infinity;

scope.actionCursors = browser.isIe9OrOlder ? {
    drag    : 'move',
    resizex : 'e-resize',
    resizey : 's-resize',
    resizexy: 'se-resize',

    resizetop        : 'n-resize',
    resizeleft       : 'w-resize',
    resizebottom     : 's-resize',
    resizeright      : 'e-resize',
    resizetopleft    : 'se-resize',
    resizebottomright: 'se-resize',
    resizetopright   : 'ne-resize',
    resizebottomleft : 'ne-resize',

    gesture : ''
} : {
    drag    : 'move',
    resizex : 'ew-resize',
    resizey : 'ns-resize',
    resizexy: 'nwse-resize',

    resizetop        : 'ns-resize',
    resizeleft       : 'ew-resize',
    resizebottom     : 'ns-resize',
    resizeright      : 'ew-resize',
    resizetopleft    : 'nwse-resize',
    resizebottomright: 'nwse-resize',
    resizetopright   : 'nesw-resize',
    resizebottomleft : 'nesw-resize',

    gesture : ''
};

scope.actionIsEnabled = {
    drag   : true,
    resize : true,
    gesture: true
};

// because Webkit and Opera still use 'mousewheel' event type
scope.wheelEvent = 'onmousewheel' in scope.document? 'mousewheel': 'wheel';

scope.eventTypes = [
    'dragstart',
    'dragmove',
    'draginertiastart',
    'dragend',
    'dragenter',
    'dragleave',
    'dropactivate',
    'dropdeactivate',
    'dropmove',
    'drop',
    'resizestart',
    'resizemove',
    'resizeinertiastart',
    'resizeend',
    'gesturestart',
    'gesturemove',
    'gestureinertiastart',
    'gestureend',

    'down',
    'move',
    'up',
    'cancel',
    'tap',
    'doubletap',
    'hold'
];

scope.globalEvents = {};

// will be polyfill function if browser is IE8
scope.ie8MatchesSelector = null;

scope.trySelector = function (value) {
    if (!scope.isString(value)) { return false; }

    // an exception will be raised if it is invalid
    scope.document.querySelector(value);
    return true;
};

scope.getScrollXY = function (win) {
    win = win || scope.window;
    return {
        x: win.scrollX || win.document.documentElement.scrollLeft,
        y: win.scrollY || win.document.documentElement.scrollTop
    };
};

scope.getActualElement = function (element) {
    return (element instanceof scope.SVGElementInstance
        ? element.correspondingUseElement
        : element);
};

scope.getElementRect = function (element) {
    var scroll = browser.isIOS7orLower
            ? { x: 0, y: 0 }
            : scope.getScrollXY(scope.getWindow(element)),
        clientRect = (element instanceof scope.SVGElement)?
            element.getBoundingClientRect():
            element.getClientRects()[0];

    return clientRect && {
            left  : clientRect.left   + scroll.x,
            right : clientRect.right  + scroll.x,
            top   : clientRect.top    + scroll.y,
            bottom: clientRect.bottom + scroll.y,
            width : clientRect.width || clientRect.right - clientRect.left,
            height: clientRect.heigh || clientRect.bottom - clientRect.top
        };
};

scope.getOriginXY = function (interactable, element) {
    var origin = interactable
        ? interactable.options.origin
        : scope.defaultOptions.origin;

    if (origin === 'parent') {
        origin = scope.parentElement(element);
    }
    else if (origin === 'self') {
        origin = interactable.getRect(element);
    }
    else if (scope.trySelector(origin)) {
        origin = scope.closest(element, origin) || { x: 0, y: 0 };
    }

    if (scope.isFunction(origin)) {
        origin = origin(interactable && element);
    }

    if (utils.isElement(origin))  {
        origin = scope.getElementRect(origin);
    }

    origin.x = ('x' in origin)? origin.x : origin.left;
    origin.y = ('y' in origin)? origin.y : origin.top;

    return origin;
};

// http://stackoverflow.com/a/5634528/2280888
scope._getQBezierValue = function (t, p1, p2, p3) {
    var iT = 1 - t;
    return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
};

scope.getQuadraticCurvePoint = function (startX, startY, cpX, cpY, endX, endY, position) {
    return {
        x:  scope._getQBezierValue(position, startX, cpX, endX),
        y:  scope._getQBezierValue(position, startY, cpY, endY)
    };
};

// http://gizma.com/easing/
scope.easeOutQuad = function (t, b, c, d) {
    t /= d;
    return -c * t*(t-2) + b;
};

scope.nodeContains = function (parent, child) {
    while (child) {
        if (child === parent) {
            return true;
        }

        child = child.parentNode;
    }

    return false;
};

scope.closest = function (child, selector) {
    var parent = scope.parentElement(child);

    while (utils.isElement(parent)) {
        if (scope.matchesSelector(parent, selector)) { return parent; }

        parent = scope.parentElement(parent);
    }

    return null;
};

scope.parentElement = function (node) {
    var parent = node.parentNode;

    if (scope.isDocFrag(parent)) {
        // skip past #shado-root fragments
        while ((parent = parent.host) && scope.isDocFrag(parent)) {}

        return parent;
    }

    return parent;
};

scope.inContext = function (interactable, element) {
    return interactable._context === element.ownerDocument
        || scope.nodeContains(interactable._context, element);
};

scope.testIgnore = function (interactable, interactableElement, element) {
    var ignoreFrom = interactable.options.ignoreFrom;

    if (!ignoreFrom || !utils.isElement(element)) { return false; }

    if (scope.isString(ignoreFrom)) {
        return scope.matchesUpTo(element, ignoreFrom, interactableElement);
    }
    else if (utils.isElement(ignoreFrom)) {
        return scope.nodeContains(ignoreFrom, element);
    }

    return false;
};

scope.testAllow = function (interactable, interactableElement, element) {
    var allowFrom = interactable.options.allowFrom;

    if (!allowFrom) { return true; }

    if (!utils.isElement(element)) { return false; }

    if (scope.isString(allowFrom)) {
        return scope.matchesUpTo(element, allowFrom, interactableElement);
    }
    else if (utils.isElement(allowFrom)) {
        return scope.nodeContains(allowFrom, element);
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

scope.withinInteractionLimit = function (interactable, element, action) {
    var options = interactable.options,
        maxActions = options[action.name].max,
        maxPerElement = options[action.name].maxPerElement,
        activeInteractions = 0,
        targetCount = 0,
        targetElementCount = 0;

    for (var i = 0, len = scope.interactions.length; i < len; i++) {
        var interaction = scope.interactions[i],
            otherAction = interaction.prepared.name,
            active = interaction.interacting();

        if (!active) { continue; }

        activeInteractions++;

        if (activeInteractions >= scope.maxInteractions) {
            return false;
        }

        if (interaction.target !== interactable) { continue; }

        targetCount += (otherAction === action.name)|0;

        if (targetCount >= maxActions) {
            return false;
        }

        if (interaction.element === element) {
            targetElementCount++;

            if (otherAction !== action.name || targetElementCount >= maxPerElement) {
                return false;
            }
        }
    }

    return scope.maxInteractions > 0;
};

// Test for the element that's "above" all other qualifiers
scope.indexOfDeepestElement = function (elements) {
    var dropzone,
        deepestZone = elements[0],
        index = deepestZone? 0: -1,
        parent,
        deepestZoneParents = [],
        dropzoneParents = [],
        child,
        i,
        n;

    for (i = 1; i < elements.length; i++) {
        dropzone = elements[i];

        // an element might belong to multiple selector dropzones
        if (!dropzone || dropzone === deepestZone) {
            continue;
        }

        if (!deepestZone) {
            deepestZone = dropzone;
            index = i;
            continue;
        }

        // check if the deepest or current are document.documentElement or document.rootElement
        // - if the current dropzone is, do nothing and continue
        if (dropzone.parentNode === dropzone.ownerDocument) {
            continue;
        }
        // - if deepest is, update with the current dropzone and continue to next
        else if (deepestZone.parentNode === dropzone.ownerDocument) {
            deepestZone = dropzone;
            index = i;
            continue;
        }

        if (!deepestZoneParents.length) {
            parent = deepestZone;
            while (parent.parentNode && parent.parentNode !== parent.ownerDocument) {
                deepestZoneParents.unshift(parent);
                parent = parent.parentNode;
            }
        }

        // if this element is an svg element and the current deepest is
        // an HTMLElement
        if (deepestZone instanceof scope.HTMLElement
            && dropzone instanceof scope.SVGElement
            && !(dropzone instanceof scope.SVGSVGElement)) {

            if (dropzone === deepestZone.parentNode) {
                continue;
            }

            parent = dropzone.ownerSVGElement;
        }
        else {
            parent = dropzone;
        }

        dropzoneParents = [];

        while (parent.parentNode !== parent.ownerDocument) {
            dropzoneParents.unshift(parent);
            parent = parent.parentNode;
        }

        n = 0;

        // get (position of last common ancestor) + 1
        while (dropzoneParents[n] && dropzoneParents[n] === deepestZoneParents[n]) {
            n++;
        }

        var parents = [
            dropzoneParents[n - 1],
            dropzoneParents[n],
            deepestZoneParents[n]
        ];

        child = parents[0].lastChild;

        while (child) {
            if (child === parents[1]) {
                deepestZone = dropzone;
                index = i;
                deepestZoneParents = [];

                break;
            }
            else if (child === parents[2]) {
                break;
            }

            child = child.previousSibling;
        }
    }

    return index;
};

scope.matchesSelector = function (element, selector, nodeList) {
    if (scope.ie8MatchesSelector) {
        return scope.ie8MatchesSelector(element, selector, nodeList);
    }

    // remove /deep/ from selectors if shadowDOM polyfill is used
    if (scope.window !== scope.realWindow) {
        selector = selector.replace(/\/deep\//g, ' ');
    }

    return element[browser.prefixedMatchesSelector](selector);
};

scope.matchesUpTo = function (element, selector, limit) {
    while (utils.isElement(element)) {
        if (scope.matchesSelector(element, selector)) {
            return true;
        }

        element = scope.parentElement(element);

        if (element === limit) {
            return scope.matchesSelector(element, selector);
        }
    }

    return false;
};

// For IE8's lack of an Element#matchesSelector
// taken from http://tanalin.com/en/blog/2012/12/matches-selector-ie8/ and modified
if (!(browser.prefixedMatchesSelector in Element.prototype) || !scope.isFunction(Element.prototype[browser.prefixedMatchesSelector])) {
    scope.ie8MatchesSelector = function (element, selector, elems) {
        elems = elems || element.parentNode.querySelectorAll(selector);

        for (var i = 0, len = elems.length; i < len; i++) {
            if (elems[i] === element) {
                return true;
            }
        }

        return false;
    };
}



module.exports = scope;
