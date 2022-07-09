"use strict";

function _typeof2(obj) { "@babel/helpers - typeof"; return _typeof2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof2(obj); }

/**
 * interact.js 1.10.17
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * https://interactjs.io/license
 */
(function (f) {
  if ((typeof exports === "undefined" ? "undefined" : _typeof2(exports)) === "object" && typeof module !== "undefined") {
    module.exports = f();
  } else if (typeof define === "function" && define.amd) {
    define([], f);
  } else {
    var g;

    if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      g = this;
    }

    g.interact = f();
  }
})(function () {
  var define, module, exports;
  var _$isWindow_71 = {};
  "use strict";

  Object.defineProperty(_$isWindow_71, "__esModule", {
    value: true
  });
  _$isWindow_71.default = void 0;

  var _default = function _default(thing) {
    return !!(thing && thing.Window) && thing instanceof thing.Window;
  };

  _$isWindow_71.default = _default;
  var _$window_78 = {};
  "use strict";

  Object.defineProperty(_$window_78, "__esModule", {
    value: true
  });
  _$window_78.getWindow = getWindow;
  _$window_78.init = init;
  _$window_78.window = _$window_78.realWindow = void 0;
  /* removed: var _$isWindow_71 = require("./isWindow"); */

  ;
  var realWindow = undefined;
  _$window_78.realWindow = realWindow;
  var win = undefined;
  _$window_78.window = win;

  function init(window) {
    // get wrapped window if using Shadow DOM polyfill
    _$window_78.realWindow = realWindow = window; // create a TextNode

    var el = window.document.createTextNode(''); // check if it's wrapped by a polyfill

    if (el.ownerDocument !== window.document && typeof window.wrap === 'function' && window.wrap(el) === el) {
      // use wrapped window
      window = window.wrap(window);
    }

    _$window_78.window = win = window;
  }

  if (typeof window !== 'undefined' && !!window) {
    init(window);
  }

  function getWindow(node) {
    if ((0, _$isWindow_71.default)(node)) {
      return node;
    }

    var rootNode = node.ownerDocument || node;
    return rootNode.defaultView || win.window;
  }

  var _$is_70 = {};
  "use strict";

  Object.defineProperty(_$is_70, "__esModule", {
    value: true
  });
  _$is_70.default = void 0;
  /* removed: var _$isWindow_71 = require("./isWindow"); */

  ;
  /* removed: var _$window_78 = require("./window"); */

  ;

  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }

  var __window_70 = function window(thing) {
    return thing === _$window_78.window || (0, _$isWindow_71.default)(thing);
  };

  var docFrag = function docFrag(thing) {
    return object(thing) && thing.nodeType === 11;
  };

  var object = function object(thing) {
    return !!thing && _typeof(thing) === 'object';
  };

  var func = function func(thing) {
    return typeof thing === 'function';
  };

  var number = function number(thing) {
    return typeof thing === 'number';
  };

  var bool = function bool(thing) {
    return typeof thing === 'boolean';
  };

  var string = function string(thing) {
    return typeof thing === 'string';
  };

  var element = function element(thing) {
    if (!thing || _typeof(thing) !== 'object') {
      return false;
    }

    var _window = _$window_78.getWindow(thing) || _$window_78.window;

    return /object|function/.test(typeof Element === "undefined" ? "undefined" : _typeof(Element)) ? thing instanceof Element || thing instanceof _window.Element : thing.nodeType === 1 && typeof thing.nodeName === 'string';
  };

  var plainObject = function plainObject(thing) {
    return object(thing) && !!thing.constructor && /function Object\b/.test(thing.constructor.toString());
  };

  var array = function array(thing) {
    return object(thing) && typeof thing.length !== 'undefined' && func(thing.splice);
  };

  var ___default_70 = {
    window: __window_70,
    docFrag: docFrag,
    object: object,
    func: func,
    number: number,
    bool: bool,
    string: string,
    element: element,
    plainObject: plainObject,
    array: array
  };
  _$is_70.default = ___default_70;
  var _$plugin_1 = {};
  "use strict";

  Object.defineProperty(_$plugin_1, "__esModule", {
    value: true
  });
  _$plugin_1.default = void 0;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;

  function install(scope) {
    var actions = scope.actions,
        Interactable = scope.Interactable,
        defaults = scope.defaults;
    Interactable.prototype.draggable = drag.draggable;
    actions.map.drag = drag;
    actions.methodDict.drag = 'draggable';
    defaults.actions.drag = drag.defaults;
  }

  function beforeMove(_ref) {
    var interaction = _ref.interaction;
    if (interaction.prepared.name !== 'drag') return;
    var axis = interaction.prepared.axis;

    if (axis === 'x') {
      interaction.coords.cur.page.y = interaction.coords.start.page.y;
      interaction.coords.cur.client.y = interaction.coords.start.client.y;
      interaction.coords.velocity.client.y = 0;
      interaction.coords.velocity.page.y = 0;
    } else if (axis === 'y') {
      interaction.coords.cur.page.x = interaction.coords.start.page.x;
      interaction.coords.cur.client.x = interaction.coords.start.client.x;
      interaction.coords.velocity.client.x = 0;
      interaction.coords.velocity.page.x = 0;
    }
  }

  function move(_ref2) {
    var iEvent = _ref2.iEvent,
        interaction = _ref2.interaction;
    if (interaction.prepared.name !== 'drag') return;
    var axis = interaction.prepared.axis;

    if (axis === 'x' || axis === 'y') {
      var opposite = axis === 'x' ? 'y' : 'x';
      iEvent.page[opposite] = interaction.coords.start.page[opposite];
      iEvent.client[opposite] = interaction.coords.start.client[opposite];
      iEvent.delta[opposite] = 0;
    }
  }
  /**
   * ```js
   * interact(element).draggable({
   *     onstart: function (event) {},
   *     onmove : function (event) {},
   *     onend  : function (event) {},
   *
   *     // the axis in which the first movement must be
   *     // for the drag sequence to start
   *     // 'xy' by default - any direction
   *     startAxis: 'x' || 'y' || 'xy',
   *
   *     // 'xy' by default - don't restrict to one axis (move in any direction)
   *     // 'x' or 'y' to restrict movement to either axis
   *     // 'start' to restrict movement to the axis the drag started in
   *     lockAxis: 'x' || 'y' || 'xy' || 'start',
   *
   *     // max number of drags that can happen concurrently
   *     // with elements of this Interactable. Infinity by default
   *     max: Infinity,
   *
   *     // max number of drags that can target the same element+Interactable
   *     // 1 by default
   *     maxPerElement: 2
   * })
   *
   * var isDraggable = interact('element').draggable(); // true
   * ```
   *
   * Get or set whether drag actions can be performed on the target
   *
   * @alias Interactable.prototype.draggable
   *
   * @param {boolean | object} [options] true/false or An object with event
   * listeners to be fired on drag events (object makes the Interactable
   * draggable)
   * @return {boolean | Interactable} boolean indicating if this can be the
   * target of drag events, or this Interctable
   */


  var draggable = function draggable(options) {
    if (_$is_70.default.object(options)) {
      this.options.drag.enabled = options.enabled !== false;
      this.setPerAction('drag', options);
      this.setOnEvents('drag', options);

      if (/^(xy|x|y|start)$/.test(options.lockAxis)) {
        this.options.drag.lockAxis = options.lockAxis;
      }

      if (/^(xy|x|y)$/.test(options.startAxis)) {
        this.options.drag.startAxis = options.startAxis;
      }

      return this;
    }

    if (_$is_70.default.bool(options)) {
      this.options.drag.enabled = options;
      return this;
    }

    return this.options.drag;
  };

  var drag = {
    id: 'actions/drag',
    install: install,
    listeners: {
      'interactions:before-action-move': beforeMove,
      'interactions:action-resume': beforeMove,
      // dragmove
      'interactions:action-move': move,
      'auto-start:check': function autoStartCheck(arg) {
        var interaction = arg.interaction,
            interactable = arg.interactable,
            buttons = arg.buttons;
        var dragOptions = interactable.options.drag;

        if (!(dragOptions && dragOptions.enabled) || // check mouseButton setting if the pointer is down
        interaction.pointerIsDown && /mouse|pointer/.test(interaction.pointerType) && (buttons & interactable.options.drag.mouseButtons) === 0) {
          return undefined;
        }

        arg.action = {
          name: 'drag',
          axis: dragOptions.lockAxis === 'start' ? dragOptions.startAxis : dragOptions.lockAxis
        };
        return false;
      }
    },
    draggable: draggable,
    beforeMove: beforeMove,
    move: move,
    defaults: {
      startAxis: 'xy',
      lockAxis: 'xy'
    },
    getCursor: function getCursor() {
      return 'move';
    }
  };
  var ___default_1 = drag;
  _$plugin_1.default = ___default_1;
  var _$domObjects_65 = {};
  "use strict";

  Object.defineProperty(_$domObjects_65, "__esModule", {
    value: true
  });
  _$domObjects_65.default = void 0;
  var domObjects = {
    init: __init_65,
    document: null,
    DocumentFragment: null,
    SVGElement: null,
    SVGSVGElement: null,
    SVGElementInstance: null,
    Element: null,
    HTMLElement: null,
    Event: null,
    Touch: null,
    PointerEvent: null
  };

  function blank() {}

  var ___default_65 = domObjects;
  _$domObjects_65.default = ___default_65;

  function __init_65(window) {
    var win = window;
    domObjects.document = win.document;
    domObjects.DocumentFragment = win.DocumentFragment || blank;
    domObjects.SVGElement = win.SVGElement || blank;
    domObjects.SVGSVGElement = win.SVGSVGElement || blank;
    domObjects.SVGElementInstance = win.SVGElementInstance || blank;
    domObjects.Element = win.Element || blank;
    domObjects.HTMLElement = win.HTMLElement || domObjects.Element;
    domObjects.Event = win.Event;
    domObjects.Touch = win.Touch || blank;
    domObjects.PointerEvent = win.PointerEvent || win.MSPointerEvent;
  }

  var _$browser_63 = {};
  "use strict";

  Object.defineProperty(_$browser_63, "__esModule", {
    value: true
  });
  _$browser_63.default = void 0;
  /* removed: var _$domObjects_65 = require("./domObjects"); */

  ;
  /* removed: var _$is_70 = require("./is"); */

  ;
  var browser = {
    init: __init_63,
    supportsTouch: null,
    supportsPointerEvent: null,
    isIOS7: null,
    isIOS: null,
    isIe9: null,
    isOperaMobile: null,
    prefixedMatchesSelector: null,
    pEventTypes: null,
    wheelEvent: null
  };

  function __init_63(window) {
    var Element = _$domObjects_65.default.Element;
    var navigator = window.navigator || {}; // Does the browser support touch input?

    browser.supportsTouch = 'ontouchstart' in window || _$is_70.default.func(window.DocumentTouch) && _$domObjects_65.default.document instanceof window.DocumentTouch; // Does the browser support PointerEvents
    // https://github.com/taye/interact.js/issues/703#issuecomment-471570492

    browser.supportsPointerEvent = navigator.pointerEnabled !== false && !!_$domObjects_65.default.PointerEvent;
    browser.isIOS = /iP(hone|od|ad)/.test(navigator.platform); // scrolling doesn't change the result of getClientRects on iOS 7

    browser.isIOS7 = /iP(hone|od|ad)/.test(navigator.platform) && /OS 7[^\d]/.test(navigator.appVersion);
    browser.isIe9 = /MSIE 9/.test(navigator.userAgent); // Opera Mobile must be handled differently

    browser.isOperaMobile = navigator.appName === 'Opera' && browser.supportsTouch && /Presto/.test(navigator.userAgent); // prefix matchesSelector

    browser.prefixedMatchesSelector = 'matches' in Element.prototype ? 'matches' : 'webkitMatchesSelector' in Element.prototype ? 'webkitMatchesSelector' : 'mozMatchesSelector' in Element.prototype ? 'mozMatchesSelector' : 'oMatchesSelector' in Element.prototype ? 'oMatchesSelector' : 'msMatchesSelector';
    browser.pEventTypes = browser.supportsPointerEvent ? _$domObjects_65.default.PointerEvent === window.MSPointerEvent ? {
      up: 'MSPointerUp',
      down: 'MSPointerDown',
      over: 'mouseover',
      out: 'mouseout',
      move: 'MSPointerMove',
      cancel: 'MSPointerCancel'
    } : {
      up: 'pointerup',
      down: 'pointerdown',
      over: 'pointerover',
      out: 'pointerout',
      move: 'pointermove',
      cancel: 'pointercancel'
    } : null; // because Webkit and Opera still use 'mousewheel' event type

    browser.wheelEvent = _$domObjects_65.default.document && 'onmousewheel' in _$domObjects_65.default.document ? 'mousewheel' : 'wheel';
  }

  var ___default_63 = browser;
  _$browser_63.default = ___default_63;
  var _$domUtils_66 = {};
  "use strict";

  Object.defineProperty(_$domUtils_66, "__esModule", {
    value: true
  });
  _$domUtils_66.closest = closest;
  _$domUtils_66.getActualElement = getActualElement;
  _$domUtils_66.getElementClientRect = getElementClientRect;
  _$domUtils_66.getElementRect = getElementRect;
  _$domUtils_66.getPath = getPath;
  _$domUtils_66.getScrollXY = getScrollXY;
  _$domUtils_66.indexOfDeepestElement = indexOfDeepestElement;
  _$domUtils_66.matchesSelector = matchesSelector;
  _$domUtils_66.matchesUpTo = matchesUpTo;
  _$domUtils_66.nodeContains = nodeContains;
  _$domUtils_66.parentNode = parentNode;
  _$domUtils_66.trySelector = trySelector;
  /* removed: var _$browser_63 = require("./browser"); */

  ;
  /* removed: var _$domObjects_65 = require("./domObjects"); */

  ;
  /* removed: var _$is_70 = require("./is"); */

  ;
  /* removed: var _$window_78 = require("./window"); */

  ;

  function nodeContains(parent, child) {
    if (parent.contains) {
      return parent.contains(child);
    }

    while (child) {
      if (child === parent) {
        return true;
      }

      child = child.parentNode;
    }

    return false;
  }

  function closest(element, selector) {
    while (_$is_70.default.element(element)) {
      if (matchesSelector(element, selector)) {
        return element;
      }

      element = parentNode(element);
    }

    return null;
  }

  function parentNode(node) {
    var parent = node.parentNode;

    if (_$is_70.default.docFrag(parent)) {
      // skip past #shado-root fragments
      // tslint:disable-next-line
      while ((parent = parent.host) && _$is_70.default.docFrag(parent)) {
        continue;
      }

      return parent;
    }

    return parent;
  }

  function matchesSelector(element, selector) {
    // remove /deep/ from selectors if shadowDOM polyfill is used
    if (_$window_78.window !== _$window_78.realWindow) {
      selector = selector.replace(/\/deep\//g, ' ');
    }

    return element[_$browser_63.default.prefixedMatchesSelector](selector);
  }

  var getParent = function getParent(el) {
    return el.parentNode || el.host;
  }; // Test for the element that's "above" all other qualifiers


  function indexOfDeepestElement(elements) {
    var deepestNodeParents = [];
    var deepestNodeIndex;

    for (var i = 0; i < elements.length; i++) {
      var currentNode = elements[i];
      var deepestNode = elements[deepestNodeIndex]; // node may appear in elements array multiple times

      if (!currentNode || i === deepestNodeIndex) {
        continue;
      }

      if (!deepestNode) {
        deepestNodeIndex = i;
        continue;
      }

      var currentNodeParent = getParent(currentNode);
      var deepestNodeParent = getParent(deepestNode); // check if the deepest or current are document.documentElement/rootElement
      // - if the current node is, do nothing and continue

      if (currentNodeParent === currentNode.ownerDocument) {
        continue;
      } // - if deepest is, update with the current node and continue to next
      else if (deepestNodeParent === currentNode.ownerDocument) {
        deepestNodeIndex = i;
        continue;
      } // compare zIndex of siblings


      if (currentNodeParent === deepestNodeParent) {
        if (zIndexIsHigherThan(currentNode, deepestNode)) {
          deepestNodeIndex = i;
        }

        continue;
      } // populate the ancestry array for the latest deepest node


      deepestNodeParents = deepestNodeParents.length ? deepestNodeParents : getNodeParents(deepestNode);
      var ancestryStart = void 0; // if the deepest node is an HTMLElement and the current node is a non root svg element

      if (deepestNode instanceof _$domObjects_65.default.HTMLElement && currentNode instanceof _$domObjects_65.default.SVGElement && !(currentNode instanceof _$domObjects_65.default.SVGSVGElement)) {
        // TODO: is this check necessary? Was this for HTML elements embedded in SVG?
        if (currentNode === deepestNodeParent) {
          continue;
        }

        ancestryStart = currentNode.ownerSVGElement;
      } else {
        ancestryStart = currentNode;
      }

      var currentNodeParents = getNodeParents(ancestryStart, deepestNode.ownerDocument);
      var commonIndex = 0; // get (position of closest common ancestor) + 1

      while (currentNodeParents[commonIndex] && currentNodeParents[commonIndex] === deepestNodeParents[commonIndex]) {
        commonIndex++;
      }

      var parents = [currentNodeParents[commonIndex - 1], currentNodeParents[commonIndex], deepestNodeParents[commonIndex]];

      if (parents[0]) {
        var child = parents[0].lastChild;

        while (child) {
          if (child === parents[1]) {
            deepestNodeIndex = i;
            deepestNodeParents = currentNodeParents;
            break;
          } else if (child === parents[2]) {
            break;
          }

          child = child.previousSibling;
        }
      }
    }

    return deepestNodeIndex;
  }

  function getNodeParents(node, limit) {
    var parents = [];
    var parent = node;
    var parentParent;

    while ((parentParent = getParent(parent)) && parent !== limit && parentParent !== parent.ownerDocument) {
      parents.unshift(parent);
      parent = parentParent;
    }

    return parents;
  }

  function zIndexIsHigherThan(higherNode, lowerNode) {
    var higherIndex = parseInt(_$window_78.getWindow(higherNode).getComputedStyle(higherNode).zIndex, 10) || 0;
    var lowerIndex = parseInt(_$window_78.getWindow(lowerNode).getComputedStyle(lowerNode).zIndex, 10) || 0;
    return higherIndex >= lowerIndex;
  }

  function matchesUpTo(element, selector, limit) {
    while (_$is_70.default.element(element)) {
      if (matchesSelector(element, selector)) {
        return true;
      }

      element = parentNode(element);

      if (element === limit) {
        return matchesSelector(element, selector);
      }
    }

    return false;
  }

  function getActualElement(element) {
    return element.correspondingUseElement || element;
  }

  function getScrollXY(relevantWindow) {
    relevantWindow = relevantWindow || _$window_78.window;
    return {
      x: relevantWindow.scrollX || relevantWindow.document.documentElement.scrollLeft,
      y: relevantWindow.scrollY || relevantWindow.document.documentElement.scrollTop
    };
  }

  function getElementClientRect(element) {
    var clientRect = element instanceof _$domObjects_65.default.SVGElement ? element.getBoundingClientRect() : element.getClientRects()[0];
    return clientRect && {
      left: clientRect.left,
      right: clientRect.right,
      top: clientRect.top,
      bottom: clientRect.bottom,
      width: clientRect.width || clientRect.right - clientRect.left,
      height: clientRect.height || clientRect.bottom - clientRect.top
    };
  }

  function getElementRect(element) {
    var clientRect = getElementClientRect(element);

    if (!_$browser_63.default.isIOS7 && clientRect) {
      var scroll = getScrollXY(_$window_78.getWindow(element));
      clientRect.left += scroll.x;
      clientRect.right += scroll.x;
      clientRect.top += scroll.y;
      clientRect.bottom += scroll.y;
    }

    return clientRect;
  }

  function getPath(node) {
    var path = [];

    while (node) {
      path.push(node);
      node = parentNode(node);
    }

    return path;
  }

  function trySelector(value) {
    if (!_$is_70.default.string(value)) {
      return false;
    } // an exception will be raised if it is invalid


    _$domObjects_65.default.document.querySelector(value);

    return true;
  }

  var _$extend_67 = {};
  "use strict";

  Object.defineProperty(_$extend_67, "__esModule", {
    value: true
  });
  _$extend_67.default = extend;

  function extend(dest, source) {
    for (var prop in source) {
      ;
      dest[prop] = source[prop];
    }

    var ret = dest;
    return ret;
  }

  var _$rect_77 = {};
  "use strict";

  Object.defineProperty(_$rect_77, "__esModule", {
    value: true
  });
  _$rect_77.addEdges = addEdges;
  _$rect_77.getStringOptionResult = getStringOptionResult;
  _$rect_77.rectToXY = rectToXY;
  _$rect_77.resolveRectLike = resolveRectLike;
  _$rect_77.tlbrToXywh = tlbrToXywh;
  _$rect_77.xywhToTlbr = xywhToTlbr;
  /* removed: var _$domUtils_66 = require("./domUtils"); */

  ;
  /* removed: var _$extend_67 = require("./extend"); */

  ;
  /* removed: var _$is_70 = require("./is"); */

  ;

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }

  function getStringOptionResult(value, target, element) {
    if (value === 'parent') {
      return (0, _$domUtils_66.parentNode)(element);
    }

    if (value === 'self') {
      return target.getRect(element);
    }

    return (0, _$domUtils_66.closest)(element, value);
  }

  function resolveRectLike(value, target, element, functionArgs) {
    var returnValue = value;

    if (_$is_70.default.string(returnValue)) {
      returnValue = getStringOptionResult(returnValue, target, element);
    } else if (_$is_70.default.func(returnValue)) {
      returnValue = returnValue.apply(void 0, _toConsumableArray(functionArgs));
    }

    if (_$is_70.default.element(returnValue)) {
      returnValue = (0, _$domUtils_66.getElementRect)(returnValue);
    }

    return returnValue;
  }

  function rectToXY(rect) {
    return rect && {
      x: 'x' in rect ? rect.x : rect.left,
      y: 'y' in rect ? rect.y : rect.top
    };
  }

  function xywhToTlbr(rect) {
    if (rect && !('left' in rect && 'top' in rect)) {
      rect = (0, _$extend_67.default)({}, rect);
      rect.left = rect.x || 0;
      rect.top = rect.y || 0;
      rect.right = rect.right || rect.left + rect.width;
      rect.bottom = rect.bottom || rect.top + rect.height;
    }

    return rect;
  }

  function tlbrToXywh(rect) {
    if (rect && !('x' in rect && 'y' in rect)) {
      rect = (0, _$extend_67.default)({}, rect);
      rect.x = rect.left || 0;
      rect.y = rect.top || 0;
      rect.width = rect.width || (rect.right || 0) - rect.x;
      rect.height = rect.height || (rect.bottom || 0) - rect.y;
    }

    return rect;
  }

  function addEdges(edges, rect, delta) {
    if (edges.left) {
      rect.left += delta.x;
    }

    if (edges.right) {
      rect.right += delta.x;
    }

    if (edges.top) {
      rect.top += delta.y;
    }

    if (edges.bottom) {
      rect.bottom += delta.y;
    }

    rect.width = rect.right - rect.left;
    rect.height = rect.bottom - rect.top;
  }

  var _$getOriginXY_68 = {};
  "use strict";

  Object.defineProperty(_$getOriginXY_68, "__esModule", {
    value: true
  });
  _$getOriginXY_68.default = ___default_68;
  /* removed: var _$rect_77 = require("./rect"); */

  ;

  function ___default_68(target, element, actionName) {
    var actionOptions = target.options[actionName];
    var actionOrigin = actionOptions && actionOptions.origin;
    var origin = actionOrigin || target.options.origin;
    var originRect = (0, _$rect_77.resolveRectLike)(origin, target, element, [target && element]);
    return (0, _$rect_77.rectToXY)(originRect) || {
      x: 0,
      y: 0
    };
  }

  var _$normalizeListeners_73 = {};
  "use strict";

  Object.defineProperty(_$normalizeListeners_73, "__esModule", {
    value: true
  });
  _$normalizeListeners_73.default = normalize;
  /* removed: var _$extend_67 = require("./extend"); */

  ;
  /* removed: var _$is_70 = require("./is"); */

  ;

  function normalize(type, listeners, result) {
    result = result || {};

    if (_$is_70.default.string(type) && type.search(' ') !== -1) {
      type = split(type);
    }

    if (_$is_70.default.array(type)) {
      return type.reduce(function (acc, t) {
        return (0, _$extend_67.default)(acc, normalize(t, listeners, result));
      }, result);
    } // ({ type: fn }) -> ('', { type: fn })


    if (_$is_70.default.object(type)) {
      listeners = type;
      type = '';
    }

    if (_$is_70.default.func(listeners)) {
      result[type] = result[type] || [];
      result[type].push(listeners);
    } else if (_$is_70.default.array(listeners)) {
      for (var _i = 0; _i < listeners.length; _i++) {
        var _ref;

        _ref = listeners[_i];
        var l = _ref;
        normalize(type, l, result);
      }
    } else if (_$is_70.default.object(listeners)) {
      for (var prefix in listeners) {
        var combinedTypes = split(prefix).map(function (p) {
          return "".concat(type).concat(p);
        });
        normalize(combinedTypes, listeners[prefix], result);
      }
    }

    return result;
  }

  function split(type) {
    return type.trim().split(/ +/);
  }

  var _$hypot_69 = {};
  "use strict";

  Object.defineProperty(_$hypot_69, "__esModule", {
    value: true
  });
  _$hypot_69.default = void 0;

  var ___default_69 = function _default(x, y) {
    return Math.sqrt(x * x + y * y);
  };

  _$hypot_69.default = ___default_69;
  var _$pointerExtend_74 = {};
  "use strict";

  Object.defineProperty(_$pointerExtend_74, "__esModule", {
    value: true
  });
  _$pointerExtend_74.default = pointerExtend;

  function pointerExtend(dest, source) {
    dest.__set || (dest.__set = {});

    var _loop = function _loop(prop) {
      if (typeof dest[prop] !== 'function' && prop !== '__set') {
        Object.defineProperty(dest, prop, {
          get: function get() {
            if (prop in dest.__set) return dest.__set[prop];
            return dest.__set[prop] = source[prop];
          },
          set: function set(value) {
            dest.__set[prop] = value;
          },
          configurable: true
        });
      }
    };

    for (var prop in source) {
      _loop(prop);
    }

    return dest;
  }

  var _$pointerUtils_75 = {};
  "use strict";

  Object.defineProperty(_$pointerUtils_75, "__esModule", {
    value: true
  });
  _$pointerUtils_75.coordsToEvent = coordsToEvent;
  _$pointerUtils_75.copyCoords = copyCoords;
  _$pointerUtils_75.getClientXY = getClientXY;
  _$pointerUtils_75.getEventTargets = getEventTargets;
  _$pointerUtils_75.getPageXY = getPageXY;
  _$pointerUtils_75.getPointerId = getPointerId;
  _$pointerUtils_75.getPointerType = getPointerType;
  _$pointerUtils_75.getTouchPair = getTouchPair;
  _$pointerUtils_75.getXY = getXY;
  _$pointerUtils_75.isNativePointer = isNativePointer;
  _$pointerUtils_75.newCoords = newCoords;
  _$pointerUtils_75.pointerAverage = pointerAverage;
  Object.defineProperty(_$pointerUtils_75, "pointerExtend", {
    enumerable: true,
    get: function get() {
      return _$pointerExtend_74.default;
    }
  });
  _$pointerUtils_75.setCoordDeltas = setCoordDeltas;
  _$pointerUtils_75.setCoordVelocity = setCoordVelocity;
  _$pointerUtils_75.setCoords = setCoords;
  _$pointerUtils_75.setZeroCoords = setZeroCoords;
  _$pointerUtils_75.touchAngle = touchAngle;
  _$pointerUtils_75.touchBBox = touchBBox;
  _$pointerUtils_75.touchDistance = touchDistance;
  /* removed: var _$browser_63 = require("./browser"); */

  ;
  /* removed: var _$domObjects_65 = require("./domObjects"); */

  ;
  /* removed: var _$domUtils_66 = require("./domUtils"); */

  ;
  /* removed: var _$hypot_69 = require("./hypot"); */

  ;
  /* removed: var _$is_70 = require("./is"); */

  ;
  /* removed: var _$pointerExtend_74 = require("./pointerExtend"); */

  ;

  function copyCoords(dest, src) {
    dest.page = dest.page || {};
    dest.page.x = src.page.x;
    dest.page.y = src.page.y;
    dest.client = dest.client || {};
    dest.client.x = src.client.x;
    dest.client.y = src.client.y;
    dest.timeStamp = src.timeStamp;
  }

  function setCoordDeltas(targetObj, prev, cur) {
    targetObj.page.x = cur.page.x - prev.page.x;
    targetObj.page.y = cur.page.y - prev.page.y;
    targetObj.client.x = cur.client.x - prev.client.x;
    targetObj.client.y = cur.client.y - prev.client.y;
    targetObj.timeStamp = cur.timeStamp - prev.timeStamp;
  }

  function setCoordVelocity(targetObj, delta) {
    var dt = Math.max(delta.timeStamp / 1000, 0.001);
    targetObj.page.x = delta.page.x / dt;
    targetObj.page.y = delta.page.y / dt;
    targetObj.client.x = delta.client.x / dt;
    targetObj.client.y = delta.client.y / dt;
    targetObj.timeStamp = dt;
  }

  function setZeroCoords(targetObj) {
    targetObj.page.x = 0;
    targetObj.page.y = 0;
    targetObj.client.x = 0;
    targetObj.client.y = 0;
  }

  function isNativePointer(pointer) {
    return pointer instanceof _$domObjects_65.default.Event || pointer instanceof _$domObjects_65.default.Touch;
  } // Get specified X/Y coords for mouse or event.touches[0]


  function getXY(type, pointer, xy) {
    xy = xy || {};
    type = type || 'page';
    xy.x = pointer[type + 'X'];
    xy.y = pointer[type + 'Y'];
    return xy;
  }

  function getPageXY(pointer, page) {
    page = page || {
      x: 0,
      y: 0
    }; // Opera Mobile handles the viewport and scrolling oddly

    if (_$browser_63.default.isOperaMobile && isNativePointer(pointer)) {
      getXY('screen', pointer, page);
      page.x += window.scrollX;
      page.y += window.scrollY;
    } else {
      getXY('page', pointer, page);
    }

    return page;
  }

  function getClientXY(pointer, client) {
    client = client || {};

    if (_$browser_63.default.isOperaMobile && isNativePointer(pointer)) {
      // Opera Mobile handles the viewport and scrolling oddly
      getXY('screen', pointer, client);
    } else {
      getXY('client', pointer, client);
    }

    return client;
  }

  function getPointerId(pointer) {
    return _$is_70.default.number(pointer.pointerId) ? pointer.pointerId : pointer.identifier;
  }

  function setCoords(dest, pointers, timeStamp) {
    var pointer = pointers.length > 1 ? pointerAverage(pointers) : pointers[0];
    getPageXY(pointer, dest.page);
    getClientXY(pointer, dest.client);
    dest.timeStamp = timeStamp;
  }

  function getTouchPair(event) {
    var touches = []; // array of touches is supplied

    if (_$is_70.default.array(event)) {
      touches[0] = event[0];
      touches[1] = event[1];
    } // an event
    else {
      if (event.type === 'touchend') {
        if (event.touches.length === 1) {
          touches[0] = event.touches[0];
          touches[1] = event.changedTouches[0];
        } else if (event.touches.length === 0) {
          touches[0] = event.changedTouches[0];
          touches[1] = event.changedTouches[1];
        }
      } else {
        touches[0] = event.touches[0];
        touches[1] = event.touches[1];
      }
    }

    return touches;
  }

  function pointerAverage(pointers) {
    var average = {
      pageX: 0,
      pageY: 0,
      clientX: 0,
      clientY: 0,
      screenX: 0,
      screenY: 0
    };

    for (var _i = 0; _i < pointers.length; _i++) {
      var _ref;

      _ref = pointers[_i];
      var pointer = _ref;

      for (var _prop in average) {
        average[_prop] += pointer[_prop];
      }
    }

    for (var prop in average) {
      average[prop] /= pointers.length;
    }

    return average;
  }

  function touchBBox(event) {
    if (!event.length) {
      return null;
    }

    var touches = getTouchPair(event);
    var minX = Math.min(touches[0].pageX, touches[1].pageX);
    var minY = Math.min(touches[0].pageY, touches[1].pageY);
    var maxX = Math.max(touches[0].pageX, touches[1].pageX);
    var maxY = Math.max(touches[0].pageY, touches[1].pageY);
    return {
      x: minX,
      y: minY,
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  function touchDistance(event, deltaSource) {
    var sourceX = deltaSource + 'X';
    var sourceY = deltaSource + 'Y';
    var touches = getTouchPair(event);
    var dx = touches[0][sourceX] - touches[1][sourceX];
    var dy = touches[0][sourceY] - touches[1][sourceY];
    return (0, _$hypot_69.default)(dx, dy);
  }

  function touchAngle(event, deltaSource) {
    var sourceX = deltaSource + 'X';
    var sourceY = deltaSource + 'Y';
    var touches = getTouchPair(event);
    var dx = touches[1][sourceX] - touches[0][sourceX];
    var dy = touches[1][sourceY] - touches[0][sourceY];
    var angle = 180 * Math.atan2(dy, dx) / Math.PI;
    return angle;
  }

  function getPointerType(pointer) {
    return _$is_70.default.string(pointer.pointerType) ? pointer.pointerType : _$is_70.default.number(pointer.pointerType) ? [undefined, undefined, 'touch', 'pen', 'mouse'][pointer.pointerType] : // if the PointerEvent API isn't available, then the "pointer" must
    // be either a MouseEvent, TouchEvent, or Touch object
    /touch/.test(pointer.type || '') || pointer instanceof _$domObjects_65.default.Touch ? 'touch' : 'mouse';
  } // [ event.target, event.currentTarget ]


  function getEventTargets(event) {
    var path = _$is_70.default.func(event.composedPath) ? event.composedPath() : event.path;
    return [_$domUtils_66.getActualElement(path ? path[0] : event.target), _$domUtils_66.getActualElement(event.currentTarget)];
  }

  function newCoords() {
    return {
      page: {
        x: 0,
        y: 0
      },
      client: {
        x: 0,
        y: 0
      },
      timeStamp: 0
    };
  }

  function coordsToEvent(coords) {
    var event = {
      coords: coords,

      get page() {
        return this.coords.page;
      },

      get client() {
        return this.coords.client;
      },

      get timeStamp() {
        return this.coords.timeStamp;
      },

      get pageX() {
        return this.coords.page.x;
      },

      get pageY() {
        return this.coords.page.y;
      },

      get clientX() {
        return this.coords.client.x;
      },

      get clientY() {
        return this.coords.client.y;
      },

      get pointerId() {
        return this.coords.pointerId;
      },

      get target() {
        return this.coords.target;
      },

      get type() {
        return this.coords.type;
      },

      get pointerType() {
        return this.coords.pointerType;
      },

      get buttons() {
        return this.coords.buttons;
      },

      preventDefault: function preventDefault() {}
    };
    return event;
  }

  var _$BaseEvent_13 = {};
  "use strict";

  Object.defineProperty(_$BaseEvent_13, "__esModule", {
    value: true
  });
  _$BaseEvent_13.BaseEvent = void 0;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var BaseEvent = /*#__PURE__*/function () {
    function BaseEvent(interaction) {
      _classCallCheck(this, BaseEvent);

      _defineProperty(this, "immediatePropagationStopped", false);

      _defineProperty(this, "propagationStopped", false);

      this._interaction = interaction;
    }

    _createClass(BaseEvent, [{
      key: "preventDefault",
      value: function preventDefault() {}
      /**
       * Don't call any other listeners (even on the current target)
       */

    }, {
      key: "stopPropagation",
      value: function stopPropagation() {
        this.propagationStopped = true;
      }
      /**
       * Don't call listeners on the remaining targets
       */

    }, {
      key: "stopImmediatePropagation",
      value: function stopImmediatePropagation() {
        this.immediatePropagationStopped = this.propagationStopped = true;
      }
    }]);

    return BaseEvent;
  }(); // defined outside of class definition to avoid assignment of undefined during
  // construction


  _$BaseEvent_13.BaseEvent = BaseEvent; // getters and setters defined here to support typescript 3.6 and below which
  // don't support getter and setters in .d.ts files

  Object.defineProperty(BaseEvent.prototype, 'interaction', {
    get: function get() {
      return this._interaction._proxy;
    },
    set: function set() {}
  });
  var _$arr_62 = {};
  "use strict";

  Object.defineProperty(_$arr_62, "__esModule", {
    value: true
  });
  _$arr_62.remove = _$arr_62.merge = _$arr_62.from = _$arr_62.findIndex = _$arr_62.find = _$arr_62.contains = void 0;

  var contains = function contains(array, target) {
    return array.indexOf(target) !== -1;
  };

  _$arr_62.contains = contains;

  var remove = function remove(array, target) {
    return array.splice(array.indexOf(target), 1);
  };

  _$arr_62.remove = remove;

  var merge = function merge(target, source) {
    for (var _i = 0; _i < source.length; _i++) {
      var _ref;

      _ref = source[_i];
      var item = _ref;
      target.push(item);
    }

    return target;
  };

  _$arr_62.merge = merge;

  var from = function from(source) {
    return merge([], source);
  };

  _$arr_62.from = from;

  var findIndex = function findIndex(array, func) {
    for (var i = 0; i < array.length; i++) {
      if (func(array[i], i, array)) {
        return i;
      }
    }

    return -1;
  };

  _$arr_62.findIndex = findIndex;

  var find = function find(array, func) {
    return array[findIndex(array, func)];
  };

  _$arr_62.find = find;
  var _$DropEvent_2 = {};
  "use strict";

  function ___typeof_2(obj) {
    "@babel/helpers - typeof";

    return ___typeof_2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, ___typeof_2(obj);
  }

  Object.defineProperty(_$DropEvent_2, "__esModule", {
    value: true
  });
  _$DropEvent_2.DropEvent = void 0;
  /* removed: var _$BaseEvent_13 = require("@interactjs/core/BaseEvent"); */

  ;
  /* removed: var _$arr_62 = require("@interactjs/utils/arr"); */

  ;

  function ___classCallCheck_2(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function ___defineProperties_2(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function ___createClass_2(Constructor, protoProps, staticProps) {
    if (protoProps) ___defineProperties_2(Constructor.prototype, protoProps);
    if (staticProps) ___defineProperties_2(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    Object.defineProperty(subClass, "prototype", {
      writable: false
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
    return _setPrototypeOf(o, p);
  }

  function _createSuper(Derived) {
    var hasNativeReflectConstruct = _isNativeReflectConstruct();

    return function _createSuperInternal() {
      var Super = _getPrototypeOf(Derived),
          result;

      if (hasNativeReflectConstruct) {
        var NewTarget = _getPrototypeOf(this).constructor;

        result = Reflect.construct(Super, arguments, NewTarget);
      } else {
        result = Super.apply(this, arguments);
      }

      return _possibleConstructorReturn(this, result);
    };
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (___typeof_2(call) === "object" || typeof call === "function")) {
      return call;
    } else if (call !== void 0) {
      throw new TypeError("Derived constructors may only return object or undefined");
    }

    return _assertThisInitialized(self);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function ___defineProperty_2(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var DropEvent = /*#__PURE__*/function (_BaseEvent) {
    _inherits(DropEvent, _BaseEvent);

    var _super = _createSuper(DropEvent);
    /**
     * Class of events fired on dropzones during drags with acceptable targets.
     */


    function DropEvent(dropState, dragEvent, type) {
      var _this;

      ___classCallCheck_2(this, DropEvent);

      _this = _super.call(this, dragEvent._interaction);

      ___defineProperty_2(_assertThisInitialized(_this), "dropzone", void 0);

      ___defineProperty_2(_assertThisInitialized(_this), "dragEvent", void 0);

      ___defineProperty_2(_assertThisInitialized(_this), "relatedTarget", void 0);

      ___defineProperty_2(_assertThisInitialized(_this), "draggable", void 0);

      ___defineProperty_2(_assertThisInitialized(_this), "propagationStopped", false);

      ___defineProperty_2(_assertThisInitialized(_this), "immediatePropagationStopped", false);

      var _ref = type === 'dragleave' ? dropState.prev : dropState.cur,
          element = _ref.element,
          dropzone = _ref.dropzone;

      _this.type = type;
      _this.target = element;
      _this.currentTarget = element;
      _this.dropzone = dropzone;
      _this.dragEvent = dragEvent;
      _this.relatedTarget = dragEvent.target;
      _this.draggable = dragEvent.interactable;
      _this.timeStamp = dragEvent.timeStamp;
      return _this;
    }
    /**
     * If this is a `dropactivate` event, the dropzone element will be
     * deactivated.
     *
     * If this is a `dragmove` or `dragenter`, a `dragleave` will be fired on the
     * dropzone element and more.
     */


    ___createClass_2(DropEvent, [{
      key: "reject",
      value: function reject() {
        var _this2 = this;

        var dropState = this._interaction.dropState;

        if (this.type !== 'dropactivate' && (!this.dropzone || dropState.cur.dropzone !== this.dropzone || dropState.cur.element !== this.target)) {
          return;
        }

        dropState.prev.dropzone = this.dropzone;
        dropState.prev.element = this.target;
        dropState.rejected = true;
        dropState.events.enter = null;
        this.stopImmediatePropagation();

        if (this.type === 'dropactivate') {
          var activeDrops = dropState.activeDrops;

          var index = _$arr_62.findIndex(activeDrops, function (_ref2) {
            var dropzone = _ref2.dropzone,
                element = _ref2.element;
            return dropzone === _this2.dropzone && element === _this2.target;
          });

          dropState.activeDrops.splice(index, 1);
          var deactivateEvent = new DropEvent(dropState, this.dragEvent, 'dropdeactivate');
          deactivateEvent.dropzone = this.dropzone;
          deactivateEvent.target = this.target;
          this.dropzone.fire(deactivateEvent);
        } else {
          this.dropzone.fire(new DropEvent(dropState, this.dragEvent, 'dragleave'));
        }
      }
    }, {
      key: "preventDefault",
      value: function preventDefault() {}
    }, {
      key: "stopPropagation",
      value: function stopPropagation() {
        this.propagationStopped = true;
      }
    }, {
      key: "stopImmediatePropagation",
      value: function stopImmediatePropagation() {
        this.immediatePropagationStopped = this.propagationStopped = true;
      }
    }]);

    return DropEvent;
  }(_$BaseEvent_13.BaseEvent);

  _$DropEvent_2.DropEvent = DropEvent;
  var _$plugin_3 = {};
  "use strict";

  Object.defineProperty(_$plugin_3, "__esModule", {
    value: true
  });
  _$plugin_3.default = void 0;
  /* removed: var _$domUtils_66 = require("@interactjs/utils/domUtils"); */

  ;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$getOriginXY_68 = require("@interactjs/utils/getOriginXY"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$normalizeListeners_73 = require("@interactjs/utils/normalizeListeners"); */

  ;
  /* removed: var _$pointerUtils_75 = require("@interactjs/utils/pointerUtils"); */

  ;
  /* removed: var _$plugin_1 = require("../drag/plugin"); */

  ;
  /* removed: var _$DropEvent_2 = require("./DropEvent"); */

  ;

  function __install_3(scope) {
    var actions = scope.actions,
        interact = scope.interactStatic,
        Interactable = scope.Interactable,
        defaults = scope.defaults;
    scope.usePlugin(_$plugin_1.default);
    /**
     *
     * ```js
     * interact('.drop').dropzone({
     *   accept: '.can-drop' || document.getElementById('single-drop'),
     *   overlap: 'pointer' || 'center' || zeroToOne
     * }
     * ```
     *
     * Returns or sets whether draggables can be dropped onto this target to
     * trigger drop events
     *
     * Dropzones can receive the following events:
     *  - `dropactivate` and `dropdeactivate` when an acceptable drag starts and ends
     *  - `dragenter` and `dragleave` when a draggable enters and leaves the dropzone
     *  - `dragmove` when a draggable that has entered the dropzone is moved
     *  - `drop` when a draggable is dropped into this dropzone
     *
     * Use the `accept` option to allow only elements that match the given CSS
     * selector or element. The value can be:
     *
     *  - **an Element** - only that element can be dropped into this dropzone.
     *  - **a string**, - the element being dragged must match it as a CSS selector.
     *  - **`null`** - accept options is cleared - it accepts any element.
     *
     * Use the `overlap` option to set how drops are checked for. The allowed
     * values are:
     *
     *   - `'pointer'`, the pointer must be over the dropzone (default)
     *   - `'center'`, the draggable element's center must be over the dropzone
     *   - a number from 0-1 which is the `(intersection area) / (draggable area)`.
     *   e.g. `0.5` for drop to happen when half of the area of the draggable is
     *   over the dropzone
     *
     * Use the `checker` option to specify a function to check if a dragged element
     * is over this Interactable.
     *
     * @param {boolean | object | null} [options] The new options to be set.
     * @return {object | Interactable} The current setting or this Interactable
     */

    Interactable.prototype.dropzone = function (options) {
      return dropzoneMethod(this, options);
    };
    /**
     * ```js
     * interact(target)
     * .dropChecker(function(dragEvent,         // related dragmove or dragend event
     *                       event,             // TouchEvent/PointerEvent/MouseEvent
     *                       dropped,           // bool result of the default checker
     *                       dropzone,          // dropzone Interactable
     *                       dropElement,       // dropzone elemnt
     *                       draggable,         // draggable Interactable
     *                       draggableElement) {// draggable element
     *
     *   return dropped && event.target.hasAttribute('allow-drop')
     * }
     * ```
     */


    Interactable.prototype.dropCheck = function (dragEvent, event, draggable, draggableElement, dropElement, rect) {
      return dropCheckMethod(this, dragEvent, event, draggable, draggableElement, dropElement, rect);
    };
    /**
     * Returns or sets whether the dimensions of dropzone elements are calculated
     * on every dragmove or only on dragstart for the default dropChecker
     *
     * @param {boolean} [newValue] True to check on each move. False to check only
     * before start
     * @return {boolean | interact} The current setting or interact
     */


    interact.dynamicDrop = function (newValue) {
      if (_$is_70.default.bool(newValue)) {
        // if (dragging && scope.dynamicDrop !== newValue && !newValue) {
        //  calcRects(dropzones)
        // }
        scope.dynamicDrop = newValue;
        return interact;
      }

      return scope.dynamicDrop;
    };

    (0, _$extend_67.default)(actions.phaselessTypes, {
      dragenter: true,
      dragleave: true,
      dropactivate: true,
      dropdeactivate: true,
      dropmove: true,
      drop: true
    });
    actions.methodDict.drop = 'dropzone';
    scope.dynamicDrop = false;
    defaults.actions.drop = drop.defaults;
  }

  function collectDrops(_ref, draggableElement) {
    var interactables = _ref.interactables;
    var drops = []; // collect all dropzones and their elements which qualify for a drop

    for (var _i = 0; _i < interactables.list.length; _i++) {
      var _ref2;

      _ref2 = interactables.list[_i];
      var _dropzone = _ref2;

      if (!_dropzone.options.drop.enabled) {
        continue;
      }

      var accept = _dropzone.options.drop.accept; // test the draggable draggableElement against the dropzone's accept setting

      if (_$is_70.default.element(accept) && accept !== draggableElement || _$is_70.default.string(accept) && !_$domUtils_66.matchesSelector(draggableElement, accept) || _$is_70.default.func(accept) && !accept({
        dropzone: _dropzone,
        draggableElement: draggableElement
      })) {
        continue;
      } // query for new elements if necessary


      var dropElements = _$is_70.default.string(_dropzone.target) ? _dropzone._context.querySelectorAll(_dropzone.target) : _$is_70.default.array(_dropzone.target) ? _dropzone.target : [_dropzone.target];

      for (var _i2 = 0; _i2 < dropElements.length; _i2++) {
        var _ref3;

        _ref3 = dropElements[_i2];
        var dropzoneElement = _ref3;

        if (dropzoneElement !== draggableElement) {
          drops.push({
            dropzone: _dropzone,
            element: dropzoneElement,
            rect: _dropzone.getRect(dropzoneElement)
          });
        }
      }
    }

    return drops;
  }

  function fireActivationEvents(activeDrops, event) {
    // loop through all active dropzones and trigger event
    for (var _i3 = 0; _i3 < activeDrops.slice().length; _i3++) {
      var _ref4;

      _ref4 = activeDrops.slice()[_i3];
      var _ref5 = _ref4,
          _dropzone2 = _ref5.dropzone,
          element = _ref5.element;
      event.dropzone = _dropzone2; // set current element as event target

      event.target = element;

      _dropzone2.fire(event);

      event.propagationStopped = event.immediatePropagationStopped = false;
    }
  } // return a new array of possible drops. getActiveDrops should always be
  // called when a drag has just started or a drag event happens while
  // dynamicDrop is true


  function getActiveDrops(scope, dragElement) {
    // get dropzones and their elements that could receive the draggable
    var activeDrops = collectDrops(scope, dragElement);

    for (var _i4 = 0; _i4 < activeDrops.length; _i4++) {
      var _ref6;

      _ref6 = activeDrops[_i4];
      var activeDrop = _ref6;
      activeDrop.rect = activeDrop.dropzone.getRect(activeDrop.element);
    }

    return activeDrops;
  }

  function getDrop(_ref7, dragEvent, pointerEvent) {
    var dropState = _ref7.dropState,
        draggable = _ref7.interactable,
        dragElement = _ref7.element;
    var validDrops = []; // collect all dropzones and their elements which qualify for a drop

    for (var _i5 = 0; _i5 < dropState.activeDrops.length; _i5++) {
      var _ref8;

      _ref8 = dropState.activeDrops[_i5];
      var _ref9 = _ref8,
          _dropzone3 = _ref9.dropzone,
          dropzoneElement = _ref9.element,
          _rect = _ref9.rect;
      validDrops.push(_dropzone3.dropCheck(dragEvent, pointerEvent, draggable, dragElement, dropzoneElement, _rect) ? dropzoneElement : null);
    } // get the most appropriate dropzone based on DOM depth and order


    var dropIndex = _$domUtils_66.indexOfDeepestElement(validDrops);

    return dropState.activeDrops[dropIndex] || null;
  }

  function getDropEvents(interaction, _pointerEvent, dragEvent) {
    var dropState = interaction.dropState;
    var dropEvents = {
      enter: null,
      leave: null,
      activate: null,
      deactivate: null,
      move: null,
      drop: null
    };

    if (dragEvent.type === 'dragstart') {
      dropEvents.activate = new _$DropEvent_2.DropEvent(dropState, dragEvent, 'dropactivate');
      dropEvents.activate.target = null;
      dropEvents.activate.dropzone = null;
    }

    if (dragEvent.type === 'dragend') {
      dropEvents.deactivate = new _$DropEvent_2.DropEvent(dropState, dragEvent, 'dropdeactivate');
      dropEvents.deactivate.target = null;
      dropEvents.deactivate.dropzone = null;
    }

    if (dropState.rejected) {
      return dropEvents;
    }

    if (dropState.cur.element !== dropState.prev.element) {
      // if there was a previous dropzone, create a dragleave event
      if (dropState.prev.dropzone) {
        dropEvents.leave = new _$DropEvent_2.DropEvent(dropState, dragEvent, 'dragleave');
        dragEvent.dragLeave = dropEvents.leave.target = dropState.prev.element;
        dragEvent.prevDropzone = dropEvents.leave.dropzone = dropState.prev.dropzone;
      } // if dropzone is not null, create a dragenter event


      if (dropState.cur.dropzone) {
        dropEvents.enter = new _$DropEvent_2.DropEvent(dropState, dragEvent, 'dragenter');
        dragEvent.dragEnter = dropState.cur.element;
        dragEvent.dropzone = dropState.cur.dropzone;
      }
    }

    if (dragEvent.type === 'dragend' && dropState.cur.dropzone) {
      dropEvents.drop = new _$DropEvent_2.DropEvent(dropState, dragEvent, 'drop');
      dragEvent.dropzone = dropState.cur.dropzone;
      dragEvent.relatedTarget = dropState.cur.element;
    }

    if (dragEvent.type === 'dragmove' && dropState.cur.dropzone) {
      dropEvents.move = new _$DropEvent_2.DropEvent(dropState, dragEvent, 'dropmove');
      dropEvents.move.dragmove = dragEvent;
      dragEvent.dropzone = dropState.cur.dropzone;
    }

    return dropEvents;
  }

  function fireDropEvents(interaction, events) {
    var dropState = interaction.dropState;
    var activeDrops = dropState.activeDrops,
        cur = dropState.cur,
        prev = dropState.prev;

    if (events.leave) {
      prev.dropzone.fire(events.leave);
    }

    if (events.enter) {
      cur.dropzone.fire(events.enter);
    }

    if (events.move) {
      cur.dropzone.fire(events.move);
    }

    if (events.drop) {
      cur.dropzone.fire(events.drop);
    }

    if (events.deactivate) {
      fireActivationEvents(activeDrops, events.deactivate);
    }

    dropState.prev.dropzone = cur.dropzone;
    dropState.prev.element = cur.element;
  }

  function onEventCreated(_ref10, scope) {
    var interaction = _ref10.interaction,
        iEvent = _ref10.iEvent,
        event = _ref10.event;

    if (iEvent.type !== 'dragmove' && iEvent.type !== 'dragend') {
      return;
    }

    var dropState = interaction.dropState;

    if (scope.dynamicDrop) {
      dropState.activeDrops = getActiveDrops(scope, interaction.element);
    }

    var dragEvent = iEvent;
    var dropResult = getDrop(interaction, dragEvent, event); // update rejected status

    dropState.rejected = dropState.rejected && !!dropResult && dropResult.dropzone === dropState.cur.dropzone && dropResult.element === dropState.cur.element;
    dropState.cur.dropzone = dropResult && dropResult.dropzone;
    dropState.cur.element = dropResult && dropResult.element;
    dropState.events = getDropEvents(interaction, event, dragEvent);
  }

  function dropzoneMethod(interactable, options) {
    if (_$is_70.default.object(options)) {
      interactable.options.drop.enabled = options.enabled !== false;

      if (options.listeners) {
        var normalized = (0, _$normalizeListeners_73.default)(options.listeners); // rename 'drop' to '' as it will be prefixed with 'drop'

        var corrected = Object.keys(normalized).reduce(function (acc, type) {
          var correctedType = /^(enter|leave)/.test(type) ? "drag".concat(type) : /^(activate|deactivate|move)/.test(type) ? "drop".concat(type) : type;
          acc[correctedType] = normalized[type];
          return acc;
        }, {});
        interactable.off(interactable.options.drop.listeners);
        interactable.on(corrected);
        interactable.options.drop.listeners = corrected;
      }

      if (_$is_70.default.func(options.ondrop)) {
        interactable.on('drop', options.ondrop);
      }

      if (_$is_70.default.func(options.ondropactivate)) {
        interactable.on('dropactivate', options.ondropactivate);
      }

      if (_$is_70.default.func(options.ondropdeactivate)) {
        interactable.on('dropdeactivate', options.ondropdeactivate);
      }

      if (_$is_70.default.func(options.ondragenter)) {
        interactable.on('dragenter', options.ondragenter);
      }

      if (_$is_70.default.func(options.ondragleave)) {
        interactable.on('dragleave', options.ondragleave);
      }

      if (_$is_70.default.func(options.ondropmove)) {
        interactable.on('dropmove', options.ondropmove);
      }

      if (/^(pointer|center)$/.test(options.overlap)) {
        interactable.options.drop.overlap = options.overlap;
      } else if (_$is_70.default.number(options.overlap)) {
        interactable.options.drop.overlap = Math.max(Math.min(1, options.overlap), 0);
      }

      if ('accept' in options) {
        interactable.options.drop.accept = options.accept;
      }

      if ('checker' in options) {
        interactable.options.drop.checker = options.checker;
      }

      return interactable;
    }

    if (_$is_70.default.bool(options)) {
      interactable.options.drop.enabled = options;
      return interactable;
    }

    return interactable.options.drop;
  }

  function dropCheckMethod(interactable, dragEvent, event, draggable, draggableElement, dropElement, rect) {
    var dropped = false; // if the dropzone has no rect (eg. display: none)
    // call the custom dropChecker or just return false

    if (!(rect = rect || interactable.getRect(dropElement))) {
      return interactable.options.drop.checker ? interactable.options.drop.checker(dragEvent, event, dropped, interactable, dropElement, draggable, draggableElement) : false;
    }

    var dropOverlap = interactable.options.drop.overlap;

    if (dropOverlap === 'pointer') {
      var origin = (0, _$getOriginXY_68.default)(draggable, draggableElement, 'drag');

      var page = _$pointerUtils_75.getPageXY(dragEvent);

      page.x += origin.x;
      page.y += origin.y;
      var horizontal = page.x > rect.left && page.x < rect.right;
      var vertical = page.y > rect.top && page.y < rect.bottom;
      dropped = horizontal && vertical;
    }

    var dragRect = draggable.getRect(draggableElement);

    if (dragRect && dropOverlap === 'center') {
      var cx = dragRect.left + dragRect.width / 2;
      var cy = dragRect.top + dragRect.height / 2;
      dropped = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
    }

    if (dragRect && _$is_70.default.number(dropOverlap)) {
      var overlapArea = Math.max(0, Math.min(rect.right, dragRect.right) - Math.max(rect.left, dragRect.left)) * Math.max(0, Math.min(rect.bottom, dragRect.bottom) - Math.max(rect.top, dragRect.top));
      var overlapRatio = overlapArea / (dragRect.width * dragRect.height);
      dropped = overlapRatio >= dropOverlap;
    }

    if (interactable.options.drop.checker) {
      dropped = interactable.options.drop.checker(dragEvent, event, dropped, interactable, dropElement, draggable, draggableElement);
    }

    return dropped;
  }

  var drop = {
    id: 'actions/drop',
    install: __install_3,
    listeners: {
      'interactions:before-action-start': function interactionsBeforeActionStart(_ref11) {
        var interaction = _ref11.interaction;

        if (interaction.prepared.name !== 'drag') {
          return;
        }

        interaction.dropState = {
          cur: {
            dropzone: null,
            element: null
          },
          prev: {
            dropzone: null,
            element: null
          },
          rejected: null,
          events: null,
          activeDrops: []
        };
      },
      'interactions:after-action-start': function interactionsAfterActionStart(_ref12, scope) {
        var interaction = _ref12.interaction,
            event = _ref12.event,
            dragEvent = _ref12.iEvent;

        if (interaction.prepared.name !== 'drag') {
          return;
        }

        var dropState = interaction.dropState; // reset active dropzones

        dropState.activeDrops = null;
        dropState.events = null;
        dropState.activeDrops = getActiveDrops(scope, interaction.element);
        dropState.events = getDropEvents(interaction, event, dragEvent);

        if (dropState.events.activate) {
          fireActivationEvents(dropState.activeDrops, dropState.events.activate);
          scope.fire('actions/drop:start', {
            interaction: interaction,
            dragEvent: dragEvent
          });
        }
      },
      'interactions:action-move': onEventCreated,
      'interactions:after-action-move': function interactionsAfterActionMove(_ref13, scope) {
        var interaction = _ref13.interaction,
            dragEvent = _ref13.iEvent;

        if (interaction.prepared.name !== 'drag') {
          return;
        }

        fireDropEvents(interaction, interaction.dropState.events);
        scope.fire('actions/drop:move', {
          interaction: interaction,
          dragEvent: dragEvent
        });
        interaction.dropState.events = {};
      },
      'interactions:action-end': function interactionsActionEnd(arg, scope) {
        if (arg.interaction.prepared.name !== 'drag') {
          return;
        }

        var interaction = arg.interaction,
            dragEvent = arg.iEvent;
        onEventCreated(arg, scope);
        fireDropEvents(interaction, interaction.dropState.events);
        scope.fire('actions/drop:end', {
          interaction: interaction,
          dragEvent: dragEvent
        });
      },
      'interactions:stop': function interactionsStop(_ref14) {
        var interaction = _ref14.interaction;

        if (interaction.prepared.name !== 'drag') {
          return;
        }

        var dropState = interaction.dropState;

        if (dropState) {
          dropState.activeDrops = null;
          dropState.events = null;
          dropState.cur.dropzone = null;
          dropState.cur.element = null;
          dropState.prev.dropzone = null;
          dropState.prev.element = null;
          dropState.rejected = false;
        }
      }
    },
    getActiveDrops: getActiveDrops,
    getDrop: getDrop,
    getDropEvents: getDropEvents,
    fireDropEvents: fireDropEvents,
    defaults: {
      enabled: false,
      accept: null,
      overlap: 'pointer'
    }
  };
  var ___default_3 = drop;
  _$plugin_3.default = ___default_3;
  var _$plugin_4 = {};
  "use strict";

  Object.defineProperty(_$plugin_4, "__esModule", {
    value: true
  });
  _$plugin_4.default = void 0;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$pointerUtils_75 = require("@interactjs/utils/pointerUtils"); */

  ;

  function __install_4(scope) {
    var actions = scope.actions,
        Interactable = scope.Interactable,
        defaults = scope.defaults;
    /**
     * ```js
     * interact(element).gesturable({
     *     onstart: function (event) {},
     *     onmove : function (event) {},
     *     onend  : function (event) {},
     *
     *     // limit multiple gestures.
     *     // See the explanation in {@link Interactable.draggable} example
     *     max: Infinity,
     *     maxPerElement: 1,
     * })
     *
     * var isGestureable = interact(element).gesturable()
     * ```
     *
     * Gets or sets whether multitouch gestures can be performed on the target
     *
     * @param {boolean | object} [options] true/false or An object with event
     * listeners to be fired on gesture events (makes the Interactable gesturable)
     * @return {boolean | Interactable} A boolean indicating if this can be the
     * target of gesture events, or this Interactable
     */

    Interactable.prototype.gesturable = function (options) {
      if (_$is_70.default.object(options)) {
        this.options.gesture.enabled = options.enabled !== false;
        this.setPerAction('gesture', options);
        this.setOnEvents('gesture', options);
        return this;
      }

      if (_$is_70.default.bool(options)) {
        this.options.gesture.enabled = options;
        return this;
      }

      return this.options.gesture;
    };

    actions.map.gesture = gesture;
    actions.methodDict.gesture = 'gesturable';
    defaults.actions.gesture = gesture.defaults;
  }

  function updateGestureProps(_ref) {
    var interaction = _ref.interaction,
        iEvent = _ref.iEvent,
        phase = _ref.phase;
    if (interaction.prepared.name !== 'gesture') return;
    var pointers = interaction.pointers.map(function (p) {
      return p.pointer;
    });
    var starting = phase === 'start';
    var ending = phase === 'end';
    var deltaSource = interaction.interactable.options.deltaSource;
    iEvent.touches = [pointers[0], pointers[1]];

    if (starting) {
      iEvent.distance = _$pointerUtils_75.touchDistance(pointers, deltaSource);
      iEvent.box = _$pointerUtils_75.touchBBox(pointers);
      iEvent.scale = 1;
      iEvent.ds = 0;
      iEvent.angle = _$pointerUtils_75.touchAngle(pointers, deltaSource);
      iEvent.da = 0;
      interaction.gesture.startDistance = iEvent.distance;
      interaction.gesture.startAngle = iEvent.angle;
    } else if (ending) {
      var prevEvent = interaction.prevEvent;
      iEvent.distance = prevEvent.distance;
      iEvent.box = prevEvent.box;
      iEvent.scale = prevEvent.scale;
      iEvent.ds = 0;
      iEvent.angle = prevEvent.angle;
      iEvent.da = 0;
    } else {
      iEvent.distance = _$pointerUtils_75.touchDistance(pointers, deltaSource);
      iEvent.box = _$pointerUtils_75.touchBBox(pointers);
      iEvent.scale = iEvent.distance / interaction.gesture.startDistance;
      iEvent.angle = _$pointerUtils_75.touchAngle(pointers, deltaSource);
      iEvent.ds = iEvent.scale - interaction.gesture.scale;
      iEvent.da = iEvent.angle - interaction.gesture.angle;
    }

    interaction.gesture.distance = iEvent.distance;
    interaction.gesture.angle = iEvent.angle;

    if (_$is_70.default.number(iEvent.scale) && iEvent.scale !== Infinity && !isNaN(iEvent.scale)) {
      interaction.gesture.scale = iEvent.scale;
    }
  }

  var gesture = {
    id: 'actions/gesture',
    before: ['actions/drag', 'actions/resize'],
    install: __install_4,
    listeners: {
      'interactions:action-start': updateGestureProps,
      'interactions:action-move': updateGestureProps,
      'interactions:action-end': updateGestureProps,
      'interactions:new': function interactionsNew(_ref2) {
        var interaction = _ref2.interaction;
        interaction.gesture = {
          angle: 0,
          distance: 0,
          scale: 1,
          startAngle: 0,
          startDistance: 0
        };
      },
      'auto-start:check': function autoStartCheck(arg) {
        if (arg.interaction.pointers.length < 2) {
          return undefined;
        }

        var gestureOptions = arg.interactable.options.gesture;

        if (!(gestureOptions && gestureOptions.enabled)) {
          return undefined;
        }

        arg.action = {
          name: 'gesture'
        };
        return false;
      }
    },
    defaults: {},
    getCursor: function getCursor() {
      return '';
    }
  };
  var ___default_4 = gesture;
  _$plugin_4.default = ___default_4;
  var _$plugin_6 = {};
  "use strict";

  Object.defineProperty(_$plugin_6, "__esModule", {
    value: true
  });
  _$plugin_6.default = void 0;
  /* removed: var _$domUtils_66 = require("@interactjs/utils/domUtils"); */

  ;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;

  function __install_6(scope) {
    var actions = scope.actions,
        browser = scope.browser,
        Interactable = scope.Interactable,
        defaults = scope.defaults; // Less Precision with touch input

    resize.cursors = initCursors(browser);
    resize.defaultMargin = browser.supportsTouch || browser.supportsPointerEvent ? 20 : 10;
    /**
     * ```js
     * interact(element).resizable({
     *   onstart: function (event) {},
     *   onmove : function (event) {},
     *   onend  : function (event) {},
     *
     *   edges: {
     *     top   : true,       // Use pointer coords to check for resize.
     *     left  : false,      // Disable resizing from left edge.
     *     bottom: '.resize-s',// Resize if pointer target matches selector
     *     right : handleEl    // Resize if pointer target is the given Element
     *   },
     *
     *     // Width and height can be adjusted independently. When `true`, width and
     *     // height are adjusted at a 1:1 ratio.
     *     square: false,
     *
     *     // Width and height can be adjusted independently. When `true`, width and
     *     // height maintain the aspect ratio they had when resizing started.
     *     preserveAspectRatio: false,
     *
     *   // a value of 'none' will limit the resize rect to a minimum of 0x0
     *   // 'negate' will allow the rect to have negative width/height
     *   // 'reposition' will keep the width/height positive by swapping
     *   // the top and bottom edges and/or swapping the left and right edges
     *   invert: 'none' || 'negate' || 'reposition'
     *
     *   // limit multiple resizes.
     *   // See the explanation in the {@link Interactable.draggable} example
     *   max: Infinity,
     *   maxPerElement: 1,
     * })
     *
     * var isResizeable = interact(element).resizable()
     * ```
     *
     * Gets or sets whether resize actions can be performed on the target
     *
     * @param {boolean | object} [options] true/false or An object with event
     * listeners to be fired on resize events (object makes the Interactable
     * resizable)
     * @return {boolean | Interactable} A boolean indicating if this can be the
     * target of resize elements, or this Interactable
     */

    Interactable.prototype.resizable = function (options) {
      return resizable(this, options, scope);
    };

    actions.map.resize = resize;
    actions.methodDict.resize = 'resizable';
    defaults.actions.resize = resize.defaults;
  }

  function resizeChecker(arg) {
    var interaction = arg.interaction,
        interactable = arg.interactable,
        element = arg.element,
        rect = arg.rect,
        buttons = arg.buttons;

    if (!rect) {
      return undefined;
    }

    var page = (0, _$extend_67.default)({}, interaction.coords.cur.page);
    var resizeOptions = interactable.options.resize;

    if (!(resizeOptions && resizeOptions.enabled) || // check mouseButton setting if the pointer is down
    interaction.pointerIsDown && /mouse|pointer/.test(interaction.pointerType) && (buttons & resizeOptions.mouseButtons) === 0) {
      return undefined;
    } // if using resize.edges


    if (_$is_70.default.object(resizeOptions.edges)) {
      var resizeEdges = {
        left: false,
        right: false,
        top: false,
        bottom: false
      };

      for (var edge in resizeEdges) {
        resizeEdges[edge] = checkResizeEdge(edge, resizeOptions.edges[edge], page, interaction._latestPointer.eventTarget, element, rect, resizeOptions.margin || resize.defaultMargin);
      }

      resizeEdges.left = resizeEdges.left && !resizeEdges.right;
      resizeEdges.top = resizeEdges.top && !resizeEdges.bottom;

      if (resizeEdges.left || resizeEdges.right || resizeEdges.top || resizeEdges.bottom) {
        arg.action = {
          name: 'resize',
          edges: resizeEdges
        };
      }
    } else {
      var right = resizeOptions.axis !== 'y' && page.x > rect.right - resize.defaultMargin;
      var bottom = resizeOptions.axis !== 'x' && page.y > rect.bottom - resize.defaultMargin;

      if (right || bottom) {
        arg.action = {
          name: 'resize',
          axes: (right ? 'x' : '') + (bottom ? 'y' : '')
        };
      }
    }

    return arg.action ? false : undefined;
  }

  function resizable(interactable, options, scope) {
    if (_$is_70.default.object(options)) {
      interactable.options.resize.enabled = options.enabled !== false;
      interactable.setPerAction('resize', options);
      interactable.setOnEvents('resize', options);

      if (_$is_70.default.string(options.axis) && /^x$|^y$|^xy$/.test(options.axis)) {
        interactable.options.resize.axis = options.axis;
      } else if (options.axis === null) {
        interactable.options.resize.axis = scope.defaults.actions.resize.axis;
      }

      if (_$is_70.default.bool(options.preserveAspectRatio)) {
        interactable.options.resize.preserveAspectRatio = options.preserveAspectRatio;
      } else if (_$is_70.default.bool(options.square)) {
        interactable.options.resize.square = options.square;
      }

      return interactable;
    }

    if (_$is_70.default.bool(options)) {
      interactable.options.resize.enabled = options;
      return interactable;
    }

    return interactable.options.resize;
  }

  function checkResizeEdge(name, value, page, element, interactableElement, rect, margin) {
    // false, '', undefined, null
    if (!value) {
      return false;
    } // true value, use pointer coords and element rect


    if (value === true) {
      // if dimensions are negative, "switch" edges
      var width = _$is_70.default.number(rect.width) ? rect.width : rect.right - rect.left;
      var height = _$is_70.default.number(rect.height) ? rect.height : rect.bottom - rect.top; // don't use margin greater than half the relevent dimension

      margin = Math.min(margin, Math.abs((name === 'left' || name === 'right' ? width : height) / 2));

      if (width < 0) {
        if (name === 'left') {
          name = 'right';
        } else if (name === 'right') {
          name = 'left';
        }
      }

      if (height < 0) {
        if (name === 'top') {
          name = 'bottom';
        } else if (name === 'bottom') {
          name = 'top';
        }
      }

      if (name === 'left') {
        var edge = width >= 0 ? rect.left : rect.right;
        return page.x < edge + margin;
      }

      if (name === 'top') {
        var _edge = height >= 0 ? rect.top : rect.bottom;

        return page.y < _edge + margin;
      }

      if (name === 'right') {
        return page.x > (width >= 0 ? rect.right : rect.left) - margin;
      }

      if (name === 'bottom') {
        return page.y > (height >= 0 ? rect.bottom : rect.top) - margin;
      }
    } // the remaining checks require an element


    if (!_$is_70.default.element(element)) {
      return false;
    }

    return _$is_70.default.element(value) ? // the value is an element to use as a resize handle
    value === element : // otherwise check if element matches value as selector
    _$domUtils_66.matchesUpTo(element, value, interactableElement);
  }
  /* eslint-disable multiline-ternary */
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports


  function initCursors(browser) {
    return browser.isIe9 ? {
      x: 'e-resize',
      y: 's-resize',
      xy: 'se-resize',
      top: 'n-resize',
      left: 'w-resize',
      bottom: 's-resize',
      right: 'e-resize',
      topleft: 'se-resize',
      bottomright: 'se-resize',
      topright: 'ne-resize',
      bottomleft: 'ne-resize'
    } : {
      x: 'ew-resize',
      y: 'ns-resize',
      xy: 'nwse-resize',
      top: 'ns-resize',
      left: 'ew-resize',
      bottom: 'ns-resize',
      right: 'ew-resize',
      topleft: 'nwse-resize',
      bottomright: 'nwse-resize',
      topright: 'nesw-resize',
      bottomleft: 'nesw-resize'
    };
  }
  /* eslint-enable multiline-ternary */


  function start(_ref) {
    var iEvent = _ref.iEvent,
        interaction = _ref.interaction;

    if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) {
      return;
    }

    var resizeEvent = iEvent;
    var rect = interaction.rect;
    interaction._rects = {
      start: (0, _$extend_67.default)({}, rect),
      corrected: (0, _$extend_67.default)({}, rect),
      previous: (0, _$extend_67.default)({}, rect),
      delta: {
        left: 0,
        right: 0,
        width: 0,
        top: 0,
        bottom: 0,
        height: 0
      }
    };
    resizeEvent.edges = interaction.prepared.edges;
    resizeEvent.rect = interaction._rects.corrected;
    resizeEvent.deltaRect = interaction._rects.delta;
  }

  function __move_6(_ref2) {
    var iEvent = _ref2.iEvent,
        interaction = _ref2.interaction;
    if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) return;
    var resizeEvent = iEvent;
    var resizeOptions = interaction.interactable.options.resize;
    var invert = resizeOptions.invert;
    var invertible = invert === 'reposition' || invert === 'negate';
    var current = interaction.rect;
    var _interaction$_rects = interaction._rects,
        startRect = _interaction$_rects.start,
        corrected = _interaction$_rects.corrected,
        deltaRect = _interaction$_rects.delta,
        previous = _interaction$_rects.previous;
    (0, _$extend_67.default)(previous, corrected);

    if (invertible) {
      // if invertible, copy the current rect
      (0, _$extend_67.default)(corrected, current);

      if (invert === 'reposition') {
        // swap edge values if necessary to keep width/height positive
        if (corrected.top > corrected.bottom) {
          var swap = corrected.top;
          corrected.top = corrected.bottom;
          corrected.bottom = swap;
        }

        if (corrected.left > corrected.right) {
          var _swap = corrected.left;
          corrected.left = corrected.right;
          corrected.right = _swap;
        }
      }
    } else {
      // if not invertible, restrict to minimum of 0x0 rect
      corrected.top = Math.min(current.top, startRect.bottom);
      corrected.bottom = Math.max(current.bottom, startRect.top);
      corrected.left = Math.min(current.left, startRect.right);
      corrected.right = Math.max(current.right, startRect.left);
    }

    corrected.width = corrected.right - corrected.left;
    corrected.height = corrected.bottom - corrected.top;

    for (var edge in corrected) {
      deltaRect[edge] = corrected[edge] - previous[edge];
    }

    resizeEvent.edges = interaction.prepared.edges;
    resizeEvent.rect = corrected;
    resizeEvent.deltaRect = deltaRect;
  }

  function end(_ref3) {
    var iEvent = _ref3.iEvent,
        interaction = _ref3.interaction;
    if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) return;
    var resizeEvent = iEvent;
    resizeEvent.edges = interaction.prepared.edges;
    resizeEvent.rect = interaction._rects.corrected;
    resizeEvent.deltaRect = interaction._rects.delta;
  }

  function updateEventAxes(_ref4) {
    var iEvent = _ref4.iEvent,
        interaction = _ref4.interaction;
    if (interaction.prepared.name !== 'resize' || !interaction.resizeAxes) return;
    var options = interaction.interactable.options;
    var resizeEvent = iEvent;

    if (options.resize.square) {
      if (interaction.resizeAxes === 'y') {
        resizeEvent.delta.x = resizeEvent.delta.y;
      } else {
        resizeEvent.delta.y = resizeEvent.delta.x;
      }

      resizeEvent.axes = 'xy';
    } else {
      resizeEvent.axes = interaction.resizeAxes;

      if (interaction.resizeAxes === 'x') {
        resizeEvent.delta.y = 0;
      } else if (interaction.resizeAxes === 'y') {
        resizeEvent.delta.x = 0;
      }
    }
  }

  var resize = {
    id: 'actions/resize',
    before: ['actions/drag'],
    install: __install_6,
    listeners: {
      'interactions:new': function interactionsNew(_ref5) {
        var interaction = _ref5.interaction;
        interaction.resizeAxes = 'xy';
      },
      'interactions:action-start': function interactionsActionStart(arg) {
        start(arg);
        updateEventAxes(arg);
      },
      'interactions:action-move': function interactionsActionMove(arg) {
        __move_6(arg);

        updateEventAxes(arg);
      },
      'interactions:action-end': end,
      'auto-start:check': resizeChecker
    },
    defaults: {
      square: false,
      preserveAspectRatio: false,
      axis: 'xy',
      // use default margin
      margin: NaN,
      // object with props left, right, top, bottom which are
      // true/false values to resize when the pointer is over that edge,
      // CSS selectors to match the handles for each direction
      // or the Elements for each handle
      edges: null,
      // a value of 'none' will limit the resize rect to a minimum of 0x0
      // 'negate' will alow the rect to have negative width/height
      // 'reposition' will keep the width/height positive by swapping
      // the top and bottom edges and/or swapping the left and right edges
      invert: 'none'
    },
    cursors: null,
    getCursor: function getCursor(_ref6) {
      var edges = _ref6.edges,
          axis = _ref6.axis,
          name = _ref6.name;
      var cursors = resize.cursors;
      var result = null;

      if (axis) {
        result = cursors[name + axis];
      } else if (edges) {
        var cursorKey = '';
        var _arr = ['top', 'bottom', 'left', 'right'];

        for (var _i = 0; _i < _arr.length; _i++) {
          var edge = _arr[_i];

          if (edges[edge]) {
            cursorKey += edge;
          }
        }

        result = cursors[cursorKey];
      }

      return result;
    },
    defaultMargin: null
  };
  var ___default_6 = resize;
  _$plugin_6.default = ___default_6;
  var _$plugin_5 = {};
  "use strict";

  Object.defineProperty(_$plugin_5, "__esModule", {
    value: true
  });
  _$plugin_5.default = void 0;
  /* removed: var _$plugin_1 = require("./drag/plugin"); */

  ;
  /* removed: var _$plugin_3 = require("./drop/plugin"); */

  ;
  /* removed: var _$plugin_4 = require("./gesture/plugin"); */

  ;
  /* removed: var _$plugin_6 = require("./resize/plugin"); */

  ;
  var ___default_5 = {
    id: 'actions',
    install: function install(scope) {
      scope.usePlugin(_$plugin_4.default);
      scope.usePlugin(_$plugin_6.default);
      scope.usePlugin(_$plugin_1.default);
      scope.usePlugin(_$plugin_3.default);
    }
  };
  _$plugin_5.default = ___default_5;
  var _$raf_76 = {};
  "use strict";

  Object.defineProperty(_$raf_76, "__esModule", {
    value: true
  });
  _$raf_76.default = void 0;
  var lastTime = 0;

  var _request;

  var _cancel;

  function __init_76(global) {
    _request = global.requestAnimationFrame;
    _cancel = global.cancelAnimationFrame;

    if (!_request) {
      var vendors = ['ms', 'moz', 'webkit', 'o'];

      for (var _i = 0; _i < vendors.length; _i++) {
        var vendor = vendors[_i];
        _request = global["".concat(vendor, "RequestAnimationFrame")];
        _cancel = global["".concat(vendor, "CancelAnimationFrame")] || global["".concat(vendor, "CancelRequestAnimationFrame")];
      }
    }

    _request = _request && _request.bind(global);
    _cancel = _cancel && _cancel.bind(global);

    if (!_request) {
      _request = function request(callback) {
        var currTime = Date.now();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var token = global.setTimeout(function () {
          // eslint-disable-next-line n/no-callback-literal
          callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return token;
      };

      _cancel = function cancel(token) {
        return clearTimeout(token);
      };
    }
  }

  var ___default_76 = {
    request: function request(callback) {
      return _request(callback);
    },
    cancel: function cancel(token) {
      return _cancel(token);
    },
    init: __init_76
  };
  _$raf_76.default = ___default_76;
  var _$plugin_7 = {};
  "use strict";

  Object.defineProperty(_$plugin_7, "__esModule", {
    value: true
  });
  _$plugin_7.default = void 0;
  _$plugin_7.getContainer = getContainer;
  _$plugin_7.getScroll = getScroll;
  _$plugin_7.getScrollSize = getScrollSize;
  _$plugin_7.getScrollSizeDelta = getScrollSizeDelta;
  /* removed: var _$domUtils_66 = require("@interactjs/utils/domUtils"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$raf_76 = require("@interactjs/utils/raf"); */

  ;
  /* removed: var _$rect_77 = require("@interactjs/utils/rect"); */

  ;
  /* removed: var _$window_78 = require("@interactjs/utils/window"); */

  ;

  function __install_7(scope) {
    var defaults = scope.defaults,
        actions = scope.actions;
    scope.autoScroll = autoScroll;

    autoScroll.now = function () {
      return scope.now();
    };

    actions.phaselessTypes.autoscroll = true;
    defaults.perAction.autoScroll = autoScroll.defaults;
  }

  var autoScroll = {
    defaults: {
      enabled: false,
      margin: 60,
      // the item that is scrolled (Window or HTMLElement)
      container: null,
      // the scroll speed in pixels per second
      speed: 300
    },
    now: Date.now,
    interaction: null,
    i: 0,
    // the handle returned by window.setInterval
    // Direction each pulse is to scroll in
    x: 0,
    y: 0,
    isScrolling: false,
    prevTime: 0,
    margin: 0,
    speed: 0,
    start: function start(interaction) {
      autoScroll.isScrolling = true;

      _$raf_76.default.cancel(autoScroll.i);

      interaction.autoScroll = autoScroll;
      autoScroll.interaction = interaction;
      autoScroll.prevTime = autoScroll.now();
      autoScroll.i = _$raf_76.default.request(autoScroll.scroll);
    },
    stop: function stop() {
      autoScroll.isScrolling = false;

      if (autoScroll.interaction) {
        autoScroll.interaction.autoScroll = null;
      }

      _$raf_76.default.cancel(autoScroll.i);
    },
    // scroll the window by the values in scroll.x/y
    scroll: function scroll() {
      var interaction = autoScroll.interaction;
      var interactable = interaction.interactable,
          element = interaction.element;
      var actionName = interaction.prepared.name;
      var options = interactable.options[actionName].autoScroll;
      var container = getContainer(options.container, interactable, element);
      var now = autoScroll.now(); // change in time in seconds

      var dt = (now - autoScroll.prevTime) / 1000; // displacement

      var s = options.speed * dt;

      if (s >= 1) {
        var scrollBy = {
          x: autoScroll.x * s,
          y: autoScroll.y * s
        };

        if (scrollBy.x || scrollBy.y) {
          var prevScroll = getScroll(container);

          if (_$is_70.default.window(container)) {
            container.scrollBy(scrollBy.x, scrollBy.y);
          } else if (container) {
            container.scrollLeft += scrollBy.x;
            container.scrollTop += scrollBy.y;
          }

          var curScroll = getScroll(container);
          var delta = {
            x: curScroll.x - prevScroll.x,
            y: curScroll.y - prevScroll.y
          };

          if (delta.x || delta.y) {
            interactable.fire({
              type: 'autoscroll',
              target: element,
              interactable: interactable,
              delta: delta,
              interaction: interaction,
              container: container
            });
          }
        }

        autoScroll.prevTime = now;
      }

      if (autoScroll.isScrolling) {
        _$raf_76.default.cancel(autoScroll.i);

        autoScroll.i = _$raf_76.default.request(autoScroll.scroll);
      }
    },
    check: function check(interactable, actionName) {
      var _options$actionName$a;

      var options = interactable.options;
      return (_options$actionName$a = options[actionName].autoScroll) == null ? void 0 : _options$actionName$a.enabled;
    },
    onInteractionMove: function onInteractionMove(_ref) {
      var interaction = _ref.interaction,
          pointer = _ref.pointer;

      if (!(interaction.interacting() && autoScroll.check(interaction.interactable, interaction.prepared.name))) {
        return;
      }

      if (interaction.simulation) {
        autoScroll.x = autoScroll.y = 0;
        return;
      }

      var top;
      var right;
      var bottom;
      var left;
      var interactable = interaction.interactable,
          element = interaction.element;
      var actionName = interaction.prepared.name;
      var options = interactable.options[actionName].autoScroll;
      var container = getContainer(options.container, interactable, element);

      if (_$is_70.default.window(container)) {
        left = pointer.clientX < autoScroll.margin;
        top = pointer.clientY < autoScroll.margin;
        right = pointer.clientX > container.innerWidth - autoScroll.margin;
        bottom = pointer.clientY > container.innerHeight - autoScroll.margin;
      } else {
        var rect = _$domUtils_66.getElementClientRect(container);

        left = pointer.clientX < rect.left + autoScroll.margin;
        top = pointer.clientY < rect.top + autoScroll.margin;
        right = pointer.clientX > rect.right - autoScroll.margin;
        bottom = pointer.clientY > rect.bottom - autoScroll.margin;
      }

      autoScroll.x = right ? 1 : left ? -1 : 0;
      autoScroll.y = bottom ? 1 : top ? -1 : 0;

      if (!autoScroll.isScrolling) {
        // set the autoScroll properties to those of the target
        autoScroll.margin = options.margin;
        autoScroll.speed = options.speed;
        autoScroll.start(interaction);
      }
    }
  };

  function getContainer(value, interactable, element) {
    return (_$is_70.default.string(value) ? (0, _$rect_77.getStringOptionResult)(value, interactable, element) : value) || (0, _$window_78.getWindow)(element);
  }

  function getScroll(container) {
    if (_$is_70.default.window(container)) {
      container = window.document.body;
    }

    return {
      x: container.scrollLeft,
      y: container.scrollTop
    };
  }

  function getScrollSize(container) {
    if (_$is_70.default.window(container)) {
      container = window.document.body;
    }

    return {
      x: container.scrollWidth,
      y: container.scrollHeight
    };
  }

  function getScrollSizeDelta(_ref2, func) {
    var interaction = _ref2.interaction,
        element = _ref2.element;
    var scrollOptions = interaction && interaction.interactable.options[interaction.prepared.name].autoScroll;

    if (!scrollOptions || !scrollOptions.enabled) {
      func();
      return {
        x: 0,
        y: 0
      };
    }

    var scrollContainer = getContainer(scrollOptions.container, interaction.interactable, element);
    var prevSize = getScroll(scrollContainer);
    func();
    var curSize = getScroll(scrollContainer);
    return {
      x: curSize.x - prevSize.x,
      y: curSize.y - prevSize.y
    };
  }

  var autoScrollPlugin = {
    id: 'auto-scroll',
    install: __install_7,
    listeners: {
      'interactions:new': function interactionsNew(_ref3) {
        var interaction = _ref3.interaction;
        interaction.autoScroll = null;
      },
      'interactions:destroy': function interactionsDestroy(_ref4) {
        var interaction = _ref4.interaction;
        interaction.autoScroll = null;
        autoScroll.stop();

        if (autoScroll.interaction) {
          autoScroll.interaction = null;
        }
      },
      'interactions:stop': autoScroll.stop,
      'interactions:action-move': function interactionsActionMove(arg) {
        return autoScroll.onInteractionMove(arg);
      }
    }
  };
  var ___default_7 = autoScrollPlugin;
  _$plugin_7.default = ___default_7;
  var _$misc_72 = {};
  "use strict";

  Object.defineProperty(_$misc_72, "__esModule", {
    value: true
  });
  _$misc_72.copyAction = copyAction;
  _$misc_72.sign = void 0;
  _$misc_72.warnOnce = warnOnce;
  /* removed: var _$window_78 = require("./window"); */

  ;

  function warnOnce(method, message) {
    var warned = false;
    return function () {
      if (!warned) {
        ;

        _$window_78.window.console.warn(message);

        warned = true;
      }

      return method.apply(this, arguments);
    };
  }

  function copyAction(dest, src) {
    dest.name = src.name;
    dest.axis = src.axis;
    dest.edges = src.edges;
    return dest;
  }

  var sign = function sign(n) {
    return n >= 0 ? 1 : -1;
  };

  _$misc_72.sign = sign;
  var _$InteractableMethods_8 = {};
  "use strict";

  Object.defineProperty(_$InteractableMethods_8, "__esModule", {
    value: true
  });
  _$InteractableMethods_8.default = void 0;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$misc_72 = require("@interactjs/utils/misc"); */

  ;

  function __install_8(scope) {
    var Interactable = scope.Interactable;

    Interactable.prototype.getAction = function getAction(pointer, event, interaction, element) {
      var action = defaultActionChecker(this, event, interaction, element, scope);

      if (this.options.actionChecker) {
        return this.options.actionChecker(pointer, event, action, this, element, interaction);
      }

      return action;
    };
    /**
     * If the target of the `mousedown`, `pointerdown` or `touchstart` event or any
     * of it's parents match the given CSS selector or Element, no
     * drag/resize/gesture is started.
     *
     * @deprecated
     * Don't use this method. Instead set the `ignoreFrom` option for each action
     * or for `pointerEvents`
     *
     * ```js
     * interact(targett)
     *   .draggable({
     *     ignoreFrom: 'input, textarea, a[href]'',
     *   })
     *   .pointerEvents({
     *     ignoreFrom: '[no-pointer]',
     *   })
     * ```
     *
     * @param {string | Element | null} [newValue] a CSS selector string, an
     * Element or `null` to not ignore any elements
     * @return {string | Element | object} The current ignoreFrom value or this
     * Interactable
     */


    Interactable.prototype.ignoreFrom = (0, _$misc_72.warnOnce)(function (newValue) {
      return this._backCompatOption('ignoreFrom', newValue);
    }, 'Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue}).');
    /**
     *
     * A drag/resize/gesture is started only If the target of the `mousedown`,
     * `pointerdown` or `touchstart` event or any of it's parents match the given
     * CSS selector or Element.
     *
     * @deprecated
     * Don't use this method. Instead set the `allowFrom` option for each action
     * or for `pointerEvents`
     *
     * ```js
     * interact(targett)
     *   .resizable({
     *     allowFrom: '.resize-handle',
     *   .pointerEvents({
     *     allowFrom: '.handle',,
     *   })
     * ```
     *
     * @param {string | Element | null} [newValue] a CSS selector string, an
     * Element or `null` to allow from any element
     * @return {string | Element | object} The current allowFrom value or this
     * Interactable
     */

    Interactable.prototype.allowFrom = (0, _$misc_72.warnOnce)(function (newValue) {
      return this._backCompatOption('allowFrom', newValue);
    }, 'Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue}).');
    /**
     * ```js
     * interact('.resize-drag')
     *   .resizable(true)
     *   .draggable(true)
     *   .actionChecker(function (pointer, event, action, interactable, element, interaction) {
     *
     *     if (interact.matchesSelector(event.target, '.drag-handle')) {
     *       // force drag with handle target
     *       action.name = drag
     *     }
     *     else {
     *       // resize from the top and right edges
     *       action.name  = 'resize'
     *       action.edges = { top: true, right: true }
     *     }
     *
     *     return action
     * })
     * ```
     *
     * Returns or sets the function used to check action to be performed on
     * pointerDown
     *
     * @param {function | null} [checker] A function which takes a pointer event,
     * defaultAction string, interactable, element and interaction as parameters
     * and returns an object with name property 'drag' 'resize' or 'gesture' and
     * optionally an `edges` object with boolean 'top', 'left', 'bottom' and right
     * props.
     * @return {Function | Interactable} The checker function or this Interactable
     */

    Interactable.prototype.actionChecker = actionChecker;
    /**
     * Returns or sets whether the the cursor should be changed depending on the
     * action that would be performed if the mouse were pressed and dragged.
     *
     * @param {boolean} [newValue]
     * @return {boolean | Interactable} The current setting or this Interactable
     */

    Interactable.prototype.styleCursor = styleCursor;
  }

  function defaultActionChecker(interactable, event, interaction, element, scope) {
    var rect = interactable.getRect(element);
    var buttons = event.buttons || {
      0: 1,
      1: 4,
      3: 8,
      4: 16
    }[event.button];
    var arg = {
      action: null,
      interactable: interactable,
      interaction: interaction,
      element: element,
      rect: rect,
      buttons: buttons
    };
    scope.fire('auto-start:check', arg);
    return arg.action;
  }

  function styleCursor(newValue) {
    if (_$is_70.default.bool(newValue)) {
      this.options.styleCursor = newValue;
      return this;
    }

    if (newValue === null) {
      delete this.options.styleCursor;
      return this;
    }

    return this.options.styleCursor;
  }

  function actionChecker(checker) {
    if (_$is_70.default.func(checker)) {
      this.options.actionChecker = checker;
      return this;
    }

    if (checker === null) {
      delete this.options.actionChecker;
      return this;
    }

    return this.options.actionChecker;
  }

  var ___default_8 = {
    id: 'auto-start/interactableMethods',
    install: __install_8
  };
  _$InteractableMethods_8.default = ___default_8;
  var _$base_9 = {};
  "use strict";

  Object.defineProperty(_$base_9, "__esModule", {
    value: true
  });
  _$base_9.default = void 0;
  /* removed: var _$domUtils_66 = require("@interactjs/utils/domUtils"); */

  ;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$misc_72 = require("@interactjs/utils/misc"); */

  ;
  /* removed: var _$InteractableMethods_8 = require("./InteractableMethods"); */

  ;

  function __install_9(scope) {
    var interact = scope.interactStatic,
        defaults = scope.defaults;
    scope.usePlugin(_$InteractableMethods_8.default);
    defaults.base.actionChecker = null;
    defaults.base.styleCursor = true;
    (0, _$extend_67.default)(defaults.perAction, {
      manualStart: false,
      max: Infinity,
      maxPerElement: 1,
      allowFrom: null,
      ignoreFrom: null,
      // only allow left button by default
      // see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons#Return_value
      mouseButtons: 1
    });
    /**
     * Returns or sets the maximum number of concurrent interactions allowed.  By
     * default only 1 interaction is allowed at a time (for backwards
     * compatibility). To allow multiple interactions on the same Interactables and
     * elements, you need to enable it in the draggable, resizable and gesturable
     * `'max'` and `'maxPerElement'` options.
     *
     * @alias module:interact.maxInteractions
     *
     * @param {number} [newValue] Any number. newValue <= 0 means no interactions.
     */

    interact.maxInteractions = function (newValue) {
      return maxInteractions(newValue, scope);
    };

    scope.autoStart = {
      // Allow this many interactions to happen simultaneously
      maxInteractions: Infinity,
      withinInteractionLimit: withinInteractionLimit,
      cursorElement: null
    };
  }

  function prepareOnDown(_ref, scope) {
    var interaction = _ref.interaction,
        pointer = _ref.pointer,
        event = _ref.event,
        eventTarget = _ref.eventTarget;
    if (interaction.interacting()) return;
    var actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
    prepare(interaction, actionInfo, scope);
  }

  function prepareOnMove(_ref2, scope) {
    var interaction = _ref2.interaction,
        pointer = _ref2.pointer,
        event = _ref2.event,
        eventTarget = _ref2.eventTarget;
    if (interaction.pointerType !== 'mouse' || interaction.pointerIsDown || interaction.interacting()) return;
    var actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
    prepare(interaction, actionInfo, scope);
  }

  function startOnMove(arg, scope) {
    var interaction = arg.interaction;

    if (!interaction.pointerIsDown || interaction.interacting() || !interaction.pointerWasMoved || !interaction.prepared.name) {
      return;
    }

    scope.fire('autoStart:before-start', arg);
    var interactable = interaction.interactable;
    var actionName = interaction.prepared.name;

    if (actionName && interactable) {
      // check manualStart and interaction limit
      if (interactable.options[actionName].manualStart || !withinInteractionLimit(interactable, interaction.element, interaction.prepared, scope)) {
        interaction.stop();
      } else {
        interaction.start(interaction.prepared, interactable, interaction.element);
        setInteractionCursor(interaction, scope);
      }
    }
  }

  function clearCursorOnStop(_ref3, scope) {
    var interaction = _ref3.interaction;
    var interactable = interaction.interactable;

    if (interactable && interactable.options.styleCursor) {
      setCursor(interaction.element, '', scope);
    }
  } // Check if the current interactable supports the action.
  // If so, return the validated action. Otherwise, return null


  function validateAction(action, interactable, element, eventTarget, scope) {
    if (interactable.testIgnoreAllow(interactable.options[action.name], element, eventTarget) && interactable.options[action.name].enabled && withinInteractionLimit(interactable, element, action, scope)) {
      return action;
    }

    return null;
  }

  function validateMatches(interaction, pointer, event, matches, matchElements, eventTarget, scope) {
    for (var i = 0, len = matches.length; i < len; i++) {
      var match = matches[i];
      var matchElement = matchElements[i];
      var matchAction = match.getAction(pointer, event, interaction, matchElement);

      if (!matchAction) {
        continue;
      }

      var action = validateAction(matchAction, match, matchElement, eventTarget, scope);

      if (action) {
        return {
          action: action,
          interactable: match,
          element: matchElement
        };
      }
    }

    return {
      action: null,
      interactable: null,
      element: null
    };
  }

  function getActionInfo(interaction, pointer, event, eventTarget, scope) {
    var matches = [];
    var matchElements = [];
    var element = eventTarget;

    function pushMatches(interactable) {
      matches.push(interactable);
      matchElements.push(element);
    }

    while (_$is_70.default.element(element)) {
      matches = [];
      matchElements = [];
      scope.interactables.forEachMatch(element, pushMatches);
      var actionInfo = validateMatches(interaction, pointer, event, matches, matchElements, eventTarget, scope);

      if (actionInfo.action && !actionInfo.interactable.options[actionInfo.action.name].manualStart) {
        return actionInfo;
      }

      element = _$domUtils_66.parentNode(element);
    }

    return {
      action: null,
      interactable: null,
      element: null
    };
  }

  function prepare(interaction, _ref4, scope) {
    var action = _ref4.action,
        interactable = _ref4.interactable,
        element = _ref4.element;
    action = action || {
      name: null
    };
    interaction.interactable = interactable;
    interaction.element = element;
    (0, _$misc_72.copyAction)(interaction.prepared, action);
    interaction.rect = interactable && action.name ? interactable.getRect(element) : null;
    setInteractionCursor(interaction, scope);
    scope.fire('autoStart:prepared', {
      interaction: interaction
    });
  }

  function withinInteractionLimit(interactable, element, action, scope) {
    var options = interactable.options;
    var maxActions = options[action.name].max;
    var maxPerElement = options[action.name].maxPerElement;
    var autoStartMax = scope.autoStart.maxInteractions;
    var activeInteractions = 0;
    var interactableCount = 0;
    var elementCount = 0; // no actions if any of these values == 0

    if (!(maxActions && maxPerElement && autoStartMax)) {
      return false;
    }

    for (var _i = 0; _i < scope.interactions.list.length; _i++) {
      var _ref5;

      _ref5 = scope.interactions.list[_i];
      var interaction = _ref5;
      var otherAction = interaction.prepared.name;

      if (!interaction.interacting()) {
        continue;
      }

      activeInteractions++;

      if (activeInteractions >= autoStartMax) {
        return false;
      }

      if (interaction.interactable !== interactable) {
        continue;
      }

      interactableCount += otherAction === action.name ? 1 : 0;

      if (interactableCount >= maxActions) {
        return false;
      }

      if (interaction.element === element) {
        elementCount++;

        if (otherAction === action.name && elementCount >= maxPerElement) {
          return false;
        }
      }
    }

    return autoStartMax > 0;
  }

  function maxInteractions(newValue, scope) {
    if (_$is_70.default.number(newValue)) {
      scope.autoStart.maxInteractions = newValue;
      return this;
    }

    return scope.autoStart.maxInteractions;
  }

  function setCursor(element, cursor, scope) {
    var prevCursorElement = scope.autoStart.cursorElement;

    if (prevCursorElement && prevCursorElement !== element) {
      prevCursorElement.style.cursor = '';
    }

    element.ownerDocument.documentElement.style.cursor = cursor;
    element.style.cursor = cursor;
    scope.autoStart.cursorElement = cursor ? element : null;
  }

  function setInteractionCursor(interaction, scope) {
    var interactable = interaction.interactable,
        element = interaction.element,
        prepared = interaction.prepared;

    if (!(interaction.pointerType === 'mouse' && interactable && interactable.options.styleCursor)) {
      // clear previous target element cursor
      if (scope.autoStart.cursorElement) {
        setCursor(scope.autoStart.cursorElement, '', scope);
      }

      return;
    }

    var cursor = '';

    if (prepared.name) {
      var cursorChecker = interactable.options[prepared.name].cursorChecker;

      if (_$is_70.default.func(cursorChecker)) {
        cursor = cursorChecker(prepared, interactable, element, interaction._interacting);
      } else {
        cursor = scope.actions.map[prepared.name].getCursor(prepared);
      }
    }

    setCursor(interaction.element, cursor || '', scope);
  }

  var autoStart = {
    id: 'auto-start/base',
    before: ['actions'],
    install: __install_9,
    listeners: {
      'interactions:down': prepareOnDown,
      'interactions:move': function interactionsMove(arg, scope) {
        prepareOnMove(arg, scope);
        startOnMove(arg, scope);
      },
      'interactions:stop': clearCursorOnStop
    },
    maxInteractions: maxInteractions,
    withinInteractionLimit: withinInteractionLimit,
    validateAction: validateAction
  };
  var ___default_9 = autoStart;
  _$base_9.default = ___default_9;
  var _$dragAxis_10 = {};
  "use strict";

  Object.defineProperty(_$dragAxis_10, "__esModule", {
    value: true
  });
  _$dragAxis_10.default = void 0;
  /* removed: var _$domUtils_66 = require("@interactjs/utils/domUtils"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$base_9 = require("./base"); */

  ;

  function beforeStart(_ref, scope) {
    var interaction = _ref.interaction,
        eventTarget = _ref.eventTarget,
        dx = _ref.dx,
        dy = _ref.dy;
    if (interaction.prepared.name !== 'drag') return; // check if a drag is in the correct axis

    var absX = Math.abs(dx);
    var absY = Math.abs(dy);
    var targetOptions = interaction.interactable.options.drag;
    var startAxis = targetOptions.startAxis;
    var currentAxis = absX > absY ? 'x' : absX < absY ? 'y' : 'xy';
    interaction.prepared.axis = targetOptions.lockAxis === 'start' ? currentAxis[0] // always lock to one axis even if currentAxis === 'xy'
    : targetOptions.lockAxis; // if the movement isn't in the startAxis of the interactable

    if (currentAxis !== 'xy' && startAxis !== 'xy' && startAxis !== currentAxis) {
      // cancel the prepared action
      ;
      interaction.prepared.name = null; // then try to get a drag from another ineractable

      var element = eventTarget;

      var getDraggable = function getDraggable(interactable) {
        if (interactable === interaction.interactable) return;
        var options = interaction.interactable.options.drag;

        if (!options.manualStart && interactable.testIgnoreAllow(options, element, eventTarget)) {
          var action = interactable.getAction(interaction.downPointer, interaction.downEvent, interaction, element);

          if (action && action.name === 'drag' && checkStartAxis(currentAxis, interactable) && _$base_9.default.validateAction(action, interactable, element, eventTarget, scope)) {
            return interactable;
          }
        }
      }; // check all interactables


      while (_$is_70.default.element(element)) {
        var interactable = scope.interactables.forEachMatch(element, getDraggable);

        if (interactable) {
          ;
          interaction.prepared.name = 'drag';
          interaction.interactable = interactable;
          interaction.element = element;
          break;
        }

        element = (0, _$domUtils_66.parentNode)(element);
      }
    }
  }

  function checkStartAxis(startAxis, interactable) {
    if (!interactable) {
      return false;
    }

    var thisAxis = interactable.options.drag.startAxis;
    return startAxis === 'xy' || thisAxis === 'xy' || thisAxis === startAxis;
  }

  var ___default_10 = {
    id: 'auto-start/dragAxis',
    listeners: {
      'autoStart:before-start': beforeStart
    }
  };
  _$dragAxis_10.default = ___default_10;
  var _$hold_11 = {};
  "use strict";

  Object.defineProperty(_$hold_11, "__esModule", {
    value: true
  });
  _$hold_11.default = void 0;
  /* removed: var _$base_9 = require("./base"); */

  ;

  function __install_11(scope) {
    var defaults = scope.defaults;
    scope.usePlugin(_$base_9.default);
    defaults.perAction.hold = 0;
    defaults.perAction.delay = 0;
  }

  function getHoldDuration(interaction) {
    var actionName = interaction.prepared && interaction.prepared.name;

    if (!actionName) {
      return null;
    }

    var options = interaction.interactable.options;
    return options[actionName].hold || options[actionName].delay;
  }

  var hold = {
    id: 'auto-start/hold',
    install: __install_11,
    listeners: {
      'interactions:new': function interactionsNew(_ref) {
        var interaction = _ref.interaction;
        interaction.autoStartHoldTimer = null;
      },
      'autoStart:prepared': function autoStartPrepared(_ref2) {
        var interaction = _ref2.interaction;
        var hold = getHoldDuration(interaction);

        if (hold > 0) {
          interaction.autoStartHoldTimer = setTimeout(function () {
            interaction.start(interaction.prepared, interaction.interactable, interaction.element);
          }, hold);
        }
      },
      'interactions:move': function interactionsMove(_ref3) {
        var interaction = _ref3.interaction,
            duplicate = _ref3.duplicate;

        if (interaction.autoStartHoldTimer && interaction.pointerWasMoved && !duplicate) {
          clearTimeout(interaction.autoStartHoldTimer);
          interaction.autoStartHoldTimer = null;
        }
      },
      // prevent regular down->move autoStart
      'autoStart:before-start': function autoStartBeforeStart(_ref4) {
        var interaction = _ref4.interaction;
        var holdDuration = getHoldDuration(interaction);

        if (holdDuration > 0) {
          interaction.prepared.name = null;
        }
      }
    },
    getHoldDuration: getHoldDuration
  };
  var ___default_11 = hold;
  _$hold_11.default = ___default_11;
  var _$plugin_12 = {};
  "use strict";

  Object.defineProperty(_$plugin_12, "__esModule", {
    value: true
  });
  _$plugin_12.default = void 0;
  /* removed: var _$base_9 = require("./base"); */

  ;
  /* removed: var _$dragAxis_10 = require("./dragAxis"); */

  ;
  /* removed: var _$hold_11 = require("./hold"); */

  ;
  var ___default_12 = {
    id: 'auto-start',
    install: function install(scope) {
      scope.usePlugin(_$base_9.default);
      scope.usePlugin(_$hold_11.default);
      scope.usePlugin(_$dragAxis_10.default);
    }
  };
  _$plugin_12.default = ___default_12;
  var _$interactablePreventDefault_22 = {};
  "use strict";

  Object.defineProperty(_$interactablePreventDefault_22, "__esModule", {
    value: true
  });
  _$interactablePreventDefault_22.default = void 0;
  _$interactablePreventDefault_22.install = __install_22;
  /* removed: var _$domUtils_66 = require("@interactjs/utils/domUtils"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$window_78 = require("@interactjs/utils/window"); */

  ;

  function preventDefault(newValue) {
    if (/^(always|never|auto)$/.test(newValue)) {
      this.options.preventDefault = newValue;
      return this;
    }

    if (_$is_70.default.bool(newValue)) {
      this.options.preventDefault = newValue ? 'always' : 'never';
      return this;
    }

    return this.options.preventDefault;
  }

  function checkAndPreventDefault(interactable, scope, event) {
    var setting = interactable.options.preventDefault;
    if (setting === 'never') return;

    if (setting === 'always') {
      event.preventDefault();
      return;
    } // setting === 'auto'
    // if the browser supports passive event listeners and isn't running on iOS,
    // don't preventDefault of touch{start,move} events. CSS touch-action and
    // user-select should be used instead of calling event.preventDefault().


    if (scope.events.supportsPassive && /^touch(start|move)$/.test(event.type)) {
      var doc = (0, _$window_78.getWindow)(event.target).document;
      var docOptions = scope.getDocOptions(doc);

      if (!(docOptions && docOptions.events) || docOptions.events.passive !== false) {
        return;
      }
    } // don't preventDefault of pointerdown events


    if (/^(mouse|pointer|touch)*(down|start)/i.test(event.type)) {
      return;
    } // don't preventDefault on editable elements


    if (_$is_70.default.element(event.target) && (0, _$domUtils_66.matchesSelector)(event.target, 'input,select,textarea,[contenteditable=true],[contenteditable=true] *')) {
      return;
    }

    event.preventDefault();
  }

  function onInteractionEvent(_ref) {
    var interaction = _ref.interaction,
        event = _ref.event;

    if (interaction.interactable) {
      interaction.interactable.checkAndPreventDefault(event);
    }
  }

  function __install_22(scope) {
    /** @lends Interactable */
    var Interactable = scope.Interactable;
    /**
     * Returns or sets whether to prevent the browser's default behaviour in
     * response to pointer events. Can be set to:
     *  - `'always'` to always prevent
     *  - `'never'` to never prevent
     *  - `'auto'` to let interact.js try to determine what would be best
     *
     * @param {string} [newValue] `'always'`, `'never'` or `'auto'`
     * @return {string | Interactable} The current setting or this Interactable
     */

    Interactable.prototype.preventDefault = preventDefault;

    Interactable.prototype.checkAndPreventDefault = function (event) {
      return checkAndPreventDefault(this, scope, event);
    }; // prevent native HTML5 drag on interact.js target elements


    scope.interactions.docEvents.push({
      type: 'dragstart',
      listener: function listener(event) {
        for (var _i = 0; _i < scope.interactions.list.length; _i++) {
          var _ref2;

          _ref2 = scope.interactions.list[_i];
          var interaction = _ref2;

          if (interaction.element && (interaction.element === event.target || (0, _$domUtils_66.nodeContains)(interaction.element, event.target))) {
            interaction.interactable.checkAndPreventDefault(event);
            return;
          }
        }
      }
    });
  }

  var ___default_22 = {
    id: 'core/interactablePreventDefault',
    install: __install_22,
    listeners: ['down', 'move', 'up', 'cancel'].reduce(function (acc, eventType) {
      acc["interactions:".concat(eventType)] = onInteractionEvent;
      return acc;
    }, {})
  };
  _$interactablePreventDefault_22.default = ___default_22;
  var _$plugin_29 = {};
  "use strict";

  Object.defineProperty(_$plugin_29, "__esModule", {
    value: true
  });
  _$plugin_29.default = void 0;
  var ___default_29 = {};
  _$plugin_29.default = ___default_29;
  var _$plugin_28 = {};
  "use strict";

  Object.defineProperty(_$plugin_28, "__esModule", {
    value: true
  });
  _$plugin_28.default = void 0;
  /* removed: var _$plugin_29 = require("@interactjs/dev-tools/visualizer/plugin"); */

  ;
  /* removed: var _$domObjects_65 = require("@interactjs/utils/domObjects"); */

  ;
  /* removed: var _$domUtils_66 = require("@interactjs/utils/domUtils"); */

  ;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$window_78 = require("@interactjs/utils/window"); */

  ;

  function ___toConsumableArray_28(arr) {
    return ___arrayWithoutHoles_28(arr) || ___iterableToArray_28(arr) || ___unsupportedIterableToArray_28(arr) || ___nonIterableSpread_28();
  }

  function ___nonIterableSpread_28() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function ___unsupportedIterableToArray_28(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return ___arrayLikeToArray_28(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return ___arrayLikeToArray_28(o, minLen);
  }

  function ___iterableToArray_28(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
  }

  function ___arrayWithoutHoles_28(arr) {
    if (Array.isArray(arr)) return ___arrayLikeToArray_28(arr);
  }

  function ___arrayLikeToArray_28(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }

  var CheckName;

  (function (CheckName) {
    CheckName["touchAction"] = "touchAction";
    CheckName["boxSizing"] = "boxSizing";
    CheckName["noListeners"] = "noListeners";
  })(CheckName || (CheckName = {}));

  var prefix = '[interact.js] ';
  var links = {
    touchAction: 'https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action',
    boxSizing: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing'
  }; // eslint-disable-next-line no-undef

  var isProduction = "development" === 'production';

  function __install_28(scope) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        logger = _ref.logger;

    var Interactable = scope.Interactable,
        defaults = scope.defaults;
    scope.logger = logger || console;
    defaults.base.devTools = {
      ignore: {}
    };

    Interactable.prototype.devTools = function (options) {
      if (options) {
        (0, _$extend_67.default)(this.options.devTools, options);
        return this;
      }

      return this.options.devTools;
    };

    scope.usePlugin(_$plugin_29.default);
  }

  var checks = [{
    name: CheckName.touchAction,
    perform: function perform(_ref2) {
      var element = _ref2.element;
      return !parentHasStyle(element, 'touchAction', /pan-|pinch|none/);
    },
    getInfo: function getInfo(_ref3) {
      var element = _ref3.element;
      return [element, links.touchAction];
    },
    text: 'Consider adding CSS "touch-action: none" to this element\n'
  }, {
    name: CheckName.boxSizing,
    perform: function perform(interaction) {
      var element = interaction.element;
      return interaction.prepared.name === 'resize' && element instanceof _$domObjects_65.default.HTMLElement && !hasStyle(element, 'boxSizing', /border-box/);
    },
    text: 'Consider adding CSS "box-sizing: border-box" to this resizable element',
    getInfo: function getInfo(_ref4) {
      var element = _ref4.element;
      return [element, links.boxSizing];
    }
  }, {
    name: CheckName.noListeners,
    perform: function perform(interaction) {
      var actionName = interaction.prepared.name;
      var moveListeners = interaction.interactable.events.types["".concat(actionName, "move")] || [];
      return !moveListeners.length;
    },
    getInfo: function getInfo(interaction) {
      return [interaction.prepared.name, interaction.interactable];
    },
    text: 'There are no listeners set for this action'
  }];

  function hasStyle(element, prop, styleRe) {
    var value = element.style[prop] || _$window_78.window.getComputedStyle(element)[prop];

    return styleRe.test((value || '').toString());
  }

  function parentHasStyle(element, prop, styleRe) {
    var parent = element;

    while (_$is_70.default.element(parent)) {
      if (hasStyle(parent, prop, styleRe)) {
        return true;
      }

      parent = (0, _$domUtils_66.parentNode)(parent);
    }

    return false;
  }

  var id = 'dev-tools';
  var defaultExport = isProduction ? {
    id: id,
    install: function install() {}
  } : {
    id: id,
    install: __install_28,
    listeners: {
      'interactions:action-start': function interactionsActionStart(_ref5, scope) {
        var interaction = _ref5.interaction;

        for (var _i = 0; _i < checks.length; _i++) {
          var _ref6;

          _ref6 = checks[_i];
          var check = _ref6;
          var options = interaction.interactable && interaction.interactable.options;

          if (!(options && options.devTools && options.devTools.ignore[check.name]) && check.perform(interaction)) {
            var _scope$logger;

            (_scope$logger = scope.logger).warn.apply(_scope$logger, [prefix + check.text].concat(___toConsumableArray_28(check.getInfo(interaction))));
          }
        }
      }
    },
    checks: checks,
    CheckName: CheckName,
    links: links,
    prefix: prefix
  };
  var ___default_28 = defaultExport;
  _$plugin_28.default = ___default_28;
  var _$clone_64 = {};
  "use strict";

  Object.defineProperty(_$clone_64, "__esModule", {
    value: true
  });
  _$clone_64.default = clone;
  /* removed: var _$arr_62 = require("./arr"); */

  ;
  /* removed: var _$is_70 = require("./is"); */

  ; // tslint:disable-next-line ban-types

  function clone(source) {
    var dest = {};

    for (var prop in source) {
      var value = source[prop];

      if (_$is_70.default.plainObject(value)) {
        dest[prop] = clone(value);
      } else if (_$is_70.default.array(value)) {
        dest[prop] = _$arr_62.from(value);
      } else {
        dest[prop] = value;
      }
    }

    return dest;
  }

  var _$Modification_33 = {};
  "use strict";

  Object.defineProperty(_$Modification_33, "__esModule", {
    value: true
  });
  _$Modification_33.default = void 0;
  _$Modification_33.getRectOffset = getRectOffset;
  /* removed: var _$clone_64 = require("@interactjs/utils/clone"); */

  ;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$rect_77 = require("@interactjs/utils/rect"); */

  ;

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || ___unsupportedIterableToArray_33(arr, i) || _nonIterableRest();
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function ___unsupportedIterableToArray_33(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return ___arrayLikeToArray_33(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return ___arrayLikeToArray_33(o, minLen);
  }

  function ___arrayLikeToArray_33(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }

  function _iterableToArrayLimit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;

    var _s, _e;

    try {
      for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function ___classCallCheck_33(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function ___defineProperties_33(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function ___createClass_33(Constructor, protoProps, staticProps) {
    if (protoProps) ___defineProperties_33(Constructor.prototype, protoProps);
    if (staticProps) ___defineProperties_33(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function ___defineProperty_33(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var Modification = /*#__PURE__*/function () {
    function Modification(interaction) {
      ___classCallCheck_33(this, Modification);

      ___defineProperty_33(this, "states", []);

      ___defineProperty_33(this, "startOffset", {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      });

      ___defineProperty_33(this, "startDelta", void 0);

      ___defineProperty_33(this, "result", void 0);

      ___defineProperty_33(this, "endResult", void 0);

      ___defineProperty_33(this, "edges", void 0);

      ___defineProperty_33(this, "interaction", void 0);

      this.interaction = interaction;
      this.result = createResult();
    }

    ___createClass_33(Modification, [{
      key: "start",
      value: function start(_ref, pageCoords) {
        var phase = _ref.phase;
        var interaction = this.interaction;
        var modifierList = getModifierList(interaction);
        this.prepareStates(modifierList);
        this.edges = (0, _$extend_67.default)({}, interaction.edges);
        this.startOffset = getRectOffset(interaction.rect, pageCoords);
        this.startDelta = {
          x: 0,
          y: 0
        };
        var arg = this.fillArg({
          phase: phase,
          pageCoords: pageCoords,
          preEnd: false
        });
        this.result = createResult();
        this.startAll(arg);
        var result = this.result = this.setAll(arg);
        return result;
      }
    }, {
      key: "fillArg",
      value: function fillArg(arg) {
        var interaction = this.interaction;
        arg.interaction = interaction;
        arg.interactable = interaction.interactable;
        arg.element = interaction.element;
        arg.rect = arg.rect || interaction.rect;
        arg.edges = this.edges;
        arg.startOffset = this.startOffset;
        return arg;
      }
    }, {
      key: "startAll",
      value: function startAll(arg) {
        for (var _i = 0; _i < this.states.length; _i++) {
          var _ref2;

          _ref2 = this.states[_i];
          var state = _ref2;

          if (state.methods.start) {
            arg.state = state;
            state.methods.start(arg);
          }
        }
      }
    }, {
      key: "setAll",
      value: function setAll(arg) {
        var phase = arg.phase,
            preEnd = arg.preEnd,
            skipModifiers = arg.skipModifiers,
            unmodifiedRect = arg.rect;
        arg.coords = (0, _$extend_67.default)({}, arg.pageCoords);
        arg.rect = (0, _$extend_67.default)({}, unmodifiedRect);
        var states = skipModifiers ? this.states.slice(skipModifiers) : this.states;
        var newResult = createResult(arg.coords, arg.rect);

        for (var _i2 = 0; _i2 < states.length; _i2++) {
          var _state$methods;

          var _ref3;

          _ref3 = states[_i2];
          var state = _ref3;
          var options = state.options;
          var lastModifierCoords = (0, _$extend_67.default)({}, arg.coords);
          var returnValue = null;

          if ((_state$methods = state.methods) != null && _state$methods.set && this.shouldDo(options, preEnd, phase)) {
            arg.state = state;
            returnValue = state.methods.set(arg);

            _$rect_77.addEdges(this.interaction.edges, arg.rect, {
              x: arg.coords.x - lastModifierCoords.x,
              y: arg.coords.y - lastModifierCoords.y
            });
          }

          newResult.eventProps.push(returnValue);
        }

        newResult.delta.x = arg.coords.x - arg.pageCoords.x;
        newResult.delta.y = arg.coords.y - arg.pageCoords.y;
        newResult.rectDelta.left = arg.rect.left - unmodifiedRect.left;
        newResult.rectDelta.right = arg.rect.right - unmodifiedRect.right;
        newResult.rectDelta.top = arg.rect.top - unmodifiedRect.top;
        newResult.rectDelta.bottom = arg.rect.bottom - unmodifiedRect.bottom;
        var prevCoords = this.result.coords;
        var prevRect = this.result.rect;

        if (prevCoords && prevRect) {
          var rectChanged = newResult.rect.left !== prevRect.left || newResult.rect.right !== prevRect.right || newResult.rect.top !== prevRect.top || newResult.rect.bottom !== prevRect.bottom;
          newResult.changed = rectChanged || prevCoords.x !== newResult.coords.x || prevCoords.y !== newResult.coords.y;
        }

        return newResult;
      }
    }, {
      key: "applyToInteraction",
      value: function applyToInteraction(arg) {
        var interaction = this.interaction;
        var phase = arg.phase;
        var curCoords = interaction.coords.cur;
        var startCoords = interaction.coords.start;
        var result = this.result,
            startDelta = this.startDelta;
        var curDelta = result.delta;

        if (phase === 'start') {
          (0, _$extend_67.default)(this.startDelta, result.delta);
        }

        for (var _i3 = 0; _i3 < [[startCoords, startDelta], [curCoords, curDelta]].length; _i3++) {
          var _ref4;

          _ref4 = [[startCoords, startDelta], [curCoords, curDelta]][_i3];

          var _ref5 = _ref4,
              _ref6 = _slicedToArray(_ref5, 2),
              coordsSet = _ref6[0],
              delta = _ref6[1];

          coordsSet.page.x += delta.x;
          coordsSet.page.y += delta.y;
          coordsSet.client.x += delta.x;
          coordsSet.client.y += delta.y;
        }

        var rectDelta = this.result.rectDelta;
        var rect = arg.rect || interaction.rect;
        rect.left += rectDelta.left;
        rect.right += rectDelta.right;
        rect.top += rectDelta.top;
        rect.bottom += rectDelta.bottom;
        rect.width = rect.right - rect.left;
        rect.height = rect.bottom - rect.top;
      }
    }, {
      key: "setAndApply",
      value: function setAndApply(arg) {
        var interaction = this.interaction;
        var phase = arg.phase,
            preEnd = arg.preEnd,
            skipModifiers = arg.skipModifiers;
        var result = this.setAll(this.fillArg({
          preEnd: preEnd,
          phase: phase,
          pageCoords: arg.modifiedCoords || interaction.coords.cur.page
        }));
        this.result = result; // don't fire an action move if a modifier would keep the event in the same
        // cordinates as before

        if (!result.changed && (!skipModifiers || skipModifiers < this.states.length) && interaction.interacting()) {
          return false;
        }

        if (arg.modifiedCoords) {
          var page = interaction.coords.cur.page;
          var adjustment = {
            x: arg.modifiedCoords.x - page.x,
            y: arg.modifiedCoords.y - page.y
          };
          result.coords.x += adjustment.x;
          result.coords.y += adjustment.y;
          result.delta.x += adjustment.x;
          result.delta.y += adjustment.y;
        }

        this.applyToInteraction(arg);
      }
    }, {
      key: "beforeEnd",
      value: function beforeEnd(arg) {
        var interaction = arg.interaction,
            event = arg.event;
        var states = this.states;

        if (!states || !states.length) {
          return;
        }

        var doPreend = false;

        for (var _i4 = 0; _i4 < states.length; _i4++) {
          var _ref7;

          _ref7 = states[_i4];
          var state = _ref7;
          arg.state = state;
          var options = state.options,
              methods = state.methods;
          var endPosition = methods.beforeEnd && methods.beforeEnd(arg);

          if (endPosition) {
            this.endResult = endPosition;
            return false;
          }

          doPreend = doPreend || !doPreend && this.shouldDo(options, true, arg.phase, true);
        }

        if (doPreend) {
          // trigger a final modified move before ending
          interaction.move({
            event: event,
            preEnd: true
          });
        }
      }
    }, {
      key: "stop",
      value: function stop(arg) {
        var interaction = arg.interaction;

        if (!this.states || !this.states.length) {
          return;
        }

        var modifierArg = (0, _$extend_67.default)({
          states: this.states,
          interactable: interaction.interactable,
          element: interaction.element,
          rect: null
        }, arg);
        this.fillArg(modifierArg);

        for (var _i5 = 0; _i5 < this.states.length; _i5++) {
          var _ref8;

          _ref8 = this.states[_i5];
          var state = _ref8;
          modifierArg.state = state;

          if (state.methods.stop) {
            state.methods.stop(modifierArg);
          }
        }

        this.states = null;
        this.endResult = null;
      }
    }, {
      key: "prepareStates",
      value: function prepareStates(modifierList) {
        this.states = [];

        for (var index = 0; index < modifierList.length; index++) {
          var _modifierList$index = modifierList[index],
              options = _modifierList$index.options,
              methods = _modifierList$index.methods,
              name = _modifierList$index.name;
          this.states.push({
            options: options,
            methods: methods,
            index: index,
            name: name
          });
        }

        return this.states;
      }
    }, {
      key: "restoreInteractionCoords",
      value: function restoreInteractionCoords(_ref9) {
        var _ref9$interaction = _ref9.interaction,
            coords = _ref9$interaction.coords,
            rect = _ref9$interaction.rect,
            modification = _ref9$interaction.modification;
        if (!modification.result) return;
        var startDelta = modification.startDelta;
        var _modification$result = modification.result,
            curDelta = _modification$result.delta,
            rectDelta = _modification$result.rectDelta;
        var coordsAndDeltas = [[coords.start, startDelta], [coords.cur, curDelta]];

        for (var _i6 = 0; _i6 < coordsAndDeltas.length; _i6++) {
          var _ref10;

          _ref10 = coordsAndDeltas[_i6];

          var _ref11 = _ref10,
              _ref12 = _slicedToArray(_ref11, 2),
              coordsSet = _ref12[0],
              delta = _ref12[1];

          coordsSet.page.x -= delta.x;
          coordsSet.page.y -= delta.y;
          coordsSet.client.x -= delta.x;
          coordsSet.client.y -= delta.y;
        }

        rect.left -= rectDelta.left;
        rect.right -= rectDelta.right;
        rect.top -= rectDelta.top;
        rect.bottom -= rectDelta.bottom;
      }
    }, {
      key: "shouldDo",
      value: function shouldDo(options, preEnd, phase, requireEndOnly) {
        if ( // ignore disabled modifiers
        !options || options.enabled === false || // check if we require endOnly option to fire move before end
        requireEndOnly && !options.endOnly || // don't apply endOnly modifiers when not ending
        options.endOnly && !preEnd || // check if modifier should run be applied on start
        phase === 'start' && !options.setStart) {
          return false;
        }

        return true;
      }
    }, {
      key: "copyFrom",
      value: function copyFrom(other) {
        this.startOffset = other.startOffset;
        this.startDelta = other.startDelta;
        this.edges = other.edges;
        this.states = other.states.map(function (s) {
          return (0, _$clone_64.default)(s);
        });
        this.result = createResult((0, _$extend_67.default)({}, other.result.coords), (0, _$extend_67.default)({}, other.result.rect));
      }
    }, {
      key: "destroy",
      value: function destroy() {
        for (var prop in this) {
          this[prop] = null;
        }
      }
    }]);

    return Modification;
  }();

  _$Modification_33.default = Modification;

  function createResult(coords, rect) {
    return {
      rect: rect,
      coords: coords,
      delta: {
        x: 0,
        y: 0
      },
      rectDelta: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      },
      eventProps: [],
      changed: true
    };
  }

  function getModifierList(interaction) {
    var actionOptions = interaction.interactable.options[interaction.prepared.name];
    var actionModifiers = actionOptions.modifiers;

    if (actionModifiers && actionModifiers.length) {
      return actionModifiers;
    }

    return ['snap', 'snapSize', 'snapEdges', 'restrict', 'restrictEdges', 'restrictSize'].map(function (type) {
      var options = actionOptions[type];
      return options && options.enabled && {
        options: options,
        methods: options._methods
      };
    }).filter(function (m) {
      return !!m;
    });
  }

  function getRectOffset(rect, coords) {
    return rect ? {
      left: coords.x - rect.left,
      top: coords.y - rect.top,
      right: rect.right - coords.x,
      bottom: rect.bottom - coords.y
    } : {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    };
  }

  var _$base_37 = {};
  "use strict";

  Object.defineProperty(_$base_37, "__esModule", {
    value: true
  });
  _$base_37.addEventModifiers = addEventModifiers;
  _$base_37.default = void 0;
  _$base_37.makeModifier = makeModifier;
  /* removed: var _$Modification_33 = require("./Modification"); */

  ;

  function makeModifier(module, name) {
    var defaults = module.defaults;
    var methods = {
      start: module.start,
      set: module.set,
      beforeEnd: module.beforeEnd,
      stop: module.stop
    };

    var modifier = function modifier(_options) {
      var options = _options || {};
      options.enabled = options.enabled !== false; // add missing defaults to options

      for (var prop in defaults) {
        if (!(prop in options)) {
          ;
          options[prop] = defaults[prop];
        }
      }

      var m = {
        options: options,
        methods: methods,
        name: name,
        enable: function enable() {
          options.enabled = true;
          return m;
        },
        disable: function disable() {
          options.enabled = false;
          return m;
        }
      };
      return m;
    };

    if (name && typeof name === 'string') {
      // for backwrads compatibility
      modifier._defaults = defaults;
      modifier._methods = methods;
    }

    return modifier;
  }

  function addEventModifiers(_ref) {
    var iEvent = _ref.iEvent,
        interaction = _ref.interaction;
    var result = interaction.modification.result;

    if (result) {
      iEvent.modifiers = result.eventProps;
    }
  }

  var modifiersBase = {
    id: 'modifiers/base',
    before: ['actions'],
    install: function install(scope) {
      scope.defaults.perAction.modifiers = [];
    },
    listeners: {
      'interactions:new': function interactionsNew(_ref2) {
        var interaction = _ref2.interaction;
        interaction.modification = new _$Modification_33.default(interaction);
      },
      'interactions:before-action-start': function interactionsBeforeActionStart(arg) {
        var modification = arg.interaction.modification;
        modification.start(arg, arg.interaction.coords.start.page);
        arg.interaction.edges = modification.edges;
        modification.applyToInteraction(arg);
      },
      'interactions:before-action-move': function interactionsBeforeActionMove(arg) {
        return arg.interaction.modification.setAndApply(arg);
      },
      'interactions:before-action-end': function interactionsBeforeActionEnd(arg) {
        return arg.interaction.modification.beforeEnd(arg);
      },
      'interactions:action-start': addEventModifiers,
      'interactions:action-move': addEventModifiers,
      'interactions:action-end': addEventModifiers,
      'interactions:after-action-start': function interactionsAfterActionStart(arg) {
        return arg.interaction.modification.restoreInteractionCoords(arg);
      },
      'interactions:after-action-move': function interactionsAfterActionMove(arg) {
        return arg.interaction.modification.restoreInteractionCoords(arg);
      },
      'interactions:stop': function interactionsStop(arg) {
        return arg.interaction.modification.stop(arg);
      }
    }
  };
  var ___default_37 = modifiersBase;
  _$base_37.default = ___default_37;
  var _$options_26 = {};
  "use strict";

  Object.defineProperty(_$options_26, "__esModule", {
    value: true
  });
  _$options_26.defaults = void 0; // eslint-disable-next-line @typescript-eslint/no-empty-interface

  var defaults = {
    base: {
      preventDefault: 'auto',
      deltaSource: 'page'
    },
    perAction: {
      enabled: false,
      origin: {
        x: 0,
        y: 0
      }
    },
    actions: {}
  };
  _$options_26.defaults = defaults;
  var _$InteractEvent_15 = {};
  "use strict";

  function ___typeof_15(obj) {
    "@babel/helpers - typeof";

    return ___typeof_15 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, ___typeof_15(obj);
  }

  Object.defineProperty(_$InteractEvent_15, "__esModule", {
    value: true
  });
  _$InteractEvent_15.InteractEvent = void 0;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$getOriginXY_68 = require("@interactjs/utils/getOriginXY"); */

  ;
  /* removed: var _$hypot_69 = require("@interactjs/utils/hypot"); */

  ;
  /* removed: var _$BaseEvent_13 = require("./BaseEvent"); */

  ;
  /* removed: var _$options_26 = require("./options"); */

  ;

  function ___classCallCheck_15(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function ___defineProperties_15(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function ___createClass_15(Constructor, protoProps, staticProps) {
    if (protoProps) ___defineProperties_15(Constructor.prototype, protoProps);
    if (staticProps) ___defineProperties_15(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function ___inherits_15(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    Object.defineProperty(subClass, "prototype", {
      writable: false
    });
    if (superClass) ___setPrototypeOf_15(subClass, superClass);
  }

  function ___setPrototypeOf_15(o, p) {
    ___setPrototypeOf_15 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
    return ___setPrototypeOf_15(o, p);
  }

  function ___createSuper_15(Derived) {
    var hasNativeReflectConstruct = ___isNativeReflectConstruct_15();

    return function _createSuperInternal() {
      var Super = ___getPrototypeOf_15(Derived),
          result;

      if (hasNativeReflectConstruct) {
        var NewTarget = ___getPrototypeOf_15(this).constructor;

        result = Reflect.construct(Super, arguments, NewTarget);
      } else {
        result = Super.apply(this, arguments);
      }

      return ___possibleConstructorReturn_15(this, result);
    };
  }

  function ___possibleConstructorReturn_15(self, call) {
    if (call && (___typeof_15(call) === "object" || typeof call === "function")) {
      return call;
    } else if (call !== void 0) {
      throw new TypeError("Derived constructors may only return object or undefined");
    }

    return ___assertThisInitialized_15(self);
  }

  function ___assertThisInitialized_15(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function ___isNativeReflectConstruct_15() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function ___getPrototypeOf_15(o) {
    ___getPrototypeOf_15 = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return ___getPrototypeOf_15(o);
  }

  function ___defineProperty_15(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var InteractEvent = /*#__PURE__*/function (_BaseEvent) {
    ___inherits_15(InteractEvent, _BaseEvent);

    var _super = ___createSuper_15(InteractEvent); // resize

    /** */


    function InteractEvent(interaction, event, actionName, phase, element, preEnd, type) {
      var _this;

      ___classCallCheck_15(this, InteractEvent);

      _this = _super.call(this, interaction);

      ___defineProperty_15(___assertThisInitialized_15(_this), "relatedTarget", null);

      ___defineProperty_15(___assertThisInitialized_15(_this), "screenX", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "screenY", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "button", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "buttons", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "ctrlKey", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "shiftKey", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "altKey", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "metaKey", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "page", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "client", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "delta", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "rect", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "x0", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "y0", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "t0", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "dt", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "duration", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "clientX0", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "clientY0", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "velocity", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "speed", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "swipe", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "axes", void 0);

      ___defineProperty_15(___assertThisInitialized_15(_this), "preEnd", void 0);

      element = element || interaction.element;
      var target = interaction.interactable;
      var deltaSource = (target && target.options || _$options_26.defaults).deltaSource;
      var origin = (0, _$getOriginXY_68.default)(target, element, actionName);
      var starting = phase === 'start';
      var ending = phase === 'end';
      var prevEvent = starting ? ___assertThisInitialized_15(_this) : interaction.prevEvent;
      var coords = starting ? interaction.coords.start : ending ? {
        page: prevEvent.page,
        client: prevEvent.client,
        timeStamp: interaction.coords.cur.timeStamp
      } : interaction.coords.cur;
      _this.page = (0, _$extend_67.default)({}, coords.page);
      _this.client = (0, _$extend_67.default)({}, coords.client);
      _this.rect = (0, _$extend_67.default)({}, interaction.rect);
      _this.timeStamp = coords.timeStamp;

      if (!ending) {
        _this.page.x -= origin.x;
        _this.page.y -= origin.y;
        _this.client.x -= origin.x;
        _this.client.y -= origin.y;
      }

      _this.ctrlKey = event.ctrlKey;
      _this.altKey = event.altKey;
      _this.shiftKey = event.shiftKey;
      _this.metaKey = event.metaKey;
      _this.button = event.button;
      _this.buttons = event.buttons;
      _this.target = element;
      _this.currentTarget = element;
      _this.preEnd = preEnd;
      _this.type = type || actionName + (phase || '');
      _this.interactable = target;
      _this.t0 = starting ? interaction.pointers[interaction.pointers.length - 1].downTime : prevEvent.t0;
      _this.x0 = interaction.coords.start.page.x - origin.x;
      _this.y0 = interaction.coords.start.page.y - origin.y;
      _this.clientX0 = interaction.coords.start.client.x - origin.x;
      _this.clientY0 = interaction.coords.start.client.y - origin.y;

      if (starting || ending) {
        _this.delta = {
          x: 0,
          y: 0
        };
      } else {
        _this.delta = {
          x: _this[deltaSource].x - prevEvent[deltaSource].x,
          y: _this[deltaSource].y - prevEvent[deltaSource].y
        };
      }

      _this.dt = interaction.coords.delta.timeStamp;
      _this.duration = _this.timeStamp - _this.t0; // velocity and speed in pixels per second

      _this.velocity = (0, _$extend_67.default)({}, interaction.coords.velocity[deltaSource]);
      _this.speed = (0, _$hypot_69.default)(_this.velocity.x, _this.velocity.y);
      _this.swipe = ending || phase === 'inertiastart' ? _this.getSwipe() : null;
      return _this;
    }

    ___createClass_15(InteractEvent, [{
      key: "getSwipe",
      value: function getSwipe() {
        var interaction = this._interaction;

        if (interaction.prevEvent.speed < 600 || this.timeStamp - interaction.prevEvent.timeStamp > 150) {
          return null;
        }

        var angle = 180 * Math.atan2(interaction.prevEvent.velocityY, interaction.prevEvent.velocityX) / Math.PI;
        var overlap = 22.5;

        if (angle < 0) {
          angle += 360;
        }

        var left = 135 - overlap <= angle && angle < 225 + overlap;
        var up = 225 - overlap <= angle && angle < 315 + overlap;
        var right = !left && (315 - overlap <= angle || angle < 45 + overlap);
        var down = !up && 45 - overlap <= angle && angle < 135 + overlap;
        return {
          up: up,
          down: down,
          left: left,
          right: right,
          angle: angle,
          speed: interaction.prevEvent.speed,
          velocity: {
            x: interaction.prevEvent.velocityX,
            y: interaction.prevEvent.velocityY
          }
        };
      }
    }, {
      key: "preventDefault",
      value: function preventDefault() {}
      /**
       * Don't call listeners on the remaining targets
       */

    }, {
      key: "stopImmediatePropagation",
      value: function stopImmediatePropagation() {
        this.immediatePropagationStopped = this.propagationStopped = true;
      }
      /**
       * Don't call any other listeners (even on the current target)
       */

    }, {
      key: "stopPropagation",
      value: function stopPropagation() {
        this.propagationStopped = true;
      }
    }]);

    return InteractEvent;
  }(_$BaseEvent_13.BaseEvent); // getters and setters defined here to support typescript 3.6 and below which
  // don't support getter and setters in .d.ts files


  _$InteractEvent_15.InteractEvent = InteractEvent;
  Object.defineProperties(InteractEvent.prototype, {
    pageX: {
      get: function get() {
        return this.page.x;
      },
      set: function set(value) {
        this.page.x = value;
      }
    },
    pageY: {
      get: function get() {
        return this.page.y;
      },
      set: function set(value) {
        this.page.y = value;
      }
    },
    clientX: {
      get: function get() {
        return this.client.x;
      },
      set: function set(value) {
        this.client.x = value;
      }
    },
    clientY: {
      get: function get() {
        return this.client.y;
      },
      set: function set(value) {
        this.client.y = value;
      }
    },
    dx: {
      get: function get() {
        return this.delta.x;
      },
      set: function set(value) {
        this.delta.x = value;
      }
    },
    dy: {
      get: function get() {
        return this.delta.y;
      },
      set: function set(value) {
        this.delta.y = value;
      }
    },
    velocityX: {
      get: function get() {
        return this.velocity.x;
      },
      set: function set(value) {
        this.velocity.x = value;
      }
    },
    velocityY: {
      get: function get() {
        return this.velocity.y;
      },
      set: function set(value) {
        this.velocity.y = value;
      }
    }
  });
  var _$PointerInfo_20 = {};
  "use strict";

  Object.defineProperty(_$PointerInfo_20, "__esModule", {
    value: true
  });
  _$PointerInfo_20.PointerInfo = void 0;

  function ___defineProperties_20(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function ___createClass_20(Constructor, protoProps, staticProps) {
    if (protoProps) ___defineProperties_20(Constructor.prototype, protoProps);
    if (staticProps) ___defineProperties_20(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function ___classCallCheck_20(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function ___defineProperty_20(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var PointerInfo = /*#__PURE__*/___createClass_20(function PointerInfo(id, pointer, event, downTime, downTarget) {
    ___classCallCheck_20(this, PointerInfo);

    ___defineProperty_20(this, "id", void 0);

    ___defineProperty_20(this, "pointer", void 0);

    ___defineProperty_20(this, "event", void 0);

    ___defineProperty_20(this, "downTime", void 0);

    ___defineProperty_20(this, "downTarget", void 0);

    this.id = id;
    this.pointer = pointer;
    this.event = event;
    this.downTime = downTime;
    this.downTarget = downTarget;
  });

  _$PointerInfo_20.PointerInfo = PointerInfo;
  var _$Interaction_19 = {};
  "use strict";

  Object.defineProperty(_$Interaction_19, "__esModule", {
    value: true
  });
  _$Interaction_19.Interaction = void 0;
  Object.defineProperty(_$Interaction_19, "PointerInfo", {
    enumerable: true,
    get: function get() {
      return _$PointerInfo_20.PointerInfo;
    }
  });
  _$Interaction_19.default = _$Interaction_19._ProxyValues = _$Interaction_19._ProxyMethods = void 0;
  /* removed: var _$arr_62 = require("@interactjs/utils/arr"); */

  ;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$hypot_69 = require("@interactjs/utils/hypot"); */

  ;
  /* removed: var _$misc_72 = require("@interactjs/utils/misc"); */

  ;
  /* removed: var _$pointerUtils_75 = require("@interactjs/utils/pointerUtils"); */

  ;
  /* removed: var _$rect_77 = require("@interactjs/utils/rect"); */

  ;
  /* removed: var _$InteractEvent_15 = require("./InteractEvent"); */

  ;
  /* removed: var _$PointerInfo_20 = require("./PointerInfo"); */

  ;

  function ___classCallCheck_19(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function ___defineProperties_19(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function ___createClass_19(Constructor, protoProps, staticProps) {
    if (protoProps) ___defineProperties_19(Constructor.prototype, protoProps);
    if (staticProps) ___defineProperties_19(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function ___defineProperty_19(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var _ProxyValues;

  _$Interaction_19._ProxyValues = _ProxyValues;

  (function (_ProxyValues) {
    _ProxyValues["interactable"] = "";
    _ProxyValues["element"] = "";
    _ProxyValues["prepared"] = "";
    _ProxyValues["pointerIsDown"] = "";
    _ProxyValues["pointerWasMoved"] = "";
    _ProxyValues["_proxy"] = "";
  })(_ProxyValues || (_$Interaction_19._ProxyValues = _ProxyValues = {}));

  var _ProxyMethods;

  _$Interaction_19._ProxyMethods = _ProxyMethods;

  (function (_ProxyMethods) {
    _ProxyMethods["start"] = "";
    _ProxyMethods["move"] = "";
    _ProxyMethods["end"] = "";
    _ProxyMethods["stop"] = "";
    _ProxyMethods["interacting"] = "";
  })(_ProxyMethods || (_$Interaction_19._ProxyMethods = _ProxyMethods = {}));

  var idCounter = 0;

  var Interaction = /*#__PURE__*/function () {
    /** */
    function Interaction(_ref) {
      var _this = this;

      var pointerType = _ref.pointerType,
          scopeFire = _ref.scopeFire;

      ___classCallCheck_19(this, Interaction);

      ___defineProperty_19(this, "interactable", null);

      ___defineProperty_19(this, "element", null);

      ___defineProperty_19(this, "rect", null);

      ___defineProperty_19(this, "_rects", void 0);

      ___defineProperty_19(this, "edges", null);

      ___defineProperty_19(this, "_scopeFire", void 0);

      ___defineProperty_19(this, "prepared", {
        name: null,
        axis: null,
        edges: null
      });

      ___defineProperty_19(this, "pointerType", void 0);

      ___defineProperty_19(this, "pointers", []);

      ___defineProperty_19(this, "downEvent", null);

      ___defineProperty_19(this, "downPointer", {});

      ___defineProperty_19(this, "_latestPointer", {
        pointer: null,
        event: null,
        eventTarget: null
      });

      ___defineProperty_19(this, "prevEvent", null);

      ___defineProperty_19(this, "pointerIsDown", false);

      ___defineProperty_19(this, "pointerWasMoved", false);

      ___defineProperty_19(this, "_interacting", false);

      ___defineProperty_19(this, "_ending", false);

      ___defineProperty_19(this, "_stopped", true);

      ___defineProperty_19(this, "_proxy", null);

      ___defineProperty_19(this, "simulation", null);

      ___defineProperty_19(this, "doMove", (0, _$misc_72.warnOnce)(function (signalArg) {
        this.move(signalArg);
      }, 'The interaction.doMove() method has been renamed to interaction.move()'));

      ___defineProperty_19(this, "coords", {
        // Starting InteractEvent pointer coordinates
        start: _$pointerUtils_75.newCoords(),
        // Previous native pointer move event coordinates
        prev: _$pointerUtils_75.newCoords(),
        // current native pointer move event coordinates
        cur: _$pointerUtils_75.newCoords(),
        // Change in coordinates and time of the pointer
        delta: _$pointerUtils_75.newCoords(),
        // pointer velocity
        velocity: _$pointerUtils_75.newCoords()
      });

      ___defineProperty_19(this, "_id", idCounter++);

      this._scopeFire = scopeFire;
      this.pointerType = pointerType;
      var that = this;
      this._proxy = {};

      var _loop = function _loop(key) {
        Object.defineProperty(_this._proxy, key, {
          get: function get() {
            return that[key];
          }
        });
      };

      for (var key in _ProxyValues) {
        _loop(key);
      }

      var _loop2 = function _loop2(_key) {
        Object.defineProperty(_this._proxy, _key, {
          value: function value() {
            return that[_key].apply(that, arguments);
          }
        });
      };

      for (var _key in _ProxyMethods) {
        _loop2(_key);
      }

      this._scopeFire('interactions:new', {
        interaction: this
      });
    }

    ___createClass_19(Interaction, [{
      key: "pointerMoveTolerance",
      get: // current interactable being interacted with
      // the target element of the interactable
      // action that's ready to be fired on next move event
      // keep track of added pointers
      // pointerdown/mousedown/touchstart event
      // previous action event

      /** @internal */
      function get() {
        return 1;
      }
      /**
       * @alias Interaction.prototype.move
       */

    }, {
      key: "pointerDown",
      value: function pointerDown(pointer, event, eventTarget) {
        var pointerIndex = this.updatePointer(pointer, event, eventTarget, true);
        var pointerInfo = this.pointers[pointerIndex];

        this._scopeFire('interactions:down', {
          pointer: pointer,
          event: event,
          eventTarget: eventTarget,
          pointerIndex: pointerIndex,
          pointerInfo: pointerInfo,
          type: 'down',
          interaction: this
        });
      }
      /**
       * ```js
       * interact(target)
       *   .draggable({
       *     // disable the default drag start by down->move
       *     manualStart: true
       *   })
       *   // start dragging after the user holds the pointer down
       *   .on('hold', function (event) {
       *     var interaction = event.interaction
       *
       *     if (!interaction.interacting()) {
       *       interaction.start({ name: 'drag' },
       *                         event.interactable,
       *                         event.currentTarget)
       *     }
       * })
       * ```
       *
       * Start an action with the given Interactable and Element as tartgets. The
       * action must be enabled for the target Interactable and an appropriate
       * number of pointers must be held down - 1 for drag/resize, 2 for gesture.
       *
       * Use it with `interactable.<action>able({ manualStart: false })` to always
       * [start actions manually](https://github.com/taye/interact.js/issues/114)
       *
       * @param {object} action   The action to be performed - drag, resize, etc.
       * @param {Interactable} target  The Interactable to target
       * @param {Element} element The DOM Element to target
       * @return {Boolean} Whether the interaction was successfully started
       */

    }, {
      key: "start",
      value: function start(action, interactable, element) {
        if (this.interacting() || !this.pointerIsDown || this.pointers.length < (action.name === 'gesture' ? 2 : 1) || !interactable.options[action.name].enabled) {
          return false;
        }

        (0, _$misc_72.copyAction)(this.prepared, action);
        this.interactable = interactable;
        this.element = element;
        this.rect = interactable.getRect(element);
        this.edges = this.prepared.edges ? (0, _$extend_67.default)({}, this.prepared.edges) : {
          left: true,
          right: true,
          top: true,
          bottom: true
        };
        this._stopped = false;
        this._interacting = this._doPhase({
          interaction: this,
          event: this.downEvent,
          phase: 'start'
        }) && !this._stopped;
        return this._interacting;
      }
    }, {
      key: "pointerMove",
      value: function pointerMove(pointer, event, eventTarget) {
        if (!this.simulation && !(this.modification && this.modification.endResult)) {
          this.updatePointer(pointer, event, eventTarget, false);
        }

        var duplicateMove = this.coords.cur.page.x === this.coords.prev.page.x && this.coords.cur.page.y === this.coords.prev.page.y && this.coords.cur.client.x === this.coords.prev.client.x && this.coords.cur.client.y === this.coords.prev.client.y;
        var dx;
        var dy; // register movement greater than pointerMoveTolerance

        if (this.pointerIsDown && !this.pointerWasMoved) {
          dx = this.coords.cur.client.x - this.coords.start.client.x;
          dy = this.coords.cur.client.y - this.coords.start.client.y;
          this.pointerWasMoved = (0, _$hypot_69.default)(dx, dy) > this.pointerMoveTolerance;
        }

        var pointerIndex = this.getPointerIndex(pointer);
        var signalArg = {
          pointer: pointer,
          pointerIndex: pointerIndex,
          pointerInfo: this.pointers[pointerIndex],
          event: event,
          type: 'move',
          eventTarget: eventTarget,
          dx: dx,
          dy: dy,
          duplicate: duplicateMove,
          interaction: this
        };

        if (!duplicateMove) {
          // set pointer coordinate, time changes and velocity
          _$pointerUtils_75.setCoordVelocity(this.coords.velocity, this.coords.delta);
        }

        this._scopeFire('interactions:move', signalArg);

        if (!duplicateMove && !this.simulation) {
          // if interacting, fire an 'action-move' signal etc
          if (this.interacting()) {
            signalArg.type = null;
            this.move(signalArg);
          }

          if (this.pointerWasMoved) {
            _$pointerUtils_75.copyCoords(this.coords.prev, this.coords.cur);
          }
        }
      }
      /**
       * ```js
       * interact(target)
       *   .draggable(true)
       *   .on('dragmove', function (event) {
       *     if (someCondition) {
       *       // change the snap settings
       *       event.interactable.draggable({ snap: { targets: [] }})
       *       // fire another move event with re-calculated snap
       *       event.interaction.move()
       *     }
       *   })
       * ```
       *
       * Force a move of the current action at the same coordinates. Useful if
       * snap/restrict has been changed and you want a movement with the new
       * settings.
       */

    }, {
      key: "move",
      value: function move(signalArg) {
        if (!signalArg || !signalArg.event) {
          _$pointerUtils_75.setZeroCoords(this.coords.delta);
        }

        signalArg = (0, _$extend_67.default)({
          pointer: this._latestPointer.pointer,
          event: this._latestPointer.event,
          eventTarget: this._latestPointer.eventTarget,
          interaction: this
        }, signalArg || {});
        signalArg.phase = 'move';

        this._doPhase(signalArg);
      } // End interact move events and stop auto-scroll unless simulation is running

    }, {
      key: "pointerUp",
      value: function pointerUp(pointer, event, eventTarget, curEventTarget) {
        var pointerIndex = this.getPointerIndex(pointer);

        if (pointerIndex === -1) {
          pointerIndex = this.updatePointer(pointer, event, eventTarget, false);
        }

        var type = /cancel$/i.test(event.type) ? 'cancel' : 'up';

        this._scopeFire("interactions:".concat(type), {
          pointer: pointer,
          pointerIndex: pointerIndex,
          pointerInfo: this.pointers[pointerIndex],
          event: event,
          eventTarget: eventTarget,
          type: type,
          curEventTarget: curEventTarget,
          interaction: this
        });

        if (!this.simulation) {
          this.end(event);
        }

        this.removePointer(pointer, event);
      }
    }, {
      key: "documentBlur",
      value: function documentBlur(event) {
        this.end(event);

        this._scopeFire('interactions:blur', {
          event: event,
          type: 'blur',
          interaction: this
        });
      }
      /**
       * ```js
       * interact(target)
       *   .draggable(true)
       *   .on('move', function (event) {
       *     if (event.pageX > 1000) {
       *       // end the current action
       *       event.interaction.end()
       *       // stop all further listeners from being called
       *       event.stopImmediatePropagation()
       *     }
       *   })
       * ```
       *
       * @param {PointerEvent} [event]
       */

    }, {
      key: "end",
      value: function end(event) {
        this._ending = true;
        event = event || this._latestPointer.event;
        var endPhaseResult;

        if (this.interacting()) {
          endPhaseResult = this._doPhase({
            event: event,
            interaction: this,
            phase: 'end'
          });
        }

        this._ending = false;

        if (endPhaseResult === true) {
          this.stop();
        }
      }
    }, {
      key: "currentAction",
      value: function currentAction() {
        return this._interacting ? this.prepared.name : null;
      }
    }, {
      key: "interacting",
      value: function interacting() {
        return this._interacting;
      }
      /** */

    }, {
      key: "stop",
      value: function stop() {
        this._scopeFire('interactions:stop', {
          interaction: this
        });

        this.interactable = this.element = null;
        this._interacting = false;
        this._stopped = true;
        this.prepared.name = this.prevEvent = null;
      }
    }, {
      key: "getPointerIndex",
      value: function getPointerIndex(pointer) {
        var pointerId = _$pointerUtils_75.getPointerId(pointer); // mouse and pen interactions may have only one pointer


        return this.pointerType === 'mouse' || this.pointerType === 'pen' ? this.pointers.length - 1 : _$arr_62.findIndex(this.pointers, function (curPointer) {
          return curPointer.id === pointerId;
        });
      }
    }, {
      key: "getPointerInfo",
      value: function getPointerInfo(pointer) {
        return this.pointers[this.getPointerIndex(pointer)];
      }
    }, {
      key: "updatePointer",
      value: function updatePointer(pointer, event, eventTarget, down) {
        var id = _$pointerUtils_75.getPointerId(pointer);

        var pointerIndex = this.getPointerIndex(pointer);
        var pointerInfo = this.pointers[pointerIndex];
        down = down === false ? false : down || /(down|start)$/i.test(event.type);

        if (!pointerInfo) {
          pointerInfo = new _$PointerInfo_20.PointerInfo(id, pointer, event, null, null);
          pointerIndex = this.pointers.length;
          this.pointers.push(pointerInfo);
        } else {
          pointerInfo.pointer = pointer;
        }

        _$pointerUtils_75.setCoords(this.coords.cur, this.pointers.map(function (p) {
          return p.pointer;
        }), this._now());

        _$pointerUtils_75.setCoordDeltas(this.coords.delta, this.coords.prev, this.coords.cur);

        if (down) {
          this.pointerIsDown = true;
          pointerInfo.downTime = this.coords.cur.timeStamp;
          pointerInfo.downTarget = eventTarget;

          _$pointerUtils_75.pointerExtend(this.downPointer, pointer);

          if (!this.interacting()) {
            _$pointerUtils_75.copyCoords(this.coords.start, this.coords.cur);

            _$pointerUtils_75.copyCoords(this.coords.prev, this.coords.cur);

            this.downEvent = event;
            this.pointerWasMoved = false;
          }
        }

        this._updateLatestPointer(pointer, event, eventTarget);

        this._scopeFire('interactions:update-pointer', {
          pointer: pointer,
          event: event,
          eventTarget: eventTarget,
          down: down,
          pointerInfo: pointerInfo,
          pointerIndex: pointerIndex,
          interaction: this
        });

        return pointerIndex;
      }
    }, {
      key: "removePointer",
      value: function removePointer(pointer, event) {
        var pointerIndex = this.getPointerIndex(pointer);
        if (pointerIndex === -1) return;
        var pointerInfo = this.pointers[pointerIndex];

        this._scopeFire('interactions:remove-pointer', {
          pointer: pointer,
          event: event,
          eventTarget: null,
          pointerIndex: pointerIndex,
          pointerInfo: pointerInfo,
          interaction: this
        });

        this.pointers.splice(pointerIndex, 1);
        this.pointerIsDown = false;
      }
    }, {
      key: "_updateLatestPointer",
      value: function _updateLatestPointer(pointer, event, eventTarget) {
        this._latestPointer.pointer = pointer;
        this._latestPointer.event = event;
        this._latestPointer.eventTarget = eventTarget;
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this._latestPointer.pointer = null;
        this._latestPointer.event = null;
        this._latestPointer.eventTarget = null;
      }
    }, {
      key: "_createPreparedEvent",
      value: function _createPreparedEvent(event, phase, preEnd, type) {
        return new _$InteractEvent_15.InteractEvent(this, event, this.prepared.name, phase, this.element, preEnd, type);
      }
    }, {
      key: "_fireEvent",
      value: function _fireEvent(iEvent) {
        var _this$interactable;

        (_this$interactable = this.interactable) == null ? void 0 : _this$interactable.fire(iEvent);

        if (!this.prevEvent || iEvent.timeStamp >= this.prevEvent.timeStamp) {
          this.prevEvent = iEvent;
        }
      }
    }, {
      key: "_doPhase",
      value: function _doPhase(signalArg) {
        var event = signalArg.event,
            phase = signalArg.phase,
            preEnd = signalArg.preEnd,
            type = signalArg.type;
        var rect = this.rect;

        if (rect && phase === 'move') {
          // update the rect changes due to pointer move
          _$rect_77.addEdges(this.edges, rect, this.coords.delta[this.interactable.options.deltaSource]);

          rect.width = rect.right - rect.left;
          rect.height = rect.bottom - rect.top;
        }

        var beforeResult = this._scopeFire("interactions:before-action-".concat(phase), signalArg);

        if (beforeResult === false) {
          return false;
        }

        var iEvent = signalArg.iEvent = this._createPreparedEvent(event, phase, preEnd, type);

        this._scopeFire("interactions:action-".concat(phase), signalArg);

        if (phase === 'start') {
          this.prevEvent = iEvent;
        }

        this._fireEvent(iEvent);

        this._scopeFire("interactions:after-action-".concat(phase), signalArg);

        return true;
      }
    }, {
      key: "_now",
      value: function _now() {
        return Date.now();
      }
    }]);

    return Interaction;
  }();

  _$Interaction_19.Interaction = Interaction;
  var ___default_19 = Interaction;
  _$Interaction_19.default = ___default_19;
  var _$plugin_50 = {};
  "use strict";

  Object.defineProperty(_$plugin_50, "__esModule", {
    value: true
  });
  _$plugin_50.addTotal = addTotal;
  _$plugin_50.applyPending = applyPending;
  _$plugin_50.default = void 0;
  /* removed: var _$Interaction_19 = require("@interactjs/core/Interaction"); */

  ;
  /* removed: var _$rect_77 = require("@interactjs/utils/rect"); */

  ;
  ;
  _$Interaction_19._ProxyMethods.offsetBy = '';

  function addTotal(interaction) {
    if (!interaction.pointerIsDown) {
      return;
    }

    addToCoords(interaction.coords.cur, interaction.offset.total);
    interaction.offset.pending.x = 0;
    interaction.offset.pending.y = 0;
  }

  function beforeAction(_ref) {
    var interaction = _ref.interaction;
    applyPending(interaction);
  }

  function beforeEnd(_ref2) {
    var interaction = _ref2.interaction;
    var hadPending = applyPending(interaction);
    if (!hadPending) return;
    interaction.move({
      offset: true
    });
    interaction.end();
    return false;
  }

  function __end_50(_ref3) {
    var interaction = _ref3.interaction;
    interaction.offset.total.x = 0;
    interaction.offset.total.y = 0;
    interaction.offset.pending.x = 0;
    interaction.offset.pending.y = 0;
  }

  function applyPending(interaction) {
    if (!hasPending(interaction)) {
      return false;
    }

    var pending = interaction.offset.pending;
    addToCoords(interaction.coords.cur, pending);
    addToCoords(interaction.coords.delta, pending);

    _$rect_77.addEdges(interaction.edges, interaction.rect, pending);

    pending.x = 0;
    pending.y = 0;
    return true;
  }

  function offsetBy(_ref4) {
    var x = _ref4.x,
        y = _ref4.y;
    this.offset.pending.x += x;
    this.offset.pending.y += y;
    this.offset.total.x += x;
    this.offset.total.y += y;
  }

  function addToCoords(_ref5, _ref6) {
    var page = _ref5.page,
        client = _ref5.client;
    var x = _ref6.x,
        y = _ref6.y;
    page.x += x;
    page.y += y;
    client.x += x;
    client.y += y;
  }

  function hasPending(interaction) {
    return !!(interaction.offset.pending.x || interaction.offset.pending.y);
  }

  var offset = {
    id: 'offset',
    before: ['modifiers', 'pointer-events', 'actions', 'inertia'],
    install: function install(scope) {
      scope.Interaction.prototype.offsetBy = offsetBy;
    },
    listeners: {
      'interactions:new': function interactionsNew(_ref7) {
        var interaction = _ref7.interaction;
        interaction.offset = {
          total: {
            x: 0,
            y: 0
          },
          pending: {
            x: 0,
            y: 0
          }
        };
      },
      'interactions:update-pointer': function interactionsUpdatePointer(_ref8) {
        var interaction = _ref8.interaction;
        return addTotal(interaction);
      },
      'interactions:before-action-start': beforeAction,
      'interactions:before-action-move': beforeAction,
      'interactions:before-action-end': beforeEnd,
      'interactions:stop': __end_50
    }
  };
  var ___default_50 = offset;
  _$plugin_50.default = ___default_50;
  var _$plugin_30 = {};
  "use strict";

  Object.defineProperty(_$plugin_30, "__esModule", {
    value: true
  });
  _$plugin_30.default = _$plugin_30.InertiaState = void 0;
  /* removed: var _$Modification_33 = require("@interactjs/modifiers/Modification"); */

  ;
  /* removed: var _$base_37 = require("@interactjs/modifiers/base"); */

  ;
  /* removed: var _$plugin_50 = require("@interactjs/offset/plugin"); */

  ;
  /* removed: var _$domUtils_66 = require("@interactjs/utils/domUtils"); */

  ;
  /* removed: var _$hypot_69 = require("@interactjs/utils/hypot"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$pointerUtils_75 = require("@interactjs/utils/pointerUtils"); */

  ;
  /* removed: var _$raf_76 = require("@interactjs/utils/raf"); */

  ;

  function ___classCallCheck_30(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function ___defineProperties_30(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function ___createClass_30(Constructor, protoProps, staticProps) {
    if (protoProps) ___defineProperties_30(Constructor.prototype, protoProps);
    if (staticProps) ___defineProperties_30(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function ___defineProperty_30(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function __install_30(scope) {
    var defaults = scope.defaults;
    scope.usePlugin(_$plugin_50.default);
    scope.usePlugin(_$base_37.default);
    scope.actions.phases.inertiastart = true;
    scope.actions.phases.resume = true;
    defaults.perAction.inertia = {
      enabled: false,
      resistance: 10,
      // the lambda in exponential decay
      minSpeed: 100,
      // target speed must be above this for inertia to start
      endSpeed: 10,
      // the speed at which inertia is slow enough to stop
      allowResume: true,
      // allow resuming an action in inertia phase
      smoothEndDuration: 300 // animate to snap/restrict endOnly if there's no inertia

    };
  }

  var InertiaState = /*#__PURE__*/function () {
    // eslint-disable-line camelcase
    // eslint-disable-line camelcase
    function InertiaState(interaction) {
      ___classCallCheck_30(this, InertiaState);

      ___defineProperty_30(this, "active", false);

      ___defineProperty_30(this, "isModified", false);

      ___defineProperty_30(this, "smoothEnd", false);

      ___defineProperty_30(this, "allowResume", false);

      ___defineProperty_30(this, "modification", void 0);

      ___defineProperty_30(this, "modifierCount", 0);

      ___defineProperty_30(this, "modifierArg", void 0);

      ___defineProperty_30(this, "startCoords", void 0);

      ___defineProperty_30(this, "t0", 0);

      ___defineProperty_30(this, "v0", 0);

      ___defineProperty_30(this, "te", 0);

      ___defineProperty_30(this, "targetOffset", void 0);

      ___defineProperty_30(this, "modifiedOffset", void 0);

      ___defineProperty_30(this, "currentOffset", void 0);

      ___defineProperty_30(this, "lambda_v0", 0);

      ___defineProperty_30(this, "one_ve_v0", 0);

      ___defineProperty_30(this, "timeout", void 0);

      ___defineProperty_30(this, "interaction", void 0);

      this.interaction = interaction;
    }

    ___createClass_30(InertiaState, [{
      key: "start",
      value: function start(event) {
        var interaction = this.interaction;
        var options = getOptions(interaction);

        if (!options || !options.enabled) {
          return false;
        }

        var velocityClient = interaction.coords.velocity.client;
        var pointerSpeed = (0, _$hypot_69.default)(velocityClient.x, velocityClient.y);
        var modification = this.modification || (this.modification = new _$Modification_33.default(interaction));
        modification.copyFrom(interaction.modification);
        this.t0 = interaction._now();
        this.allowResume = options.allowResume;
        this.v0 = pointerSpeed;
        this.currentOffset = {
          x: 0,
          y: 0
        };
        this.startCoords = interaction.coords.cur.page;
        this.modifierArg = modification.fillArg({
          pageCoords: this.startCoords,
          preEnd: true,
          phase: 'inertiastart'
        });
        var thrown = this.t0 - interaction.coords.cur.timeStamp < 50 && pointerSpeed > options.minSpeed && pointerSpeed > options.endSpeed;

        if (thrown) {
          this.startInertia();
        } else {
          modification.result = modification.setAll(this.modifierArg);

          if (!modification.result.changed) {
            return false;
          }

          this.startSmoothEnd();
        } // force modification change


        interaction.modification.result.rect = null; // bring inertiastart event to the target coords

        interaction.offsetBy(this.targetOffset);

        interaction._doPhase({
          interaction: interaction,
          event: event,
          phase: 'inertiastart'
        });

        interaction.offsetBy({
          x: -this.targetOffset.x,
          y: -this.targetOffset.y
        }); // force modification change

        interaction.modification.result.rect = null;
        this.active = true;
        interaction.simulation = this;
        return true;
      }
    }, {
      key: "startInertia",
      value: function startInertia() {
        var _this = this;

        var startVelocity = this.interaction.coords.velocity.client;
        var options = getOptions(this.interaction);
        var lambda = options.resistance;
        var inertiaDur = -Math.log(options.endSpeed / this.v0) / lambda;
        this.targetOffset = {
          x: (startVelocity.x - inertiaDur) / lambda,
          y: (startVelocity.y - inertiaDur) / lambda
        };
        this.te = inertiaDur;
        this.lambda_v0 = lambda / this.v0;
        this.one_ve_v0 = 1 - options.endSpeed / this.v0;
        var modification = this.modification,
            modifierArg = this.modifierArg;
        modifierArg.pageCoords = {
          x: this.startCoords.x + this.targetOffset.x,
          y: this.startCoords.y + this.targetOffset.y
        };
        modification.result = modification.setAll(modifierArg);

        if (modification.result.changed) {
          this.isModified = true;
          this.modifiedOffset = {
            x: this.targetOffset.x + modification.result.delta.x,
            y: this.targetOffset.y + modification.result.delta.y
          };
        }

        this.onNextFrame(function () {
          return _this.inertiaTick();
        });
      }
    }, {
      key: "startSmoothEnd",
      value: function startSmoothEnd() {
        var _this2 = this;

        this.smoothEnd = true;
        this.isModified = true;
        this.targetOffset = {
          x: this.modification.result.delta.x,
          y: this.modification.result.delta.y
        };
        this.onNextFrame(function () {
          return _this2.smoothEndTick();
        });
      }
    }, {
      key: "onNextFrame",
      value: function onNextFrame(tickFn) {
        var _this3 = this;

        this.timeout = _$raf_76.default.request(function () {
          if (_this3.active) {
            tickFn();
          }
        });
      }
    }, {
      key: "inertiaTick",
      value: function inertiaTick() {
        var _this4 = this;

        var interaction = this.interaction;
        var options = getOptions(interaction);
        var lambda = options.resistance;
        var t = (interaction._now() - this.t0) / 1000;

        if (t < this.te) {
          var progress = 1 - (Math.exp(-lambda * t) - this.lambda_v0) / this.one_ve_v0;
          var newOffset;

          if (this.isModified) {
            newOffset = getQuadraticCurvePoint(0, 0, this.targetOffset.x, this.targetOffset.y, this.modifiedOffset.x, this.modifiedOffset.y, progress);
          } else {
            newOffset = {
              x: this.targetOffset.x * progress,
              y: this.targetOffset.y * progress
            };
          }

          var delta = {
            x: newOffset.x - this.currentOffset.x,
            y: newOffset.y - this.currentOffset.y
          };
          this.currentOffset.x += delta.x;
          this.currentOffset.y += delta.y;
          interaction.offsetBy(delta);
          interaction.move();
          this.onNextFrame(function () {
            return _this4.inertiaTick();
          });
        } else {
          interaction.offsetBy({
            x: this.modifiedOffset.x - this.currentOffset.x,
            y: this.modifiedOffset.y - this.currentOffset.y
          });
          this.end();
        }
      }
    }, {
      key: "smoothEndTick",
      value: function smoothEndTick() {
        var _this5 = this;

        var interaction = this.interaction;
        var t = interaction._now() - this.t0;

        var _getOptions = getOptions(interaction),
            duration = _getOptions.smoothEndDuration;

        if (t < duration) {
          var newOffset = {
            x: easeOutQuad(t, 0, this.targetOffset.x, duration),
            y: easeOutQuad(t, 0, this.targetOffset.y, duration)
          };
          var delta = {
            x: newOffset.x - this.currentOffset.x,
            y: newOffset.y - this.currentOffset.y
          };
          this.currentOffset.x += delta.x;
          this.currentOffset.y += delta.y;
          interaction.offsetBy(delta);
          interaction.move({
            skipModifiers: this.modifierCount
          });
          this.onNextFrame(function () {
            return _this5.smoothEndTick();
          });
        } else {
          interaction.offsetBy({
            x: this.targetOffset.x - this.currentOffset.x,
            y: this.targetOffset.y - this.currentOffset.y
          });
          this.end();
        }
      }
    }, {
      key: "resume",
      value: function resume(_ref) {
        var pointer = _ref.pointer,
            event = _ref.event,
            eventTarget = _ref.eventTarget;
        var interaction = this.interaction; // undo inertia changes to interaction coords

        interaction.offsetBy({
          x: -this.currentOffset.x,
          y: -this.currentOffset.y
        }); // update pointer at pointer down position

        interaction.updatePointer(pointer, event, eventTarget, true); // fire resume signals and event

        interaction._doPhase({
          interaction: interaction,
          event: event,
          phase: 'resume'
        });

        (0, _$pointerUtils_75.copyCoords)(interaction.coords.prev, interaction.coords.cur);
        this.stop();
      }
    }, {
      key: "end",
      value: function end() {
        this.interaction.move();
        this.interaction.end();
        this.stop();
      }
    }, {
      key: "stop",
      value: function stop() {
        this.active = this.smoothEnd = false;
        this.interaction.simulation = null;

        _$raf_76.default.cancel(this.timeout);
      }
    }]);

    return InertiaState;
  }();

  _$plugin_30.InertiaState = InertiaState;

  function __start_30(_ref2) {
    var interaction = _ref2.interaction,
        event = _ref2.event;

    if (!interaction._interacting || interaction.simulation) {
      return null;
    }

    var started = interaction.inertia.start(event); // prevent action end if inertia or smoothEnd

    return started ? false : null;
  } // Check if the down event hits the current inertia target
  // control should be return to the user


  function resume(arg) {
    var interaction = arg.interaction,
        eventTarget = arg.eventTarget;
    var state = interaction.inertia;
    if (!state.active) return;
    var element = eventTarget; // climb up the DOM tree from the event target

    while (_$is_70.default.element(element)) {
      // if interaction element is the current inertia target element
      if (element === interaction.element) {
        state.resume(arg);
        break;
      }

      element = _$domUtils_66.parentNode(element);
    }
  }

  function stop(_ref3) {
    var interaction = _ref3.interaction;
    var state = interaction.inertia;

    if (state.active) {
      state.stop();
    }
  }

  function getOptions(_ref4) {
    var interactable = _ref4.interactable,
        prepared = _ref4.prepared;
    return interactable && interactable.options && prepared.name && interactable.options[prepared.name].inertia;
  }

  var inertia = {
    id: 'inertia',
    before: ['modifiers', 'actions'],
    install: __install_30,
    listeners: {
      'interactions:new': function interactionsNew(_ref5) {
        var interaction = _ref5.interaction;
        interaction.inertia = new InertiaState(interaction);
      },
      'interactions:before-action-end': __start_30,
      'interactions:down': resume,
      'interactions:stop': stop,
      'interactions:before-action-resume': function interactionsBeforeActionResume(arg) {
        var modification = arg.interaction.modification;
        modification.stop(arg);
        modification.start(arg, arg.interaction.coords.cur.page);
        modification.applyToInteraction(arg);
      },
      'interactions:before-action-inertiastart': function interactionsBeforeActionInertiastart(arg) {
        return arg.interaction.modification.setAndApply(arg);
      },
      'interactions:action-resume': _$base_37.addEventModifiers,
      'interactions:action-inertiastart': _$base_37.addEventModifiers,
      'interactions:after-action-inertiastart': function interactionsAfterActionInertiastart(arg) {
        return arg.interaction.modification.restoreInteractionCoords(arg);
      },
      'interactions:after-action-resume': function interactionsAfterActionResume(arg) {
        return arg.interaction.modification.restoreInteractionCoords(arg);
      }
    }
  }; // http://stackoverflow.com/a/5634528/2280888

  function _getQBezierValue(t, p1, p2, p3) {
    var iT = 1 - t;
    return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
  }

  function getQuadraticCurvePoint(startX, startY, cpX, cpY, endX, endY, position) {
    return {
      x: _getQBezierValue(position, startX, cpX, endX),
      y: _getQBezierValue(position, startY, cpY, endY)
    };
  } // http://gizma.com/easing/


  function easeOutQuad(t, b, c, d) {
    t /= d;
    return -c * t * (t - 2) + b;
  }

  var ___default_30 = inertia;
  _$plugin_30.default = ___default_30;
  var _$Eventable_14 = {};
  "use strict";

  Object.defineProperty(_$Eventable_14, "__esModule", {
    value: true
  });
  _$Eventable_14.Eventable = void 0;
  /* removed: var _$arr_62 = require("@interactjs/utils/arr"); */

  ;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$normalizeListeners_73 = require("@interactjs/utils/normalizeListeners"); */

  ;

  function ___classCallCheck_14(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function ___defineProperties_14(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function ___createClass_14(Constructor, protoProps, staticProps) {
    if (protoProps) ___defineProperties_14(Constructor.prototype, protoProps);
    if (staticProps) ___defineProperties_14(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function ___defineProperty_14(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function fireUntilImmediateStopped(event, listeners) {
    for (var _i = 0; _i < listeners.length; _i++) {
      var _ref;

      _ref = listeners[_i];
      var listener = _ref;

      if (event.immediatePropagationStopped) {
        break;
      }

      listener(event);
    }
  }

  var Eventable = /*#__PURE__*/function () {
    function Eventable(options) {
      ___classCallCheck_14(this, Eventable);

      ___defineProperty_14(this, "options", void 0);

      ___defineProperty_14(this, "types", {});

      ___defineProperty_14(this, "propagationStopped", false);

      ___defineProperty_14(this, "immediatePropagationStopped", false);

      ___defineProperty_14(this, "global", void 0);

      this.options = (0, _$extend_67.default)({}, options || {});
    }

    ___createClass_14(Eventable, [{
      key: "fire",
      value: function fire(event) {
        var listeners;
        var global = this.global; // Interactable#on() listeners
        // tslint:disable no-conditional-assignment

        if (listeners = this.types[event.type]) {
          fireUntilImmediateStopped(event, listeners);
        } // interact.on() listeners


        if (!event.propagationStopped && global && (listeners = global[event.type])) {
          fireUntilImmediateStopped(event, listeners);
        }
      }
    }, {
      key: "on",
      value: function on(type, listener) {
        var listeners = (0, _$normalizeListeners_73.default)(type, listener);

        for (type in listeners) {
          this.types[type] = _$arr_62.merge(this.types[type] || [], listeners[type]);
        }
      }
    }, {
      key: "off",
      value: function off(type, listener) {
        var listeners = (0, _$normalizeListeners_73.default)(type, listener);

        for (type in listeners) {
          var eventList = this.types[type];

          if (!eventList || !eventList.length) {
            continue;
          }

          for (var _i2 = 0; _i2 < listeners[type].length; _i2++) {
            var _ref2;

            _ref2 = listeners[type][_i2];
            var subListener = _ref2;

            var _index = eventList.indexOf(subListener);

            if (_index !== -1) {
              eventList.splice(_index, 1);
            }
          }
        }
      }
    }, {
      key: "getRect",
      value: function getRect(_element) {
        return null;
      }
    }]);

    return Eventable;
  }();

  _$Eventable_14.Eventable = Eventable;
  var _$isNonNativeEvent_25 = {};
  "use strict";

  Object.defineProperty(_$isNonNativeEvent_25, "__esModule", {
    value: true
  });
  _$isNonNativeEvent_25.default = isNonNativeEvent;

  function isNonNativeEvent(type, actions) {
    if (actions.phaselessTypes[type]) {
      return true;
    }

    for (var name in actions.map) {
      if (type.indexOf(name) === 0 && type.substr(name.length) in actions.phases) {
        return true;
      }
    }

    return false;
  }

  var _$InteractStatic_16 = {};
  "use strict";

  Object.defineProperty(_$InteractStatic_16, "__esModule", {
    value: true
  });
  _$InteractStatic_16.createInteractStatic = createInteractStatic;
  /* removed: var _$browser_63 = require("@interactjs/utils/browser"); */

  ;
  /* removed: var _$domUtils_66 = require("@interactjs/utils/domUtils"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$misc_72 = require("@interactjs/utils/misc"); */

  ;
  /* removed: var _$pointerUtils_75 = require("@interactjs/utils/pointerUtils"); */

  ;
  /* removed: var _$isNonNativeEvent_25 = require("./isNonNativeEvent"); */

  ;
  /** @module interact */

  function createInteractStatic(scope) {
    /**
     * ```js
     * interact('#draggable').draggable(true)
     *
     * var rectables = interact('rect')
     * rectables
     *   .gesturable(true)
     *   .on('gesturemove', function (event) {
     *       // ...
     *   })
     * ```
     *
     * The methods of this variable can be used to set elements as interactables
     * and also to change various default settings.
     *
     * Calling it as a function and passing an element or a valid CSS selector
     * string returns an Interactable object which has various methods to configure
     * it.
     *
     * @global
     *
     * @param {Element | string} target The HTML or SVG Element to interact with
     * or CSS selector
     * @return {Interactable}
     */
    var interact = function interact(target, options) {
      var interactable = scope.interactables.get(target, options);

      if (!interactable) {
        interactable = scope.interactables.new(target, options);
        interactable.events.global = interact.globalEvents;
      }

      return interactable;
    }; // expose the functions used to calculate multi-touch properties


    interact.getPointerAverage = _$pointerUtils_75.pointerAverage;
    interact.getTouchBBox = _$pointerUtils_75.touchBBox;
    interact.getTouchDistance = _$pointerUtils_75.touchDistance;
    interact.getTouchAngle = _$pointerUtils_75.touchAngle;
    interact.getElementRect = _$domUtils_66.getElementRect;
    interact.getElementClientRect = _$domUtils_66.getElementClientRect;
    interact.matchesSelector = _$domUtils_66.matchesSelector;
    interact.closest = _$domUtils_66.closest;
    interact.globalEvents = {}; // eslint-disable-next-line no-undef

    interact.version = "1.10.17";
    interact.scope = scope;
    /**
     * Use a plugin
     *
     * @alias module:interact.use
     *
     */

    interact.use = function (plugin, options) {
      this.scope.usePlugin(plugin, options);
      return this;
    };
    /**
     * Check if an element or selector has been set with the {@link interact}
     * function
     *
     * @alias module:interact.isSet
     *
     * @param {Target} target The Element or string being searched for
     * @param {object} options
     * @return {boolean} Indicates if the element or CSS selector was previously
     * passed to interact
     */


    interact.isSet = function (target, options) {
      return !!this.scope.interactables.get(target, options && options.context);
    };
    /**
     * @deprecated
     * Add a global listener for an InteractEvent or adds a DOM event to `document`
     *
     * @alias module:interact.on
     *
     * @param {string | array | object} type The types of events to listen for
     * @param {function} listener The function event (s)
     * @param {object | boolean} [options] object or useCapture flag for
     * addEventListener
     * @return {object} interact
     */


    interact.on = (0, _$misc_72.warnOnce)(function on(type, listener, options) {
      if (_$is_70.default.string(type) && type.search(' ') !== -1) {
        type = type.trim().split(/ +/);
      }

      if (_$is_70.default.array(type)) {
        for (var _i = 0; _i < type.length; _i++) {
          var _ref;

          _ref = type[_i];
          var eventType = _ref;
          this.on(eventType, listener, options);
        }

        return this;
      }

      if (_$is_70.default.object(type)) {
        for (var prop in type) {
          this.on(prop, type[prop], listener);
        }

        return this;
      } // if it is an InteractEvent type, add listener to globalEvents


      if ((0, _$isNonNativeEvent_25.default)(type, this.scope.actions)) {
        // if this type of event was never bound
        if (!this.globalEvents[type]) {
          this.globalEvents[type] = [listener];
        } else {
          this.globalEvents[type].push(listener);
        }
      } // If non InteractEvent type, addEventListener to document
      else {
        this.scope.events.add(this.scope.document, type, listener, {
          options: options
        });
      }

      return this;
    }, 'The interact.on() method is being deprecated');
    /**
     * @deprecated
     * Removes a global InteractEvent listener or DOM event from `document`
     *
     * @alias module:interact.off
     *
     * @param {string | array | object} type The types of events that were listened
     * for
     * @param {function} listener The listener function to be removed
     * @param {object | boolean} options [options] object or useCapture flag for
     * removeEventListener
     * @return {object} interact
     */

    interact.off = (0, _$misc_72.warnOnce)(function off(type, listener, options) {
      if (_$is_70.default.string(type) && type.search(' ') !== -1) {
        type = type.trim().split(/ +/);
      }

      if (_$is_70.default.array(type)) {
        for (var _i2 = 0; _i2 < type.length; _i2++) {
          var _ref2;

          _ref2 = type[_i2];
          var eventType = _ref2;
          this.off(eventType, listener, options);
        }

        return this;
      }

      if (_$is_70.default.object(type)) {
        for (var prop in type) {
          this.off(prop, type[prop], listener);
        }

        return this;
      }

      if ((0, _$isNonNativeEvent_25.default)(type, this.scope.actions)) {
        var index;

        if (type in this.globalEvents && (index = this.globalEvents[type].indexOf(listener)) !== -1) {
          this.globalEvents[type].splice(index, 1);
        }
      } else {
        this.scope.events.remove(this.scope.document, type, listener, options);
      }

      return this;
    }, 'The interact.off() method is being deprecated');

    interact.debug = function () {
      return this.scope;
    };
    /**
     * @alias module:interact.supportsTouch
     *
     * @return {boolean} Whether or not the browser supports touch input
     */


    interact.supportsTouch = function () {
      return _$browser_63.default.supportsTouch;
    };
    /**
     * @alias module:interact.supportsPointerEvent
     *
     * @return {boolean} Whether or not the browser supports PointerEvents
     */


    interact.supportsPointerEvent = function () {
      return _$browser_63.default.supportsPointerEvent;
    };
    /**
     * Cancels all interactions (end events are not fired)
     *
     * @alias module:interact.stop
     *
     * @return {object} interact
     */


    interact.stop = function () {
      for (var _i3 = 0; _i3 < this.scope.interactions.list.length; _i3++) {
        var _ref3;

        _ref3 = this.scope.interactions.list[_i3];
        var interaction = _ref3;
        interaction.stop();
      }

      return this;
    };
    /**
     * Returns or sets the distance the pointer must be moved before an action
     * sequence occurs. This also affects tolerance for tap events.
     *
     * @alias module:interact.pointerMoveTolerance
     *
     * @param {number} [newValue] The movement from the start position must be greater than this value
     * @return {interact | number}
     */


    interact.pointerMoveTolerance = function (newValue) {
      if (_$is_70.default.number(newValue)) {
        this.scope.interactions.pointerMoveTolerance = newValue;
        return this;
      }

      return this.scope.interactions.pointerMoveTolerance;
    };

    interact.addDocument = function (doc, options) {
      this.scope.addDocument(doc, options);
    };

    interact.removeDocument = function (doc) {
      this.scope.removeDocument(doc);
    };

    return interact;
  }

  var _$Interactable_17 = {};
  "use strict";

  Object.defineProperty(_$Interactable_17, "__esModule", {
    value: true
  });
  _$Interactable_17.Interactable = void 0;
  /* removed: var _$arr_62 = require("@interactjs/utils/arr"); */

  ;
  /* removed: var _$browser_63 = require("@interactjs/utils/browser"); */

  ;
  /* removed: var _$clone_64 = require("@interactjs/utils/clone"); */

  ;
  /* removed: var _$domUtils_66 = require("@interactjs/utils/domUtils"); */

  ;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$normalizeListeners_73 = require("@interactjs/utils/normalizeListeners"); */

  ;
  /* removed: var _$window_78 = require("@interactjs/utils/window"); */

  ;
  /* removed: var _$Eventable_14 = require("./Eventable"); */

  ;
  /* removed: var _$isNonNativeEvent_25 = require("./isNonNativeEvent"); */

  ;

  function ___classCallCheck_17(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function ___defineProperties_17(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function ___createClass_17(Constructor, protoProps, staticProps) {
    if (protoProps) ___defineProperties_17(Constructor.prototype, protoProps);
    if (staticProps) ___defineProperties_17(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function ___defineProperty_17(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }
  /** */


  var Interactable = /*#__PURE__*/function () {
    /** */
    function Interactable(target, options, defaultContext, scopeEvents) {
      ___classCallCheck_17(this, Interactable);

      ___defineProperty_17(this, "options", void 0);

      ___defineProperty_17(this, "_actions", void 0);

      ___defineProperty_17(this, "target", void 0);

      ___defineProperty_17(this, "events", new _$Eventable_14.Eventable());

      ___defineProperty_17(this, "_context", void 0);

      ___defineProperty_17(this, "_win", void 0);

      ___defineProperty_17(this, "_doc", void 0);

      ___defineProperty_17(this, "_scopeEvents", void 0);

      ___defineProperty_17(this, "_rectChecker", void 0);

      this._actions = options.actions;
      this.target = target;
      this._context = options.context || defaultContext;
      this._win = (0, _$window_78.getWindow)((0, _$domUtils_66.trySelector)(target) ? this._context : target);
      this._doc = this._win.document;
      this._scopeEvents = scopeEvents;
      this.set(options);
    }

    ___createClass_17(Interactable, [{
      key: "_defaults",
      get:
      /** @internal */
      function get() {
        return {
          base: {},
          perAction: {},
          actions: {}
        };
      }
    }, {
      key: "setOnEvents",
      value: function setOnEvents(actionName, phases) {
        if (_$is_70.default.func(phases.onstart)) {
          this.on("".concat(actionName, "start"), phases.onstart);
        }

        if (_$is_70.default.func(phases.onmove)) {
          this.on("".concat(actionName, "move"), phases.onmove);
        }

        if (_$is_70.default.func(phases.onend)) {
          this.on("".concat(actionName, "end"), phases.onend);
        }

        if (_$is_70.default.func(phases.oninertiastart)) {
          this.on("".concat(actionName, "inertiastart"), phases.oninertiastart);
        }

        return this;
      }
    }, {
      key: "updatePerActionListeners",
      value: function updatePerActionListeners(actionName, prev, cur) {
        if (_$is_70.default.array(prev) || _$is_70.default.object(prev)) {
          this.off(actionName, prev);
        }

        if (_$is_70.default.array(cur) || _$is_70.default.object(cur)) {
          this.on(actionName, cur);
        }
      }
    }, {
      key: "setPerAction",
      value: function setPerAction(actionName, options) {
        var defaults = this._defaults; // for all the default per-action options

        for (var optionName_ in options) {
          var optionName = optionName_;
          var actionOptions = this.options[actionName];
          var optionValue = options[optionName]; // remove old event listeners and add new ones

          if (optionName === 'listeners') {
            this.updatePerActionListeners(actionName, actionOptions.listeners, optionValue);
          } // if the option value is an array


          if (_$is_70.default.array(optionValue)) {
            ;
            actionOptions[optionName] = _$arr_62.from(optionValue);
          } // if the option value is an object
          else if (_$is_70.default.plainObject(optionValue)) {
            // copy the object
            ;
            actionOptions[optionName] = (0, _$extend_67.default)(actionOptions[optionName] || {}, (0, _$clone_64.default)(optionValue)); // set anabled field to true if it exists in the defaults

            if (_$is_70.default.object(defaults.perAction[optionName]) && 'enabled' in defaults.perAction[optionName]) {
              ;
              actionOptions[optionName].enabled = optionValue.enabled !== false;
            }
          } // if the option value is a boolean and the default is an object
          else if (_$is_70.default.bool(optionValue) && _$is_70.default.object(defaults.perAction[optionName])) {
            ;
            actionOptions[optionName].enabled = optionValue;
          } // if it's anything else, do a plain assignment
          else {
            ;
            actionOptions[optionName] = optionValue;
          }
        }
      }
      /**
       * The default function to get an Interactables bounding rect. Can be
       * overridden using {@link Interactable.rectChecker}.
       *
       * @param {Element} [element] The element to measure.
       * @return {Rect} The object's bounding rectangle.
       */

    }, {
      key: "getRect",
      value: function getRect(element) {
        element = element || (_$is_70.default.element(this.target) ? this.target : null);

        if (_$is_70.default.string(this.target)) {
          element = element || this._context.querySelector(this.target);
        }

        return (0, _$domUtils_66.getElementRect)(element);
      }
      /**
       * Returns or sets the function used to calculate the interactable's
       * element's rectangle
       *
       * @param {function} [checker] A function which returns this Interactable's
       * bounding rectangle. See {@link Interactable.getRect}
       * @return {function | object} The checker function or this Interactable
       */

    }, {
      key: "rectChecker",
      value: function rectChecker(checker) {
        var _this = this;

        if (_$is_70.default.func(checker)) {
          this._rectChecker = checker;

          this.getRect = function (element) {
            var rect = (0, _$extend_67.default)({}, _this._rectChecker(element));

            if (!('width' in rect)) {
              rect.width = rect.right - rect.left;
              rect.height = rect.bottom - rect.top;
            }

            return rect;
          };

          return this;
        }

        if (checker === null) {
          delete this.getRect;
          delete this._rectChecker;
          return this;
        }

        return this.getRect;
      }
    }, {
      key: "_backCompatOption",
      value: function _backCompatOption(optionName, newValue) {
        if ((0, _$domUtils_66.trySelector)(newValue) || _$is_70.default.object(newValue)) {
          ;
          this.options[optionName] = newValue;

          for (var action in this._actions.map) {
            ;
            this.options[action][optionName] = newValue;
          }

          return this;
        }

        return this.options[optionName];
      }
      /**
       * Gets or sets the origin of the Interactable's element.  The x and y
       * of the origin will be subtracted from action event coordinates.
       *
       * @param {Element | object | string} [origin] An HTML or SVG Element whose
       * rect will be used, an object eg. { x: 0, y: 0 } or string 'parent', 'self'
       * or any CSS selector
       *
       * @return {object} The current origin or this Interactable
       */

    }, {
      key: "origin",
      value: function origin(newValue) {
        return this._backCompatOption('origin', newValue);
      }
      /**
       * Returns or sets the mouse coordinate types used to calculate the
       * movement of the pointer.
       *
       * @param {string} [newValue] Use 'client' if you will be scrolling while
       * interacting; Use 'page' if you want autoScroll to work
       * @return {string | object} The current deltaSource or this Interactable
       */

    }, {
      key: "deltaSource",
      value: function deltaSource(newValue) {
        if (newValue === 'page' || newValue === 'client') {
          this.options.deltaSource = newValue;
          return this;
        }

        return this.options.deltaSource;
      }
      /**
       * Gets the selector context Node of the Interactable. The default is
       * `window.document`.
       *
       * @return {Node} The context Node of this Interactable
       */

    }, {
      key: "context",
      value: function context() {
        return this._context;
      }
    }, {
      key: "inContext",
      value: function inContext(element) {
        return this._context === element.ownerDocument || (0, _$domUtils_66.nodeContains)(this._context, element);
      }
    }, {
      key: "testIgnoreAllow",
      value: function testIgnoreAllow(options, targetNode, eventTarget) {
        return !this.testIgnore(options.ignoreFrom, targetNode, eventTarget) && this.testAllow(options.allowFrom, targetNode, eventTarget);
      }
    }, {
      key: "testAllow",
      value: function testAllow(allowFrom, targetNode, element) {
        if (!allowFrom) {
          return true;
        }

        if (!_$is_70.default.element(element)) {
          return false;
        }

        if (_$is_70.default.string(allowFrom)) {
          return (0, _$domUtils_66.matchesUpTo)(element, allowFrom, targetNode);
        } else if (_$is_70.default.element(allowFrom)) {
          return (0, _$domUtils_66.nodeContains)(allowFrom, element);
        }

        return false;
      }
    }, {
      key: "testIgnore",
      value: function testIgnore(ignoreFrom, targetNode, element) {
        if (!ignoreFrom || !_$is_70.default.element(element)) {
          return false;
        }

        if (_$is_70.default.string(ignoreFrom)) {
          return (0, _$domUtils_66.matchesUpTo)(element, ignoreFrom, targetNode);
        } else if (_$is_70.default.element(ignoreFrom)) {
          return (0, _$domUtils_66.nodeContains)(ignoreFrom, element);
        }

        return false;
      }
      /**
       * Calls listeners for the given InteractEvent type bound globally
       * and directly to this Interactable
       *
       * @param {InteractEvent} iEvent The InteractEvent object to be fired on this
       * Interactable
       * @return {Interactable} this Interactable
       */

    }, {
      key: "fire",
      value: function fire(iEvent) {
        this.events.fire(iEvent);
        return this;
      }
    }, {
      key: "_onOff",
      value: function _onOff(method, typeArg, listenerArg, options) {
        if (_$is_70.default.object(typeArg) && !_$is_70.default.array(typeArg)) {
          options = listenerArg;
          listenerArg = null;
        }

        var addRemove = method === 'on' ? 'add' : 'remove';
        var listeners = (0, _$normalizeListeners_73.default)(typeArg, listenerArg);

        for (var type in listeners) {
          if (type === 'wheel') {
            type = _$browser_63.default.wheelEvent;
          }

          for (var _i = 0; _i < listeners[type].length; _i++) {
            var _ref;

            _ref = listeners[type][_i];
            var listener = _ref; // if it is an action event type

            if ((0, _$isNonNativeEvent_25.default)(type, this._actions)) {
              this.events[method](type, listener);
            } // delegated event
            else if (_$is_70.default.string(this.target)) {
              this._scopeEvents["".concat(addRemove, "Delegate")](this.target, this._context, type, listener, options);
            } // remove listener from this Interactable's element
            else {
              this._scopeEvents[addRemove](this.target, type, listener, options);
            }
          }
        }

        return this;
      }
      /**
       * Binds a listener for an InteractEvent, pointerEvent or DOM event.
       *
       * @param {string | array | object} types The types of events to listen
       * for
       * @param {function | array | object} [listener] The event listener function(s)
       * @param {object | boolean} [options] options object or useCapture flag for
       * addEventListener
       * @return {Interactable} This Interactable
       */

    }, {
      key: "on",
      value: function on(types, listener, options) {
        return this._onOff('on', types, listener, options);
      }
      /**
       * Removes an InteractEvent, pointerEvent or DOM event listener.
       *
       * @param {string | array | object} types The types of events that were
       * listened for
       * @param {function | array | object} [listener] The event listener function(s)
       * @param {object | boolean} [options] options object or useCapture flag for
       * removeEventListener
       * @return {Interactable} This Interactable
       */

    }, {
      key: "off",
      value: function off(types, listener, options) {
        return this._onOff('off', types, listener, options);
      }
      /**
       * Reset the options of this Interactable
       *
       * @param {object} options The new settings to apply
       * @return {object} This Interactable
       */

    }, {
      key: "set",
      value: function set(options) {
        var defaults = this._defaults;

        if (!_$is_70.default.object(options)) {
          options = {};
        }

        ;
        this.options = (0, _$clone_64.default)(defaults.base);

        for (var actionName_ in this._actions.methodDict) {
          var actionName = actionName_;
          var methodName = this._actions.methodDict[actionName];
          this.options[actionName] = {};
          this.setPerAction(actionName, (0, _$extend_67.default)((0, _$extend_67.default)({}, defaults.perAction), defaults.actions[actionName]));
          this[methodName](options[actionName]);
        }

        for (var setting in options) {
          if (_$is_70.default.func(this[setting])) {
            ;
            this[setting](options[setting]);
          }
        }

        return this;
      }
      /**
       * Remove this interactable from the list of interactables and remove it's
       * action capabilities and event listeners
       */

    }, {
      key: "unset",
      value: function unset() {
        if (_$is_70.default.string(this.target)) {
          // remove delegated events
          for (var type in this._scopeEvents.delegatedEvents) {
            var delegated = this._scopeEvents.delegatedEvents[type];

            for (var i = delegated.length - 1; i >= 0; i--) {
              var _delegated$i = delegated[i],
                  selector = _delegated$i.selector,
                  context = _delegated$i.context,
                  listeners = _delegated$i.listeners;

              if (selector === this.target && context === this._context) {
                delegated.splice(i, 1);
              }

              for (var l = listeners.length - 1; l >= 0; l--) {
                this._scopeEvents.removeDelegate(this.target, this._context, type, listeners[l][0], listeners[l][1]);
              }
            }
          }
        } else {
          this._scopeEvents.remove(this.target, 'all');
        }
      }
    }]);

    return Interactable;
  }();

  _$Interactable_17.Interactable = Interactable;
  var _$InteractableSet_18 = {};
  "use strict";

  Object.defineProperty(_$InteractableSet_18, "__esModule", {
    value: true
  });
  _$InteractableSet_18.InteractableSet = void 0;
  /* removed: var _$arr_62 = require("@interactjs/utils/arr"); */

  ;
  /* removed: var _$domUtils_66 = require("@interactjs/utils/domUtils"); */

  ;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;

  function ___classCallCheck_18(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function ___defineProperties_18(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function ___createClass_18(Constructor, protoProps, staticProps) {
    if (protoProps) ___defineProperties_18(Constructor.prototype, protoProps);
    if (staticProps) ___defineProperties_18(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function ___defineProperty_18(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var InteractableSet = /*#__PURE__*/function () {
    // all set interactables
    function InteractableSet(scope) {
      var _this = this;

      ___classCallCheck_18(this, InteractableSet);

      ___defineProperty_18(this, "list", []);

      ___defineProperty_18(this, "selectorMap", {});

      ___defineProperty_18(this, "scope", void 0);

      this.scope = scope;
      scope.addListeners({
        'interactable:unset': function interactableUnset(_ref) {
          var interactable = _ref.interactable;
          var target = interactable.target,
              context = interactable._context;
          var targetMappings = _$is_70.default.string(target) ? _this.selectorMap[target] : target[_this.scope.id];

          var targetIndex = _$arr_62.findIndex(targetMappings, function (m) {
            return m.context === context;
          });

          if (targetMappings[targetIndex]) {
            // Destroying mappingInfo's context and interactable
            targetMappings[targetIndex].context = null;
            targetMappings[targetIndex].interactable = null;
          }

          targetMappings.splice(targetIndex, 1);
        }
      });
    }

    ___createClass_18(InteractableSet, [{
      key: "new",
      value: function _new(target, options) {
        options = (0, _$extend_67.default)(options || {}, {
          actions: this.scope.actions
        });
        var interactable = new this.scope.Interactable(target, options, this.scope.document, this.scope.events);
        var mappingInfo = {
          context: interactable._context,
          interactable: interactable
        };
        this.scope.addDocument(interactable._doc);
        this.list.push(interactable);

        if (_$is_70.default.string(target)) {
          if (!this.selectorMap[target]) {
            this.selectorMap[target] = [];
          }

          this.selectorMap[target].push(mappingInfo);
        } else {
          if (!interactable.target[this.scope.id]) {
            Object.defineProperty(target, this.scope.id, {
              value: [],
              configurable: true
            });
          }

          ;
          target[this.scope.id].push(mappingInfo);
        }

        this.scope.fire('interactable:new', {
          target: target,
          options: options,
          interactable: interactable,
          win: this.scope._win
        });
        return interactable;
      }
    }, {
      key: "get",
      value: function get(target, options) {
        var context = options && options.context || this.scope.document;

        var isSelector = _$is_70.default.string(target);

        var targetMappings = isSelector ? this.selectorMap[target] : target[this.scope.id];

        if (!targetMappings) {
          return null;
        }

        var found = _$arr_62.find(targetMappings, function (m) {
          return m.context === context && (isSelector || m.interactable.inContext(target));
        });

        return found && found.interactable;
      }
    }, {
      key: "forEachMatch",
      value: function forEachMatch(node, callback) {
        for (var _i = 0; _i < this.list.length; _i++) {
          var _ref2;

          _ref2 = this.list[_i];
          var _interactable = _ref2;
          var ret = void 0;

          if ((_$is_70.default.string(_interactable.target) ? // target is a selector and the element matches
          _$is_70.default.element(node) && _$domUtils_66.matchesSelector(node, _interactable.target) : // target is the element
          node === _interactable.target) && // the element is in context
          _interactable.inContext(node)) {
            ret = callback(_interactable);
          }

          if (ret !== undefined) {
            return ret;
          }
        }
      }
    }]);

    return InteractableSet;
  }();

  _$InteractableSet_18.InteractableSet = InteractableSet;
  var _$events_21 = {};
  "use strict";

  Object.defineProperty(_$events_21, "__esModule", {
    value: true
  });
  _$events_21.default = void 0;
  /* removed: var _$arr_62 = require("@interactjs/utils/arr"); */

  ;
  /* removed: var _$domUtils_66 = require("@interactjs/utils/domUtils"); */

  ;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$pointerExtend_74 = require("@interactjs/utils/pointerExtend"); */

  ;
  /* removed: var _$pointerUtils_75 = require("@interactjs/utils/pointerUtils"); */

  ;

  function ___classCallCheck_21(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function ___defineProperties_21(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function ___createClass_21(Constructor, protoProps, staticProps) {
    if (protoProps) ___defineProperties_21(Constructor.prototype, protoProps);
    if (staticProps) ___defineProperties_21(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function ___defineProperty_21(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ___slicedToArray_21(arr, i) {
    return ___arrayWithHoles_21(arr) || ___iterableToArrayLimit_21(arr, i) || ___unsupportedIterableToArray_21(arr, i) || ___nonIterableRest_21();
  }

  function ___nonIterableRest_21() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function ___unsupportedIterableToArray_21(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return ___arrayLikeToArray_21(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return ___arrayLikeToArray_21(o, minLen);
  }

  function ___arrayLikeToArray_21(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }

  function ___iterableToArrayLimit_21(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;

    var _s, _e;

    try {
      for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function ___arrayWithHoles_21(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function __install_21(scope) {
    var _scope$document;

    var targets = [];
    var delegatedEvents = {};
    var documents = [];
    var eventsMethods = {
      add: add,
      remove: remove,
      addDelegate: addDelegate,
      removeDelegate: removeDelegate,
      delegateListener: delegateListener,
      delegateUseCapture: delegateUseCapture,
      delegatedEvents: delegatedEvents,
      documents: documents,
      targets: targets,
      supportsOptions: false,
      supportsPassive: false
    }; // check if browser supports passive events and options arg

    (_scope$document = scope.document) == null ? void 0 : _scope$document.createElement('div').addEventListener('test', null, {
      get capture() {
        return eventsMethods.supportsOptions = true;
      },

      get passive() {
        return eventsMethods.supportsPassive = true;
      }

    });
    scope.events = eventsMethods;

    function add(eventTarget, type, listener, optionalArg) {
      var options = __getOptions_21(optionalArg);

      var target = _$arr_62.find(targets, function (t) {
        return t.eventTarget === eventTarget;
      });

      if (!target) {
        target = {
          eventTarget: eventTarget,
          events: {}
        };
        targets.push(target);
      }

      if (!target.events[type]) {
        target.events[type] = [];
      }

      if (eventTarget.addEventListener && !_$arr_62.contains(target.events[type], listener)) {
        eventTarget.addEventListener(type, listener, eventsMethods.supportsOptions ? options : options.capture);
        target.events[type].push(listener);
      }
    }

    function remove(eventTarget, type, listener, optionalArg) {
      var options = __getOptions_21(optionalArg);

      var targetIndex = _$arr_62.findIndex(targets, function (t) {
        return t.eventTarget === eventTarget;
      });

      var target = targets[targetIndex];

      if (!target || !target.events) {
        return;
      }

      if (type === 'all') {
        for (type in target.events) {
          if (target.events.hasOwnProperty(type)) {
            remove(eventTarget, type, 'all');
          }
        }

        return;
      }

      var typeIsEmpty = false;
      var typeListeners = target.events[type];

      if (typeListeners) {
        if (listener === 'all') {
          for (var i = typeListeners.length - 1; i >= 0; i--) {
            remove(eventTarget, type, typeListeners[i], options);
          }

          return;
        } else {
          for (var _i = 0; _i < typeListeners.length; _i++) {
            if (typeListeners[_i] === listener) {
              eventTarget.removeEventListener(type, listener, eventsMethods.supportsOptions ? options : options.capture);
              typeListeners.splice(_i, 1);

              if (typeListeners.length === 0) {
                delete target.events[type];
                typeIsEmpty = true;
              }

              break;
            }
          }
        }
      }

      if (typeIsEmpty && !Object.keys(target.events).length) {
        targets.splice(targetIndex, 1);
      }
    }

    function addDelegate(selector, context, type, listener, optionalArg) {
      var options = __getOptions_21(optionalArg);

      if (!delegatedEvents[type]) {
        delegatedEvents[type] = []; // add delegate listener functions

        for (var _i2 = 0; _i2 < documents.length; _i2++) {
          var _ref;

          _ref = documents[_i2];
          var doc = _ref;
          add(doc, type, delegateListener);
          add(doc, type, delegateUseCapture, true);
        }
      }

      var delegates = delegatedEvents[type];

      var delegate = _$arr_62.find(delegates, function (d) {
        return d.selector === selector && d.context === context;
      });

      if (!delegate) {
        delegate = {
          selector: selector,
          context: context,
          listeners: []
        };
        delegates.push(delegate);
      }

      delegate.listeners.push([listener, options]);
    }

    function removeDelegate(selector, context, type, listener, optionalArg) {
      var options = __getOptions_21(optionalArg);

      var delegates = delegatedEvents[type];
      var matchFound = false;
      var index;
      if (!delegates) return; // count from last index of delegated to 0

      for (index = delegates.length - 1; index >= 0; index--) {
        var cur = delegates[index]; // look for matching selector and context Node

        if (cur.selector === selector && cur.context === context) {
          var listeners = cur.listeners; // each item of the listeners array is an array: [function, capture, passive]

          for (var i = listeners.length - 1; i >= 0; i--) {
            var _listeners$i = ___slicedToArray_21(listeners[i], 2),
                fn = _listeners$i[0],
                _listeners$i$ = _listeners$i[1],
                capture = _listeners$i$.capture,
                passive = _listeners$i$.passive; // check if the listener functions and capture and passive flags match


            if (fn === listener && capture === options.capture && passive === options.passive) {
              // remove the listener from the array of listeners
              listeners.splice(i, 1); // if all listeners for this target have been removed
              // remove the target from the delegates array

              if (!listeners.length) {
                delegates.splice(index, 1); // remove delegate function from context

                remove(context, type, delegateListener);
                remove(context, type, delegateUseCapture, true);
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
      var options = __getOptions_21(optionalArg);

      var fakeEvent = new FakeEvent(event);
      var delegates = delegatedEvents[event.type];

      var _pointerUtils$getEven = _$pointerUtils_75.getEventTargets(event),
          _pointerUtils$getEven2 = ___slicedToArray_21(_pointerUtils$getEven, 1),
          eventTarget = _pointerUtils$getEven2[0];

      var element = eventTarget; // climb up document tree looking for selector matches

      while (_$is_70.default.element(element)) {
        for (var i = 0; i < delegates.length; i++) {
          var cur = delegates[i];
          var selector = cur.selector,
              context = cur.context;

          if (_$domUtils_66.matchesSelector(element, selector) && _$domUtils_66.nodeContains(context, eventTarget) && _$domUtils_66.nodeContains(context, element)) {
            var listeners = cur.listeners;
            fakeEvent.currentTarget = element;

            for (var _i3 = 0; _i3 < listeners.length; _i3++) {
              var _ref2;

              _ref2 = listeners[_i3];

              var _ref3 = _ref2,
                  _ref4 = ___slicedToArray_21(_ref3, 2),
                  fn = _ref4[0],
                  _ref4$ = _ref4[1],
                  capture = _ref4$.capture,
                  passive = _ref4$.passive;

              if (capture === options.capture && passive === options.passive) {
                fn(fakeEvent);
              }
            }
          }
        }

        element = _$domUtils_66.parentNode(element);
      }
    }

    function delegateUseCapture(event) {
      return delegateListener.call(this, event, true);
    } // for type inferrence


    return eventsMethods;
  }

  var FakeEvent = /*#__PURE__*/function () {
    function FakeEvent(originalEvent) {
      ___classCallCheck_21(this, FakeEvent);

      ___defineProperty_21(this, "currentTarget", void 0);

      ___defineProperty_21(this, "originalEvent", void 0);

      ___defineProperty_21(this, "type", void 0);

      this.originalEvent = originalEvent; // duplicate the event so that currentTarget can be changed

      (0, _$pointerExtend_74.default)(this, originalEvent);
    }

    ___createClass_21(FakeEvent, [{
      key: "preventOriginalDefault",
      value: function preventOriginalDefault() {
        this.originalEvent.preventDefault();
      }
    }, {
      key: "stopPropagation",
      value: function stopPropagation() {
        this.originalEvent.stopPropagation();
      }
    }, {
      key: "stopImmediatePropagation",
      value: function stopImmediatePropagation() {
        this.originalEvent.stopImmediatePropagation();
      }
    }]);

    return FakeEvent;
  }();

  function __getOptions_21(param) {
    if (!_$is_70.default.object(param)) {
      return {
        capture: !!param,
        passive: false
      };
    }

    var options = (0, _$extend_67.default)({}, param);
    options.capture = !!param.capture;
    options.passive = !!param.passive;
    return options;
  }

  var ___default_21 = {
    id: 'events',
    install: __install_21
  };
  _$events_21.default = ___default_21;
  var _$interactionFinder_23 = {};
  "use strict";

  Object.defineProperty(_$interactionFinder_23, "__esModule", {
    value: true
  });
  _$interactionFinder_23.default = void 0;
  /* removed: var _$domUtils_66 = require("@interactjs/utils/domUtils"); */

  ;
  var finder = {
    methodOrder: ['simulationResume', 'mouseOrPen', 'hasPointer', 'idle'],
    search: function search(details) {
      for (var _i = 0; _i < finder.methodOrder.length; _i++) {
        var _ref;

        _ref = finder.methodOrder[_i];
        var method = _ref;
        var interaction = finder[method](details);

        if (interaction) {
          return interaction;
        }
      }

      return null;
    },
    // try to resume simulation with a new pointer
    simulationResume: function simulationResume(_ref2) {
      var pointerType = _ref2.pointerType,
          eventType = _ref2.eventType,
          eventTarget = _ref2.eventTarget,
          scope = _ref2.scope;

      if (!/down|start/i.test(eventType)) {
        return null;
      }

      for (var _i2 = 0; _i2 < scope.interactions.list.length; _i2++) {
        var _ref3;

        _ref3 = scope.interactions.list[_i2];
        var interaction = _ref3;
        var element = eventTarget;

        if (interaction.simulation && interaction.simulation.allowResume && interaction.pointerType === pointerType) {
          while (element) {
            // if the element is the interaction element
            if (element === interaction.element) {
              return interaction;
            }

            element = _$domUtils_66.parentNode(element);
          }
        }
      }

      return null;
    },
    // if it's a mouse or pen interaction
    mouseOrPen: function mouseOrPen(_ref4) {
      var pointerId = _ref4.pointerId,
          pointerType = _ref4.pointerType,
          eventType = _ref4.eventType,
          scope = _ref4.scope;

      if (pointerType !== 'mouse' && pointerType !== 'pen') {
        return null;
      }

      var firstNonActive;

      for (var _i3 = 0; _i3 < scope.interactions.list.length; _i3++) {
        var _ref5;

        _ref5 = scope.interactions.list[_i3];
        var interaction = _ref5;

        if (interaction.pointerType === pointerType) {
          // if it's a down event, skip interactions with running simulations
          if (interaction.simulation && !hasPointerId(interaction, pointerId)) {
            continue;
          } // if the interaction is active, return it immediately


          if (interaction.interacting()) {
            return interaction;
          } // otherwise save it and look for another active interaction
          else if (!firstNonActive) {
            firstNonActive = interaction;
          }
        }
      } // if no active mouse interaction was found use the first inactive mouse
      // interaction


      if (firstNonActive) {
        return firstNonActive;
      } // find any mouse or pen interaction.
      // ignore the interaction if the eventType is a *down, and a simulation
      // is active


      for (var _i4 = 0; _i4 < scope.interactions.list.length; _i4++) {
        var _ref6;

        _ref6 = scope.interactions.list[_i4];
        var _interaction = _ref6;

        if (_interaction.pointerType === pointerType && !(/down/i.test(eventType) && _interaction.simulation)) {
          return _interaction;
        }
      }

      return null;
    },
    // get interaction that has this pointer
    hasPointer: function hasPointer(_ref7) {
      var pointerId = _ref7.pointerId,
          scope = _ref7.scope;

      for (var _i5 = 0; _i5 < scope.interactions.list.length; _i5++) {
        var _ref8;

        _ref8 = scope.interactions.list[_i5];
        var interaction = _ref8;

        if (hasPointerId(interaction, pointerId)) {
          return interaction;
        }
      }

      return null;
    },
    // get first idle interaction with a matching pointerType
    idle: function idle(_ref9) {
      var pointerType = _ref9.pointerType,
          scope = _ref9.scope;

      for (var _i6 = 0; _i6 < scope.interactions.list.length; _i6++) {
        var _ref10;

        _ref10 = scope.interactions.list[_i6];
        var interaction = _ref10; // if there's already a pointer held down

        if (interaction.pointers.length === 1) {
          var target = interaction.interactable; // don't add this pointer if there is a target interactable and it
          // isn't gesturable

          if (target && !(target.options.gesture && target.options.gesture.enabled)) {
            continue;
          }
        } // maximum of 2 pointers per interaction
        else if (interaction.pointers.length >= 2) {
          continue;
        }

        if (!interaction.interacting() && pointerType === interaction.pointerType) {
          return interaction;
        }
      }

      return null;
    }
  };

  function hasPointerId(interaction, pointerId) {
    return interaction.pointers.some(function (_ref11) {
      var id = _ref11.id;
      return id === pointerId;
    });
  }

  var ___default_23 = finder;
  _$interactionFinder_23.default = ___default_23;
  var _$interactions_24 = {};
  "use strict";

  function ___typeof_24(obj) {
    "@babel/helpers - typeof";

    return ___typeof_24 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, ___typeof_24(obj);
  }

  Object.defineProperty(_$interactions_24, "__esModule", {
    value: true
  });
  _$interactions_24.default = void 0;
  /* removed: var _$browser_63 = require("@interactjs/utils/browser"); */

  ;
  /* removed: var _$domObjects_65 = require("@interactjs/utils/domObjects"); */

  ;
  /* removed: var _$domUtils_66 = require("@interactjs/utils/domUtils"); */

  ;
  /* removed: var _$pointerUtils_75 = require("@interactjs/utils/pointerUtils"); */

  ;
  /* removed: var _$Interaction_19 = require("./Interaction"); */

  ;
  /* removed: var _$interactablePreventDefault_22 = require("./interactablePreventDefault"); */

  ;
  /* removed: var _$interactionFinder_23 = require("./interactionFinder"); */

  ;

  function ___slicedToArray_24(arr, i) {
    return ___arrayWithHoles_24(arr) || ___iterableToArrayLimit_24(arr, i) || ___unsupportedIterableToArray_24(arr, i) || ___nonIterableRest_24();
  }

  function ___nonIterableRest_24() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function ___unsupportedIterableToArray_24(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return ___arrayLikeToArray_24(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return ___arrayLikeToArray_24(o, minLen);
  }

  function ___arrayLikeToArray_24(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }

  function ___iterableToArrayLimit_24(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;

    var _s, _e;

    try {
      for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function ___arrayWithHoles_24(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function ___classCallCheck_24(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function ___defineProperties_24(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function ___createClass_24(Constructor, protoProps, staticProps) {
    if (protoProps) ___defineProperties_24(Constructor.prototype, protoProps);
    if (staticProps) ___defineProperties_24(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function ___inherits_24(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    Object.defineProperty(subClass, "prototype", {
      writable: false
    });
    if (superClass) ___setPrototypeOf_24(subClass, superClass);
  }

  function ___setPrototypeOf_24(o, p) {
    ___setPrototypeOf_24 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
    return ___setPrototypeOf_24(o, p);
  }

  function ___createSuper_24(Derived) {
    var hasNativeReflectConstruct = ___isNativeReflectConstruct_24();

    return function _createSuperInternal() {
      var Super = ___getPrototypeOf_24(Derived),
          result;

      if (hasNativeReflectConstruct) {
        var NewTarget = ___getPrototypeOf_24(this).constructor;

        result = Reflect.construct(Super, arguments, NewTarget);
      } else {
        result = Super.apply(this, arguments);
      }

      return ___possibleConstructorReturn_24(this, result);
    };
  }

  function ___possibleConstructorReturn_24(self, call) {
    if (call && (___typeof_24(call) === "object" || typeof call === "function")) {
      return call;
    } else if (call !== void 0) {
      throw new TypeError("Derived constructors may only return object or undefined");
    }

    return ___assertThisInitialized_24(self);
  }

  function ___assertThisInitialized_24(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function ___isNativeReflectConstruct_24() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function ___getPrototypeOf_24(o) {
    ___getPrototypeOf_24 = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return ___getPrototypeOf_24(o);
  }

  var methodNames = ['pointerDown', 'pointerMove', 'pointerUp', 'updatePointer', 'removePointer', 'windowBlur'];

  function __install_24(scope) {
    var listeners = {};

    for (var _i = 0; _i < methodNames.length; _i++) {
      var _ref;

      _ref = methodNames[_i];
      var method = _ref;
      listeners[method] = doOnInteractions(method, scope);
    }

    var pEventTypes = _$browser_63.default.pEventTypes;
    var docEvents;

    if (_$domObjects_65.default.PointerEvent) {
      docEvents = [{
        type: pEventTypes.down,
        listener: releasePointersOnRemovedEls
      }, {
        type: pEventTypes.down,
        listener: listeners.pointerDown
      }, {
        type: pEventTypes.move,
        listener: listeners.pointerMove
      }, {
        type: pEventTypes.up,
        listener: listeners.pointerUp
      }, {
        type: pEventTypes.cancel,
        listener: listeners.pointerUp
      }];
    } else {
      docEvents = [{
        type: 'mousedown',
        listener: listeners.pointerDown
      }, {
        type: 'mousemove',
        listener: listeners.pointerMove
      }, {
        type: 'mouseup',
        listener: listeners.pointerUp
      }, {
        type: 'touchstart',
        listener: releasePointersOnRemovedEls
      }, {
        type: 'touchstart',
        listener: listeners.pointerDown
      }, {
        type: 'touchmove',
        listener: listeners.pointerMove
      }, {
        type: 'touchend',
        listener: listeners.pointerUp
      }, {
        type: 'touchcancel',
        listener: listeners.pointerUp
      }];
    }

    docEvents.push({
      type: 'blur',
      listener: function listener(event) {
        for (var _i2 = 0; _i2 < scope.interactions.list.length; _i2++) {
          var _ref2;

          _ref2 = scope.interactions.list[_i2];
          var interaction = _ref2;
          interaction.documentBlur(event);
        }
      }
    }); // for ignoring browser's simulated mouse events

    scope.prevTouchTime = 0;

    scope.Interaction = /*#__PURE__*/function (_InteractionBase) {
      ___inherits_24(_class, _InteractionBase);

      var _super = ___createSuper_24(_class);

      function _class() {
        ___classCallCheck_24(this, _class);

        return _super.apply(this, arguments);
      }

      ___createClass_24(_class, [{
        key: "pointerMoveTolerance",
        get: function get() {
          return scope.interactions.pointerMoveTolerance;
        },
        set: function set(value) {
          scope.interactions.pointerMoveTolerance = value;
        }
      }, {
        key: "_now",
        value: function _now() {
          return scope.now();
        }
      }]);

      return _class;
    }(_$Interaction_19.default);

    scope.interactions = {
      // all active and idle interactions
      list: [],
      new: function _new(options) {
        options.scopeFire = function (name, arg) {
          return scope.fire(name, arg);
        };

        var interaction = new scope.Interaction(options);
        scope.interactions.list.push(interaction);
        return interaction;
      },
      listeners: listeners,
      docEvents: docEvents,
      pointerMoveTolerance: 1
    };

    function releasePointersOnRemovedEls() {
      // for all inactive touch interactions with pointers down
      for (var _i3 = 0; _i3 < scope.interactions.list.length; _i3++) {
        var _ref3;

        _ref3 = scope.interactions.list[_i3];
        var interaction = _ref3;

        if (!interaction.pointerIsDown || interaction.pointerType !== 'touch' || interaction._interacting) {
          continue;
        } // if a pointer is down on an element that is no longer in the DOM tree


        var _loop = function _loop() {
          _ref4 = interaction.pointers[_i4];
          var pointer = _ref4;

          if (!scope.documents.some(function (_ref5) {
            var doc = _ref5.doc;
            return (0, _$domUtils_66.nodeContains)(doc, pointer.downTarget);
          })) {
            // remove the pointer from the interaction
            interaction.removePointer(pointer.pointer, pointer.event);
          }
        };

        for (var _i4 = 0; _i4 < interaction.pointers.length; _i4++) {
          var _ref4;

          _loop();
        }
      }
    }

    scope.usePlugin(_$interactablePreventDefault_22.default);
  }

  function doOnInteractions(method, scope) {
    return function (event) {
      var interactions = scope.interactions.list;

      var pointerType = _$pointerUtils_75.getPointerType(event);

      var _pointerUtils$getEven = _$pointerUtils_75.getEventTargets(event),
          _pointerUtils$getEven2 = ___slicedToArray_24(_pointerUtils$getEven, 2),
          eventTarget = _pointerUtils$getEven2[0],
          curEventTarget = _pointerUtils$getEven2[1];

      var matches = []; // [ [pointer, interaction], ...]

      if (/^touch/.test(event.type)) {
        scope.prevTouchTime = scope.now(); // @ts-expect-error

        for (var _i5 = 0; _i5 < event.changedTouches.length; _i5++) {
          var _ref6;

          _ref6 = event.changedTouches[_i5];
          var changedTouch = _ref6;
          var pointer = changedTouch;

          var pointerId = _$pointerUtils_75.getPointerId(pointer);

          var searchDetails = {
            pointer: pointer,
            pointerId: pointerId,
            pointerType: pointerType,
            eventType: event.type,
            eventTarget: eventTarget,
            curEventTarget: curEventTarget,
            scope: scope
          };
          var interaction = getInteraction(searchDetails);
          matches.push([searchDetails.pointer, searchDetails.eventTarget, searchDetails.curEventTarget, interaction]);
        }
      } else {
        var invalidPointer = false;

        if (!_$browser_63.default.supportsPointerEvent && /mouse/.test(event.type)) {
          // ignore mouse events while touch interactions are active
          for (var i = 0; i < interactions.length && !invalidPointer; i++) {
            invalidPointer = interactions[i].pointerType !== 'mouse' && interactions[i].pointerIsDown;
          } // try to ignore mouse events that are simulated by the browser
          // after a touch event


          invalidPointer = invalidPointer || scope.now() - scope.prevTouchTime < 500 || // on iOS and Firefox Mobile, MouseEvent.timeStamp is zero if simulated
          event.timeStamp === 0;
        }

        if (!invalidPointer) {
          var _searchDetails = {
            pointer: event,
            pointerId: _$pointerUtils_75.getPointerId(event),
            pointerType: pointerType,
            eventType: event.type,
            curEventTarget: curEventTarget,
            eventTarget: eventTarget,
            scope: scope
          };

          var _interaction = getInteraction(_searchDetails);

          matches.push([_searchDetails.pointer, _searchDetails.eventTarget, _searchDetails.curEventTarget, _interaction]);
        }
      } // eslint-disable-next-line no-shadow


      for (var _i6 = 0; _i6 < matches.length; _i6++) {
        var _matches$_i = ___slicedToArray_24(matches[_i6], 4),
            _pointer = _matches$_i[0],
            _eventTarget = _matches$_i[1],
            _curEventTarget = _matches$_i[2],
            _interaction2 = _matches$_i[3];

        _interaction2[method](_pointer, event, _eventTarget, _curEventTarget);
      }
    };
  }

  function getInteraction(searchDetails) {
    var pointerType = searchDetails.pointerType,
        scope = searchDetails.scope;

    var foundInteraction = _$interactionFinder_23.default.search(searchDetails);

    var signalArg = {
      interaction: foundInteraction,
      searchDetails: searchDetails
    };
    scope.fire('interactions:find', signalArg);
    return signalArg.interaction || scope.interactions.new({
      pointerType: pointerType
    });
  }

  function onDocSignal(_ref7, eventMethodName) {
    var doc = _ref7.doc,
        scope = _ref7.scope,
        options = _ref7.options;
    var docEvents = scope.interactions.docEvents,
        events = scope.events;
    var eventMethod = events[eventMethodName];

    if (scope.browser.isIOS && !options.events) {
      options.events = {
        passive: false
      };
    } // delegate event listener


    for (var eventType in events.delegatedEvents) {
      eventMethod(doc, eventType, events.delegateListener);
      eventMethod(doc, eventType, events.delegateUseCapture, true);
    }

    var eventOptions = options && options.events;

    for (var _i7 = 0; _i7 < docEvents.length; _i7++) {
      var _ref8;

      _ref8 = docEvents[_i7];
      var _ref9 = _ref8,
          _type = _ref9.type,
          listener = _ref9.listener;
      eventMethod(doc, _type, listener, eventOptions);
    }
  }

  var interactions = {
    id: 'core/interactions',
    install: __install_24,
    listeners: {
      'scope:add-document': function scopeAddDocument(arg) {
        return onDocSignal(arg, 'add');
      },
      'scope:remove-document': function scopeRemoveDocument(arg) {
        return onDocSignal(arg, 'remove');
      },
      'interactable:unset': function interactableUnset(_ref10, scope) {
        var interactable = _ref10.interactable; // Stop and destroy related interactions when an Interactable is unset

        for (var i = scope.interactions.list.length - 1; i >= 0; i--) {
          var interaction = scope.interactions.list[i];

          if (interaction.interactable !== interactable) {
            continue;
          }

          interaction.stop();
          scope.fire('interactions:destroy', {
            interaction: interaction
          });
          interaction.destroy();

          if (scope.interactions.list.length > 2) {
            scope.interactions.list.splice(i, 1);
          }
        }
      }
    },
    onDocSignal: onDocSignal,
    doOnInteractions: doOnInteractions,
    methodNames: methodNames
  };
  var ___default_24 = interactions;
  _$interactions_24.default = ___default_24;
  var _$scope_27 = {};
  "use strict";

  function ___typeof_27(obj) {
    "@babel/helpers - typeof";

    return ___typeof_27 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, ___typeof_27(obj);
  }

  Object.defineProperty(_$scope_27, "__esModule", {
    value: true
  });
  _$scope_27.Scope = void 0;
  _$scope_27.initScope = initScope;
  /* removed: var _$browser_63 = require("@interactjs/utils/browser"); */

  ;
  /* removed: var _$clone_64 = require("@interactjs/utils/clone"); */

  ;
  /* removed: var _$domObjects_65 = require("@interactjs/utils/domObjects"); */

  ;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$raf_76 = require("@interactjs/utils/raf"); */

  ;
  /* removed: var _$window_78 = require("@interactjs/utils/window"); */

  ;
  /* removed: var _$Eventable_14 = require("./Eventable"); */

  ;
  /* removed: var _$InteractEvent_15 = require("./InteractEvent"); */

  ;
  /* removed: var _$InteractStatic_16 = require("./InteractStatic"); */

  ;
  /* removed: var _$Interactable_17 = require("./Interactable"); */

  ;
  /* removed: var _$InteractableSet_18 = require("./InteractableSet"); */

  ;
  /* removed: var _$events_21 = require("./events"); */

  ;
  /* removed: var _$interactions_24 = require("./interactions"); */

  ;
  /* removed: var _$options_26 = require("./options"); */

  ;

  function _get() {
    if (typeof Reflect !== "undefined" && Reflect.get) {
      _get = Reflect.get.bind();
    } else {
      _get = function _get(target, property, receiver) {
        var base = _superPropBase(target, property);

        if (!base) return;
        var desc = Object.getOwnPropertyDescriptor(base, property);

        if (desc.get) {
          return desc.get.call(arguments.length < 3 ? target : receiver);
        }

        return desc.value;
      };
    }

    return _get.apply(this, arguments);
  }

  function _superPropBase(object, property) {
    while (!Object.prototype.hasOwnProperty.call(object, property)) {
      object = ___getPrototypeOf_27(object);
      if (object === null) break;
    }

    return object;
  }

  function ___inherits_27(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    Object.defineProperty(subClass, "prototype", {
      writable: false
    });
    if (superClass) ___setPrototypeOf_27(subClass, superClass);
  }

  function ___setPrototypeOf_27(o, p) {
    ___setPrototypeOf_27 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
    return ___setPrototypeOf_27(o, p);
  }

  function ___createSuper_27(Derived) {
    var hasNativeReflectConstruct = ___isNativeReflectConstruct_27();

    return function _createSuperInternal() {
      var Super = ___getPrototypeOf_27(Derived),
          result;

      if (hasNativeReflectConstruct) {
        var NewTarget = ___getPrototypeOf_27(this).constructor;

        result = Reflect.construct(Super, arguments, NewTarget);
      } else {
        result = Super.apply(this, arguments);
      }

      return ___possibleConstructorReturn_27(this, result);
    };
  }

  function ___possibleConstructorReturn_27(self, call) {
    if (call && (___typeof_27(call) === "object" || typeof call === "function")) {
      return call;
    } else if (call !== void 0) {
      throw new TypeError("Derived constructors may only return object or undefined");
    }

    return ___assertThisInitialized_27(self);
  }

  function ___assertThisInitialized_27(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function ___isNativeReflectConstruct_27() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function ___getPrototypeOf_27(o) {
    ___getPrototypeOf_27 = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return ___getPrototypeOf_27(o);
  }

  function ___classCallCheck_27(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function ___defineProperties_27(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function ___createClass_27(Constructor, protoProps, staticProps) {
    if (protoProps) ___defineProperties_27(Constructor.prototype, protoProps);
    if (staticProps) ___defineProperties_27(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function ___defineProperty_27(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var Scope = /*#__PURE__*/function () {
    // main window
    // main document
    // main window
    // all documents being listened to
    function Scope() {
      var _this = this;

      ___classCallCheck_27(this, Scope);

      ___defineProperty_27(this, "id", "__interact_scope_".concat(Math.floor(Math.random() * 100)));

      ___defineProperty_27(this, "isInitialized", false);

      ___defineProperty_27(this, "listenerMaps", []);

      ___defineProperty_27(this, "browser", _$browser_63.default);

      ___defineProperty_27(this, "defaults", (0, _$clone_64.default)(_$options_26.defaults));

      ___defineProperty_27(this, "Eventable", _$Eventable_14.Eventable);

      ___defineProperty_27(this, "actions", {
        map: {},
        phases: {
          start: true,
          move: true,
          end: true
        },
        methodDict: {},
        phaselessTypes: {}
      });

      ___defineProperty_27(this, "interactStatic", (0, _$InteractStatic_16.createInteractStatic)(this));

      ___defineProperty_27(this, "InteractEvent", _$InteractEvent_15.InteractEvent);

      ___defineProperty_27(this, "Interactable", void 0);

      ___defineProperty_27(this, "interactables", new _$InteractableSet_18.InteractableSet(this));

      ___defineProperty_27(this, "_win", void 0);

      ___defineProperty_27(this, "document", void 0);

      ___defineProperty_27(this, "window", void 0);

      ___defineProperty_27(this, "documents", []);

      ___defineProperty_27(this, "_plugins", {
        list: [],
        map: {}
      });

      ___defineProperty_27(this, "onWindowUnload", function (event) {
        return _this.removeDocument(event.target);
      });

      var scope = this;

      this.Interactable = /*#__PURE__*/function (_InteractableBase) {
        ___inherits_27(_class, _InteractableBase);

        var _super = ___createSuper_27(_class);

        function _class() {
          ___classCallCheck_27(this, _class);

          return _super.apply(this, arguments);
        }

        ___createClass_27(_class, [{
          key: "_defaults",
          get: function get() {
            return scope.defaults;
          }
        }, {
          key: "set",
          value: function set(options) {
            _get(___getPrototypeOf_27(_class.prototype), "set", this).call(this, options);

            scope.fire('interactable:set', {
              options: options,
              interactable: this
            });
            return this;
          }
        }, {
          key: "unset",
          value: function unset() {
            _get(___getPrototypeOf_27(_class.prototype), "unset", this).call(this);

            var index = scope.interactables.list.indexOf(this);
            if (index < 0) return;

            _get(___getPrototypeOf_27(_class.prototype), "unset", this).call(this);

            scope.interactables.list.splice(index, 1);
            scope.fire('interactable:unset', {
              interactable: this
            });
          }
        }]);

        return _class;
      }(_$Interactable_17.Interactable);
    }

    ___createClass_27(Scope, [{
      key: "addListeners",
      value: function addListeners(map, id) {
        this.listenerMaps.push({
          id: id,
          map: map
        });
      }
    }, {
      key: "fire",
      value: function fire(name, arg) {
        for (var _i = 0; _i < this.listenerMaps.length; _i++) {
          var _ref;

          _ref = this.listenerMaps[_i];
          var _ref2 = _ref,
              listener = _ref2.map[name];

          if (!!listener && listener(arg, this, name) === false) {
            return false;
          }
        }
      }
    }, {
      key: "init",
      value: function init(window) {
        return this.isInitialized ? this : initScope(this, window);
      }
    }, {
      key: "pluginIsInstalled",
      value: function pluginIsInstalled(plugin) {
        return this._plugins.map[plugin.id] || this._plugins.list.indexOf(plugin) !== -1;
      }
    }, {
      key: "usePlugin",
      value: function usePlugin(plugin, options) {
        if (!this.isInitialized) {
          return this;
        }

        if (this.pluginIsInstalled(plugin)) {
          return this;
        }

        if (plugin.id) {
          this._plugins.map[plugin.id] = plugin;
        }

        this._plugins.list.push(plugin);

        if (plugin.install) {
          plugin.install(this, options);
        }

        if (plugin.listeners && plugin.before) {
          var index = 0;
          var len = this.listenerMaps.length;
          var before = plugin.before.reduce(function (acc, id) {
            acc[id] = true;
            acc[pluginIdRoot(id)] = true;
            return acc;
          }, {});

          for (; index < len; index++) {
            var otherId = this.listenerMaps[index].id;

            if (before[otherId] || before[pluginIdRoot(otherId)]) {
              break;
            }
          }

          this.listenerMaps.splice(index, 0, {
            id: plugin.id,
            map: plugin.listeners
          });
        } else if (plugin.listeners) {
          this.listenerMaps.push({
            id: plugin.id,
            map: plugin.listeners
          });
        }

        return this;
      }
    }, {
      key: "addDocument",
      value: function addDocument(doc, options) {
        // do nothing if document is already known
        if (this.getDocIndex(doc) !== -1) {
          return false;
        }

        var window = _$window_78.getWindow(doc);

        options = options ? (0, _$extend_67.default)({}, options) : {};
        this.documents.push({
          doc: doc,
          options: options
        });
        this.events.documents.push(doc); // don't add an unload event for the main document
        // so that the page may be cached in browser history

        if (doc !== this.document) {
          this.events.add(window, 'unload', this.onWindowUnload);
        }

        this.fire('scope:add-document', {
          doc: doc,
          window: window,
          scope: this,
          options: options
        });
      }
    }, {
      key: "removeDocument",
      value: function removeDocument(doc) {
        var index = this.getDocIndex(doc);

        var window = _$window_78.getWindow(doc);

        var options = this.documents[index].options;
        this.events.remove(window, 'unload', this.onWindowUnload);
        this.documents.splice(index, 1);
        this.events.documents.splice(index, 1);
        this.fire('scope:remove-document', {
          doc: doc,
          window: window,
          scope: this,
          options: options
        });
      }
    }, {
      key: "getDocIndex",
      value: function getDocIndex(doc) {
        for (var i = 0; i < this.documents.length; i++) {
          if (this.documents[i].doc === doc) {
            return i;
          }
        }

        return -1;
      }
    }, {
      key: "getDocOptions",
      value: function getDocOptions(doc) {
        var docIndex = this.getDocIndex(doc);
        return docIndex === -1 ? null : this.documents[docIndex].options;
      }
    }, {
      key: "now",
      value: function now() {
        return (this.window.Date || Date).now();
      }
    }]);

    return Scope;
  }();

  _$scope_27.Scope = Scope;

  function initScope(scope, window) {
    scope.isInitialized = true;

    if (_$is_70.default.window(window)) {
      _$window_78.init(window);
    }

    _$domObjects_65.default.init(window);

    _$browser_63.default.init(window);

    _$raf_76.default.init(window); // @ts-expect-error


    scope.window = window;
    scope.document = window.document;
    scope.usePlugin(_$interactions_24.default);
    scope.usePlugin(_$events_21.default);
    return scope;
  }

  function pluginIdRoot(id) {
    return id && id.replace(/\/.*$/, '');
  }

  var _$index_31 = {};
  "use strict";

  Object.defineProperty(_$index_31, "__esModule", {
    value: true
  });
  _$index_31.default = void 0;
  /* removed: var _$scope_27 = require("@interactjs/core/scope"); */

  ;
  var scope = new _$scope_27.Scope();
  var interact = scope.interactStatic;
  var ___default_31 = interact;
  _$index_31.default = ___default_31;

  var _global = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : void 0;

  scope.init(_global);
  var _$edgeTarget_58 = {};
  "use strict";

  Object.defineProperty(_$edgeTarget_58, "__esModule", {
    value: true
  });
  _$edgeTarget_58.default = void 0;

  var ___default_58 = function _default() {};

  _$edgeTarget_58.default = ___default_58;
  var _$elements_59 = {};
  "use strict";

  Object.defineProperty(_$elements_59, "__esModule", {
    value: true
  });
  _$elements_59.default = void 0;

  var ___default_59 = function _default() {};

  _$elements_59.default = ___default_59;
  var _$grid_60 = {};
  "use strict";

  Object.defineProperty(_$grid_60, "__esModule", {
    value: true
  });
  _$grid_60.default = void 0;

  function ___slicedToArray_60(arr, i) {
    return ___arrayWithHoles_60(arr) || ___iterableToArrayLimit_60(arr, i) || ___unsupportedIterableToArray_60(arr, i) || ___nonIterableRest_60();
  }

  function ___nonIterableRest_60() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function ___unsupportedIterableToArray_60(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return ___arrayLikeToArray_60(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return ___arrayLikeToArray_60(o, minLen);
  }

  function ___arrayLikeToArray_60(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }

  function ___iterableToArrayLimit_60(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;

    var _s, _e;

    try {
      for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function ___arrayWithHoles_60(arr) {
    if (Array.isArray(arr)) return arr;
  }

  var ___default_60 = function _default(grid) {
    var coordFields = [['x', 'y'], ['left', 'top'], ['right', 'bottom'], ['width', 'height']].filter(function (_ref) {
      var _ref2 = ___slicedToArray_60(_ref, 2),
          xField = _ref2[0],
          yField = _ref2[1];

      return xField in grid || yField in grid;
    });

    var gridFunc = function gridFunc(x, y) {
      var range = grid.range,
          _grid$limits = grid.limits,
          limits = _grid$limits === void 0 ? {
        left: -Infinity,
        right: Infinity,
        top: -Infinity,
        bottom: Infinity
      } : _grid$limits,
          _grid$offset = grid.offset,
          offset = _grid$offset === void 0 ? {
        x: 0,
        y: 0
      } : _grid$offset;
      var result = {
        range: range,
        grid: grid,
        x: null,
        y: null
      };

      for (var _i2 = 0; _i2 < coordFields.length; _i2++) {
        var _ref3;

        _ref3 = coordFields[_i2];

        var _ref4 = _ref3,
            _ref5 = ___slicedToArray_60(_ref4, 2),
            xField = _ref5[0],
            yField = _ref5[1];

        var gridx = Math.round((x - offset.x) / grid[xField]);
        var gridy = Math.round((y - offset.y) / grid[yField]);
        result[xField] = Math.max(limits.left, Math.min(limits.right, gridx * grid[xField] + offset.x));
        result[yField] = Math.max(limits.top, Math.min(limits.bottom, gridy * grid[yField] + offset.y));
      }

      return result;
    };

    gridFunc.grid = grid;
    gridFunc.coordFields = coordFields;
    return gridFunc;
  };

  _$grid_60.default = ___default_60;
  var _$all_57 = {};
  "use strict";

  Object.defineProperty(_$all_57, "__esModule", {
    value: true
  });
  Object.defineProperty(_$all_57, "edgeTarget", {
    enumerable: true,
    get: function get() {
      return _$edgeTarget_58.default;
    }
  });
  Object.defineProperty(_$all_57, "elements", {
    enumerable: true,
    get: function get() {
      return _$elements_59.default;
    }
  });
  Object.defineProperty(_$all_57, "grid", {
    enumerable: true,
    get: function get() {
      return _$grid_60.default;
    }
  });
  /* removed: var _$edgeTarget_58 = require("./edgeTarget"); */

  ;
  /* removed: var _$elements_59 = require("./elements"); */

  ;
  /* removed: var _$grid_60 = require("./grid"); */

  ;
  var _$plugin_61 = {};
  "use strict";

  Object.defineProperty(_$plugin_61, "__esModule", {
    value: true
  });
  _$plugin_61.default = void 0;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$all_57 = require("./all"); */

  ;
  var snappersPlugin = {
    id: 'snappers',
    install: function install(scope) {
      var interact = scope.interactStatic;
      interact.snappers = (0, _$extend_67.default)(interact.snappers || {}, _$all_57);
      interact.createSnapGrid = interact.snappers.grid;
    }
  };
  var ___default_61 = snappersPlugin;
  _$plugin_61.default = ___default_61;
  var _$aspectRatio_35 = {};
  "use strict";

  Object.defineProperty(_$aspectRatio_35, "__esModule", {
    value: true
  });
  _$aspectRatio_35.default = _$aspectRatio_35.aspectRatio = void 0;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$rect_77 = require("@interactjs/utils/rect"); */

  ;
  /* removed: var _$Modification_33 = require("./Modification"); */

  ;
  /* removed: var _$base_37 = require("./base"); */

  ;

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      enumerableOnly && (symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      })), keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = null != arguments[i] ? arguments[i] : {};
      i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
        ___defineProperty_35(target, key, source[key]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }

    return target;
  }

  function ___defineProperty_35(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var aspectRatio = {
    start: function start(arg) {
      var state = arg.state,
          rect = arg.rect,
          originalEdges = arg.edges,
          coords = arg.pageCoords;
      var ratio = state.options.ratio;
      var _state$options = state.options,
          equalDelta = _state$options.equalDelta,
          modifiers = _state$options.modifiers;

      if (ratio === 'preserve') {
        ratio = rect.width / rect.height;
      }

      state.startCoords = (0, _$extend_67.default)({}, coords);
      state.startRect = (0, _$extend_67.default)({}, rect);
      state.ratio = ratio;
      state.equalDelta = equalDelta;
      var linkedEdges = state.linkedEdges = {
        top: originalEdges.top || originalEdges.left && !originalEdges.bottom,
        left: originalEdges.left || originalEdges.top && !originalEdges.right,
        bottom: originalEdges.bottom || originalEdges.right && !originalEdges.top,
        right: originalEdges.right || originalEdges.bottom && !originalEdges.left
      };
      state.xIsPrimaryAxis = !!(originalEdges.left || originalEdges.right);

      if (state.equalDelta) {
        var sign = (linkedEdges.left ? 1 : -1) * (linkedEdges.top ? 1 : -1);
        state.edgeSign = {
          x: sign,
          y: sign
        };
      } else {
        state.edgeSign = {
          x: linkedEdges.left ? -1 : 1,
          y: linkedEdges.top ? -1 : 1
        };
      }

      (0, _$extend_67.default)(arg.edges, linkedEdges);
      if (!modifiers || !modifiers.length) return;
      var subModification = new _$Modification_33.default(arg.interaction);
      subModification.copyFrom(arg.interaction.modification);
      subModification.prepareStates(modifiers);
      state.subModification = subModification;
      subModification.startAll(_objectSpread({}, arg));
    },
    set: function set(arg) {
      var state = arg.state,
          rect = arg.rect,
          coords = arg.coords;
      var initialCoords = (0, _$extend_67.default)({}, coords);
      var aspectMethod = state.equalDelta ? setEqualDelta : setRatio;
      aspectMethod(state, state.xIsPrimaryAxis, coords, rect);

      if (!state.subModification) {
        return null;
      }

      var correctedRect = (0, _$extend_67.default)({}, rect);
      (0, _$rect_77.addEdges)(state.linkedEdges, correctedRect, {
        x: coords.x - initialCoords.x,
        y: coords.y - initialCoords.y
      });
      var result = state.subModification.setAll(_objectSpread(_objectSpread({}, arg), {}, {
        rect: correctedRect,
        edges: state.linkedEdges,
        pageCoords: coords,
        prevCoords: coords,
        prevRect: correctedRect
      }));
      var delta = result.delta;

      if (result.changed) {
        var xIsCriticalAxis = Math.abs(delta.x) > Math.abs(delta.y); // do aspect modification again with critical edge axis as primary

        aspectMethod(state, xIsCriticalAxis, result.coords, result.rect);
        (0, _$extend_67.default)(coords, result.coords);
      }

      return result.eventProps;
    },
    defaults: {
      ratio: 'preserve',
      equalDelta: false,
      modifiers: [],
      enabled: false
    }
  };
  _$aspectRatio_35.aspectRatio = aspectRatio;

  function setEqualDelta(_ref, xIsPrimaryAxis, coords) {
    var startCoords = _ref.startCoords,
        edgeSign = _ref.edgeSign;

    if (xIsPrimaryAxis) {
      coords.y = startCoords.y + (coords.x - startCoords.x) * edgeSign.y;
    } else {
      coords.x = startCoords.x + (coords.y - startCoords.y) * edgeSign.x;
    }
  }

  function setRatio(_ref2, xIsPrimaryAxis, coords, rect) {
    var startRect = _ref2.startRect,
        startCoords = _ref2.startCoords,
        ratio = _ref2.ratio,
        edgeSign = _ref2.edgeSign;

    if (xIsPrimaryAxis) {
      var newHeight = rect.width / ratio;
      coords.y = startCoords.y + (newHeight - startRect.height) * edgeSign.y;
    } else {
      var newWidth = rect.height * ratio;
      coords.x = startCoords.x + (newWidth - startRect.width) * edgeSign.x;
    }
  }

  var ___default_35 = (0, _$base_37.makeModifier)(aspectRatio, 'aspectRatio');

  _$aspectRatio_35.default = ___default_35;
  var _$noop_38 = {};
  "use strict";

  Object.defineProperty(_$noop_38, "__esModule", {
    value: true
  });
  _$noop_38.default = void 0;

  var noop = function noop() {};

  noop._defaults = {};
  var ___default_38 = noop;
  _$noop_38.default = ___default_38;
  var _$avoid_36 = {};
  "use strict";

  Object.defineProperty(_$avoid_36, "__esModule", {
    value: true
  });
  Object.defineProperty(_$avoid_36, "default", {
    enumerable: true,
    get: function get() {
      return _$noop_38.default;
    }
  });
  /* removed: var _$noop_38 = require("../noop"); */

  ;
  var _$pointer_41 = {};
  "use strict";

  Object.defineProperty(_$pointer_41, "__esModule", {
    value: true
  });
  _$pointer_41.default = void 0;
  _$pointer_41.getRestrictionRect = getRestrictionRect;
  _$pointer_41.restrict = void 0;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$rect_77 = require("@interactjs/utils/rect"); */

  ;
  /* removed: var _$base_37 = require("../base"); */

  ;

  function __start_41(_ref) {
    var rect = _ref.rect,
        startOffset = _ref.startOffset,
        state = _ref.state,
        interaction = _ref.interaction,
        pageCoords = _ref.pageCoords;
    var options = state.options;
    var elementRect = options.elementRect;
    var offset = (0, _$extend_67.default)({
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    }, options.offset || {});

    if (rect && elementRect) {
      var restriction = getRestrictionRect(options.restriction, interaction, pageCoords);

      if (restriction) {
        var widthDiff = restriction.right - restriction.left - rect.width;
        var heightDiff = restriction.bottom - restriction.top - rect.height;

        if (widthDiff < 0) {
          offset.left += widthDiff;
          offset.right += widthDiff;
        }

        if (heightDiff < 0) {
          offset.top += heightDiff;
          offset.bottom += heightDiff;
        }
      }

      offset.left += startOffset.left - rect.width * elementRect.left;
      offset.top += startOffset.top - rect.height * elementRect.top;
      offset.right += startOffset.right - rect.width * (1 - elementRect.right);
      offset.bottom += startOffset.bottom - rect.height * (1 - elementRect.bottom);
    }

    state.offset = offset;
  }

  function set(_ref2) {
    var coords = _ref2.coords,
        interaction = _ref2.interaction,
        state = _ref2.state;
    var options = state.options,
        offset = state.offset;
    var restriction = getRestrictionRect(options.restriction, interaction, coords);
    if (!restriction) return;

    var rect = _$rect_77.xywhToTlbr(restriction);

    coords.x = Math.max(Math.min(rect.right - offset.right, coords.x), rect.left + offset.left);
    coords.y = Math.max(Math.min(rect.bottom - offset.bottom, coords.y), rect.top + offset.top);
  }

  function getRestrictionRect(value, interaction, coords) {
    if (_$is_70.default.func(value)) {
      return _$rect_77.resolveRectLike(value, interaction.interactable, interaction.element, [coords.x, coords.y, interaction]);
    } else {
      return _$rect_77.resolveRectLike(value, interaction.interactable, interaction.element);
    }
  }

  var __defaults_41 = {
    restriction: null,
    elementRect: null,
    offset: null,
    endOnly: false,
    enabled: false
  };
  var restrict = {
    start: __start_41,
    set: set,
    defaults: __defaults_41
  };
  _$pointer_41.restrict = restrict;

  var ___default_41 = (0, _$base_37.makeModifier)(restrict, 'restrict');

  _$pointer_41.default = ___default_41;
  var _$edges_40 = {};
  "use strict";

  Object.defineProperty(_$edges_40, "__esModule", {
    value: true
  });
  _$edges_40.restrictEdges = _$edges_40.default = void 0;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$rect_77 = require("@interactjs/utils/rect"); */

  ;
  /* removed: var _$base_37 = require("../base"); */

  ;
  /* removed: var _$pointer_41 = require("./pointer"); */

  ; // This module adds the options.resize.restrictEdges setting which sets min and
  // max for the top, left, bottom and right edges of the target being resized.
  //
  // interact(target).resize({
  //   edges: { top: true, left: true },
  //   restrictEdges: {
  //     inner: { top: 200, left: 200, right: 400, bottom: 400 },
  //     outer: { top:   0, left:   0, right: 600, bottom: 600 },
  //   },
  // })

  var noInner = {
    top: +Infinity,
    left: +Infinity,
    bottom: -Infinity,
    right: -Infinity
  };
  var noOuter = {
    top: -Infinity,
    left: -Infinity,
    bottom: +Infinity,
    right: +Infinity
  };

  function __start_40(_ref) {
    var interaction = _ref.interaction,
        startOffset = _ref.startOffset,
        state = _ref.state;
    var options = state.options;
    var offset;

    if (options) {
      var offsetRect = (0, _$pointer_41.getRestrictionRect)(options.offset, interaction, interaction.coords.start.page);
      offset = _$rect_77.rectToXY(offsetRect);
    }

    offset = offset || {
      x: 0,
      y: 0
    };
    state.offset = {
      top: offset.y + startOffset.top,
      left: offset.x + startOffset.left,
      bottom: offset.y - startOffset.bottom,
      right: offset.x - startOffset.right
    };
  }

  function __set_40(_ref2) {
    var coords = _ref2.coords,
        edges = _ref2.edges,
        interaction = _ref2.interaction,
        state = _ref2.state;
    var offset = state.offset,
        options = state.options;

    if (!edges) {
      return;
    }

    var page = (0, _$extend_67.default)({}, coords);
    var inner = (0, _$pointer_41.getRestrictionRect)(options.inner, interaction, page) || {};
    var outer = (0, _$pointer_41.getRestrictionRect)(options.outer, interaction, page) || {};
    fixRect(inner, noInner);
    fixRect(outer, noOuter);

    if (edges.top) {
      coords.y = Math.min(Math.max(outer.top + offset.top, page.y), inner.top + offset.top);
    } else if (edges.bottom) {
      coords.y = Math.max(Math.min(outer.bottom + offset.bottom, page.y), inner.bottom + offset.bottom);
    }

    if (edges.left) {
      coords.x = Math.min(Math.max(outer.left + offset.left, page.x), inner.left + offset.left);
    } else if (edges.right) {
      coords.x = Math.max(Math.min(outer.right + offset.right, page.x), inner.right + offset.right);
    }
  }

  function fixRect(rect, defaults) {
    var _arr = ['top', 'left', 'bottom', 'right'];

    for (var _i = 0; _i < _arr.length; _i++) {
      var edge = _arr[_i];

      if (!(edge in rect)) {
        rect[edge] = defaults[edge];
      }
    }

    return rect;
  }

  var __defaults_40 = {
    inner: null,
    outer: null,
    offset: null,
    endOnly: false,
    enabled: false
  };
  var restrictEdges = {
    noInner: noInner,
    noOuter: noOuter,
    start: __start_40,
    set: __set_40,
    defaults: __defaults_40
  };
  _$edges_40.restrictEdges = restrictEdges;

  var ___default_40 = (0, _$base_37.makeModifier)(restrictEdges, 'restrictEdges');

  _$edges_40.default = ___default_40;
  var _$rect_42 = {};
  "use strict";

  Object.defineProperty(_$rect_42, "__esModule", {
    value: true
  });
  _$rect_42.restrictRect = _$rect_42.default = void 0;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$base_37 = require("../base"); */

  ;
  /* removed: var _$pointer_41 = require("./pointer"); */

  ;

  var __defaults_42 = (0, _$extend_67.default)({
    get elementRect() {
      return {
        top: 0,
        left: 0,
        bottom: 1,
        right: 1
      };
    },

    set elementRect(_) {}

  }, _$pointer_41.restrict.defaults);

  var restrictRect = {
    start: _$pointer_41.restrict.start,
    set: _$pointer_41.restrict.set,
    defaults: __defaults_42
  };
  _$rect_42.restrictRect = restrictRect;

  var ___default_42 = (0, _$base_37.makeModifier)(restrictRect, 'restrictRect');

  _$rect_42.default = ___default_42;
  var _$size_43 = {};
  "use strict";

  Object.defineProperty(_$size_43, "__esModule", {
    value: true
  });
  _$size_43.restrictSize = _$size_43.default = void 0;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$rect_77 = require("@interactjs/utils/rect"); */

  ;
  /* removed: var _$base_37 = require("../base"); */

  ;
  /* removed: var _$edges_40 = require("./edges"); */

  ;
  /* removed: var _$pointer_41 = require("./pointer"); */

  ;
  var noMin = {
    width: -Infinity,
    height: -Infinity
  };
  var noMax = {
    width: +Infinity,
    height: +Infinity
  };

  function __start_43(arg) {
    return _$edges_40.restrictEdges.start(arg);
  }

  function __set_43(arg) {
    var interaction = arg.interaction,
        state = arg.state,
        rect = arg.rect,
        edges = arg.edges;
    var options = state.options;

    if (!edges) {
      return;
    }

    var minSize = _$rect_77.tlbrToXywh((0, _$pointer_41.getRestrictionRect)(options.min, interaction, arg.coords)) || noMin;
    var maxSize = _$rect_77.tlbrToXywh((0, _$pointer_41.getRestrictionRect)(options.max, interaction, arg.coords)) || noMax;
    state.options = {
      endOnly: options.endOnly,
      inner: (0, _$extend_67.default)({}, _$edges_40.restrictEdges.noInner),
      outer: (0, _$extend_67.default)({}, _$edges_40.restrictEdges.noOuter)
    };

    if (edges.top) {
      state.options.inner.top = rect.bottom - minSize.height;
      state.options.outer.top = rect.bottom - maxSize.height;
    } else if (edges.bottom) {
      state.options.inner.bottom = rect.top + minSize.height;
      state.options.outer.bottom = rect.top + maxSize.height;
    }

    if (edges.left) {
      state.options.inner.left = rect.right - minSize.width;
      state.options.outer.left = rect.right - maxSize.width;
    } else if (edges.right) {
      state.options.inner.right = rect.left + minSize.width;
      state.options.outer.right = rect.left + maxSize.width;
    }

    _$edges_40.restrictEdges.set(arg);

    state.options = options;
  }

  var __defaults_43 = {
    min: null,
    max: null,
    endOnly: false,
    enabled: false
  };
  var restrictSize = {
    start: __start_43,
    set: __set_43,
    defaults: __defaults_43
  };
  _$size_43.restrictSize = restrictSize;

  var ___default_43 = (0, _$base_37.makeModifier)(restrictSize, 'restrictSize');

  _$size_43.default = ___default_43;
  var _$rubberband_44 = {};
  "use strict";

  Object.defineProperty(_$rubberband_44, "__esModule", {
    value: true
  });
  Object.defineProperty(_$rubberband_44, "default", {
    enumerable: true,
    get: function get() {
      return _$noop_38.default;
    }
  });
  /* removed: var _$noop_38 = require("../noop"); */

  ;
  var _$pointer_46 = {};
  "use strict";

  Object.defineProperty(_$pointer_46, "__esModule", {
    value: true
  });
  _$pointer_46.snap = _$pointer_46.default = void 0;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$getOriginXY_68 = require("@interactjs/utils/getOriginXY"); */

  ;
  /* removed: var _$hypot_69 = require("@interactjs/utils/hypot"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$rect_77 = require("@interactjs/utils/rect"); */

  ;
  /* removed: var _$base_37 = require("../base"); */

  ;

  function __start_46(arg) {
    var interaction = arg.interaction,
        interactable = arg.interactable,
        element = arg.element,
        rect = arg.rect,
        state = arg.state,
        startOffset = arg.startOffset;
    var options = state.options;
    var origin = options.offsetWithOrigin ? getOrigin(arg) : {
      x: 0,
      y: 0
    };
    var snapOffset;

    if (options.offset === 'startCoords') {
      snapOffset = {
        x: interaction.coords.start.page.x,
        y: interaction.coords.start.page.y
      };
    } else {
      var offsetRect = (0, _$rect_77.resolveRectLike)(options.offset, interactable, element, [interaction]);
      snapOffset = (0, _$rect_77.rectToXY)(offsetRect) || {
        x: 0,
        y: 0
      };
      snapOffset.x += origin.x;
      snapOffset.y += origin.y;
    }

    var relativePoints = options.relativePoints;
    state.offsets = rect && relativePoints && relativePoints.length ? relativePoints.map(function (relativePoint, index) {
      return {
        index: index,
        relativePoint: relativePoint,
        x: startOffset.left - rect.width * relativePoint.x + snapOffset.x,
        y: startOffset.top - rect.height * relativePoint.y + snapOffset.y
      };
    }) : [{
      index: 0,
      relativePoint: null,
      x: snapOffset.x,
      y: snapOffset.y
    }];
  }

  function __set_46(arg) {
    var interaction = arg.interaction,
        coords = arg.coords,
        state = arg.state;
    var options = state.options,
        offsets = state.offsets;
    var origin = (0, _$getOriginXY_68.default)(interaction.interactable, interaction.element, interaction.prepared.name);
    var page = (0, _$extend_67.default)({}, coords);
    var targets = [];

    if (!options.offsetWithOrigin) {
      page.x -= origin.x;
      page.y -= origin.y;
    }

    for (var _i = 0; _i < offsets.length; _i++) {
      var _ref;

      _ref = offsets[_i];
      var _offset = _ref;
      var relativeX = page.x - _offset.x;
      var relativeY = page.y - _offset.y;

      for (var _index = 0, len = options.targets.length; _index < len; _index++) {
        var snapTarget = options.targets[_index];
        var target = void 0;

        if (_$is_70.default.func(snapTarget)) {
          target = snapTarget(relativeX, relativeY, interaction._proxy, _offset, _index);
        } else {
          target = snapTarget;
        }

        if (!target) {
          continue;
        }

        targets.push({
          x: (_$is_70.default.number(target.x) ? target.x : relativeX) + _offset.x,
          y: (_$is_70.default.number(target.y) ? target.y : relativeY) + _offset.y,
          range: _$is_70.default.number(target.range) ? target.range : options.range,
          source: snapTarget,
          index: _index,
          offset: _offset
        });
      }
    }

    var closest = {
      target: null,
      inRange: false,
      distance: 0,
      range: 0,
      delta: {
        x: 0,
        y: 0
      }
    };

    for (var _i2 = 0; _i2 < targets.length; _i2++) {
      var _target = targets[_i2];
      var range = _target.range;
      var dx = _target.x - page.x;
      var dy = _target.y - page.y;
      var distance = (0, _$hypot_69.default)(dx, dy);
      var inRange = distance <= range; // Infinite targets count as being out of range
      // compared to non infinite ones that are in range

      if (range === Infinity && closest.inRange && closest.range !== Infinity) {
        inRange = false;
      }

      if (!closest.target || (inRange ? // is the closest target in range?
      closest.inRange && range !== Infinity ? // the pointer is relatively deeper in this target
      distance / range < closest.distance / closest.range : // this target has Infinite range and the closest doesn't
      range === Infinity && closest.range !== Infinity || // OR this target is closer that the previous closest
      distance < closest.distance : // The other is not in range and the pointer is closer to this target
      !closest.inRange && distance < closest.distance)) {
        closest.target = _target;
        closest.distance = distance;
        closest.range = range;
        closest.inRange = inRange;
        closest.delta.x = dx;
        closest.delta.y = dy;
      }
    }

    if (closest.inRange) {
      coords.x = closest.target.x;
      coords.y = closest.target.y;
    }

    state.closest = closest;
    return closest;
  }

  function getOrigin(arg) {
    var element = arg.interaction.element;
    var optionsOrigin = (0, _$rect_77.rectToXY)((0, _$rect_77.resolveRectLike)(arg.state.options.origin, null, null, [element]));
    var origin = optionsOrigin || (0, _$getOriginXY_68.default)(arg.interactable, element, arg.interaction.prepared.name);
    return origin;
  }

  var __defaults_46 = {
    range: Infinity,
    targets: null,
    offset: null,
    offsetWithOrigin: true,
    origin: null,
    relativePoints: null,
    endOnly: false,
    enabled: false
  };
  var snap = {
    start: __start_46,
    set: __set_46,
    defaults: __defaults_46
  };
  _$pointer_46.snap = snap;

  var ___default_46 = (0, _$base_37.makeModifier)(snap, 'snap');

  _$pointer_46.default = ___default_46;
  var _$size_47 = {};
  "use strict";

  Object.defineProperty(_$size_47, "__esModule", {
    value: true
  });
  _$size_47.snapSize = _$size_47.default = void 0;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$base_37 = require("../base"); */

  ;
  /* removed: var _$pointer_46 = require("./pointer"); */

  ;

  function ___slicedToArray_47(arr, i) {
    return ___arrayWithHoles_47(arr) || ___iterableToArrayLimit_47(arr, i) || ___unsupportedIterableToArray_47(arr, i) || ___nonIterableRest_47();
  }

  function ___nonIterableRest_47() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function ___unsupportedIterableToArray_47(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return ___arrayLikeToArray_47(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return ___arrayLikeToArray_47(o, minLen);
  }

  function ___arrayLikeToArray_47(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }

  function ___iterableToArrayLimit_47(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;

    var _s, _e;

    try {
      for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function ___arrayWithHoles_47(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function __start_47(arg) {
    var state = arg.state,
        edges = arg.edges;
    var options = state.options;

    if (!edges) {
      return null;
    }

    arg.state = {
      options: {
        targets: null,
        relativePoints: [{
          x: edges.left ? 0 : 1,
          y: edges.top ? 0 : 1
        }],
        offset: options.offset || 'self',
        origin: {
          x: 0,
          y: 0
        },
        range: options.range
      }
    };
    state.targetFields = state.targetFields || [['width', 'height'], ['x', 'y']];

    _$pointer_46.snap.start(arg);

    state.offsets = arg.state.offsets;
    arg.state = state;
  }

  function __set_47(arg) {
    var interaction = arg.interaction,
        state = arg.state,
        coords = arg.coords;
    var options = state.options,
        offsets = state.offsets;
    var relative = {
      x: coords.x - offsets[0].x,
      y: coords.y - offsets[0].y
    };
    state.options = (0, _$extend_67.default)({}, options);
    state.options.targets = [];

    for (var _i = 0; _i < (options.targets || []).length; _i++) {
      var _ref;

      _ref = (options.targets || [])[_i];
      var snapTarget = _ref;
      var target = void 0;

      if (_$is_70.default.func(snapTarget)) {
        target = snapTarget(relative.x, relative.y, interaction);
      } else {
        target = snapTarget;
      }

      if (!target) {
        continue;
      }

      for (var _i2 = 0; _i2 < state.targetFields.length; _i2++) {
        var _ref2;

        _ref2 = state.targetFields[_i2];

        var _ref3 = _ref2,
            _ref4 = ___slicedToArray_47(_ref3, 2),
            xField = _ref4[0],
            yField = _ref4[1];

        if (xField in target || yField in target) {
          target.x = target[xField];
          target.y = target[yField];
          break;
        }
      }

      state.options.targets.push(target);
    }

    var returnValue = _$pointer_46.snap.set(arg);

    state.options = options;
    return returnValue;
  }

  var __defaults_47 = {
    range: Infinity,
    targets: null,
    offset: null,
    endOnly: false,
    enabled: false
  };
  var snapSize = {
    start: __start_47,
    set: __set_47,
    defaults: __defaults_47
  };
  _$size_47.snapSize = snapSize;

  var ___default_47 = (0, _$base_37.makeModifier)(snapSize, 'snapSize');

  _$size_47.default = ___default_47;
  var _$edges_45 = {};
  "use strict";

  Object.defineProperty(_$edges_45, "__esModule", {
    value: true
  });
  _$edges_45.snapEdges = _$edges_45.default = void 0;
  /* removed: var _$clone_64 = require("@interactjs/utils/clone"); */

  ;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$base_37 = require("../base"); */

  ;
  /* removed: var _$size_47 = require("./size"); */

  ;
  /**
   * @module modifiers/snapEdges
   *
   * @description
   * WOW> This module allows snapping of the edges of targets during resize
   * interactions.
   *
   * ```js
   * interact(target).resizable({
   *   snapEdges: {
   *     targets: [interact.snappers.grid({ x: 100, y: 50 })],
   *   },
   * })
   *
   * interact(target).resizable({
   *   snapEdges: {
   *     targets: [
   *       interact.snappers.grid({
   *        top: 50,
   *        left: 50,
   *        bottom: 100,
   *        right: 100,
   *       }),
   *     ],
   *   },
   * })
   * ```
   */

  function __start_45(arg) {
    var edges = arg.edges;

    if (!edges) {
      return null;
    }

    arg.state.targetFields = arg.state.targetFields || [[edges.left ? 'left' : 'right', edges.top ? 'top' : 'bottom']];
    return _$size_47.snapSize.start(arg);
  }

  var snapEdges = {
    start: __start_45,
    set: _$size_47.snapSize.set,
    defaults: (0, _$extend_67.default)((0, _$clone_64.default)(_$size_47.snapSize.defaults), {
      targets: null,
      range: null,
      offset: {
        x: 0,
        y: 0
      }
    })
  };
  _$edges_45.snapEdges = snapEdges;

  var ___default_45 = (0, _$base_37.makeModifier)(snapEdges, 'snapEdges');

  _$edges_45.default = ___default_45;
  var _$spring_48 = {};
  "use strict";

  Object.defineProperty(_$spring_48, "__esModule", {
    value: true
  });
  Object.defineProperty(_$spring_48, "default", {
    enumerable: true,
    get: function get() {
      return _$noop_38.default;
    }
  });
  /* removed: var _$noop_38 = require("../noop"); */

  ;
  var _$transform_49 = {};
  "use strict";

  Object.defineProperty(_$transform_49, "__esModule", {
    value: true
  });
  Object.defineProperty(_$transform_49, "default", {
    enumerable: true,
    get: function get() {
      return _$noop_38.default;
    }
  });
  /* removed: var _$noop_38 = require("../noop"); */

  ;
  var _$all_34 = {};
  "use strict";

  Object.defineProperty(_$all_34, "__esModule", {
    value: true
  });
  _$all_34.default = void 0;
  /* removed: var _$aspectRatio_35 = require("./aspectRatio"); */

  ;
  /* removed: var _$avoid_36 = require("./avoid/avoid"); */

  ;
  /* removed: var _$edges_40 = require("./restrict/edges"); */

  ;
  /* removed: var _$pointer_41 = require("./restrict/pointer"); */

  ;
  /* removed: var _$rect_42 = require("./restrict/rect"); */

  ;
  /* removed: var _$size_43 = require("./restrict/size"); */

  ;
  /* removed: var _$rubberband_44 = require("./rubberband/rubberband"); */

  ;
  /* removed: var _$edges_45 = require("./snap/edges"); */

  ;
  /* removed: var _$pointer_46 = require("./snap/pointer"); */

  ;
  /* removed: var _$size_47 = require("./snap/size"); */

  ;
  /* removed: var _$spring_48 = require("./spring/spring"); */

  ;
  /* removed: var _$transform_49 = require("./transform/transform"); */

  ;
  /* eslint-disable n/no-extraneous-import, import/no-unresolved */

  var ___default_34 = {
    aspectRatio: _$aspectRatio_35.default,
    restrictEdges: _$edges_40.default,
    restrict: _$pointer_41.default,
    restrictRect: _$rect_42.default,
    restrictSize: _$size_43.default,
    snapEdges: _$edges_45.default,
    snap: _$pointer_46.default,
    snapSize: _$size_47.default,
    spring: _$spring_48.default,
    avoid: _$avoid_36.default,
    transform: _$transform_49.default,
    rubberband: _$rubberband_44.default
  };
  _$all_34.default = ___default_34;
  var _$plugin_39 = {};
  "use strict";

  Object.defineProperty(_$plugin_39, "__esModule", {
    value: true
  });
  _$plugin_39.default = void 0;
  /* removed: var _$plugin_61 = require("@interactjs/snappers/plugin"); */

  ;
  /* removed: var _$all_34 = require("./all"); */

  ;
  /* removed: var _$base_37 = require("./base"); */

  ;
  var __modifiers_39 = {
    id: 'modifiers',
    install: function install(scope) {
      var interact = scope.interactStatic;
      scope.usePlugin(_$base_37.default);
      scope.usePlugin(_$plugin_61.default);
      interact.modifiers = _$all_34.default; // for backwrads compatibility

      for (var type in _$all_34.default) {
        var _all = _$all_34.default[type],
            _defaults = _all._defaults,
            _methods = _all._methods;
        _defaults._methods = _methods;
        scope.defaults.perAction[type] = _defaults;
      }
    }
  };
  var ___default_39 = __modifiers_39;
  _$plugin_39.default = ___default_39;
  var _$PointerEvent_51 = {};
  "use strict";

  function ___typeof_51(obj) {
    "@babel/helpers - typeof";

    return ___typeof_51 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, ___typeof_51(obj);
  }

  Object.defineProperty(_$PointerEvent_51, "__esModule", {
    value: true
  });
  _$PointerEvent_51.default = _$PointerEvent_51.PointerEvent = void 0;
  /* removed: var _$BaseEvent_13 = require("@interactjs/core/BaseEvent"); */

  ;
  /* removed: var _$pointerUtils_75 = require("@interactjs/utils/pointerUtils"); */

  ;

  function ___classCallCheck_51(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function ___defineProperties_51(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function ___createClass_51(Constructor, protoProps, staticProps) {
    if (protoProps) ___defineProperties_51(Constructor.prototype, protoProps);
    if (staticProps) ___defineProperties_51(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function ___inherits_51(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    Object.defineProperty(subClass, "prototype", {
      writable: false
    });
    if (superClass) ___setPrototypeOf_51(subClass, superClass);
  }

  function ___setPrototypeOf_51(o, p) {
    ___setPrototypeOf_51 = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
    return ___setPrototypeOf_51(o, p);
  }

  function ___createSuper_51(Derived) {
    var hasNativeReflectConstruct = ___isNativeReflectConstruct_51();

    return function _createSuperInternal() {
      var Super = ___getPrototypeOf_51(Derived),
          result;

      if (hasNativeReflectConstruct) {
        var NewTarget = ___getPrototypeOf_51(this).constructor;

        result = Reflect.construct(Super, arguments, NewTarget);
      } else {
        result = Super.apply(this, arguments);
      }

      return ___possibleConstructorReturn_51(this, result);
    };
  }

  function ___possibleConstructorReturn_51(self, call) {
    if (call && (___typeof_51(call) === "object" || typeof call === "function")) {
      return call;
    } else if (call !== void 0) {
      throw new TypeError("Derived constructors may only return object or undefined");
    }

    return ___assertThisInitialized_51(self);
  }

  function ___assertThisInitialized_51(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function ___isNativeReflectConstruct_51() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function ___getPrototypeOf_51(o) {
    ___getPrototypeOf_51 = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return ___getPrototypeOf_51(o);
  }

  var PointerEvent = /*#__PURE__*/function (_BaseEvent) {
    ___inherits_51(PointerEvent, _BaseEvent);

    var _super = ___createSuper_51(PointerEvent);
    /** */


    function PointerEvent(type, pointer, event, eventTarget, interaction, timeStamp) {
      var _this;

      ___classCallCheck_51(this, PointerEvent);

      _this = _super.call(this, interaction);

      _$pointerUtils_75.pointerExtend(___assertThisInitialized_51(_this), event);

      if (event !== pointer) {
        _$pointerUtils_75.pointerExtend(___assertThisInitialized_51(_this), pointer);
      }

      _this.timeStamp = timeStamp;
      _this.originalEvent = event;
      _this.type = type;
      _this.pointerId = _$pointerUtils_75.getPointerId(pointer);
      _this.pointerType = _$pointerUtils_75.getPointerType(pointer);
      _this.target = eventTarget;
      _this.currentTarget = null;

      if (type === 'tap') {
        var pointerIndex = interaction.getPointerIndex(pointer);
        _this.dt = _this.timeStamp - interaction.pointers[pointerIndex].downTime;
        var interval = _this.timeStamp - interaction.tapTime;
        _this.double = !!interaction.prevTap && interaction.prevTap.type !== 'doubletap' && interaction.prevTap.target === _this.target && interval < 500;
      } else if (type === 'doubletap') {
        _this.dt = pointer.timeStamp - interaction.tapTime;
        _this.double = true;
      }

      return _this;
    }

    ___createClass_51(PointerEvent, [{
      key: "_subtractOrigin",
      value: function _subtractOrigin(_ref) {
        var originX = _ref.x,
            originY = _ref.y;
        this.pageX -= originX;
        this.pageY -= originY;
        this.clientX -= originX;
        this.clientY -= originY;
        return this;
      }
    }, {
      key: "_addOrigin",
      value: function _addOrigin(_ref2) {
        var originX = _ref2.x,
            originY = _ref2.y;
        this.pageX += originX;
        this.pageY += originY;
        this.clientX += originX;
        this.clientY += originY;
        return this;
      }
      /**
       * Prevent the default behaviour of the original Event
       */

    }, {
      key: "preventDefault",
      value: function preventDefault() {
        this.originalEvent.preventDefault();
      }
    }]);

    return PointerEvent;
  }(_$BaseEvent_13.BaseEvent);

  _$PointerEvent_51.PointerEvent = _$PointerEvent_51.default = PointerEvent;
  var _$base_52 = {};
  "use strict";

  Object.defineProperty(_$base_52, "__esModule", {
    value: true
  });
  _$base_52.default = void 0;
  /* removed: var _$domUtils_66 = require("@interactjs/utils/domUtils"); */

  ;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;
  /* removed: var _$getOriginXY_68 = require("@interactjs/utils/getOriginXY"); */

  ;
  /* removed: var _$PointerEvent_51 = require("./PointerEvent"); */

  ;
  var __defaults_52 = {
    holdDuration: 600,
    ignoreFrom: null,
    allowFrom: null,
    origin: {
      x: 0,
      y: 0
    }
  };
  var pointerEvents = {
    id: 'pointer-events/base',
    before: ['inertia', 'modifiers', 'auto-start', 'actions'],
    install: __install_52,
    listeners: {
      'interactions:new': addInteractionProps,
      'interactions:update-pointer': addHoldInfo,
      'interactions:move': moveAndClearHold,
      'interactions:down': function interactionsDown(arg, scope) {
        downAndStartHold(arg, scope);
        fire(arg, scope);
      },
      'interactions:up': function interactionsUp(arg, scope) {
        clearHold(arg);
        fire(arg, scope);
        tapAfterUp(arg, scope);
      },
      'interactions:cancel': function interactionsCancel(arg, scope) {
        clearHold(arg);
        fire(arg, scope);
      }
    },
    PointerEvent: _$PointerEvent_51.PointerEvent,
    fire: fire,
    collectEventTargets: collectEventTargets,
    defaults: __defaults_52,
    types: {
      down: true,
      move: true,
      up: true,
      cancel: true,
      tap: true,
      doubletap: true,
      hold: true
    }
  };

  function fire(arg, scope) {
    var interaction = arg.interaction,
        pointer = arg.pointer,
        event = arg.event,
        eventTarget = arg.eventTarget,
        type = arg.type,
        _arg$targets = arg.targets,
        targets = _arg$targets === void 0 ? collectEventTargets(arg, scope) : _arg$targets;
    var pointerEvent = new _$PointerEvent_51.PointerEvent(type, pointer, event, eventTarget, interaction, scope.now());
    scope.fire('pointerEvents:new', {
      pointerEvent: pointerEvent
    });
    var signalArg = {
      interaction: interaction,
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      targets: targets,
      type: type,
      pointerEvent: pointerEvent
    };

    for (var i = 0; i < targets.length; i++) {
      var target = targets[i];

      for (var prop in target.props || {}) {
        ;
        pointerEvent[prop] = target.props[prop];
      }

      var origin = (0, _$getOriginXY_68.default)(target.eventable, target.node);

      pointerEvent._subtractOrigin(origin);

      pointerEvent.eventable = target.eventable;
      pointerEvent.currentTarget = target.node;
      target.eventable.fire(pointerEvent);

      pointerEvent._addOrigin(origin);

      if (pointerEvent.immediatePropagationStopped || pointerEvent.propagationStopped && i + 1 < targets.length && targets[i + 1].node !== pointerEvent.currentTarget) {
        break;
      }
    }

    scope.fire('pointerEvents:fired', signalArg);

    if (type === 'tap') {
      // if pointerEvent should make a double tap, create and fire a doubletap
      // PointerEvent and use that as the prevTap
      var prevTap = pointerEvent.double ? fire({
        interaction: interaction,
        pointer: pointer,
        event: event,
        eventTarget: eventTarget,
        type: 'doubletap'
      }, scope) : pointerEvent;
      interaction.prevTap = prevTap;
      interaction.tapTime = prevTap.timeStamp;
    }

    return pointerEvent;
  }

  function collectEventTargets(_ref, scope) {
    var interaction = _ref.interaction,
        pointer = _ref.pointer,
        event = _ref.event,
        eventTarget = _ref.eventTarget,
        type = _ref.type;
    var pointerIndex = interaction.getPointerIndex(pointer);
    var pointerInfo = interaction.pointers[pointerIndex]; // do not fire a tap event if the pointer was moved before being lifted

    if (type === 'tap' && (interaction.pointerWasMoved || // or if the pointerup target is different to the pointerdown target
    !(pointerInfo && pointerInfo.downTarget === eventTarget))) {
      return [];
    }

    var path = _$domUtils_66.getPath(eventTarget);

    var signalArg = {
      interaction: interaction,
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      type: type,
      path: path,
      targets: [],
      node: null
    };

    for (var _i = 0; _i < path.length; _i++) {
      var _ref2;

      _ref2 = path[_i];
      var node = _ref2;
      signalArg.node = node;
      scope.fire('pointerEvents:collect-targets', signalArg);
    }

    if (type === 'hold') {
      signalArg.targets = signalArg.targets.filter(function (target) {
        var _interaction$pointers;

        return target.eventable.options.holdDuration === ((_interaction$pointers = interaction.pointers[pointerIndex]) == null ? void 0 : _interaction$pointers.hold.duration);
      });
    }

    return signalArg.targets;
  }

  function addInteractionProps(_ref3) {
    var interaction = _ref3.interaction;
    interaction.prevTap = null; // the most recent tap event on this interaction

    interaction.tapTime = 0; // time of the most recent tap event
  }

  function addHoldInfo(_ref4) {
    var down = _ref4.down,
        pointerInfo = _ref4.pointerInfo;

    if (!down && pointerInfo.hold) {
      return;
    }

    pointerInfo.hold = {
      duration: Infinity,
      timeout: null
    };
  }

  function clearHold(_ref5) {
    var interaction = _ref5.interaction,
        pointerIndex = _ref5.pointerIndex;
    var hold = interaction.pointers[pointerIndex].hold;

    if (hold && hold.timeout) {
      clearTimeout(hold.timeout);
      hold.timeout = null;
    }
  }

  function moveAndClearHold(arg, scope) {
    var interaction = arg.interaction,
        pointer = arg.pointer,
        event = arg.event,
        eventTarget = arg.eventTarget,
        duplicate = arg.duplicate;

    if (!duplicate && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
      if (interaction.pointerIsDown) {
        clearHold(arg);
      }

      fire({
        interaction: interaction,
        pointer: pointer,
        event: event,
        eventTarget: eventTarget,
        type: 'move'
      }, scope);
    }
  }

  function downAndStartHold(_ref6, scope) {
    var interaction = _ref6.interaction,
        pointer = _ref6.pointer,
        event = _ref6.event,
        eventTarget = _ref6.eventTarget,
        pointerIndex = _ref6.pointerIndex;
    var timer = interaction.pointers[pointerIndex].hold;

    var path = _$domUtils_66.getPath(eventTarget);

    var signalArg = {
      interaction: interaction,
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      type: 'hold',
      targets: [],
      path: path,
      node: null
    };

    for (var _i2 = 0; _i2 < path.length; _i2++) {
      var _ref7;

      _ref7 = path[_i2];
      var node = _ref7;
      signalArg.node = node;
      scope.fire('pointerEvents:collect-targets', signalArg);
    }

    if (!signalArg.targets.length) return;
    var minDuration = Infinity;

    for (var _i3 = 0; _i3 < signalArg.targets.length; _i3++) {
      var _ref8;

      _ref8 = signalArg.targets[_i3];
      var target = _ref8;
      var holdDuration = target.eventable.options.holdDuration;

      if (holdDuration < minDuration) {
        minDuration = holdDuration;
      }
    }

    timer.duration = minDuration;
    timer.timeout = setTimeout(function () {
      fire({
        interaction: interaction,
        eventTarget: eventTarget,
        pointer: pointer,
        event: event,
        type: 'hold'
      }, scope);
    }, minDuration);
  }

  function tapAfterUp(_ref9, scope) {
    var interaction = _ref9.interaction,
        pointer = _ref9.pointer,
        event = _ref9.event,
        eventTarget = _ref9.eventTarget;

    if (!interaction.pointerWasMoved) {
      fire({
        interaction: interaction,
        eventTarget: eventTarget,
        pointer: pointer,
        event: event,
        type: 'tap'
      }, scope);
    }
  }

  function __install_52(scope) {
    scope.pointerEvents = pointerEvents;
    scope.defaults.actions.pointerEvents = pointerEvents.defaults;
    (0, _$extend_67.default)(scope.actions.phaselessTypes, pointerEvents.types);
  }

  var ___default_52 = pointerEvents;
  _$base_52.default = ___default_52;
  var _$holdRepeat_53 = {};
  "use strict";

  Object.defineProperty(_$holdRepeat_53, "__esModule", {
    value: true
  });
  _$holdRepeat_53.default = void 0;
  /* removed: var _$base_52 = require("./base"); */

  ;

  function __install_53(scope) {
    scope.usePlugin(_$base_52.default);
    var pointerEvents = scope.pointerEvents; // don't repeat by default

    pointerEvents.defaults.holdRepeatInterval = 0;
    pointerEvents.types.holdrepeat = scope.actions.phaselessTypes.holdrepeat = true;
  }

  function onNew(_ref) {
    var pointerEvent = _ref.pointerEvent;
    if (pointerEvent.type !== 'hold') return;
    pointerEvent.count = (pointerEvent.count || 0) + 1;
  }

  function onFired(_ref2, scope) {
    var interaction = _ref2.interaction,
        pointerEvent = _ref2.pointerEvent,
        eventTarget = _ref2.eventTarget,
        targets = _ref2.targets;
    if (pointerEvent.type !== 'hold' || !targets.length) return; // get the repeat interval from the first eventable

    var interval = targets[0].eventable.options.holdRepeatInterval; // don't repeat if the interval is 0 or less

    if (interval <= 0) return; // set a timeout to fire the holdrepeat event

    interaction.holdIntervalHandle = setTimeout(function () {
      scope.pointerEvents.fire({
        interaction: interaction,
        eventTarget: eventTarget,
        type: 'hold',
        pointer: pointerEvent,
        event: pointerEvent
      }, scope);
    }, interval);
  }

  function endHoldRepeat(_ref3) {
    var interaction = _ref3.interaction; // set the interaction's holdStopTime property
    // to stop further holdRepeat events

    if (interaction.holdIntervalHandle) {
      clearInterval(interaction.holdIntervalHandle);
      interaction.holdIntervalHandle = null;
    }
  }

  var holdRepeat = {
    id: 'pointer-events/holdRepeat',
    install: __install_53,
    listeners: ['move', 'up', 'cancel', 'endall'].reduce(function (acc, enderTypes) {
      ;
      acc["pointerEvents:".concat(enderTypes)] = endHoldRepeat;
      return acc;
    }, {
      'pointerEvents:new': onNew,
      'pointerEvents:fired': onFired
    })
  };
  var ___default_53 = holdRepeat;
  _$holdRepeat_53.default = ___default_53;
  var _$interactableTargets_54 = {};
  "use strict";

  Object.defineProperty(_$interactableTargets_54, "__esModule", {
    value: true
  });
  _$interactableTargets_54.default = void 0;
  /* removed: var _$extend_67 = require("@interactjs/utils/extend"); */

  ;

  function __install_54(scope) {
    var Interactable = scope.Interactable;
    Interactable.prototype.pointerEvents = pointerEventsMethod;
    var __backCompatOption = Interactable.prototype._backCompatOption;

    Interactable.prototype._backCompatOption = function (optionName, newValue) {
      var ret = __backCompatOption.call(this, optionName, newValue);

      if (ret === this) {
        this.events.options[optionName] = newValue;
      }

      return ret;
    };
  }

  function pointerEventsMethod(options) {
    (0, _$extend_67.default)(this.events.options, options);
    return this;
  }

  var plugin = {
    id: 'pointer-events/interactableTargets',
    install: __install_54,
    listeners: {
      'pointerEvents:collect-targets': function pointerEventsCollectTargets(_ref, scope) {
        var targets = _ref.targets,
            node = _ref.node,
            type = _ref.type,
            eventTarget = _ref.eventTarget;
        scope.interactables.forEachMatch(node, function (interactable) {
          var eventable = interactable.events;
          var options = eventable.options;

          if (eventable.types[type] && eventable.types[type].length && interactable.testIgnoreAllow(options, node, eventTarget)) {
            targets.push({
              node: node,
              eventable: eventable,
              props: {
                interactable: interactable
              }
            });
          }
        });
      },
      'interactable:new': function interactableNew(_ref2) {
        var interactable = _ref2.interactable;

        interactable.events.getRect = function (element) {
          return interactable.getRect(element);
        };
      },
      'interactable:set': function interactableSet(_ref3, scope) {
        var interactable = _ref3.interactable,
            options = _ref3.options;
        (0, _$extend_67.default)(interactable.events.options, scope.pointerEvents.defaults);
        (0, _$extend_67.default)(interactable.events.options, options.pointerEvents || {});
      }
    }
  };
  var ___default_54 = plugin;
  _$interactableTargets_54.default = ___default_54;
  var _$plugin_55 = {};
  "use strict";

  Object.defineProperty(_$plugin_55, "__esModule", {
    value: true
  });
  _$plugin_55.default = void 0;
  /* removed: var _$base_52 = require("./base"); */

  ;
  /* removed: var _$holdRepeat_53 = require("./holdRepeat"); */

  ;
  /* removed: var _$interactableTargets_54 = require("./interactableTargets"); */

  ;
  var __plugin_55 = {
    id: 'pointer-events',
    install: function install(scope) {
      scope.usePlugin(_$base_52);
      scope.usePlugin(_$holdRepeat_53.default);
      scope.usePlugin(_$interactableTargets_54.default);
    }
  };
  var ___default_55 = __plugin_55;
  _$plugin_55.default = ___default_55;
  var _$plugin_56 = {};
  "use strict";

  Object.defineProperty(_$plugin_56, "__esModule", {
    value: true
  });
  _$plugin_56.default = void 0;
  _$plugin_56.install = __install_56;
  /* removed: var _$arr_62 = require("@interactjs/utils/arr"); */

  ;
  /* removed: var _$is_70 = require("@interactjs/utils/is"); */

  ;
  /* removed: var _$misc_72 = require("@interactjs/utils/misc"); */

  ;
  /* removed: var _$pointerUtils_75 = require("@interactjs/utils/pointerUtils"); */

  ;
  /* removed: var _$rect_77 = require("@interactjs/utils/rect"); */

  ;

  function __install_56(scope) {
    var Interactable = scope.Interactable;
    scope.actions.phases.reflow = true;
    /**
     * ```js
     * const interactable = interact(target)
     * const drag = { name: drag, axis: 'x' }
     * const resize = { name: resize, edges: { left: true, bottom: true }
     *
     * interactable.reflow(drag)
     * interactable.reflow(resize)
     * ```
     *
     * Start an action sequence to re-apply modifiers, check drops, etc.
     *
     * @param { Object } action The action to begin
     * @param { string } action.name The name of the action
     * @returns { Promise } A promise that resolves to the `Interactable` when actions on all targets have ended
     */

    Interactable.prototype.reflow = function (action) {
      return doReflow(this, action, scope);
    };
  }

  function doReflow(interactable, action, scope) {
    var elements = _$is_70.default.string(interactable.target) ? _$arr_62.from(interactable._context.querySelectorAll(interactable.target)) : [interactable.target]; // tslint:disable-next-line variable-name

    var Promise = scope.window.Promise;
    var promises = Promise ? [] : null;

    var _loop = function _loop() {
      _ref = elements[_i];
      var element = _ref;
      var rect = interactable.getRect(element);

      if (!rect) {
        return "break";
      }

      var runningInteraction = _$arr_62.find(scope.interactions.list, function (interaction) {
        return interaction.interacting() && interaction.interactable === interactable && interaction.element === element && interaction.prepared.name === action.name;
      });

      var reflowPromise = void 0;

      if (runningInteraction) {
        runningInteraction.move();

        if (promises) {
          reflowPromise = runningInteraction._reflowPromise || new Promise(function (resolve) {
            runningInteraction._reflowResolve = resolve;
          });
        }
      } else {
        var xywh = (0, _$rect_77.tlbrToXywh)(rect);
        var coords = {
          page: {
            x: xywh.x,
            y: xywh.y
          },
          client: {
            x: xywh.x,
            y: xywh.y
          },
          timeStamp: scope.now()
        };

        var event = _$pointerUtils_75.coordsToEvent(coords);

        reflowPromise = startReflow(scope, interactable, element, action, event);
      }

      if (promises) {
        promises.push(reflowPromise);
      }
    };

    for (var _i = 0; _i < elements.length; _i++) {
      var _ref;

      var _ret = _loop();

      if (_ret === "break") break;
    }

    return promises && Promise.all(promises).then(function () {
      return interactable;
    });
  }

  function startReflow(scope, interactable, element, action, event) {
    var interaction = scope.interactions.new({
      pointerType: 'reflow'
    });
    var signalArg = {
      interaction: interaction,
      event: event,
      pointer: event,
      eventTarget: element,
      phase: 'reflow'
    };
    interaction.interactable = interactable;
    interaction.element = element;
    interaction.prevEvent = event;
    interaction.updatePointer(event, event, element, true);

    _$pointerUtils_75.setZeroCoords(interaction.coords.delta);

    (0, _$misc_72.copyAction)(interaction.prepared, action);

    interaction._doPhase(signalArg);

    var _ref2 = scope.window,
        Promise = _ref2.Promise;
    var reflowPromise = Promise ? new Promise(function (resolve) {
      interaction._reflowResolve = resolve;
    }) : undefined;
    interaction._reflowPromise = reflowPromise;
    interaction.start(action, interactable, element);

    if (interaction._interacting) {
      interaction.move(signalArg);
      interaction.end(event);
    } else {
      interaction.stop();

      interaction._reflowResolve();
    }

    interaction.removePointer(event, event);
    return reflowPromise;
  }

  var reflow = {
    id: 'reflow',
    install: __install_56,
    listeners: {
      // remove completed reflow interactions
      'interactions:stop': function interactionsStop(_ref3, scope) {
        var interaction = _ref3.interaction;

        if (interaction.pointerType === 'reflow') {
          if (interaction._reflowResolve) {
            interaction._reflowResolve();
          }

          _$arr_62.remove(scope.interactions.list, interaction);
        }
      }
    }
  };
  var ___default_56 = reflow;
  _$plugin_56.default = ___default_56;
  var _$index_32 = {
    exports: {}
  };
  "use strict";

  Object.defineProperty(_$index_32.exports, "__esModule", {
    value: true
  });
  _$index_32.exports.default = void 0;
  /* removed: var _$plugin_5 = require("@interactjs/actions/plugin"); */

  ;
  /* removed: var _$plugin_7 = require("@interactjs/auto-scroll/plugin"); */

  ;
  /* removed: var _$plugin_12 = require("@interactjs/auto-start/plugin"); */

  ;
  /* removed: var _$interactablePreventDefault_22 = require("@interactjs/core/interactablePreventDefault"); */

  ;
  /* removed: var _$plugin_28 = require("@interactjs/dev-tools/plugin"); */

  ;
  /* removed: var _$plugin_30 = require("@interactjs/inertia/plugin"); */

  ;
  /* removed: var _$index_31 = require("@interactjs/interact"); */

  ;
  /* removed: var _$plugin_39 = require("@interactjs/modifiers/plugin"); */

  ;
  /* removed: var _$plugin_50 = require("@interactjs/offset/plugin"); */

  ;
  /* removed: var _$plugin_55 = require("@interactjs/pointer-events/plugin"); */

  ;
  /* removed: var _$plugin_56 = require("@interactjs/reflow/plugin"); */

  ;

  function ___typeof_32(obj) {
    "@babel/helpers - typeof";

    return ___typeof_32 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, ___typeof_32(obj);
  }

  _$index_31.default.use(_$interactablePreventDefault_22.default);

  _$index_31.default.use(_$plugin_50.default); // pointerEvents


  _$index_31.default.use(_$plugin_55.default); // inertia


  _$index_31.default.use(_$plugin_30.default); // snap, resize, etc.


  _$index_31.default.use(_$plugin_39.default); // autoStart, hold


  _$index_31.default.use(_$plugin_12.default); // drag and drop, resize, gesture


  _$index_31.default.use(_$plugin_5.default); // autoScroll


  _$index_31.default.use(_$plugin_7.default); // reflow


  _$index_31.default.use(_$plugin_56.default); // eslint-disable-next-line no-undef


  if ("development" !== 'production') {
    _$index_31.default.use(_$plugin_28.default);
  }

  var ___default_32 = _$index_31.default;
  _$index_32.exports.default = ___default_32;

  if (("object" === "undefined" ? "undefined" : ___typeof_32(_$index_32)) === 'object' && !!_$index_32) {
    try {
      _$index_32.exports = _$index_31.default;
    } catch (_unused) {}
  }

  ;
  _$index_31.default.default = _$index_31.default;
  var _ = {
    actions: _$plugin_5.default,
    autoScroll: _$plugin_7.default,
    autoStart: _$plugin_12.default,
    interactablePreventDefault: _$interactablePreventDefault_22.default,
    devTools: _$plugin_28.default,
    inertia: _$plugin_30.default,
    interact: _$index_31.default,
    modifiers: _$plugin_39.default,
    offset: _$plugin_50.default,
    pointerEvents: _$plugin_55.default,
    reflow: _$plugin_56.default
  }; // Exported so that the related module augmentations will be referenced in
  // generated .d.ts file

  _$index_32 = _$index_32.exports;
  var _$index_79 = {
    exports: {}
  };
  "use strict";

  Object.defineProperty(_$index_79.exports, "__esModule", {
    value: true
  });
  _$index_79.exports.default = void 0;
  /* removed: var _$index_32 = require("@interactjs/interactjs"); */

  ;

  function ___typeof_79(obj) {
    "@babel/helpers - typeof";

    return ___typeof_79 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, ___typeof_79(obj);
  }

  var ___default_79 = _$index_32.default;
  _$index_79.exports.default = ___default_79;

  if (("object" === "undefined" ? "undefined" : ___typeof_79(_$index_79)) === 'object' && !!_$index_79) {
    try {
      _$index_79.exports = _$index_32.default;
    } catch (_unused) {}
  }

  ;
  _$index_32.default.default = _$index_32.default;
  _$index_79 = _$index_79.exports;
  return _$index_79;
}); //# sourceMappingURL=interact.js.map