/**
 * interact.js v1.4.0-alpha.17+sha.793e5fa-dirty
 *
 * Copyright (c) 2012-2018 Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.interact = f()}})(function(){var define,module,exports;
var _$arr_40 = {};
"use strict";

Object.defineProperty(_$arr_40, "__esModule", {
  value: true
});
_$arr_40.contains = contains;
_$arr_40.remove = remove;
_$arr_40.merge = merge;
_$arr_40.from = from;
_$arr_40.findIndex = findIndex;
_$arr_40.find = find;
_$arr_40.some = some;

function contains(array, target) {
  return array.indexOf(target) !== -1;
}

function remove(array, target) {
  return array.splice(array.indexOf(target), 1);
}

function merge(target, source) {
  for (var _i = 0; _i < source.length; _i++) {
    var _ref;

    _ref = source[_i];
    var item = _ref;
    target.push(item);
  }

  return target;
}

function from(source) {
  return merge([], source);
}

function findIndex(array, func) {
  for (var i = 0; i < array.length; i++) {
    if (func(array[i], i, array)) {
      return i;
    }
  }

  return -1;
}

function find(array, func) {
  return array[findIndex(array, func)];
}

function some(array, func) {
  return findIndex(array, func) !== -1;
}

var _$isWindow_52 = {};
"use strict";

Object.defineProperty(_$isWindow_52, "__esModule", {
  value: true
});
_$isWindow_52.default = void 0;

var _default = function _default(thing) {
  return !!(thing && thing.Window) && thing instanceof thing.Window;
};

_$isWindow_52.default = _default;

var _$window_60 = {};
"use strict";

Object.defineProperty(_$window_60, "__esModule", {
  value: true
});
_$window_60.init = init;
_$window_60.getWindow = getWindow;
_$window_60.default = void 0;

var _isWindow = _interopRequireDefault(_$isWindow_52);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var win = {
  getWindow: getWindow,
  init: init
};

function init(window) {
  // get wrapped window if using Shadow DOM polyfill
  win.realWindow = window; // create a TextNode

  var el = window.document.createTextNode(''); // check if it's wrapped by a polyfill

  if (el.ownerDocument !== window.document && typeof window.wrap === 'function' && window.wrap(el) === el) {
    // use wrapped window
    window = window.wrap(window);
  }

  win.window = window;
}

if (typeof window === 'undefined') {
  win.window = undefined;
  win.realWindow = undefined;
} else {
  init(window);
}

function getWindow(node) {
  if ((0, _isWindow.default)(node)) {
    return node;
  }

  var rootNode = node.ownerDocument || node;
  return rootNode.defaultView || win.window;
}

win.init = init;
var ___default_60 = win;
_$window_60.default = ___default_60;

var _$is_51 = {};
"use strict";

Object.defineProperty(_$is_51, "__esModule", {
  value: true
});
_$is_51.array = _$is_51.plainObject = _$is_51.element = _$is_51.string = _$is_51.bool = _$is_51.number = _$is_51.func = _$is_51.object = _$is_51.docFrag = _$is_51.window = void 0;

var _window2 = ___interopRequireDefault_51(_$window_60);

var ___isWindow_51 = ___interopRequireDefault_51(_$isWindow_52);

function ___interopRequireDefault_51(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var __window_51 = function window(thing) {
  return thing === _window2.default.window || (0, ___isWindow_51.default)(thing);
};

_$is_51.window = __window_51;

var docFrag = function docFrag(thing) {
  return object(thing) && thing.nodeType === 11;
};

_$is_51.docFrag = docFrag;

var object = function object(thing) {
  return !!thing && _typeof(thing) === 'object';
};

_$is_51.object = object;

var func = function func(thing) {
  return typeof thing === 'function';
};

_$is_51.func = func;

var number = function number(thing) {
  return typeof thing === 'number';
};

_$is_51.number = number;

var bool = function bool(thing) {
  return typeof thing === 'boolean';
};

_$is_51.bool = bool;

var string = function string(thing) {
  return typeof thing === 'string';
};

_$is_51.string = string;

var element = function element(thing) {
  if (!thing || _typeof(thing) !== 'object') {
    return false;
  }

  var _window = _window2.default.getWindow(thing) || _window2.default.window;

  return /object|function/.test(_typeof(_window.Element)) ? thing instanceof _window.Element //DOM2
  : thing.nodeType === 1 && typeof thing.nodeName === 'string';
};

_$is_51.element = element;

var plainObject = function plainObject(thing) {
  return object(thing) && !!thing.constructor && thing.constructor.name === 'Object';
};

_$is_51.plainObject = plainObject;

var array = function array(thing) {
  return object(thing) && typeof thing.length !== 'undefined' && func(thing.splice);
};

_$is_51.array = array;

var _$drag_1 = {};
"use strict";

Object.defineProperty(_$drag_1, "__esModule", {
  value: true
});
_$drag_1.default = void 0;

var is = _interopRequireWildcard(_$is_51);

var arr = _interopRequireWildcard(_$arr_40);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function install(scope) {
  var actions = scope.actions,
      Interactable = scope.Interactable,
      interactions = scope.interactions,
      defaults = scope.defaults;
  interactions.signals.on('before-action-move', beforeMove);
  interactions.signals.on('action-resume', beforeMove); // dragmove

  interactions.signals.on('action-move', move);
  Interactable.prototype.draggable = drag.draggable;
  actions.drag = drag;
  actions.names.push('drag');
  arr.merge(actions.eventTypes, ['dragstart', 'dragmove', 'draginertiastart', 'dragresume', 'dragend']);
  actions.methodDict.drag = 'draggable';
  defaults.drag = drag.defaults;
}

function beforeMove(_ref) {
  var interaction = _ref.interaction;

  if (interaction.prepared.name !== 'drag') {
    return;
  }

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

  if (interaction.prepared.name !== 'drag') {
    return;
  }

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
 * });
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


function draggable(options) {
  if (is.object(options)) {
    this.options.drag.enabled = options.enabled === false ? false : true;
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

  if (is.bool(options)) {
    this.options.drag.enabled = options;
    return this;
  }

  return this.options.drag;
}

var drag = {
  install: install,
  draggable: draggable,
  beforeMove: beforeMove,
  move: move,
  defaults: {
    startAxis: 'xy',
    lockAxis: 'xy'
  },
  checker: function checker(pointer, event, interactable) {
    var dragOptions = interactable.options.drag;
    return dragOptions.enabled ? {
      name: 'drag',
      axis: dragOptions.lockAxis === 'start' ? dragOptions.startAxis : dragOptions.lockAxis
    } : null;
  },
  getCursor: function getCursor() {
    return 'move';
  }
};
var ___default_1 = drag;
_$drag_1.default = ___default_1;

var _$DropEvent_2 = {};
"use strict";

Object.defineProperty(_$DropEvent_2, "__esModule", {
  value: true
});
_$DropEvent_2.default = void 0;

var __arr_2 = ___interopRequireWildcard_2(_$arr_40);

function ___interopRequireWildcard_2(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var DropEvent =
/*#__PURE__*/
function () {
  /**
   * Class of events fired on dropzones during drags with acceptable targets.
   */
  function DropEvent(dropStatus, dragEvent, type) {
    _classCallCheck(this, DropEvent);

    var _ref = type === 'dragleave' ? dropStatus.prev : dropStatus.cur,
        element = _ref.element,
        dropzone = _ref.dropzone;

    this.type = type;
    this.target = element;
    this.currentTarget = element;
    this.dropzone = dropzone;
    this.dragEvent = dragEvent;
    this.relatedTarget = dragEvent.target;
    this.interaction = dragEvent.interaction;
    this.draggable = dragEvent.interactable;
    this.timeStamp = dragEvent.timeStamp;
    this.propagationStopped = this.immediatePropagationStopped = false;
  }
  /**
   * If this is a `dropactivate` event, the dropzone element will be
   * deactivated.
   *
   * If this is a `dragmove` or `dragenter`, a `dragleave` will be fired on the
   * dropzone element and more.
   */


  _createClass(DropEvent, [{
    key: "reject",
    value: function reject() {
      var _this = this;

      var dropStatus = this.interaction.dropStatus;

      if (this.type !== 'dropactivate' && (!this.dropzone || dropStatus.cur.dropzone !== this.dropzone || dropStatus.cur.element !== this.target)) {
        return;
      }

      dropStatus.prev.dropzone = this.dropzone;
      dropStatus.prev.element = this.target;
      dropStatus.rejected = true;
      dropStatus.events.enter = null;
      this.stopImmediatePropagation();

      if (this.type === 'dropactivate') {
        var activeDrops = dropStatus.activeDrops;
        var index = __arr_2.findIndex(activeDrops, function (_ref2) {
          var dropzone = _ref2.dropzone,
              element = _ref2.element;
          return dropzone === _this.dropzone && element === _this.target;
        });
        dropStatus.activeDrops = _toConsumableArray(activeDrops.slice(0, index)).concat(_toConsumableArray(activeDrops.slice(index + 1)));
        var deactivateEvent = new DropEvent(dropStatus, this.dragEvent, 'dropdeactivate');
        deactivateEvent.dropzone = this.dropzone;
        deactivateEvent.target = this.target;
        this.dropzone.fire(deactivateEvent);
      } else {
        this.dropzone.fire(new DropEvent(dropStatus, this.dragEvent, 'dragleave'));
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
}();

var ___default_2 = DropEvent;
_$DropEvent_2.default = ___default_2;

var _$Signals_39 = {};
"use strict";

Object.defineProperty(_$Signals_39, "__esModule", {
  value: true
});
_$Signals_39.default = void 0;

function ___classCallCheck_39(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_39(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_39(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_39(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_39(Constructor, staticProps); return Constructor; }

var Signals =
/*#__PURE__*/
function () {
  function Signals() {
    ___classCallCheck_39(this, Signals);

    this.listeners = {// signalName: [listeners],
    };
  }

  ___createClass_39(Signals, [{
    key: "on",
    value: function on(name, listener) {
      if (!this.listeners[name]) {
        this.listeners[name] = [listener];
        return;
      }

      this.listeners[name].push(listener);
    }
  }, {
    key: "off",
    value: function off(name, listener) {
      if (!this.listeners[name]) {
        return;
      }

      var index = this.listeners[name].indexOf(listener);

      if (index !== -1) {
        this.listeners[name].splice(index, 1);
      }
    }
  }, {
    key: "fire",
    value: function fire(name, arg) {
      var targetListeners = this.listeners[name];

      if (!targetListeners) {
        return;
      }

      for (var _i = 0; _i < targetListeners.length; _i++) {
        var _ref;

        _ref = targetListeners[_i];
        var listener = _ref;

        if (listener(arg, name) === false) {
          return false;
        }
      }
    }
  }]);

  return Signals;
}();

var ___default_39 = Signals;
_$Signals_39.default = ___default_39;

var _$domObjects_43 = {};
"use strict";

Object.defineProperty(_$domObjects_43, "__esModule", {
  value: true
});
_$domObjects_43.default = void 0;
var domObjects = {
  init: __init_43
};

function blank() {}

var ___default_43 = domObjects;
_$domObjects_43.default = ___default_43;

function __init_43(window) {
  domObjects.document = window.document;
  domObjects.DocumentFragment = window.DocumentFragment || blank;
  domObjects.SVGElement = window.SVGElement || blank;
  domObjects.SVGSVGElement = window.SVGSVGElement || blank;
  domObjects.SVGElementInstance = window.SVGElementInstance || blank;
  domObjects.Element = window.Element || blank;
  domObjects.HTMLElement = window.HTMLElement || domObjects.Element;
  domObjects.Event = window.Event;
  domObjects.Touch = window.Touch || blank;
  domObjects.PointerEvent = window.PointerEvent || window.MSPointerEvent;
}

var _$browser_41 = {};
"use strict";

Object.defineProperty(_$browser_41, "__esModule", {
  value: true
});
_$browser_41.default = void 0;

var _window = ___interopRequireDefault_41(_$window_60);

var __is_41 = ___interopRequireWildcard_41(_$is_51);

var _domObjects = ___interopRequireDefault_41(_$domObjects_43);

function ___interopRequireWildcard_41(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function ___interopRequireDefault_41(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var browser = {
  init: __init_41
};
var ___default_41 = browser;
_$browser_41.default = ___default_41;

function __init_41(window) {
  var Element = _domObjects.default.Element;
  var navigator = _window.default.window.navigator; // Does the browser support touch input?

  browser.supportsTouch = !!('ontouchstart' in window || __is_41.func(window.DocumentTouch) && _domObjects.default.document instanceof window.DocumentTouch); // Does the browser support PointerEvents

  browser.supportsPointerEvent = !!_domObjects.default.PointerEvent;
  browser.isIOS = /iP(hone|od|ad)/.test(navigator.platform); // scrolling doesn't change the result of getClientRects on iOS 7

  browser.isIOS7 = /iP(hone|od|ad)/.test(navigator.platform) && /OS 7[^\d]/.test(navigator.appVersion);
  browser.isIe9 = /MSIE 9/.test(navigator.userAgent); // prefix matchesSelector

  browser.prefixedMatchesSelector = 'matches' in Element.prototype ? 'matches' : 'webkitMatchesSelector' in Element.prototype ? 'webkitMatchesSelector' : 'mozMatchesSelector' in Element.prototype ? 'mozMatchesSelector' : 'oMatchesSelector' in Element.prototype ? 'oMatchesSelector' : 'msMatchesSelector';
  browser.pEventTypes = _domObjects.default.PointerEvent ? _domObjects.default.PointerEvent === window.MSPointerEvent ? {
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

  browser.wheelEvent = 'onmousewheel' in _domObjects.default.document ? 'mousewheel' : 'wheel'; // Opera Mobile must be handled differently

  browser.isOperaMobile = navigator.appName === 'Opera' && browser.supportsTouch && navigator.userAgent.match('Presto');
}

var _$clone_42 = {};
"use strict";

Object.defineProperty(_$clone_42, "__esModule", {
  value: true
});
_$clone_42.default = clone;

var __is_42 = ___interopRequireWildcard_42(_$is_51);

var __arr_42 = ___interopRequireWildcard_42(_$arr_40);

function ___interopRequireWildcard_42(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function clone(source) {
  var dest = {};

  for (var prop in source) {
    var value = source[prop];

    if (__is_42.plainObject(value)) {
      dest[prop] = clone(value);
    } else if (__is_42.array(value)) {
      dest[prop] = __arr_42.from(value);
    } else {
      dest[prop] = value;
    }
  }

  return dest;
}

var _$domUtils_44 = {};
"use strict";

Object.defineProperty(_$domUtils_44, "__esModule", {
  value: true
});
_$domUtils_44.nodeContains = nodeContains;
_$domUtils_44.closest = closest;
_$domUtils_44.parentNode = parentNode;
_$domUtils_44.matchesSelector = matchesSelector;
_$domUtils_44.indexOfDeepestElement = indexOfDeepestElement;
_$domUtils_44.matchesUpTo = matchesUpTo;
_$domUtils_44.getActualElement = getActualElement;
_$domUtils_44.getScrollXY = getScrollXY;
_$domUtils_44.getElementClientRect = getElementClientRect;
_$domUtils_44.getElementRect = getElementRect;
_$domUtils_44.getPath = getPath;
_$domUtils_44.trySelector = trySelector;

var ___window_44 = ___interopRequireDefault_44(_$window_60);

var _browser = ___interopRequireDefault_44(_$browser_41);

var __is_44 = ___interopRequireWildcard_44(_$is_51);

var ___domObjects_44 = ___interopRequireDefault_44(_$domObjects_43);

function ___interopRequireWildcard_44(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function ___interopRequireDefault_44(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function nodeContains(parent, child) {
  while (child) {
    if (child === parent) {
      return true;
    }

    child = child.parentNode;
  }

  return false;
}

function closest(element, selector) {
  while (__is_44.element(element)) {
    if (matchesSelector(element, selector)) {
      return element;
    }

    element = parentNode(element);
  }

  return null;
}

function parentNode(node) {
  var parent = node.parentNode;

  if (__is_44.docFrag(parent)) {
    // skip past #shado-root fragments
    while ((parent = parent.host) && __is_44.docFrag(parent)) {
      continue;
    }

    return parent;
  }

  return parent;
}

function matchesSelector(element, selector) {
  // remove /deep/ from selectors if shadowDOM polyfill is used
  if (___window_44.default.window !== ___window_44.default.realWindow) {
    selector = selector.replace(/\/deep\//g, ' ');
  }

  return element[_browser.default.prefixedMatchesSelector](selector);
} // Test for the element that's "above" all other qualifiers


function indexOfDeepestElement(elements) {
  var deepestZoneParents = [];
  var dropzoneParents = [];
  var dropzone;
  var deepestZone = elements[0];
  var index = deepestZone ? 0 : -1;
  var parent;
  var child;
  var i;
  var n;

  for (i = 1; i < elements.length; i++) {
    dropzone = elements[i]; // an element might belong to multiple selector dropzones

    if (!dropzone || dropzone === deepestZone) {
      continue;
    }

    if (!deepestZone) {
      deepestZone = dropzone;
      index = i;
      continue;
    } // check if the deepest or current are document.documentElement or document.rootElement
    // - if the current dropzone is, do nothing and continue


    if (dropzone.parentNode === dropzone.ownerDocument) {
      continue;
    } // - if deepest is, update with the current dropzone and continue to next
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
    } // if this element is an svg element and the current deepest is
    // an HTMLElement


    if (deepestZone instanceof ___domObjects_44.default.HTMLElement && dropzone instanceof ___domObjects_44.default.SVGElement && !(dropzone instanceof ___domObjects_44.default.SVGSVGElement)) {
      if (dropzone === deepestZone.parentNode) {
        continue;
      }

      parent = dropzone.ownerSVGElement;
    } else {
      parent = dropzone;
    }

    dropzoneParents = [];

    while (parent.parentNode !== parent.ownerDocument) {
      dropzoneParents.unshift(parent);
      parent = parent.parentNode;
    }

    n = 0; // get (position of last common ancestor) + 1

    while (dropzoneParents[n] && dropzoneParents[n] === deepestZoneParents[n]) {
      n++;
    }

    var parents = [dropzoneParents[n - 1], dropzoneParents[n], deepestZoneParents[n]];
    child = parents[0].lastChild;

    while (child) {
      if (child === parents[1]) {
        deepestZone = dropzone;
        index = i;
        deepestZoneParents = [];
        break;
      } else if (child === parents[2]) {
        break;
      }

      child = child.previousSibling;
    }
  }

  return index;
}

function matchesUpTo(element, selector, limit) {
  while (__is_44.element(element)) {
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
  return element instanceof ___domObjects_44.default.SVGElementInstance ? element.correspondingUseElement : element;
}

function getScrollXY(relevantWindow) {
  relevantWindow = relevantWindow || ___window_44.default.window;
  return {
    x: relevantWindow.scrollX || relevantWindow.document.documentElement.scrollLeft,
    y: relevantWindow.scrollY || relevantWindow.document.documentElement.scrollTop
  };
}

function getElementClientRect(element) {
  var clientRect = element instanceof ___domObjects_44.default.SVGElement ? element.getBoundingClientRect() : element.getClientRects()[0];
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

  if (!_browser.default.isIOS7 && clientRect) {
    var scroll = getScrollXY(___window_44.default.getWindow(element));
    clientRect.left += scroll.x;
    clientRect.right += scroll.x;
    clientRect.top += scroll.y;
    clientRect.bottom += scroll.y;
  }

  return clientRect;
}

function getPath(element) {
  var path = [];

  while (element) {
    path.push(element);
    element = parentNode(element);
  }

  return path;
}

function trySelector(value) {
  if (!__is_44.string(value)) {
    return false;
  } // an exception will be raised if it is invalid


  ___domObjects_44.default.document.querySelector(value);

  return true;
}

var _$pointerExtend_54 = {};
"use strict";

Object.defineProperty(_$pointerExtend_54, "__esModule", {
  value: true
});
_$pointerExtend_54.default = pointerExtend;

function pointerExtend(dest, source) {
  for (var prop in source) {
    var prefixedPropREs = pointerExtend.prefixedPropREs;
    var deprecated = false; // skip deprecated prefixed properties

    for (var vendor in prefixedPropREs) {
      if (prop.indexOf(vendor) === 0 && prefixedPropREs[vendor].test(prop)) {
        deprecated = true;
        break;
      }
    }

    if (!deprecated && typeof source[prop] !== 'function') {
      dest[prop] = source[prop];
    }
  }

  return dest;
}

pointerExtend.prefixedPropREs = {
  webkit: /(Movement[XY]|Radius[XY]|RotationAngle|Force)$/
};

var _$hypot_48 = {};
"use strict";

Object.defineProperty(_$hypot_48, "__esModule", {
  value: true
});
_$hypot_48.default = void 0;

var ___default_48 = function _default(x, y) {
  return Math.sqrt(x * x + y * y);
};

_$hypot_48.default = ___default_48;

var _$pointerUtils_55 = {};
"use strict";

Object.defineProperty(_$pointerUtils_55, "__esModule", {
  value: true
});
_$pointerUtils_55.default = void 0;

var _hypot = ___interopRequireDefault_55(_$hypot_48);

var ___browser_55 = ___interopRequireDefault_55(_$browser_41);

var ___domObjects_55 = ___interopRequireDefault_55(_$domObjects_43);

var domUtils = ___interopRequireWildcard_55(_$domUtils_44);

var __is_55 = ___interopRequireWildcard_55(_$is_51);

var _pointerExtend = ___interopRequireDefault_55(_$pointerExtend_54);

function ___interopRequireWildcard_55(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function ___interopRequireDefault_55(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pointerUtils = {
  copyCoords: function copyCoords(dest, src) {
    dest.page = dest.page || {};
    dest.page.x = src.page.x;
    dest.page.y = src.page.y;
    dest.client = dest.client || {};
    dest.client.x = src.client.x;
    dest.client.y = src.client.y;
    dest.timeStamp = src.timeStamp;
  },
  setCoordDeltas: function setCoordDeltas(targetObj, prev, cur) {
    targetObj.page.x = cur.page.x - prev.page.x;
    targetObj.page.y = cur.page.y - prev.page.y;
    targetObj.client.x = cur.client.x - prev.client.x;
    targetObj.client.y = cur.client.y - prev.client.y;
    targetObj.timeStamp = cur.timeStamp - prev.timeStamp;
  },
  setCoordVelocity: function setCoordVelocity(targetObj, delta) {
    var dt = Math.max(delta.timeStamp / 1000, 0.001);
    targetObj.page.x = delta.page.x / dt;
    targetObj.page.y = delta.page.y / dt;
    targetObj.client.x = delta.client.x / dt;
    targetObj.client.y = delta.client.y / dt;
    targetObj.timeStamp = dt;
  },
  isNativePointer: function isNativePointer(pointer) {
    return pointer instanceof ___domObjects_55.default.Event || pointer instanceof ___domObjects_55.default.Touch;
  },
  // Get specified X/Y coords for mouse or event.touches[0]
  getXY: function getXY(type, pointer, xy) {
    xy = xy || {};
    type = type || 'page';
    xy.x = pointer[type + 'X'];
    xy.y = pointer[type + 'Y'];
    return xy;
  },
  getPageXY: function getPageXY(pointer, page) {
    page = page || {}; // Opera Mobile handles the viewport and scrolling oddly

    if (___browser_55.default.isOperaMobile && pointerUtils.isNativePointer(pointer)) {
      pointerUtils.getXY('screen', pointer, page);
      page.x += window.scrollX;
      page.y += window.scrollY;
    } else {
      pointerUtils.getXY('page', pointer, page);
    }

    return page;
  },
  getClientXY: function getClientXY(pointer, client) {
    client = client || {};

    if (___browser_55.default.isOperaMobile && pointerUtils.isNativePointer(pointer)) {
      // Opera Mobile handles the viewport and scrolling oddly
      pointerUtils.getXY('screen', pointer, client);
    } else {
      pointerUtils.getXY('client', pointer, client);
    }

    return client;
  },
  getPointerId: function getPointerId(pointer) {
    return __is_55.number(pointer.pointerId) ? pointer.pointerId : pointer.identifier;
  },
  setCoords: function setCoords(targetObj, pointers, timeStamp) {
    var pointer = pointers.length > 1 ? pointerUtils.pointerAverage(pointers) : pointers[0];
    var tmpXY = {};
    pointerUtils.getPageXY(pointer, tmpXY);
    targetObj.page.x = tmpXY.x;
    targetObj.page.y = tmpXY.y;
    pointerUtils.getClientXY(pointer, tmpXY);
    targetObj.client.x = tmpXY.x;
    targetObj.client.y = tmpXY.y;
    targetObj.timeStamp = __is_55.number(timeStamp) ? timeStamp : new Date().getTime();
  },
  pointerExtend: _pointerExtend.default,
  getTouchPair: function getTouchPair(event) {
    var touches = []; // array of touches is supplied

    if (__is_55.array(event)) {
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
  },
  pointerAverage: function pointerAverage(pointers) {
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
  },
  touchBBox: function touchBBox(event) {
    if (!event.length && !(event.touches && event.touches.length > 1)) {
      return;
    }

    var touches = pointerUtils.getTouchPair(event);
    var minX = Math.min(touches[0].pageX, touches[1].pageX);
    var minY = Math.min(touches[0].pageY, touches[1].pageY);
    var maxX = Math.max(touches[0].pageX, touches[1].pageX);
    var maxY = Math.max(touches[0].pageY, touches[1].pageY);
    return {
      x: minX,
      y: minY,
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  },
  touchDistance: function touchDistance(event, deltaSource) {
    var sourceX = deltaSource + 'X';
    var sourceY = deltaSource + 'Y';
    var touches = pointerUtils.getTouchPair(event);
    var dx = touches[0][sourceX] - touches[1][sourceX];
    var dy = touches[0][sourceY] - touches[1][sourceY];
    return (0, _hypot.default)(dx, dy);
  },
  touchAngle: function touchAngle(event, prevAngle, deltaSource) {
    var sourceX = deltaSource + 'X';
    var sourceY = deltaSource + 'Y';
    var touches = pointerUtils.getTouchPair(event);
    var dx = touches[1][sourceX] - touches[0][sourceX];
    var dy = touches[1][sourceY] - touches[0][sourceY];
    var angle = 180 * Math.atan2(dy, dx) / Math.PI;
    return angle;
  },
  getPointerType: function getPointerType(pointer) {
    return __is_55.string(pointer.pointerType) ? pointer.pointerType : __is_55.number(pointer.pointerType) ? [undefined, undefined, 'touch', 'pen', 'mouse'][pointer.pointerType] // if the PointerEvent API isn't available, then the "pointer" must
    // be either a MouseEvent, TouchEvent, or Touch object
    : /touch/.test(pointer.type) || pointer instanceof ___domObjects_55.default.Touch ? 'touch' : 'mouse';
  },
  // [ event.target, event.currentTarget ]
  getEventTargets: function getEventTargets(event) {
    var path = __is_55.func(event.composedPath) ? event.composedPath() : event.path;
    return [domUtils.getActualElement(path ? path[0] : event.target), domUtils.getActualElement(event.currentTarget)];
  },
  newCoords: function newCoords() {
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
  },
  coordsToEvent: function coordsToEvent(_ref2) {
    var page = _ref2.page,
        client = _ref2.client,
        timeStamp = _ref2.timeStamp;
    return {
      page: page,
      client: client,
      timeStamp: timeStamp,

      get pageX() {
        return page.x;
      },

      get pageY() {
        return page.y;
      },

      get clientX() {
        return client.x;
      },

      get clientY() {
        return client.y;
      }

    };
  }
};
var ___default_55 = pointerUtils;
_$pointerUtils_55.default = ___default_55;

var _$events_45 = {};
"use strict";

Object.defineProperty(_$events_45, "__esModule", {
  value: true
});
_$events_45.default = void 0;

var __is_45 = ___interopRequireWildcard_45(_$is_51);

var __domUtils_45 = ___interopRequireWildcard_45(_$domUtils_44);

var _pointerUtils = ___interopRequireDefault_45(_$pointerUtils_55);

var ___pointerExtend_45 = ___interopRequireDefault_45(_$pointerExtend_54);

/* removed: var _$arr_40 = require("./arr"); */;

function ___interopRequireDefault_45(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___interopRequireWildcard_45(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var elements = [];
var targets = []; // {
//   type: {
//     selectors: ['selector', ...],
//     contexts : [document, ...],
//     listeners: [[listener, capture, passive], ...]
//   }
//  }

var delegatedEvents = {};
var documents = [];

function add(element, type, listener, optionalArg) {
  var options = getOptions(optionalArg);
  var elementIndex = elements.indexOf(element);
  var target = targets[elementIndex];

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

  if (!(0, _$arr_40.contains)(target.events[type], listener)) {
    element.addEventListener(type, listener, events.supportsOptions ? options : !!options.capture);
    target.events[type].push(listener);
  }
}

function __remove_45(element, type, listener, optionalArg) {
  var options = getOptions(optionalArg);
  var elementIndex = elements.indexOf(element);
  var target = targets[elementIndex];

  if (!target || !target.events) {
    return;
  }

  if (type === 'all') {
    for (type in target.events) {
      if (target.events.hasOwnProperty(type)) {
        __remove_45(element, type, 'all');
      }
    }

    return;
  }

  if (target.events[type]) {
    var len = target.events[type].length;

    if (listener === 'all') {
      for (var i = 0; i < len; i++) {
        __remove_45(element, type, target.events[type][i], options);
      }

      return;
    } else {
      for (var _i = 0; _i < len; _i++) {
        if (target.events[type][_i] === listener) {
          element.removeEventListener(type, listener, events.supportsOptions ? options : !!options.capture);
          target.events[type].splice(_i, 1);
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
  var options = getOptions(optionalArg);

  if (!delegatedEvents[type]) {
    delegatedEvents[type] = {
      selectors: [],
      contexts: [],
      listeners: []
    }; // add delegate listener functions

    for (var _i2 = 0; _i2 < documents.length; _i2++) {
      var doc = documents[_i2];
      add(doc, type, delegateListener);
      add(doc, type, delegateUseCapture, true);
    }
  }

  var delegated = delegatedEvents[type];
  var index;

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
  var options = getOptions(optionalArg);
  var delegated = delegatedEvents[type];
  var matchFound = false;
  var index;

  if (!delegated) {
    return;
  } // count from last index of delegated to 0


  for (index = delegated.selectors.length - 1; index >= 0; index--) {
    // look for matching selector and context Node
    if (delegated.selectors[index] === selector && delegated.contexts[index] === context) {
      var listeners = delegated.listeners[index]; // each item of the listeners array is an array: [function, capture, passive]

      for (var i = listeners.length - 1; i >= 0; i--) {
        var _listeners$i = _slicedToArray(listeners[i], 3),
            fn = _listeners$i[0],
            capture = _listeners$i[1],
            passive = _listeners$i[2]; // check if the listener functions and capture and passive flags match


        if (fn === listener && capture === !!options.capture && passive === options.passive) {
          // remove the listener from the array of listeners
          listeners.splice(i, 1); // if all listeners for this interactable have been removed
          // remove the interactable from the delegated arrays

          if (!listeners.length) {
            delegated.selectors.splice(index, 1);
            delegated.contexts.splice(index, 1);
            delegated.listeners.splice(index, 1); // remove delegate function from context

            __remove_45(context, type, delegateListener);
            __remove_45(context, type, delegateUseCapture, true); // remove the arrays if they are empty

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
  var options = getOptions(optionalArg);
  var fakeEvent = {};
  var delegated = delegatedEvents[event.type];

  var _pointerUtils$getEven = _pointerUtils.default.getEventTargets(event),
      _pointerUtils$getEven2 = _slicedToArray(_pointerUtils$getEven, 1),
      eventTarget = _pointerUtils$getEven2[0];

  var element = eventTarget; // duplicate the event so that currentTarget can be changed

  (0, ___pointerExtend_45.default)(fakeEvent, event);
  fakeEvent.originalEvent = event;
  fakeEvent.preventDefault = preventOriginalDefault; // climb up document tree looking for selector matches

  while (__is_45.element(element)) {
    for (var i = 0; i < delegated.selectors.length; i++) {
      var selector = delegated.selectors[i];
      var context = delegated.contexts[i];

      if (__domUtils_45.matchesSelector(element, selector) && __domUtils_45.nodeContains(context, eventTarget) && __domUtils_45.nodeContains(context, element)) {
        var listeners = delegated.listeners[i];
        fakeEvent.currentTarget = element;

        for (var j = 0; j < listeners.length; j++) {
          var _listeners$j = _slicedToArray(listeners[j], 3),
              fn = _listeners$j[0],
              capture = _listeners$j[1],
              passive = _listeners$j[2];

          if (capture === !!options.capture && passive === options.passive) {
            fn(fakeEvent);
          }
        }
      }
    }

    element = __domUtils_45.parentNode(element);
  }
}

function delegateUseCapture(event) {
  return delegateListener.call(this, event, true);
}

function preventOriginalDefault() {
  this.originalEvent.preventDefault();
}

function getOptions(param) {
  return __is_45.object(param) ? param : {
    capture: param
  };
}

var events = {
  add: add,
  remove: __remove_45,
  addDelegate: addDelegate,
  removeDelegate: removeDelegate,
  delegateListener: delegateListener,
  delegateUseCapture: delegateUseCapture,
  delegatedEvents: delegatedEvents,
  documents: documents,
  supportsOptions: false,
  supportsPassive: false,
  _elements: elements,
  _targets: targets,
  init: function init(window) {
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
var ___default_45 = events;
_$events_45.default = ___default_45;

var _$extend_46 = {};
"use strict";

Object.defineProperty(_$extend_46, "__esModule", {
  value: true
});
_$extend_46.default = extend;

function extend(dest, source) {
  for (var prop in source) {
    dest[prop] = source[prop];
  }

  return dest;
}

var _$rect_57 = {};
"use strict";

Object.defineProperty(_$rect_57, "__esModule", {
  value: true
});
_$rect_57.getStringOptionResult = getStringOptionResult;
_$rect_57.resolveRectLike = resolveRectLike;
_$rect_57.rectToXY = rectToXY;
_$rect_57.xywhToTlbr = xywhToTlbr;
_$rect_57.tlbrToXywh = tlbrToXywh;
_$rect_57.default = void 0;

var _extend = ___interopRequireDefault_57(_$extend_46);

var __is_57 = ___interopRequireWildcard_57(_$is_51);

/* removed: var _$domUtils_44 = require("./domUtils"); */;

function ___interopRequireWildcard_57(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function ___interopRequireDefault_57(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getStringOptionResult(value, interactable, element) {
  if (!__is_57.string(value)) {
    return null;
  }

  if (value === 'parent') {
    value = (0, _$domUtils_44.parentNode)(element);
  } else if (value === 'self') {
    value = interactable.getRect(element);
  } else {
    value = (0, _$domUtils_44.closest)(element, value);
  }

  return value;
}

function resolveRectLike(value, interactable, element, functionArgs) {
  value = getStringOptionResult(value, interactable, element) || value;

  if (__is_57.func(value)) {
    value = value.apply(null, functionArgs);
  }

  if (__is_57.element(value)) {
    value = (0, _$domUtils_44.getElementRect)(value);
  }

  return value;
}

function rectToXY(rect) {
  return rect && {
    x: 'x' in rect ? rect.x : rect.left,
    y: 'y' in rect ? rect.y : rect.top
  };
}

function xywhToTlbr(rect) {
  if (rect && !('left' in rect && 'top' in rect)) {
    rect = (0, _extend.default)({}, rect);
    rect.left = rect.x || 0;
    rect.top = rect.y || 0;
    rect.right = rect.right || rect.left + rect.width;
    rect.bottom = rect.bottom || rect.top + rect.height;
  }

  return rect;
}

function tlbrToXywh(rect) {
  if (rect && !('x' in rect && 'y' in rect)) {
    rect = (0, _extend.default)({}, rect);
    rect.x = rect.left || 0;
    rect.y = rect.top || 0;
    rect.width = rect.width || rect.right - rect.x;
    rect.height = rect.height || rect.bottom - rect.y;
  }

  return rect;
}

var ___default_57 = {
  getStringOptionResult: getStringOptionResult,
  resolveRectLike: resolveRectLike,
  rectToXY: rectToXY,
  xywhToTlbr: xywhToTlbr,
  tlbrToXywh: tlbrToXywh
};
_$rect_57.default = ___default_57;

var _$getOriginXY_47 = {};
"use strict";

Object.defineProperty(_$getOriginXY_47, "__esModule", {
  value: true
});
_$getOriginXY_47.default = ___default_47;

/* removed: var _$rect_57 = require("./rect"); */;

function ___default_47(target, element, action) {
  var actionOptions = target.options[action];
  var actionOrigin = actionOptions && actionOptions.origin;
  var origin = actionOrigin || target.options.origin;
  var originRect = (0, _$rect_57.resolveRectLike)(origin, target, element, [target && element]);
  return (0, _$rect_57.rectToXY)(originRect) || {
    x: 0,
    y: 0
  };
}

var _$normalizeListeners_53 = {};
"use strict";

Object.defineProperty(_$normalizeListeners_53, "__esModule", {
  value: true
});
_$normalizeListeners_53.default = normalize;

var __is_53 = ___interopRequireWildcard_53(_$is_51);

var ___extend_53 = ___interopRequireDefault_53(_$extend_46);

function ___interopRequireDefault_53(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___interopRequireWildcard_53(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function normalize(type, listener, result) {
  result = result || {};

  if (__is_53.string(type) && type.search(' ') !== -1) {
    type = split(type);
  }

  if (__is_53.array(type)) {
    return type.reduce(function (acc, t) {
      return (0, ___extend_53.default)(acc, normalize(t, listener, result));
    }, {});
  } // ({ type: fn }) -> ('', { type: fn })


  if (__is_53.object(type)) {
    listener = type;
    type = '';
  }

  if (__is_53.func(listener)) {
    result[type] = result[type] || [];
    result[type].push(listener);
  } else if (__is_53.array(listener)) {
    for (var _i = 0; _i < listener.length; _i++) {
      var _ref;

      _ref = listener[_i];
      var l = _ref;
      normalize(type, l, result);
    }
  } else if (__is_53.object(listener)) {
    for (var prefix in listener) {
      var combinedTypes = split(prefix).map(function (p) {
        return "".concat(type).concat(p);
      });
      normalize(combinedTypes, listener[prefix], result);
    }
  }

  return result;
}

function split(type) {
  return type.trim().split(/ +/);
}

var _$raf_56 = {};
"use strict";

Object.defineProperty(_$raf_56, "__esModule", {
  value: true
});
_$raf_56.default = void 0;
var lastTime = 0;

var _request;

var _cancel;

function __init_56(window) {
  _request = window.requestAnimationFrame;
  _cancel = window.cancelAnimationFrame;

  if (!_request) {
    var vendors = ['ms', 'moz', 'webkit', 'o'];

    for (var _i = 0; _i < vendors.length; _i++) {
      var vendor = vendors[_i];
      _request = window["".concat(vendor, "RequestAnimationFrame")];
      _cancel = window["".concat(vendor, "CancelAnimationFrame")] || window["".concat(vendor, "CancelRequestAnimationFrame")];
    }
  }

  if (!_request) {
    _request = function request(callback) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var token = setTimeout(function () {
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

var ___default_56 = {
  request: function request(callback) {
    return _request(callback);
  },
  cancel: function cancel(token) {
    return _cancel(token);
  },
  init: __init_56
};
_$raf_56.default = ___default_56;

var _$utils_49 = {};
"use strict";

Object.defineProperty(_$utils_49, "__esModule", {
  value: true
});
_$utils_49.warnOnce = warnOnce;
_$utils_49._getQBezierValue = _getQBezierValue;
_$utils_49.getQuadraticCurvePoint = getQuadraticCurvePoint;
_$utils_49.easeOutQuad = easeOutQuad;
_$utils_49.copyAction = copyAction;
Object.defineProperty(_$utils_49, "win", {
  enumerable: true,
  get: function get() {
    return ___window_49.default;
  }
});
Object.defineProperty(_$utils_49, "browser", {
  enumerable: true,
  get: function get() {
    return ___browser_49.default;
  }
});
Object.defineProperty(_$utils_49, "Signals", {
  enumerable: true,
  get: function get() {
    return _Signals.default;
  }
});
Object.defineProperty(_$utils_49, "raf", {
  enumerable: true,
  get: function get() {
    return _raf.default;
  }
});
Object.defineProperty(_$utils_49, "extend", {
  enumerable: true,
  get: function get() {
    return ___extend_49.default;
  }
});
Object.defineProperty(_$utils_49, "clone", {
  enumerable: true,
  get: function get() {
    return _clone.default;
  }
});
Object.defineProperty(_$utils_49, "getOriginXY", {
  enumerable: true,
  get: function get() {
    return _getOriginXY.default;
  }
});
Object.defineProperty(_$utils_49, "pointer", {
  enumerable: true,
  get: function get() {
    return ___pointerUtils_49.default;
  }
});
Object.defineProperty(_$utils_49, "rect", {
  enumerable: true,
  get: function get() {
    return ___rect_49.default;
  }
});
Object.defineProperty(_$utils_49, "events", {
  enumerable: true,
  get: function get() {
    return _events.default;
  }
});
Object.defineProperty(_$utils_49, "hypot", {
  enumerable: true,
  get: function get() {
    return ___hypot_49.default;
  }
});
Object.defineProperty(_$utils_49, "normalizeListeners", {
  enumerable: true,
  get: function get() {
    return _normalizeListeners.default;
  }
});
_$utils_49.is = _$utils_49.dom = _$utils_49.arr = void 0;

var ___window_49 = ___interopRequireDefault_49(_$window_60);

var __arr_49 = ___interopRequireWildcard_49(_$arr_40);

_$utils_49.arr = __arr_49;

var dom = ___interopRequireWildcard_49(_$domUtils_44);

_$utils_49.dom = dom;

var __is_49 = ___interopRequireWildcard_49(_$is_51);

_$utils_49.is = __is_49;

var ___browser_49 = ___interopRequireDefault_49(_$browser_41);

var _Signals = ___interopRequireDefault_49(_$Signals_39);

var _raf = ___interopRequireDefault_49(_$raf_56);

var ___extend_49 = ___interopRequireDefault_49(_$extend_46);

var _clone = ___interopRequireDefault_49(_$clone_42);

var _getOriginXY = ___interopRequireDefault_49(_$getOriginXY_47);

var ___pointerUtils_49 = ___interopRequireDefault_49(_$pointerUtils_55);

var ___rect_49 = ___interopRequireDefault_49(_$rect_57);

var _events = ___interopRequireDefault_49(_$events_45);

var ___hypot_49 = ___interopRequireDefault_49(_$hypot_48);

var _normalizeListeners = ___interopRequireDefault_49(_$normalizeListeners_53);

function ___interopRequireWildcard_49(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function ___interopRequireDefault_49(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function warnOnce(method, message) {
  var warned = false;
  return function () {
    if (!warned) {
      ___window_49.default.window.console.warn(message);

      warned = true;
    }

    return method.apply(this, arguments);
  };
} // http://stackoverflow.com/a/5634528/2280888


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

function copyAction(dest, src) {
  dest.name = src.name;
  dest.axis = src.axis;
  dest.edges = src.edges;
  return dest;
}

var _$drop_3 = {};
"use strict";

Object.defineProperty(_$drop_3, "__esModule", {
  value: true
});
_$drop_3.default = void 0;

var utils = ___interopRequireWildcard_3(_$utils_49);

var _DropEvent = ___interopRequireDefault_3(_$DropEvent_2);

function ___interopRequireDefault_3(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___interopRequireWildcard_3(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function __install_3(scope) {
  var actions = scope.actions,
      interact = scope.interact,
      Interactable = scope.Interactable,
      interactions = scope.interactions,
      defaults = scope.defaults;
  interactions.signals.on('after-action-start', function (_ref) {
    var interaction = _ref.interaction,
        event = _ref.event,
        dragEvent = _ref.iEvent;

    if (interaction.prepared.name !== 'drag') {
      return;
    }

    var dropStatus = interaction.dropStatus; // reset active dropzones

    dropStatus.activeDrops = null;
    dropStatus.events = null;

    if (!scope.dynamicDrop) {
      dropStatus.activeDrops = getActiveDrops(scope, interaction.element);
    }

    dropStatus.events = getDropEvents(interaction, event, dragEvent);

    if (dropStatus.events.activate) {
      fireActivationEvents(dropStatus.activeDrops, dropStatus.events.activate);
    }
  });
  interactions.signals.on('action-move', function (arg) {
    return onEventCreated(arg, scope);
  });
  interactions.signals.on('action-end', function (arg) {
    return onEventCreated(arg, scope);
  });
  interactions.signals.on('after-action-move', function (_ref2) {
    var interaction = _ref2.interaction;

    if (interaction.prepared.name !== 'drag') {
      return;
    }

    fireDropEvents(interaction, interaction.dropStatus.events);
    interaction.dropStatus.events = {};
  });
  interactions.signals.on('after-action-end', function (_ref3) {
    var interaction = _ref3.interaction;

    if (interaction.prepared.name === 'drag') {
      fireDropEvents(interaction, interaction.dropStatus.events);
    }
  });
  interactions.signals.on('stop', function (_ref4) {
    var interaction = _ref4.interaction;
    interaction.dropStatus.activeDrops = null;
    interaction.dropStatus.events = null;
  });
  interactions.signals.on('new', function (interaction) {
    interaction.dropStatus = {
      cur: {
        dropzone: null,
        // the dropzone a drag target might be dropped into
        element: null // the element at the time of checking

      },
      prev: {
        dropzone: null,
        // the dropzone that was recently dragged away from
        element: null // the element at the time of checking

      },
      rejected: false,
      // wheather the potential drop was rejected from a listener
      events: null,
      // the drop events related to the current drag event
      activeDrops: null // an array of { dropzone, element, rect }

    };
  });
  interactions.signals.on('stop', function (_ref5) {
    var dropStatus = _ref5.interaction.dropStatus;
    dropStatus.cur.dropzone = dropStatus.cur.element = dropStatus.prev.dropzone = dropStatus.prev.element = null;
    dropStatus.rejected = false;
  });

  Interactable.prototype.dropzone = function (options) {
    return dropzoneMethod(this, options);
  };

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
    if (utils.is.bool(newValue)) {
      //if (dragging && scope.dynamicDrop !== newValue && !newValue) {
      //  calcRects(dropzones);
      //}
      scope.dynamicDrop = newValue;
      return interact;
    }

    return scope.dynamicDrop;
  };

  utils.arr.merge(actions.eventTypes, ['dragenter', 'dragleave', 'dropactivate', 'dropdeactivate', 'dropmove', 'drop']);
  actions.methodDict.drop = 'dropzone';
  scope.dynamicDrop = false;
  defaults.drop = drop.defaults;
}

function collectDrops(_ref6, draggableElement) {
  var interactables = _ref6.interactables;
  var drops = []; // collect all dropzones and their elements which qualify for a drop

  for (var _i = 0; _i < interactables.list.length; _i++) {
    var _ref7;

    _ref7 = interactables.list[_i];
    var dropzone = _ref7;

    if (!dropzone.options.drop.enabled) {
      continue;
    }

    var accept = dropzone.options.drop.accept; // test the draggable draggableElement against the dropzone's accept setting

    if (utils.is.element(accept) && accept !== draggableElement || utils.is.string(accept) && !utils.dom.matchesSelector(draggableElement, accept) || utils.is.func(accept) && !accept({
      dropzone: dropzone,
      draggableElement: draggableElement
    })) {
      continue;
    } // query for new elements if necessary


    var dropElements = utils.is.string(dropzone.target) ? dropzone._context.querySelectorAll(dropzone.target) : utils.is.array(dropzone.target) ? dropzone.target : [dropzone.target];

    for (var _i2 = 0; _i2 < dropElements.length; _i2++) {
      var _ref8;

      _ref8 = dropElements[_i2];
      var dropzoneElement = _ref8;

      if (dropzoneElement !== draggableElement) {
        drops.push({
          dropzone: dropzone,
          element: dropzoneElement
        });
      }
    }
  }

  return drops;
}

function fireActivationEvents(activeDrops, event) {
  // loop through all active dropzones and trigger event
  for (var _i3 = 0; _i3 < activeDrops.length; _i3++) {
    var _ref9;

    _ref9 = activeDrops[_i3];
    var _ref10 = _ref9,
        dropzone = _ref10.dropzone,
        element = _ref10.element;
    event.dropzone = dropzone; // set current element as event target

    event.target = element;
    dropzone.fire(event);
    event.propagationStopped = event.immediatePropagationStopped = false;
  }
} // return a new array of possible drops. getActiveDrops should always be
// called when a drag has just started or a drag event happens while
// dynamicDrop is true


function getActiveDrops(scope, dragElement) {
  // get dropzones and their elements that could receive the draggable
  var activeDrops = collectDrops(scope, dragElement);

  for (var _i4 = 0; _i4 < activeDrops.length; _i4++) {
    var _ref11;

    _ref11 = activeDrops[_i4];
    var activeDrop = _ref11;
    activeDrop.rect = activeDrop.dropzone.getRect(activeDrop.element);
  }

  return activeDrops;
}

function getDrop(_ref12, dragEvent, pointerEvent) {
  var dropStatus = _ref12.dropStatus,
      draggable = _ref12.target,
      dragElement = _ref12.element;
  var validDrops = []; // collect all dropzones and their elements which qualify for a drop

  for (var _i5 = 0; _i5 < dropStatus.activeDrops.length; _i5++) {
    var _ref13;

    _ref13 = dropStatus.activeDrops[_i5];
    var _ref14 = _ref13,
        dropzone = _ref14.dropzone,
        dropzoneElement = _ref14.element,
        rect = _ref14.rect;
    validDrops.push(dropzone.dropCheck(dragEvent, pointerEvent, draggable, dragElement, dropzoneElement, rect) ? dropzoneElement : null);
  } // get the most appropriate dropzone based on DOM depth and order


  var dropIndex = utils.dom.indexOfDeepestElement(validDrops);
  return dropStatus.activeDrops[dropIndex] || null;
}

function getDropEvents(interaction, pointerEvent, dragEvent) {
  var dropStatus = interaction.dropStatus;
  var dropEvents = {
    enter: null,
    leave: null,
    activate: null,
    deactivate: null,
    move: null,
    drop: null
  };

  if (dragEvent.type === 'dragstart') {
    dropEvents.activate = new _DropEvent.default(dropStatus, dragEvent, 'dropactivate');
    dropEvents.activate.target = null;
    dropEvents.activate.dropzone = null;
  }

  if (dragEvent.type === 'dragend') {
    dropEvents.deactivate = new _DropEvent.default(dropStatus, dragEvent, 'dropdeactivate');
    dropEvents.deactivate.target = null;
    dropEvents.deactivate.dropzone = null;
  }

  if (dropStatus.rejected) {
    return dropEvents;
  }

  if (dropStatus.cur.element !== dropStatus.prev.element) {
    // if there was a previous dropzone, create a dragleave event
    if (dropStatus.prev.dropzone) {
      dropEvents.leave = new _DropEvent.default(dropStatus, dragEvent, 'dragleave');
      dragEvent.dragLeave = dropEvents.leave.target = dropStatus.prev.element;
      dragEvent.prevDropzone = dropEvents.leave.dropzone = dropStatus.prev.dropzone;
    } // if dropzone is not null, create a dragenter event


    if (dropStatus.cur.dropzone) {
      dropEvents.enter = new _DropEvent.default(dropStatus, dragEvent, 'dragenter');
      dragEvent.dragEnter = dropStatus.cur.element;
      dragEvent.dropzone = dropStatus.cur.dropzone;
    }
  }

  if (dragEvent.type === 'dragend' && dropStatus.cur.dropzone) {
    dropEvents.drop = new _DropEvent.default(dropStatus, dragEvent, 'drop');
    dragEvent.dropzone = dropStatus.cur.dropzone;
    dragEvent.relatedTarget = dropStatus.cur.element;
  }

  if (dragEvent.type === 'dragmove' && dropStatus.cur.dropzone) {
    dropEvents.move = new _DropEvent.default(dropStatus, dragEvent, 'dropmove');
    dropEvents.move.dragmove = dragEvent;
    dragEvent.dropzone = dropStatus.cur.dropzone;
  }

  return dropEvents;
}

function fireDropEvents(interaction, events) {
  var dropStatus = interaction.dropStatus;
  var activeDrops = dropStatus.activeDrops,
      cur = dropStatus.cur,
      prev = dropStatus.prev;

  if (events.leave) {
    prev.dropzone.fire(events.leave);
  }

  if (events.move) {
    cur.dropzone.fire(events.move);
  }

  if (events.enter) {
    cur.dropzone.fire(events.enter);
  }

  if (events.drop) {
    cur.dropzone.fire(events.drop);
  }

  if (events.deactivate) {
    fireActivationEvents(activeDrops, events.deactivate);
  }

  dropStatus.prev.dropzone = cur.dropzone;
  dropStatus.prev.element = cur.element;
}

function onEventCreated(_ref15, scope) {
  var interaction = _ref15.interaction,
      iEvent = _ref15.iEvent,
      event = _ref15.event;

  if (iEvent.type !== 'dragmove' && iEvent.type !== 'dragend') {
    return;
  }

  var dropStatus = interaction.dropStatus;

  if (scope.dynamicDrop) {
    dropStatus.activeDrops = getActiveDrops(scope, interaction.target, interaction.element);
  }

  var dragEvent = iEvent;
  var dropResult = getDrop(interaction, dragEvent, event); // update rejected status

  dropStatus.rejected = dropStatus.rejected && !!dropResult && dropResult.dropzone === dropStatus.cur.dropzone && dropResult.element === dropStatus.cur.element;
  dropStatus.cur.dropzone = dropResult && dropResult.dropzone;
  dropStatus.cur.element = dropResult && dropResult.element;
  dropStatus.events = getDropEvents(interaction, event, dragEvent);
}
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
 *   return dropped && event.target.hasAttribute('allow-drop');
 * }
 * ```
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
 * @return {boolean | Interactable} The current setting or this Interactable
 */


function dropzoneMethod(interactable, options) {
  if (utils.is.object(options)) {
    interactable.options.drop.enabled = options.enabled === false ? false : true;

    if (options.listeners) {
      var normalized = utils.normalizeListeners(options.listeners); // rename 'drop' to '' as it will be prefixed with 'drop'

      var corrected = Object.keys(normalized).reduce(function (acc, type) {
        var correctedType = /^(enter|leave)/.test(type) ? "drag".concat(type) : /^(activate|deactivate|move)/.test(type) ? "drop".concat(type) : type;
        acc[correctedType] = normalized[type];
        return acc;
      }, {});
      interactable.off(interactable.options.drop.listeners);
      interactable.on(corrected);
      interactable.options.drop.listeners = corrected;
    }

    if (utils.is.func(options.ondrop)) {
      interactable.on('drop', options.ondrop);
    }

    if (utils.is.func(options.ondropactivate)) {
      interactable.on('dropactivate', options.ondropactivate);
    }

    if (utils.is.func(options.ondropdeactivate)) {
      interactable.on('dropdeactivate', options.ondropdeactivate);
    }

    if (utils.is.func(options.ondragenter)) {
      interactable.on('dragenter', options.ondragenter);
    }

    if (utils.is.func(options.ondragleave)) {
      interactable.on('dragleave', options.ondragleave);
    }

    if (utils.is.func(options.ondropmove)) {
      interactable.on('dropmove', options.ondropmove);
    }

    if (/^(pointer|center)$/.test(options.overlap)) {
      interactable.options.drop.overlap = options.overlap;
    } else if (utils.is.number(options.overlap)) {
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

  if (utils.is.bool(options)) {
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
    var origin = utils.getOriginXY(draggable, draggableElement, 'drag');
    var page = utils.pointer.getPageXY(dragEvent);
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

  if (dragRect && utils.is.number(dropOverlap)) {
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
  install: __install_3,
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
_$drop_3.default = ___default_3;

var _$defaultOptions_17 = {};
"use strict";

Object.defineProperty(_$defaultOptions_17, "__esModule", {
  value: true
});
_$defaultOptions_17.default = void 0;
var ___default_17 = {
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
  }
};
_$defaultOptions_17.default = ___default_17;

var _$InteractEvent_14 = {};
"use strict";

Object.defineProperty(_$InteractEvent_14, "__esModule", {
  value: true
});
_$InteractEvent_14.default = void 0;

var ___extend_14 = ___interopRequireDefault_14(_$extend_46);

var ___getOriginXY_14 = ___interopRequireDefault_14(_$getOriginXY_47);

var _defaultOptions = ___interopRequireDefault_14(_$defaultOptions_17);

var ___hypot_14 = ___interopRequireDefault_14(_$hypot_48);

function ___interopRequireDefault_14(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___classCallCheck_14(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_14(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_14(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_14(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_14(Constructor, staticProps); return Constructor; }

var InteractEvent =
/*#__PURE__*/
function () {
  /** */
  function InteractEvent(interaction, event, actionName, phase, element, related, preEnd, type) {
    ___classCallCheck_14(this, InteractEvent);

    element = element || interaction.element;
    var target = interaction.target;
    var deltaSource = (target && target.options || _defaultOptions.default).deltaSource;
    var origin = (0, ___getOriginXY_14.default)(target, element, actionName);
    var starting = phase === 'start';
    var ending = phase === 'end';
    var prevEvent = starting ? this : interaction.prevEvent;
    var coords = starting ? interaction.coords.start : ending ? {
      page: prevEvent.page,
      client: prevEvent.client,
      timeStamp: interaction.coords.cur.timeStamp
    } : interaction.coords.cur;
    this.page = (0, ___extend_14.default)({}, coords.page);
    this.client = (0, ___extend_14.default)({}, coords.client);
    this.timeStamp = coords.timeStamp;

    if (!ending) {
      this.page.x -= origin.x;
      this.page.y -= origin.y;
      this.client.x -= origin.x;
      this.client.y -= origin.y;
    }

    this.ctrlKey = event.ctrlKey;
    this.altKey = event.altKey;
    this.shiftKey = event.shiftKey;
    this.metaKey = event.metaKey;
    this.button = event.button;
    this.buttons = event.buttons;
    this.target = element;
    this.currentTarget = element;
    this.relatedTarget = related || null;
    this.preEnd = preEnd;
    this.type = type || actionName + (phase || '');
    this.interaction = interaction;
    this.interactable = target;
    this.t0 = starting ? interaction.pointers[interaction.pointers.length - 1].downTime : prevEvent.t0;
    this.x0 = interaction.coords.start.page.x - origin.x;
    this.y0 = interaction.coords.start.page.y - origin.y;
    this.clientX0 = interaction.coords.start.client.x - origin.x;
    this.clientY0 = interaction.coords.start.client.y - origin.y;

    if (starting || ending) {
      this.delta = {
        x: 0,
        y: 0
      };
    } else {
      this.delta = {
        x: this[deltaSource].x - prevEvent[deltaSource].x,
        y: this[deltaSource].y - prevEvent[deltaSource].y
      };
    }

    this.dt = interaction.coords.delta.timeStamp;
    this.duration = this.timeStamp - this.t0; // velocity and speed in pixels per second

    this.velocity = (0, ___extend_14.default)({}, interaction.coords.velocity[deltaSource]);
    this.speed = (0, ___hypot_14.default)(this.velocity.x, this.velocity.y);
    this.swipe = ending || phase === 'inertiastart' ? this.getSwipe() : null;
  }

  ___createClass_14(InteractEvent, [{
    key: "getSwipe",
    value: function getSwipe() {
      var interaction = this.interaction;

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
    /** */

  }, {
    key: "stopImmediatePropagation",
    value: function stopImmediatePropagation() {
      this.immediatePropagationStopped = this.propagationStopped = true;
    }
    /** */

  }, {
    key: "stopPropagation",
    value: function stopPropagation() {
      this.propagationStopped = true;
    }
  }, {
    key: "pageX",
    get: function get() {
      return this.page.x;
    },
    set: function set(value) {
      this.page.x = value;
    }
  }, {
    key: "pageY",
    get: function get() {
      return this.page.y;
    },
    set: function set(value) {
      this.page.y = value;
    }
  }, {
    key: "clientX",
    get: function get() {
      return this.client.x;
    },
    set: function set(value) {
      this.client.x = value;
    }
  }, {
    key: "clientY",
    get: function get() {
      return this.client.y;
    },
    set: function set(value) {
      this.client.y = value;
    }
  }, {
    key: "dx",
    get: function get() {
      return this.delta.x;
    },
    set: function set(value) {
      this.delta.x = value;
    }
  }, {
    key: "dy",
    get: function get() {
      return this.delta.y;
    },
    set: function set(value) {
      this.delta.y = value;
    }
  }, {
    key: "velocityX",
    get: function get() {
      return this.velocity.x;
    },
    set: function set(value) {
      this.velocity.x = value;
    }
  }, {
    key: "velocityY",
    get: function get() {
      return this.velocity.y;
    },
    set: function set(value) {
      this.velocity.y = value;
    }
  }]);

  return InteractEvent;
}();

var ___default_14 = InteractEvent;
_$InteractEvent_14.default = ___default_14;

var _$gesture_4 = {};
"use strict";

Object.defineProperty(_$gesture_4, "__esModule", {
  value: true
});
_$gesture_4.default = void 0;

var __utils_4 = ___interopRequireWildcard_4(_$utils_49);

var _InteractEvent = ___interopRequireDefault_4(_$InteractEvent_14);

function ___interopRequireDefault_4(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___interopRequireWildcard_4(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function __install_4(scope) {
  var actions = scope.actions,
      Interactable = scope.Interactable,
      interactions = scope.interactions,
      defaults = scope.defaults;
  var gesture = {
    defaults: {},
    checker: function checker(pointer, event, interactable, element, interaction) {
      if (interaction.pointers.length >= 2) {
        return {
          name: 'gesture'
        };
      }

      return null;
    },
    getCursor: function getCursor() {
      return '';
    }
  };
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
   * });
   *
   * var isGestureable = interact(element).gesturable();
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
    if (__utils_4.is.object(options)) {
      this.options.gesture.enabled = options.enabled === false ? false : true;
      this.setPerAction('gesture', options);
      this.setOnEvents('gesture', options);
      return this;
    }

    if (__utils_4.is.bool(options)) {
      this.options.gesture.enabled = options;
      return this;
    }

    return this.options.gesture;
  };

  interactions.signals.on('action-start', updateGestureProps);
  interactions.signals.on('action-move', updateGestureProps);
  interactions.signals.on('action-end', updateGestureProps);
  interactions.signals.on('action-start', start);
  interactions.signals.on('action-move', __move_4);
  interactions.signals.on('new', function (interaction) {
    interaction.gesture = {
      start: {
        x: 0,
        y: 0
      },
      startDistance: 0,
      // distance between two touches of touchStart
      prevDistance: 0,
      distance: 0,
      scale: 1,
      // gesture.distance / gesture.startDistance
      startAngle: 0,
      // angle of line joining two touches
      prevAngle: 0 // angle of the previous gesture event

    };
  });
  actions.gesture = gesture;
  actions.names.push('gesture');
  __utils_4.arr.merge(actions.eventTypes, ['gesturestart', 'gesturemove', 'gestureend']);
  actions.methodDict.gesture = 'gesturable';
  defaults.gesture = gesture.defaults;
}

function start(_ref) {
  var iEvent = _ref.iEvent,
      interaction = _ref.interaction;

  if (interaction.prepared.name !== 'gesture') {
    return;
  }

  iEvent.ds = 0;
  interaction.gesture.startDistance = interaction.gesture.prevDistance = iEvent.distance;
  interaction.gesture.startAngle = interaction.gesture.prevAngle = iEvent.angle;
  interaction.gesture.scale = 1;
}

function __move_4(_ref2) {
  var iEvent = _ref2.iEvent,
      interaction = _ref2.interaction;

  if (interaction.prepared.name !== 'gesture') {
    return;
  }

  iEvent.ds = iEvent.scale - interaction.gesture.scale;
  interaction.target.fire(iEvent);
  interaction.gesture.prevAngle = iEvent.angle;
  interaction.gesture.prevDistance = iEvent.distance;

  if (iEvent.scale !== Infinity && iEvent.scale !== null && iEvent.scale !== undefined && !isNaN(iEvent.scale)) {
    interaction.gesture.scale = iEvent.scale;
  }
}

function updateGestureProps(_ref3) {
  var interaction = _ref3.interaction,
      iEvent = _ref3.iEvent,
      event = _ref3.event,
      phase = _ref3.phase;

  if (interaction.prepared.name !== 'gesture') {
    return;
  }

  var pointers = interaction.pointers.map(function (p) {
    return p.pointer;
  });
  var starting = phase === 'start';
  var ending = phase === 'end';
  var deltaSource = interaction.target.options.deltaSource;
  iEvent.touches = [pointers[0].pointer, pointers[1].pointer];

  if (starting) {
    iEvent.distance = __utils_4.pointer.touchDistance(pointers, deltaSource);
    iEvent.box = __utils_4.pointer.touchBBox(pointers);
    iEvent.scale = 1;
    iEvent.ds = 0;
    iEvent.angle = __utils_4.pointer.touchAngle(pointers, undefined, deltaSource);
    iEvent.da = 0;
  } else if (ending || event instanceof _InteractEvent.default) {
    iEvent.distance = interaction.prevEvent.distance;
    iEvent.box = interaction.prevEvent.box;
    iEvent.scale = interaction.prevEvent.scale;
    iEvent.ds = iEvent.scale - 1;
    iEvent.angle = interaction.prevEvent.angle;
    iEvent.da = iEvent.angle - interaction.gesture.startAngle;
  } else {
    iEvent.distance = __utils_4.pointer.touchDistance(pointers, deltaSource);
    iEvent.box = __utils_4.pointer.touchBBox(pointers);
    iEvent.scale = iEvent.distance / interaction.gesture.startDistance;
    iEvent.angle = __utils_4.pointer.touchAngle(pointers, interaction.gesture.prevAngle, deltaSource);
    iEvent.ds = iEvent.scale - interaction.gesture.prevScale;
    iEvent.da = iEvent.angle - interaction.gesture.prevAngle;
  }
}

var ___default_4 = {
  install: __install_4
};
_$gesture_4.default = ___default_4;

var _$resize_6 = {};
"use strict";

Object.defineProperty(_$resize_6, "__esModule", {
  value: true
});
_$resize_6.default = void 0;

var __utils_6 = ___interopRequireWildcard_6(_$utils_49);

function ___interopRequireWildcard_6(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function __install_6(scope) {
  var actions = scope.actions,
      browser = scope.browser,
      Interactable = scope.Interactable,
      interactions = scope.interactions,
      defaults = scope.defaults; // Less Precision with touch input

  var defaultMargin = browser.supportsTouch || browser.supportsPointerEvent ? 20 : 10;
  var resize = {
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
    checker: function checker(pointer, event, interactable, element, interaction, rect) {
      if (!rect) {
        return null;
      }

      var page = __utils_6.extend({}, interaction.coords.cur.page);
      var options = interactable.options;

      if (options.resize.enabled) {
        var resizeOptions = options.resize;
        var resizeEdges = {
          left: false,
          right: false,
          top: false,
          bottom: false
        }; // if using resize.edges

        if (__utils_6.is.object(resizeOptions.edges)) {
          for (var edge in resizeEdges) {
            resizeEdges[edge] = checkResizeEdge(edge, resizeOptions.edges[edge], page, interaction._eventTarget, element, rect, resizeOptions.margin || defaultMargin);
          }

          resizeEdges.left = resizeEdges.left && !resizeEdges.right;
          resizeEdges.top = resizeEdges.top && !resizeEdges.bottom;

          if (resizeEdges.left || resizeEdges.right || resizeEdges.top || resizeEdges.bottom) {
            return {
              name: 'resize',
              edges: resizeEdges
            };
          }
        } else {
          var right = options.resize.axis !== 'y' && page.x > rect.right - defaultMargin;
          var bottom = options.resize.axis !== 'x' && page.y > rect.bottom - defaultMargin;

          if (right || bottom) {
            return {
              name: 'resize',
              axes: (right ? 'x' : '') + (bottom ? 'y' : '')
            };
          }
        }
      }

      return null;
    },
    cursors: browser.isIe9 ? {
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
    },
    getCursor: function getCursor(action) {
      if (action.axis) {
        return resize.cursors[action.name + action.axis];
      } else if (action.edges) {
        var cursorKey = '';
        var edgeNames = ['top', 'bottom', 'left', 'right'];

        for (var i = 0; i < 4; i++) {
          if (action.edges[edgeNames[i]]) {
            cursorKey += edgeNames[i];
          }
        }

        return resize.cursors[cursorKey];
      }
    }
  };
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
   * });
   *
   * var isResizeable = interact(element).resizable();
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
    if (__utils_6.is.object(options)) {
      this.options.resize.enabled = options.enabled === false ? false : true;
      this.setPerAction('resize', options);
      this.setOnEvents('resize', options);

      if (/^x$|^y$|^xy$/.test(options.axis)) {
        this.options.resize.axis = options.axis;
      } else if (options.axis === null) {
        this.options.resize.axis = defaults.resize.axis;
      }

      if (__utils_6.is.bool(options.preserveAspectRatio)) {
        this.options.resize.preserveAspectRatio = options.preserveAspectRatio;
      } else if (__utils_6.is.bool(options.square)) {
        this.options.resize.square = options.square;
      }

      return this;
    }

    if (__utils_6.is.bool(options)) {
      this.options.resize.enabled = options;
      return this;
    }

    return this.options.resize;
  };

  interactions.signals.on('new', function (interaction) {
    interaction.resizeAxes = 'xy';
  });
  interactions.signals.on('action-start', __start_6);
  interactions.signals.on('action-move', __move_6);
  interactions.signals.on('action-start', updateEventAxes);
  interactions.signals.on('action-move', updateEventAxes);
  actions.resize = resize;
  actions.names.push('resize');
  __utils_6.arr.merge(actions.eventTypes, ['resizestart', 'resizemove', 'resizeinertiastart', 'resizeresume', 'resizeend']);
  actions.methodDict.resize = 'resizable';
  defaults.resize = resize.defaults;
}

function checkResizeEdge(name, value, page, element, interactableElement, rect, margin) {
  // false, '', undefined, null
  if (!value) {
    return false;
  } // true value, use pointer coords and element rect


  if (value === true) {
    // if dimensions are negative, "switch" edges
    var width = __utils_6.is.number(rect.width) ? rect.width : rect.right - rect.left;
    var height = __utils_6.is.number(rect.height) ? rect.height : rect.bottom - rect.top; // don't use margin greater than half the relevent dimension

    margin = Math.min(margin, (name === 'left' || name === 'right' ? width : height) / 2);

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
      return page.x < (width >= 0 ? rect.left : rect.right) + margin;
    }

    if (name === 'top') {
      return page.y < (height >= 0 ? rect.top : rect.bottom) + margin;
    }

    if (name === 'right') {
      return page.x > (width >= 0 ? rect.right : rect.left) - margin;
    }

    if (name === 'bottom') {
      return page.y > (height >= 0 ? rect.bottom : rect.top) - margin;
    }
  } // the remaining checks require an element


  if (!__utils_6.is.element(element)) {
    return false;
  }

  return __utils_6.is.element(value) // the value is an element to use as a resize handle
  ? value === element // otherwise check if element matches value as selector
  : __utils_6.dom.matchesUpTo(element, value, interactableElement);
}

function __start_6(_ref) {
  var iEvent = _ref.iEvent,
      interaction = _ref.interaction;

  if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) {
    return;
  }

  var startRect = interaction.target.getRect(interaction.element);
  var resizeOptions = interaction.target.options.resize;
  /*
   * When using the `resizable.square` or `resizable.preserveAspectRatio` options, resizing from one edge
   * will affect another. E.g. with `resizable.square`, resizing to make the right edge larger will make
   * the bottom edge larger by the same amount. We call these 'linked' edges. Any linked edges will depend
   * on the active edges and the edge being interacted with.
   */

  if (resizeOptions.square || resizeOptions.preserveAspectRatio) {
    var linkedEdges = __utils_6.extend({}, interaction.prepared.edges);
    linkedEdges.top = linkedEdges.top || linkedEdges.left && !linkedEdges.bottom;
    linkedEdges.left = linkedEdges.left || linkedEdges.top && !linkedEdges.right;
    linkedEdges.bottom = linkedEdges.bottom || linkedEdges.right && !linkedEdges.top;
    linkedEdges.right = linkedEdges.right || linkedEdges.bottom && !linkedEdges.left;
    interaction.prepared._linkedEdges = linkedEdges;
  } else {
    interaction.prepared._linkedEdges = null;
  } // if using `resizable.preserveAspectRatio` option, record aspect ratio at the start of the resize


  if (resizeOptions.preserveAspectRatio) {
    interaction.resizeStartAspectRatio = startRect.width / startRect.height;
  }

  interaction.resizeRects = {
    start: startRect,
    current: __utils_6.extend({}, startRect),
    inverted: __utils_6.extend({}, startRect),
    previous: __utils_6.extend({}, startRect),
    delta: {
      left: 0,
      right: 0,
      width: 0,
      top: 0,
      bottom: 0,
      height: 0
    }
  };
  iEvent.rect = interaction.resizeRects.inverted;
  iEvent.deltaRect = interaction.resizeRects.delta;
}

function __move_6(_ref2) {
  var iEvent = _ref2.iEvent,
      interaction = _ref2.interaction;

  if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) {
    return;
  }

  var resizeOptions = interaction.target.options.resize;
  var invert = resizeOptions.invert;
  var invertible = invert === 'reposition' || invert === 'negate';
  var edges = interaction.prepared.edges; // eslint-disable-next-line no-shadow

  var start = interaction.resizeRects.start;
  var current = interaction.resizeRects.current;
  var inverted = interaction.resizeRects.inverted;
  var deltaRect = interaction.resizeRects.delta;
  var previous = __utils_6.extend(interaction.resizeRects.previous, inverted);
  var originalEdges = edges;
  var eventDelta = __utils_6.extend({}, iEvent.delta);

  if (resizeOptions.preserveAspectRatio || resizeOptions.square) {
    // `resize.preserveAspectRatio` takes precedence over `resize.square`
    var startAspectRatio = resizeOptions.preserveAspectRatio ? interaction.resizeStartAspectRatio : 1;
    edges = interaction.prepared._linkedEdges;

    if (originalEdges.left && originalEdges.bottom || originalEdges.right && originalEdges.top) {
      eventDelta.y = -eventDelta.x / startAspectRatio;
    } else if (originalEdges.left || originalEdges.right) {
      eventDelta.y = eventDelta.x / startAspectRatio;
    } else if (originalEdges.top || originalEdges.bottom) {
      eventDelta.x = eventDelta.y * startAspectRatio;
    }
  } // update the 'current' rect without modifications


  if (edges.top) {
    current.top += eventDelta.y;
  }

  if (edges.bottom) {
    current.bottom += eventDelta.y;
  }

  if (edges.left) {
    current.left += eventDelta.x;
  }

  if (edges.right) {
    current.right += eventDelta.x;
  }

  if (invertible) {
    // if invertible, copy the current rect
    __utils_6.extend(inverted, current);

    if (invert === 'reposition') {
      // swap edge values if necessary to keep width/height positive
      var swap;

      if (inverted.top > inverted.bottom) {
        swap = inverted.top;
        inverted.top = inverted.bottom;
        inverted.bottom = swap;
      }

      if (inverted.left > inverted.right) {
        swap = inverted.left;
        inverted.left = inverted.right;
        inverted.right = swap;
      }
    }
  } else {
    // if not invertible, restrict to minimum of 0x0 rect
    inverted.top = Math.min(current.top, start.bottom);
    inverted.bottom = Math.max(current.bottom, start.top);
    inverted.left = Math.min(current.left, start.right);
    inverted.right = Math.max(current.right, start.left);
  }

  inverted.width = inverted.right - inverted.left;
  inverted.height = inverted.bottom - inverted.top;

  for (var edge in inverted) {
    deltaRect[edge] = inverted[edge] - previous[edge];
  }

  iEvent.edges = interaction.prepared.edges;
  iEvent.rect = inverted;
  iEvent.deltaRect = deltaRect;
}

function updateEventAxes(_ref3) {
  var interaction = _ref3.interaction,
      iEvent = _ref3.iEvent,
      action = _ref3.action;

  if (action !== 'resize' || !interaction.resizeAxes) {
    return;
  }

  var options = interaction.target.options;

  if (options.resize.square) {
    if (interaction.resizeAxes === 'y') {
      iEvent.delta.x = iEvent.delta.y;
    } else {
      iEvent.delta.y = iEvent.delta.x;
    }

    iEvent.axes = 'xy';
  } else {
    iEvent.axes = interaction.resizeAxes;

    if (interaction.resizeAxes === 'x') {
      iEvent.delta.y = 0;
    } else if (interaction.resizeAxes === 'y') {
      iEvent.delta.x = 0;
    }
  }
}

var ___default_6 = {
  install: __install_6
};
_$resize_6.default = ___default_6;

var _$actions_5 = {};
"use strict";

Object.defineProperty(_$actions_5, "__esModule", {
  value: true
});
_$actions_5.install = __install_5;
Object.defineProperty(_$actions_5, "gesture", {
  enumerable: true,
  get: function get() {
    return _gesture.default;
  }
});
Object.defineProperty(_$actions_5, "resize", {
  enumerable: true,
  get: function get() {
    return _resize.default;
  }
});
Object.defineProperty(_$actions_5, "drag", {
  enumerable: true,
  get: function get() {
    return _drag.default;
  }
});
Object.defineProperty(_$actions_5, "drop", {
  enumerable: true,
  get: function get() {
    return _drop.default;
  }
});

var _gesture = ___interopRequireDefault_5(_$gesture_4);

var _resize = ___interopRequireDefault_5(_$resize_6);

var _drag = ___interopRequireDefault_5(_$drag_1);

var _drop = ___interopRequireDefault_5(_$drop_3);

function ___interopRequireDefault_5(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function __install_5(scope) {
  _gesture.default.install(scope);

  _resize.default.install(scope);

  _drag.default.install(scope);

  _drop.default.install(scope);
}

var _$autoScroll_7 = {};
"use strict";

Object.defineProperty(_$autoScroll_7, "__esModule", {
  value: true
});
_$autoScroll_7.getContainer = getContainer;
_$autoScroll_7.getScroll = getScroll;
_$autoScroll_7.getScrollSize = getScrollSize;
_$autoScroll_7.getScrollSizeDelta = getScrollSizeDelta;
_$autoScroll_7.default = void 0;

var ___raf_7 = ___interopRequireDefault_7(_$raf_56);

/* removed: var _$window_60 = require("@interactjs/utils/window"); */;

var __is_7 = ___interopRequireWildcard_7(_$is_51);

var __domUtils_7 = ___interopRequireWildcard_7(_$domUtils_44);

/* removed: var _$rect_57 = require("@interactjs/utils/rect"); */;

function ___interopRequireWildcard_7(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function ___interopRequireDefault_7(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function __install_7(scope) {
  var interactions = scope.interactions,
      defaults = scope.defaults,
      actions = scope.actions;
  var autoScroll = scope.autoScroll = {
    defaults: {
      enabled: false,
      container: null,
      // the item that is scrolled (Window or HTMLElement)
      margin: 60,
      speed: 300 // the scroll speed in pixels per second

    },
    interaction: null,
    i: null,
    // the handle returned by window.setInterval
    x: 0,
    y: 0,
    // Direction each pulse is to scroll in
    isScrolling: false,
    prevTime: 0,
    start: function start(interaction) {
      autoScroll.isScrolling = true;

      ___raf_7.default.cancel(autoScroll.i);

      interaction.autoScroll = autoScroll;
      autoScroll.interaction = interaction;
      autoScroll.prevTime = new Date().getTime();
      autoScroll.i = ___raf_7.default.request(autoScroll.scroll);
    },
    stop: function stop() {
      autoScroll.isScrolling = false;

      if (autoScroll.interaction) {
        autoScroll.interaction.autoScroll = null;
      }

      ___raf_7.default.cancel(autoScroll.i);
    },
    // scroll the window by the values in scroll.x/y
    scroll: function scroll() {
      var interaction = autoScroll.interaction;
      var interactable = interaction.target,
          element = interaction.element;
      var options = interactable.options[autoScroll.interaction.prepared.name].autoScroll;
      var container = getContainer(options.container, interactable, element);
      var now = new Date().getTime(); // change in time in seconds

      var dt = (now - autoScroll.prevTime) / 1000; // displacement

      var s = options.speed * dt;

      if (s >= 1) {
        var scrollBy = {
          x: autoScroll.x * s,
          y: autoScroll.y * s
        };

        if (scrollBy.x || scrollBy.y) {
          var prevScroll = getScroll(container);

          if (__is_7.window(container)) {
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
        ___raf_7.default.cancel(autoScroll.i);

        autoScroll.i = ___raf_7.default.request(autoScroll.scroll);
      }
    },
    check: function check(interactable, actionName) {
      var options = interactable.options;
      return options[actionName].autoScroll && options[actionName].autoScroll.enabled;
    },
    onInteractionMove: function onInteractionMove(_ref) {
      var interaction = _ref.interaction,
          pointer = _ref.pointer;

      if (!(interaction.interacting() && autoScroll.check(interaction.target, interaction.prepared.name))) {
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
      var interactable = interaction.target,
          element = interaction.element;
      var options = interactable.options[interaction.prepared.name].autoScroll;
      var container = getContainer(options.container, interactable, element);

      if (__is_7.window(container)) {
        left = pointer.clientX < autoScroll.margin;
        top = pointer.clientY < autoScroll.margin;
        right = pointer.clientX > container.innerWidth - autoScroll.margin;
        bottom = pointer.clientY > container.innerHeight - autoScroll.margin;
      } else {
        var rect = __domUtils_7.getElementClientRect(container);
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
  interactions.signals.on('new', function (interaction) {
    interaction.autoScroll = null;
  });
  interactions.signals.on('stop', autoScroll.stop);
  interactions.signals.on('action-move', autoScroll.onInteractionMove);
  actions.eventTypes.push('autoscroll');
  defaults.perAction.autoScroll = autoScroll.defaults;
}

function getContainer(value, interactable, element) {
  return (__is_7.string(value) ? (0, _$rect_57.getStringOptionResult)(value, interactable, element) : value) || (0, _$window_60.getWindow)(element);
}

function getScroll(container) {
  if (__is_7.window(container)) {
    container = window.document.body;
  }

  return {
    x: container.scrollLeft,
    y: container.scrollTop
  };
}

function getScrollSize(container) {
  if (__is_7.window(container)) {
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
  var scrollOptions = interaction && interaction.target.options[interaction.prepared.name].autoScroll;

  if (!scrollOptions || !scrollOptions.enabled) {
    func();
    return {
      x: 0,
      y: 0
    };
  }

  var scrollContainer = getContainer(scrollOptions.container, interaction.target, element);
  var prevSize = getScroll(scrollContainer);
  func();
  var curSize = getScroll(scrollContainer);
  return {
    x: curSize.x - prevSize.x,
    y: curSize.y - prevSize.y
  };
}

var ___default_7 = {
  install: __install_7
};
_$autoScroll_7.default = ___default_7;

var _$InteractableMethods_8 = {};
"use strict";

Object.defineProperty(_$InteractableMethods_8, "__esModule", {
  value: true
});
_$InteractableMethods_8.default = void 0;

var __is_8 = ___interopRequireWildcard_8(_$is_51);

var __domUtils_8 = ___interopRequireWildcard_8(_$domUtils_44);

/* removed: var _$utils_49 = require("@interactjs/utils"); */;

function ___interopRequireWildcard_8(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function __install_8(scope) {
  var Interactable = scope.Interactable,
      actions = scope.actions;

  Interactable.prototype.getAction = function (pointer, event, interaction, element) {
    var action = this.defaultActionChecker(pointer, event, interaction, element);

    if (this.options.actionChecker) {
      return this.options.actionChecker(pointer, event, action, this, element, interaction);
    }

    return action;
  };
  /**
   * ```js
   * interact(element, { ignoreFrom: document.getElementById('no-action') });
   * // or
   * interact(element).ignoreFrom('input, textarea, a');
   * ```
   * @deprecated
   * If the target of the `mousedown`, `pointerdown` or `touchstart` event or any
   * of it's parents match the given CSS selector or Element, no
   * drag/resize/gesture is started.
   *
   * Don't use this method. Instead set the `ignoreFrom` option for each action
   * or for `pointerEvents`
   *
   * @example
   * interact(targett)
   *   .draggable({
   *     ignoreFrom: 'input, textarea, a[href]'',
   *   })
   *   .pointerEvents({
   *     ignoreFrom: '[no-pointer]',
   *   });
   *
   * @param {string | Element | null} [newValue] a CSS selector string, an
   * Element or `null` to not ignore any elements
   * @return {string | Element | object} The current ignoreFrom value or this
   * Interactable
   */


  Interactable.prototype.ignoreFrom = (0, _$utils_49.warnOnce)(function (newValue) {
    return this._backCompatOption('ignoreFrom', newValue);
  }, 'Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue}).');
  /**
   * ```js
   *
   * @deprecated
   * A drag/resize/gesture is started only If the target of the `mousedown`,
   * `pointerdown` or `touchstart` event or any of it's parents match the given
   * CSS selector or Element.
   *
   * Don't use this method. Instead set the `allowFrom` option for each action
   * or for `pointerEvents`
   *
   * @example
   * interact(targett)
   *   .resizable({
   *     allowFrom: '.resize-handle',
   *   .pointerEvents({
   *     allowFrom: '.handle',,
   *   });
   *
   * @param {string | Element | null} [newValue] a CSS selector string, an
   * Element or `null` to allow from any element
   * @return {string | Element | object} The current allowFrom value or this
   * Interactable
   */

  Interactable.prototype.allowFrom = (0, _$utils_49.warnOnce)(function (newValue) {
    return this._backCompatOption('allowFrom', newValue);
  }, 'Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue}).');

  Interactable.prototype.testIgnore = function (ignoreFrom, interactableElement, element) {
    if (!ignoreFrom || !__is_8.element(element)) {
      return false;
    }

    if (__is_8.string(ignoreFrom)) {
      return __domUtils_8.matchesUpTo(element, ignoreFrom, interactableElement);
    } else if (__is_8.element(ignoreFrom)) {
      return __domUtils_8.nodeContains(ignoreFrom, element);
    }

    return false;
  };

  Interactable.prototype.testAllow = function (allowFrom, interactableElement, element) {
    if (!allowFrom) {
      return true;
    }

    if (!__is_8.element(element)) {
      return false;
    }

    if (__is_8.string(allowFrom)) {
      return __domUtils_8.matchesUpTo(element, allowFrom, interactableElement);
    } else if (__is_8.element(allowFrom)) {
      return __domUtils_8.nodeContains(allowFrom, element);
    }

    return false;
  };

  Interactable.prototype.testIgnoreAllow = function (options, interactableElement, eventTarget) {
    return !this.testIgnore(options.ignoreFrom, interactableElement, eventTarget) && this.testAllow(options.allowFrom, interactableElement, eventTarget);
  };
  /**
   * ```js
   * interact('.resize-drag')
   *   .resizable(true)
   *   .draggable(true)
   *   .actionChecker(function (pointer, event, action, interactable, element, interaction) {
   *
   *   if (interact.matchesSelector(event.target, '.drag-handle') {
   *     // force drag with handle target
   *     action.name = drag;
   *   }
   *   else {
   *     // resize from the top and right edges
   *     action.name  = 'resize';
   *     action.edges = { top: true, right: true };
   *   }
   *
   *   return action;
   * });
   * ```
   *
   * Gets or sets the function used to check action to be performed on
   * pointerDown
   *
   * @param {function | null} [checker] A function which takes a pointer event,
   * defaultAction string, interactable, element and interaction as parameters
   * and returns an object with name property 'drag' 'resize' or 'gesture' and
   * optionally an `edges` object with boolean 'top', 'left', 'bottom' and right
   * props.
   * @return {Function | Interactable} The checker function or this Interactable
   */


  Interactable.prototype.actionChecker = function (checker) {
    if (__is_8.func(checker)) {
      this.options.actionChecker = checker;
      return this;
    }

    if (checker === null) {
      delete this.options.actionChecker;
      return this;
    }

    return this.options.actionChecker;
  };
  /**
   * Returns or sets whether the the cursor should be changed depending on the
   * action that would be performed if the mouse were pressed and dragged.
   *
   * @param {boolean} [newValue]
   * @return {boolean | Interactable} The current setting or this Interactable
   */


  Interactable.prototype.styleCursor = function (newValue) {
    if (__is_8.bool(newValue)) {
      this.options.styleCursor = newValue;
      return this;
    }

    if (newValue === null) {
      delete this.options.styleCursor;
      return this;
    }

    return this.options.styleCursor;
  };

  Interactable.prototype.defaultActionChecker = function (pointer, event, interaction, element) {
    var rect = this.getRect(element);
    var buttons = event.buttons || {
      0: 1,
      1: 4,
      3: 8,
      4: 16
    }[event.button];
    var action = null;

    for (var _i = 0; _i < actions.names.length; _i++) {
      var _ref;

      _ref = actions.names[_i];
      var actionName = _ref;

      // check mouseButton setting if the pointer is down
      if (interaction.pointerIsDown && /mouse|pointer/.test(interaction.pointerType) && (buttons & this.options[actionName].mouseButtons) === 0) {
        continue;
      }

      action = actions[actionName].checker(pointer, event, this, element, interaction, rect);

      if (action) {
        return action;
      }
    }
  };
}

var ___default_8 = {
  install: __install_8
};
_$InteractableMethods_8.default = ___default_8;

var _$base_9 = {};
"use strict";

Object.defineProperty(_$base_9, "__esModule", {
  value: true
});
_$base_9.default = void 0;

var __utils_9 = ___interopRequireWildcard_9(_$utils_49);

var _InteractableMethods = ___interopRequireDefault_9(_$InteractableMethods_8);

function ___interopRequireDefault_9(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___interopRequireWildcard_9(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function __install_9(scope) {
  var interact = scope.interact,
      interactions = scope.interactions,
      defaults = scope.defaults,
      Signals = scope.Signals;
  interact.use(_InteractableMethods.default); // set cursor style on mousedown

  interactions.signals.on('down', function (_ref) {
    var interaction = _ref.interaction,
        pointer = _ref.pointer,
        event = _ref.event,
        eventTarget = _ref.eventTarget;

    if (interaction.interacting()) {
      return;
    }

    var actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
    prepare(interaction, actionInfo, scope);
  }); // set cursor style on mousemove

  interactions.signals.on('move', function (_ref2) {
    var interaction = _ref2.interaction,
        pointer = _ref2.pointer,
        event = _ref2.event,
        eventTarget = _ref2.eventTarget;

    if (interaction.pointerType !== 'mouse' || interaction.pointerIsDown || interaction.interacting()) {
      return;
    }

    var actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
    prepare(interaction, actionInfo, scope);
  });
  interactions.signals.on('move', function (arg) {
    var interaction = arg.interaction,
        event = arg.event;

    if (!interaction.pointerIsDown || interaction.interacting() || !interaction.pointerWasMoved || !interaction.prepared.name) {
      return;
    }

    scope.autoStart.signals.fire('before-start', arg);
    var target = interaction.target;

    if (interaction.prepared.name && target) {
      // check manualStart and interaction limit
      if (target.options[interaction.prepared.name].manualStart || !withinInteractionLimit(target, interaction.element, interaction.prepared, scope)) {
        interaction.stop(event);
      } else {
        interaction.start(interaction.prepared, target, interaction.element);
      }
    }
  });
  interactions.signals.on('stop', function (_ref3) {
    var interaction = _ref3.interaction;
    var target = interaction.target;

    if (target && target.options.styleCursor) {
      setCursor(interaction.element, '', scope);
    }
  });
  interact.maxInteractions = maxInteractions;
  defaults.base.actionChecker = null;
  defaults.base.styleCursor = true;
  __utils_9.extend(defaults.perAction, {
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
    cursorElement: null,
    signals: new Signals()
  };
} // Check if the current target supports the action.
// If so, return the validated action. Otherwise, return null


function validateAction(action, interactable, element, eventTarget, scope) {
  if (__utils_9.is.object(action) && interactable.testIgnoreAllow(interactable.options[action.name], element, eventTarget) && interactable.options[action.name].enabled && withinInteractionLimit(interactable, element, action, scope)) {
    return action;
  }

  return null;
}

function validateSelector(interaction, pointer, event, matches, matchElements, eventTarget, scope) {
  for (var i = 0, len = matches.length; i < len; i++) {
    var match = matches[i];
    var matchElement = matchElements[i];
    var action = validateAction(match.getAction(pointer, event, interaction, matchElement), match, matchElement, eventTarget, scope);

    if (action) {
      return {
        action: action,
        target: match,
        element: matchElement
      };
    }
  }

  return {};
}

function getActionInfo(interaction, pointer, event, eventTarget, scope) {
  var matches = [];
  var matchElements = [];
  var element = eventTarget;

  function pushMatches(interactable) {
    matches.push(interactable);
    matchElements.push(element);
  }

  while (__utils_9.is.element(element)) {
    matches = [];
    matchElements = [];
    scope.interactables.forEachMatch(element, pushMatches);
    var actionInfo = validateSelector(interaction, pointer, event, matches, matchElements, eventTarget, scope);

    if (actionInfo.action && !actionInfo.target.options[actionInfo.action.name].manualStart) {
      return actionInfo;
    }

    element = __utils_9.dom.parentNode(element);
  }

  return {};
}

function prepare(interaction, _ref4, scope) {
  var action = _ref4.action,
      target = _ref4.target,
      element = _ref4.element;
  action = action || {};

  if (interaction.target && interaction.target.options.styleCursor) {
    setCursor(interaction.element, '', scope);
  }

  interaction.target = target;
  interaction.element = element;
  __utils_9.copyAction(interaction.prepared, action);

  if (target && target.options.styleCursor) {
    var cursor = action ? scope.actions[action.name].getCursor(action) : '';
    setCursor(interaction.element, cursor, scope);
  }

  scope.autoStart.signals.fire('prepared', {
    interaction: interaction
  });
}

function withinInteractionLimit(interactable, element, action, scope) {
  var options = interactable.options;
  var maxActions = options[action.name].max;
  var maxPerElement = options[action.name].maxPerElement;
  var autoStartMax = scope.autoStart.maxInteractions;
  var activeInteractions = 0;
  var targetCount = 0;
  var targetElementCount = 0; // no actions if any of these values == 0

  if (!(maxActions && maxPerElement && autoStartMax)) {
    return;
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

    if (interaction.target !== interactable) {
      continue;
    }

    targetCount += otherAction === action.name | 0;

    if (targetCount >= maxActions) {
      return false;
    }

    if (interaction.element === element) {
      targetElementCount++;

      if (otherAction === action.name && targetElementCount >= maxPerElement) {
        return false;
      }
    }
  }

  return autoStartMax > 0;
}

function maxInteractions(newValue, scope) {
  if (__utils_9.is.number(newValue)) {
    scope.autoStart.maxInteractions = newValue;
    return this;
  }

  return scope.autoStart.maxInteractions;
}

function setCursor(element, cursor, scope) {
  if (scope.autoStart.cursorElement) {
    scope.autoStart.cursorElement.style.cursor = '';
  }

  element.ownerDocument.documentElement.style.cursor = cursor;
  element.style.cursor = cursor;
  scope.autoStart.cursorElement = cursor ? element : null;
}

var ___default_9 = {
  install: __install_9,
  maxInteractions: maxInteractions,
  withinInteractionLimit: withinInteractionLimit,
  validateAction: validateAction
};
_$base_9.default = ___default_9;

var _$dragAxis_10 = {};
"use strict";

Object.defineProperty(_$dragAxis_10, "__esModule", {
  value: true
});
_$dragAxis_10.default = void 0;

var __is_10 = ___interopRequireWildcard_10(_$is_51);

var _base = ___interopRequireDefault_10(_$base_9);

/* removed: var _$domUtils_44 = require("@interactjs/utils/domUtils"); */;

function ___interopRequireDefault_10(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___interopRequireWildcard_10(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function __install_10(scope) {
  scope.autoStart.signals.on('before-start', function (_ref) {
    var interaction = _ref.interaction,
        eventTarget = _ref.eventTarget,
        dx = _ref.dx,
        dy = _ref.dy;

    if (interaction.prepared.name !== 'drag') {
      return;
    } // check if a drag is in the correct axis


    var absX = Math.abs(dx);
    var absY = Math.abs(dy);
    var targetOptions = interaction.target.options.drag;
    var startAxis = targetOptions.startAxis;
    var currentAxis = absX > absY ? 'x' : absX < absY ? 'y' : 'xy';
    interaction.prepared.axis = targetOptions.lockAxis === 'start' ? currentAxis[0] // always lock to one axis even if currentAxis === 'xy'
    : targetOptions.lockAxis; // if the movement isn't in the startAxis of the interactable

    if (currentAxis !== 'xy' && startAxis !== 'xy' && startAxis !== currentAxis) {
      // cancel the prepared action
      interaction.prepared.name = null; // then try to get a drag from another ineractable

      var element = eventTarget;

      var getDraggable = function getDraggable(interactable) {
        if (interactable === interaction.target) {
          return;
        }

        var options = interaction.target.options.drag;

        if (!options.manualStart && interactable.testIgnoreAllow(options, element, eventTarget)) {
          var action = interactable.getAction(interaction.downPointer, interaction.downEvent, interaction, element);

          if (action && action.name === 'drag' && checkStartAxis(currentAxis, interactable) && _base.default.validateAction(action, interactable, element, eventTarget, scope)) {
            return interactable;
          }
        }
      }; // check all interactables


      while (__is_10.element(element)) {
        var interactable = scope.interactables.forEachMatch(element, getDraggable);

        if (interactable) {
          interaction.prepared.name = 'drag';
          interaction.target = interactable;
          interaction.element = element;
          break;
        }

        element = (0, _$domUtils_44.parentNode)(element);
      }
    }
  });

  function checkStartAxis(startAxis, interactable) {
    if (!interactable) {
      return false;
    }

    var thisAxis = interactable.options.drag.startAxis;
    return startAxis === 'xy' || thisAxis === 'xy' || thisAxis === startAxis;
  }
}

var ___default_10 = {
  install: __install_10
};
_$dragAxis_10.default = ___default_10;

var _$hold_11 = {};
"use strict";

Object.defineProperty(_$hold_11, "__esModule", {
  value: true
});
_$hold_11.default = void 0;

function __install_11(scope) {
  var autoStart = scope.autoStart,
      interactions = scope.interactions,
      defaults = scope.defaults;
  defaults.perAction.hold = 0;
  defaults.perAction.delay = 0;
  interactions.signals.on('new', function (interaction) {
    interaction.autoStartHoldTimer = null;
  });
  autoStart.signals.on('prepared', function (_ref) {
    var interaction = _ref.interaction;
    var hold = getHoldDuration(interaction);

    if (hold > 0) {
      interaction.autoStartHoldTimer = setTimeout(function () {
        interaction.start(interaction.prepared, interaction.target, interaction.element);
      }, hold);
    }
  });
  interactions.signals.on('move', function (_ref2) {
    var interaction = _ref2.interaction,
        duplicate = _ref2.duplicate;

    if (interaction.pointerWasMoved && !duplicate) {
      clearTimeout(interaction.autoStartHoldTimer);
    }
  }); // prevent regular down->move autoStart

  autoStart.signals.on('before-start', function (_ref3) {
    var interaction = _ref3.interaction;
    var hold = getHoldDuration(interaction);

    if (hold > 0) {
      interaction.prepared.name = null;
    }
  });
}

function getHoldDuration(interaction) {
  var actionName = interaction.prepared && interaction.prepared.name;

  if (!actionName) {
    return null;
  }

  var options = interaction.target.options;
  return options[actionName].hold || options[actionName].delay;
}

var ___default_11 = {
  install: __install_11,
  getHoldDuration: getHoldDuration
};
_$hold_11.default = ___default_11;

var _$autoStart_12 = {};
"use strict";

Object.defineProperty(_$autoStart_12, "__esModule", {
  value: true
});
_$autoStart_12.install = __install_12;
Object.defineProperty(_$autoStart_12, "autoStart", {
  enumerable: true,
  get: function get() {
    return ___base_12.default;
  }
});
Object.defineProperty(_$autoStart_12, "hold", {
  enumerable: true,
  get: function get() {
    return _hold.default;
  }
});
Object.defineProperty(_$autoStart_12, "dragAxis", {
  enumerable: true,
  get: function get() {
    return _dragAxis.default;
  }
});

var ___base_12 = ___interopRequireDefault_12(_$base_9);

var _hold = ___interopRequireDefault_12(_$hold_11);

var _dragAxis = ___interopRequireDefault_12(_$dragAxis_10);

function ___interopRequireDefault_12(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function __install_12(scope) {
  ___base_12.default.install(scope);

  _hold.default.install(scope);

  _dragAxis.default.install(scope);
}

var _$interactablePreventDefault_18 = {};
"use strict";

Object.defineProperty(_$interactablePreventDefault_18, "__esModule", {
  value: true
});
_$interactablePreventDefault_18.install = __install_18;
_$interactablePreventDefault_18.default = void 0;

var __is_18 = ___interopRequireWildcard_18(_$is_51);

var ___events_18 = ___interopRequireDefault_18(_$events_45);

/* removed: var _$domUtils_44 = require("@interactjs/utils/domUtils"); */;

/* removed: var _$window_60 = require("@interactjs/utils/window"); */;

function ___interopRequireDefault_18(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___interopRequireWildcard_18(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function preventDefault(interactable, newValue) {
  if (/^(always|never|auto)$/.test(newValue)) {
    interactable.options.preventDefault = newValue;
    return interactable;
  }

  if (__is_18.bool(newValue)) {
    interactable.options.preventDefault = newValue ? 'always' : 'never';
    return interactable;
  }

  return interactable.options.preventDefault;
}

function checkAndPreventDefault(interactable, scope, event) {
  var setting = interactable.options.preventDefault;

  if (setting === 'never') {
    return;
  }

  if (setting === 'always') {
    event.preventDefault();
    return;
  } // setting === 'auto'
  // if the browser supports passive event listeners and isn't running on iOS,
  // don't preventDefault of touch{start,move} events. CSS touch-action and
  // user-select should be used instead of calling event.preventDefault().


  if (___events_18.default.supportsPassive && /^touch(start|move)$/.test(event.type)) {
    var doc = (0, _$window_60.getWindow)(event.target).document;
    var docOptions = scope.getDocOptions(doc);

    if (!(docOptions && docOptions.events) || docOptions.events.passive !== false) {
      return;
    }
  } // don't preventDefault of pointerdown events


  if (/^(mouse|pointer|touch)*(down|start)/i.test(event.type)) {
    return;
  } // don't preventDefault on editable elements


  if (__is_18.element(event.target) && (0, _$domUtils_44.matchesSelector)(event.target, 'input,select,textarea,[contenteditable=true],[contenteditable=true] *')) {
    return;
  }

  event.preventDefault();
}

function onInteractionEvent(_ref) {
  var interaction = _ref.interaction,
      event = _ref.event;

  if (interaction.target) {
    interaction.target.checkAndPreventDefault(event);
  }
}

function __install_18(scope) {
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

  Interactable.prototype.preventDefault = function (newValue) {
    return preventDefault(this, newValue);
  };

  Interactable.prototype.checkAndPreventDefault = function (event) {
    return checkAndPreventDefault(this, scope, event);
  };

  var _arr = ['down', 'move', 'up', 'cancel'];

  for (var _i = 0; _i < _arr.length; _i++) {
    var eventSignal = _arr[_i];
    scope.interactions.signals.on(eventSignal, onInteractionEvent);
  } // prevent native HTML5 drag on interact.js target elements


  scope.interactions.eventMap.dragstart = function preventNativeDrag(event) {
    for (var _i2 = 0; _i2 < scope.interactions.list.length; _i2++) {
      var _ref2;

      _ref2 = scope.interactions.list[_i2];
      var interaction = _ref2;

      if (interaction.element && (interaction.element === event.target || (0, _$domUtils_44.nodeContains)(interaction.element, event.target))) {
        interaction.target.checkAndPreventDefault(event);
        return;
      }
    }
  };
}

var ___default_18 = {
  install: __install_18
};
_$interactablePreventDefault_18.default = ___default_18;

var _$base_25 = {};
"use strict";

Object.defineProperty(_$base_25, "__esModule", {
  value: true
});
_$base_25.default = void 0;

var ___extend_25 = ___interopRequireDefault_25(_$extend_46);

function ___interopRequireDefault_25(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___slicedToArray_25(arr, i) { return ___arrayWithHoles_25(arr) || ___iterableToArrayLimit_25(arr, i) || ___nonIterableRest_25(); }

function ___nonIterableRest_25() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function ___iterableToArrayLimit_25(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function ___arrayWithHoles_25(arr) { if (Array.isArray(arr)) return arr; }

function __install_25(scope) {
  var interactions = scope.interactions;
  scope.defaults.perAction.modifiers = [];
  scope.modifiers = {};
  interactions.signals.on('new', function (interaction) {
    interaction.modifiers = {
      startOffset: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      },
      offsets: {},
      states: null,
      result: null
    };
  });
  interactions.signals.on('before-action-start', function (arg) {
    return __start_25(arg, arg.interaction.coords.start.page, scope.modifiers);
  });
  interactions.signals.on('action-resume', function (arg) {
    __beforeMove_25(arg);
    __start_25(arg, arg.interaction.coords.cur.page, scope.modifiers);
  });
  interactions.signals.on('before-action-move', __beforeMove_25);
  interactions.signals.on('before-action-end', beforeEnd);
  interactions.signals.on('before-action-start', setCoords);
  interactions.signals.on('before-action-move', setCoords);
  interactions.signals.on('after-action-start', restoreCoords);
  interactions.signals.on('after-action-move', restoreCoords);
  interactions.signals.on('stop', stop);
}

function startAll(arg) {
  for (var _i = 0; _i < arg.states.length; _i++) {
    var _ref;

    _ref = arg.states[_i];
    var state = _ref;

    if (state.methods.start) {
      arg.state = state;
      state.methods.start(arg);
    }
  }
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

function __start_25(_ref2, pageCoords, registeredModifiers) {
  var interaction = _ref2.interaction,
      phase = _ref2.phase;
  var interactable = interaction.target,
      element = interaction.element;
  var modifierList = getModifierList(interaction, registeredModifiers);
  var states = prepareStates(modifierList);
  var rect = (0, ___extend_25.default)({}, interactable.getRect(element));

  if (!('width' in rect)) {
    rect.width = rect.right - rect.left;
  }

  if (!('height' in rect)) {
    rect.height = rect.bottom - rect.top;
  }

  var startOffset = getRectOffset(rect, pageCoords);
  interaction.modifiers.startOffset = startOffset;
  interaction.modifiers.startDelta = {
    x: 0,
    y: 0
  };
  var arg = {
    interaction: interaction,
    interactable: interactable,
    element: element,
    pageCoords: pageCoords,
    phase: phase,
    rect: rect,
    startOffset: startOffset,
    states: states,
    preEnd: false,
    requireEndOnly: false
  };
  interaction.modifiers.states = states;
  interaction.modifiers.result = null;
  startAll(arg);
  arg.pageCoords = (0, ___extend_25.default)({}, interaction.coords.start.page);
  var result = interaction.modifiers.result = setAll(arg);
  return result;
}

function setAll(arg) {
  var interaction = arg.interaction,
      phase = arg.phase,
      preEnd = arg.preEnd,
      requireEndOnly = arg.requireEndOnly,
      rect = arg.rect,
      skipModifiers = arg.skipModifiers;
  var states = skipModifiers ? arg.states.slice(interaction.modifiers.skip) : arg.states;
  arg.coords = (0, ___extend_25.default)({}, arg.pageCoords);
  arg.rect = (0, ___extend_25.default)({}, rect);
  var result = {
    delta: {
      x: 0,
      y: 0
    },
    coords: arg.coords,
    changed: true
  };

  for (var _i2 = 0; _i2 < states.length; _i2++) {
    var _ref3;

    _ref3 = states[_i2];
    var state = _ref3;
    var options = state.options;

    if (!state.methods.set || !shouldDo(options, preEnd, requireEndOnly, phase)) {
      continue;
    }

    arg.state = state;
    state.methods.set(arg);
  }

  result.delta.x = arg.coords.x - arg.pageCoords.x;
  result.delta.y = arg.coords.y - arg.pageCoords.y;
  var prevCoords = interaction.modifiers.result ? interaction.modifiers.result.coords : interaction.coords.prev.page;
  result.changed = prevCoords.x !== result.coords.x || prevCoords.y !== result.coords.y;
  return result;
}

function prepareStates(modifierList) {
  var states = [];

  for (var index = 0; index < modifierList.length; index++) {
    var _modifierList$index = modifierList[index],
        options = _modifierList$index.options,
        methods = _modifierList$index.methods;

    if (options && options.enabled === false) {
      continue;
    }

    var state = {
      options: options,
      methods: methods,
      index: index
    };
    states.push(state);
  }

  return states;
}

function __beforeMove_25(_ref4) {
  var interaction = _ref4.interaction,
      phase = _ref4.phase,
      preEnd = _ref4.preEnd,
      skipModifiers = _ref4.skipModifiers;
  var interactable = interaction.target,
      element = interaction.element;
  var modifierResult = setAll({
    interaction: interaction,
    interactable: interactable,
    element: element,
    preEnd: preEnd,
    phase: phase,
    pageCoords: interaction.coords.cur.page,
    rect: interactable.getRect(element),
    states: interaction.modifiers.states,
    requireEndOnly: false,
    skipModifiers: skipModifiers
  });
  interaction.modifiers.result = modifierResult; // don't fire an action move if a modifier would keep the event in the same
  // cordinates as before

  if (!modifierResult.changed && interaction.interacting()) {
    return false;
  }
}

function beforeEnd(arg) {
  var interaction = arg.interaction,
      event = arg.event,
      noPreEnd = arg.noPreEnd;
  var states = interaction.modifiers.states;

  if (noPreEnd || !states || !states.length) {
    return;
  }

  var didPreEnd = false;

  for (var _i3 = 0; _i3 < states.length; _i3++) {
    var _ref5;

    _ref5 = states[_i3];
    var state = _ref5;
    arg.state = state;
    var options = state.options,
        methods = state.methods;
    var endResult = methods.beforeEnd && methods.beforeEnd(arg);

    if (endResult === false) {
      return false;
    } // if the endOnly option is true for any modifier


    if (!didPreEnd && shouldDo(options, true, true)) {
      // fire a move event at the modified coordinates
      interaction.move({
        event: event,
        preEnd: true
      });
      didPreEnd = true;
    }
  }
}

function stop(arg) {
  var interaction = arg.interaction;
  var states = interaction.modifiers.states;

  if (!states || !states.length) {
    return;
  }

  var modifierArg = (0, ___extend_25.default)({
    states: states,
    interactable: interaction.target,
    element: interaction.element
  }, arg);
  restoreCoords(arg);

  for (var _i4 = 0; _i4 < states.length; _i4++) {
    var _ref6;

    _ref6 = states[_i4];
    var state = _ref6;
    modifierArg.state = state;

    if (state.methods.stop) {
      state.methods.stop(modifierArg);
    }
  }

  arg.interaction.modifiers.states = null;
}

function setCoords(arg) {
  var interaction = arg.interaction,
      phase = arg.phase;
  var curCoords = arg.curCoords || interaction.coords.cur;
  var startCoords = arg.startCoords || interaction.coords.start;
  var _interaction$modifier = interaction.modifiers,
      result = _interaction$modifier.result,
      startDelta = _interaction$modifier.startDelta;
  var curDelta = result.delta;

  if (phase === 'start') {
    (0, ___extend_25.default)(interaction.modifiers.startDelta, result.delta);
  }

  var _arr = [[startCoords, startDelta], [curCoords, curDelta]];

  for (var _i5 = 0; _i5 < _arr.length; _i5++) {
    var _arr$_i = ___slicedToArray_25(_arr[_i5], 2),
        coordsSet = _arr$_i[0],
        delta = _arr$_i[1];

    coordsSet.page.x += delta.x;
    coordsSet.page.y += delta.y;
    coordsSet.client.x += delta.x;
    coordsSet.client.y += delta.y;
  }
}

function restoreCoords(_ref7) {
  var _ref7$interaction = _ref7.interaction,
      coords = _ref7$interaction.coords,
      modifiers = _ref7$interaction.modifiers;
  var startDelta = modifiers.startDelta,
      curDelta = modifiers.result.delta;
  var _arr2 = [[coords.start, startDelta], [coords.cur, curDelta]];

  for (var _i6 = 0; _i6 < _arr2.length; _i6++) {
    var _arr2$_i = ___slicedToArray_25(_arr2[_i6], 2),
        coordsSet = _arr2$_i[0],
        delta = _arr2$_i[1];

    coordsSet.page.x -= delta.x;
    coordsSet.page.y -= delta.y;
    coordsSet.client.x -= delta.x;
    coordsSet.client.y -= delta.y;
  }
}

function getModifierList(interaction, registeredModifiers) {
  var actionOptions = interaction.target.options[interaction.prepared.name];
  var actionModifiers = actionOptions.modifiers;

  if (actionModifiers && actionModifiers.length) {
    return actionModifiers.map(function (modifier) {
      if (!modifier.methods && modifier.type) {
        return registeredModifiers[modifier.type](modifier);
      }

      return modifier;
    });
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

function shouldDo(options, preEnd, requireEndOnly, phase) {
  return options ? options.enabled !== false && (preEnd || !options.endOnly) && (!requireEndOnly || options.endOnly) && (options.setStart || phase !== 'start') : !requireEndOnly;
}

function makeModifier(module, name) {
  var defaults = module.defaults;
  var methods = {
    start: module.start,
    set: module.set,
    beforeEnd: module.beforeEnd,
    stop: module.stop
  };

  var modifier = function modifier(options) {
    options = options || {}; // add missing defaults to options

    options.enabled = options.enabled !== false;

    for (var prop in defaults) {
      if (!(prop in options)) {
        options[prop] = defaults[prop];
      }
    }

    return {
      options: options,
      methods: methods
    };
  };

  if (typeof name === 'string') {
    Object.defineProperty(modifier, 'name', {
      value: name
    }); // for backwrads compatibility

    modifier._defaults = defaults;
    modifier._methods = methods;
  }

  return modifier;
}

var ___default_25 = {
  install: __install_25,
  startAll: startAll,
  setAll: setAll,
  prepareStates: prepareStates,
  start: __start_25,
  beforeMove: __beforeMove_25,
  beforeEnd: beforeEnd,
  stop: stop,
  shouldDo: shouldDo,
  getModifierList: getModifierList,
  getRectOffset: getRectOffset,
  makeModifier: makeModifier
};
_$base_25.default = ___default_25;

var _$inertia_21 = {};
"use strict";

Object.defineProperty(_$inertia_21, "__esModule", {
  value: true
});
_$inertia_21.default = void 0;

var ___base_21 = ___interopRequireDefault_21(_$base_25);

var __utils_21 = ___interopRequireWildcard_21(_$utils_49);

var ___raf_21 = ___interopRequireDefault_21(_$raf_56);

function ___interopRequireWildcard_21(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function ___interopRequireDefault_21(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function __install_21(scope) {
  var interactions = scope.interactions,
      defaults = scope.defaults;
  interactions.signals.on('new', function (interaction) {
    interaction.inertia = {
      active: false,
      smoothEnd: false,
      allowResume: false,
      startEvent: null,
      upCoords: {},
      xe: 0,
      ye: 0,
      sx: 0,
      sy: 0,
      t0: 0,
      vx0: 0,
      vys: 0,
      duration: 0,
      lambda_v0: 0,
      one_ve_v0: 0,
      i: null
    };
  });
  interactions.signals.on('before-action-end', function (arg) {
    return release(arg, scope);
  });
  interactions.signals.on('down', function (arg) {
    return resume(arg, scope);
  });
  interactions.signals.on('stop', function (arg) {
    return __stop_21(arg, scope);
  });
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

function resume(_ref, scope) {
  var interaction = _ref.interaction,
      event = _ref.event,
      pointer = _ref.pointer,
      eventTarget = _ref.eventTarget;
  var state = interaction.inertia; // Check if the down event hits the current inertia target

  if (state.active) {
    var element = eventTarget; // climb up the DOM tree from the event target

    while (__utils_21.is.element(element)) {
      // if interaction element is the current inertia target element
      if (element === interaction.element) {
        // stop inertia
        ___raf_21.default.cancel(state.i);

        state.active = false;
        interaction.simulation = null; // update pointers to the down event's coordinates

        interaction.updatePointer(pointer, event, eventTarget, true);
        __utils_21.pointer.setCoords(interaction.coords.cur, interaction.pointers.map(function (p) {
          return p.pointer;
        })); // fire appropriate signals

        var signalArg = {
          interaction: interaction
        };
        scope.interactions.signals.fire('action-resume', signalArg); // fire a reume event

        var resumeEvent = new scope.InteractEvent(interaction, event, interaction.prepared.name, 'resume', interaction.element);

        interaction._fireEvent(resumeEvent);

        __utils_21.pointer.copyCoords(interaction.coords.prev, interaction.coords.cur);
        break;
      }

      element = __utils_21.dom.parentNode(element);
    }
  }
}

function release(_ref2, scope) {
  var interaction = _ref2.interaction,
      event = _ref2.event,
      noPreEnd = _ref2.noPreEnd;
  var state = interaction.inertia;

  if (!interaction.interacting() || interaction.simulation && interaction.simulation.active || noPreEnd) {
    return;
  }

  var options = __getOptions_21(interaction);
  var now = new Date().getTime();
  var velocityClient = interaction.coords.velocity.client;
  var pointerSpeed = __utils_21.hypot(velocityClient.x, velocityClient.y);
  var smoothEnd = false;
  var modifierResult; // check if inertia should be started

  var inertiaPossible = options && options.enabled && interaction.prepared.name !== 'gesture' && event !== state.startEvent;
  var inertia = inertiaPossible && now - interaction.coords.cur.timeStamp < 50 && pointerSpeed > options.minSpeed && pointerSpeed > options.endSpeed;
  var modifierArg = {
    interaction: interaction,
    pageCoords: __utils_21.extend({}, interaction.coords.cur.page),
    states: inertiaPossible && interaction.modifiers.states.map(function (modifierStatus) {
      return __utils_21.extend({}, modifierStatus);
    }),
    preEnd: true,
    requireEndOnly: true
  }; // smoothEnd

  if (inertiaPossible && !inertia) {
    modifierResult = ___base_21.default.setAll(modifierArg);

    if (modifierResult.shouldMove) {
      smoothEnd = true;
    }
  }

  if (!(inertia || smoothEnd)) {
    return;
  }

  __utils_21.pointer.copyCoords(state.upCoords, interaction.coords.cur);
  interaction.pointers[0].pointer = state.startEvent = new scope.InteractEvent(interaction, event, interaction.prepared.name, 'inertiastart', interaction.element);
  state.t0 = now;
  state.active = true;
  state.allowResume = options.allowResume;
  interaction.simulation = state;
  interaction.target.fire(state.startEvent);

  if (inertia) {
    state.vx0 = interaction.coords.velocity.client.x;
    state.vy0 = interaction.coords.velocity.client.y;
    state.v0 = pointerSpeed;
    calcInertia(interaction, state);
    __utils_21.extend(modifierArg.pageCoords, interaction.coords.cur.page);
    modifierArg.pageCoords.x += state.xe;
    modifierArg.pageCoords.y += state.ye;
    modifierResult = ___base_21.default.setAll(modifierArg);
    state.modifiedXe += modifierResult.delta.x;
    state.modifiedYe += modifierResult.delta.y;
    state.i = ___raf_21.default.request(function () {
      return inertiaTick(interaction);
    });
  } else {
    state.smoothEnd = true;
    state.xe = modifierResult.delta.x;
    state.ye = modifierResult.delta.y;
    state.sx = state.sy = 0;
    state.i = ___raf_21.default.request(function () {
      return smothEndTick(interaction);
    });
  }

  return false;
}

function __stop_21(_ref3) {
  var interaction = _ref3.interaction;
  var state = interaction.inertia;

  if (state.active) {
    ___raf_21.default.cancel(state.i);

    state.active = false;
    interaction.simulation = null;
  }
}

function calcInertia(interaction, state) {
  var options = __getOptions_21(interaction);
  var lambda = options.resistance;
  var inertiaDur = -Math.log(options.endSpeed / state.v0) / lambda;
  state.x0 = interaction.prevEvent.page.x;
  state.y0 = interaction.prevEvent.page.y;
  state.t0 = state.startEvent.timeStamp / 1000;
  state.sx = state.sy = 0;
  state.modifiedXe = state.xe = (state.vx0 - inertiaDur) / lambda;
  state.modifiedYe = state.ye = (state.vy0 - inertiaDur) / lambda;
  state.te = inertiaDur;
  state.lambda_v0 = lambda / state.v0;
  state.one_ve_v0 = 1 - options.endSpeed / state.v0;
}

function inertiaTick(interaction) {
  updateInertiaCoords(interaction);
  __utils_21.pointer.setCoordDeltas(interaction.coords.delta, interaction.coords.prev, interaction.coords.cur);
  __utils_21.pointer.setCoordVelocity(interaction.coords.velocity, interaction.coords.delta);
  var state = interaction.inertia;
  var options = __getOptions_21(interaction);
  var lambda = options.resistance;
  var t = new Date().getTime() / 1000 - state.t0;

  if (t < state.te) {
    var progress = 1 - (Math.exp(-lambda * t) - state.lambda_v0) / state.one_ve_v0;

    if (state.modifiedXe === state.xe && state.modifiedYe === state.ye) {
      state.sx = state.xe * progress;
      state.sy = state.ye * progress;
    } else {
      var quadPoint = __utils_21.getQuadraticCurvePoint(0, 0, state.xe, state.ye, state.modifiedXe, state.modifiedYe, progress);
      state.sx = quadPoint.x;
      state.sy = quadPoint.y;
    }

    interaction.move();
    state.i = ___raf_21.default.request(function () {
      return inertiaTick(interaction);
    });
  } else {
    state.sx = state.modifiedXe;
    state.sy = state.modifiedYe;
    interaction.move();
    interaction.end(state.startEvent);
    state.active = false;
    interaction.simulation = null;
  }

  __utils_21.pointer.copyCoords(interaction.coords.prev, interaction.coords.cur);
}

function smothEndTick(interaction) {
  updateInertiaCoords(interaction);
  var state = interaction.inertia;
  var t = new Date().getTime() - state.t0;

  var _getOptions = __getOptions_21(interaction),
      duration = _getOptions.smoothEndDuration;

  if (t < duration) {
    state.sx = __utils_21.easeOutQuad(t, 0, state.xe, duration);
    state.sy = __utils_21.easeOutQuad(t, 0, state.ye, duration);
    interaction.move();
    state.i = ___raf_21.default.request(function () {
      return smothEndTick(interaction);
    });
  } else {
    state.sx = state.xe;
    state.sy = state.ye;
    interaction.move();
    interaction.end(state.startEvent);
    state.smoothEnd = state.active = false;
    interaction.simulation = null;
  }
}

function updateInertiaCoords(interaction) {
  var state = interaction.inertia; // return if inertia isn't running

  if (!state.active) {
    return;
  }

  var pageUp = state.upCoords.page;
  var clientUp = state.upCoords.client;
  __utils_21.pointer.setCoords(interaction.coords.cur, [{
    pageX: pageUp.x + state.sx,
    pageY: pageUp.y + state.sy,
    clientX: clientUp.x + state.sx,
    clientY: clientUp.y + state.sy
  }]);
}

function __getOptions_21(_ref4) {
  var target = _ref4.target,
      prepared = _ref4.prepared;
  return target && target.options && prepared.name && target.options[prepared.name].inertia;
}

var ___default_21 = {
  install: __install_21,
  calcInertia: calcInertia,
  inertiaTick: inertiaTick,
  smothEndTick: smothEndTick,
  updateInertiaCoords: updateInertiaCoords
};
_$inertia_21.default = ___default_21;

var _$Eventable_13 = {};
"use strict";

Object.defineProperty(_$Eventable_13, "__esModule", {
  value: true
});
_$Eventable_13.default = void 0;

var __arr_13 = ___interopRequireWildcard_13(_$arr_40);

var ___extend_13 = ___interopRequireDefault_13(_$extend_46);

var ___normalizeListeners_13 = ___interopRequireDefault_13(_$normalizeListeners_53);

function ___interopRequireDefault_13(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___interopRequireWildcard_13(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function ___classCallCheck_13(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_13(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_13(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_13(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_13(Constructor, staticProps); return Constructor; }

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

var Eventable =
/*#__PURE__*/
function () {
  function Eventable(options) {
    ___classCallCheck_13(this, Eventable);

    this.options = (0, ___extend_13.default)({}, options || {});
    this.types = {};
    this.propagationStopped = this.immediatePropagationStopped = false;
  }

  ___createClass_13(Eventable, [{
    key: "fire",
    value: function fire(event) {
      var listeners;
      var global = this.global; // Interactable#on() listeners

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
      var listeners = (0, ___normalizeListeners_13.default)(type, listener);

      for (type in listeners) {
        this.types[type] = __arr_13.merge(this.types[type] || [], listeners[type]);
      }
    }
  }, {
    key: "off",
    value: function off(type, listener) {
      var listeners = (0, ___normalizeListeners_13.default)(type, listener);

      for (type in listeners) {
        var eventList = this.types[type];

        if (!eventList || !eventList.length) {
          continue;
        }

        for (var _i2 = 0; _i2 < listeners[type].length; _i2++) {
          listener = listeners[type][_i2];
          var index = eventList.indexOf(listener);

          if (index !== -1) {
            eventList.splice(index, 1);
          }
        }
      }
    }
  }]);

  return Eventable;
}();

var ___default_13 = Eventable;
_$Eventable_13.default = ___default_13;

var _$Interactable_15 = {};
"use strict";

Object.defineProperty(_$Interactable_15, "__esModule", {
  value: true
});
_$Interactable_15.default = void 0;

var ___clone_15 = ___interopRequireDefault_15(_$clone_42);

var __is_15 = ___interopRequireWildcard_15(_$is_51);

var ___events_15 = ___interopRequireDefault_15(_$events_45);

var ___extend_15 = ___interopRequireDefault_15(_$extend_46);

var __arr_15 = ___interopRequireWildcard_15(_$arr_40);

var ___normalizeListeners_15 = ___interopRequireDefault_15(_$normalizeListeners_53);

var _Eventable = ___interopRequireDefault_15(_$Eventable_13);

/* removed: var _$domUtils_44 = require("@interactjs/utils/domUtils"); */;

/* removed: var _$window_60 = require("@interactjs/utils/window"); */;

var ___browser_15 = ___interopRequireDefault_15(_$browser_41);

function ___interopRequireWildcard_15(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function ___interopRequireDefault_15(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___classCallCheck_15(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_15(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_15(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_15(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_15(Constructor, staticProps); return Constructor; }

var Interactable =
/*#__PURE__*/
function () {
  ___createClass_15(Interactable, [{
    key: "_defaults",
    get: function get() {
      return {
        base: {},
        perAction: {}
      };
    }
    /** */

  }]);

  function Interactable(target, options, defaultContext) {
    ___classCallCheck_15(this, Interactable);

    this._actions = options.actions;
    this.target = target;
    this.events = new _Eventable.default();
    this._context = options.context || defaultContext;
    this._win = (0, _$window_60.getWindow)((0, _$domUtils_44.trySelector)(target) ? this._context : target);
    this._doc = this._win.document;
    this.set(options);
  }

  ___createClass_15(Interactable, [{
    key: "setOnEvents",
    value: function setOnEvents(actionName, phases) {
      if (__is_15.func(phases.onstart)) {
        this.on("".concat(actionName, "start"), phases.onstart);
      }

      if (__is_15.func(phases.onmove)) {
        this.on("".concat(actionName, "move"), phases.onmove);
      }

      if (__is_15.func(phases.onend)) {
        this.on("".concat(actionName, "end"), phases.onend);
      }

      if (__is_15.func(phases.oninertiastart)) {
        this.on("".concat(actionName, "inertiastart"), phases.oninertiastart);
      }

      return this;
    }
  }, {
    key: "updatePerActionListeners",
    value: function updatePerActionListeners(actionName, prev, cur) {
      if (__is_15.array(prev)) {
        this.off(actionName, prev);
      }

      if (__is_15.array(cur)) {
        this.on(actionName, cur);
      }
    }
  }, {
    key: "setPerAction",
    value: function setPerAction(actionName, options) {
      var defaults = this._defaults; // for all the default per-action options

      for (var optionName in options) {
        var actionOptions = this.options[actionName];
        var optionValue = options[optionName];
        var isArray = __is_15.array(optionValue); // remove old event listeners and add new ones

        if (optionName === 'listeners') {
          this.updatePerActionListeners(actionName, actionOptions.listeners, optionValue);
        } // if the option value is an array


        if (isArray) {
          actionOptions[optionName] = __arr_15.from(optionValue);
        } // if the option value is an object
        else if (!isArray && __is_15.plainObject(optionValue)) {
            // copy the object
            actionOptions[optionName] = (0, ___extend_15.default)(actionOptions[optionName] || {}, (0, ___clone_15.default)(optionValue)); // set anabled field to true if it exists in the defaults

            if (__is_15.object(defaults.perAction[optionName]) && 'enabled' in defaults.perAction[optionName]) {
              actionOptions[optionName].enabled = optionValue.enabled === false ? false : true;
            }
          } // if the option value is a boolean and the default is an object
          else if (__is_15.bool(optionValue) && __is_15.object(defaults.perAction[optionName])) {
              actionOptions[optionName].enabled = optionValue;
            } // if it's anything else, do a plain assignment
            else {
                actionOptions[optionName] = optionValue;
              }
      }
    }
    /**
     * The default function to get an Interactables bounding rect. Can be
     * overridden using {@link Interactable.rectChecker}.
     *
     * @param {Element} [element] The element to measure.
     * @return {object} The object's bounding rectangle.
     */

  }, {
    key: "getRect",
    value: function getRect(element) {
      element = element || this.target;

      if (__is_15.string(this.target) && !__is_15.element(element)) {
        element = this._context.querySelector(this.target);
      }

      return (0, _$domUtils_44.getElementRect)(element);
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
      if (__is_15.func(checker)) {
        this.getRect = checker;
        return this;
      }

      if (checker === null) {
        delete this.options.getRect;
        return this;
      }

      return this.getRect;
    }
  }, {
    key: "_backCompatOption",
    value: function _backCompatOption(optionName, newValue) {
      if ((0, _$domUtils_44.trySelector)(newValue) || __is_15.object(newValue)) {
        this.options[optionName] = newValue;

        for (var _i = 0; _i < this._actions.names.length; _i++) {
          var _ref;

          _ref = this._actions.names[_i];
          var action = _ref;
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
      return this._context === element.ownerDocument || (0, _$domUtils_44.nodeContains)(this._context, element);
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
      if (__is_15.object(typeArg) && !__is_15.array(typeArg)) {
        options = listenerArg;
        listenerArg = null;
      }

      var addRemove = method === 'on' ? 'add' : 'remove';
      var listeners = (0, ___normalizeListeners_15.default)(typeArg, listenerArg);

      for (var type in listeners) {
        if (type === 'wheel') {
          type = ___browser_15.default.wheelEvent;
        }

        for (var _i2 = 0; _i2 < listeners[type].length; _i2++) {
          var _ref2;

          _ref2 = listeners[type][_i2];
          var listener = _ref2;

          // if it is an action event type
          if (__arr_15.contains(this._actions.eventTypes, type)) {
            this.events[method](type, listener);
          } // delegated event
          else if (__is_15.string(this.target)) {
              ___events_15.default["".concat(addRemove, "Delegate")](this.target, this._context, type, listener, options);
            } // remove listener from this Interatable's element
            else {
                ___events_15.default[addRemove](this.target, type, listener, options);
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

      if (!__is_15.object(options)) {
        options = {};
      }

      this.options = (0, ___clone_15.default)(defaults.base);

      for (var actionName in this._actions.methodDict) {
        var methodName = this._actions.methodDict[actionName];
        this.options[actionName] = {};
        this.setPerAction(actionName, (0, ___extend_15.default)((0, ___extend_15.default)({}, defaults.perAction), defaults[actionName]));
        this[methodName](options[actionName]);
      }

      for (var setting in options) {
        if (__is_15.func(this[setting])) {
          this[setting](options[setting]);
        }
      }

      return this;
    }
    /**
     * Remove this interactable from the list of interactables and remove it's
     * action capabilities and event listeners
     *
     * @return {interact}
     */

  }, {
    key: "unset",
    value: function unset() {
      ___events_15.default.remove(this.target, 'all');

      if (__is_15.string(this.target)) {
        // remove delegated events
        for (var type in ___events_15.default.delegatedEvents) {
          var delegated = ___events_15.default.delegatedEvents[type];

          if (delegated.selectors[0] === this.target && delegated.contexts[0] === this._context) {
            delegated.selectors.splice(0, 1);
            delegated.contexts.splice(0, 1);
            delegated.listeners.splice(0, 1); // remove the arrays if they are empty

            if (!delegated.selectors.length) {
              delegated[type] = null;
            }
          }

          ___events_15.default.remove(this._context, type, ___events_15.default.delegateListener);

          ___events_15.default.remove(this._context, type, ___events_15.default.delegateUseCapture, true);
        }
      } else {
        ___events_15.default.remove(this, 'all');
      }
    }
  }]);

  return Interactable;
}();

var ___default_15 = Interactable;
_$Interactable_15.default = ___default_15;

var _$Interaction_16 = {};
"use strict";

Object.defineProperty(_$Interaction_16, "__esModule", {
  value: true
});
_$Interaction_16.default = void 0;

var ___InteractEvent_16 = ___interopRequireDefault_16(_$InteractEvent_14);

var __utils_16 = ___interopRequireWildcard_16(_$utils_49);

function ___interopRequireWildcard_16(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function ___interopRequireDefault_16(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___classCallCheck_16(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_16(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_16(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_16(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_16(Constructor, staticProps); return Constructor; }

var Interaction =
/*#__PURE__*/
function () {
  ___createClass_16(Interaction, [{
    key: "pointerMoveTolerance",
    get: function get() {
      return 1;
    }
    /** */

  }]);

  function Interaction(_ref) {
    var pointerType = _ref.pointerType,
        signals = _ref.signals;

    ___classCallCheck_16(this, Interaction);

    this._signals = signals;
    this.target = null; // current interactable being interacted with

    this.element = null; // the target element of the interactable

    this.prepared = {
      // action that's ready to be fired on next move event
      name: null,
      axis: null,
      edges: null
    }; // keep track of added pointers

    this.pointers = [
      /* { id, pointer, event, target, downTime }*/
    ];
    this.coords = {
      // Starting InteractEvent pointer coordinates
      start: __utils_16.pointer.newCoords(),
      // Previous native pointer move event coordinates
      prev: __utils_16.pointer.newCoords(),
      // current native pointer move event coordinates
      cur: __utils_16.pointer.newCoords(),
      // Change in coordinates and time of the pointer
      delta: __utils_16.pointer.newCoords(),
      // pointer velocity
      velocity: __utils_16.pointer.newCoords()
    };
    this.downEvent = null; // pointerdown/mousedown/touchstart event

    this.downPointer = {};
    this._latestPointer = {
      pointer: null,
      event: null,
      eventTarget: null
    };
    this.prevEvent = null; // previous action event

    this.pointerIsDown = false;
    this.pointerWasMoved = false;
    this._interacting = false;
    this._ending = false;
    this.pointerType = pointerType;

    this._signals.fire('new', this);
  }

  ___createClass_16(Interaction, [{
    key: "pointerDown",
    value: function pointerDown(pointer, event, eventTarget) {
      var pointerIndex = this.updatePointer(pointer, event, eventTarget, true);

      this._signals.fire('down', {
        pointer: pointer,
        event: event,
        eventTarget: eventTarget,
        pointerIndex: pointerIndex,
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
     *     var interaction = event.interaction;
     *
     *     if (!interaction.interacting()) {
     *       interaction.start({ name: 'drag' },
     *                         event.interactable,
     *                         event.currentTarget);
     *     }
     * });
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
     * @return {object} interact
     */

  }, {
    key: "start",
    value: function start(action, target, element) {
      if (this.interacting() || !this.pointerIsDown || this.pointers.length < (action.name === 'gesture' ? 2 : 1)) {
        return;
      }

      __utils_16.copyAction(this.prepared, action);
      this.target = target;
      this.element = element;
      this._interacting = this._doPhase({
        interaction: this,
        event: this.downEvent,
        phase: 'start'
      });
    }
  }, {
    key: "pointerMove",
    value: function pointerMove(pointer, event, eventTarget) {
      if (!this.simulation) {
        this.updatePointer(pointer, event, eventTarget, false);
        __utils_16.pointer.setCoords(this.coords.cur, this.pointers.map(function (p) {
          return p.pointer;
        }));
      }

      var duplicateMove = this.coords.cur.page.x === this.coords.prev.page.x && this.coords.cur.page.y === this.coords.prev.page.y && this.coords.cur.client.x === this.coords.prev.client.x && this.coords.cur.client.y === this.coords.prev.client.y;
      var dx;
      var dy; // register movement greater than pointerMoveTolerance

      if (this.pointerIsDown && !this.pointerWasMoved) {
        dx = this.coords.cur.client.x - this.coords.start.client.x;
        dy = this.coords.cur.client.y - this.coords.start.client.y;
        this.pointerWasMoved = __utils_16.hypot(dx, dy) > this.pointerMoveTolerance;
      }

      var signalArg = {
        pointer: pointer,
        pointerIndex: this.getPointerIndex(pointer),
        event: event,
        eventTarget: eventTarget,
        dx: dx,
        dy: dy,
        duplicate: duplicateMove,
        interaction: this
      };

      if (!duplicateMove) {
        // set pointer coordinate, time changes and velocity
        __utils_16.pointer.setCoordDeltas(this.coords.delta, this.coords.prev, this.coords.cur);
        __utils_16.pointer.setCoordVelocity(this.coords.velocity, this.coords.delta);
      }

      this._signals.fire('move', signalArg);

      if (!duplicateMove) {
        // if interacting, fire an 'action-move' signal etc
        if (this.interacting()) {
          this.move(signalArg);
        }

        if (this.pointerWasMoved) {
          __utils_16.pointer.copyCoords(this.coords.prev, this.coords.cur);
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
     *       event.interactable.draggable({ snap: { targets: [] }});
     *       // fire another move event with re-calculated snap
     *       event.interaction.move();
     *     }
     *   });
     * ```
     *
     * Force a move of the current action at the same coordinates. Useful if
     * snap/restrict has been changed and you want a movement with the new
     * settings.
     */

  }, {
    key: "move",
    value: function move(signalArg) {
      signalArg = __utils_16.extend({
        pointer: this._latestPointer.pointer,
        event: this._latestPointer.event,
        eventTarget: this._latestPointer.eventTarget,
        interaction: this,
        noBefore: false
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

      this._signals.fire(/cancel$/i.test(event.type) ? 'cancel' : 'up', {
        pointer: pointer,
        pointerIndex: pointerIndex,
        event: event,
        eventTarget: eventTarget,
        curEventTarget: curEventTarget,
        interaction: this
      });

      if (!this.simulation) {
        this.end(event);
      }

      this.pointerIsDown = false;
      this.removePointer(pointer, event);
    }
  }, {
    key: "documentBlur",
    value: function documentBlur(event) {
      this.end(event);

      this._signals.fire('blur', {
        event: event,
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
     *       event.interaction.end();
     *       // stop all further listeners from being called
     *       event.stopImmediatePropagation();
     *     }
     *   });
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
      this._signals.fire('stop', {
        interaction: this
      });

      this.target = this.element = null;
      this._interacting = false;
      this.prepared.name = this.prevEvent = null;
    }
  }, {
    key: "getPointerIndex",
    value: function getPointerIndex(pointer) {
      var pointerId = __utils_16.pointer.getPointerId(pointer); // mouse and pen interactions may have only one pointer

      return this.pointerType === 'mouse' || this.pointerType === 'pen' ? this.pointers.length - 1 : __utils_16.arr.findIndex(this.pointers, function (curPointer) {
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
      var id = __utils_16.pointer.getPointerId(pointer);
      var pointerIndex = this.getPointerIndex(pointer);
      var pointerInfo = this.pointers[pointerIndex];
      down = down === false ? false : down || /(down|start)$/i.test(event.type);

      if (!pointerInfo) {
        pointerInfo = {
          id: id,
          pointer: pointer,
          event: event,
          downTime: null,
          downTarget: null
        };
        pointerIndex = this.pointers.length;
        this.pointers.push(pointerInfo);
      } else {
        pointerInfo.pointer = pointer;
      }

      if (down) {
        this.pointerIsDown = true;

        if (!this.interacting()) {
          __utils_16.pointer.setCoords(this.coords.start, this.pointers.map(function (p) {
            return p.pointer;
          }));
          __utils_16.pointer.copyCoords(this.coords.cur, this.coords.start);
          __utils_16.pointer.copyCoords(this.coords.prev, this.coords.start);
          __utils_16.pointer.pointerExtend(this.downPointer, pointer);
          this.downEvent = event;
          pointerInfo.downTime = this.coords.cur.timeStamp;
          pointerInfo.downTarget = eventTarget;
          this.pointerWasMoved = false;
        }
      }

      this._updateLatestPointer(pointer, event, eventTarget);

      this._signals.fire('update-pointer', {
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

      if (pointerIndex === -1) {
        return;
      }

      var pointerInfo = this.pointers[pointerIndex];

      this._signals.fire('remove-pointer', {
        pointer: pointer,
        event: event,
        pointerIndex: pointerIndex,
        pointerInfo: pointerInfo,
        interaction: this
      });

      this.pointers.splice(pointerIndex, 1);
    }
  }, {
    key: "_updateLatestPointer",
    value: function _updateLatestPointer(pointer, event, eventTarget) {
      this._latestPointer.pointer = pointer;
      this._latestPointer.event = event;
      this._latestPointer.eventTarget = eventTarget;
    }
  }, {
    key: "_createPreparedEvent",
    value: function _createPreparedEvent(event, phase, preEnd, type) {
      var actionName = this.prepared.name;
      return new ___InteractEvent_16.default(this, event, actionName, phase, this.element, null, preEnd, type);
    }
  }, {
    key: "_fireEvent",
    value: function _fireEvent(iEvent) {
      this.target.fire(iEvent);

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

      if (!signalArg.noBefore) {
        var beforeResult = this._signals.fire("before-action-".concat(phase), signalArg);

        if (beforeResult === false) {
          return false;
        }
      }

      var iEvent = signalArg.iEvent = this._createPreparedEvent(event, phase, preEnd, type);

      this._signals.fire("action-".concat(phase), signalArg);

      this._fireEvent(iEvent);

      this._signals.fire("after-action-".concat(phase), signalArg);

      return true;
    }
  }]);

  return Interaction;
}();
/**
 * @alias Interaction.prototype.move
 */


Interaction.prototype.doMove = __utils_16.warnOnce(function (signalArg) {
  this.move(signalArg);
}, 'The interaction.doMove() method has been renamed to interaction.move()');
var ___default_16 = Interaction;
_$Interaction_16.default = ___default_16;

var _$interactionFinder_50 = {};
"use strict";

Object.defineProperty(_$interactionFinder_50, "__esModule", {
  value: true
});
_$interactionFinder_50.default = void 0;

var __utils_50 = ___interopRequireWildcard_50(_$utils_49);

function ___interopRequireWildcard_50(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

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

          element = __utils_50.dom.parentNode(element);
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
  },
  // get first idle interaction with a matching pointerType
  idle: function idle(_ref9) {
    var pointerType = _ref9.pointerType,
        scope = _ref9.scope;

    for (var _i6 = 0; _i6 < scope.interactions.list.length; _i6++) {
      var _ref10;

      _ref10 = scope.interactions.list[_i6];
      var interaction = _ref10;

      // if there's already a pointer held down
      if (interaction.pointers.length === 1) {
        var target = interaction.target; // don't add this pointer if there is a target interactable and it
        // isn't gesturable

        if (target && !target.options.gesture.enabled) {
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
  return __utils_50.arr.some(interaction.pointers, function (_ref11) {
    var id = _ref11.id;
    return id === pointerId;
  });
}

var ___default_50 = finder;
_$interactionFinder_50.default = ___default_50;

var _$interactions_19 = {};
"use strict";

Object.defineProperty(_$interactions_19, "__esModule", {
  value: true
});
_$interactions_19.newInteraction = newInteraction;
_$interactions_19.default = void 0;

var _Interaction = ___interopRequireDefault_19(_$Interaction_16);

var ___events_19 = ___interopRequireDefault_19(_$events_45);

var _interactionFinder = ___interopRequireDefault_19(_$interactionFinder_50);

var ___browser_19 = ___interopRequireDefault_19(_$browser_41);

var ___domObjects_19 = ___interopRequireDefault_19(_$domObjects_43);

var ___pointerUtils_19 = ___interopRequireDefault_19(_$pointerUtils_55);

var ___Signals_19 = ___interopRequireDefault_19(_$Signals_39);

function ___interopRequireDefault_19(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___typeof_19(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_19 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_19 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_19(obj); }

function ___slicedToArray_19(arr, i) { return ___arrayWithHoles_19(arr) || ___iterableToArrayLimit_19(arr, i) || ___nonIterableRest_19(); }

function ___nonIterableRest_19() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function ___iterableToArrayLimit_19(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function ___arrayWithHoles_19(arr) { if (Array.isArray(arr)) return arr; }

function ___classCallCheck_19(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_19(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_19(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_19(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_19(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (___typeof_19(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var methodNames = ['pointerDown', 'pointerMove', 'pointerUp', 'updatePointer', 'removePointer', 'windowBlur'];

function __install_19(scope) {
  var signals = new ___Signals_19.default();
  var listeners = {};

  for (var _i = 0; _i < methodNames.length; _i++) {
    var method = methodNames[_i];
    listeners[method] = doOnInteractions(method, scope);
  }

  var eventMap = {
    /* 'eventType': listenerFunc */
  };
  var pEventTypes = ___browser_19.default.pEventTypes;

  if (___domObjects_19.default.PointerEvent) {
    eventMap[pEventTypes.down] = listeners.pointerDown;
    eventMap[pEventTypes.move] = listeners.pointerMove;
    eventMap[pEventTypes.up] = listeners.pointerUp;
    eventMap[pEventTypes.cancel] = listeners.pointerUp;
  } else {
    eventMap.mousedown = listeners.pointerDown;
    eventMap.mousemove = listeners.pointerMove;
    eventMap.mouseup = listeners.pointerUp;
    eventMap.touchstart = listeners.pointerDown;
    eventMap.touchmove = listeners.pointerMove;
    eventMap.touchend = listeners.pointerUp;
    eventMap.touchcancel = listeners.pointerUp;
  }

  eventMap.blur = function (event) {
    for (var _i2 = 0; _i2 < scope.interactions.list.length; _i2++) {
      var _ref;

      _ref = scope.interactions.list[_i2];
      var interaction = _ref;
      interaction.documentBlur(event);
    }
  };

  scope.signals.on('add-document', onDocSignal);
  scope.signals.on('remove-document', onDocSignal); // for ignoring browser's simulated mouse events

  scope.prevTouchTime = 0;

  scope.Interaction =
  /*#__PURE__*/
  function (_InteractionBase) {
    _inherits(Interaction, _InteractionBase);

    function Interaction() {
      ___classCallCheck_19(this, Interaction);

      return _possibleConstructorReturn(this, _getPrototypeOf(Interaction).apply(this, arguments));
    }

    ___createClass_19(Interaction, [{
      key: "pointerMoveTolerance",
      get: function get() {
        return scope.interactions.pointerMoveTolerance;
      },
      set: function set(value) {
        scope.interactions.pointerMoveTolerance = value;
      }
    }]);

    return Interaction;
  }(_Interaction.default);

  scope.interactions = {
    signals: signals,
    // all active and idle interactions
    list: [],
    new: function _new(options) {
      options.signals = signals;
      return new scope.Interaction(options);
    },
    listeners: listeners,
    eventMap: eventMap,
    pointerMoveTolerance: 1
  };
  scope.actions = {
    names: [],
    methodDict: {},
    eventTypes: []
  };
}

function doOnInteractions(method, scope) {
  return function (event) {
    var interactions = scope.interactions.list;

    var pointerType = ___pointerUtils_19.default.getPointerType(event);

    var _pointerUtils$getEven = ___pointerUtils_19.default.getEventTargets(event),
        _pointerUtils$getEven2 = ___slicedToArray_19(_pointerUtils$getEven, 2),
        eventTarget = _pointerUtils$getEven2[0],
        curEventTarget = _pointerUtils$getEven2[1];

    var matches = []; // [ [pointer, interaction], ...]

    if (___browser_19.default.supportsTouch && /touch/.test(event.type)) {
      scope.prevTouchTime = new Date().getTime();

      for (var _i3 = 0; _i3 < event.changedTouches.length; _i3++) {
        var _ref2;

        _ref2 = event.changedTouches[_i3];
        var changedTouch = _ref2;
        var pointer = changedTouch;

        var pointerId = ___pointerUtils_19.default.getPointerId(pointer);

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

      if (!___browser_19.default.supportsPointerEvent && /mouse/.test(event.type)) {
        // ignore mouse events while touch interactions are active
        for (var i = 0; i < interactions.length && !invalidPointer; i++) {
          invalidPointer = interactions[i].pointerType !== 'mouse' && interactions[i].pointerIsDown;
        } // try to ignore mouse events that are simulated by the browser
        // after a touch event


        invalidPointer = invalidPointer || new Date().getTime() - scope.prevTouchTime < 500 // on iOS and Firefox Mobile, MouseEvent.timeStamp is zero if simulated
        || event.timeStamp === 0;
      }

      if (!invalidPointer) {
        var _searchDetails = {
          pointer: event,
          pointerId: ___pointerUtils_19.default.getPointerId(event),
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


    for (var _i4 = 0; _i4 < matches.length; _i4++) {
      var _matches$_i = ___slicedToArray_19(matches[_i4], 4),
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

  var foundInteraction = _interactionFinder.default.search(searchDetails);

  var signalArg = {
    interaction: foundInteraction,
    searchDetails: searchDetails
  };
  scope.interactions.signals.fire('find', signalArg);
  return signalArg.interaction || newInteraction({
    pointerType: pointerType
  }, scope);
}

function newInteraction(options, scope) {
  var interaction = scope.interactions.new(options);
  scope.interactions.list.push(interaction);
  return interaction;
}

function onDocSignal(_ref3, signalName) {
  var doc = _ref3.doc,
      scope = _ref3.scope,
      options = _ref3.options;
  var eventMap = scope.interactions.eventMap;
  var eventMethod = signalName.indexOf('add') === 0 ? ___events_19.default.add : ___events_19.default.remove;

  if (scope.browser.isIOS && !options.events) {
    options.events = {
      passive: false
    };
  } // delegate event listener


  for (var eventType in ___events_19.default.delegatedEvents) {
    eventMethod(doc, eventType, ___events_19.default.delegateListener);
    eventMethod(doc, eventType, ___events_19.default.delegateUseCapture, true);
  }

  var eventOptions = options && options.events;

  for (var _eventType in eventMap) {
    eventMethod(doc, _eventType, eventMap[_eventType], eventOptions);
  }
}

var ___default_19 = {
  install: __install_19,
  onDocSignal: onDocSignal,
  doOnInteractions: doOnInteractions,
  newInteraction: newInteraction,
  methodNames: methodNames
};
_$interactions_19.default = ___default_19;

var _$scope_20 = {};
"use strict";

Object.defineProperty(_$scope_20, "__esModule", {
  value: true
});
_$scope_20.createScope = createScope;
/* common-shake removed: exports.initScope = */ void initScope;

var ___Eventable_20 = ___interopRequireDefault_20(_$Eventable_13);

var ___defaultOptions_20 = ___interopRequireDefault_20(_$defaultOptions_17);

var __utils_20 = ___interopRequireWildcard_20(_$utils_49);

var ___domObjects_20 = ___interopRequireDefault_20(_$domObjects_43);

var _interactions = ___interopRequireDefault_20(_$interactions_19);

var ___InteractEvent_20 = ___interopRequireDefault_20(_$InteractEvent_14);

var _Interactable = ___interopRequireDefault_20(_$Interactable_15);

function ___interopRequireWildcard_20(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function ___interopRequireDefault_20(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___typeof_20(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_20 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_20 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_20(obj); }

function ___classCallCheck_20(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_20(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_20(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_20(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_20(Constructor, staticProps); return Constructor; }

function ___possibleConstructorReturn_20(self, call) { if (call && (___typeof_20(call) === "object" || typeof call === "function")) { return call; } return ___assertThisInitialized_20(self); }

function ___assertThisInitialized_20(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = ___getPrototypeOf_20(object); if (object === null) break; } return object; }

function ___getPrototypeOf_20(o) { ___getPrototypeOf_20 = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return ___getPrototypeOf_20(o); }

function ___inherits_20(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) ___setPrototypeOf_20(subClass, superClass); }

function ___setPrototypeOf_20(o, p) { ___setPrototypeOf_20 = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return ___setPrototypeOf_20(o, p); }

var __win_20 = __utils_20.win,
    __browser_20 = __utils_20.browser,
    raf = __utils_20.raf,
    __Signals_20 = __utils_20.Signals,
    __events_20 = __utils_20.events;

function createScope() {
  var scope = {
    Signals: __Signals_20,
    signals: new __Signals_20(),
    browser: __browser_20,
    events: __events_20,
    utils: __utils_20,
    defaults: __utils_20.clone(___defaultOptions_20.default),
    Eventable: ___Eventable_20.default,
    InteractEvent: ___InteractEvent_20.default,
    Interactable:
    /*#__PURE__*/
    function (_InteractableBase) {
      ___inherits_20(Interactable, _InteractableBase);

      function Interactable() {
        ___classCallCheck_20(this, Interactable);

        return ___possibleConstructorReturn_20(this, ___getPrototypeOf_20(Interactable).apply(this, arguments));
      }

      ___createClass_20(Interactable, [{
        key: "set",
        value: function set(options) {
          _get(___getPrototypeOf_20(Interactable.prototype), "set", this).call(this, options);

          scope.interactables.signals.fire('set', {
            options: options,
            interactable: this
          });
          return this;
        }
      }, {
        key: "unset",
        value: function unset() {
          _get(___getPrototypeOf_20(Interactable.prototype), "unset", this).call(this);

          scope.interactables.signals.fire('unset', {
            interactable: this
          });
        }
      }, {
        key: "_defaults",
        get: function get() {
          return scope.defaults;
        }
      }]);

      return Interactable;
    }(_Interactable.default),
    interactables: {
      // all set interactables
      list: [],
      new: function _new(target, options) {
        options = __utils_20.extend(options || {}, {
          actions: scope.actions
        });
        var interactable = new scope.Interactable(target, options, scope.document);
        scope.addDocument(interactable._doc);
        scope.interactables.list.push(interactable);
        scope.interactables.signals.fire('new', {
          target: target,
          options: options,
          interactable: interactable,
          win: this._win
        });
        return interactable;
      },
      indexOfElement: function indexOfElement(target, context) {
        context = context || scope.document;
        var list = this.list;

        for (var i = 0; i < list.length; i++) {
          var interactable = list[i];

          if (interactable.target === target && interactable._context === context) {
            return i;
          }
        }

        return -1;
      },
      get: function get(element, options, dontCheckInContext) {
        var ret = this.list[this.indexOfElement(element, options && options.context)];
        return ret && (__utils_20.is.string(element) || dontCheckInContext || ret.inContext(element)) ? ret : null;
      },
      forEachMatch: function forEachMatch(element, callback) {
        for (var _i = 0; _i < this.list.length; _i++) {
          var _ref;

          _ref = this.list[_i];
          var interactable = _ref;
          var ret = void 0;

          if ((__utils_20.is.string(interactable.target) // target is a selector and the element matches
          ? __utils_20.is.element(element) && __utils_20.dom.matchesSelector(element, interactable.target) : // target is the element
          element === interactable.target) && // the element is in context
          interactable.inContext(element)) {
            ret = callback(interactable);
          }

          if (ret !== undefined) {
            return ret;
          }
        }
      },
      signals: new __utils_20.Signals()
    },
    // main document
    document: null,
    // all documents being listened to
    documents: [
      /* { doc, options } */
    ],
    init: function init(window) {
      return initScope(scope, window);
    },
    addDocument: function addDocument(doc, options) {
      // do nothing if document is already known
      if (scope.getDocIndex(doc) !== -1) {
        return false;
      }

      var window = __win_20.getWindow(doc);
      options = options ? __utils_20.extend({}, options) : {};
      scope.documents.push({
        doc: doc,
        options: options
      });
      __events_20.documents.push(doc); // don't add an unload event for the main document
      // so that the page may be cached in browser history

      if (doc !== scope.document) {
        __events_20.add(window, 'unload', scope.onWindowUnload);
      }

      scope.signals.fire('add-document', {
        doc: doc,
        window: window,
        scope: scope,
        options: options
      });
    },
    removeDocument: function removeDocument(doc) {
      var index = scope.getDocIndex(doc);
      var window = __win_20.getWindow(doc);
      var options = scope.documents[index].options;
      __events_20.remove(window, 'unload', scope.onWindowUnload);
      scope.documents.splice(index, 1);
      __events_20.documents.splice(index, 1);
      scope.signals.fire('remove-document', {
        doc: doc,
        window: window,
        scope: scope,
        options: options
      });
    },
    onWindowUnload: function onWindowUnload(event) {
      scope.removeDocument(event.currentTarget.document);
    },
    getDocIndex: function getDocIndex(doc) {
      for (var i = 0; i < scope.documents.length; i++) {
        if (scope.documents[i].doc === doc) {
          return i;
        }
      }

      return -1;
    },
    getDocOptions: function getDocOptions(doc) {
      var docIndex = scope.getDocIndex(doc);
      return docIndex === -1 ? null : scope.documents[docIndex].options;
    }
  };
  return scope;
}

function initScope(scope, window) {
  __win_20.init(window);

  ___domObjects_20.default.init(window);

  __browser_20.init(window);
  raf.init(window);
  __events_20.init(window);

  _interactions.default.install(scope);

  scope.document = window.document;
  return scope;
}

var _$interact_23 = {};
"use strict";

Object.defineProperty(_$interact_23, "__esModule", {
  value: true
});
_$interact_23.default = _$interact_23.scope = void 0;

var ___browser_23 = ___interopRequireDefault_23(_$browser_41);

var ___events_23 = ___interopRequireDefault_23(_$events_45);

var __utils_23 = ___interopRequireWildcard_23(_$utils_49);

/* removed: var _$scope_20 = require("@interactjs/core/scope"); */;

function ___interopRequireWildcard_23(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function ___interopRequireDefault_23(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @module interact */
var globalEvents = {};
var scope = (0, _$scope_20.createScope)();
/**
 * ```js
 * interact('#draggable').draggable(true);
 *
 * var rectables = interact('rect');
 * rectables
 *   .gesturable(true)
 *   .on('gesturemove', function (event) {
 *       // ...
 *   });
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

_$interact_23.scope = scope;

function interact(target, options) {
  var interactable = scope.interactables.get(target, options);

  if (!interactable) {
    interactable = scope.interactables.new(target, options);
    interactable.events.global = globalEvents;
  }

  return interactable;
}

scope._plugins = [];
/**
 * Use a plugin
 *
 * @alias module:interact.use
 *
 * @param {Object} plugin
 * @param {function} plugin.install
 * @return {interact}
*/

interact.use = function (plugin) {
  if (scope._plugins.indexOf(plugin) !== -1) {
    return;
  }

  plugin.install(scope);

  scope._plugins.push(plugin);

  return interact;
};
/**
 * Check if an element or selector has been set with the {@link interact}
 * function
 *
 * @alias module:interact.isSet
 *
 * @param {Element} element The Element being searched for
 * @return {boolean} Indicates if the element or CSS selector was previously
 * passed to interact
*/


interact.isSet = function (element, options) {
  return scope.interactables.indexOfElement(element, options && options.context) !== -1;
};
/**
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


interact.on = function (type, listener, options) {
  if (__utils_23.is.string(type) && type.search(' ') !== -1) {
    type = type.trim().split(/ +/);
  }

  if (__utils_23.is.array(type)) {
    for (var _i = 0; _i < type.length; _i++) {
      var _ref;

      _ref = type[_i];
      var eventType = _ref;
      interact.on(eventType, listener, options);
    }

    return interact;
  }

  if (__utils_23.is.object(type)) {
    for (var prop in type) {
      interact.on(prop, type[prop], listener);
    }

    return interact;
  } // if it is an InteractEvent type, add listener to globalEvents


  if (__utils_23.arr.contains(scope.actions.eventTypes, type)) {
    // if this type of event was never bound
    if (!globalEvents[type]) {
      globalEvents[type] = [listener];
    } else {
      globalEvents[type].push(listener);
    }
  } // If non InteractEvent type, addEventListener to document
  else {
      ___events_23.default.add(scope.document, type, listener, {
        options: options
      });
    }

  return interact;
};
/**
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


interact.off = function (type, listener, options) {
  if (__utils_23.is.string(type) && type.search(' ') !== -1) {
    type = type.trim().split(/ +/);
  }

  if (__utils_23.is.array(type)) {
    for (var _i2 = 0; _i2 < type.length; _i2++) {
      var _ref2;

      _ref2 = type[_i2];
      var eventType = _ref2;
      interact.off(eventType, listener, options);
    }

    return interact;
  }

  if (__utils_23.is.object(type)) {
    for (var prop in type) {
      interact.off(prop, type[prop], listener);
    }

    return interact;
  }

  if (!__utils_23.arr.contains(scope.actions.eventTypes, type)) {
    ___events_23.default.remove(scope.document, type, listener, options);
  } else {
    var index;

    if (type in globalEvents && (index = globalEvents[type].indexOf(listener)) !== -1) {
      globalEvents[type].splice(index, 1);
    }
  }

  return interact;
};
/**
 * Returns an object which exposes internal data

 * @alias module:interact.debug
 *
 * @return {object} An object with properties that outline the current state
 * and expose internal functions and variables
 */


interact.debug = function () {
  return scope;
}; // expose the functions used to calculate multi-touch properties


interact.getPointerAverage = __utils_23.pointer.pointerAverage;
interact.getTouchBBox = __utils_23.pointer.touchBBox;
interact.getTouchDistance = __utils_23.pointer.touchDistance;
interact.getTouchAngle = __utils_23.pointer.touchAngle;
interact.getElementRect = __utils_23.dom.getElementRect;
interact.getElementClientRect = __utils_23.dom.getElementClientRect;
interact.matchesSelector = __utils_23.dom.matchesSelector;
interact.closest = __utils_23.dom.closest;
/**
 * @alias module:interact.supportsTouch
 *
 * @return {boolean} Whether or not the browser supports touch input
 */

interact.supportsTouch = function () {
  return ___browser_23.default.supportsTouch;
};
/**
 * @alias module:interact.supportsPointerEvent
 *
 * @return {boolean} Whether or not the browser supports PointerEvents
 */


interact.supportsPointerEvent = function () {
  return ___browser_23.default.supportsPointerEvent;
};
/**
 * Cancels all interactions (end events are not fired)
 *
 * @alias module:interact.stop
 *
 * @param {Event} event An event on which to call preventDefault()
 * @return {object} interact
 */


interact.stop = function (event) {
  for (var _i3 = 0; _i3 < scope.interactions.list.length; _i3++) {
    var _ref3;

    _ref3 = scope.interactions.list[_i3];
    var interaction = _ref3;
    interaction.stop(event);
  }

  return interact;
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
  if (__utils_23.is.number(newValue)) {
    scope.interactions.pointerMoveTolerance = newValue;
    return interact;
  }

  return scope.interactions.pointerMoveTolerance;
};

scope.interactables.signals.on('unset', function (_ref4) {
  var interactable = _ref4.interactable;
  scope.interactables.list.splice(scope.interactables.list.indexOf(interactable), 1); // Stop related interactions when an Interactable is unset

  for (var _i4 = 0; _i4 < scope.interactions.list.length; _i4++) {
    var _ref5;

    _ref5 = scope.interactions.list[_i4];
    var interaction = _ref5;

    if (interaction.target === interactable && interaction.interacting() && interaction._ending) {
      interaction.stop();
    }
  }
});
interact.addDocument = scope.addDocument;
interact.removeDocument = scope.removeDocument;
scope.interact = interact;
var ___default_23 = interact;
_$interact_23.default = ___default_23;

var _$pointer_28 = {};
"use strict";

Object.defineProperty(_$pointer_28, "__esModule", {
  value: true
});
_$pointer_28.default = void 0;

var __is_28 = ___interopRequireWildcard_28(_$is_51);

var ___rect_28 = ___interopRequireDefault_28(_$rect_57);

function ___interopRequireDefault_28(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___interopRequireWildcard_28(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function __start_28(_ref) {
  var rect = _ref.rect,
      startOffset = _ref.startOffset,
      state = _ref.state;
  var options = state.options;
  var elementRect = options.elementRect;
  var offset = {};

  if (rect && elementRect) {
    offset.left = startOffset.left - rect.width * elementRect.left;
    offset.top = startOffset.top - rect.height * elementRect.top;
    offset.right = startOffset.right - rect.width * (1 - elementRect.right);
    offset.bottom = startOffset.bottom - rect.height * (1 - elementRect.bottom);
  } else {
    offset.left = offset.top = offset.right = offset.bottom = 0;
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

  if (!restriction) {
    return state;
  }

  var rect = restriction; // object is assumed to have
  // x, y, width, height or
  // left, top, right, bottom

  if ('x' in restriction && 'y' in restriction) {
    coords.x = Math.max(Math.min(rect.x + rect.width - offset.right, coords.x), rect.x + offset.left);
    coords.y = Math.max(Math.min(rect.y + rect.height - offset.bottom, coords.y), rect.y + offset.top);
  } else {
    coords.x = Math.max(Math.min(rect.right - offset.right, coords.x), rect.left + offset.left);
    coords.y = Math.max(Math.min(rect.bottom - offset.bottom, coords.y), rect.top + offset.top);
  }
}

function getRestrictionRect(value, interaction, coords) {
  if (__is_28.func(value)) {
    return ___rect_28.default.resolveRectLike(value, interaction.target, interaction.element, [coords.x, coords.y, interaction]);
  } else {
    return ___rect_28.default.resolveRectLike(value, interaction.target, interaction.element);
  }
}

var restrict = {
  start: __start_28,
  set: set,
  getRestrictionRect: getRestrictionRect,
  defaults: {
    enabled: false,
    restriction: null,
    elementRect: null
  }
};
var ___default_28 = restrict;
_$pointer_28.default = ___default_28;

var _$edges_27 = {};
"use strict";

Object.defineProperty(_$edges_27, "__esModule", {
  value: true
});
_$edges_27.default = void 0;

var ___extend_27 = ___interopRequireDefault_27(_$extend_46);

var ___rect_27 = ___interopRequireDefault_27(_$rect_57);

var _pointer = ___interopRequireDefault_27(_$pointer_28);

function ___interopRequireDefault_27(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// This module adds the options.resize.restrictEdges setting which sets min and
// max for the top, left, bottom and right edges of the target being resized.
//
// interact(target).resize({
//   edges: { top: true, left: true },
//   restrictEdges: {
//     inner: { top: 200, left: 200, right: 400, bottom: 400 },
//     outer: { top:   0, left:   0, right: 600, bottom: 600 },
//   },
// });
var __getRestrictionRect_27 = _pointer.default.getRestrictionRect;
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

function __start_27(_ref) {
  var interaction = _ref.interaction,
      state = _ref.state;
  var options = state.options;
  var startOffset = interaction.modifiers.startOffset;
  var offset;

  if (options) {
    var offsetRect = __getRestrictionRect_27(options.offset, interaction, interaction.coords.start.page);
    offset = ___rect_27.default.rectToXY(offsetRect);
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

function __set_27(_ref2) {
  var coords = _ref2.coords,
      interaction = _ref2.interaction,
      state = _ref2.state;
  var offset = state.offset,
      options = state.options;
  var edges = interaction.prepared.linkedEdges || interaction.prepared.edges;

  if (!edges) {
    return;
  }

  var page = (0, ___extend_27.default)({}, coords);
  var inner = __getRestrictionRect_27(options.inner, interaction, page) || {};
  var outer = __getRestrictionRect_27(options.outer, interaction, page) || {};
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

var restrictEdges = {
  noInner: noInner,
  noOuter: noOuter,
  getRestrictionRect: __getRestrictionRect_27,
  start: __start_27,
  set: __set_27,
  defaults: {
    enabled: false,
    inner: null,
    outer: null,
    offset: null
  }
};
var ___default_27 = restrictEdges;
_$edges_27.default = ___default_27;

var _$size_29 = {};
"use strict";

Object.defineProperty(_$size_29, "__esModule", {
  value: true
});
_$size_29.default = void 0;

var ___extend_29 = ___interopRequireDefault_29(_$extend_46);

var ___rect_29 = ___interopRequireDefault_29(_$rect_57);

var _edges = ___interopRequireDefault_29(_$edges_27);

function ___interopRequireDefault_29(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// This module adds the options.resize.restrictSize setting which sets min and
// max width and height for the target being resized.
//
// interact(target).resize({
//   edges: { top: true, left: true },
//   restrictSize: {
//     min: { width: -600, height: -600 },
//     max: { width:  600, height:  600 },
//   },
// });
var noMin = {
  width: -Infinity,
  height: -Infinity
};
var noMax = {
  width: +Infinity,
  height: +Infinity
};

function __start_29(arg) {
  return _edges.default.start(arg);
}

function __set_29(arg) {
  var interaction = arg.interaction,
      state = arg.state;
  var options = state.options;
  var edges = interaction.prepared.linkedEdges || interaction.prepared.edges;

  if (!edges) {
    return;
  }

  var rect = ___rect_29.default.xywhToTlbr(interaction.resizeRects.inverted);

  var minSize = ___rect_29.default.tlbrToXywh(_edges.default.getRestrictionRect(options.min, interaction)) || noMin;
  var maxSize = ___rect_29.default.tlbrToXywh(_edges.default.getRestrictionRect(options.max, interaction)) || noMax;
  state.options = {
    enabled: options.enabled,
    endOnly: options.endOnly,
    inner: (0, ___extend_29.default)({}, _edges.default.noInner),
    outer: (0, ___extend_29.default)({}, _edges.default.noOuter)
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

  _edges.default.set(arg);

  state.options = options;
}

var restrictSize = {
  start: __start_29,
  set: __set_29,
  defaults: {
    enabled: false,
    min: null,
    max: null
  }
};
var ___default_29 = restrictSize;
_$size_29.default = ___default_29;

var _$pointer_31 = {};
"use strict";

Object.defineProperty(_$pointer_31, "__esModule", {
  value: true
});
_$pointer_31.default = void 0;

var __utils_31 = ___interopRequireWildcard_31(_$utils_49);

function ___interopRequireWildcard_31(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function __start_31(_ref) {
  var interaction = _ref.interaction,
      interactable = _ref.interactable,
      element = _ref.element,
      rect = _ref.rect,
      state = _ref.state,
      startOffset = _ref.startOffset;
  var options = state.options;
  var offsets = [];
  var optionsOrigin = __utils_31.rect.rectToXY(__utils_31.rect.resolveRectLike(options.origin));
  var origin = optionsOrigin || __utils_31.getOriginXY(interactable, element, interaction.prepared.name);
  var snapOffset;

  if (options.offset === 'startCoords') {
    snapOffset = {
      x: interaction.coords.start.page.x - origin.x,
      y: interaction.coords.start.page.y - origin.y
    };
  } else {
    var offsetRect = __utils_31.rect.resolveRectLike(options.offset, interactable, element, [interaction]);
    snapOffset = __utils_31.rect.rectToXY(offsetRect) || {
      x: 0,
      y: 0
    };
  }

  var relativePoints = options.relativePoints || [];

  if (rect && options.relativePoints && options.relativePoints.length) {
    for (var index = 0; index < relativePoints.length; index++) {
      var relativePoint = relativePoints[index];
      offsets.push({
        index: index,
        relativePoint: relativePoint,
        x: startOffset.left - rect.width * relativePoint.x + snapOffset.x,
        y: startOffset.top - rect.height * relativePoint.y + snapOffset.y
      });
    }
  } else {
    offsets.push(__utils_31.extend({
      index: 0,
      relativePoint: null
    }, snapOffset));
  }

  state.offsets = offsets;
}

function __set_31(_ref2) {
  var interaction = _ref2.interaction,
      coords = _ref2.coords,
      state = _ref2.state;
  var options = state.options,
      offsets = state.offsets;
  var origin = __utils_31.getOriginXY(interaction.target, interaction.element, interaction.prepared.name);
  var page = __utils_31.extend({}, coords);
  var targets = [];
  var target;
  var i;
  page.x -= origin.x;
  page.y -= origin.y;
  state.realX = page.x;
  state.realY = page.y;
  var len = options.targets ? options.targets.length : 0;

  for (var _i = 0; _i < offsets.length; _i++) {
    var _ref3;

    _ref3 = offsets[_i];
    var offset = _ref3;
    var relativeX = page.x - offset.x;
    var relativeY = page.y - offset.y;

    for (var index = 0; index < options.targets.length; index++) {
      var snapTarget = options.targets[index];

      if (__utils_31.is.func(snapTarget)) {
        target = snapTarget(relativeX, relativeY, interaction, offset, index);
      } else {
        target = snapTarget;
      }

      if (!target) {
        continue;
      }

      targets.push({
        x: __utils_31.is.number(target.x) ? target.x + offset.x : relativeX,
        y: __utils_31.is.number(target.y) ? target.y + offset.y : relativeY,
        range: __utils_31.is.number(target.range) ? target.range : options.range
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
    var range = target.range;
    var dx = target.x - page.x;
    var dy = target.y - page.y;
    var distance = __utils_31.hypot(dx, dy);
    var inRange = distance <= range; // Infinite targets count as being out of range
    // compared to non infinite ones that are in range

    if (range === Infinity && closest.inRange && closest.range !== Infinity) {
      inRange = false;
    }

    if (!closest.target || (inRange // is the closest target in range?
    ? closest.inRange && range !== Infinity // the pointer is relatively deeper in this target
    ? distance / range < closest.distance / closest.range // this target has Infinite range and the closest doesn't
    : range === Infinity && closest.range !== Infinity || // OR this target is closer that the previous closest
    distance < closest.distance : // The other is not in range and the pointer is closer to this target
    !closest.inRange && distance < closest.distance)) {
      closest.target = target;
      closest.distance = distance;
      closest.range = range;
      closest.inRange = inRange;
      closest.dx = dx;
      closest.dy = dy;
      state.range = range;
    }
  }

  if (closest.inRange) {
    coords.x = closest.target.x;
    coords.y = closest.target.y;
  }

  state.closest = closest;
}

var snap = {
  start: __start_31,
  set: __set_31,
  defaults: {
    enabled: false,
    range: Infinity,
    targets: null,
    offset: null,
    relativePoints: null
  }
};
var ___default_31 = snap;
_$pointer_31.default = ___default_31;

var _$size_32 = {};
"use strict";

Object.defineProperty(_$size_32, "__esModule", {
  value: true
});
_$size_32.default = void 0;

var ___extend_32 = ___interopRequireDefault_32(_$extend_46);

var __is_32 = ___interopRequireWildcard_32(_$is_51);

var ___pointer_32 = ___interopRequireDefault_32(_$pointer_31);

function ___interopRequireWildcard_32(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function ___interopRequireDefault_32(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___slicedToArray_32(arr, i) { return ___arrayWithHoles_32(arr) || ___iterableToArrayLimit_32(arr, i) || ___nonIterableRest_32(); }

function ___nonIterableRest_32() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function ___iterableToArrayLimit_32(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function ___arrayWithHoles_32(arr) { if (Array.isArray(arr)) return arr; }

function __start_32(arg) {
  var interaction = arg.interaction,
      state = arg.state;
  var options = state.options;
  var edges = interaction.prepared.edges;

  if (!edges) {
    return null;
  }

  arg.state = {
    options: {
      relativePoints: [{
        x: edges.left ? 0 : 1,
        y: edges.top ? 0 : 1
      }],
      origin: {
        x: 0,
        y: 0
      },
      offset: options.offset || 'self',
      range: options.range
    }
  };
  state.targetFields = state.targetFields || [['width', 'height'], ['x', 'y']];

  ___pointer_32.default.start(arg);

  state.offsets = arg.state.offsets;
  arg.state = state;
}

function __set_32(arg) {
  var interaction = arg.interaction,
      state = arg.state,
      coords = arg.coords;
  var options = state.options,
      offsets = state.offsets;
  var relative = {
    x: coords.x - offsets[0].x,
    y: coords.y - offsets[0].y
  };
  state.options = (0, ___extend_32.default)({}, options);
  state.options.targets = [];

  for (var _i = 0; _i < (options.targets || []).length; _i++) {
    var _ref;

    _ref = (options.targets || [])[_i];
    var snapTarget = _ref;
    var target = void 0;

    if (__is_32.func(snapTarget)) {
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
          _ref4 = ___slicedToArray_32(_ref3, 2),
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

  ___pointer_32.default.set(arg);

  state.options = options;
}

var snapSize = {
  start: __start_32,
  set: __set_32,
  defaults: {
    enabled: false,
    range: Infinity,
    targets: null,
    offset: null
  }
};
var ___default_32 = snapSize;
_$size_32.default = ___default_32;

var _$edges_30 = {};
"use strict";

Object.defineProperty(_$edges_30, "__esModule", {
  value: true
});
_$edges_30.default = void 0;

var ___clone_30 = ___interopRequireDefault_30(_$clone_42);

var ___extend_30 = ___interopRequireDefault_30(_$extend_46);

var _size = ___interopRequireDefault_30(_$size_32);

function ___interopRequireDefault_30(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @module modifiers/snapEdges
 *
 * @description
 * This module allows snapping of the edges of targets during resize
 * interactions.
 *
 * @example
 * interact(target).resizable({
 *   snapEdges: {
 *     targets: [interact.snappers.grid({ x: 100, y: 50 })],
 *   },
 * });
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
 * });
 */
function __install_30(scope) {
  var defaults = scope.defaults;
  defaults.perAction.snapEdges = snapEdges.defaults;
}

function __start_30(arg) {
  var edges = arg.interaction.prepared.edges;

  if (!edges) {
    return null;
  }

  arg.state.targetFields = arg.state.targetFields || [[edges.left ? 'left' : 'right', edges.top ? 'top' : 'bottom']];
  return _size.default.start(arg);
}

function __set_30(arg) {
  return _size.default.set(arg);
}

function modifyCoords(arg) {
  _size.default.modifyCoords(arg);
}

var snapEdges = {
  install: __install_30,
  start: __start_30,
  set: __set_30,
  modifyCoords: modifyCoords,
  defaults: (0, ___extend_30.default)((0, ___clone_30.default)(_size.default.defaults), {
    offset: {
      x: 0,
      y: 0
    }
  })
};
var ___default_30 = snapEdges;
_$edges_30.default = ___default_30;

var _$modifiers_26 = {};
"use strict";

Object.defineProperty(_$modifiers_26, "__esModule", {
  value: true
});
_$modifiers_26.restrictSize = _$modifiers_26.restrictEdges = _$modifiers_26.restrict = _$modifiers_26.snapEdges = _$modifiers_26.snapSize = _$modifiers_26.snap = void 0;

var ___base_26 = ___interopRequireDefault_26(_$base_25);

var ___pointer_26 = ___interopRequireDefault_26(_$pointer_31);

var ___size_26 = ___interopRequireDefault_26(_$size_32);

var ___edges_26 = ___interopRequireDefault_26(_$edges_30);

var _pointer2 = ___interopRequireDefault_26(_$pointer_28);

var _edges2 = ___interopRequireDefault_26(_$edges_27);

var _size2 = ___interopRequireDefault_26(_$size_29);

function ___interopRequireDefault_26(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var __makeModifier_26 = ___base_26.default.makeModifier;
var __snap_26 = __makeModifier_26(___pointer_26.default, 'snap');
_$modifiers_26.snap = __snap_26;
var __snapSize_26 = __makeModifier_26(___size_26.default, 'snapSize');
_$modifiers_26.snapSize = __snapSize_26;
var __snapEdges_26 = __makeModifier_26(___edges_26.default, 'snapEdges');
_$modifiers_26.snapEdges = __snapEdges_26;
var __restrict_26 = __makeModifier_26(_pointer2.default, 'restrict');
_$modifiers_26.restrict = __restrict_26;
var __restrictEdges_26 = __makeModifier_26(_edges2.default, 'restrictEdges');
_$modifiers_26.restrictEdges = __restrictEdges_26;
var __restrictSize_26 = __makeModifier_26(_size2.default, 'restrictSize');
_$modifiers_26.restrictSize = __restrictSize_26;

var _$PointerEvent_33 = {};
"use strict";

Object.defineProperty(_$PointerEvent_33, "__esModule", {
  value: true
});
_$PointerEvent_33.default = void 0;

var ___pointerUtils_33 = ___interopRequireDefault_33(_$pointerUtils_55);

function ___interopRequireDefault_33(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___classCallCheck_33(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function ___defineProperties_33(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function ___createClass_33(Constructor, protoProps, staticProps) { if (protoProps) ___defineProperties_33(Constructor.prototype, protoProps); if (staticProps) ___defineProperties_33(Constructor, staticProps); return Constructor; }

var PointerEvent =
/*#__PURE__*/
function () {
  /** */
  function PointerEvent(type, pointer, event, eventTarget, interaction) {
    ___classCallCheck_33(this, PointerEvent);

    ___pointerUtils_33.default.pointerExtend(this, event);

    if (event !== pointer) {
      ___pointerUtils_33.default.pointerExtend(this, pointer);
    }

    this.interaction = interaction;
    this.timeStamp = new Date().getTime();
    this.originalEvent = event;
    this.type = type;
    this.pointerId = ___pointerUtils_33.default.getPointerId(pointer);
    this.pointerType = ___pointerUtils_33.default.getPointerType(pointer);
    this.target = eventTarget;
    this.currentTarget = null;

    if (type === 'tap') {
      var pointerIndex = interaction.getPointerIndex(pointer);
      this.dt = this.timeStamp - interaction.pointers[pointerIndex].downTime;
      var interval = this.timeStamp - interaction.tapTime;
      this.double = !!(interaction.prevTap && interaction.prevTap.type !== 'doubletap' && interaction.prevTap.target === this.target && interval < 500);
    } else if (type === 'doubletap') {
      this.dt = pointer.timeStamp - interaction.tapTime;
    }
  }

  ___createClass_33(PointerEvent, [{
    key: "subtractOrigin",
    value: function subtractOrigin(_ref) {
      var originX = _ref.x,
          originY = _ref.y;
      this.pageX -= originX;
      this.pageY -= originY;
      this.clientX -= originX;
      this.clientY -= originY;
      return this;
    }
  }, {
    key: "addOrigin",
    value: function addOrigin(_ref2) {
      var originX = _ref2.x,
          originY = _ref2.y;
      this.pageX += originX;
      this.pageY += originY;
      this.clientX += originX;
      this.clientY += originY;
      return this;
    }
    /** */

  }, {
    key: "preventDefault",
    value: function preventDefault() {
      this.originalEvent.preventDefault();
    }
    /** */

  }, {
    key: "stopPropagation",
    value: function stopPropagation() {
      this.propagationStopped = true;
    }
    /** */

  }, {
    key: "stopImmediatePropagation",
    value: function stopImmediatePropagation() {
      this.immediatePropagationStopped = this.propagationStopped = true;
    }
  }]);

  return PointerEvent;
}();

_$PointerEvent_33.default = PointerEvent;

var _$base_34 = {};
"use strict";

Object.defineProperty(_$base_34, "__esModule", {
  value: true
});
_$base_34.default = void 0;

var __utils_34 = ___interopRequireWildcard_34(_$utils_49);

var _PointerEvent = ___interopRequireDefault_34(_$PointerEvent_33);

function ___interopRequireDefault_34(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___interopRequireWildcard_34(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

var signals = new __utils_34.Signals();
var simpleSignals = ['down', 'up', 'cancel'];
var simpleEvents = ['down', 'up', 'cancel'];
var pointerEvents = {
  install: __install_34,
  signals: signals,
  PointerEvent: _PointerEvent.default,
  fire: fire,
  collectEventTargets: collectEventTargets,
  createSignalListener: createSignalListener,
  defaults: {
    holdDuration: 600,
    ignoreFrom: null,
    allowFrom: null,
    origin: {
      x: 0,
      y: 0
    }
  },
  types: ['down', 'move', 'up', 'cancel', 'tap', 'doubletap', 'hold']
};

function fire(arg) {
  var interaction = arg.interaction,
      pointer = arg.pointer,
      event = arg.event,
      eventTarget = arg.eventTarget,
      _arg$type = arg.type,
      type = _arg$type === void 0 ? arg.pointerEvent.type : _arg$type,
      _arg$targets = arg.targets,
      targets = _arg$targets === void 0 ? collectEventTargets(arg) : _arg$targets,
      _arg$pointerEvent = arg.pointerEvent,
      pointerEvent = _arg$pointerEvent === void 0 ? new _PointerEvent.default(type, pointer, event, eventTarget, interaction) : _arg$pointerEvent;
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
      pointerEvent[prop] = target.props[prop];
    }

    var origin = __utils_34.getOriginXY(target.eventable, target.element);
    pointerEvent.subtractOrigin(origin);
    pointerEvent.eventable = target.eventable;
    pointerEvent.currentTarget = target.element;
    target.eventable.fire(pointerEvent);
    pointerEvent.addOrigin(origin);

    if (pointerEvent.immediatePropagationStopped || pointerEvent.propagationStopped && i + 1 < targets.length && targets[i + 1].element !== pointerEvent.currentTarget) {
      break;
    }
  }

  signals.fire('fired', signalArg);

  if (type === 'tap') {
    // if pointerEvent should make a double tap, create and fire a doubletap
    // PointerEvent and use that as the prevTap
    var prevTap = pointerEvent.double ? fire({
      interaction: interaction,
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      type: 'doubletap'
    }) : pointerEvent;
    interaction.prevTap = prevTap;
    interaction.tapTime = prevTap.timeStamp;
  }

  return pointerEvent;
}

function collectEventTargets(_ref) {
  var interaction = _ref.interaction,
      pointer = _ref.pointer,
      event = _ref.event,
      eventTarget = _ref.eventTarget,
      type = _ref.type;
  var pointerIndex = interaction.getPointerIndex(pointer);
  var pointerInfo = interaction.pointers[pointerIndex]; // do not fire a tap event if the pointer was moved before being lifted

  if (type === 'tap' && (interaction.pointerWasMoved // or if the pointerup target is different to the pointerdown target
  || !(pointerInfo && pointerInfo.downTarget === eventTarget))) {
    return [];
  }

  var path = __utils_34.dom.getPath(eventTarget);
  var signalArg = {
    interaction: interaction,
    pointer: pointer,
    event: event,
    eventTarget: eventTarget,
    type: type,
    path: path,
    targets: [],
    element: null
  };

  for (var _i = 0; _i < path.length; _i++) {
    var _ref2;

    _ref2 = path[_i];
    var element = _ref2;
    signalArg.element = element;
    signals.fire('collect-targets', signalArg);
  }

  if (type === 'hold') {
    signalArg.targets = signalArg.targets.filter(function (target) {
      return target.eventable.options.holdDuration === interaction.pointers[pointerIndex].hold.duration;
    });
  }

  return signalArg.targets;
}

function __install_34(scope) {
  var interactions = scope.interactions;
  scope.pointerEvents = pointerEvents;
  scope.defaults.pointerEvents = pointerEvents.defaults;
  interactions.signals.on('new', function (interaction) {
    interaction.prevTap = null; // the most recent tap event on this interaction

    interaction.tapTime = 0; // time of the most recent tap event
  });
  interactions.signals.on('update-pointer', function (_ref3) {
    var down = _ref3.down,
        pointerInfo = _ref3.pointerInfo;

    if (!down && pointerInfo.hold) {
      return;
    }

    pointerInfo.hold = {
      duration: Infinity,
      timeout: null
    };
  });
  interactions.signals.on('move', function (_ref4) {
    var interaction = _ref4.interaction,
        pointer = _ref4.pointer,
        event = _ref4.event,
        eventTarget = _ref4.eventTarget,
        duplicateMove = _ref4.duplicateMove;
    var pointerIndex = interaction.getPointerIndex(pointer);

    if (!duplicateMove && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
      if (interaction.pointerIsDown) {
        clearTimeout(interaction.pointers[pointerIndex].hold.timeout);
      }

      fire({
        interaction: interaction,
        pointer: pointer,
        event: event,
        eventTarget: eventTarget,
        type: 'move'
      });
    }
  });
  interactions.signals.on('down', function (_ref5) {
    var interaction = _ref5.interaction,
        pointer = _ref5.pointer,
        event = _ref5.event,
        eventTarget = _ref5.eventTarget,
        pointerIndex = _ref5.pointerIndex;
    var timer = interaction.pointers[pointerIndex].hold;
    var path = __utils_34.dom.getPath(eventTarget);
    var signalArg = {
      interaction: interaction,
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      type: 'hold',
      targets: [],
      path: path,
      element: null
    };

    for (var _i2 = 0; _i2 < path.length; _i2++) {
      var _ref6;

      _ref6 = path[_i2];
      var element = _ref6;
      signalArg.element = element;
      signals.fire('collect-targets', signalArg);
    }

    if (!signalArg.targets.length) {
      return;
    }

    var minDuration = Infinity;

    for (var _i3 = 0; _i3 < signalArg.targets.length; _i3++) {
      var _ref7;

      _ref7 = signalArg.targets[_i3];
      var target = _ref7;
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
      });
    }, minDuration);
  });
  interactions.signals.on('up', function (_ref8) {
    var interaction = _ref8.interaction,
        pointer = _ref8.pointer,
        event = _ref8.event,
        eventTarget = _ref8.eventTarget;

    if (!interaction.pointerWasMoved) {
      fire({
        interaction: interaction,
        eventTarget: eventTarget,
        pointer: pointer,
        event: event,
        type: 'tap'
      });
    }
  });
  var _arr = ['up', 'cancel'];

  for (var _i4 = 0; _i4 < _arr.length; _i4++) {
    var signalName = _arr[_i4];
    interactions.signals.on(signalName, function (_ref9) {
      var interaction = _ref9.interaction,
          pointerIndex = _ref9.pointerIndex;

      if (interaction.pointers[pointerIndex].hold) {
        clearTimeout(interaction.pointers[pointerIndex].hold.timeout);
      }
    });
  }

  for (var i = 0; i < simpleSignals.length; i++) {
    interactions.signals.on(simpleSignals[i], createSignalListener(simpleEvents[i]));
  }
}

function createSignalListener(type) {
  return function (_ref10) {
    var interaction = _ref10.interaction,
        pointer = _ref10.pointer,
        event = _ref10.event,
        eventTarget = _ref10.eventTarget;
    fire({
      interaction: interaction,
      eventTarget: eventTarget,
      pointer: pointer,
      event: event,
      type: type
    });
  };
}

var ___default_34 = pointerEvents;
_$base_34.default = ___default_34;

var _$holdRepeat_35 = {};
"use strict";

Object.defineProperty(_$holdRepeat_35, "__esModule", {
  value: true
});
_$holdRepeat_35.default = void 0;

function __install_35(scope) {
  var pointerEvents = scope.pointerEvents,
      interactions = scope.interactions;
  pointerEvents.signals.on('new', onNew);
  pointerEvents.signals.on('fired', function (arg) {
    return onFired(arg, pointerEvents);
  });
  var _arr = ['move', 'up', 'cancel', 'endall'];

  for (var _i = 0; _i < _arr.length; _i++) {
    var signal = _arr[_i];
    interactions.signals.on(signal, endHoldRepeat);
  } // don't repeat by default


  pointerEvents.defaults.holdRepeatInterval = 0;
  pointerEvents.types.push('holdrepeat');
}

function onNew(_ref) {
  var pointerEvent = _ref.pointerEvent;

  if (pointerEvent.type !== 'hold') {
    return;
  }

  pointerEvent.count = (pointerEvent.count || 0) + 1;
}

function onFired(_ref2, pointerEvents) {
  var interaction = _ref2.interaction,
      pointerEvent = _ref2.pointerEvent,
      eventTarget = _ref2.eventTarget,
      targets = _ref2.targets;

  if (pointerEvent.type !== 'hold' || !targets.length) {
    return;
  } // get the repeat interval from the first eventable


  var interval = targets[0].eventable.options.holdRepeatInterval; // don't repeat if the interval is 0 or less

  if (interval <= 0) {
    return;
  } // set a timeout to fire the holdrepeat event


  interaction.holdIntervalHandle = setTimeout(function () {
    pointerEvents.fire({
      interaction: interaction,
      eventTarget: eventTarget,
      type: 'hold',
      pointer: pointerEvent,
      event: pointerEvent
    });
  }, interval);
}

function endHoldRepeat(_ref3) {
  var interaction = _ref3.interaction;

  // set the interaction's holdStopTime property
  // to stop further holdRepeat events
  if (interaction.holdIntervalHandle) {
    clearInterval(interaction.holdIntervalHandle);
    interaction.holdIntervalHandle = null;
  }
}

var ___default_35 = {
  install: __install_35
};
_$holdRepeat_35.default = ___default_35;

var _$interactableTargets_37 = {};
"use strict";

Object.defineProperty(_$interactableTargets_37, "__esModule", {
  value: true
});
_$interactableTargets_37.default = void 0;

var __is_37 = ___interopRequireWildcard_37(_$is_51);

var ___extend_37 = ___interopRequireDefault_37(_$extend_46);

/* removed: var _$arr_40 = require("@interactjs/utils/arr"); */;

function ___interopRequireDefault_37(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___interopRequireWildcard_37(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function __install_37(scope) {
  var pointerEvents = scope.pointerEvents,
      actions = scope.actions,
      Interactable = scope.Interactable,
      interactables = scope.interactables;
  pointerEvents.signals.on('collect-targets', function (_ref) {
    var targets = _ref.targets,
        element = _ref.element,
        type = _ref.type,
        eventTarget = _ref.eventTarget;
    scope.interactables.forEachMatch(element, function (interactable) {
      var eventable = interactable.events;
      var options = eventable.options;

      if (eventable.types[type] && eventable.types[type].length && __is_37.element(element) && interactable.testIgnoreAllow(options, element, eventTarget)) {
        targets.push({
          element: element,
          eventable: eventable,
          props: {
            interactable: interactable
          }
        });
      }
    });
  });
  interactables.signals.on('new', function (_ref2) {
    var interactable = _ref2.interactable;

    interactable.events.getRect = function (element) {
      return interactable.getRect(element);
    };
  });
  interactables.signals.on('set', function (_ref3) {
    var interactable = _ref3.interactable,
        options = _ref3.options;
    (0, ___extend_37.default)(interactable.events.options, pointerEvents.defaults);
    (0, ___extend_37.default)(interactable.events.options, options.pointerEvents || {});
  });
  (0, _$arr_40.merge)(actions.eventTypes, pointerEvents.types);

  Interactable.prototype.pointerEvents = function (options) {
    (0, ___extend_37.default)(this.events.options, options);
    return this;
  };

  var __backCompatOption = Interactable.prototype._backCompatOption;

  Interactable.prototype._backCompatOption = function (optionName, newValue) {
    var ret = __backCompatOption.call(this, optionName, newValue);

    if (ret === this) {
      this.events.options[optionName] = newValue;
    }

    return ret;
  };
}

var ___default_37 = {
  install: __install_37
};
_$interactableTargets_37.default = ___default_37;

var _$pointerEvents_36 = {};
"use strict";

Object.defineProperty(_$pointerEvents_36, "__esModule", {
  value: true
});
_$pointerEvents_36.install = __install_36;
Object.defineProperty(_$pointerEvents_36, "pointerEvents", {
  enumerable: true,
  get: function get() {
    return ___base_36.default;
  }
});
Object.defineProperty(_$pointerEvents_36, "holdRepeat", {
  enumerable: true,
  get: function get() {
    return _holdRepeat.default;
  }
});
Object.defineProperty(_$pointerEvents_36, "interactableTargets", {
  enumerable: true,
  get: function get() {
    return _interactableTargets.default;
  }
});

var ___base_36 = ___interopRequireDefault_36(_$base_34);

var _holdRepeat = ___interopRequireDefault_36(_$holdRepeat_35);

var _interactableTargets = ___interopRequireDefault_36(_$interactableTargets_37);

function ___interopRequireDefault_36(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function __install_36(scope) {
  ___base_36.default.install(scope);

  _holdRepeat.default.install(scope);

  _interactableTargets.default.install(scope);
}

var _$reflow_38 = {};
"use strict";

Object.defineProperty(_$reflow_38, "__esModule", {
  value: true
});
_$reflow_38.install = __install_38;
_$reflow_38.default = void 0;

/* removed: var _$interactions_19 = require("@interactjs/core/interactions"); */;

/* removed: var _$utils_49 = require("@interactjs/utils"); */;

function __install_38(scope) {
  var actions = scope.actions,
      interactions = scope.interactions,
      Interactable = scope.Interactable; // add action reflow event types

  for (var _i = 0; _i < actions.names.length; _i++) {
    var _ref;

    _ref = actions.names[_i];
    var actionName = _ref;
    actions.eventTypes.push("".concat(actionName, "reflow"));
  } // remove completed reflow interactions


  interactions.signals.on('stop', function (_ref2) {
    var interaction = _ref2.interaction;

    if (interaction.pointerType === 'reflow') {
      interaction._reflowResolve();

      _$utils_49.arr.remove(scope.interactions.list, interaction);
    }
  });
  /**
   * ```js
   * const interactable = interact(target);
   * const drag = { name: drag, axis: 'x' };
   * const resize = { name: resize, edges: { left: true, bottom: true };
   *
   * interactable.reflow(drag);
   * interactable.reflow(resize);
   * ```
   *
   * Start an action sequence to re-apply modifiers, check drops, etc.
   *
   * @param { Object } action The action to begin
   * @param { string } action.name The name of the action
   * @returns { Promise<Interactable> }
   */

  Interactable.prototype.reflow = function (action) {
    return reflow(this, action, scope);
  };
}

function reflow(interactable, action, scope) {
  var elements = _$utils_49.is.string(interactable.target) ? _$utils_49.arr.from(interactable._context.querySelectorAll(interactable.target)) : [interactable.target];
  var Promise = _$utils_49.win.window.Promise;
  var promises = Promise ? [] : null;

  var _loop = function _loop() {
    _ref3 = elements[_i2];
    var element = _ref3;
    var rect = interactable.getRect(element);

    if (!rect) {
      return "break";
    }

    var runningInteraction = _$utils_49.arr.find(scope.interactions.list, function (interaction) {
      return interaction.interacting() && interaction.target === interactable && interaction.element === element && interaction.prepared.name === action.name;
    });

    var reflowPromise = void 0;

    if (runningInteraction) {
      runningInteraction.move();
      reflowPromise = runningInteraction._reflowPromise || new Promise(function (resolve) {
        runningInteraction._reflowResolve = resolve;
      });
    } else {
      var xywh = _$utils_49.rect.tlbrToXywh(rect);

      var coords = {
        page: {
          x: xywh.x,
          y: xywh.y
        },
        client: {
          x: xywh.x,
          y: xywh.y
        },
        timeStamp: Date.now()
      };

      var event = _$utils_49.pointer.coordsToEvent(coords);

      reflowPromise = startReflow(scope, interactable, element, action, event);
    }

    if (promises) {
      promises.push(reflowPromise);
    }
  };

  for (var _i2 = 0; _i2 < elements.length; _i2++) {
    var _ref3;

    var _ret = _loop();

    if (_ret === "break") break;
  }

  return promises && Promise.all(promises).then(function () {
    return interactable;
  });
}

function startReflow(scope, interactable, element, action, event) {
  var interaction = (0, _$interactions_19.newInteraction)({
    pointerType: 'reflow'
  }, scope);
  var signalArg = {
    interaction: interaction,
    event: event,
    pointer: event,
    eventTarget: element,
    phase: 'reflow'
  };
  interaction.target = interactable;
  interaction.element = element;
  interaction.prepared = (0, _$utils_49.extend)({}, action);
  interaction.prevEvent = event;
  interaction.updatePointer(event, event, element, true);

  interaction._doPhase(signalArg);

  var reflowPromise = _$utils_49.win.window.Promise ? new _$utils_49.win.window.Promise(function (resolve) {
    interaction._reflowResolve = resolve;
  }) : null;
  interaction._reflowPromise = reflowPromise;
  interaction.start(action, interactable, element);

  if (interaction._interacting) {
    interaction.move(signalArg);
    interaction.end(event);
  } else {
    interaction.stop();
  }

  interaction.removePointer(event, event);
  interaction.pointerIsDown = false;
  return reflowPromise;
}

var ___default_38 = {
  install: __install_38
};
_$reflow_38.default = ___default_38;

var _$interact_22 = {};
"use strict";

Object.defineProperty(_$interact_22, "__esModule", {
  value: true
});
_$interact_22.init = __init_22;
Object.defineProperty(_$interact_22, "interact", {
  enumerable: true,
  get: function get() {
    return _interact.default;
  }
});
/* common-shake removed: exports.default = */ void void 0;

var _interact = ___interopRequireWildcard_22(_$interact_23);

var _interactablePreventDefault = ___interopRequireDefault_22(_$interactablePreventDefault_18);

var _inertia = ___interopRequireDefault_22(_$inertia_21);

var __pointerEvents_22 = ___interopRequireWildcard_22(_$pointerEvents_36);

var autoStart = ___interopRequireWildcard_22(_$autoStart_12);

var actions = ___interopRequireWildcard_22(_$actions_5);

var ___base_22 = ___interopRequireDefault_22(_$base_25);

var modifiers = ___interopRequireWildcard_22(_$modifiers_26);

var _autoScroll = ___interopRequireDefault_22(_$autoScroll_7);

var _reflow = ___interopRequireDefault_22(_$reflow_38);

function ___interopRequireDefault_22(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___interopRequireWildcard_22(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/* browser entry point */
function __init_22(window) {
  _interact.scope.init(window);

  _interact.default.use(_interactablePreventDefault.default); // inertia


  _interact.default.use(_inertia.default); // pointerEvents


  _interact.default.use(__pointerEvents_22); // autoStart, hold


  _interact.default.use(autoStart); // drag and drop, resize, gesture


  _interact.default.use(actions); // snap, resize, etc.


  _interact.default.use(___base_22.default); // for backwrads compatibility


  for (var type in modifiers) {
    var _modifiers$type = modifiers[type],
        _defaults = _modifiers$type._defaults,
        _methods = _modifiers$type._methods;
    _defaults._methods = _methods;
    _interact.scope.defaults.perAction[type] = _defaults;
  } // autoScroll


  _interact.default.use(_autoScroll.default); // reflow


  _interact.default.use(_reflow.default);

  return _interact.default;
} // eslint-disable-next-line no-undef


_interact.default.version = __init_22.version = "1.4.0-alpha.17";
var ___default_22 = _interact.default;
/* common-shake removed: exports.default = */ void ___default_22;

var _$grid_58 = {};
"use strict";

Object.defineProperty(_$grid_58, "__esModule", {
  value: true
});
_$grid_58.default = void 0;

function ___slicedToArray_58(arr, i) { return ___arrayWithHoles_58(arr) || ___iterableToArrayLimit_58(arr, i) || ___nonIterableRest_58(); }

function ___nonIterableRest_58() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function ___iterableToArrayLimit_58(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function ___arrayWithHoles_58(arr) { if (Array.isArray(arr)) return arr; }

var ___default_58 = function _default(grid) {
  var coordFields = [['x', 'y'], ['left', 'top'], ['right', 'bottom'], ['width', 'height']].filter(function (_ref) {
    var _ref2 = ___slicedToArray_58(_ref, 2),
        xField = _ref2[0],
        yField = _ref2[1];

    return xField in grid || yField in grid;
  });
  return function (x, y) {
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
      range: range
    };

    for (var _i2 = 0; _i2 < coordFields.length; _i2++) {
      var _ref3;

      _ref3 = coordFields[_i2];

      var _ref4 = _ref3,
          _ref5 = ___slicedToArray_58(_ref4, 2),
          xField = _ref5[0],
          yField = _ref5[1];

      var gridx = Math.round((x - offset.x) / grid[xField]);
      var gridy = Math.round((y - offset.y) / grid[yField]);
      result[xField] = Math.max(limits.left, Math.min(limits.right, gridx * grid[xField] + offset.x));
      result[yField] = Math.max(limits.top, Math.min(limits.bottom, gridy * grid[yField] + offset.y));
    }

    return result;
  };
};

_$grid_58.default = ___default_58;

var _$snappers_59 = {};
"use strict";

Object.defineProperty(_$snappers_59, "__esModule", {
  value: true
});
Object.defineProperty(_$snappers_59, "grid", {
  enumerable: true,
  get: function get() {
    return _grid.default;
  }
});

var _grid = ___interopRequireDefault_59(_$grid_58);

function ___interopRequireDefault_59(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _$interactjs_24 = { exports: {} };
"use strict";

Object.defineProperty(_$interactjs_24.exports, "__esModule", {
  value: true
});
_$interactjs_24.exports.default = void 0;

/* removed: var _$interact_22 = require("@interactjs/interact"); */;

var snappers = ___interopRequireWildcard_24(_$snappers_59);

var ___extend_24 = ___interopRequireDefault_24(_$extend_46);

var __modifiers_24 = ___interopRequireWildcard_24(_$modifiers_26);

function ___interopRequireDefault_24(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ___interopRequireWildcard_24(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function ___typeof_24(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { ___typeof_24 = function _typeof(obj) { return typeof obj; }; } else { ___typeof_24 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return ___typeof_24(obj); }

var __win_24 = (typeof window === "undefined" ? "undefined" : ___typeof_24(window)) === 'object' && window;
var exported = __win_24 ? function () {
  var interact = (0, _$interact_22.init)(__win_24);
  return interact.use({
    install: function install(scope) {
      interact.modifiers = (0, ___extend_24.default)(scope.modifiers, __modifiers_24);
      interact.snappers = snappers;
      interact.createSnapGrid = interact.snappers.grid;
    }
  });
}() : _$interact_22.init;
var ___default_24 = exported;
_$interactjs_24.exports.default = ___default_24;

if (("object" === "undefined" ? "undefined" : ___typeof_24(_$interactjs_24)) === 'object' && !!_$interactjs_24) {
  _$interactjs_24.exports = exported;
}

_$interactjs_24 = _$interactjs_24.exports
return _$interactjs_24;

});


//# sourceMappingURL=interact.js.map
