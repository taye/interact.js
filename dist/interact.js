/**
 * interact.js v1.4.0-alpha.5+sha.4cd8a45
 *
 * Copyright (c) 2012-2018 Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.interact = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /*
                                                                                                                                                                                                                                                                               * In a (windowless) server environment this file exports a factory function
                                                                                                                                                                                                                                                                               * that takes the window to use.
                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                               *     var interact = require('interact.js')(windowObject);
                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                               * See https://github.com/taye/interact.js/issues/187
                                                                                                                                                                                                                                                                               */

var _interact = _dereq_('@interactjs/interact');

var exported = (typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' ? _interact.interact : _interact.init;

exports.default = exported;


if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && !!module) {
  module.exports = exported;
}

},{"@interactjs/interact":23}],2:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _is = _dereq_('@interactjs/utils/is');

var is = _interopRequireWildcard(_is);

var _arr = _dereq_('@interactjs/utils/arr');

var arr = _interopRequireWildcard(_arr);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  var actions = scope.actions,
      Interactable = scope.Interactable,
      interactions = scope.interactions,
      defaults = scope.defaults;


  interactions.signals.on('before-action-move', beforeMove);
  interactions.signals.on('action-resume', beforeMove);

  // dragmove
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

    if (!options) {
      this.ondragstart = this.ondragstart = this.ondragend = null;
    }

    return this;
  }

  return this.options.drag;
}

var drag = {
  init: init,
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

exports.default = drag;

},{"@interactjs/utils/arr":40,"@interactjs/utils/is":51}],3:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _arr = _dereq_('@interactjs/utils/arr');

var arr = _interopRequireWildcard(_arr);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DropEvent = function () {
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


  DropEvent.prototype.reject = function reject() {
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
      var index = arr.findIndex(activeDrops, function (_ref2) {
        var dropzone = _ref2.dropzone,
            element = _ref2.element;
        return dropzone === _this.dropzone && element === _this.target;
      });

      dropStatus.activeDrops = [].concat(activeDrops.slice(0, index), activeDrops.slice(index + 1));

      var deactivateEvent = new DropEvent(dropStatus, this.dragEvent, 'dropdeactivate');

      deactivateEvent.dropzone = this.dropzone;
      deactivateEvent.target = this.target;

      this.dropzone.fire(deactivateEvent);
    } else {
      this.dropzone.fire(new DropEvent(dropStatus, this.dragEvent, 'dragleave'));
    }
  };

  DropEvent.prototype.preventDefault = function preventDefault() {};

  DropEvent.prototype.stopPropagation = function stopPropagation() {
    this.propagationStopped = true;
  };

  DropEvent.prototype.stopImmediatePropagation = function stopImmediatePropagation() {
    this.immediatePropagationStopped = this.propagationStopped = true;
  };

  return DropEvent;
}();

exports.default = DropEvent;

},{"@interactjs/utils/arr":40}],4:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = _dereq_('@interactjs/utils');

var utils = _interopRequireWildcard(_utils);

var _DropEvent = _dereq_('./DropEvent');

var _DropEvent2 = _interopRequireDefault(_DropEvent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
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

    var dropStatus = interaction.dropStatus;

    // reset active dropzones

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
        dropzone: null, // the dropzone a drag target might be dropped into
        element: null // the element at the time of checking
      },
      prev: {
        dropzone: null, // the dropzone that was recently dragged away from
        element: null // the element at the time of checking
      },
      rejected: false, // wheather the potential drop was rejected from a listener
      events: null, // the drop events related to the current drag event
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

  var drops = [];

  // collect all dropzones and their elements which qualify for a drop
  for (var _i = 0; _i < interactables.list.length; _i++) {
    var _ref7;

    _ref7 = interactables.list[_i];
    var dropzone = _ref7;

    if (!dropzone.options.drop.enabled) {
      continue;
    }

    var accept = dropzone.options.drop.accept;

    // test the draggable draggableElement against the dropzone's accept setting
    if (utils.is.element(accept) && accept !== draggableElement || utils.is.string(accept) && !utils.dom.matchesSelector(draggableElement, accept)) {

      continue;
    }

    // query for new elements if necessary
    var dropElements = utils.is.string(dropzone.target) ? dropzone._context.querySelectorAll(dropzone.target) : [dropzone.target];

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
    var _ref10;

    _ref10 = activeDrops[_i3];
    var _ref9 = _ref10;
    var dropzone = _ref9.dropzone;
    var element = _ref9.element;

    event.dropzone = dropzone;

    // set current element as event target
    event.target = element;
    dropzone.fire(event);
    event.propagationStopped = event.immediatePropagationStopped = false;
  }
}

// return a new array of possible drops. getActiveDrops should always be
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

  var validDrops = [];

  // collect all dropzones and their elements which qualify for a drop
  for (var _i5 = 0; _i5 < dropStatus.activeDrops.length; _i5++) {
    var _ref14;

    _ref14 = dropStatus.activeDrops[_i5];
    var _ref13 = _ref14;
    var dropzone = _ref13.dropzone;
    var dropzoneElement = _ref13.element;
    var rect = _ref13.rect;

    validDrops.push(dropzone.dropCheck(dragEvent, pointerEvent, draggable, dragElement, dropzoneElement, rect) ? dropzoneElement : null);
  }

  // get the most appropriate dropzone based on DOM depth and order
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
    dropEvents.activate = new _DropEvent2.default(dropStatus, dragEvent, 'dropactivate');

    dropEvents.activate.target = null;
    dropEvents.activate.dropzone = null;
  }
  if (dragEvent.type === 'dragend') {
    dropEvents.deactivate = new _DropEvent2.default(dropStatus, dragEvent, 'dropdeactivate');

    dropEvents.deactivate.target = null;
    dropEvents.deactivate.dropzone = null;
  }

  if (dropStatus.rejected) {
    return dropEvents;
  }

  if (dropStatus.cur.element !== dropStatus.prev.element) {
    // if there was a previous dropzone, create a dragleave event
    if (dropStatus.prev.dropzone) {
      dropEvents.leave = new _DropEvent2.default(dropStatus, dragEvent, 'dragleave');

      dragEvent.dragLeave = dropEvents.leave.target = dropStatus.prev.element;
      dragEvent.prevDropzone = dropEvents.leave.dropzone = dropStatus.prev.dropzone;
    }
    // if dropzone is not null, create a dragenter event
    if (dropStatus.cur.dropzone) {
      dropEvents.enter = new _DropEvent2.default(dropStatus, dragEvent, 'dragenter');

      dragEvent.dragEnter = dropStatus.cur.element;
      dragEvent.dropzone = dropStatus.cur.dropzone;
    }
  }

  if (dragEvent.type === 'dragend' && dropStatus.cur.dropzone) {
    dropEvents.drop = new _DropEvent2.default(dropStatus, dragEvent, 'drop');

    dragEvent.dropzone = dropStatus.cur.dropzone;
    dragEvent.relatedTarget = dropStatus.cur.element;
  }
  if (dragEvent.type === 'dragmove' && dropStatus.cur.dropzone) {
    dropEvents.move = new _DropEvent2.default(dropStatus, dragEvent, 'dropmove');

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
  var dropResult = getDrop(interaction, dragEvent, event);

  // update rejected status
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

    if (!options) {
      interactable.ondragenter = interactable.ondragleave = interactable.ondrop = interactable.ondropactivate = interactable.ondropdeactivate = null;
    }

    return interactable;
  }

  return interactable.options.drop;
}

function dropCheckMethod(interactable, dragEvent, event, draggable, draggableElement, dropElement, rect) {
  var dropped = false;

  // if the dropzone has no rect (eg. display: none)
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
  init: init,
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

exports.default = drop;

},{"./DropEvent":3,"@interactjs/utils":49}],5:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = _dereq_('@interactjs/utils');

var utils = _interopRequireWildcard(_utils);

var _InteractEvent = _dereq_('@interactjs/core/InteractEvent');

var _InteractEvent2 = _interopRequireDefault(_InteractEvent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  var actions = scope.actions,
      Interactable = scope.Interactable,
      interactions = scope.interactions,
      defaults = scope.defaults;


  var gesture = {
    defaults: {},

    checker: function checker(pointer, event, interactable, element, interaction) {
      if (interaction.pointers.length >= 2) {
        return { name: 'gesture' };
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
    if (utils.is.object(options)) {
      this.options.gesture.enabled = options.enabled === false ? false : true;
      this.setPerAction('gesture', options);
      this.setOnEvents('gesture', options);

      return this;
    }

    if (utils.is.bool(options)) {
      this.options.gesture.enabled = options;

      if (!options) {
        this.ongesturestart = this.ongesturestart = this.ongestureend = null;
      }

      return this;
    }

    return this.options.gesture;
  };

  interactions.signals.on('action-start', start);
  interactions.signals.on('action-move', move);

  interactions.signals.on('action-start', updateGestureProps);
  interactions.signals.on('action-move', updateGestureProps);
  interactions.signals.on('action-end', updateGestureProps);

  interactions.signals.on('new', function (interaction) {
    interaction.gesture = {
      start: { x: 0, y: 0 },

      startDistance: 0, // distance between two touches of touchStart
      prevDistance: 0,
      distance: 0,

      scale: 1, // gesture.distance / gesture.startDistance

      startAngle: 0, // angle of line joining two touches
      prevAngle: 0 // angle of the previous gesture event
    };
  });

  actions.gesture = gesture;
  actions.names.push('gesture');
  utils.arr.merge(actions.eventTypes, ['gesturestart', 'gesturemove', 'gestureend']);
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

function move(_ref2) {
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
      phase = _ref3.phase,
      deltaSource = _ref3.deltaSource;

  if (interaction.prepared.name !== 'gesture') {
    return;
  }

  var pointers = interaction.pointers;
  var starting = phase === 'start';
  var ending = phase === 'end';

  iEvent.touches = [pointers[0].pointer, pointers[1].pointer];

  if (starting) {
    iEvent.distance = utils.pointer.touchDistance(pointers, deltaSource);
    iEvent.box = utils.pointer.touchBBox(pointers);
    iEvent.scale = 1;
    iEvent.ds = 0;
    iEvent.angle = utils.pointer.touchAngle(pointers, undefined, deltaSource);
    iEvent.da = 0;
  } else if (ending || event instanceof _InteractEvent2.default) {
    iEvent.distance = interaction.prevEvent.distance;
    iEvent.box = interaction.prevEvent.box;
    iEvent.scale = interaction.prevEvent.scale;
    iEvent.ds = iEvent.scale - 1;
    iEvent.angle = interaction.prevEvent.angle;
    iEvent.da = iEvent.angle - interaction.gesture.startAngle;
  } else {
    iEvent.distance = utils.pointer.touchDistance(pointers, deltaSource);
    iEvent.box = utils.pointer.touchBBox(pointers);
    iEvent.scale = iEvent.distance / interaction.gesture.startDistance;
    iEvent.angle = utils.pointer.touchAngle(pointers, interaction.gesture.prevAngle, deltaSource);

    iEvent.ds = iEvent.scale - interaction.gesture.prevScale;
    iEvent.da = iEvent.angle - interaction.gesture.prevAngle;
  }
}

exports.default = { init: init };

},{"@interactjs/core/InteractEvent":15,"@interactjs/utils":49}],6:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = exports.drop = exports.drag = exports.resize = exports.gesture = undefined;

var _gesture = _dereq_('./gesture');

var _gesture2 = _interopRequireDefault(_gesture);

var _resize = _dereq_('./resize');

var _resize2 = _interopRequireDefault(_resize);

var _drag = _dereq_('./drag');

var _drag2 = _interopRequireDefault(_drag);

var _drop = _dereq_('./drop');

var _drop2 = _interopRequireDefault(_drop);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  _gesture2.default.init(scope);
  _resize2.default.init(scope);
  _drag2.default.init(scope);
  _drop2.default.init(scope);
}

exports.gesture = _gesture2.default;
exports.resize = _resize2.default;
exports.drag = _drag2.default;
exports.drop = _drop2.default;
exports.init = init;

},{"./drag":2,"./drop":4,"./gesture":5,"./resize":7}],7:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = _dereq_('@interactjs/utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  var actions = scope.actions,
      browser = scope.browser,
      Interactable = scope.Interactable,
      interactions = scope.interactions,
      defaults = scope.defaults;

  // Less Precision with touch input

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

      var page = utils.extend({}, interaction.coords.cur.page);
      var options = interactable.options;

      if (options.resize.enabled) {
        var resizeOptions = options.resize;
        var resizeEdges = { left: false, right: false, top: false, bottom: false };

        // if using resize.edges
        if (utils.is.object(resizeOptions.edges)) {
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
    if (utils.is.object(options)) {
      this.options.resize.enabled = options.enabled === false ? false : true;
      this.setPerAction('resize', options);
      this.setOnEvents('resize', options);

      if (/^x$|^y$|^xy$/.test(options.axis)) {
        this.options.resize.axis = options.axis;
      } else if (options.axis === null) {
        this.options.resize.axis = defaults.resize.axis;
      }

      if (utils.is.bool(options.preserveAspectRatio)) {
        this.options.resize.preserveAspectRatio = options.preserveAspectRatio;
      } else if (utils.is.bool(options.square)) {
        this.options.resize.square = options.square;
      }

      return this;
    }
    if (utils.is.bool(options)) {
      this.options.resize.enabled = options;

      if (!options) {
        this.onresizestart = this.onresizestart = this.onresizeend = null;
      }

      return this;
    }
    return this.options.resize;
  };

  interactions.signals.on('new', function (interaction) {
    interaction.resizeAxes = 'xy';
  });

  interactions.signals.on('action-start', start);
  interactions.signals.on('action-move', move);

  interactions.signals.on('action-start', updateEventAxes);
  interactions.signals.on('action-move', updateEventAxes);

  actions.resize = resize;
  actions.names.push('resize');
  utils.arr.merge(actions.eventTypes, ['resizestart', 'resizemove', 'resizeinertiastart', 'resizeresume', 'resizeend']);
  actions.methodDict.resize = 'resizable';

  defaults.resize = resize.defaults;
}

function checkResizeEdge(name, value, page, element, interactableElement, rect, margin) {
  // false, '', undefined, null
  if (!value) {
    return false;
  }

  // true value, use pointer coords and element rect
  if (value === true) {
    // if dimensions are negative, "switch" edges
    var width = utils.is.number(rect.width) ? rect.width : rect.right - rect.left;
    var height = utils.is.number(rect.height) ? rect.height : rect.bottom - rect.top;

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
  }

  // the remaining checks require an element
  if (!utils.is.element(element)) {
    return false;
  }

  return utils.is.element(value)
  // the value is an element to use as a resize handle
  ? value === element
  // otherwise check if element matches value as selector
  : utils.dom.matchesUpTo(element, value, interactableElement);
}

function start(_ref) {
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
    var linkedEdges = utils.extend({}, interaction.prepared.edges);

    linkedEdges.top = linkedEdges.top || linkedEdges.left && !linkedEdges.bottom;
    linkedEdges.left = linkedEdges.left || linkedEdges.top && !linkedEdges.right;
    linkedEdges.bottom = linkedEdges.bottom || linkedEdges.right && !linkedEdges.top;
    linkedEdges.right = linkedEdges.right || linkedEdges.bottom && !linkedEdges.left;

    interaction.prepared._linkedEdges = linkedEdges;
  } else {
    interaction.prepared._linkedEdges = null;
  }

  // if using `resizable.preserveAspectRatio` option, record aspect ratio at the start of the resize
  if (resizeOptions.preserveAspectRatio) {
    interaction.resizeStartAspectRatio = startRect.width / startRect.height;
  }

  interaction.resizeRects = {
    start: startRect,
    current: utils.extend({}, startRect),
    inverted: utils.extend({}, startRect),
    previous: utils.extend({}, startRect),
    delta: {
      left: 0, right: 0, width: 0,
      top: 0, bottom: 0, height: 0
    }
  };

  iEvent.rect = interaction.resizeRects.inverted;
  iEvent.deltaRect = interaction.resizeRects.delta;
}

function move(_ref2) {
  var iEvent = _ref2.iEvent,
      interaction = _ref2.interaction;

  if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) {
    return;
  }

  var resizeOptions = interaction.target.options.resize;
  var invert = resizeOptions.invert;
  var invertible = invert === 'reposition' || invert === 'negate';

  var edges = interaction.prepared.edges;

  // eslint-disable-next-line no-shadow
  var start = interaction.resizeRects.start;
  var current = interaction.resizeRects.current;
  var inverted = interaction.resizeRects.inverted;
  var deltaRect = interaction.resizeRects.delta;
  var previous = utils.extend(interaction.resizeRects.previous, inverted);
  var originalEdges = edges;

  var eventDelta = utils.extend({}, iEvent.delta);

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
  }

  // update the 'current' rect without modifications
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
    utils.extend(inverted, current);

    if (invert === 'reposition') {
      // swap edge values if necessary to keep width/height positive
      var swap = void 0;

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

exports.default = { init: init };

},{"@interactjs/utils":49}],8:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _raf = _dereq_('@interactjs/utils/raf');

var _raf2 = _interopRequireDefault(_raf);

var _window = _dereq_('@interactjs/utils/window');

var _is = _dereq_('@interactjs/utils/is');

var is = _interopRequireWildcard(_is);

var _domUtils = _dereq_('@interactjs/utils/domUtils');

var domUtils = _interopRequireWildcard(_domUtils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  var interactions = scope.interactions,
      defaults = scope.defaults;


  var autoScroll = scope.autoScroll = {
    defaults: {
      enabled: false,
      container: null, // the item that is scrolled (Window or HTMLElement)
      margin: 60,
      speed: 300 // the scroll speed in pixels per second
    },

    interaction: null,
    i: null, // the handle returned by window.setInterval
    x: 0, y: 0, // Direction each pulse is to scroll in

    isScrolling: false,
    prevTime: 0,

    start: function start(interaction) {
      autoScroll.isScrolling = true;
      _raf2.default.cancel(autoScroll.i);

      autoScroll.interaction = interaction;
      autoScroll.prevTime = new Date().getTime();
      autoScroll.i = _raf2.default.request(autoScroll.scroll);
    },

    stop: function stop() {
      autoScroll.isScrolling = false;
      _raf2.default.cancel(autoScroll.i);
    },

    // scroll the window by the values in scroll.x/y
    scroll: function scroll() {
      var options = autoScroll.interaction.target.options[autoScroll.interaction.prepared.name].autoScroll;
      var container = options.container || (0, _window.getWindow)(autoScroll.interaction.element);
      var now = new Date().getTime();
      // change in time in seconds
      var dt = (now - autoScroll.prevTime) / 1000;
      // displacement
      var s = options.speed * dt;

      if (s >= 1) {
        if (is.window(container)) {
          container.scrollBy(autoScroll.x * s, autoScroll.y * s);
        } else if (container) {
          container.scrollLeft += autoScroll.x * s;
          container.scrollTop += autoScroll.y * s;
        }

        autoScroll.prevTime = now;
      }

      if (autoScroll.isScrolling) {
        _raf2.default.cancel(autoScroll.i);
        autoScroll.i = _raf2.default.request(autoScroll.scroll);
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

      var top = void 0;
      var right = void 0;
      var bottom = void 0;
      var left = void 0;

      var options = interaction.target.options[interaction.prepared.name].autoScroll;
      var container = options.container || (0, _window.getWindow)(interaction.element);

      if (is.window(container)) {
        left = pointer.clientX < autoScroll.margin;
        top = pointer.clientY < autoScroll.margin;
        right = pointer.clientX > container.innerWidth - autoScroll.margin;
        bottom = pointer.clientY > container.innerHeight - autoScroll.margin;
      } else {
        var rect = domUtils.getElementClientRect(container);

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

  interactions.signals.on('stop', autoScroll.stop);

  interactions.signals.on('action-move', autoScroll.onInteractionMove);

  defaults.perAction.autoScroll = autoScroll.defaults;
}

exports.default = { init: init };

},{"@interactjs/utils/domUtils":44,"@interactjs/utils/is":51,"@interactjs/utils/raf":56,"@interactjs/utils/window":60}],9:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _is = _dereq_('@interactjs/utils/is');

var is = _interopRequireWildcard(_is);

var _domUtils = _dereq_('@interactjs/utils/domUtils');

var domUtils = _interopRequireWildcard(_domUtils);

var _utils = _dereq_('@interactjs/utils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
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
  Interactable.prototype.ignoreFrom = (0, _utils.warnOnce)(function (newValue) {
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
  Interactable.prototype.allowFrom = (0, _utils.warnOnce)(function (newValue) {
    return this._backCompatOption('allowFrom', newValue);
  }, 'Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue}).');

  Interactable.prototype.testIgnore = function (ignoreFrom, interactableElement, element) {
    if (!ignoreFrom || !is.element(element)) {
      return false;
    }

    if (is.string(ignoreFrom)) {
      return domUtils.matchesUpTo(element, ignoreFrom, interactableElement);
    } else if (is.element(ignoreFrom)) {
      return domUtils.nodeContains(ignoreFrom, element);
    }

    return false;
  };

  Interactable.prototype.testAllow = function (allowFrom, interactableElement, element) {
    if (!allowFrom) {
      return true;
    }

    if (!is.element(element)) {
      return false;
    }

    if (is.string(allowFrom)) {
      return domUtils.matchesUpTo(element, allowFrom, interactableElement);
    } else if (is.element(allowFrom)) {
      return domUtils.nodeContains(allowFrom, element);
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
    if (is.func(checker)) {
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
    if (is.bool(newValue)) {
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

exports.default = { init: init };

},{"@interactjs/utils":49,"@interactjs/utils/domUtils":44,"@interactjs/utils/is":51}],10:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = _dereq_('@interactjs/utils');

var utils = _interopRequireWildcard(_utils);

var _InteractableMethods = _dereq_('./InteractableMethods');

var _InteractableMethods2 = _interopRequireDefault(_InteractableMethods);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  var interact = scope.interact,
      interactions = scope.interactions,
      defaults = scope.defaults,
      Signals = scope.Signals;


  interact.use(_InteractableMethods2.default);

  // set cursor style on mousedown
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
  });

  // set cursor style on mousemove
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
      target._doc.documentElement.style.cursor = '';
    }
  });

  interact.maxInteractions = maxInteractions;

  defaults.base.actionChecker = null;
  defaults.base.styleCursor = true;

  utils.extend(defaults.perAction, {
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
    signals: new Signals()
  };
}

// Check if the current target supports the action.
// If so, return the validated action. Otherwise, return null
function validateAction(action, interactable, element, eventTarget, scope) {
  if (utils.is.object(action) && interactable.testIgnoreAllow(interactable.options[action.name], element, eventTarget) && interactable.options[action.name].enabled && withinInteractionLimit(interactable, element, action, scope)) {
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

  while (utils.is.element(element)) {
    matches = [];
    matchElements = [];

    scope.interactables.forEachMatch(element, pushMatches);

    var actionInfo = validateSelector(interaction, pointer, event, matches, matchElements, eventTarget, scope);

    if (actionInfo.action && !actionInfo.target.options[actionInfo.action.name].manualStart) {
      return actionInfo;
    }

    element = utils.dom.parentNode(element);
  }

  return {};
}

function prepare(interaction, _ref4, scope) {
  var action = _ref4.action,
      target = _ref4.target,
      element = _ref4.element;

  action = action || {};

  if (interaction.target && interaction.target.options.styleCursor) {
    interaction.target._doc.documentElement.style.cursor = '';
  }

  interaction.target = target;
  interaction.element = element;
  utils.copyAction(interaction.prepared, action);

  if (target && target.options.styleCursor) {
    var cursor = action ? scope.actions[action.name].getCursor(action) : '';
    interaction.target._doc.documentElement.style.cursor = cursor;
  }

  scope.autoStart.signals.fire('prepared', { interaction: interaction });
}

function withinInteractionLimit(interactable, element, action, scope) {
  var options = interactable.options;
  var maxActions = options[action.name].max;
  var maxPerElement = options[action.name].maxPerElement;
  var autoStartMax = scope.autoStart.maxInteractions;
  var activeInteractions = 0;
  var targetCount = 0;
  var targetElementCount = 0;

  // no actions if any of these values == 0
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
  if (utils.is.number(newValue)) {
    scope.autoStart.maxInteractions = newValue;

    return this;
  }

  return scope.autoStart.maxInteractions;
}

exports.default = {
  init: init,
  maxInteractions: maxInteractions,
  withinInteractionLimit: withinInteractionLimit,
  validateAction: validateAction
};

},{"./InteractableMethods":9,"@interactjs/utils":49}],11:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _is = _dereq_('@interactjs/utils/is');

var is = _interopRequireWildcard(_is);

var _base = _dereq_('./base');

var _base2 = _interopRequireDefault(_base);

var _domUtils = _dereq_('@interactjs/utils/domUtils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  scope.autoStart.signals.on('before-start', function (_ref) {
    var interaction = _ref.interaction,
        eventTarget = _ref.eventTarget,
        dx = _ref.dx,
        dy = _ref.dy;

    if (interaction.prepared.name !== 'drag') {
      return;
    }

    // check if a drag is in the correct axis
    var absX = Math.abs(dx);
    var absY = Math.abs(dy);
    var targetOptions = interaction.target.options.drag;
    var startAxis = targetOptions.startAxis;
    var currentAxis = absX > absY ? 'x' : absX < absY ? 'y' : 'xy';

    interaction.prepared.axis = targetOptions.lockAxis === 'start' ? currentAxis[0] // always lock to one axis even if currentAxis === 'xy'
    : targetOptions.lockAxis;

    // if the movement isn't in the startAxis of the interactable
    if (currentAxis !== 'xy' && startAxis !== 'xy' && startAxis !== currentAxis) {
      // cancel the prepared action
      interaction.prepared.name = null;

      // then try to get a drag from another ineractable
      var element = eventTarget;

      var getDraggable = function getDraggable(interactable) {
        if (interactable === interaction.target) {
          return;
        }

        var options = interaction.target.options.drag;

        if (!options.manualStart && interactable.testIgnoreAllow(options, element, eventTarget)) {

          var action = interactable.getAction(interaction.downPointer, interaction.downEvent, interaction, element);

          if (action && action.name === 'drag' && checkStartAxis(currentAxis, interactable) && _base2.default.validateAction(action, interactable, element, eventTarget, scope)) {

            return interactable;
          }
        }
      };

      // check all interactables
      while (is.element(element)) {
        var interactable = scope.interactables.forEachMatch(element, getDraggable);

        if (interactable) {
          interaction.prepared.name = 'drag';
          interaction.target = interactable;
          interaction.element = element;
          break;
        }

        element = (0, _domUtils.parentNode)(element);
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

exports.default = { init: init };

},{"./base":10,"@interactjs/utils/domUtils":44,"@interactjs/utils/is":51}],12:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function init(scope) {
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
  });

  // prevent regular down->move autoStart
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

exports.default = {
  init: init,
  getHoldDuration: getHoldDuration
};

},{}],13:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = exports.dragAxis = exports.hold = exports.autoStart = undefined;

var _base = _dereq_('./base');

var _base2 = _interopRequireDefault(_base);

var _hold = _dereq_('./hold');

var _hold2 = _interopRequireDefault(_hold);

var _dragAxis = _dereq_('./dragAxis');

var _dragAxis2 = _interopRequireDefault(_dragAxis);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  _base2.default.init(scope);
  _hold2.default.init(scope);
  _dragAxis2.default.init(scope);
}

exports.autoStart = _base2.default;
exports.hold = _hold2.default;
exports.dragAxis = _dragAxis2.default;
exports.init = init;

},{"./base":10,"./dragAxis":11,"./hold":12}],14:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _arr = _dereq_('@interactjs/utils/arr');

var arr = _interopRequireWildcard(_arr);

var _extend = _dereq_('@interactjs/utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _normalizeListeners = _dereq_('@interactjs/utils/normalizeListeners');

var _normalizeListeners2 = _interopRequireDefault(_normalizeListeners);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var Eventable = function () {
  function Eventable(options) {
    _classCallCheck(this, Eventable);

    this.options = (0, _extend2.default)({}, options || {});
    this.types = {};
    this.propagationStopped = this.immediatePropagationStopped = false;
  }

  Eventable.prototype.fire = function fire(event) {
    var listeners = void 0;
    var global = this.global;

    // Interactable#on() listeners
    if (listeners = this.types[event.type]) {
      fireUntilImmediateStopped(event, listeners);
    }

    // interact.on() listeners
    if (!event.propagationStopped && global && (listeners = global[event.type])) {
      fireUntilImmediateStopped(event, listeners);
    }
  };

  Eventable.prototype.on = function on(type, listener) {
    var listeners = (0, _normalizeListeners2.default)(type, listener);

    for (type in listeners) {
      this.types[type] = arr.merge(this.types[type] || [], listeners[type]);
    }
  };

  Eventable.prototype.off = function off(type, listener) {
    var listeners = (0, _normalizeListeners2.default)(type, listener);

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
  };

  return Eventable;
}();

exports.default = Eventable;

},{"@interactjs/utils/arr":40,"@interactjs/utils/extend":46,"@interactjs/utils/normalizeListeners":53}],15:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extend = _dereq_('@interactjs/utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _getOriginXY = _dereq_('@interactjs/utils/getOriginXY');

var _getOriginXY2 = _interopRequireDefault(_getOriginXY);

var _defaultOptions = _dereq_('./defaultOptions');

var _defaultOptions2 = _interopRequireDefault(_defaultOptions);

var _hypot = _dereq_('@interactjs/utils/hypot');

var _hypot2 = _interopRequireDefault(_hypot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var InteractEvent = function () {
  /** */
  function InteractEvent(interaction, event, actionName, phase, element, related, preEnd, type) {
    _classCallCheck(this, InteractEvent);

    element = element || interaction.element;

    var target = interaction.target;
    var deltaSource = (target && target.options || _defaultOptions2.default).deltaSource;
    var origin = (0, _getOriginXY2.default)(target, element, actionName);
    var starting = phase === 'start';
    var ending = phase === 'end';
    var prevEvent = starting ? this : interaction.prevEvent;
    var coords = starting ? interaction.coords.start : ending ? { page: prevEvent.page, client: prevEvent.client, timeStamp: interaction.coords.cur.timeStamp } : interaction.coords.cur;

    this.page = (0, _extend2.default)({}, coords.page);
    this.client = (0, _extend2.default)({}, coords.client);
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
      this.delta = { x: 0, y: 0 };
    } else {
      this.delta = {
        x: this[deltaSource].x - prevEvent[deltaSource].x,
        y: this[deltaSource].y - prevEvent[deltaSource].y
      };
    }

    this.dt = interaction.coords.delta.timeStamp;
    this.duration = this.timeStamp - this.t0;

    // velocity and speed in pixels per second
    this.velocity = (0, _extend2.default)({}, interaction.coords.velocity[deltaSource]);
    this.speed = (0, _hypot2.default)(this.velocity.x, this.velocity.y);

    this.swipe = ending || phase === 'inertiastart' ? this.getSwipe() : null;
  }

  InteractEvent.prototype.getSwipe = function getSwipe() {
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
  };

  InteractEvent.prototype.preventDefault = function preventDefault() {};

  /** */


  InteractEvent.prototype.stopImmediatePropagation = function stopImmediatePropagation() {
    this.immediatePropagationStopped = this.propagationStopped = true;
  };

  /** */


  InteractEvent.prototype.stopPropagation = function stopPropagation() {
    this.propagationStopped = true;
  };

  _createClass(InteractEvent, [{
    key: 'pageX',
    get: function get() {
      return this.page.x;
    },
    set: function set(value) {
      this.page.x = value;
    }
  }, {
    key: 'pageY',
    get: function get() {
      return this.page.y;
    },
    set: function set(value) {
      this.page.y = value;
    }
  }, {
    key: 'clientX',
    get: function get() {
      return this.client.x;
    },
    set: function set(value) {
      this.client.x = value;
    }
  }, {
    key: 'clientY',
    get: function get() {
      return this.client.y;
    },
    set: function set(value) {
      this.client.y = value;
    }
  }, {
    key: 'dx',
    get: function get() {
      return this.delta.x;
    },
    set: function set(value) {
      this.delta.x = value;
    }
  }, {
    key: 'dy',
    get: function get() {
      return this.delta.y;
    },
    set: function set(value) {
      this.delta.y = value;
    }
  }, {
    key: 'velocityX',
    get: function get() {
      return this.velocity.x;
    },
    set: function set(value) {
      this.velocity.x = value;
    }
  }, {
    key: 'velocityY',
    get: function get() {
      return this.velocity.y;
    },
    set: function set(value) {
      this.velocity.y = value;
    }
  }]);

  return InteractEvent;
}();

exports.default = InteractEvent;

},{"./defaultOptions":18,"@interactjs/utils/extend":46,"@interactjs/utils/getOriginXY":47,"@interactjs/utils/hypot":48}],16:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _clone = _dereq_('@interactjs/utils/clone');

var _clone2 = _interopRequireDefault(_clone);

var _is = _dereq_('@interactjs/utils/is');

var is = _interopRequireWildcard(_is);

var _events = _dereq_('@interactjs/utils/events');

var _events2 = _interopRequireDefault(_events);

var _extend = _dereq_('@interactjs/utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _arr = _dereq_('@interactjs/utils/arr');

var arr = _interopRequireWildcard(_arr);

var _normalizeListeners = _dereq_('@interactjs/utils/normalizeListeners');

var _normalizeListeners2 = _interopRequireDefault(_normalizeListeners);

var _Eventable = _dereq_('./Eventable');

var _Eventable2 = _interopRequireDefault(_Eventable);

var _domUtils = _dereq_('@interactjs/utils/domUtils');

var _window = _dereq_('@interactjs/utils/window');

var _browser = _dereq_('@interactjs/utils/browser');

var _browser2 = _interopRequireDefault(_browser);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Interactable = function () {
  _createClass(Interactable, [{
    key: '_defaults',
    get: function get() {
      return {
        base: {},
        perAction: {}
      };
    }

    /** */

  }]);

  function Interactable(target, options, defaultContext) {
    _classCallCheck(this, Interactable);

    this._actions = options.actions;
    this.target = target;
    this.events = new _Eventable2.default();
    this._context = options.context || defaultContext;
    this._win = (0, _window.getWindow)((0, _domUtils.trySelector)(target) ? this._context : target);
    this._doc = this._win.document;

    this.set(options);
  }

  Interactable.prototype.setOnEvents = function setOnEvents(actionName, phases) {
    if (is.func(phases.onstart)) {
      this.on(actionName + 'start', phases.onstart);
    }
    if (is.func(phases.onmove)) {
      this.on(actionName + 'move', phases.onmove);
    }
    if (is.func(phases.onend)) {
      this.on(actionName + 'end', phases.onend);
    }
    if (is.func(phases.oninertiastart)) {
      this.on(actionName + 'inertiastart', phases.oninertiastart);
    }

    return this;
  };

  Interactable.prototype.updatePerActionListeners = function updatePerActionListeners(actionName, prev, cur) {
    if (is.array(prev)) {
      this.off(actionName, prev);
    }

    if (is.array(cur)) {
      this.on(actionName, cur);
    }
  };

  Interactable.prototype.setPerAction = function setPerAction(actionName, options) {
    var defaults = this._defaults;

    // for all the default per-action options
    for (var optionName in options) {
      var actionOptions = this.options[actionName];
      var optionValue = options[optionName];
      var isArray = is.array(optionValue);

      // remove old event listeners and add new ones
      if (optionName === 'listeners') {
        this.updatePerActionListeners(actionName, actionOptions.listeners, optionValue);
      }

      // if the option value is an array
      if (isArray) {
        actionOptions[optionName] = arr.from(optionValue);
      }
      // if the option value is an object
      else if (!isArray && is.plainObject(optionValue)) {
          // copy the object
          actionOptions[optionName] = (0, _extend2.default)(actionOptions[optionName] || {}, (0, _clone2.default)(optionValue));

          // set anabled field to true if it exists in the defaults
          if (is.object(defaults.perAction[optionName]) && 'enabled' in defaults.perAction[optionName]) {
            actionOptions[optionName].enabled = optionValue.enabled === false ? false : true;
          }
        }
        // if the option value is a boolean and the default is an object
        else if (is.bool(optionValue) && is.object(defaults.perAction[optionName])) {
            actionOptions[optionName].enabled = optionValue;
          }
          // if it's anything else, do a plain assignment
          else {
              actionOptions[optionName] = optionValue;
            }
    }
  };

  /**
   * The default function to get an Interactables bounding rect. Can be
   * overridden using {@link Interactable.rectChecker}.
   *
   * @param {Element} [element] The element to measure.
   * @return {object} The object's bounding rectangle.
   */


  Interactable.prototype.getRect = function getRect(element) {
    element = element || this.target;

    if (is.string(this.target) && !is.element(element)) {
      element = this._context.querySelector(this.target);
    }

    return (0, _domUtils.getElementRect)(element);
  };

  /**
   * Returns or sets the function used to calculate the interactable's
   * element's rectangle
   *
   * @param {function} [checker] A function which returns this Interactable's
   * bounding rectangle. See {@link Interactable.getRect}
   * @return {function | object} The checker function or this Interactable
   */


  Interactable.prototype.rectChecker = function rectChecker(checker) {
    if (is.func(checker)) {
      this.getRect = checker;

      return this;
    }

    if (checker === null) {
      delete this.options.getRect;

      return this;
    }

    return this.getRect;
  };

  Interactable.prototype._backCompatOption = function _backCompatOption(optionName, newValue) {
    if ((0, _domUtils.trySelector)(newValue) || is.object(newValue)) {
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
  };

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


  Interactable.prototype.origin = function origin(newValue) {
    return this._backCompatOption('origin', newValue);
  };

  /**
   * Returns or sets the mouse coordinate types used to calculate the
   * movement of the pointer.
   *
   * @param {string} [newValue] Use 'client' if you will be scrolling while
   * interacting; Use 'page' if you want autoScroll to work
   * @return {string | object} The current deltaSource or this Interactable
   */


  Interactable.prototype.deltaSource = function deltaSource(newValue) {
    if (newValue === 'page' || newValue === 'client') {
      this.options.deltaSource = newValue;

      return this;
    }

    return this.options.deltaSource;
  };

  /**
   * Gets the selector context Node of the Interactable. The default is
   * `window.document`.
   *
   * @return {Node} The context Node of this Interactable
   */


  Interactable.prototype.context = function context() {
    return this._context;
  };

  Interactable.prototype.inContext = function inContext(element) {
    return this._context === element.ownerDocument || (0, _domUtils.nodeContains)(this._context, element);
  };

  /**
   * Calls listeners for the given InteractEvent type bound globally
   * and directly to this Interactable
   *
   * @param {InteractEvent} iEvent The InteractEvent object to be fired on this
   * Interactable
   * @return {Interactable} this Interactable
   */


  Interactable.prototype.fire = function fire(iEvent) {
    this.events.fire(iEvent);

    return this;
  };

  Interactable.prototype._onOff = function _onOff(method, typeArg, listenerArg, options) {
    if (is.object(typeArg) && !is.array(typeArg)) {
      options = listenerArg;
      listenerArg = null;
    }

    var addRemove = method === 'on' ? 'add' : 'remove';
    var listeners = (0, _normalizeListeners2.default)(typeArg, listenerArg);

    for (var type in listeners) {
      if (type === 'wheel') {
        type = _browser2.default.wheelEvent;
      }

      for (var _i2 = 0; _i2 < listeners[type].length; _i2++) {
        var _ref2;

        _ref2 = listeners[type][_i2];
        var listener = _ref2;

        // if it is an action event type
        if (arr.contains(this._actions.eventTypes, type)) {
          this.events[method](type, listener);
        }
        // delegated event
        else if (is.string(this.target)) {
            _events2.default[addRemove + 'Delegate'](this.target, this._context, type, listener, options);
          }
          // remove listener from this Interatable's element
          else {
              _events2.default[addRemove](this.target, type, listener, options);
            }
      }
    }

    return this;
  };

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


  Interactable.prototype.on = function on(types, listener, options) {
    return this._onOff('on', types, listener, options);
  };

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


  Interactable.prototype.off = function off(types, listener, options) {
    return this._onOff('off', types, listener, options);
  };

  /**
   * Reset the options of this Interactable
   *
   * @param {object} options The new settings to apply
   * @return {object} This Interactable
   */


  Interactable.prototype.set = function set(options) {
    var defaults = this._defaults;

    if (!is.object(options)) {
      options = {};
    }

    this.options = (0, _clone2.default)(defaults.base);

    for (var actionName in this._actions.methodDict) {
      var methodName = this._actions.methodDict[actionName];

      this.options[actionName] = {};
      this.setPerAction(actionName, (0, _extend2.default)((0, _extend2.default)({}, defaults.perAction), defaults[actionName]));

      this[methodName](options[actionName]);
    }

    for (var setting in options) {
      if (is.func(this[setting])) {
        this[setting](options[setting]);
      }
    }

    return this;
  };

  /**
   * Remove this interactable from the list of interactables and remove it's
   * action capabilities and event listeners
   *
   * @return {interact}
   */


  Interactable.prototype.unset = function unset() {
    _events2.default.remove(this.target, 'all');

    if (is.string(this.target)) {
      // remove delegated events
      for (var type in _events2.default.delegatedEvents) {
        var delegated = _events2.default.delegatedEvents[type];

        if (delegated.selectors[0] === this.target && delegated.contexts[0] === this._context) {

          delegated.selectors.splice(0, 1);
          delegated.contexts.splice(0, 1);
          delegated.listeners.splice(0, 1);

          // remove the arrays if they are empty
          if (!delegated.selectors.length) {
            delegated[type] = null;
          }
        }

        _events2.default.remove(this._context, type, _events2.default.delegateListener);
        _events2.default.remove(this._context, type, _events2.default.delegateUseCapture, true);
      }
    } else {
      _events2.default.remove(this, 'all');
    }
  };

  return Interactable;
}();

exports.default = Interactable;

},{"./Eventable":14,"@interactjs/utils/arr":40,"@interactjs/utils/browser":41,"@interactjs/utils/clone":42,"@interactjs/utils/domUtils":44,"@interactjs/utils/events":45,"@interactjs/utils/extend":46,"@interactjs/utils/is":51,"@interactjs/utils/normalizeListeners":53,"@interactjs/utils/window":60}],17:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _InteractEvent = _dereq_('./InteractEvent');

var _InteractEvent2 = _interopRequireDefault(_InteractEvent);

var _utils = _dereq_('@interactjs/utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Interaction = function () {
  _createClass(Interaction, [{
    key: 'pointerMoveTolerance',
    get: function get() {
      return 1;
    }

    /** */

  }]);

  function Interaction(_ref) {
    var pointerType = _ref.pointerType,
        signals = _ref.signals;

    _classCallCheck(this, Interaction);

    this._signals = signals;

    this.target = null; // current interactable being interacted with
    this.element = null; // the target element of the interactable
    this.prepared = { // action that's ready to be fired on next move event
      name: null,
      axis: null,
      edges: null
    };

    // keep track of added pointers
    this.pointers = [/* { id, pointer, event, target, downTime }*/];

    this.coords = {
      // Starting InteractEvent pointer coordinates
      start: utils.pointer.newCoords(),
      // Previous native pointer move event coordinates
      prev: utils.pointer.newCoords(),
      // current native pointer move event coordinates
      cur: utils.pointer.newCoords(),
      // Change in coordinates and time of the pointer
      delta: utils.pointer.newCoords(),
      // pointer velocity
      velocity: utils.pointer.newCoords()
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

  Interaction.prototype.pointerDown = function pointerDown(pointer, event, eventTarget) {
    var pointerIndex = this.updatePointer(pointer, event, eventTarget, true);

    this._signals.fire('down', {
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      pointerIndex: pointerIndex,
      interaction: this
    });
  };

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


  Interaction.prototype.start = function start(action, target, element) {
    if (this.interacting() || !this.pointerIsDown || this.pointers.length < (action.name === 'gesture' ? 2 : 1)) {
      return;
    }

    utils.copyAction(this.prepared, action);

    this.target = target;
    this.element = element;
    this._interacting = this._doPhase({
      interaction: this,
      event: this.downEvent,
      phase: 'start'
    });
  };

  Interaction.prototype.pointerMove = function pointerMove(pointer, event, eventTarget) {
    if (!this.simulation) {
      this.updatePointer(pointer, event, eventTarget, false);
      utils.pointer.setCoords(this.coords.cur, this.pointers.map(function (p) {
        return p.pointer;
      }));
    }

    var duplicateMove = this.coords.cur.page.x === this.coords.prev.page.x && this.coords.cur.page.y === this.coords.prev.page.y && this.coords.cur.client.x === this.coords.prev.client.x && this.coords.cur.client.y === this.coords.prev.client.y;

    var dx = void 0;
    var dy = void 0;

    // register movement greater than pointerMoveTolerance
    if (this.pointerIsDown && !this.pointerWasMoved) {
      dx = this.coords.cur.client.x - this.coords.start.client.x;
      dy = this.coords.cur.client.y - this.coords.start.client.y;

      this.pointerWasMoved = utils.hypot(dx, dy) > this.pointerMoveTolerance;
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
      utils.pointer.setCoordDeltas(this.coords.delta, this.coords.prev, this.coords.cur);
      utils.pointer.setCoordVelocity(this.coords.velocity, this.coords.delta);
    }

    this._signals.fire('move', signalArg);

    if (!duplicateMove) {
      // if interacting, fire an 'action-move' signal etc
      if (this.interacting()) {
        this.move(signalArg);
      }

      if (this.pointerWasMoved) {
        utils.pointer.copyCoords(this.coords.prev, this.coords.cur);
      }
    }
  };

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


  Interaction.prototype.move = function move(signalArg) {
    signalArg = utils.extend({
      pointer: this._latestPointer.pointer,
      event: this._latestPointer.event,
      eventTarget: this._latestPointer.eventTarget,
      interaction: this,
      noBefore: false
    }, signalArg || {});

    signalArg.phase = 'move';

    this._doPhase(signalArg);
  };

  // End interact move events and stop auto-scroll unless simulation is running


  Interaction.prototype.pointerUp = function pointerUp(pointer, event, eventTarget, curEventTarget) {
    var pointerIndex = this.getPointerIndex(pointer);

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
  };

  Interaction.prototype.documentBlur = function documentBlur(event) {
    this.end(event);
    this._signals.fire('blur', { event: event, interaction: this });
  };

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


  Interaction.prototype.end = function end(event) {
    this._ending = true;
    event = event || this._latestPointer.event;
    var endPhaseResult = void 0;

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
  };

  Interaction.prototype.currentAction = function currentAction() {
    return this._interacting ? this.prepared.name : null;
  };

  Interaction.prototype.interacting = function interacting() {
    return this._interacting;
  };

  /** */


  Interaction.prototype.stop = function stop() {
    this._signals.fire('stop', { interaction: this });

    this.target = this.element = null;

    this._interacting = false;
    this.prepared.name = this.prevEvent = null;
  };

  Interaction.prototype.getPointerIndex = function getPointerIndex(pointer) {
    var pointerId = utils.pointer.getPointerId(pointer);

    // mouse and pen interactions may have only one pointer
    return this.pointerType === 'mouse' || this.pointerType === 'pen' ? 0 : utils.arr.findIndex(this.pointers, function (curPointer) {
      return curPointer.id === pointerId;
    });
  };

  Interaction.prototype.getPointerInfo = function getPointerInfo(pointer) {
    return this.pointers[this.getPointerIndex(pointer)];
  };

  Interaction.prototype.updatePointer = function updatePointer(pointer, event, eventTarget, down) {
    var id = utils.pointer.getPointerId(pointer);
    var pointerIndex = this.getPointerIndex(pointer);
    var pointerInfo = this.pointers[pointerIndex];

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
        utils.pointer.setCoords(this.coords.start, this.pointers.map(function (p) {
          return p.pointer;
        }));

        utils.pointer.copyCoords(this.coords.cur, this.coords.start);
        utils.pointer.copyCoords(this.coords.prev, this.coords.start);
        utils.pointer.pointerExtend(this.downPointer, pointer);

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
  };

  Interaction.prototype.removePointer = function removePointer(pointer, event) {
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
  };

  Interaction.prototype._updateLatestPointer = function _updateLatestPointer(pointer, event, eventTarget) {
    this._latestPointer.pointer = pointer;
    this._latestPointer.event = event;
    this._latestPointer.eventTarget = eventTarget;
  };

  Interaction.prototype._createPreparedEvent = function _createPreparedEvent(event, phase, preEnd, type) {
    var actionName = this.prepared.name;

    return new _InteractEvent2.default(this, event, actionName, phase, this.element, null, preEnd, type);
  };

  Interaction.prototype._fireEvent = function _fireEvent(iEvent) {
    this.target.fire(iEvent);

    if (!this.prevEvent || iEvent.timeStamp >= this.prevEvent.timeStamp) {
      this.prevEvent = iEvent;
    }
  };

  Interaction.prototype._doPhase = function _doPhase(signalArg) {
    var event = signalArg.event,
        phase = signalArg.phase,
        preEnd = signalArg.preEnd,
        type = signalArg.type;


    if (!signalArg.noBefore) {
      var beforeResult = this._signals.fire('before-action-' + phase, signalArg);

      if (beforeResult === false) {
        return false;
      }
    }

    var iEvent = signalArg.iEvent = this._createPreparedEvent(event, phase, preEnd, type);

    this._signals.fire('action-' + phase, signalArg);

    this._fireEvent(iEvent);

    this._signals.fire('after-action-' + phase, signalArg);

    return true;
  };

  return Interaction;
}();

/**
 * @alias Interaction.prototype.move
 */


Interaction.prototype.doMove = utils.warnOnce(function (signalArg) {
  this.move(signalArg);
}, 'The interaction.doMove() method has been renamed to interaction.move()');

exports.default = Interaction;

},{"./InteractEvent":15,"@interactjs/utils":49}],18:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  base: {
    preventDefault: 'auto',
    deltaSource: 'page'
  },

  perAction: {
    enabled: false,
    origin: { x: 0, y: 0 }
  }
};

},{}],19:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = init;

var _is = _dereq_('@interactjs/utils/is');

var is = _interopRequireWildcard(_is);

var _events = _dereq_('@interactjs/utils/events');

var _events2 = _interopRequireDefault(_events);

var _browser = _dereq_('@interactjs/utils/browser');

var _browser2 = _interopRequireDefault(_browser);

var _domUtils = _dereq_('@interactjs/utils/domUtils');

var _window = _dereq_('@interactjs/utils/window');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function preventDefault(interactable, newValue) {
  if (/^(always|never|auto)$/.test(newValue)) {
    interactable.options.preventDefault = newValue;
    return interactable;
  }

  if (is.bool(newValue)) {
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
  }

  // setting === 'auto'

  // don't preventDefault of touch{start,move} events if the browser supports passive
  // events listeners. CSS touch-action and user-selecct should be used instead
  if (_events2.default.supportsPassive && /^touch(start|move)$/.test(event.type) && !_browser2.default.isIOS) {
    var docOptions = scope.getDocIndex((0, _window.getWindow)(event.target).document);

    if (!(docOptions && docOptions.events) || docOptions.events.passive !== false) {
      return;
    }
  }

  // don't preventDefault of pointerdown events
  if (/^(mouse|pointer|touch)*(down|start)/i.test(event.type)) {
    return;
  }

  // don't preventDefault on editable elements
  if (is.element(event.target) && (0, _domUtils.matchesSelector)(event.target, 'input,select,textarea,[contenteditable=true],[contenteditable=true] *')) {
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

function init(scope) {
  /** @lends Interactable */
  var Interactable = scope.Interactable;
  /**
   * Returns or sets whether to prevent the browser's default behaviour in
   * response to pointer events. Can be set to:
   *  - `'always'` to always prevent
   *  - `'never'` to never prevent
   *  - `'auto'` to let interact.js try to determine what would be best
   *
   * @param {string} [newValue] `true`, `false` or `'auto'`
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
  }

  // prevent native HTML5 drag on interact.js target elements
  scope.interactions.eventMap.dragstart = function preventNativeDrag(event) {
    for (var _i2 = 0; _i2 < scope.interactions.list.length; _i2++) {
      var _ref2;

      _ref2 = scope.interactions.list[_i2];
      var interaction = _ref2;


      if (interaction.element && (interaction.element === event.target || (0, _domUtils.nodeContains)(interaction.element, event.target))) {

        interaction.target.checkAndPreventDefault(event);
        return;
      }
    }
  };
}

exports.default = { init: init };

},{"@interactjs/utils/browser":41,"@interactjs/utils/domUtils":44,"@interactjs/utils/events":45,"@interactjs/utils/is":51,"@interactjs/utils/window":60}],20:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.newInteraction = newInteraction;

var _Interaction = _dereq_('./Interaction');

var _Interaction2 = _interopRequireDefault(_Interaction);

var _events = _dereq_('@interactjs/utils/events');

var _events2 = _interopRequireDefault(_events);

var _interactionFinder = _dereq_('@interactjs/utils/interactionFinder');

var _interactionFinder2 = _interopRequireDefault(_interactionFinder);

var _browser = _dereq_('@interactjs/utils/browser');

var _browser2 = _interopRequireDefault(_browser);

var _domObjects = _dereq_('@interactjs/utils/domObjects');

var _domObjects2 = _interopRequireDefault(_domObjects);

var _pointerUtils = _dereq_('@interactjs/utils/pointerUtils');

var _pointerUtils2 = _interopRequireDefault(_pointerUtils);

var _Signals = _dereq_('@interactjs/utils/Signals');

var _Signals2 = _interopRequireDefault(_Signals);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var methodNames = ['pointerDown', 'pointerMove', 'pointerUp', 'updatePointer', 'removePointer', 'windowBlur'];

function init(scope) {
  var signals = new _Signals2.default();

  var listeners = {};

  for (var _i = 0; _i < methodNames.length; _i++) {
    var method = methodNames[_i];
    listeners[method] = doOnInteractions(method, scope);
  }

  var eventMap = {/* 'eventType': listenerFunc */};
  var pEventTypes = _browser2.default.pEventTypes;

  if (_domObjects2.default.PointerEvent) {
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
  scope.signals.on('remove-document', onDocSignal);

  // for ignoring browser's simulated mouse events
  scope.prevTouchTime = 0;

  scope.Interaction = function (_InteractionBase) {
    _inherits(Interaction, _InteractionBase);

    function Interaction() {
      _classCallCheck(this, Interaction);

      return _possibleConstructorReturn(this, _InteractionBase.apply(this, arguments));
    }

    _createClass(Interaction, [{
      key: 'pointerMoveTolerance',
      get: function get() {
        return scope.interactions.pointerMoveTolerance;
      },
      set: function set(value) {
        scope.interactions.pointerMoveTolerance = value;
      }
    }]);

    return Interaction;
  }(_Interaction2.default);
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

    var pointerType = _pointerUtils2.default.getPointerType(event);

    var _pointerUtils$getEven = _pointerUtils2.default.getEventTargets(event),
        eventTarget = _pointerUtils$getEven[0],
        curEventTarget = _pointerUtils$getEven[1];

    var matches = []; // [ [pointer, interaction], ...]

    if (_browser2.default.supportsTouch && /touch/.test(event.type)) {
      scope.prevTouchTime = new Date().getTime();

      for (var _i3 = 0; _i3 < event.changedTouches.length; _i3++) {
        var _ref2;

        _ref2 = event.changedTouches[_i3];
        var changedTouch = _ref2;

        var pointer = changedTouch;
        var pointerId = _pointerUtils2.default.getPointerId(pointer);
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

      if (!_browser2.default.supportsPointerEvent && /mouse/.test(event.type)) {
        // ignore mouse events while touch interactions are active
        for (var i = 0; i < interactions.length && !invalidPointer; i++) {
          invalidPointer = interactions[i].pointerType !== 'mouse' && interactions[i].pointerIsDown;
        }

        // try to ignore mouse events that are simulated by the browser
        // after a touch event
        invalidPointer = invalidPointer || new Date().getTime() - scope.prevTouchTime < 500
        // on iOS and Firefox Mobile, MouseEvent.timeStamp is zero if simulated
        || event.timeStamp === 0;
      }

      if (!invalidPointer) {
        var _searchDetails = {
          pointer: event,
          pointerId: _pointerUtils2.default.getPointerId(event),
          pointerType: pointerType,
          eventType: event.type,
          curEventTarget: curEventTarget,
          eventTarget: eventTarget,
          scope: scope
        };

        var _interaction = getInteraction(_searchDetails);

        matches.push([_searchDetails.pointer, _searchDetails.eventTarget, _searchDetails.curEventTarget, _interaction]);
      }
    }

    // eslint-disable-next-line no-shadow
    for (var _i4 = 0; _i4 < matches.length; _i4++) {
      var _ref3 = matches[_i4];
      var _pointer = _ref3[0];
      var _eventTarget = _ref3[1];
      var _curEventTarget = _ref3[2];
      var _interaction2 = _ref3[3];

      _interaction2[method](_pointer, event, _eventTarget, _curEventTarget);
    }
  };
}

function getInteraction(searchDetails) {
  var pointerType = searchDetails.pointerType,
      scope = searchDetails.scope;


  var foundInteraction = _interactionFinder2.default.search(searchDetails);
  var signalArg = { interaction: foundInteraction, searchDetails: searchDetails };

  scope.interactions.signals.fire('find', signalArg);

  return signalArg.interaction || newInteraction({ pointerType: pointerType }, scope);
}

function newInteraction(options, scope) {
  var interaction = scope.interactions.new(options);

  scope.interactions.list.push(interaction);
  return interaction;
}

function onDocSignal(_ref4, signalName) {
  var doc = _ref4.doc,
      scope = _ref4.scope,
      options = _ref4.options;
  var eventMap = scope.interactions.eventMap;

  var eventMethod = signalName.indexOf('add') === 0 ? _events2.default.add : _events2.default.remove;

  // delegate event listener
  for (var eventType in _events2.default.delegatedEvents) {
    eventMethod(doc, eventType, _events2.default.delegateListener);
    eventMethod(doc, eventType, _events2.default.delegateUseCapture, true);
  }

  var eventOptions = options && options.events;

  for (var _eventType in eventMap) {
    eventMethod(doc, _eventType, eventMap[_eventType], eventOptions);
  }
}

exports.default = {
  init: init,
  onDocSignal: onDocSignal,
  doOnInteractions: doOnInteractions,
  newInteraction: newInteraction,
  methodNames: methodNames
};

},{"./Interaction":17,"@interactjs/utils/Signals":39,"@interactjs/utils/browser":41,"@interactjs/utils/domObjects":43,"@interactjs/utils/events":45,"@interactjs/utils/interactionFinder":50,"@interactjs/utils/pointerUtils":55}],21:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.createScope = createScope;
exports.initScope = initScope;

var _Eventable = _dereq_('./Eventable');

var _Eventable2 = _interopRequireDefault(_Eventable);

var _defaultOptions = _dereq_('./defaultOptions');

var _defaultOptions2 = _interopRequireDefault(_defaultOptions);

var _utils = _dereq_('@interactjs/utils');

var utils = _interopRequireWildcard(_utils);

var _domObjects = _dereq_('@interactjs/utils/domObjects');

var _domObjects2 = _interopRequireDefault(_domObjects);

var _interactions = _dereq_('@interactjs/core/interactions');

var _interactions2 = _interopRequireDefault(_interactions);

var _InteractEvent = _dereq_('./InteractEvent');

var _InteractEvent2 = _interopRequireDefault(_InteractEvent);

var _Interactable = _dereq_('./Interactable');

var _Interactable2 = _interopRequireDefault(_Interactable);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var win = utils.win,
    browser = utils.browser,
    raf = utils.raf,
    Signals = utils.Signals,
    events = utils.events;
function createScope() {
  var scope = {
    Signals: Signals,
    signals: new Signals(),
    browser: browser,
    events: events,
    utils: utils,
    defaults: utils.clone(_defaultOptions2.default),
    Eventable: _Eventable2.default,

    InteractEvent: _InteractEvent2.default,
    Interactable: function (_InteractableBase) {
      _inherits(Interactable, _InteractableBase);

      function Interactable() {
        _classCallCheck(this, Interactable);

        return _possibleConstructorReturn(this, _InteractableBase.apply(this, arguments));
      }

      Interactable.prototype.set = function set(options) {
        _InteractableBase.prototype.set.call(this, options);

        scope.signals.fire('set', {
          options: options,
          interactable: this
        });

        return this;
      };

      Interactable.prototype.unset = function unset() {
        _InteractableBase.prototype.unset.call(this);
        scope.interactables.signals.fire('unset', { interactable: this });
      };

      _createClass(Interactable, [{
        key: '_defaults',
        get: function get() {
          return scope.defaults;
        }
      }]);

      return Interactable;
    }(_Interactable2.default),

    interactables: {
      // all set interactables
      list: [],

      new: function _new(target, options) {
        options = utils.extend(options || {}, {
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

        return ret && (utils.is.string(element) || dontCheckInContext || ret.inContext(element)) ? ret : null;
      },
      forEachMatch: function forEachMatch(element, callback) {
        for (var _i = 0; _i < this.list.length; _i++) {
          var _ref;

          _ref = this.list[_i];
          var interactable = _ref;

          var ret = void 0;

          if ((utils.is.string(interactable.target)
          // target is a selector and the element matches
          ? utils.is.element(element) && utils.dom.matchesSelector(element, interactable.target) :
          // target is the element
          element === interactable.target) &&
          // the element is in context
          interactable.inContext(element)) {
            ret = callback(interactable);
          }

          if (ret !== undefined) {
            return ret;
          }
        }
      },


      signals: new utils.Signals()
    },

    // main document
    document: null,
    // all documents being listened to
    documents: [/* { doc, options } */],

    init: function init(window) {
      return initScope(scope, window);
    },
    addDocument: function addDocument(doc, options) {
      // do nothing if document is already known
      if (scope.getDocIndex(doc) !== -1) {
        return false;
      }

      var window = win.getWindow(doc);

      scope.documents.push({ doc: doc, options: options });
      events.documents.push(doc);

      // don't add an unload event for the main document
      // so that the page may be cached in browser history
      if (doc !== scope.document) {
        events.add(window, 'unload', scope.onWindowUnload);
      }

      scope.signals.fire('add-document', { doc: doc, window: window, scope: scope, options: options });
    },
    removeDocument: function removeDocument(doc) {
      var index = scope.getDocIndex(doc);

      var window = win.getWindow(doc);
      var options = scope.documents[index].options;

      events.remove(window, 'unload', scope.onWindowUnload);

      scope.documents.splice(index, 1);
      events.documents.splice(index, 1);

      scope.signals.fire('remove-document', { doc: doc, window: window, scope: scope, options: options });
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
    }
  };

  _interactions2.default.init(scope);

  return scope;
}

function initScope(scope, window) {
  win.init(window);
  _domObjects2.default.init(window);
  browser.init(window);
  raf.init(window);
  events.init(window);

  _interactions2.default.init(scope);
  scope.document = window.document;

  return scope;
}

},{"./Eventable":14,"./InteractEvent":15,"./Interactable":16,"./defaultOptions":18,"@interactjs/core/interactions":20,"@interactjs/utils":49,"@interactjs/utils/domObjects":43}],22:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _base = _dereq_('@interactjs/modifiers/base');

var _base2 = _interopRequireDefault(_base);

var _utils = _dereq_('@interactjs/utils');

var utils = _interopRequireWildcard(_utils);

var _raf = _dereq_('@interactjs/utils/raf');

var _raf2 = _interopRequireDefault(_raf);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  var interactions = scope.interactions,
      defaults = scope.defaults;


  interactions.signals.on('new', function (interaction) {
    interaction.inertia = {
      active: false,
      smoothEnd: false,
      allowResume: false,

      startEvent: null,
      upCoords: {},

      xe: 0, ye: 0,
      sx: 0, sy: 0,

      t0: 0,
      vx0: 0, vys: 0,
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
    return stop(arg, scope);
  });

  defaults.perAction.inertia = {
    enabled: false,
    resistance: 10, // the lambda in exponential decay
    minSpeed: 100, // target speed must be above this for inertia to start
    endSpeed: 10, // the speed at which inertia is slow enough to stop
    allowResume: true, // allow resuming an action in inertia phase
    smoothEndDuration: 300 // animate to snap/restrict endOnly if there's no inertia
  };
}

function resume(_ref, scope) {
  var interaction = _ref.interaction,
      event = _ref.event,
      pointer = _ref.pointer,
      eventTarget = _ref.eventTarget;

  var status = interaction.inertia;

  // Check if the down event hits the current inertia target
  if (status.active) {
    var element = eventTarget;

    // climb up the DOM tree from the event target
    while (utils.is.element(element)) {

      // if interaction element is the current inertia target element
      if (element === interaction.element) {
        // stop inertia
        _raf2.default.cancel(status.i);
        status.active = false;
        interaction.simulation = null;

        // update pointers to the down event's coordinates
        interaction.updatePointer(pointer, event, eventTarget, true);
        utils.pointer.setCoords(interaction.coords.cur, interaction.pointers);

        // fire appropriate signals
        var signalArg = {
          interaction: interaction
        };

        scope.interactions.signals.fire('action-resume', signalArg);

        // fire a reume event
        var resumeEvent = new scope.InteractEvent(interaction, event, interaction.prepared.name, 'resume', interaction.element);

        interaction._fireEvent(resumeEvent);
        _base2.default.resetStatuses(interaction.modifiers.statuses, scope.modifiers);

        utils.pointer.copyCoords(interaction.coords.prev, interaction.coords.cur);
        break;
      }

      element = utils.dom.parentNode(element);
    }
  }
}

function release(_ref2, scope) {
  var interaction = _ref2.interaction,
      event = _ref2.event;

  var status = interaction.inertia;

  if (!interaction.interacting() || interaction.simulation && interaction.simulation.active) {
    return;
  }

  var options = getOptions(interaction);

  var now = new Date().getTime();
  var velocityClient = interaction.coords.velocity.client;

  var pointerSpeed = utils.hypot(velocityClient.x, velocityClient.y);

  var smoothEnd = false;
  var modifierResult = void 0;

  // check if inertia should be started
  var inertiaPossible = options && options.enabled && interaction.prepared.name !== 'gesture' && event !== status.startEvent;

  var inertia = inertiaPossible && now - interaction.coords.cur.timeStamp < 50 && pointerSpeed > options.minSpeed && pointerSpeed > options.endSpeed;

  var modifierArg = {
    interaction: interaction,
    pageCoords: utils.extend({}, interaction.coords.cur.page),
    statuses: {},
    preEnd: true,
    requireEndOnly: true
  };

  // smoothEnd
  if (inertiaPossible && !inertia) {
    _base2.default.resetStatuses(modifierArg.statuses, scope.modifiers);

    modifierResult = _base2.default.setAll(modifierArg, scope.modifiers);

    if (modifierResult.shouldMove && modifierResult.locked) {
      smoothEnd = true;
    }
  }

  if (!(inertia || smoothEnd)) {
    return;
  }

  utils.pointer.copyCoords(status.upCoords, interaction.coords.cur);

  interaction.pointers[0].pointer = status.startEvent = new scope.InteractEvent(interaction, event, interaction.prepared.name, 'inertiastart', interaction.element);

  status.t0 = now;

  status.active = true;
  status.allowResume = options.allowResume;
  interaction.simulation = status;

  interaction.target.fire(status.startEvent);

  if (inertia) {
    status.vx0 = interaction.coords.velocity.client.x;
    status.vy0 = interaction.coords.velocity.client.y;
    status.v0 = pointerSpeed;

    calcInertia(interaction, status);

    utils.extend(modifierArg.pageCoords, interaction.coords.cur.page);

    modifierArg.pageCoords.x += status.xe;
    modifierArg.pageCoords.y += status.ye;

    _base2.default.resetStatuses(modifierArg.statuses, scope.modifiers);

    modifierResult = _base2.default.setAll(modifierArg, scope.modifiers);

    status.modifiedXe += modifierResult.delta.x;
    status.modifiedYe += modifierResult.delta.y;

    status.i = _raf2.default.request(function () {
      return inertiaTick(interaction);
    });
  } else {
    status.smoothEnd = true;
    status.xe = modifierResult.delta.x;
    status.ye = modifierResult.delta.y;

    status.sx = status.sy = 0;

    status.i = _raf2.default.request(function () {
      return smothEndTick(interaction);
    });
  }

  return false;
}

function stop(_ref3) {
  var interaction = _ref3.interaction;

  var status = interaction.inertia;

  if (status.active) {
    _raf2.default.cancel(status.i);
    status.active = false;
    interaction.simulation = null;
  }
}

function calcInertia(interaction, status) {
  var options = getOptions(interaction);
  var lambda = options.resistance;
  var inertiaDur = -Math.log(options.endSpeed / status.v0) / lambda;

  status.x0 = interaction.prevEvent.page.x;
  status.y0 = interaction.prevEvent.page.y;
  status.t0 = status.startEvent.timeStamp / 1000;
  status.sx = status.sy = 0;

  status.modifiedXe = status.xe = (status.vx0 - inertiaDur) / lambda;
  status.modifiedYe = status.ye = (status.vy0 - inertiaDur) / lambda;
  status.te = inertiaDur;

  status.lambda_v0 = lambda / status.v0;
  status.one_ve_v0 = 1 - options.endSpeed / status.v0;
}

function inertiaTick(interaction) {
  updateInertiaCoords(interaction);
  utils.pointer.setCoordDeltas(interaction.coords.delta, interaction.coords.prev, interaction.coords.cur);
  utils.pointer.setCoordVelocity(interaction.coords.velocity, interaction.coords.delta);

  var status = interaction.inertia;
  var options = getOptions(interaction);
  var lambda = options.resistance;
  var t = new Date().getTime() / 1000 - status.t0;

  if (t < status.te) {

    var progress = 1 - (Math.exp(-lambda * t) - status.lambda_v0) / status.one_ve_v0;

    if (status.modifiedXe === status.xe && status.modifiedYe === status.ye) {
      status.sx = status.xe * progress;
      status.sy = status.ye * progress;
    } else {
      var quadPoint = utils.getQuadraticCurvePoint(0, 0, status.xe, status.ye, status.modifiedXe, status.modifiedYe, progress);

      status.sx = quadPoint.x;
      status.sy = quadPoint.y;
    }

    interaction.move();

    status.i = _raf2.default.request(function () {
      return inertiaTick(interaction);
    });
  } else {
    status.sx = status.modifiedXe;
    status.sy = status.modifiedYe;

    interaction.move();
    interaction.end(status.startEvent);
    status.active = false;
    interaction.simulation = null;
  }

  utils.pointer.copyCoords(interaction.coords.prev, interaction.coords.cur);
}

function smothEndTick(interaction) {
  updateInertiaCoords(interaction);

  var status = interaction.inertia;
  var t = new Date().getTime() - status.t0;

  var _getOptions = getOptions(interaction),
      duration = _getOptions.smoothEndDuration;

  if (t < duration) {
    status.sx = utils.easeOutQuad(t, 0, status.xe, duration);
    status.sy = utils.easeOutQuad(t, 0, status.ye, duration);

    interaction.move();

    status.i = _raf2.default.request(function () {
      return smothEndTick(interaction);
    });
  } else {
    status.sx = status.xe;
    status.sy = status.ye;

    interaction.move();
    interaction.end(status.startEvent);

    status.smoothEnd = status.active = false;
    interaction.simulation = null;
  }
}

function updateInertiaCoords(interaction) {
  var status = interaction.inertia;

  // return if inertia isn't running
  if (!status.active) {
    return;
  }

  var pageUp = status.upCoords.page;
  var clientUp = status.upCoords.client;

  utils.pointer.setCoords(interaction.coords.cur, [{
    pageX: pageUp.x + status.sx,
    pageY: pageUp.y + status.sy,
    clientX: clientUp.x + status.sx,
    clientY: clientUp.y + status.sy
  }]);
}

function getOptions(_ref4) {
  var target = _ref4.target,
      prepared = _ref4.prepared;

  return target && target.options && prepared.name && target.options[prepared.name].inertia;
}

exports.default = {
  init: init,
  calcInertia: calcInertia,
  inertiaTick: inertiaTick,
  smothEndTick: smothEndTick,
  updateInertiaCoords: updateInertiaCoords
};

},{"@interactjs/modifiers/base":25,"@interactjs/utils":49,"@interactjs/utils/raf":56}],23:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.interact = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /* browser entry point */

exports.init = init;

var _interact = _dereq_('./interact');

var _interact2 = _interopRequireDefault(_interact);

var _interactablePreventDefault = _dereq_('@interactjs/core/interactablePreventDefault');

var _interactablePreventDefault2 = _interopRequireDefault(_interactablePreventDefault);

var _inertia = _dereq_('@interactjs/inertia');

var _inertia2 = _interopRequireDefault(_inertia);

var _pointerEvents = _dereq_('@interactjs/pointerEvents');

var pointerEvents = _interopRequireWildcard(_pointerEvents);

var _autoStart = _dereq_('@interactjs/autoStart');

var autoStart = _interopRequireWildcard(_autoStart);

var _actions = _dereq_('@interactjs/actions');

var actions = _interopRequireWildcard(_actions);

var _modifiers = _dereq_('@interactjs/modifiers');

var modifiers = _interopRequireWildcard(_modifiers);

var _snappers = _dereq_('@interactjs/utils/snappers');

var snappers = _interopRequireWildcard(_snappers);

var _autoScroll = _dereq_('@interactjs/autoScroll');

var _autoScroll2 = _interopRequireDefault(_autoScroll);

var _reflow = _dereq_('@interactjs/reflow');

var _reflow2 = _interopRequireDefault(_reflow);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(window) {
  _interact.scope.init(window);

  _interact2.default.use(_interactablePreventDefault2.default);

  // inertia
  _interact2.default.use(_inertia2.default);

  // pointerEvents
  _interact2.default.use(pointerEvents);

  // autoStart, hold
  _interact2.default.use(autoStart);

  // drag and drop, resize, gesture
  _interact2.default.use(actions);

  // snap, resize, etc.
  _interact2.default.use(modifiers);

  _interact2.default.snappers = snappers;
  _interact2.default.createSnapGrid = _interact2.default.snappers.grid;

  // autoScroll
  _interact2.default.use(_autoScroll2.default);

  // reflow
  _interact2.default.use(_reflow2.default);

  return _interact2.default;
}

if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object') {
  init(window);
}

exports.default = _interact2.default;
exports.interact = _interact2.default;

},{"./interact":24,"@interactjs/actions":6,"@interactjs/autoScroll":8,"@interactjs/autoStart":13,"@interactjs/core/interactablePreventDefault":19,"@interactjs/inertia":22,"@interactjs/modifiers":26,"@interactjs/pointerEvents":36,"@interactjs/reflow":38,"@interactjs/utils/snappers":59}],24:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.scope = undefined;

var _browser = _dereq_('@interactjs/utils/browser');

var _browser2 = _interopRequireDefault(_browser);

var _events = _dereq_('@interactjs/utils/events');

var _events2 = _interopRequireDefault(_events);

var _utils = _dereq_('@interactjs/utils');

var utils = _interopRequireWildcard(_utils);

var _scope = _dereq_('@interactjs/core/scope');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @module interact */

var globalEvents = {};
var scope = (0, _scope.createScope)();

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
function interact(target, options) {
  var interactable = scope.interactables.get(target, options);

  if (!interactable) {
    interactable = scope.interactables.new(target, options);
    interactable.events.global = globalEvents;
  }

  return interactable;
}

/**
 * Use a plugin
 *
 * @alias module:interact.use
 *
 * @param {Object} plugin
 * @param {function} plugin.init
 * @return {interact}
*/
interact.use = function (plugin) {
  plugin.init(scope);
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
  if (utils.is.string(type) && type.search(' ') !== -1) {
    type = type.trim().split(/ +/);
  }

  if (utils.is.array(type)) {
    for (var _i = 0; _i < type.length; _i++) {
      var _ref;

      _ref = type[_i];
      var eventType = _ref;

      interact.on(eventType, listener, options);
    }

    return interact;
  }

  if (utils.is.object(type)) {
    for (var prop in type) {
      interact.on(prop, type[prop], listener);
    }

    return interact;
  }

  // if it is an InteractEvent type, add listener to globalEvents
  if (utils.arr.contains(scope.actions.eventTypes, type)) {
    // if this type of event was never bound
    if (!globalEvents[type]) {
      globalEvents[type] = [listener];
    } else {
      globalEvents[type].push(listener);
    }
  }
  // If non InteractEvent type, addEventListener to document
  else {
      _events2.default.add(scope.document, type, listener, { options: options });
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
  if (utils.is.string(type) && type.search(' ') !== -1) {
    type = type.trim().split(/ +/);
  }

  if (utils.is.array(type)) {
    for (var _i2 = 0; _i2 < type.length; _i2++) {
      var _ref2;

      _ref2 = type[_i2];
      var eventType = _ref2;

      interact.off(eventType, listener, options);
    }

    return interact;
  }

  if (utils.is.object(type)) {
    for (var prop in type) {
      interact.off(prop, type[prop], listener);
    }

    return interact;
  }

  if (!utils.arr.contains(scope.actions.eventTypes, type)) {
    _events2.default.remove(scope.document, type, listener, options);
  } else {
    var index = void 0;

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
};

// expose the functions used to calculate multi-touch properties
interact.getPointerAverage = utils.pointer.pointerAverage;
interact.getTouchBBox = utils.pointer.touchBBox;
interact.getTouchDistance = utils.pointer.touchDistance;
interact.getTouchAngle = utils.pointer.touchAngle;

interact.getElementRect = utils.dom.getElementRect;
interact.getElementClientRect = utils.dom.getElementClientRect;
interact.matchesSelector = utils.dom.matchesSelector;
interact.closest = utils.dom.closest;

/**
 * @alias module:interact.supportsTouch
 *
 * @return {boolean} Whether or not the browser supports touch input
 */
interact.supportsTouch = function () {
  return _browser2.default.supportsTouch;
};

/**
 * @alias module:interact.supportsPointerEvent
 *
 * @return {boolean} Whether or not the browser supports PointerEvents
 */
interact.supportsPointerEvent = function () {
  return _browser2.default.supportsPointerEvent;
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
  if (utils.is.number(newValue)) {
    scope.interactions.pointerMoveTolerance = newValue;

    return interact;
  }

  return scope.interactions.pointerMoveTolerance;
};

scope.interactables.signals.on('unset', function (_ref4) {
  var interactable = _ref4.interactable;

  scope.interactables.list.splice(scope.interactables.list.indexOf(interactable), 1);

  // Stop related interactions when an Interactable is unset
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

exports.scope = scope;
exports.default = interact;

},{"@interactjs/core/scope":21,"@interactjs/utils":49,"@interactjs/utils/browser":41,"@interactjs/utils/events":45}],25:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extend = _dereq_('@interactjs/utils/extend');

var _extend2 = _interopRequireDefault(_extend);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  var interactions = scope.interactions;


  scope.modifiers = { names: [] };

  interactions.signals.on('new', function (interaction) {
    interaction.modifiers = {
      startOffset: { left: 0, right: 0, top: 0, bottom: 0 },
      offsets: {},
      statuses: resetStatuses({}, scope.modifiers),
      result: null
    };
  });

  interactions.signals.on('before-action-start', function (arg) {
    return start(arg, scope.modifiers, arg.interaction.coords.start.page);
  });

  interactions.signals.on('action-resume', function (arg) {
    beforeMove(arg, scope.modifiers);
    start(arg, scope.modifiers, arg.interaction.coords.cur.page);
  });

  interactions.signals.on('before-action-move', function (arg) {
    return beforeMove(arg, scope.modifiers);
  });
  interactions.signals.on('before-action-end', function (arg) {
    return beforeEnd(arg, scope.modifiers);
  });

  interactions.signals.on('before-action-start', function (arg) {
    return setCurCoords(arg, scope.modifiers);
  });
  interactions.signals.on('before-action-move', function (arg) {
    return setCurCoords(arg, scope.modifiers);
  });
}

function startAll(arg, modifiers) {
  var interaction = arg.interaction,
      page = arg.pageCoords;
  var target = interaction.target,
      element = interaction.element,
      startOffset = interaction.modifiers.startOffset;

  var rect = target.getRect(element);

  if (rect) {
    startOffset.left = page.x - rect.left;
    startOffset.top = page.y - rect.top;

    startOffset.right = rect.right - page.x;
    startOffset.bottom = rect.bottom - page.y;

    if (!('width' in rect)) {
      rect.width = rect.right - rect.left;
    }
    if (!('height' in rect)) {
      rect.height = rect.bottom - rect.top;
    }
  } else {
    startOffset.left = startOffset.top = startOffset.right = startOffset.bottom = 0;
  }

  arg.rect = rect;
  arg.interactable = target;
  arg.element = element;

  for (var _i = 0; _i < modifiers.names.length; _i++) {
    var _ref;

    _ref = modifiers.names[_i];
    var modifierName = _ref;

    arg.options = target.options[interaction.prepared.name][modifierName];
    arg.status = arg.statuses[modifierName];

    if (!arg.options) {
      continue;
    }

    interaction.modifiers.offsets[modifierName] = modifiers[modifierName].start(arg);
  }
}

function setAll(arg, modifiers) {
  var interaction = arg.interaction,
      statuses = arg.statuses,
      preEnd = arg.preEnd,
      requireEndOnly = arg.requireEndOnly;


  arg.modifiedCoords = (0, _extend2.default)({}, arg.pageCoords);

  var result = {
    delta: { x: 0, y: 0 },
    coords: arg.modifiedCoords,
    changed: false,
    locked: false,
    shouldMove: true
  };

  for (var _i2 = 0; _i2 < modifiers.names.length; _i2++) {
    var _ref2;

    _ref2 = modifiers.names[_i2];
    var modifierName = _ref2;

    var modifier = modifiers[modifierName];
    var options = interaction.target.options[interaction.prepared.name][modifierName];

    if (!shouldDo(options, preEnd, requireEndOnly)) {
      continue;
    }

    arg.status = arg.status = statuses[modifierName];
    arg.options = options;
    arg.offset = arg.interaction.modifiers.offsets[modifierName];

    modifier.set(arg);

    if (arg.status.locked) {
      arg.modifiedCoords.x += arg.status.delta.x;
      arg.modifiedCoords.y += arg.status.delta.y;

      result.delta.x += arg.status.delta.x;
      result.delta.y += arg.status.delta.y;

      result.locked = true;
    }
  }

  var changed = interaction.coords.cur.page.x !== arg.modifiedCoords.x || interaction.coords.cur.page.y !== arg.modifiedCoords.y;

  // a move should be fired if:
  //  - there are no modifiers enabled,
  //  - no modifiers are "locked" i.e. have changed the pointer's coordinates, or
  //  - the locked coords have changed since the last pointer move
  result.shouldMove = !arg.status || !result.locked || changed;

  return result;
}

function resetStatuses(statuses, modifiers) {
  for (var _i3 = 0; _i3 < modifiers.names.length; _i3++) {
    var _ref3;

    _ref3 = modifiers.names[_i3];
    var modifierName = _ref3;

    var status = statuses[modifierName] || {};

    status.delta = { x: 0, y: 0 };
    status.locked = false;

    statuses[modifierName] = status;
  }

  return statuses;
}

function start(_ref4, modifiers, pageCoords) {
  var interaction = _ref4.interaction,
      phase = _ref4.phase;

  var arg = {
    interaction: interaction,
    pageCoords: pageCoords,
    phase: phase,
    startOffset: interaction.modifiers.startOffset,
    statuses: interaction.modifiers.statuses,
    preEnd: false,
    requireEndOnly: false
  };

  startAll(arg, modifiers);
  resetStatuses(arg.statuses, modifiers);

  arg.pageCoords = (0, _extend2.default)({}, interaction.coords.start.page);
  interaction.modifiers.result = setAll(arg, modifiers);
}

function beforeMove(_ref5, modifiers) {
  var interaction = _ref5.interaction,
      preEnd = _ref5.preEnd;

  var modifierResult = setAll({
    interaction: interaction,
    preEnd: preEnd,
    pageCoords: interaction.coords.cur.page,
    statuses: interaction.modifiers.statuses,
    requireEndOnly: false
  }, modifiers);

  interaction.modifiers.result = modifierResult;

  // don't fire an action move if a modifier would keep the event in the same
  // cordinates as before
  if (!modifierResult.shouldMove && interaction.interacting()) {
    return false;
  }
}

function beforeEnd(_ref6, modifiers) {
  var interaction = _ref6.interaction,
      event = _ref6.event;

  for (var _i4 = 0; _i4 < modifiers.names.length; _i4++) {
    var _ref7;

    _ref7 = modifiers.names[_i4];
    var modifierName = _ref7;

    var options = interaction.target.options[interaction.prepared.name][modifierName];

    // if the endOnly option is true for any modifier
    if (shouldDo(options, true, true)) {
      // fire a move event at the modified coordinates
      interaction.move({ event: event, preEnd: true });
      break;
    }
  }
}

function setCurCoords(arg, modifiers) {
  var interaction = arg.interaction;

  var modifierArg = (0, _extend2.default)({
    page: interaction.coords.cur.page,
    client: interaction.coords.cur.client
  }, arg);

  for (var i = 0; i < modifiers.names.length; i++) {
    var modifierName = modifiers.names[i];
    modifierArg.options = interaction.target.options[interaction.prepared.name][modifierName];

    if (!modifierArg.options || !modifierArg.options.enabled) {
      continue;
    }

    var status = interaction.modifiers.statuses[modifierName];

    if (status.locked) {
      modifierArg.page.x += status.delta.x;
      modifierArg.page.y += status.delta.y;
      modifierArg.client.x += status.delta.x;
      modifierArg.client.y += status.delta.y;
    }
  }
}

function shouldDo(options, preEnd, requireEndOnly) {
  return options && options.enabled && (preEnd || !options.endOnly) && (!requireEndOnly || options.endOnly);
}

exports.default = {
  init: init,
  startAll: startAll,
  setAll: setAll,
  resetStatuses: resetStatuses,
  start: start,
  beforeMove: beforeMove,
  beforeEnd: beforeEnd,
  shouldDo: shouldDo
};

},{"@interactjs/utils/extend":46}],26:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = exports.restrictSize = exports.restrictEdges = exports.restrict = exports.snapEdges = exports.snapSize = exports.snap = exports.modifiers = undefined;

var _base = _dereq_('./base');

var _base2 = _interopRequireDefault(_base);

var _snap = _dereq_('./snap');

var _snap2 = _interopRequireDefault(_snap);

var _snapSize = _dereq_('./snapSize');

var _snapSize2 = _interopRequireDefault(_snapSize);

var _snapEdges = _dereq_('./snapEdges');

var _snapEdges2 = _interopRequireDefault(_snapEdges);

var _restrict = _dereq_('./restrict');

var _restrict2 = _interopRequireDefault(_restrict);

var _restrictEdges = _dereq_('./restrictEdges');

var _restrictEdges2 = _interopRequireDefault(_restrictEdges);

var _restrictSize = _dereq_('./restrictSize');

var _restrictSize2 = _interopRequireDefault(_restrictSize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  _base2.default.init(scope);
  _snap2.default.init(scope);
  _snapSize2.default.init(scope);
  _snapEdges2.default.init(scope);
  _restrict2.default.init(scope);
  _restrictEdges2.default.init(scope);
  _restrictSize2.default.init(scope);
}

exports.modifiers = _base2.default;
exports.snap = _snap2.default;
exports.snapSize = _snapSize2.default;
exports.snapEdges = _snapEdges2.default;
exports.restrict = _restrict2.default;
exports.restrictEdges = _restrictEdges2.default;
exports.restrictSize = _restrictSize2.default;
exports.init = init;

},{"./base":25,"./restrict":27,"./restrictEdges":28,"./restrictSize":29,"./snap":30,"./snapEdges":31,"./snapSize":32}],27:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _is = _dereq_('@interactjs/utils/is');

var is = _interopRequireWildcard(_is);

var _extend = _dereq_('@interactjs/utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _rect = _dereq_('@interactjs/utils/rect');

var _rect2 = _interopRequireDefault(_rect);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  var modifiers = scope.modifiers,
      defaults = scope.defaults;


  modifiers.restrict = restrict;
  modifiers.names.push('restrict');

  defaults.perAction.restrict = restrict.defaults;
}

function start(_ref) {
  var rect = _ref.rect,
      startOffset = _ref.startOffset,
      options = _ref.options;

  var elementRect = options && options.elementRect;
  var offset = {};

  if (rect && elementRect) {
    offset.left = startOffset.left - rect.width * elementRect.left;
    offset.top = startOffset.top - rect.height * elementRect.top;

    offset.right = startOffset.right - rect.width * (1 - elementRect.right);
    offset.bottom = startOffset.bottom - rect.height * (1 - elementRect.bottom);
  } else {
    offset.left = offset.top = offset.right = offset.bottom = 0;
  }

  return offset;
}

function set(_ref2) {
  var modifiedCoords = _ref2.modifiedCoords,
      interaction = _ref2.interaction,
      status = _ref2.status,
      phase = _ref2.phase,
      offset = _ref2.offset,
      options = _ref2.options;

  if (phase === 'start' && options.elementRect) {
    return;
  }

  var page = (0, _extend2.default)({}, modifiedCoords);

  var restriction = getRestrictionRect(options.restriction, interaction, page);

  if (!restriction) {
    return status;
  }

  status.delta.x = 0;
  status.delta.y = 0;
  status.locked = false;

  var rect = restriction;
  var modifiedX = page.x;
  var modifiedY = page.y;

  // object is assumed to have
  // x, y, width, height or
  // left, top, right, bottom
  if ('x' in restriction && 'y' in restriction) {
    modifiedX = Math.max(Math.min(rect.x + rect.width - offset.right, page.x), rect.x + offset.left);
    modifiedY = Math.max(Math.min(rect.y + rect.height - offset.bottom, page.y), rect.y + offset.top);
  } else {
    modifiedX = Math.max(Math.min(rect.right - offset.right, page.x), rect.left + offset.left);
    modifiedY = Math.max(Math.min(rect.bottom - offset.bottom, page.y), rect.top + offset.top);
  }

  status.delta.x = modifiedX - page.x;
  status.delta.y = modifiedY - page.y;

  status.locked = !!(status.delta.x || status.delta.y);

  status.modifiedX = modifiedX;
  status.modifiedY = modifiedY;
}

function getRestrictionRect(value, interaction, page) {
  if (is.func(value)) {
    return _rect2.default.resolveRectLike(value, interaction.target, interaction.element, [page.x, page.y, interaction]);
  } else {
    return _rect2.default.resolveRectLike(value, interaction.target, interaction.element);
  }
}

var restrict = {
  init: init,
  start: start,
  set: set,
  getRestrictionRect: getRestrictionRect,
  defaults: {
    enabled: false,
    endOnly: false,
    restriction: null,
    elementRect: null
  }
};

exports.default = restrict;

},{"@interactjs/utils/extend":46,"@interactjs/utils/is":51,"@interactjs/utils/rect":57}],28:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extend = _dereq_('@interactjs/utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _rect = _dereq_('@interactjs/utils/rect');

var _rect2 = _interopRequireDefault(_rect);

var _restrict = _dereq_('./restrict');

var _restrict2 = _interopRequireDefault(_restrict);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getRestrictionRect = _restrict2.default.getRestrictionRect; // This module adds the options.resize.restrictEdges setting which sets min and
// max for the top, left, bottom and right edges of the target being resized.
//
// interact(target).resize({
//   edges: { top: true, left: true },
//   restrictEdges: {
//     inner: { top: 200, left: 200, right: 400, bottom: 400 },
//     outer: { top:   0, left:   0, right: 600, bottom: 600 },
//   },
// });

var noInner = { top: +Infinity, left: +Infinity, bottom: -Infinity, right: -Infinity };
var noOuter = { top: -Infinity, left: -Infinity, bottom: +Infinity, right: +Infinity };

function init(scope) {
  var modifiers = scope.modifiers,
      defaults = scope.defaults;


  modifiers.restrictEdges = restrictEdges;
  modifiers.names.push('restrictEdges');

  defaults.perAction.restrictEdges = restrictEdges.defaults;
}

function start(_ref) {
  var interaction = _ref.interaction,
      options = _ref.options;

  var startOffset = interaction.modifiers.startOffset;
  var offset = void 0;

  if (options) {
    var offsetRect = getRestrictionRect(options.offset, interaction, interaction.coords.start.page);

    offset = _rect2.default.rectToXY(offsetRect);
  }

  offset = offset || { x: 0, y: 0 };

  return {
    top: offset.y + startOffset.top,
    left: offset.x + startOffset.left,
    bottom: offset.y - startOffset.bottom,
    right: offset.x - startOffset.right
  };
}

function set(_ref2) {
  var modifiedCoords = _ref2.modifiedCoords,
      interaction = _ref2.interaction,
      status = _ref2.status,
      phase = _ref2.phase,
      offset = _ref2.offset,
      options = _ref2.options;

  var edges = interaction.prepared.linkedEdges || interaction.prepared.edges;

  if (!interaction.interacting() || !edges || phase === 'start') {
    return;
  }

  var page = (0, _extend2.default)({}, modifiedCoords);
  var inner = getRestrictionRect(options.inner, interaction, page) || {};
  var outer = getRestrictionRect(options.outer, interaction, page) || {};

  fixRect(inner, noInner);
  fixRect(outer, noOuter);

  var modifiedX = page.x;
  var modifiedY = page.y;

  status.delta.x = 0;
  status.delta.y = 0;
  status.locked = false;

  if (edges.top) {
    modifiedY = Math.min(Math.max(outer.top + offset.top, page.y), inner.top + offset.top);
  } else if (edges.bottom) {
    modifiedY = Math.max(Math.min(outer.bottom + offset.bottom, page.y), inner.bottom + offset.bottom);
  }
  if (edges.left) {
    modifiedX = Math.min(Math.max(outer.left + offset.left, page.x), inner.left + offset.left);
  } else if (edges.right) {
    modifiedX = Math.max(Math.min(outer.right + offset.right, page.x), inner.right + offset.right);
  }

  status.delta.x = modifiedX - page.x;
  status.delta.y = modifiedY - page.y;

  status.locked = !!(status.delta.x || status.delta.y);
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
  init: init,
  noInner: noInner,
  noOuter: noOuter,
  getRestrictionRect: getRestrictionRect,
  start: start,
  set: set,
  defaults: {
    enabled: false,
    endOnly: false,
    inner: null,
    outer: null,
    offset: null
  }
};

exports.default = restrictEdges;

},{"./restrict":27,"@interactjs/utils/extend":46,"@interactjs/utils/rect":57}],29:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extend = _dereq_('@interactjs/utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _rect = _dereq_('@interactjs/utils/rect');

var _rect2 = _interopRequireDefault(_rect);

var _restrictEdges = _dereq_('./restrictEdges');

var _restrictEdges2 = _interopRequireDefault(_restrictEdges);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var noMin = { width: -Infinity, height: -Infinity }; // This module adds the options.resize.restrictSize setting which sets min and
// max width and height for the target being resized.
//
// interact(target).resize({
//   edges: { top: true, left: true },
//   restrictSize: {
//     min: { width: -600, height: -600 },
//     max: { width:  600, height:  600 },
//   },
// });

var noMax = { width: +Infinity, height: +Infinity };

function init(scope) {
  var modifiers = scope.modifiers,
      defaults = scope.defaults;


  modifiers.restrictSize = restrictSize;
  modifiers.names.push('restrictSize');

  defaults.perAction.restrictSize = restrictSize.defaults;
}

function start(_ref) {
  var interaction = _ref.interaction;

  return _restrictEdges2.default.start({ interaction: interaction });
}

function set(arg) {
  var interaction = arg.interaction,
      options = arg.options,
      phase = arg.phase;

  var edges = interaction.prepared.linkedEdges || interaction.prepared.edges;

  if (!interaction.interacting() || !edges || phase === 'start') {
    return;
  }

  var rect = _rect2.default.xywhToTlbr(interaction.resizeRects.inverted);

  var minSize = _rect2.default.tlbrToXywh(_restrictEdges2.default.getRestrictionRect(options.min, interaction)) || noMin;
  var maxSize = _rect2.default.tlbrToXywh(_restrictEdges2.default.getRestrictionRect(options.max, interaction)) || noMax;

  arg.options = {
    enabled: options.enabled,
    endOnly: options.endOnly,
    inner: (0, _extend2.default)({}, _restrictEdges2.default.noInner),
    outer: (0, _extend2.default)({}, _restrictEdges2.default.noOuter)
  };

  if (edges.top) {
    arg.options.inner.top = rect.bottom - minSize.height;
    arg.options.outer.top = rect.bottom - maxSize.height;
  } else if (edges.bottom) {
    arg.options.inner.bottom = rect.top + minSize.height;
    arg.options.outer.bottom = rect.top + maxSize.height;
  }
  if (edges.left) {
    arg.options.inner.left = rect.right - minSize.width;
    arg.options.outer.left = rect.right - maxSize.width;
  } else if (edges.right) {
    arg.options.inner.right = rect.left + minSize.width;
    arg.options.outer.right = rect.left + maxSize.width;
  }

  _restrictEdges2.default.set(arg);
}

var restrictSize = {
  init: init,
  start: start,
  set: set,
  defaults: {
    enabled: false,
    endOnly: false,
    min: null,
    max: null
  }
};

exports.default = restrictSize;

},{"./restrictEdges":28,"@interactjs/utils/extend":46,"@interactjs/utils/rect":57}],30:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = _dereq_('@interactjs/utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  var modifiers = scope.modifiers,
      defaults = scope.defaults;


  modifiers.snap = snap;
  modifiers.names.push('snap');

  defaults.perAction.snap = snap.defaults;
}

function start(_ref) {
  var interaction = _ref.interaction,
      interactable = _ref.interactable,
      element = _ref.element,
      rect = _ref.rect,
      startOffset = _ref.startOffset,
      options = _ref.options;

  var offsets = [];
  var optionsOrigin = utils.rect.rectToXY(utils.rect.resolveRectLike(options.origin));
  var origin = optionsOrigin || utils.getOriginXY(interactable, element, interaction.prepared.name);
  options = options || interactable.options[interaction.prepared.name].snap || {};

  var snapOffset = void 0;

  if (options.offset === 'startCoords') {
    snapOffset = {
      x: interaction.coords.start.page.x - origin.x,
      y: interaction.coords.start.page.y - origin.y
    };
  } else {
    var offsetRect = utils.rect.resolveRectLike(options.offset, interactable, element, [interaction]);

    snapOffset = utils.rect.rectToXY(offsetRect) || { x: 0, y: 0 };
  }

  if (rect && options.relativePoints && options.relativePoints.length) {
    for (var _i = 0; _i < (options.relativePoints || []).length; _i++) {
      var _ref3;

      _ref3 = (options.relativePoints || [])[_i];
      var _ref2 = _ref3;
      var relativeX = _ref2.x;
      var relativeY = _ref2.y;

      offsets.push({
        x: startOffset.left - rect.width * relativeX + snapOffset.x,
        y: startOffset.top - rect.height * relativeY + snapOffset.y
      });
    }
  } else {
    offsets.push(snapOffset);
  }

  return offsets;
}

function set(_ref4) {
  var interaction = _ref4.interaction,
      modifiedCoords = _ref4.modifiedCoords,
      status = _ref4.status,
      phase = _ref4.phase,
      options = _ref4.options,
      offsets = _ref4.offset;

  var relativePoints = options && options.relativePoints;

  if (phase === 'start' && relativePoints && relativePoints.length) {
    return;
  }

  var origin = utils.getOriginXY(interaction.target, interaction.element, interaction.prepared.name);
  var page = utils.extend({}, modifiedCoords);
  var targets = [];
  var target = void 0;
  var i = void 0;

  page.x -= origin.x;
  page.y -= origin.y;

  status.realX = page.x;
  status.realY = page.y;

  var len = options.targets ? options.targets.length : 0;

  for (var _i2 = 0; _i2 < offsets.length; _i2++) {
    var _ref6;

    _ref6 = offsets[_i2];
    var _ref5 = _ref6;
    var offsetX = _ref5.x;
    var offsetY = _ref5.y;

    var relativeX = page.x - offsetX;
    var relativeY = page.y - offsetY;

    for (var _i3 = 0; _i3 < options.targets.length; _i3++) {
      var _ref7;

      _ref7 = options.targets[_i3];
      var snapTarget = _ref7;

      if (utils.is.func(snapTarget)) {
        target = snapTarget(relativeX, relativeY, interaction);
      } else {
        target = snapTarget;
      }

      if (!target) {
        continue;
      }

      targets.push({
        x: utils.is.number(target.x) ? target.x + offsetX : relativeX,
        y: utils.is.number(target.y) ? target.y + offsetY : relativeY,

        range: utils.is.number(target.range) ? target.range : options.range
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
    var distance = utils.hypot(dx, dy);
    var inRange = distance <= range;

    // Infinite targets count as being out of range
    // compared to non infinite ones that are in range
    if (range === Infinity && closest.inRange && closest.range !== Infinity) {
      inRange = false;
    }

    if (!closest.target || (inRange
    // is the closest target in range?
    ? closest.inRange && range !== Infinity
    // the pointer is relatively deeper in this target
    ? distance / range < closest.distance / closest.range
    // this target has Infinite range and the closest doesn't
    : range === Infinity && closest.range !== Infinity ||
    // OR this target is closer that the previous closest
    distance < closest.distance :
    // The other is not in range and the pointer is closer to this target
    !closest.inRange && distance < closest.distance)) {

      closest.target = target;
      closest.distance = distance;
      closest.range = range;
      closest.inRange = inRange;
      closest.dx = dx;
      closest.dy = dy;

      status.range = range;
    }
  }

  status.modifiedX = closest.target.x;
  status.modifiedY = closest.target.y;

  status.delta.x = closest.dx;
  status.delta.y = closest.dy;

  status.locked = closest.inRange;
}

var snap = {
  init: init,
  start: start,
  set: set,
  defaults: {
    enabled: false,
    endOnly: false,
    range: Infinity,
    targets: null,
    offsets: null,

    relativePoints: null
  }
};

exports.default = snap;

},{"@interactjs/utils":49}],31:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _clone = _dereq_('@interactjs/utils/clone');

var _clone2 = _interopRequireDefault(_clone);

var _extend = _dereq_('@interactjs/utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _snapSize = _dereq_('./snapSize');

var _snapSize2 = _interopRequireDefault(_snapSize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  var modifiers = scope.modifiers,
      defaults = scope.defaults;


  modifiers.snapEdges = snapEdges;
  modifiers.names.push('snapEdges');

  defaults.perAction.snapEdges = snapEdges.defaults;
} /**
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

function start(arg) {
  var edges = arg.interaction.prepared.edges;

  if (!edges) {
    return null;
  }

  arg.status.targetFields = arg.status.targetFields || [[edges.left ? 'left' : 'right', edges.top ? 'top' : 'bottom']];

  return _snapSize2.default.start(arg);
}

function set(arg) {
  return _snapSize2.default.set(arg);
}

function modifyCoords(arg) {
  _snapSize2.default.modifyCoords(arg);
}

var snapEdges = {
  init: init,
  start: start,
  set: set,
  modifyCoords: modifyCoords,
  defaults: (0, _extend2.default)((0, _clone2.default)(_snapSize2.default.defaults), {
    offset: { x: 0, y: 0 }
  })
};

exports.default = snapEdges;

},{"./snapSize":32,"@interactjs/utils/clone":42,"@interactjs/utils/extend":46}],32:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extend = _dereq_('@interactjs/utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _is = _dereq_('@interactjs/utils/is');

var is = _interopRequireWildcard(_is);

var _snap = _dereq_('./snap');

var _snap2 = _interopRequireDefault(_snap);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  var modifiers = scope.modifiers,
      defaults = scope.defaults;


  modifiers.snapSize = snapSize;
  modifiers.names.push('snapSize');

  defaults.perAction.snapSize = snapSize.defaults;
} // This module allows snapping of the size of targets during resize
// interactions.

function start(arg) {
  var interaction = arg.interaction,
      status = arg.status,
      options = arg.options;

  var edges = interaction.prepared.edges;

  if (!edges) {
    return null;
  }

  arg.options = {
    relativePoints: [{
      x: edges.left ? 0 : 1,
      y: edges.top ? 0 : 1
    }],
    origin: { x: 0, y: 0 },
    offset: options.offset || 'self',
    range: options.range
  };

  status.targetFields = status.targetFields || [['width', 'height'], ['x', 'y']];

  var offsets = _snap2.default.start(arg);
  arg.options = options;

  return offsets;
}

function set(arg) {
  var interaction = arg.interaction,
      status = arg.status,
      options = arg.options,
      offset = arg.offset,
      modifiedCoords = arg.modifiedCoords;

  var relative = {
    x: modifiedCoords.x - offset[0].x,
    y: modifiedCoords.y - offset[0].y
  };

  arg.options = (0, _extend2.default)({}, options);
  arg.options.targets = [];

  for (var _i = 0; _i < (options.targets || []).length; _i++) {
    var _ref;

    _ref = (options.targets || [])[_i];
    var snapTarget = _ref;

    var target = void 0;

    if (is.func(snapTarget)) {
      target = snapTarget(relative.x, relative.y, interaction);
    } else {
      target = snapTarget;
    }

    if (!target) {
      continue;
    }

    for (var _i2 = 0; _i2 < status.targetFields.length; _i2++) {
      var _ref3;

      _ref3 = status.targetFields[_i2];
      var _ref2 = _ref3;
      var xField = _ref2[0];
      var yField = _ref2[1];

      if (xField in target || yField in target) {
        target.x = target[xField];
        target.y = target[yField];

        break;
      }
    }

    arg.options.targets.push(target);
  }

  _snap2.default.set(arg);
}

var snapSize = {
  init: init,
  start: start,
  set: set,
  defaults: {
    enabled: false,
    endOnly: false,
    range: Infinity,
    targets: null,
    offset: null,
    offsets: null
  }
};

exports.default = snapSize;

},{"./snap":30,"@interactjs/utils/extend":46,"@interactjs/utils/is":51}],33:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _pointerUtils = _dereq_('@interactjs/utils/pointerUtils');

var _pointerUtils2 = _interopRequireDefault(_pointerUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PointerEvent = function () {
  /** */
  function PointerEvent(type, pointer, event, eventTarget, interaction) {
    _classCallCheck(this, PointerEvent);

    _pointerUtils2.default.pointerExtend(this, event);

    if (event !== pointer) {
      _pointerUtils2.default.pointerExtend(this, pointer);
    }

    this.interaction = interaction;

    this.timeStamp = new Date().getTime();
    this.originalEvent = event;
    this.type = type;
    this.pointerId = _pointerUtils2.default.getPointerId(pointer);
    this.pointerType = _pointerUtils2.default.getPointerType(pointer);
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

  PointerEvent.prototype.subtractOrigin = function subtractOrigin(_ref) {
    var originX = _ref.x,
        originY = _ref.y;

    this.pageX -= originX;
    this.pageY -= originY;
    this.clientX -= originX;
    this.clientY -= originY;

    return this;
  };

  PointerEvent.prototype.addOrigin = function addOrigin(_ref2) {
    var originX = _ref2.x,
        originY = _ref2.y;

    this.pageX += originX;
    this.pageY += originY;
    this.clientX += originX;
    this.clientY += originY;

    return this;
  };

  /** */


  PointerEvent.prototype.preventDefault = function preventDefault() {
    this.originalEvent.preventDefault();
  };

  /** */


  PointerEvent.prototype.stopPropagation = function stopPropagation() {
    this.propagationStopped = true;
  };

  /** */


  PointerEvent.prototype.stopImmediatePropagation = function stopImmediatePropagation() {
    this.immediatePropagationStopped = this.propagationStopped = true;
  };

  return PointerEvent;
}();

exports.default = PointerEvent;

},{"@interactjs/utils/pointerUtils":55}],34:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = _dereq_('@interactjs/utils');

var utils = _interopRequireWildcard(_utils);

var _PointerEvent = _dereq_('./PointerEvent');

var _PointerEvent2 = _interopRequireDefault(_PointerEvent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var signals = new utils.Signals();
var simpleSignals = ['down', 'up', 'cancel'];
var simpleEvents = ['down', 'up', 'cancel'];

var pointerEvents = {
  init: init,
  signals: signals,
  PointerEvent: _PointerEvent2.default,
  fire: fire,
  collectEventTargets: collectEventTargets,
  createSignalListener: createSignalListener,
  defaults: {
    holdDuration: 600,
    ignoreFrom: null,
    allowFrom: null,
    origin: { x: 0, y: 0 }
  },
  types: ['down', 'move', 'up', 'cancel', 'tap', 'doubletap', 'hold']
};

function fire(arg) {
  var interaction = arg.interaction,
      pointer = arg.pointer,
      event = arg.event,
      eventTarget = arg.eventTarget,
      _arg$type = arg.type,
      type = _arg$type === undefined ? arg.pointerEvent.type : _arg$type,
      _arg$targets = arg.targets,
      targets = _arg$targets === undefined ? collectEventTargets(arg) : _arg$targets,
      _arg$pointerEvent = arg.pointerEvent,
      pointerEvent = _arg$pointerEvent === undefined ? new _PointerEvent2.default(type, pointer, event, eventTarget, interaction) : _arg$pointerEvent;


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

    var origin = utils.getOriginXY(target.eventable, target.element);

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
      interaction: interaction, pointer: pointer, event: event, eventTarget: eventTarget,
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
  var pointerInfo = interaction.pointers[pointerIndex];

  // do not fire a tap event if the pointer was moved before being lifted
  if (type === 'tap' && (interaction.pointerWasMoved
  // or if the pointerup target is different to the pointerdown target
  || !(pointerInfo && pointerInfo.downTarget === eventTarget))) {
    return [];
  }

  var path = utils.dom.getPath(eventTarget);
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
      return target.eventable.options.holdDuration === interaction.holdTimers[pointerIndex].duration;
    });
  }

  return signalArg.targets;
}

function init(scope) {
  var interactions = scope.interactions;


  scope.pointerEvents = pointerEvents;
  scope.defaults.pointerEvents = pointerEvents.defaults;

  interactions.signals.on('new', function (interaction) {
    interaction.prevTap = null; // the most recent tap event on this interaction
    interaction.tapTime = 0; // time of the most recent tap event
    interaction.holdTimers = []; // [{ duration, timeout }]
  });

  interactions.signals.on('update-pointer', function (_ref3) {
    var interaction = _ref3.interaction,
        down = _ref3.down,
        pointerIndex = _ref3.pointerIndex;

    if (!down) {
      return;
    }

    interaction.holdTimers[pointerIndex] = { duration: Infinity, timeout: null };
  });

  interactions.signals.on('remove-pointer', function (_ref4) {
    var interaction = _ref4.interaction,
        pointerIndex = _ref4.pointerIndex;

    interaction.holdTimers.splice(pointerIndex, 1);
  });

  interactions.signals.on('move', function (_ref5) {
    var interaction = _ref5.interaction,
        pointer = _ref5.pointer,
        event = _ref5.event,
        eventTarget = _ref5.eventTarget,
        duplicateMove = _ref5.duplicateMove;

    var pointerIndex = interaction.getPointerIndex(pointer);

    if (!duplicateMove && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
      if (interaction.pointerIsDown) {
        clearTimeout(interaction.holdTimers[pointerIndex].timeout);
      }

      fire({
        interaction: interaction, pointer: pointer, event: event, eventTarget: eventTarget,
        type: 'move'
      });
    }
  });

  interactions.signals.on('down', function (_ref6) {
    var interaction = _ref6.interaction,
        pointer = _ref6.pointer,
        event = _ref6.event,
        eventTarget = _ref6.eventTarget,
        pointerIndex = _ref6.pointerIndex;

    var timer = interaction.holdTimers[pointerIndex];
    var path = utils.dom.getPath(eventTarget);
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
      var _ref7;

      _ref7 = path[_i2];
      var element = _ref7;

      signalArg.element = element;

      signals.fire('collect-targets', signalArg);
    }

    if (!signalArg.targets.length) {
      return;
    }

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
      });
    }, minDuration);
  });

  interactions.signals.on('up', function (_ref9) {
    var interaction = _ref9.interaction,
        pointer = _ref9.pointer,
        event = _ref9.event,
        eventTarget = _ref9.eventTarget;

    if (!interaction.pointerWasMoved) {
      fire({ interaction: interaction, eventTarget: eventTarget, pointer: pointer, event: event, type: 'tap' });
    }
  });

  var _arr = ['up', 'cancel'];
  for (var _i4 = 0; _i4 < _arr.length; _i4++) {
    var signalName = _arr[_i4];
    interactions.signals.on(signalName, function (_ref10) {
      var interaction = _ref10.interaction,
          pointerIndex = _ref10.pointerIndex;

      if (interaction.holdTimers[pointerIndex]) {
        clearTimeout(interaction.holdTimers[pointerIndex].timeout);
      }
    });
  }

  for (var i = 0; i < simpleSignals.length; i++) {
    interactions.signals.on(simpleSignals[i], createSignalListener(simpleEvents[i]));
  }
}

function createSignalListener(type) {
  return function (_ref11) {
    var interaction = _ref11.interaction,
        pointer = _ref11.pointer,
        event = _ref11.event,
        eventTarget = _ref11.eventTarget;

    fire({ interaction: interaction, eventTarget: eventTarget, pointer: pointer, event: event, type: type });
  };
}

exports.default = pointerEvents;

},{"./PointerEvent":33,"@interactjs/utils":49}],35:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function init(scope) {
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
  }

  // don't repeat by default
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
  }

  // get the repeat interval from the first eventable
  var interval = targets[0].eventable.options.holdRepeatInterval;

  // don't repeat if the interval is 0 or less
  if (interval <= 0) {
    return;
  }

  // set a timeout to fire the holdrepeat event
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

exports.default = {
  init: init
};

},{}],36:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = exports.interactableTargets = exports.holdRepeat = exports.pointerEvents = undefined;

var _base = _dereq_('./base');

var _base2 = _interopRequireDefault(_base);

var _holdRepeat = _dereq_('./holdRepeat');

var _holdRepeat2 = _interopRequireDefault(_holdRepeat);

var _interactableTargets = _dereq_('./interactableTargets');

var _interactableTargets2 = _interopRequireDefault(_interactableTargets);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  _base2.default.init(scope);
  _holdRepeat2.default.init(scope);
  _interactableTargets2.default.init(scope);
}

exports.pointerEvents = _base2.default;
exports.holdRepeat = _holdRepeat2.default;
exports.interactableTargets = _interactableTargets2.default;
exports.init = init;

},{"./base":34,"./holdRepeat":35,"./interactableTargets":37}],37:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _is = _dereq_('@interactjs/utils/is');

var is = _interopRequireWildcard(_is);

var _extend = _dereq_('@interactjs/utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _arr = _dereq_('@interactjs/utils/arr');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
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

      if (eventable.types[type] && eventable.types[type].length && is.element(element) && interactable.testIgnoreAllow(options, element, eventTarget)) {

        targets.push({
          element: element,
          eventable: eventable,
          props: { interactable: interactable }
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

    (0, _extend2.default)(interactable.events.options, pointerEvents.defaults);
    (0, _extend2.default)(interactable.events.options, options);
  });

  (0, _arr.merge)(actions.eventTypes, pointerEvents.types);

  Interactable.prototype.pointerEvents = function (options) {
    (0, _extend2.default)(this.events.options, options);

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

exports.default = {
  init: init
};

},{"@interactjs/utils/arr":40,"@interactjs/utils/extend":46,"@interactjs/utils/is":51}],38:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = init;

var _interactions = _dereq_('@interactjs/core/interactions');

var _utils = _dereq_('@interactjs/utils');

function init(scope) {
  var actions = scope.actions,
      interactions = scope.interactions,
      Interactable = scope.Interactable;

  // add action reflow event types

  for (var _i = 0; _i < actions.names.length; _i++) {
    var _ref;

    _ref = actions.names[_i];
    var actionName = _ref;

    actions.eventTypes.push(actionName + 'reflow');
  }

  // remove completed reflow interactions
  interactions.signals.on('stop', function (_ref2) {
    var interaction = _ref2.interaction;

    if (interaction.pointerType === 'reflow') {
      interaction._reflowResolve();
      _utils.arr.remove(scope.interactions.list, interaction);
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
  var elements = _utils.is.string(interactable.target) ? _utils.arr.from(interactable._context.querySelectorAll(interactable.target)) : [interactable.target];

  var Promise = _utils.win.window.Promise;
  var promises = Promise ? [] : null;

  var _loop = function _loop(element) {
    var rect = interactable.getRect(element);

    if (!rect) {
      return 'break';
    }

    var runningInteraction = _utils.arr.find(scope.interactions.list, function (interaction) {
      return interaction.interacting() && interaction.target === interactable && interaction.element === element && interaction.prepared.name === action.name;
    });
    var reflowPromise = void 0;

    if (runningInteraction) {
      runningInteraction.move();

      reflowPromise = runningInteraction._reflowPromise || new Promise(function (resolve) {
        runningInteraction._reflowResolve = resolve;
      });
    } else {
      var xywh = _utils.rect.tlbrToXywh(rect);
      var coords = {
        page: { x: xywh.x, y: xywh.y },
        client: { x: xywh.x, y: xywh.y },
        timeStamp: Date.now()
      };

      var event = _utils.pointer.coordsToEvent(coords);
      reflowPromise = startReflow(scope, interactable, element, action, event);
    }

    if (promises) {
      promises.push(reflowPromise);
    }
  };

  for (var _i2 = 0; _i2 < elements.length; _i2++) {
    var _ref3;

    _ref3 = elements[_i2];
    var element = _ref3;

    var _ret = _loop(element);

    if (_ret === 'break') break;
  }

  return promises && Promise.all(promises).then(function () {
    return interactable;
  });
}

function startReflow(scope, interactable, element, action, event) {
  var interaction = (0, _interactions.newInteraction)({ pointerType: 'reflow' }, scope);
  var signalArg = {
    interaction: interaction,
    event: event,
    pointer: event,
    eventTarget: element,
    phase: 'reflow'
  };

  interaction.target = interactable;
  interaction.element = element;
  interaction.prepared = (0, _utils.extend)({}, action);
  interaction.prevEvent = event;
  interaction.updatePointer(event, event, element, true);

  interaction._doPhase(signalArg);

  var reflowPromise = _utils.win.window.Promise ? new _utils.win.window.Promise(function (resolve) {
    interaction._reflowResolve = resolve;
  }) : null;

  signalArg.phase = 'start';
  interaction._reflowPromise = reflowPromise;
  interaction._interacting = interaction._doPhase(signalArg);

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

exports.default = { init: init };

},{"@interactjs/core/interactions":20,"@interactjs/utils":49}],39:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Signals = function () {
  function Signals() {
    _classCallCheck(this, Signals);

    this.listeners = {
      // signalName: [listeners],
    };
  }

  Signals.prototype.on = function on(name, listener) {
    if (!this.listeners[name]) {
      this.listeners[name] = [listener];
      return;
    }

    this.listeners[name].push(listener);
  };

  Signals.prototype.off = function off(name, listener) {
    if (!this.listeners[name]) {
      return;
    }

    var index = this.listeners[name].indexOf(listener);

    if (index !== -1) {
      this.listeners[name].splice(index, 1);
    }
  };

  Signals.prototype.fire = function fire(name, arg) {
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
  };

  return Signals;
}();

exports.default = Signals;

},{}],40:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.contains = contains;
exports.remove = remove;
exports.merge = merge;
exports.from = from;
exports.findIndex = findIndex;
exports.find = find;
exports.some = some;
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

},{}],41:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _window = _dereq_('./window');

var _window2 = _interopRequireDefault(_window);

var _is = _dereq_('./is');

var is = _interopRequireWildcard(_is);

var _domObjects = _dereq_('./domObjects');

var _domObjects2 = _interopRequireDefault(_domObjects);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var browser = {
  init: init
};

exports.default = browser;


function init(window) {
  var Element = _domObjects2.default.Element;
  var navigator = _window2.default.window.navigator;

  // Does the browser support touch input?
  browser.supportsTouch = !!('ontouchstart' in window || is.func(window.DocumentTouch) && _domObjects2.default.document instanceof window.DocumentTouch);

  // Does the browser support PointerEvents
  browser.supportsPointerEvent = !!_domObjects2.default.PointerEvent;

  browser.isIOS = /iP(hone|od|ad)/.test(navigator.platform);

  // scrolling doesn't change the result of getClientRects on iOS 7
  browser.isIOS7 = /iP(hone|od|ad)/.test(navigator.platform) && /OS 7[^\d]/.test(navigator.appVersion);

  browser.isIe9 = /MSIE 9/.test(navigator.userAgent);

  // prefix matchesSelector
  browser.prefixedMatchesSelector = 'matches' in Element.prototype ? 'matches' : 'webkitMatchesSelector' in Element.prototype ? 'webkitMatchesSelector' : 'mozMatchesSelector' in Element.prototype ? 'mozMatchesSelector' : 'oMatchesSelector' in Element.prototype ? 'oMatchesSelector' : 'msMatchesSelector';

  browser.pEventTypes = _domObjects2.default.PointerEvent ? _domObjects2.default.PointerEvent === window.MSPointerEvent ? {
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
  } : null;

  // because Webkit and Opera still use 'mousewheel' event type
  browser.wheelEvent = 'onmousewheel' in _domObjects2.default.document ? 'mousewheel' : 'wheel';

  // Opera Mobile must be handled differently
  browser.isOperaMobile = navigator.appName === 'Opera' && browser.supportsTouch && navigator.userAgent.match('Presto');
}

},{"./domObjects":43,"./is":51,"./window":60}],42:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = clone;

var _is = _dereq_('./is');

var is = _interopRequireWildcard(_is);

var _arr = _dereq_('./arr');

var arr = _interopRequireWildcard(_arr);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function clone(source) {
  var dest = {};

  for (var prop in source) {
    var value = source[prop];

    if (is.plainObject(value)) {
      dest[prop] = clone(value);
    } else if (is.array(value)) {
      dest[prop] = arr.from(value);
    } else {
      dest[prop] = value;
    }
  }

  return dest;
}

},{"./arr":40,"./is":51}],43:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var domObjects = {
  init: init
};

function blank() {}

exports.default = domObjects;


function init(window) {
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

},{}],44:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.nodeContains = nodeContains;
exports.closest = closest;
exports.parentNode = parentNode;
exports.matchesSelector = matchesSelector;
exports.indexOfDeepestElement = indexOfDeepestElement;
exports.matchesUpTo = matchesUpTo;
exports.getActualElement = getActualElement;
exports.getScrollXY = getScrollXY;
exports.getElementClientRect = getElementClientRect;
exports.getElementRect = getElementRect;
exports.getPath = getPath;
exports.trySelector = trySelector;

var _window = _dereq_('./window');

var _window2 = _interopRequireDefault(_window);

var _browser = _dereq_('./browser');

var _browser2 = _interopRequireDefault(_browser);

var _is = _dereq_('./is');

var is = _interopRequireWildcard(_is);

var _domObjects = _dereq_('./domObjects');

var _domObjects2 = _interopRequireDefault(_domObjects);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
  while (is.element(element)) {
    if (matchesSelector(element, selector)) {
      return element;
    }

    element = parentNode(element);
  }

  return null;
}

function parentNode(node) {
  var parent = node.parentNode;

  if (is.docFrag(parent)) {
    // skip past #shado-root fragments
    while ((parent = parent.host) && is.docFrag(parent)) {
      continue;
    }

    return parent;
  }

  return parent;
}

function matchesSelector(element, selector) {
  // remove /deep/ from selectors if shadowDOM polyfill is used
  if (_window2.default.window !== _window2.default.realWindow) {
    selector = selector.replace(/\/deep\//g, ' ');
  }

  return element[_browser2.default.prefixedMatchesSelector](selector);
}

// Test for the element that's "above" all other qualifiers
function indexOfDeepestElement(elements) {
  var deepestZoneParents = [];
  var dropzoneParents = [];
  var dropzone = void 0;
  var deepestZone = elements[0];
  var index = deepestZone ? 0 : -1;
  var parent = void 0;
  var child = void 0;
  var i = void 0;
  var n = void 0;

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
    if (deepestZone instanceof _domObjects2.default.HTMLElement && dropzone instanceof _domObjects2.default.SVGElement && !(dropzone instanceof _domObjects2.default.SVGSVGElement)) {

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

    n = 0;

    // get (position of last common ancestor) + 1
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
  while (is.element(element)) {
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
  return element instanceof _domObjects2.default.SVGElementInstance ? element.correspondingUseElement : element;
}

function getScrollXY(relevantWindow) {
  relevantWindow = relevantWindow || _window2.default.window;
  return {
    x: relevantWindow.scrollX || relevantWindow.document.documentElement.scrollLeft,
    y: relevantWindow.scrollY || relevantWindow.document.documentElement.scrollTop
  };
}

function getElementClientRect(element) {
  var clientRect = element instanceof _domObjects2.default.SVGElement ? element.getBoundingClientRect() : element.getClientRects()[0];

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

  if (!_browser2.default.isIOS7 && clientRect) {
    var scroll = getScrollXY(_window2.default.getWindow(element));

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
  if (!is.string(value)) {
    return false;
  }

  // an exception will be raised if it is invalid
  _domObjects2.default.document.querySelector(value);
  return true;
}

},{"./browser":41,"./domObjects":43,"./is":51,"./window":60}],45:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _is = _dereq_('./is');

var is = _interopRequireWildcard(_is);

var _domUtils = _dereq_('./domUtils');

var domUtils = _interopRequireWildcard(_domUtils);

var _pointerUtils = _dereq_('./pointerUtils');

var _pointerUtils2 = _interopRequireDefault(_pointerUtils);

var _pointerExtend = _dereq_('./pointerExtend');

var _pointerExtend2 = _interopRequireDefault(_pointerExtend);

var _arr = _dereq_('./arr');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var elements = [];
var targets = [];

// {
//   type: {
//     selectors: ['selector', ...],
//     contexts : [document, ...],
//     listeners: [[listener, capture, passive], ...]
//   }
//  }
var delegatedEvents = {};
var documents = [];

var supportsOptions = void 0;

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

  if (!(0, _arr.contains)(target.events[type], listener)) {
    element.addEventListener(type, listener, supportsOptions ? options : !!options.capture);
    target.events[type].push(listener);
  }
}

function remove(element, type, listener, optionalArg) {
  var options = getOptions(optionalArg);
  var elementIndex = elements.indexOf(element);
  var target = targets[elementIndex];

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
    var len = target.events[type].length;

    if (listener === 'all') {
      for (var i = 0; i < len; i++) {
        remove(element, type, target.events[type][i], options);
      }
      return;
    } else {
      for (var _i = 0; _i < len; _i++) {
        if (target.events[type][_i] === listener) {
          element.removeEventListener(type, listener, supportsOptions ? options : !!options.capture);
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
    };

    // add delegate listener functions
    for (var _i2 = 0; _i2 < documents.length; _i2++) {
      var doc = documents[_i2];
      add(doc, type, delegateListener);
      add(doc, type, delegateUseCapture, true);
    }
  }

  var delegated = delegatedEvents[type];
  var index = void 0;

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
  }

  // keep listener and capture and passive flags
  delegated.listeners[index].push([listener, !!options.capture, options.passive]);
}

function removeDelegate(selector, context, type, listener, optionalArg) {
  var options = getOptions(optionalArg);
  var delegated = delegatedEvents[type];
  var matchFound = false;
  var index = void 0;

  if (!delegated) {
    return;
  }

  // count from last index of delegated to 0
  for (index = delegated.selectors.length - 1; index >= 0; index--) {
    // look for matching selector and context Node
    if (delegated.selectors[index] === selector && delegated.contexts[index] === context) {

      var listeners = delegated.listeners[index];

      // each item of the listeners array is an array: [function, capture, passive]
      for (var i = listeners.length - 1; i >= 0; i--) {
        var _listeners$i = listeners[i],
            fn = _listeners$i[0],
            capture = _listeners$i[1],
            passive = _listeners$i[2];

        // check if the listener functions and capture and passive flags match

        if (fn === listener && capture === !!options.capture && passive === options.passive) {
          // remove the listener from the array of listeners
          listeners.splice(i, 1);

          // if all listeners for this interactable have been removed
          // remove the interactable from the delegated arrays
          if (!listeners.length) {
            delegated.selectors.splice(index, 1);
            delegated.contexts.splice(index, 1);
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

      if (matchFound) {
        break;
      }
    }
  }
}

// bound to the interactable context when a DOM event
// listener is added to a selector interactable
function delegateListener(event, optionalArg) {
  var options = getOptions(optionalArg);
  var fakeEvent = {};
  var delegated = delegatedEvents[event.type];

  var _pointerUtils$getEven = _pointerUtils2.default.getEventTargets(event),
      eventTarget = _pointerUtils$getEven[0];

  var element = eventTarget;

  // duplicate the event so that currentTarget can be changed
  (0, _pointerExtend2.default)(fakeEvent, event);

  fakeEvent.originalEvent = event;
  fakeEvent.preventDefault = preventOriginalDefault;

  // climb up document tree looking for selector matches
  while (is.element(element)) {
    for (var i = 0; i < delegated.selectors.length; i++) {
      var selector = delegated.selectors[i];
      var context = delegated.contexts[i];

      if (domUtils.matchesSelector(element, selector) && domUtils.nodeContains(context, eventTarget) && domUtils.nodeContains(context, element)) {

        var listeners = delegated.listeners[i];

        fakeEvent.currentTarget = element;

        for (var j = 0; j < listeners.length; j++) {
          var _listeners$j = listeners[j],
              fn = _listeners$j[0],
              capture = _listeners$j[1],
              passive = _listeners$j[2];


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

function preventOriginalDefault() {
  this.originalEvent.preventDefault();
}

function getOptions(param) {
  return is.object(param) ? param : { capture: param };
}

exports.default = {
  add: add,
  remove: remove,

  addDelegate: addDelegate,
  removeDelegate: removeDelegate,

  delegateListener: delegateListener,
  delegateUseCapture: delegateUseCapture,
  delegatedEvents: delegatedEvents,
  documents: documents,

  supportsOptions: supportsOptions,

  _elements: elements,
  _targets: targets,

  init: function init(window) {
    supportsOptions = false;

    window.document.createElement('div').addEventListener('test', null, {
      get capture() {
        supportsOptions = true;
      }
    });
  }
};

},{"./arr":40,"./domUtils":44,"./is":51,"./pointerExtend":54,"./pointerUtils":55}],46:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extend;
function extend(dest, source) {
  for (var prop in source) {
    dest[prop] = source[prop];
  }
  return dest;
}

},{}],47:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (target, element, action) {
  var actionOptions = target.options[action];
  var actionOrigin = actionOptions && actionOptions.origin;
  var origin = actionOrigin || target.options.origin;

  var originRect = (0, _rect.resolveRectLike)(origin, target, element, [target && element]);

  return (0, _rect.rectToXY)(originRect) || { x: 0, y: 0 };
};

var _rect = _dereq_('./rect');

},{"./rect":57}],48:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (x, y) {
  return Math.sqrt(x * x + y * y);
};

},{}],49:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.normaizeListeners = exports.hypot = exports.events = exports.rect = exports.pointer = exports.getOriginXY = exports.clone = exports.extend = exports.raf = exports.Signals = exports.browser = exports.is = exports.dom = exports.arr = exports.win = undefined;
exports.warnOnce = warnOnce;
exports._getQBezierValue = _getQBezierValue;
exports.getQuadraticCurvePoint = getQuadraticCurvePoint;
exports.easeOutQuad = easeOutQuad;
exports.copyAction = copyAction;

var _browser = _dereq_('./browser');

Object.defineProperty(exports, 'browser', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_browser).default;
  }
});

var _Signals = _dereq_('./Signals');

Object.defineProperty(exports, 'Signals', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_Signals).default;
  }
});

var _raf = _dereq_('./raf');

Object.defineProperty(exports, 'raf', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_raf).default;
  }
});

var _extend = _dereq_('./extend');

Object.defineProperty(exports, 'extend', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_extend).default;
  }
});

var _clone = _dereq_('./clone');

Object.defineProperty(exports, 'clone', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_clone).default;
  }
});

var _getOriginXY = _dereq_('./getOriginXY');

Object.defineProperty(exports, 'getOriginXY', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_getOriginXY).default;
  }
});

var _pointerUtils = _dereq_('./pointerUtils');

Object.defineProperty(exports, 'pointer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_pointerUtils).default;
  }
});

var _rect = _dereq_('./rect');

Object.defineProperty(exports, 'rect', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_rect).default;
  }
});

var _events = _dereq_('./events');

Object.defineProperty(exports, 'events', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_events).default;
  }
});

var _hypot = _dereq_('./hypot');

Object.defineProperty(exports, 'hypot', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hypot).default;
  }
});

var _normalizeListeners = _dereq_('./normalizeListeners');

Object.defineProperty(exports, 'normaizeListeners', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_normalizeListeners).default;
  }
});

var _window = _dereq_('./window');

var _window2 = _interopRequireDefault(_window);

var _arr = _dereq_('./arr');

var arr = _interopRequireWildcard(_arr);

var _domUtils = _dereq_('./domUtils');

var dom = _interopRequireWildcard(_domUtils);

var _is = _dereq_('./is');

var is = _interopRequireWildcard(_is);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function warnOnce(method, message) {
  var warned = false;

  return function () {
    if (!warned) {
      _window2.default.window.console.warn(message);
      warned = true;
    }

    return method.apply(this, arguments);
  };
}

// http://stackoverflow.com/a/5634528/2280888
function _getQBezierValue(t, p1, p2, p3) {
  var iT = 1 - t;
  return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
}

function getQuadraticCurvePoint(startX, startY, cpX, cpY, endX, endY, position) {
  return {
    x: _getQBezierValue(position, startX, cpX, endX),
    y: _getQBezierValue(position, startY, cpY, endY)
  };
}

// http://gizma.com/easing/
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

exports.win = _window2.default;
exports.arr = arr;
exports.dom = dom;
exports.is = is;

},{"./Signals":39,"./arr":40,"./browser":41,"./clone":42,"./domUtils":44,"./events":45,"./extend":46,"./getOriginXY":47,"./hypot":48,"./is":51,"./normalizeListeners":53,"./pointerUtils":55,"./raf":56,"./rect":57,"./window":60}],50:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = _dereq_('./index');

var utils = _interopRequireWildcard(_index);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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
          element = utils.dom.parentNode(element);
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

    var firstNonActive = void 0;

    for (var _i3 = 0; _i3 < scope.interactions.list.length; _i3++) {
      var _ref5;

      _ref5 = scope.interactions.list[_i3];
      var interaction = _ref5;

      if (interaction.pointerType === pointerType) {
        // if it's a down event, skip interactions with running simulations
        if (interaction.simulation && !hasPointerId(interaction, pointerId)) {
          continue;
        }

        // if the interaction is active, return it immediately
        if (interaction.interacting()) {
          return interaction;
        }
        // otherwise save it and look for another active interaction
        else if (!firstNonActive) {
            firstNonActive = interaction;
          }
      }
    }

    // if no active mouse interaction was found use the first inactive mouse
    // interaction
    if (firstNonActive) {
      return firstNonActive;
    }

    // find any mouse or pen interaction.
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
        var target = interaction.target;
        // don't add this pointer if there is a target interactable and it
        // isn't gesturable
        if (target && !target.options.gesture.enabled) {
          continue;
        }
      }
      // maximum of 2 pointers per interaction
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
  return utils.arr.some(interaction.pointers, function (_ref11) {
    var id = _ref11.id;
    return id === pointerId;
  });
}

exports.default = finder;

},{"./index":49}],51:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.array = exports.plainObject = exports.element = exports.string = exports.bool = exports.number = exports.func = exports.object = exports.docFrag = exports.window = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _window2 = _dereq_('./window');

var _window3 = _interopRequireDefault(_window2);

var _isWindow = _dereq_('./isWindow');

var _isWindow2 = _interopRequireDefault(_isWindow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var window = exports.window = function window(thing) {
  return thing === _window3.default.window || (0, _isWindow2.default)(thing);
};

var docFrag = exports.docFrag = function docFrag(thing) {
  return object(thing) && thing.nodeType === 11;
};

var object = exports.object = function object(thing) {
  return !!thing && (typeof thing === 'undefined' ? 'undefined' : _typeof(thing)) === 'object';
};

var func = exports.func = function func(thing) {
  return typeof thing === 'function';
};

var number = exports.number = function number(thing) {
  return typeof thing === 'number';
};

var bool = exports.bool = function bool(thing) {
  return typeof thing === 'boolean';
};

var string = exports.string = function string(thing) {
  return typeof thing === 'string';
};

var element = exports.element = function element(thing) {
  if (!thing || (typeof thing === 'undefined' ? 'undefined' : _typeof(thing)) !== 'object') {
    return false;
  }

  var _window = _window3.default.getWindow(thing) || _window3.default.window;

  return (/object|function/.test(_typeof(_window.Element)) ? thing instanceof _window.Element //DOM2
    : thing.nodeType === 1 && typeof thing.nodeName === 'string'
  );
};

var plainObject = exports.plainObject = function plainObject(thing) {
  return object(thing) && !!thing.constructor && thing.constructor.name === 'Object';
};

var array = exports.array = function array(thing) {
  return object(thing) && typeof thing.length !== 'undefined' && func(thing.splice);
};

},{"./isWindow":52,"./window":60}],52:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (thing) {
  return !!(thing && thing.Window) && thing instanceof thing.Window;
};

},{}],53:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = normalize;

var _is = _dereq_('./is');

var is = _interopRequireWildcard(_is);

var _extend = _dereq_('./extend');

var _extend2 = _interopRequireDefault(_extend);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function normalize(type, listener, result) {
  result = result || {};

  if (is.string(type) && type.search(' ') !== -1) {
    type = type.trim().split(/ +/);
  }

  if (is.array(type)) {
    return type.reduce(function (acc, t) {
      return (0, _extend2.default)(acc, normalize(t, listener, result));
    }, {});
  }

  // ({ type: fn }) -> ('', { type: fn })
  if (is.object(type)) {
    listener = type;
    type = '';
  }

  if (is.func(listener)) {
    result[type] = result[type] || [];
    result[type].push(listener);
  } else if (is.array(listener)) {
    for (var _i = 0; _i < listener.length; _i++) {
      var _ref;

      _ref = listener[_i];
      var l = _ref;

      normalize(type, l, result);
    }
  } else if (is.object(listener)) {
    for (var prefix in listener) {
      normalize('' + type + prefix, listener[prefix], result);
    }
  }

  return result;
}

},{"./extend":46,"./is":51}],54:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = pointerExtend;
function pointerExtend(dest, source) {
  for (var prop in source) {
    var prefixedPropREs = pointerExtend.prefixedPropREs;
    var deprecated = false;

    // skip deprecated prefixed properties
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

},{}],55:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _hypot = _dereq_('./hypot');

var _hypot2 = _interopRequireDefault(_hypot);

var _browser = _dereq_('./browser');

var _browser2 = _interopRequireDefault(_browser);

var _domObjects = _dereq_('./domObjects');

var _domObjects2 = _interopRequireDefault(_domObjects);

var _domUtils = _dereq_('./domUtils');

var domUtils = _interopRequireWildcard(_domUtils);

var _is = _dereq_('./is');

var is = _interopRequireWildcard(_is);

var _pointerExtend = _dereq_('./pointerExtend');

var _pointerExtend2 = _interopRequireDefault(_pointerExtend);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
    return pointer instanceof _domObjects2.default.Event || pointer instanceof _domObjects2.default.Touch;
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
    page = page || {};

    // Opera Mobile handles the viewport and scrolling oddly
    if (_browser2.default.isOperaMobile && pointerUtils.isNativePointer(pointer)) {
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

    if (_browser2.default.isOperaMobile && pointerUtils.isNativePointer(pointer)) {
      // Opera Mobile handles the viewport and scrolling oddly
      pointerUtils.getXY('screen', pointer, client);
    } else {
      pointerUtils.getXY('client', pointer, client);
    }

    return client;
  },

  getPointerId: function getPointerId(pointer) {
    return is.number(pointer.pointerId) ? pointer.pointerId : pointer.identifier;
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

    targetObj.timeStamp = is.number(timeStamp) ? timeStamp : new Date().getTime();
  },

  pointerExtend: _pointerExtend2.default,

  getTouchPair: function getTouchPair(event) {
    var touches = [];

    // array of touches is supplied
    if (is.array(event)) {
      touches[0] = event[0];
      touches[1] = event[1];
    }
    // an event
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

    return (0, _hypot2.default)(dx, dy);
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
    return is.string(pointer.pointerType) ? pointer.pointerType : is.number(pointer.pointerType) ? [undefined, undefined, 'touch', 'pen', 'mouse'][pointer.pointerType]
    // if the PointerEvent API isn't available, then the "pointer" must
    // be either a MouseEvent, TouchEvent, or Touch object
    : /touch/.test(pointer.type) || pointer instanceof _domObjects2.default.Touch ? 'touch' : 'mouse';
  },

  // [ event.target, event.currentTarget ]
  getEventTargets: function getEventTargets(event) {
    var path = is.func(event.composedPath) ? event.composedPath() : event.path;

    return [domUtils.getActualElement(path ? path[0] : event.target), domUtils.getActualElement(event.currentTarget)];
  },

  newCoords: function newCoords() {
    return {
      page: { x: 0, y: 0 },
      client: { x: 0, y: 0 },
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
      pageX: page.x,
      pageY: page.y,
      clientX: client.x,
      clientY: client.y
    };
  }
};

exports.default = pointerUtils;

},{"./browser":41,"./domObjects":43,"./domUtils":44,"./hypot":48,"./is":51,"./pointerExtend":54}],56:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var lastTime = 0;
var _request = void 0;
var _cancel = void 0;

function init(window) {
  _request = window.requestAnimationFrame;
  _cancel = window.cancelAnimationFrame;

  if (!_request) {
    var vendors = ['ms', 'moz', 'webkit', 'o'];

    for (var _i = 0; _i < vendors.length; _i++) {
      var vendor = vendors[_i];
      _request = window[vendor + 'RequestAnimationFrame'];
      _cancel = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
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

exports.default = {
  request: function request(callback) {
    return _request(callback);
  },
  cancel: function cancel(token) {
    return _cancel(token);
  },
  init: init
};

},{}],57:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStringOptionResult = getStringOptionResult;
exports.resolveRectLike = resolveRectLike;
exports.rectToXY = rectToXY;
exports.xywhToTlbr = xywhToTlbr;
exports.tlbrToXywh = tlbrToXywh;

var _extend = _dereq_('./extend');

var _extend2 = _interopRequireDefault(_extend);

var _is = _dereq_('./is');

var is = _interopRequireWildcard(_is);

var _domUtils = _dereq_('./domUtils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getStringOptionResult(value, interactable, element) {
  if (!is.string(value)) {
    return null;
  }

  if (value === 'parent') {
    value = (0, _domUtils.parentNode)(element);
  } else if (value === 'self') {
    value = interactable.getRect(element);
  } else {
    value = (0, _domUtils.closest)(element, value);
  }

  return value;
}

function resolveRectLike(value, interactable, element, functionArgs) {
  value = getStringOptionResult(value, interactable, element) || value;

  if (is.func(value)) {
    value = value.apply(null, functionArgs);
  }

  if (is.element(value)) {
    value = (0, _domUtils.getElementRect)(value);
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
    rect = (0, _extend2.default)({}, rect);

    rect.left = rect.x || 0;
    rect.top = rect.y || 0;
    rect.right = rect.right || rect.left + rect.width;
    rect.bottom = rect.bottom || rect.top + rect.height;
  }

  return rect;
}

function tlbrToXywh(rect) {
  if (rect && !('x' in rect && 'y' in rect)) {
    rect = (0, _extend2.default)({}, rect);

    rect.x = rect.left || 0;
    rect.y = rect.top || 0;
    rect.width = rect.width || rect.right - rect.x;
    rect.height = rect.height || rect.bottom - rect.y;
  }

  return rect;
}

exports.default = {
  getStringOptionResult: getStringOptionResult,
  resolveRectLike: resolveRectLike,
  rectToXY: rectToXY,
  xywhToTlbr: xywhToTlbr,
  tlbrToXywh: tlbrToXywh
};

},{"./domUtils":44,"./extend":46,"./is":51}],58:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (grid) {
  var coordFields = [['x', 'y'], ['left', 'top'], ['right', 'bottom'], ['width', 'height']].filter(function (_ref) {
    var xField = _ref[0],
        yField = _ref[1];
    return xField in grid || yField in grid;
  });

  return function (x, y) {
    var range = grid.range,
        _grid$limits = grid.limits,
        limits = _grid$limits === undefined ? {
      left: -Infinity,
      right: Infinity,
      top: -Infinity,
      bottom: Infinity
    } : _grid$limits,
        _grid$offset = grid.offset,
        offset = _grid$offset === undefined ? { x: 0, y: 0 } : _grid$offset;


    var result = { range: range };

    for (var _i = 0; _i < coordFields.length; _i++) {
      var _ref3;

      _ref3 = coordFields[_i];
      var _ref2 = _ref3;
      var xField = _ref2[0];
      var yField = _ref2[1];

      var gridx = Math.round((x - offset.x) / grid[xField]);
      var gridy = Math.round((y - offset.y) / grid[yField]);

      result[xField] = Math.max(limits.left, Math.min(limits.right, gridx * grid[xField] + offset.x));
      result[yField] = Math.max(limits.top, Math.min(limits.bottom, gridy * grid[yField] + offset.y));
    }

    return result;
  };
};

},{}],59:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.grid = undefined;

var _grid = _dereq_('./grid');

var _grid2 = _interopRequireDefault(_grid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.grid = _grid2.default;

},{"./grid":58}],60:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = init;
exports.getWindow = getWindow;

var _isWindow = _dereq_('./isWindow');

var _isWindow2 = _interopRequireDefault(_isWindow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var win = {
  getWindow: getWindow,
  init: init
};

function init(window) {
  // get wrapped window if using Shadow DOM polyfill

  win.realWindow = window;

  // create a TextNode
  var el = window.document.createTextNode('');

  // check if it's wrapped by a polyfill
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
  if ((0, _isWindow2.default)(node)) {
    return node;
  }

  var rootNode = node.ownerDocument || node;

  return rootNode.defaultView || win.window;
}

win.init = init;

exports.default = win;

},{"./isWindow":52}]},{},[1])(1)
});


//# sourceMappingURL=interact.js.map
