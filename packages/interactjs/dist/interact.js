/**
 * interact.js 1.10.24
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.interact = factory());
})(this, (function () { 'use strict';

  var isWindow = (thing => !!(thing && thing.Window) && thing instanceof thing.Window);

  let realWindow = undefined;
  let win = undefined;
  function init$3(window) {
    // get wrapped window if using Shadow DOM polyfill

    realWindow = window;

    // create a TextNode
    const el = window.document.createTextNode('');

    // check if it's wrapped by a polyfill
    if (el.ownerDocument !== window.document && typeof window.wrap === 'function' && window.wrap(el) === el) {
      // use wrapped window
      window = window.wrap(window);
    }
    win = window;
  }
  if (typeof window !== 'undefined' && !!window) {
    init$3(window);
  }
  function getWindow(node) {
    if (isWindow(node)) {
      return node;
    }
    const rootNode = node.ownerDocument || node;
    return rootNode.defaultView || win.window;
  }

  const window$1 = thing => thing === win || isWindow(thing);
  const docFrag = thing => object(thing) && thing.nodeType === 11;
  const object = thing => !!thing && typeof thing === 'object';
  const func = thing => typeof thing === 'function';
  const number = thing => typeof thing === 'number';
  const bool = thing => typeof thing === 'boolean';
  const string = thing => typeof thing === 'string';
  const element = thing => {
    if (!thing || typeof thing !== 'object') {
      return false;
    }
    const _window = getWindow(thing) || win;
    return /object|function/.test(typeof Element) ? thing instanceof Element || thing instanceof _window.Element : thing.nodeType === 1 && typeof thing.nodeName === 'string';
  };
  const plainObject = thing => object(thing) && !!thing.constructor && /function Object\b/.test(thing.constructor.toString());
  const array = thing => object(thing) && typeof thing.length !== 'undefined' && func(thing.splice);
  var is = {
    window: window$1,
    docFrag,
    object,
    func,
    number,
    bool,
    string,
    element,
    plainObject,
    array
  };

  function install$g(scope) {
    const {
      actions,
      Interactable,
      defaults
    } = scope;
    Interactable.prototype.draggable = drag.draggable;
    actions.map.drag = drag;
    actions.methodDict.drag = 'draggable';
    defaults.actions.drag = drag.defaults;
  }
  function beforeMove({
    interaction
  }) {
    if (interaction.prepared.name !== 'drag') return;
    const axis = interaction.prepared.axis;
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
  function move$1({
    iEvent,
    interaction
  }) {
    if (interaction.prepared.name !== 'drag') return;
    const axis = interaction.prepared.axis;
    if (axis === 'x' || axis === 'y') {
      const opposite = axis === 'x' ? 'y' : 'x';
      iEvent.page[opposite] = interaction.coords.start.page[opposite];
      iEvent.client[opposite] = interaction.coords.start.client[opposite];
      iEvent.delta[opposite] = 0;
    }
  }
  const draggable = function draggable(options) {
    if (is.object(options)) {
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
    if (is.bool(options)) {
      this.options.drag.enabled = options;
      return this;
    }
    return this.options.drag;
  };
  const drag = {
    id: 'actions/drag',
    install: install$g,
    listeners: {
      'interactions:before-action-move': beforeMove,
      'interactions:action-resume': beforeMove,
      // dragmove
      'interactions:action-move': move$1,
      'auto-start:check': arg => {
        const {
          interaction,
          interactable,
          buttons
        } = arg;
        const dragOptions = interactable.options.drag;
        if (!(dragOptions && dragOptions.enabled) ||
        // check mouseButton setting if the pointer is down
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
    draggable,
    beforeMove,
    move: move$1,
    defaults: {
      startAxis: 'xy',
      lockAxis: 'xy'
    },
    getCursor() {
      return 'move';
    },
    filterEventType: type => type.search('drag') === 0
  };
  var drag$1 = drag;

  const domObjects = {
    init: init$2,
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
  var domObjects$1 = domObjects;
  function init$2(window) {
    const win = window;
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

  const browser = {
    init: init$1,
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
  function init$1(window) {
    const Element = domObjects$1.Element;
    const navigator = window.navigator || {};

    // Does the browser support touch input?
    browser.supportsTouch = 'ontouchstart' in window || is.func(window.DocumentTouch) && domObjects$1.document instanceof window.DocumentTouch;

    // Does the browser support PointerEvents
    // https://github.com/taye/interact.js/issues/703#issuecomment-471570492
    browser.supportsPointerEvent = navigator.pointerEnabled !== false && !!domObjects$1.PointerEvent;
    browser.isIOS = /iP(hone|od|ad)/.test(navigator.platform);

    // scrolling doesn't change the result of getClientRects on iOS 7
    browser.isIOS7 = /iP(hone|od|ad)/.test(navigator.platform) && /OS 7[^\d]/.test(navigator.appVersion);
    browser.isIe9 = /MSIE 9/.test(navigator.userAgent);

    // Opera Mobile must be handled differently
    browser.isOperaMobile = navigator.appName === 'Opera' && browser.supportsTouch && /Presto/.test(navigator.userAgent);

    // prefix matchesSelector
    browser.prefixedMatchesSelector = 'matches' in Element.prototype ? 'matches' : 'webkitMatchesSelector' in Element.prototype ? 'webkitMatchesSelector' : 'mozMatchesSelector' in Element.prototype ? 'mozMatchesSelector' : 'oMatchesSelector' in Element.prototype ? 'oMatchesSelector' : 'msMatchesSelector';
    browser.pEventTypes = browser.supportsPointerEvent ? domObjects$1.PointerEvent === window.MSPointerEvent ? {
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
    browser.wheelEvent = domObjects$1.document && 'onmousewheel' in domObjects$1.document ? 'mousewheel' : 'wheel';
  }
  var browser$1 = browser;

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
    while (is.element(element)) {
      if (matchesSelector(element, selector)) {
        return element;
      }
      element = parentNode(element);
    }
    return null;
  }
  function parentNode(node) {
    let parent = node.parentNode;
    if (is.docFrag(parent)) {
      // skip past #shado-root fragments
      // tslint:disable-next-line
      while ((parent = parent.host) && is.docFrag(parent)) {
        continue;
      }
      return parent;
    }
    return parent;
  }
  function matchesSelector(element, selector) {
    // remove /deep/ from selectors if shadowDOM polyfill is used
    if (win !== realWindow) {
      selector = selector.replace(/\/deep\//g, ' ');
    }
    return element[browser$1.prefixedMatchesSelector](selector);
  }
  const getParent = el => el.parentNode || el.host;

  // Test for the element that's "above" all other qualifiers
  function indexOfDeepestElement(elements) {
    let deepestNodeParents = [];
    let deepestNodeIndex;
    for (let i = 0; i < elements.length; i++) {
      const currentNode = elements[i];
      const deepestNode = elements[deepestNodeIndex];

      // node may appear in elements array multiple times
      if (!currentNode || i === deepestNodeIndex) {
        continue;
      }
      if (!deepestNode) {
        deepestNodeIndex = i;
        continue;
      }
      const currentNodeParent = getParent(currentNode);
      const deepestNodeParent = getParent(deepestNode);

      // check if the deepest or current are document.documentElement/rootElement
      // - if the current node is, do nothing and continue
      if (currentNodeParent === currentNode.ownerDocument) {
        continue;
      }
      // - if deepest is, update with the current node and continue to next
      else if (deepestNodeParent === currentNode.ownerDocument) {
        deepestNodeIndex = i;
        continue;
      }

      // compare zIndex of siblings
      if (currentNodeParent === deepestNodeParent) {
        if (zIndexIsHigherThan(currentNode, deepestNode)) {
          deepestNodeIndex = i;
        }
        continue;
      }

      // populate the ancestry array for the latest deepest node
      deepestNodeParents = deepestNodeParents.length ? deepestNodeParents : getNodeParents(deepestNode);
      let ancestryStart;

      // if the deepest node is an HTMLElement and the current node is a non root svg element
      if (deepestNode instanceof domObjects$1.HTMLElement && currentNode instanceof domObjects$1.SVGElement && !(currentNode instanceof domObjects$1.SVGSVGElement)) {
        // TODO: is this check necessary? Was this for HTML elements embedded in SVG?
        if (currentNode === deepestNodeParent) {
          continue;
        }
        ancestryStart = currentNode.ownerSVGElement;
      } else {
        ancestryStart = currentNode;
      }
      const currentNodeParents = getNodeParents(ancestryStart, deepestNode.ownerDocument);
      let commonIndex = 0;

      // get (position of closest common ancestor) + 1
      while (currentNodeParents[commonIndex] && currentNodeParents[commonIndex] === deepestNodeParents[commonIndex]) {
        commonIndex++;
      }
      const parents = [currentNodeParents[commonIndex - 1], currentNodeParents[commonIndex], deepestNodeParents[commonIndex]];
      if (parents[0]) {
        let child = parents[0].lastChild;
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
    const parents = [];
    let parent = node;
    let parentParent;
    while ((parentParent = getParent(parent)) && parent !== limit && parentParent !== parent.ownerDocument) {
      parents.unshift(parent);
      parent = parentParent;
    }
    return parents;
  }
  function zIndexIsHigherThan(higherNode, lowerNode) {
    const higherIndex = parseInt(getWindow(higherNode).getComputedStyle(higherNode).zIndex, 10) || 0;
    const lowerIndex = parseInt(getWindow(lowerNode).getComputedStyle(lowerNode).zIndex, 10) || 0;
    return higherIndex >= lowerIndex;
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
    return element.correspondingUseElement || element;
  }
  function getScrollXY(relevantWindow) {
    relevantWindow = relevantWindow || win;
    return {
      x: relevantWindow.scrollX || relevantWindow.document.documentElement.scrollLeft,
      y: relevantWindow.scrollY || relevantWindow.document.documentElement.scrollTop
    };
  }
  function getElementClientRect(element) {
    const clientRect = element instanceof domObjects$1.SVGElement ? element.getBoundingClientRect() : element.getClientRects()[0];
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
    const clientRect = getElementClientRect(element);
    if (!browser$1.isIOS7 && clientRect) {
      const scroll = getScrollXY(getWindow(element));
      clientRect.left += scroll.x;
      clientRect.right += scroll.x;
      clientRect.top += scroll.y;
      clientRect.bottom += scroll.y;
    }
    return clientRect;
  }
  function getPath(node) {
    const path = [];
    while (node) {
      path.push(node);
      node = parentNode(node);
    }
    return path;
  }
  function trySelector(value) {
    if (!is.string(value)) {
      return false;
    }

    // an exception will be raised if it is invalid
    domObjects$1.document.querySelector(value);
    return true;
  }

  function extend(dest, source) {
    for (const prop in source) {
      dest[prop] = source[prop];
    }
    const ret = dest;
    return ret;
  }

  function getStringOptionResult(value, target, element) {
    if (value === 'parent') {
      return parentNode(element);
    }
    if (value === 'self') {
      return target.getRect(element);
    }
    return closest(element, value);
  }
  function resolveRectLike(value, target, element, functionArgs) {
    let returnValue = value;
    if (is.string(returnValue)) {
      returnValue = getStringOptionResult(returnValue, target, element);
    } else if (is.func(returnValue)) {
      returnValue = returnValue(...functionArgs);
    }
    if (is.element(returnValue)) {
      returnValue = getElementRect(returnValue);
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
      rect = extend({}, rect);
      rect.left = rect.x || 0;
      rect.top = rect.y || 0;
      rect.right = rect.right || rect.left + rect.width;
      rect.bottom = rect.bottom || rect.top + rect.height;
    }
    return rect;
  }
  function tlbrToXywh(rect) {
    if (rect && !('x' in rect && 'y' in rect)) {
      rect = extend({}, rect);
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

  function getOriginXY(target, element, actionName) {
    const actionOptions = actionName && target.options[actionName];
    const actionOrigin = actionOptions && actionOptions.origin;
    const origin = actionOrigin || target.options.origin;
    const originRect = resolveRectLike(origin, target, element, [target && element]);
    return rectToXY(originRect) || {
      x: 0,
      y: 0
    };
  }

  function normalize(type, listeners, filter = _typeOrPrefix => true, result) {
    result = result || {};
    if (is.string(type) && type.search(' ') !== -1) {
      type = split(type);
    }
    if (is.array(type)) {
      type.forEach(t => normalize(t, listeners, filter, result));
      return result;
    }

    // before:  type = [{ drag: () => {} }], listeners = undefined
    // after:   type = ''                  , listeners = [{ drag: () => {} }]
    if (is.object(type)) {
      listeners = type;
      type = '';
    }
    if (is.func(listeners) && filter(type)) {
      result[type] = result[type] || [];
      result[type].push(listeners);
    } else if (is.array(listeners)) {
      for (var _i = 0; _i < listeners.length; _i++) {
        var _ref;
        _ref = listeners[_i];
        const l = _ref;
        normalize(type, l, filter, result);
      }
    } else if (is.object(listeners)) {
      for (const prefix in listeners) {
        const combinedTypes = split(prefix).map(p => `${type}${p}`);
        normalize(combinedTypes, listeners[prefix], filter, result);
      }
    }
    return result;
  }
  function split(type) {
    return type.trim().split(/ +/);
  }

  var hypot = ((x, y) => Math.sqrt(x * x + y * y));

  const VENDOR_PREFIXES = ['webkit', 'moz'];
  function pointerExtend(dest, source) {
    dest.__set || (dest.__set = {});
    for (const prop in source) {
      // skip deprecated prefixed properties
      if (VENDOR_PREFIXES.some(prefix => prop.indexOf(prefix) === 0)) continue;
      if (typeof dest[prop] !== 'function' && prop !== '__set') {
        Object.defineProperty(dest, prop, {
          get() {
            if (prop in dest.__set) return dest.__set[prop];
            return dest.__set[prop] = source[prop];
          },
          set(value) {
            dest.__set[prop] = value;
          },
          configurable: true
        });
      }
    }
    return dest;
  }

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
    const dt = Math.max(delta.timeStamp / 1000, 0.001);
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
    return pointer instanceof domObjects$1.Event || pointer instanceof domObjects$1.Touch;
  }

  // Get specified X/Y coords for mouse or event.touches[0]
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
    };

    // Opera Mobile handles the viewport and scrolling oddly
    if (browser$1.isOperaMobile && isNativePointer(pointer)) {
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
    if (browser$1.isOperaMobile && isNativePointer(pointer)) {
      // Opera Mobile handles the viewport and scrolling oddly
      getXY('screen', pointer, client);
    } else {
      getXY('client', pointer, client);
    }
    return client;
  }
  function getPointerId(pointer) {
    return is.number(pointer.pointerId) ? pointer.pointerId : pointer.identifier;
  }
  function setCoords(dest, pointers, timeStamp) {
    const pointer = pointers.length > 1 ? pointerAverage(pointers) : pointers[0];
    getPageXY(pointer, dest.page);
    getClientXY(pointer, dest.client);
    dest.timeStamp = timeStamp;
  }
  function getTouchPair(event) {
    const touches = [];

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
  }
  function pointerAverage(pointers) {
    const average = {
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
      const pointer = _ref;
      for (const prop in average) {
        average[prop] += pointer[prop];
      }
    }
    for (const prop in average) {
      average[prop] /= pointers.length;
    }
    return average;
  }
  function touchBBox(event) {
    if (!event.length) {
      return null;
    }
    const touches = getTouchPair(event);
    const minX = Math.min(touches[0].pageX, touches[1].pageX);
    const minY = Math.min(touches[0].pageY, touches[1].pageY);
    const maxX = Math.max(touches[0].pageX, touches[1].pageX);
    const maxY = Math.max(touches[0].pageY, touches[1].pageY);
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
    const sourceX = deltaSource + 'X';
    const sourceY = deltaSource + 'Y';
    const touches = getTouchPair(event);
    const dx = touches[0][sourceX] - touches[1][sourceX];
    const dy = touches[0][sourceY] - touches[1][sourceY];
    return hypot(dx, dy);
  }
  function touchAngle(event, deltaSource) {
    const sourceX = deltaSource + 'X';
    const sourceY = deltaSource + 'Y';
    const touches = getTouchPair(event);
    const dx = touches[1][sourceX] - touches[0][sourceX];
    const dy = touches[1][sourceY] - touches[0][sourceY];
    const angle = 180 * Math.atan2(dy, dx) / Math.PI;
    return angle;
  }
  function getPointerType(pointer) {
    return is.string(pointer.pointerType) ? pointer.pointerType : is.number(pointer.pointerType) ? [undefined, undefined, 'touch', 'pen', 'mouse'][pointer.pointerType] :
    // if the PointerEvent API isn't available, then the "pointer" must
    // be either a MouseEvent, TouchEvent, or Touch object
    /touch/.test(pointer.type || '') || pointer instanceof domObjects$1.Touch ? 'touch' : 'mouse';
  }

  // [ event.target, event.currentTarget ]
  function getEventTargets(event) {
    const path = is.func(event.composedPath) ? event.composedPath() : event.path;
    return [getActualElement(path ? path[0] : event.target), getActualElement(event.currentTarget)];
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
    const event = {
      coords,
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
      preventDefault() {}
    };
    return event;
  }

  class BaseEvent {
    /** @internal */

    immediatePropagationStopped = false;
    propagationStopped = false;
    constructor(interaction) {
      this._interaction = interaction;
    }
    preventDefault() {}

    /**
     * Don't call any other listeners (even on the current target)
     */
    stopPropagation() {
      this.propagationStopped = true;
    }

    /**
     * Don't call listeners on the remaining targets
     */
    stopImmediatePropagation() {
      this.immediatePropagationStopped = this.propagationStopped = true;
    }
  }

  // defined outside of class definition to avoid assignment of undefined during
  // construction

  // getters and setters defined here to support typescript 3.6 and below which
  // don't support getter and setters in .d.ts files
  Object.defineProperty(BaseEvent.prototype, 'interaction', {
    get() {
      return this._interaction._proxy;
    },
    set() {}
  });

  const remove = (array, target) => array.splice(array.indexOf(target), 1);
  const merge = (target, source) => {
    for (var _i = 0; _i < source.length; _i++) {
      var _ref;
      _ref = source[_i];
      const item = _ref;
      target.push(item);
    }
    return target;
  };
  const from = source => merge([], source);
  const findIndex = (array, func) => {
    for (let i = 0; i < array.length; i++) {
      if (func(array[i], i, array)) {
        return i;
      }
    }
    return -1;
  };
  const find = (array, func) => array[findIndex(array, func)];

  class DropEvent extends BaseEvent {
    dropzone;
    dragEvent;
    relatedTarget;
    draggable;
    propagationStopped = false;
    immediatePropagationStopped = false;

    /**
     * Class of events fired on dropzones during drags with acceptable targets.
     */
    constructor(dropState, dragEvent, type) {
      super(dragEvent._interaction);
      const {
        element,
        dropzone
      } = type === 'dragleave' ? dropState.prev : dropState.cur;
      this.type = type;
      this.target = element;
      this.currentTarget = element;
      this.dropzone = dropzone;
      this.dragEvent = dragEvent;
      this.relatedTarget = dragEvent.target;
      this.draggable = dragEvent.interactable;
      this.timeStamp = dragEvent.timeStamp;
    }

    /**
     * If this is a `dropactivate` event, the dropzone element will be
     * deactivated.
     *
     * If this is a `dragmove` or `dragenter`, a `dragleave` will be fired on the
     * dropzone element and more.
     */
    reject() {
      const {
        dropState
      } = this._interaction;
      if (this.type !== 'dropactivate' && (!this.dropzone || dropState.cur.dropzone !== this.dropzone || dropState.cur.element !== this.target)) {
        return;
      }
      dropState.prev.dropzone = this.dropzone;
      dropState.prev.element = this.target;
      dropState.rejected = true;
      dropState.events.enter = null;
      this.stopImmediatePropagation();
      if (this.type === 'dropactivate') {
        const activeDrops = dropState.activeDrops;
        const index = findIndex(activeDrops, ({
          dropzone,
          element
        }) => dropzone === this.dropzone && element === this.target);
        dropState.activeDrops.splice(index, 1);
        const deactivateEvent = new DropEvent(dropState, this.dragEvent, 'dropdeactivate');
        deactivateEvent.dropzone = this.dropzone;
        deactivateEvent.target = this.target;
        this.dropzone.fire(deactivateEvent);
      } else {
        this.dropzone.fire(new DropEvent(dropState, this.dragEvent, 'dragleave'));
      }
    }
    preventDefault() {}
    stopPropagation() {
      this.propagationStopped = true;
    }
    stopImmediatePropagation() {
      this.immediatePropagationStopped = this.propagationStopped = true;
    }
  }

  function install$f(scope) {
    const {
      actions,
      interactStatic: interact,
      Interactable,
      defaults
    } = scope;
    scope.usePlugin(drag$1);
    Interactable.prototype.dropzone = function (options) {
      return dropzoneMethod(this, options);
    };
    Interactable.prototype.dropCheck = function (dragEvent, event, draggable, draggableElement, dropElement, rect) {
      return dropCheckMethod(this, dragEvent, event, draggable, draggableElement, dropElement, rect);
    };
    interact.dynamicDrop = function (newValue) {
      if (is.bool(newValue)) {
        // if (dragging && scope.dynamicDrop !== newValue && !newValue) {
        //  calcRects(dropzones)
        // }

        scope.dynamicDrop = newValue;
        return interact;
      }
      return scope.dynamicDrop;
    };
    extend(actions.phaselessTypes, {
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
  function collectDropzones({
    interactables
  }, draggableElement) {
    const drops = [];

    // collect all dropzones and their elements which qualify for a drop
    for (var _i = 0; _i < interactables.list.length; _i++) {
      var _ref;
      _ref = interactables.list[_i];
      const dropzone = _ref;
      if (!dropzone.options.drop.enabled) {
        continue;
      }
      const accept = dropzone.options.drop.accept;

      // test the draggable draggableElement against the dropzone's accept setting
      if (is.element(accept) && accept !== draggableElement || is.string(accept) && !matchesSelector(draggableElement, accept) || is.func(accept) && !accept({
        dropzone,
        draggableElement
      })) {
        continue;
      }
      for (var _i2 = 0; _i2 < dropzone.getAllElements().length; _i2++) {
        var _ref2;
        _ref2 = dropzone.getAllElements()[_i2];
        const dropzoneElement = _ref2;
        if (dropzoneElement !== draggableElement) {
          drops.push({
            dropzone,
            element: dropzoneElement,
            rect: dropzone.getRect(dropzoneElement)
          });
        }
      }
    }
    return drops;
  }
  function fireActivationEvents(activeDrops, event) {
    // loop through all active dropzones and trigger event
    for (var _i3 = 0; _i3 < activeDrops.slice().length; _i3++) {
      var _ref3;
      _ref3 = activeDrops.slice()[_i3];
      const {
        dropzone,
        element
      } = _ref3;
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
    const activeDrops = collectDropzones(scope, dragElement);
    for (var _i4 = 0; _i4 < activeDrops.length; _i4++) {
      var _ref4;
      _ref4 = activeDrops[_i4];
      const activeDrop = _ref4;
      activeDrop.rect = activeDrop.dropzone.getRect(activeDrop.element);
    }
    return activeDrops;
  }
  function getDrop({
    dropState,
    interactable: draggable,
    element: dragElement
  }, dragEvent, pointerEvent) {
    const validDrops = [];

    // collect all dropzones and their elements which qualify for a drop
    for (var _i5 = 0; _i5 < dropState.activeDrops.length; _i5++) {
      var _ref5;
      _ref5 = dropState.activeDrops[_i5];
      const {
        dropzone,
        element: dropzoneElement,
        rect
      } = _ref5;
      const isValid = dropzone.dropCheck(dragEvent, pointerEvent, draggable, dragElement, dropzoneElement, rect);
      validDrops.push(isValid ? dropzoneElement : null);
    }

    // get the most appropriate dropzone based on DOM depth and order
    const dropIndex = indexOfDeepestElement(validDrops);
    return dropState.activeDrops[dropIndex] || null;
  }
  function getDropEvents(interaction, _pointerEvent, dragEvent) {
    const dropState = interaction.dropState;
    const dropEvents = {
      enter: null,
      leave: null,
      activate: null,
      deactivate: null,
      move: null,
      drop: null
    };
    if (dragEvent.type === 'dragstart') {
      dropEvents.activate = new DropEvent(dropState, dragEvent, 'dropactivate');
      dropEvents.activate.target = null;
      dropEvents.activate.dropzone = null;
    }
    if (dragEvent.type === 'dragend') {
      dropEvents.deactivate = new DropEvent(dropState, dragEvent, 'dropdeactivate');
      dropEvents.deactivate.target = null;
      dropEvents.deactivate.dropzone = null;
    }
    if (dropState.rejected) {
      return dropEvents;
    }
    if (dropState.cur.element !== dropState.prev.element) {
      // if there was a previous dropzone, create a dragleave event
      if (dropState.prev.dropzone) {
        dropEvents.leave = new DropEvent(dropState, dragEvent, 'dragleave');
        dragEvent.dragLeave = dropEvents.leave.target = dropState.prev.element;
        dragEvent.prevDropzone = dropEvents.leave.dropzone = dropState.prev.dropzone;
      }
      // if dropzone is not null, create a dragenter event
      if (dropState.cur.dropzone) {
        dropEvents.enter = new DropEvent(dropState, dragEvent, 'dragenter');
        dragEvent.dragEnter = dropState.cur.element;
        dragEvent.dropzone = dropState.cur.dropzone;
      }
    }
    if (dragEvent.type === 'dragend' && dropState.cur.dropzone) {
      dropEvents.drop = new DropEvent(dropState, dragEvent, 'drop');
      dragEvent.dropzone = dropState.cur.dropzone;
      dragEvent.relatedTarget = dropState.cur.element;
    }
    if (dragEvent.type === 'dragmove' && dropState.cur.dropzone) {
      dropEvents.move = new DropEvent(dropState, dragEvent, 'dropmove');
      dragEvent.dropzone = dropState.cur.dropzone;
    }
    return dropEvents;
  }
  function fireDropEvents(interaction, events) {
    const dropState = interaction.dropState;
    const {
      activeDrops,
      cur,
      prev
    } = dropState;
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
  function onEventCreated({
    interaction,
    iEvent,
    event
  }, scope) {
    if (iEvent.type !== 'dragmove' && iEvent.type !== 'dragend') {
      return;
    }
    const dropState = interaction.dropState;
    if (scope.dynamicDrop) {
      dropState.activeDrops = getActiveDrops(scope, interaction.element);
    }
    const dragEvent = iEvent;
    const dropResult = getDrop(interaction, dragEvent, event);

    // update rejected status
    dropState.rejected = dropState.rejected && !!dropResult && dropResult.dropzone === dropState.cur.dropzone && dropResult.element === dropState.cur.element;
    dropState.cur.dropzone = dropResult && dropResult.dropzone;
    dropState.cur.element = dropResult && dropResult.element;
    dropState.events = getDropEvents(interaction, event, dragEvent);
  }
  function dropzoneMethod(interactable, options) {
    if (is.object(options)) {
      interactable.options.drop.enabled = options.enabled !== false;
      if (options.listeners) {
        const normalized = normalize(options.listeners);
        // rename 'drop' to '' as it will be prefixed with 'drop'
        const corrected = Object.keys(normalized).reduce((acc, type) => {
          const correctedType = /^(enter|leave)/.test(type) ? `drag${type}` : /^(activate|deactivate|move)/.test(type) ? `drop${type}` : type;
          acc[correctedType] = normalized[type];
          return acc;
        }, {});
        const prevListeners = interactable.options.drop.listeners;
        prevListeners && interactable.off(prevListeners);
        interactable.on(corrected);
        interactable.options.drop.listeners = corrected;
      }
      if (is.func(options.ondrop)) {
        interactable.on('drop', options.ondrop);
      }
      if (is.func(options.ondropactivate)) {
        interactable.on('dropactivate', options.ondropactivate);
      }
      if (is.func(options.ondropdeactivate)) {
        interactable.on('dropdeactivate', options.ondropdeactivate);
      }
      if (is.func(options.ondragenter)) {
        interactable.on('dragenter', options.ondragenter);
      }
      if (is.func(options.ondragleave)) {
        interactable.on('dragleave', options.ondragleave);
      }
      if (is.func(options.ondropmove)) {
        interactable.on('dropmove', options.ondropmove);
      }
      if (/^(pointer|center)$/.test(options.overlap)) {
        interactable.options.drop.overlap = options.overlap;
      } else if (is.number(options.overlap)) {
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
    if (is.bool(options)) {
      interactable.options.drop.enabled = options;
      return interactable;
    }
    return interactable.options.drop;
  }
  function dropCheckMethod(interactable, dragEvent, event, draggable, draggableElement, dropElement, rect) {
    let dropped = false;

    // if the dropzone has no rect (eg. display: none)
    // call the custom dropChecker or just return false
    if (!(rect = rect || interactable.getRect(dropElement))) {
      return interactable.options.drop.checker ? interactable.options.drop.checker(dragEvent, event, dropped, interactable, dropElement, draggable, draggableElement) : false;
    }
    const dropOverlap = interactable.options.drop.overlap;
    if (dropOverlap === 'pointer') {
      const origin = getOriginXY(draggable, draggableElement, 'drag');
      const page = getPageXY(dragEvent);
      page.x += origin.x;
      page.y += origin.y;
      const horizontal = page.x > rect.left && page.x < rect.right;
      const vertical = page.y > rect.top && page.y < rect.bottom;
      dropped = horizontal && vertical;
    }
    const dragRect = draggable.getRect(draggableElement);
    if (dragRect && dropOverlap === 'center') {
      const cx = dragRect.left + dragRect.width / 2;
      const cy = dragRect.top + dragRect.height / 2;
      dropped = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
    }
    if (dragRect && is.number(dropOverlap)) {
      const overlapArea = Math.max(0, Math.min(rect.right, dragRect.right) - Math.max(rect.left, dragRect.left)) * Math.max(0, Math.min(rect.bottom, dragRect.bottom) - Math.max(rect.top, dragRect.top));
      const overlapRatio = overlapArea / (dragRect.width * dragRect.height);
      dropped = overlapRatio >= dropOverlap;
    }
    if (interactable.options.drop.checker) {
      dropped = interactable.options.drop.checker(dragEvent, event, dropped, interactable, dropElement, draggable, draggableElement);
    }
    return dropped;
  }
  const drop = {
    id: 'actions/drop',
    install: install$f,
    listeners: {
      'interactions:before-action-start': ({
        interaction
      }) => {
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
      'interactions:after-action-start': ({
        interaction,
        event,
        iEvent: dragEvent
      }, scope) => {
        if (interaction.prepared.name !== 'drag') {
          return;
        }
        const dropState = interaction.dropState;

        // reset active dropzones
        dropState.activeDrops = [];
        dropState.events = {};
        dropState.activeDrops = getActiveDrops(scope, interaction.element);
        dropState.events = getDropEvents(interaction, event, dragEvent);
        if (dropState.events.activate) {
          fireActivationEvents(dropState.activeDrops, dropState.events.activate);
          scope.fire('actions/drop:start', {
            interaction,
            dragEvent
          });
        }
      },
      'interactions:action-move': onEventCreated,
      'interactions:after-action-move': ({
        interaction,
        iEvent: dragEvent
      }, scope) => {
        if (interaction.prepared.name !== 'drag') {
          return;
        }
        const dropState = interaction.dropState;
        fireDropEvents(interaction, dropState.events);
        scope.fire('actions/drop:move', {
          interaction,
          dragEvent
        });
        dropState.events = {};
      },
      'interactions:action-end': (arg, scope) => {
        if (arg.interaction.prepared.name !== 'drag') {
          return;
        }
        const {
          interaction,
          iEvent: dragEvent
        } = arg;
        onEventCreated(arg, scope);
        fireDropEvents(interaction, interaction.dropState.events);
        scope.fire('actions/drop:end', {
          interaction,
          dragEvent
        });
      },
      'interactions:stop': ({
        interaction
      }) => {
        if (interaction.prepared.name !== 'drag') {
          return;
        }
        const {
          dropState
        } = interaction;
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
    getActiveDrops,
    getDrop,
    getDropEvents,
    fireDropEvents,
    filterEventType: type => type.search('drag') === 0 || type.search('drop') === 0,
    defaults: {
      enabled: false,
      accept: null,
      overlap: 'pointer'
    }
  };
  var drop$1 = drop;

  function install$e(scope) {
    const {
      actions,
      Interactable,
      defaults
    } = scope;
    Interactable.prototype.gesturable = function (options) {
      if (is.object(options)) {
        this.options.gesture.enabled = options.enabled !== false;
        this.setPerAction('gesture', options);
        this.setOnEvents('gesture', options);
        return this;
      }
      if (is.bool(options)) {
        this.options.gesture.enabled = options;
        return this;
      }
      return this.options.gesture;
    };
    actions.map.gesture = gesture;
    actions.methodDict.gesture = 'gesturable';
    defaults.actions.gesture = gesture.defaults;
  }
  function updateGestureProps({
    interaction,
    iEvent,
    phase
  }) {
    if (interaction.prepared.name !== 'gesture') return;
    const pointers = interaction.pointers.map(p => p.pointer);
    const starting = phase === 'start';
    const ending = phase === 'end';
    const deltaSource = interaction.interactable.options.deltaSource;
    iEvent.touches = [pointers[0], pointers[1]];
    if (starting) {
      iEvent.distance = touchDistance(pointers, deltaSource);
      iEvent.box = touchBBox(pointers);
      iEvent.scale = 1;
      iEvent.ds = 0;
      iEvent.angle = touchAngle(pointers, deltaSource);
      iEvent.da = 0;
      interaction.gesture.startDistance = iEvent.distance;
      interaction.gesture.startAngle = iEvent.angle;
    } else if (ending || interaction.pointers.length < 2) {
      const prevEvent = interaction.prevEvent;
      iEvent.distance = prevEvent.distance;
      iEvent.box = prevEvent.box;
      iEvent.scale = prevEvent.scale;
      iEvent.ds = 0;
      iEvent.angle = prevEvent.angle;
      iEvent.da = 0;
    } else {
      iEvent.distance = touchDistance(pointers, deltaSource);
      iEvent.box = touchBBox(pointers);
      iEvent.scale = iEvent.distance / interaction.gesture.startDistance;
      iEvent.angle = touchAngle(pointers, deltaSource);
      iEvent.ds = iEvent.scale - interaction.gesture.scale;
      iEvent.da = iEvent.angle - interaction.gesture.angle;
    }
    interaction.gesture.distance = iEvent.distance;
    interaction.gesture.angle = iEvent.angle;
    if (is.number(iEvent.scale) && iEvent.scale !== Infinity && !isNaN(iEvent.scale)) {
      interaction.gesture.scale = iEvent.scale;
    }
  }
  const gesture = {
    id: 'actions/gesture',
    before: ['actions/drag', 'actions/resize'],
    install: install$e,
    listeners: {
      'interactions:action-start': updateGestureProps,
      'interactions:action-move': updateGestureProps,
      'interactions:action-end': updateGestureProps,
      'interactions:new': ({
        interaction
      }) => {
        interaction.gesture = {
          angle: 0,
          distance: 0,
          scale: 1,
          startAngle: 0,
          startDistance: 0
        };
      },
      'auto-start:check': arg => {
        if (arg.interaction.pointers.length < 2) {
          return undefined;
        }
        const gestureOptions = arg.interactable.options.gesture;
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
    getCursor() {
      return '';
    },
    filterEventType: type => type.search('gesture') === 0
  };
  var gesture$1 = gesture;

  function install$d(scope) {
    const {
      actions,
      browser,
      Interactable,
      // tslint:disable-line no-shadowed-variable
      defaults
    } = scope;

    // Less Precision with touch input

    resize.cursors = initCursors(browser);
    resize.defaultMargin = browser.supportsTouch || browser.supportsPointerEvent ? 20 : 10;
    Interactable.prototype.resizable = function (options) {
      return resizable(this, options, scope);
    };
    actions.map.resize = resize;
    actions.methodDict.resize = 'resizable';
    defaults.actions.resize = resize.defaults;
  }
  function resizeChecker(arg) {
    const {
      interaction,
      interactable,
      element,
      rect,
      buttons
    } = arg;
    if (!rect) {
      return undefined;
    }
    const page = extend({}, interaction.coords.cur.page);
    const resizeOptions = interactable.options.resize;
    if (!(resizeOptions && resizeOptions.enabled) ||
    // check mouseButton setting if the pointer is down
    interaction.pointerIsDown && /mouse|pointer/.test(interaction.pointerType) && (buttons & resizeOptions.mouseButtons) === 0) {
      return undefined;
    }

    // if using resize.edges
    if (is.object(resizeOptions.edges)) {
      const resizeEdges = {
        left: false,
        right: false,
        top: false,
        bottom: false
      };
      for (const edge in resizeEdges) {
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
      const right = resizeOptions.axis !== 'y' && page.x > rect.right - resize.defaultMargin;
      const bottom = resizeOptions.axis !== 'x' && page.y > rect.bottom - resize.defaultMargin;
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
    if (is.object(options)) {
      interactable.options.resize.enabled = options.enabled !== false;
      interactable.setPerAction('resize', options);
      interactable.setOnEvents('resize', options);
      if (is.string(options.axis) && /^x$|^y$|^xy$/.test(options.axis)) {
        interactable.options.resize.axis = options.axis;
      } else if (options.axis === null) {
        interactable.options.resize.axis = scope.defaults.actions.resize.axis;
      }
      if (is.bool(options.preserveAspectRatio)) {
        interactable.options.resize.preserveAspectRatio = options.preserveAspectRatio;
      } else if (is.bool(options.square)) {
        interactable.options.resize.square = options.square;
      }
      return interactable;
    }
    if (is.bool(options)) {
      interactable.options.resize.enabled = options;
      return interactable;
    }
    return interactable.options.resize;
  }
  function checkResizeEdge(name, value, page, element, interactableElement, rect, margin) {
    // false, '', undefined, null
    if (!value) {
      return false;
    }

    // true value, use pointer coords and element rect
    if (value === true) {
      // if dimensions are negative, "switch" edges
      const width = is.number(rect.width) ? rect.width : rect.right - rect.left;
      const height = is.number(rect.height) ? rect.height : rect.bottom - rect.top;

      // don't use margin greater than half the relevent dimension
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
        const edge = width >= 0 ? rect.left : rect.right;
        return page.x < edge + margin;
      }
      if (name === 'top') {
        const edge = height >= 0 ? rect.top : rect.bottom;
        return page.y < edge + margin;
      }
      if (name === 'right') {
        return page.x > (width >= 0 ? rect.right : rect.left) - margin;
      }
      if (name === 'bottom') {
        return page.y > (height >= 0 ? rect.bottom : rect.top) - margin;
      }
    }

    // the remaining checks require an element
    if (!is.element(element)) {
      return false;
    }
    return is.element(value) ?
    // the value is an element to use as a resize handle
    value === element :
    // otherwise check if element matches value as selector
    matchesUpTo(element, value, interactableElement);
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

  function start$7({
    iEvent,
    interaction
  }) {
    if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) {
      return;
    }
    const resizeEvent = iEvent;
    const rect = interaction.rect;
    interaction._rects = {
      start: extend({}, rect),
      corrected: extend({}, rect),
      previous: extend({}, rect),
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
  function move({
    iEvent,
    interaction
  }) {
    if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) return;
    const resizeEvent = iEvent;
    const resizeOptions = interaction.interactable.options.resize;
    const invert = resizeOptions.invert;
    const invertible = invert === 'reposition' || invert === 'negate';
    const current = interaction.rect;
    const {
      start: startRect,
      corrected,
      delta: deltaRect,
      previous
    } = interaction._rects;
    extend(previous, corrected);
    if (invertible) {
      // if invertible, copy the current rect
      extend(corrected, current);
      if (invert === 'reposition') {
        // swap edge values if necessary to keep width/height positive
        if (corrected.top > corrected.bottom) {
          const swap = corrected.top;
          corrected.top = corrected.bottom;
          corrected.bottom = swap;
        }
        if (corrected.left > corrected.right) {
          const swap = corrected.left;
          corrected.left = corrected.right;
          corrected.right = swap;
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
    for (const edge in corrected) {
      deltaRect[edge] = corrected[edge] - previous[edge];
    }
    resizeEvent.edges = interaction.prepared.edges;
    resizeEvent.rect = corrected;
    resizeEvent.deltaRect = deltaRect;
  }
  function end$1({
    iEvent,
    interaction
  }) {
    if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) return;
    const resizeEvent = iEvent;
    resizeEvent.edges = interaction.prepared.edges;
    resizeEvent.rect = interaction._rects.corrected;
    resizeEvent.deltaRect = interaction._rects.delta;
  }
  function updateEventAxes({
    iEvent,
    interaction
  }) {
    if (interaction.prepared.name !== 'resize' || !interaction.resizeAxes) return;
    const options = interaction.interactable.options;
    const resizeEvent = iEvent;
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
  const resize = {
    id: 'actions/resize',
    before: ['actions/drag'],
    install: install$d,
    listeners: {
      'interactions:new': ({
        interaction
      }) => {
        interaction.resizeAxes = 'xy';
      },
      'interactions:action-start': arg => {
        start$7(arg);
        updateEventAxes(arg);
      },
      'interactions:action-move': arg => {
        move(arg);
        updateEventAxes(arg);
      },
      'interactions:action-end': end$1,
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
    getCursor({
      edges,
      axis,
      name
    }) {
      const cursors = resize.cursors;
      let result = null;
      if (axis) {
        result = cursors[name + axis];
      } else if (edges) {
        let cursorKey = '';
        var _arr = ['top', 'bottom', 'left', 'right'];
        for (var _i = 0; _i < _arr.length; _i++) {
          const edge = _arr[_i];
          if (edges[edge]) {
            cursorKey += edge;
          }
        }
        result = cursors[cursorKey];
      }
      return result;
    },
    filterEventType: type => type.search('resize') === 0,
    defaultMargin: null
  };
  var resize$1 = resize;

  /* eslint-disable import/no-duplicates -- for typescript module augmentations */
  /* eslint-enable import/no-duplicates */

  var actions = {
    id: 'actions',
    install(scope) {
      scope.usePlugin(gesture$1);
      scope.usePlugin(resize$1);
      scope.usePlugin(drag$1);
      scope.usePlugin(drop$1);
    }
  };

  let lastTime = 0;
  let request;
  let cancel;
  function init(global) {
    request = global.requestAnimationFrame;
    cancel = global.cancelAnimationFrame;
    if (!request) {
      const vendors = ['ms', 'moz', 'webkit', 'o'];
      for (var _i = 0; _i < vendors.length; _i++) {
        const vendor = vendors[_i];
        request = global[`${vendor}RequestAnimationFrame`];
        cancel = global[`${vendor}CancelAnimationFrame`] || global[`${vendor}CancelRequestAnimationFrame`];
      }
    }
    request = request && request.bind(global);
    cancel = cancel && cancel.bind(global);
    if (!request) {
      request = callback => {
        const currTime = Date.now();
        const timeToCall = Math.max(0, 16 - (currTime - lastTime));
        const token = global.setTimeout(() => {
          // eslint-disable-next-line n/no-callback-literal
          callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return token;
      };
      cancel = token => clearTimeout(token);
    }
  }
  var raf = {
    request: callback => request(callback),
    cancel: token => cancel(token),
    init
  };

  function install$c(scope) {
    const {
      defaults,
      actions
    } = scope;
    scope.autoScroll = autoScroll;
    autoScroll.now = () => scope.now();
    actions.phaselessTypes.autoscroll = true;
    defaults.perAction.autoScroll = autoScroll.defaults;
  }
  const autoScroll = {
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
    start(interaction) {
      autoScroll.isScrolling = true;
      raf.cancel(autoScroll.i);
      interaction.autoScroll = autoScroll;
      autoScroll.interaction = interaction;
      autoScroll.prevTime = autoScroll.now();
      autoScroll.i = raf.request(autoScroll.scroll);
    },
    stop() {
      autoScroll.isScrolling = false;
      if (autoScroll.interaction) {
        autoScroll.interaction.autoScroll = null;
      }
      raf.cancel(autoScroll.i);
    },
    // scroll the window by the values in scroll.x/y
    scroll() {
      const {
        interaction
      } = autoScroll;
      const {
        interactable,
        element
      } = interaction;
      const actionName = interaction.prepared.name;
      const options = interactable.options[actionName].autoScroll;
      const container = getContainer(options.container, interactable, element);
      const now = autoScroll.now();
      // change in time in seconds
      const dt = (now - autoScroll.prevTime) / 1000;
      // displacement
      const s = options.speed * dt;
      if (s >= 1) {
        const scrollBy = {
          x: autoScroll.x * s,
          y: autoScroll.y * s
        };
        if (scrollBy.x || scrollBy.y) {
          const prevScroll = getScroll(container);
          if (is.window(container)) {
            container.scrollBy(scrollBy.x, scrollBy.y);
          } else if (container) {
            container.scrollLeft += scrollBy.x;
            container.scrollTop += scrollBy.y;
          }
          const curScroll = getScroll(container);
          const delta = {
            x: curScroll.x - prevScroll.x,
            y: curScroll.y - prevScroll.y
          };
          if (delta.x || delta.y) {
            interactable.fire({
              type: 'autoscroll',
              target: element,
              interactable,
              delta,
              interaction,
              container
            });
          }
        }
        autoScroll.prevTime = now;
      }
      if (autoScroll.isScrolling) {
        raf.cancel(autoScroll.i);
        autoScroll.i = raf.request(autoScroll.scroll);
      }
    },
    check(interactable, actionName) {
      var _options$actionName$a;
      const options = interactable.options;
      return (_options$actionName$a = options[actionName].autoScroll) == null ? void 0 : _options$actionName$a.enabled;
    },
    onInteractionMove({
      interaction,
      pointer
    }) {
      if (!(interaction.interacting() && autoScroll.check(interaction.interactable, interaction.prepared.name))) {
        return;
      }
      if (interaction.simulation) {
        autoScroll.x = autoScroll.y = 0;
        return;
      }
      let top;
      let right;
      let bottom;
      let left;
      const {
        interactable,
        element
      } = interaction;
      const actionName = interaction.prepared.name;
      const options = interactable.options[actionName].autoScroll;
      const container = getContainer(options.container, interactable, element);
      if (is.window(container)) {
        left = pointer.clientX < autoScroll.margin;
        top = pointer.clientY < autoScroll.margin;
        right = pointer.clientX > container.innerWidth - autoScroll.margin;
        bottom = pointer.clientY > container.innerHeight - autoScroll.margin;
      } else {
        const rect = getElementClientRect(container);
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
    return (is.string(value) ? getStringOptionResult(value, interactable, element) : value) || getWindow(element);
  }
  function getScroll(container) {
    if (is.window(container)) {
      container = window.document.body;
    }
    return {
      x: container.scrollLeft,
      y: container.scrollTop
    };
  }
  const autoScrollPlugin = {
    id: 'auto-scroll',
    install: install$c,
    listeners: {
      'interactions:new': ({
        interaction
      }) => {
        interaction.autoScroll = null;
      },
      'interactions:destroy': ({
        interaction
      }) => {
        interaction.autoScroll = null;
        autoScroll.stop();
        if (autoScroll.interaction) {
          autoScroll.interaction = null;
        }
      },
      'interactions:stop': autoScroll.stop,
      'interactions:action-move': arg => autoScroll.onInteractionMove(arg)
    }
  };
  var autoScroll$1 = autoScrollPlugin;

  function warnOnce(method, message) {
    let warned = false;
    return function () {
      if (!warned) {
        win.console.warn(message);
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

  function install$b(scope) {
    const {
      Interactable // tslint:disable-line no-shadowed-variable
    } = scope;
    Interactable.prototype.getAction = function getAction(pointer, event, interaction, element) {
      const action = defaultActionChecker(this, event, interaction, element, scope);
      if (this.options.actionChecker) {
        return this.options.actionChecker(pointer, event, action, this, element, interaction);
      }
      return action;
    };
    Interactable.prototype.ignoreFrom = warnOnce(function (newValue) {
      return this._backCompatOption('ignoreFrom', newValue);
    }, 'Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue}).');
    Interactable.prototype.allowFrom = warnOnce(function (newValue) {
      return this._backCompatOption('allowFrom', newValue);
    }, 'Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue}).');
    Interactable.prototype.actionChecker = actionChecker;
    Interactable.prototype.styleCursor = styleCursor;
  }
  function defaultActionChecker(interactable, event, interaction, element, scope) {
    const rect = interactable.getRect(element);
    const buttons = event.buttons || {
      0: 1,
      1: 4,
      3: 8,
      4: 16
    }[event.button];
    const arg = {
      action: null,
      interactable,
      interaction,
      element,
      rect,
      buttons
    };
    scope.fire('auto-start:check', arg);
    return arg.action;
  }
  function styleCursor(newValue) {
    if (is.bool(newValue)) {
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
    if (is.func(checker)) {
      this.options.actionChecker = checker;
      return this;
    }
    if (checker === null) {
      delete this.options.actionChecker;
      return this;
    }
    return this.options.actionChecker;
  }
  var InteractableMethods = {
    id: 'auto-start/interactableMethods',
    install: install$b
  };

  /* eslint-enable import/no-duplicates */

  function install$a(scope) {
    const {
      interactStatic: interact,
      defaults
    } = scope;
    scope.usePlugin(InteractableMethods);
    defaults.base.actionChecker = null;
    defaults.base.styleCursor = true;
    extend(defaults.perAction, {
      manualStart: false,
      max: Infinity,
      maxPerElement: 1,
      allowFrom: null,
      ignoreFrom: null,
      // only allow left button by default
      // see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons#Return_value
      mouseButtons: 1
    });
    interact.maxInteractions = newValue => maxInteractions(newValue, scope);
    scope.autoStart = {
      // Allow this many interactions to happen simultaneously
      maxInteractions: Infinity,
      withinInteractionLimit,
      cursorElement: null
    };
  }
  function prepareOnDown({
    interaction,
    pointer,
    event,
    eventTarget
  }, scope) {
    if (interaction.interacting()) return;
    const actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
    prepare(interaction, actionInfo, scope);
  }
  function prepareOnMove({
    interaction,
    pointer,
    event,
    eventTarget
  }, scope) {
    if (interaction.pointerType !== 'mouse' || interaction.pointerIsDown || interaction.interacting()) return;
    const actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
    prepare(interaction, actionInfo, scope);
  }
  function startOnMove(arg, scope) {
    const {
      interaction
    } = arg;
    if (!interaction.pointerIsDown || interaction.interacting() || !interaction.pointerWasMoved || !interaction.prepared.name) {
      return;
    }
    scope.fire('autoStart:before-start', arg);
    const {
      interactable
    } = interaction;
    const actionName = interaction.prepared.name;
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
  function clearCursorOnStop({
    interaction
  }, scope) {
    const {
      interactable
    } = interaction;
    if (interactable && interactable.options.styleCursor) {
      setCursor(interaction.element, '', scope);
    }
  }

  // Check if the current interactable supports the action.
  // If so, return the validated action. Otherwise, return null
  function validateAction(action, interactable, element, eventTarget, scope) {
    if (interactable.testIgnoreAllow(interactable.options[action.name], element, eventTarget) && interactable.options[action.name].enabled && withinInteractionLimit(interactable, element, action, scope)) {
      return action;
    }
    return null;
  }
  function validateMatches(interaction, pointer, event, matches, matchElements, eventTarget, scope) {
    for (let i = 0, len = matches.length; i < len; i++) {
      const match = matches[i];
      const matchElement = matchElements[i];
      const matchAction = match.getAction(pointer, event, interaction, matchElement);
      if (!matchAction) {
        continue;
      }
      const action = validateAction(matchAction, match, matchElement, eventTarget, scope);
      if (action) {
        return {
          action,
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
    let matches = [];
    let matchElements = [];
    let element = eventTarget;
    function pushMatches(interactable) {
      matches.push(interactable);
      matchElements.push(element);
    }
    while (is.element(element)) {
      matches = [];
      matchElements = [];
      scope.interactables.forEachMatch(element, pushMatches);
      const actionInfo = validateMatches(interaction, pointer, event, matches, matchElements, eventTarget, scope);
      if (actionInfo.action && !actionInfo.interactable.options[actionInfo.action.name].manualStart) {
        return actionInfo;
      }
      element = parentNode(element);
    }
    return {
      action: null,
      interactable: null,
      element: null
    };
  }
  function prepare(interaction, {
    action,
    interactable,
    element
  }, scope) {
    action = action || {
      name: null
    };
    interaction.interactable = interactable;
    interaction.element = element;
    copyAction(interaction.prepared, action);
    interaction.rect = interactable && action.name ? interactable.getRect(element) : null;
    setInteractionCursor(interaction, scope);
    scope.fire('autoStart:prepared', {
      interaction
    });
  }
  function withinInteractionLimit(interactable, element, action, scope) {
    const options = interactable.options;
    const maxActions = options[action.name].max;
    const maxPerElement = options[action.name].maxPerElement;
    const autoStartMax = scope.autoStart.maxInteractions;
    let activeInteractions = 0;
    let interactableCount = 0;
    let elementCount = 0;

    // no actions if any of these values == 0
    if (!(maxActions && maxPerElement && autoStartMax)) {
      return false;
    }
    for (var _i = 0; _i < scope.interactions.list.length; _i++) {
      var _ref;
      _ref = scope.interactions.list[_i];
      const interaction = _ref;
      const otherAction = interaction.prepared.name;
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
    if (is.number(newValue)) {
      scope.autoStart.maxInteractions = newValue;
      return this;
    }
    return scope.autoStart.maxInteractions;
  }
  function setCursor(element, cursor, scope) {
    const {
      cursorElement: prevCursorElement
    } = scope.autoStart;
    if (prevCursorElement && prevCursorElement !== element) {
      prevCursorElement.style.cursor = '';
    }
    element.ownerDocument.documentElement.style.cursor = cursor;
    element.style.cursor = cursor;
    scope.autoStart.cursorElement = cursor ? element : null;
  }
  function setInteractionCursor(interaction, scope) {
    const {
      interactable,
      element,
      prepared
    } = interaction;
    if (!(interaction.pointerType === 'mouse' && interactable && interactable.options.styleCursor)) {
      // clear previous target element cursor
      if (scope.autoStart.cursorElement) {
        setCursor(scope.autoStart.cursorElement, '', scope);
      }
      return;
    }
    let cursor = '';
    if (prepared.name) {
      const cursorChecker = interactable.options[prepared.name].cursorChecker;
      if (is.func(cursorChecker)) {
        cursor = cursorChecker(prepared, interactable, element, interaction._interacting);
      } else {
        cursor = scope.actions.map[prepared.name].getCursor(prepared);
      }
    }
    setCursor(interaction.element, cursor || '', scope);
  }
  const autoStart$1 = {
    id: 'auto-start/base',
    before: ['actions'],
    install: install$a,
    listeners: {
      'interactions:down': prepareOnDown,
      'interactions:move': (arg, scope) => {
        prepareOnMove(arg, scope);
        startOnMove(arg, scope);
      },
      'interactions:stop': clearCursorOnStop
    },
    maxInteractions,
    withinInteractionLimit,
    validateAction
  };
  var autoStart$2 = autoStart$1;

  function beforeStart({
    interaction,
    eventTarget,
    dx,
    dy
  }, scope) {
    if (interaction.prepared.name !== 'drag') return;

    // check if a drag is in the correct axis
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const targetOptions = interaction.interactable.options.drag;
    const startAxis = targetOptions.startAxis;
    const currentAxis = absX > absY ? 'x' : absX < absY ? 'y' : 'xy';
    interaction.prepared.axis = targetOptions.lockAxis === 'start' ? currentAxis[0] // always lock to one axis even if currentAxis === 'xy'
    : targetOptions.lockAxis;

    // if the movement isn't in the startAxis of the interactable
    if (currentAxis !== 'xy' && startAxis !== 'xy' && startAxis !== currentAxis) {
      interaction.prepared.name = null;

      // then try to get a drag from another ineractable
      let element = eventTarget;
      const getDraggable = function (interactable) {
        if (interactable === interaction.interactable) return;
        const options = interaction.interactable.options.drag;
        if (!options.manualStart && interactable.testIgnoreAllow(options, element, eventTarget)) {
          const action = interactable.getAction(interaction.downPointer, interaction.downEvent, interaction, element);
          if (action && action.name === 'drag' && checkStartAxis(currentAxis, interactable) && autoStart$2.validateAction(action, interactable, element, eventTarget, scope)) {
            return interactable;
          }
        }
      };

      // check all interactables
      while (is.element(element)) {
        const interactable = scope.interactables.forEachMatch(element, getDraggable);
        if (interactable) {
          interaction.prepared.name = 'drag';
          interaction.interactable = interactable;
          interaction.element = element;
          break;
        }
        element = parentNode(element);
      }
    }
  }
  function checkStartAxis(startAxis, interactable) {
    if (!interactable) {
      return false;
    }
    const thisAxis = interactable.options.drag.startAxis;
    return startAxis === 'xy' || thisAxis === 'xy' || thisAxis === startAxis;
  }
  var dragAxis = {
    id: 'auto-start/dragAxis',
    listeners: {
      'autoStart:before-start': beforeStart
    }
  };

  /* eslint-disable import/no-duplicates -- for typescript module augmentations */
  /* eslint-enable */

  function install$9(scope) {
    const {
      defaults
    } = scope;
    scope.usePlugin(autoStart$2);
    defaults.perAction.hold = 0;
    defaults.perAction.delay = 0;
  }
  function getHoldDuration(interaction) {
    const actionName = interaction.prepared && interaction.prepared.name;
    if (!actionName) {
      return null;
    }
    const options = interaction.interactable.options;
    return options[actionName].hold || options[actionName].delay;
  }
  const hold = {
    id: 'auto-start/hold',
    install: install$9,
    listeners: {
      'interactions:new': ({
        interaction
      }) => {
        interaction.autoStartHoldTimer = null;
      },
      'autoStart:prepared': ({
        interaction
      }) => {
        const hold = getHoldDuration(interaction);
        if (hold > 0) {
          interaction.autoStartHoldTimer = setTimeout(() => {
            interaction.start(interaction.prepared, interaction.interactable, interaction.element);
          }, hold);
        }
      },
      'interactions:move': ({
        interaction,
        duplicate
      }) => {
        if (interaction.autoStartHoldTimer && interaction.pointerWasMoved && !duplicate) {
          clearTimeout(interaction.autoStartHoldTimer);
          interaction.autoStartHoldTimer = null;
        }
      },
      // prevent regular down->move autoStart
      'autoStart:before-start': ({
        interaction
      }) => {
        const holdDuration = getHoldDuration(interaction);
        if (holdDuration > 0) {
          interaction.prepared.name = null;
        }
      }
    },
    getHoldDuration
  };
  var hold$1 = hold;

  /* eslint-disable import/no-duplicates -- for typescript module augmentations */
  /* eslint-enable import/no-duplicates */

  var autoStart = {
    id: 'auto-start',
    install(scope) {
      scope.usePlugin(autoStart$2);
      scope.usePlugin(hold$1);
      scope.usePlugin(dragAxis);
    }
  };

  const preventDefault = function preventDefault(newValue) {
    if (/^(always|never|auto)$/.test(newValue)) {
      this.options.preventDefault = newValue;
      return this;
    }
    if (is.bool(newValue)) {
      this.options.preventDefault = newValue ? 'always' : 'never';
      return this;
    }
    return this.options.preventDefault;
  };
  function checkAndPreventDefault(interactable, scope, event) {
    const setting = interactable.options.preventDefault;
    if (setting === 'never') return;
    if (setting === 'always') {
      event.preventDefault();
      return;
    }

    // setting === 'auto'

    // if the browser supports passive event listeners and isn't running on iOS,
    // don't preventDefault of touch{start,move} events. CSS touch-action and
    // user-select should be used instead of calling event.preventDefault().
    if (scope.events.supportsPassive && /^touch(start|move)$/.test(event.type)) {
      const doc = getWindow(event.target).document;
      const docOptions = scope.getDocOptions(doc);
      if (!(docOptions && docOptions.events) || docOptions.events.passive !== false) {
        return;
      }
    }

    // don't preventDefault of pointerdown events
    if (/^(mouse|pointer|touch)*(down|start)/i.test(event.type)) {
      return;
    }

    // don't preventDefault on editable elements
    if (is.element(event.target) && matchesSelector(event.target, 'input,select,textarea,[contenteditable=true],[contenteditable=true] *')) {
      return;
    }
    event.preventDefault();
  }
  function onInteractionEvent({
    interaction,
    event
  }) {
    if (interaction.interactable) {
      interaction.interactable.checkAndPreventDefault(event);
    }
  }
  function install$8(scope) {
    const {
      Interactable
    } = scope;
    Interactable.prototype.preventDefault = preventDefault;
    Interactable.prototype.checkAndPreventDefault = function (event) {
      return checkAndPreventDefault(this, scope, event);
    };

    // prevent native HTML5 drag on interact.js target elements
    scope.interactions.docEvents.push({
      type: 'dragstart',
      listener(event) {
        for (var _i = 0; _i < scope.interactions.list.length; _i++) {
          var _ref;
          _ref = scope.interactions.list[_i];
          const interaction = _ref;
          if (interaction.element && (interaction.element === event.target || nodeContains(interaction.element, event.target))) {
            interaction.interactable.checkAndPreventDefault(event);
            return;
          }
        }
      }
    });
  }
  var interactablePreventDefault = {
    id: 'core/interactablePreventDefault',
    install: install$8,
    listeners: ['down', 'move', 'up', 'cancel'].reduce((acc, eventType) => {
      acc[`interactions:${eventType}`] = onInteractionEvent;
      return acc;
    }, {})
  };

  function isNonNativeEvent(type, actions) {
    if (actions.phaselessTypes[type]) {
      return true;
    }
    for (const name in actions.map) {
      if (type.indexOf(name) === 0 && type.substr(name.length) in actions.phases) {
        return true;
      }
    }
    return false;
  }

  var visualizer = {};

  /* eslint-enable import/no-duplicates */
  var CheckName = /*#__PURE__*/function (CheckName) {
    CheckName["touchAction"] = "touchAction";
    CheckName["boxSizing"] = "boxSizing";
    CheckName["noListeners"] = "noListeners";
    return CheckName;
  }(CheckName || {});
  const prefix = '[interact.js] ';
  const links = {
    touchAction: 'https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action',
    boxSizing: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing'
  };

  // eslint-disable-next-line no-undef
  const isProduction = "development" === 'production';
  function install$7(scope, {
    logger
  } = {}) {
    const {
      Interactable,
      defaults
    } = scope;
    scope.logger = logger || console;
    defaults.base.devTools = {
      ignore: {}
    };
    Interactable.prototype.devTools = function (options) {
      if (options) {
        extend(this.options.devTools, options);
        return this;
      }
      return this.options.devTools;
    };

    // can't set native events on non string targets without `addEventListener` prop
    const {
      _onOff
    } = Interactable.prototype;
    Interactable.prototype._onOff = function (method, typeArg, listenerArg, options, filter) {
      if (is.string(this.target) || this.target.addEventListener) {
        return _onOff.call(this, method, typeArg, listenerArg, options, filter);
      }
      if (is.object(typeArg) && !is.array(typeArg)) {
        options = listenerArg;
        listenerArg = null;
      }
      const normalizedListeners = normalize(typeArg, listenerArg, filter);
      for (const type in normalizedListeners) {
        if (isNonNativeEvent(type, scope.actions)) continue;
        scope.logger.warn(prefix + `Can't add native "${type}" event listener to target without \`addEventListener(type, listener, options)\` prop.`);
      }
      return _onOff.call(this, method, normalizedListeners, options);
    };
    scope.usePlugin(visualizer);
  }
  const checks = [{
    name: CheckName.touchAction,
    perform({
      element
    }) {
      return !!element && !parentHasStyle(element, 'touchAction', /pan-|pinch|none/);
    },
    getInfo({
      element
    }) {
      return [element, links.touchAction];
    },
    text: 'Consider adding CSS "touch-action: none" to this element\n'
  }, {
    name: CheckName.boxSizing,
    perform(interaction) {
      const {
        element
      } = interaction;
      return interaction.prepared.name === 'resize' && element instanceof domObjects$1.HTMLElement && !hasStyle(element, 'boxSizing', /border-box/);
    },
    text: 'Consider adding CSS "box-sizing: border-box" to this resizable element',
    getInfo({
      element
    }) {
      return [element, links.boxSizing];
    }
  }, {
    name: CheckName.noListeners,
    perform(interaction) {
      var _interaction$interact;
      const actionName = interaction.prepared.name;
      const moveListeners = ((_interaction$interact = interaction.interactable) == null ? void 0 : _interaction$interact.events.types[`${actionName}move`]) || [];
      return !moveListeners.length;
    },
    getInfo(interaction) {
      return [interaction.prepared.name, interaction.interactable];
    },
    text: 'There are no listeners set for this action'
  }];
  function hasStyle(element, prop, styleRe) {
    const value = element.style[prop] || win.getComputedStyle(element)[prop];
    return styleRe.test((value || '').toString());
  }
  function parentHasStyle(element, prop, styleRe) {
    let parent = element;
    while (is.element(parent)) {
      if (hasStyle(parent, prop, styleRe)) {
        return true;
      }
      parent = parentNode(parent);
    }
    return false;
  }
  const id = 'dev-tools';
  const defaultExport = isProduction ? {
    id,
    install: () => {}
  } : {
    id,
    install: install$7,
    listeners: {
      'interactions:action-start': ({
        interaction
      }, scope) => {
        for (var _i = 0; _i < checks.length; _i++) {
          var _ref;
          _ref = checks[_i];
          const check = _ref;
          const options = interaction.interactable && interaction.interactable.options;
          if (!(options && options.devTools && options.devTools.ignore[check.name]) && check.perform(interaction)) {
            scope.logger.warn(prefix + check.text, ...check.getInfo(interaction));
          }
        }
      }
    },
    checks,
    CheckName,
    links,
    prefix
  };
  var devTools = defaultExport;

  // tslint:disable-next-line ban-types
  function clone(source) {
    const dest = {};
    for (const prop in source) {
      const value = source[prop];
      if (is.plainObject(value)) {
        dest[prop] = clone(value);
      } else if (is.array(value)) {
        dest[prop] = from(value);
      } else {
        dest[prop] = value;
      }
    }
    return dest;
  }

  class Modification {
    states = [];
    startOffset = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    };
    startDelta;
    result;
    endResult;
    startEdges;
    edges;
    interaction;
    constructor(interaction) {
      this.interaction = interaction;
      this.result = createResult();
      this.edges = {
        left: false,
        right: false,
        top: false,
        bottom: false
      };
    }
    start({
      phase
    }, pageCoords) {
      const {
        interaction
      } = this;
      const modifierList = getModifierList(interaction);
      this.prepareStates(modifierList);
      this.startEdges = extend({}, interaction.edges);
      this.edges = extend({}, this.startEdges);
      this.startOffset = getRectOffset(interaction.rect, pageCoords);
      this.startDelta = {
        x: 0,
        y: 0
      };
      const arg = this.fillArg({
        phase,
        pageCoords,
        preEnd: false
      });
      this.result = createResult();
      this.startAll(arg);
      const result = this.result = this.setAll(arg);
      return result;
    }
    fillArg(arg) {
      const {
        interaction
      } = this;
      arg.interaction = interaction;
      arg.interactable = interaction.interactable;
      arg.element = interaction.element;
      arg.rect || (arg.rect = interaction.rect);
      arg.edges || (arg.edges = this.startEdges);
      arg.startOffset = this.startOffset;
      return arg;
    }
    startAll(arg) {
      for (var _i = 0; _i < this.states.length; _i++) {
        var _ref;
        _ref = this.states[_i];
        const state = _ref;
        if (state.methods.start) {
          arg.state = state;
          state.methods.start(arg);
        }
      }
    }
    setAll(arg) {
      const {
        phase,
        preEnd,
        skipModifiers,
        rect: unmodifiedRect,
        edges: unmodifiedEdges
      } = arg;
      arg.coords = extend({}, arg.pageCoords);
      arg.rect = extend({}, unmodifiedRect);
      arg.edges = extend({}, unmodifiedEdges);
      const states = skipModifiers ? this.states.slice(skipModifiers) : this.states;
      const newResult = createResult(arg.coords, arg.rect);
      for (var _i2 = 0; _i2 < states.length; _i2++) {
        var _state$methods;
        var _ref2;
        _ref2 = states[_i2];
        const state = _ref2;
        const {
          options
        } = state;
        const lastModifierCoords = extend({}, arg.coords);
        let returnValue = null;
        if ((_state$methods = state.methods) != null && _state$methods.set && this.shouldDo(options, preEnd, phase)) {
          arg.state = state;
          returnValue = state.methods.set(arg);
          addEdges(arg.edges, arg.rect, {
            x: arg.coords.x - lastModifierCoords.x,
            y: arg.coords.y - lastModifierCoords.y
          });
        }
        newResult.eventProps.push(returnValue);
      }
      extend(this.edges, arg.edges);
      newResult.delta.x = arg.coords.x - arg.pageCoords.x;
      newResult.delta.y = arg.coords.y - arg.pageCoords.y;
      newResult.rectDelta.left = arg.rect.left - unmodifiedRect.left;
      newResult.rectDelta.right = arg.rect.right - unmodifiedRect.right;
      newResult.rectDelta.top = arg.rect.top - unmodifiedRect.top;
      newResult.rectDelta.bottom = arg.rect.bottom - unmodifiedRect.bottom;
      const prevCoords = this.result.coords;
      const prevRect = this.result.rect;
      if (prevCoords && prevRect) {
        const rectChanged = newResult.rect.left !== prevRect.left || newResult.rect.right !== prevRect.right || newResult.rect.top !== prevRect.top || newResult.rect.bottom !== prevRect.bottom;
        newResult.changed = rectChanged || prevCoords.x !== newResult.coords.x || prevCoords.y !== newResult.coords.y;
      }
      return newResult;
    }
    applyToInteraction(arg) {
      const {
        interaction
      } = this;
      const {
        phase
      } = arg;
      const curCoords = interaction.coords.cur;
      const startCoords = interaction.coords.start;
      const {
        result,
        startDelta
      } = this;
      const curDelta = result.delta;
      if (phase === 'start') {
        extend(this.startDelta, result.delta);
      }
      for (var _i3 = 0; _i3 < [[startCoords, startDelta], [curCoords, curDelta]].length; _i3++) {
        var _ref3;
        _ref3 = [[startCoords, startDelta], [curCoords, curDelta]][_i3];
        const [coordsSet, delta] = _ref3;
        coordsSet.page.x += delta.x;
        coordsSet.page.y += delta.y;
        coordsSet.client.x += delta.x;
        coordsSet.client.y += delta.y;
      }
      const {
        rectDelta
      } = this.result;
      const rect = arg.rect || interaction.rect;
      rect.left += rectDelta.left;
      rect.right += rectDelta.right;
      rect.top += rectDelta.top;
      rect.bottom += rectDelta.bottom;
      rect.width = rect.right - rect.left;
      rect.height = rect.bottom - rect.top;
    }
    setAndApply(arg) {
      const {
        interaction
      } = this;
      const {
        phase,
        preEnd,
        skipModifiers
      } = arg;
      const result = this.setAll(this.fillArg({
        preEnd,
        phase,
        pageCoords: arg.modifiedCoords || interaction.coords.cur.page
      }));
      this.result = result;

      // don't fire an action move if a modifier would keep the event in the same
      // cordinates as before
      if (!result.changed && (!skipModifiers || skipModifiers < this.states.length) && interaction.interacting()) {
        return false;
      }
      if (arg.modifiedCoords) {
        const {
          page
        } = interaction.coords.cur;
        const adjustment = {
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
    beforeEnd(arg) {
      const {
        interaction,
        event
      } = arg;
      const states = this.states;
      if (!states || !states.length) {
        return;
      }
      let doPreend = false;
      for (var _i4 = 0; _i4 < states.length; _i4++) {
        var _ref4;
        _ref4 = states[_i4];
        const state = _ref4;
        arg.state = state;
        const {
          options,
          methods
        } = state;
        const endPosition = methods.beforeEnd && methods.beforeEnd(arg);
        if (endPosition) {
          this.endResult = endPosition;
          return false;
        }
        doPreend = doPreend || !doPreend && this.shouldDo(options, true, arg.phase, true);
      }
      if (doPreend) {
        // trigger a final modified move before ending
        interaction.move({
          event,
          preEnd: true
        });
      }
    }
    stop(arg) {
      const {
        interaction
      } = arg;
      if (!this.states || !this.states.length) {
        return;
      }
      const modifierArg = extend({
        states: this.states,
        interactable: interaction.interactable,
        element: interaction.element,
        rect: null
      }, arg);
      this.fillArg(modifierArg);
      for (var _i5 = 0; _i5 < this.states.length; _i5++) {
        var _ref5;
        _ref5 = this.states[_i5];
        const state = _ref5;
        modifierArg.state = state;
        if (state.methods.stop) {
          state.methods.stop(modifierArg);
        }
      }
      this.states = null;
      this.endResult = null;
    }
    prepareStates(modifierList) {
      this.states = [];
      for (let index = 0; index < modifierList.length; index++) {
        const {
          options,
          methods,
          name
        } = modifierList[index];
        this.states.push({
          options,
          methods,
          index,
          name
        });
      }
      return this.states;
    }
    restoreInteractionCoords({
      interaction: {
        coords,
        rect,
        modification
      }
    }) {
      if (!modification.result) return;
      const {
        startDelta
      } = modification;
      const {
        delta: curDelta,
        rectDelta
      } = modification.result;
      const coordsAndDeltas = [[coords.start, startDelta], [coords.cur, curDelta]];
      for (var _i6 = 0; _i6 < coordsAndDeltas.length; _i6++) {
        var _ref6;
        _ref6 = coordsAndDeltas[_i6];
        const [coordsSet, delta] = _ref6;
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
    shouldDo(options, preEnd, phase, requireEndOnly) {
      if (
      // ignore disabled modifiers
      !options || options.enabled === false ||
      // check if we require endOnly option to fire move before end
      requireEndOnly && !options.endOnly ||
      // don't apply endOnly modifiers when not ending
      options.endOnly && !preEnd ||
      // check if modifier should run be applied on start
      phase === 'start' && !options.setStart) {
        return false;
      }
      return true;
    }
    copyFrom(other) {
      this.startOffset = other.startOffset;
      this.startDelta = other.startDelta;
      this.startEdges = other.startEdges;
      this.edges = other.edges;
      this.states = other.states.map(s => clone(s));
      this.result = createResult(extend({}, other.result.coords), extend({}, other.result.rect));
    }
    destroy() {
      for (const prop in this) {
        this[prop] = null;
      }
    }
  }
  function createResult(coords, rect) {
    return {
      rect,
      coords,
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
    const actionOptions = interaction.interactable.options[interaction.prepared.name];
    const actionModifiers = actionOptions.modifiers;
    if (actionModifiers && actionModifiers.length) {
      return actionModifiers;
    }
    return ['snap', 'snapSize', 'snapEdges', 'restrict', 'restrictEdges', 'restrictSize'].map(type => {
      const options = actionOptions[type];
      return options && options.enabled && {
        options,
        methods: options._methods
      };
    }).filter(m => !!m);
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

  function makeModifier(module, name) {
    const {
      defaults
    } = module;
    const methods = {
      start: module.start,
      set: module.set,
      beforeEnd: module.beforeEnd,
      stop: module.stop
    };
    const modifier = _options => {
      const options = _options || {};
      options.enabled = options.enabled !== false;

      // add missing defaults to options
      for (const prop in defaults) {
        if (!(prop in options)) {
          options[prop] = defaults[prop];
        }
      }
      const m = {
        options,
        methods,
        name,
        enable: () => {
          options.enabled = true;
          return m;
        },
        disable: () => {
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
  function addEventModifiers({
    iEvent,
    interaction
  }) {
    const result = interaction.modification.result;
    if (result) {
      iEvent.modifiers = result.eventProps;
    }
  }
  const modifiersBase = {
    id: 'modifiers/base',
    before: ['actions'],
    install: scope => {
      scope.defaults.perAction.modifiers = [];
    },
    listeners: {
      'interactions:new': ({
        interaction
      }) => {
        interaction.modification = new Modification(interaction);
      },
      'interactions:before-action-start': arg => {
        const {
          interaction
        } = arg;
        const modification = arg.interaction.modification;
        modification.start(arg, interaction.coords.start.page);
        interaction.edges = modification.edges;
        modification.applyToInteraction(arg);
      },
      'interactions:before-action-move': arg => {
        const {
          interaction
        } = arg;
        const {
          modification
        } = interaction;
        const ret = modification.setAndApply(arg);
        interaction.edges = modification.edges;
        return ret;
      },
      'interactions:before-action-end': arg => {
        const {
          interaction
        } = arg;
        const {
          modification
        } = interaction;
        const ret = modification.beforeEnd(arg);
        interaction.edges = modification.startEdges;
        return ret;
      },
      'interactions:action-start': addEventModifiers,
      'interactions:action-move': addEventModifiers,
      'interactions:action-end': addEventModifiers,
      'interactions:after-action-start': arg => arg.interaction.modification.restoreInteractionCoords(arg),
      'interactions:after-action-move': arg => arg.interaction.modification.restoreInteractionCoords(arg),
      'interactions:stop': arg => arg.interaction.modification.stop(arg)
    }
  };
  var base = modifiersBase;

  // eslint-disable-next-line @typescript-eslint/no-empty-interface

  const defaults$7 = {
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

  // defined outside of class definition to avoid assignment of undefined during
  // construction

  class InteractEvent extends BaseEvent {
    relatedTarget = null;
    screenX;
    screenY;
    button;
    buttons;
    ctrlKey;
    shiftKey;
    altKey;
    metaKey;
    page;
    client;
    delta;
    rect;
    x0;
    y0;
    t0;
    dt;
    duration;
    clientX0;
    clientY0;
    velocity;
    speed;
    swipe;
    // resize
    axes;
    /** @internal */
    preEnd;
    constructor(interaction, event, actionName, phase, element, preEnd, type) {
      super(interaction);
      element = element || interaction.element;
      const target = interaction.interactable;
      const deltaSource = (target && target.options || defaults$7).deltaSource;
      const origin = getOriginXY(target, element, actionName);
      const starting = phase === 'start';
      const ending = phase === 'end';
      const prevEvent = starting ? this : interaction.prevEvent;
      const coords = starting ? interaction.coords.start : ending ? {
        page: prevEvent.page,
        client: prevEvent.client,
        timeStamp: interaction.coords.cur.timeStamp
      } : interaction.coords.cur;
      this.page = extend({}, coords.page);
      this.client = extend({}, coords.client);
      this.rect = extend({}, interaction.rect);
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
      this.preEnd = preEnd;
      this.type = type || actionName + (phase || '');
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
      this.duration = this.timeStamp - this.t0;

      // velocity and speed in pixels per second
      this.velocity = extend({}, interaction.coords.velocity[deltaSource]);
      this.speed = hypot(this.velocity.x, this.velocity.y);
      this.swipe = ending || phase === 'inertiastart' ? this.getSwipe() : null;
    }
    getSwipe() {
      const interaction = this._interaction;
      if (interaction.prevEvent.speed < 600 || this.timeStamp - interaction.prevEvent.timeStamp > 150) {
        return null;
      }
      let angle = 180 * Math.atan2(interaction.prevEvent.velocityY, interaction.prevEvent.velocityX) / Math.PI;
      const overlap = 22.5;
      if (angle < 0) {
        angle += 360;
      }
      const left = 135 - overlap <= angle && angle < 225 + overlap;
      const up = 225 - overlap <= angle && angle < 315 + overlap;
      const right = !left && (315 - overlap <= angle || angle < 45 + overlap);
      const down = !up && 45 - overlap <= angle && angle < 135 + overlap;
      return {
        up,
        down,
        left,
        right,
        angle,
        speed: interaction.prevEvent.speed,
        velocity: {
          x: interaction.prevEvent.velocityX,
          y: interaction.prevEvent.velocityY
        }
      };
    }
    preventDefault() {}

    /**
     * Don't call listeners on the remaining targets
     */
    stopImmediatePropagation() {
      this.immediatePropagationStopped = this.propagationStopped = true;
    }

    /**
     * Don't call any other listeners (even on the current target)
     */
    stopPropagation() {
      this.propagationStopped = true;
    }
  }

  // getters and setters defined here to support typescript 3.6 and below which
  // don't support getter and setters in .d.ts files
  Object.defineProperties(InteractEvent.prototype, {
    pageX: {
      get() {
        return this.page.x;
      },
      set(value) {
        this.page.x = value;
      }
    },
    pageY: {
      get() {
        return this.page.y;
      },
      set(value) {
        this.page.y = value;
      }
    },
    clientX: {
      get() {
        return this.client.x;
      },
      set(value) {
        this.client.x = value;
      }
    },
    clientY: {
      get() {
        return this.client.y;
      },
      set(value) {
        this.client.y = value;
      }
    },
    dx: {
      get() {
        return this.delta.x;
      },
      set(value) {
        this.delta.x = value;
      }
    },
    dy: {
      get() {
        return this.delta.y;
      },
      set(value) {
        this.delta.y = value;
      }
    },
    velocityX: {
      get() {
        return this.velocity.x;
      },
      set(value) {
        this.velocity.x = value;
      }
    },
    velocityY: {
      get() {
        return this.velocity.y;
      },
      set(value) {
        this.velocity.y = value;
      }
    }
  });

  class PointerInfo {
    id;
    pointer;
    event;
    downTime;
    downTarget;
    constructor(id, pointer, event, downTime, downTarget) {
      this.id = id;
      this.pointer = pointer;
      this.event = event;
      this.downTime = downTime;
      this.downTarget = downTarget;
    }
  }

  let _ProxyValues = /*#__PURE__*/function (_ProxyValues) {
    _ProxyValues["interactable"] = "";
    _ProxyValues["element"] = "";
    _ProxyValues["prepared"] = "";
    _ProxyValues["pointerIsDown"] = "";
    _ProxyValues["pointerWasMoved"] = "";
    _ProxyValues["_proxy"] = "";
    return _ProxyValues;
  }({});
  let _ProxyMethods = /*#__PURE__*/function (_ProxyMethods) {
    _ProxyMethods["start"] = "";
    _ProxyMethods["move"] = "";
    _ProxyMethods["end"] = "";
    _ProxyMethods["stop"] = "";
    _ProxyMethods["interacting"] = "";
    return _ProxyMethods;
  }({});
  let idCounter = 0;
  class Interaction {
    /** current interactable being interacted with */
    interactable = null;

    /** the target element of the interactable */
    element = null;
    rect = null;
    /** @internal */
    _rects;
    /** @internal */
    edges = null;

    /** @internal */
    _scopeFire;

    // action that's ready to be fired on next move event
    prepared = {
      name: null,
      axis: null,
      edges: null
    };
    pointerType;

    /** @internal keep track of added pointers */
    pointers = [];

    /** @internal pointerdown/mousedown/touchstart event */
    downEvent = null;

    /** @internal */
    downPointer = {};

    /** @internal */
    _latestPointer = {
      pointer: null,
      event: null,
      eventTarget: null
    };

    /** @internal */
    prevEvent = null;
    pointerIsDown = false;
    pointerWasMoved = false;
    /** @internal */
    _interacting = false;
    /** @internal */
    _ending = false;
    /** @internal */
    _stopped = true;
    /** @internal */
    _proxy;

    /** @internal */
    simulation = null;

    /** @internal */
    get pointerMoveTolerance() {
      return 1;
    }
    doMove = warnOnce(function (signalArg) {
      this.move(signalArg);
    }, 'The interaction.doMove() method has been renamed to interaction.move()');
    coords = {
      // Starting InteractEvent pointer coordinates
      start: newCoords(),
      // Previous native pointer move event coordinates
      prev: newCoords(),
      // current native pointer move event coordinates
      cur: newCoords(),
      // Change in coordinates and time of the pointer
      delta: newCoords(),
      // pointer velocity
      velocity: newCoords()
    };

    /** @internal */
    _id = idCounter++;
    constructor({
      pointerType,
      scopeFire
    }) {
      this._scopeFire = scopeFire;
      this.pointerType = pointerType;
      const that = this;
      this._proxy = {};
      for (const key in _ProxyValues) {
        Object.defineProperty(this._proxy, key, {
          get() {
            return that[key];
          }
        });
      }
      for (const key in _ProxyMethods) {
        Object.defineProperty(this._proxy, key, {
          value: (...args) => that[key](...args)
        });
      }
      this._scopeFire('interactions:new', {
        interaction: this
      });
    }
    pointerDown(pointer, event, eventTarget) {
      const pointerIndex = this.updatePointer(pointer, event, eventTarget, true);
      const pointerInfo = this.pointers[pointerIndex];
      this._scopeFire('interactions:down', {
        pointer,
        event,
        eventTarget,
        pointerIndex,
        pointerInfo,
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
     * @param action - The action to be performed - drag, resize, etc.
     * @param target - The Interactable to target
     * @param element - The DOM Element to target
     * @returns Whether the interaction was successfully started
     */
    start(action, interactable, element) {
      if (this.interacting() || !this.pointerIsDown || this.pointers.length < (action.name === 'gesture' ? 2 : 1) || !interactable.options[action.name].enabled) {
        return false;
      }
      copyAction(this.prepared, action);
      this.interactable = interactable;
      this.element = element;
      this.rect = interactable.getRect(element);
      this.edges = this.prepared.edges ? extend({}, this.prepared.edges) : {
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
    pointerMove(pointer, event, eventTarget) {
      if (!this.simulation && !(this.modification && this.modification.endResult)) {
        this.updatePointer(pointer, event, eventTarget, false);
      }
      const duplicateMove = this.coords.cur.page.x === this.coords.prev.page.x && this.coords.cur.page.y === this.coords.prev.page.y && this.coords.cur.client.x === this.coords.prev.client.x && this.coords.cur.client.y === this.coords.prev.client.y;
      let dx;
      let dy;

      // register movement greater than pointerMoveTolerance
      if (this.pointerIsDown && !this.pointerWasMoved) {
        dx = this.coords.cur.client.x - this.coords.start.client.x;
        dy = this.coords.cur.client.y - this.coords.start.client.y;
        this.pointerWasMoved = hypot(dx, dy) > this.pointerMoveTolerance;
      }
      const pointerIndex = this.getPointerIndex(pointer);
      const signalArg = {
        pointer,
        pointerIndex,
        pointerInfo: this.pointers[pointerIndex],
        event,
        type: 'move',
        eventTarget,
        dx,
        dy,
        duplicate: duplicateMove,
        interaction: this
      };
      if (!duplicateMove) {
        // set pointer coordinate, time changes and velocity
        setCoordVelocity(this.coords.velocity, this.coords.delta);
      }
      this._scopeFire('interactions:move', signalArg);
      if (!duplicateMove && !this.simulation) {
        // if interacting, fire an 'action-move' signal etc
        if (this.interacting()) {
          signalArg.type = null;
          this.move(signalArg);
        }
        if (this.pointerWasMoved) {
          copyCoords(this.coords.prev, this.coords.cur);
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
    move(signalArg) {
      if (!signalArg || !signalArg.event) {
        setZeroCoords(this.coords.delta);
      }
      signalArg = extend({
        pointer: this._latestPointer.pointer,
        event: this._latestPointer.event,
        eventTarget: this._latestPointer.eventTarget,
        interaction: this
      }, signalArg || {});
      signalArg.phase = 'move';
      this._doPhase(signalArg);
    }

    /**
     * @internal
     * End interact move events and stop auto-scroll unless simulation is running
     */
    pointerUp(pointer, event, eventTarget, curEventTarget) {
      let pointerIndex = this.getPointerIndex(pointer);
      if (pointerIndex === -1) {
        pointerIndex = this.updatePointer(pointer, event, eventTarget, false);
      }
      const type = /cancel$/i.test(event.type) ? 'cancel' : 'up';
      this._scopeFire(`interactions:${type}`, {
        pointer,
        pointerIndex,
        pointerInfo: this.pointers[pointerIndex],
        event,
        eventTarget,
        type: type,
        curEventTarget,
        interaction: this
      });
      if (!this.simulation) {
        this.end(event);
      }
      this.removePointer(pointer, event);
    }

    /** @internal */
    documentBlur(event) {
      this.end(event);
      this._scopeFire('interactions:blur', {
        event,
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
     */
    end(event) {
      this._ending = true;
      event = event || this._latestPointer.event;
      let endPhaseResult;
      if (this.interacting()) {
        endPhaseResult = this._doPhase({
          event,
          interaction: this,
          phase: 'end'
        });
      }
      this._ending = false;
      if (endPhaseResult === true) {
        this.stop();
      }
    }
    currentAction() {
      return this._interacting ? this.prepared.name : null;
    }
    interacting() {
      return this._interacting;
    }
    stop() {
      this._scopeFire('interactions:stop', {
        interaction: this
      });
      this.interactable = this.element = null;
      this._interacting = false;
      this._stopped = true;
      this.prepared.name = this.prevEvent = null;
    }

    /** @internal */
    getPointerIndex(pointer) {
      const pointerId = getPointerId(pointer);

      // mouse and pen interactions may have only one pointer
      return this.pointerType === 'mouse' || this.pointerType === 'pen' ? this.pointers.length - 1 : findIndex(this.pointers, curPointer => curPointer.id === pointerId);
    }

    /** @internal */
    getPointerInfo(pointer) {
      return this.pointers[this.getPointerIndex(pointer)];
    }

    /** @internal */
    updatePointer(pointer, event, eventTarget, down) {
      const id = getPointerId(pointer);
      let pointerIndex = this.getPointerIndex(pointer);
      let pointerInfo = this.pointers[pointerIndex];
      down = down === false ? false : down || /(down|start)$/i.test(event.type);
      if (!pointerInfo) {
        pointerInfo = new PointerInfo(id, pointer, event, null, null);
        pointerIndex = this.pointers.length;
        this.pointers.push(pointerInfo);
      } else {
        pointerInfo.pointer = pointer;
      }
      setCoords(this.coords.cur, this.pointers.map(p => p.pointer), this._now());
      setCoordDeltas(this.coords.delta, this.coords.prev, this.coords.cur);
      if (down) {
        this.pointerIsDown = true;
        pointerInfo.downTime = this.coords.cur.timeStamp;
        pointerInfo.downTarget = eventTarget;
        pointerExtend(this.downPointer, pointer);
        if (!this.interacting()) {
          copyCoords(this.coords.start, this.coords.cur);
          copyCoords(this.coords.prev, this.coords.cur);
          this.downEvent = event;
          this.pointerWasMoved = false;
        }
      }
      this._updateLatestPointer(pointer, event, eventTarget);
      this._scopeFire('interactions:update-pointer', {
        pointer,
        event,
        eventTarget,
        down,
        pointerInfo,
        pointerIndex,
        interaction: this
      });
      return pointerIndex;
    }

    /** @internal */
    removePointer(pointer, event) {
      const pointerIndex = this.getPointerIndex(pointer);
      if (pointerIndex === -1) return;
      const pointerInfo = this.pointers[pointerIndex];
      this._scopeFire('interactions:remove-pointer', {
        pointer,
        event,
        eventTarget: null,
        pointerIndex,
        pointerInfo,
        interaction: this
      });
      this.pointers.splice(pointerIndex, 1);
      this.pointerIsDown = false;
    }

    /** @internal */
    _updateLatestPointer(pointer, event, eventTarget) {
      this._latestPointer.pointer = pointer;
      this._latestPointer.event = event;
      this._latestPointer.eventTarget = eventTarget;
    }
    destroy() {
      this._latestPointer.pointer = null;
      this._latestPointer.event = null;
      this._latestPointer.eventTarget = null;
    }

    /** @internal */
    _createPreparedEvent(event, phase, preEnd, type) {
      return new InteractEvent(this, event, this.prepared.name, phase, this.element, preEnd, type);
    }

    /** @internal */
    _fireEvent(iEvent) {
      var _this$interactable;
      (_this$interactable = this.interactable) == null || _this$interactable.fire(iEvent);
      if (!this.prevEvent || iEvent.timeStamp >= this.prevEvent.timeStamp) {
        this.prevEvent = iEvent;
      }
    }

    /** @internal */
    _doPhase(signalArg) {
      const {
        event,
        phase,
        preEnd,
        type
      } = signalArg;
      const {
        rect
      } = this;
      if (rect && phase === 'move') {
        // update the rect changes due to pointer move
        addEdges(this.edges, rect, this.coords.delta[this.interactable.options.deltaSource]);
        rect.width = rect.right - rect.left;
        rect.height = rect.bottom - rect.top;
      }
      const beforeResult = this._scopeFire(`interactions:before-action-${phase}`, signalArg);
      if (beforeResult === false) {
        return false;
      }
      const iEvent = signalArg.iEvent = this._createPreparedEvent(event, phase, preEnd, type);
      this._scopeFire(`interactions:action-${phase}`, signalArg);
      if (phase === 'start') {
        this.prevEvent = iEvent;
      }
      this._fireEvent(iEvent);
      this._scopeFire(`interactions:after-action-${phase}`, signalArg);
      return true;
    }

    /** @internal */
    _now() {
      return Date.now();
    }
  }

  _ProxyMethods.offsetBy = '';
  function addTotal(interaction) {
    if (!interaction.pointerIsDown) {
      return;
    }
    addToCoords(interaction.coords.cur, interaction.offset.total);
    interaction.offset.pending.x = 0;
    interaction.offset.pending.y = 0;
  }
  function beforeAction({
    interaction
  }) {
    applyPending(interaction);
  }
  function beforeEnd({
    interaction
  }) {
    const hadPending = applyPending(interaction);
    if (!hadPending) return;
    interaction.move({
      offset: true
    });
    interaction.end();
    return false;
  }
  function end({
    interaction
  }) {
    interaction.offset.total.x = 0;
    interaction.offset.total.y = 0;
    interaction.offset.pending.x = 0;
    interaction.offset.pending.y = 0;
  }
  function applyPending(interaction) {
    if (!hasPending(interaction)) {
      return false;
    }
    const {
      pending
    } = interaction.offset;
    addToCoords(interaction.coords.cur, pending);
    addToCoords(interaction.coords.delta, pending);
    addEdges(interaction.edges, interaction.rect, pending);
    pending.x = 0;
    pending.y = 0;
    return true;
  }
  function offsetBy({
    x,
    y
  }) {
    this.offset.pending.x += x;
    this.offset.pending.y += y;
    this.offset.total.x += x;
    this.offset.total.y += y;
  }
  function addToCoords({
    page,
    client
  }, {
    x,
    y
  }) {
    page.x += x;
    page.y += y;
    client.x += x;
    client.y += y;
  }
  function hasPending(interaction) {
    return !!(interaction.offset.pending.x || interaction.offset.pending.y);
  }
  const offset = {
    id: 'offset',
    before: ['modifiers', 'pointer-events', 'actions', 'inertia'],
    install(scope) {
      scope.Interaction.prototype.offsetBy = offsetBy;
    },
    listeners: {
      'interactions:new': ({
        interaction
      }) => {
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
      'interactions:update-pointer': ({
        interaction
      }) => addTotal(interaction),
      'interactions:before-action-start': beforeAction,
      'interactions:before-action-move': beforeAction,
      'interactions:before-action-end': beforeEnd,
      'interactions:stop': end
    }
  };
  var offset$1 = offset;

  /* eslint-disable import/no-duplicates -- for typescript module augmentations */
  function install$6(scope) {
    const {
      defaults
    } = scope;
    scope.usePlugin(offset$1);
    scope.usePlugin(base);
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
  class InertiaState {
    active = false;
    isModified = false;
    smoothEnd = false;
    allowResume = false;
    modification;
    modifierCount = 0;
    modifierArg;
    startCoords;
    t0 = 0;
    v0 = 0;
    te = 0;
    targetOffset;
    modifiedOffset;
    currentOffset;
    lambda_v0 = 0; // eslint-disable-line camelcase
    one_ve_v0 = 0; // eslint-disable-line camelcase
    timeout;
    interaction;
    constructor(interaction) {
      this.interaction = interaction;
    }
    start(event) {
      const {
        interaction
      } = this;
      const options = getOptions$1(interaction);
      if (!options || !options.enabled) {
        return false;
      }
      const {
        client: velocityClient
      } = interaction.coords.velocity;
      const pointerSpeed = hypot(velocityClient.x, velocityClient.y);
      const modification = this.modification || (this.modification = new Modification(interaction));
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
      const thrown = this.t0 - interaction.coords.cur.timeStamp < 50 && pointerSpeed > options.minSpeed && pointerSpeed > options.endSpeed;
      if (thrown) {
        this.startInertia();
      } else {
        modification.result = modification.setAll(this.modifierArg);
        if (!modification.result.changed) {
          return false;
        }
        this.startSmoothEnd();
      }

      // force modification change
      interaction.modification.result.rect = null;

      // bring inertiastart event to the target coords
      interaction.offsetBy(this.targetOffset);
      interaction._doPhase({
        interaction,
        event,
        phase: 'inertiastart'
      });
      interaction.offsetBy({
        x: -this.targetOffset.x,
        y: -this.targetOffset.y
      });
      // force modification change
      interaction.modification.result.rect = null;
      this.active = true;
      interaction.simulation = this;
      return true;
    }
    startInertia() {
      const startVelocity = this.interaction.coords.velocity.client;
      const options = getOptions$1(this.interaction);
      const lambda = options.resistance;
      const inertiaDur = -Math.log(options.endSpeed / this.v0) / lambda;
      this.targetOffset = {
        x: (startVelocity.x - inertiaDur) / lambda,
        y: (startVelocity.y - inertiaDur) / lambda
      };
      this.te = inertiaDur;
      this.lambda_v0 = lambda / this.v0;
      this.one_ve_v0 = 1 - options.endSpeed / this.v0;
      const {
        modification,
        modifierArg
      } = this;
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
      this.onNextFrame(() => this.inertiaTick());
    }
    startSmoothEnd() {
      this.smoothEnd = true;
      this.isModified = true;
      this.targetOffset = {
        x: this.modification.result.delta.x,
        y: this.modification.result.delta.y
      };
      this.onNextFrame(() => this.smoothEndTick());
    }
    onNextFrame(tickFn) {
      this.timeout = raf.request(() => {
        if (this.active) {
          tickFn();
        }
      });
    }
    inertiaTick() {
      const {
        interaction
      } = this;
      const options = getOptions$1(interaction);
      const lambda = options.resistance;
      const t = (interaction._now() - this.t0) / 1000;
      if (t < this.te) {
        const progress = 1 - (Math.exp(-lambda * t) - this.lambda_v0) / this.one_ve_v0;
        let newOffset;
        if (this.isModified) {
          newOffset = getQuadraticCurvePoint(0, 0, this.targetOffset.x, this.targetOffset.y, this.modifiedOffset.x, this.modifiedOffset.y, progress);
        } else {
          newOffset = {
            x: this.targetOffset.x * progress,
            y: this.targetOffset.y * progress
          };
        }
        const delta = {
          x: newOffset.x - this.currentOffset.x,
          y: newOffset.y - this.currentOffset.y
        };
        this.currentOffset.x += delta.x;
        this.currentOffset.y += delta.y;
        interaction.offsetBy(delta);
        interaction.move();
        this.onNextFrame(() => this.inertiaTick());
      } else {
        interaction.offsetBy({
          x: this.modifiedOffset.x - this.currentOffset.x,
          y: this.modifiedOffset.y - this.currentOffset.y
        });
        this.end();
      }
    }
    smoothEndTick() {
      const {
        interaction
      } = this;
      const t = interaction._now() - this.t0;
      const {
        smoothEndDuration: duration
      } = getOptions$1(interaction);
      if (t < duration) {
        const newOffset = {
          x: easeOutQuad(t, 0, this.targetOffset.x, duration),
          y: easeOutQuad(t, 0, this.targetOffset.y, duration)
        };
        const delta = {
          x: newOffset.x - this.currentOffset.x,
          y: newOffset.y - this.currentOffset.y
        };
        this.currentOffset.x += delta.x;
        this.currentOffset.y += delta.y;
        interaction.offsetBy(delta);
        interaction.move({
          skipModifiers: this.modifierCount
        });
        this.onNextFrame(() => this.smoothEndTick());
      } else {
        interaction.offsetBy({
          x: this.targetOffset.x - this.currentOffset.x,
          y: this.targetOffset.y - this.currentOffset.y
        });
        this.end();
      }
    }
    resume({
      pointer,
      event,
      eventTarget
    }) {
      const {
        interaction
      } = this;

      // undo inertia changes to interaction coords
      interaction.offsetBy({
        x: -this.currentOffset.x,
        y: -this.currentOffset.y
      });

      // update pointer at pointer down position
      interaction.updatePointer(pointer, event, eventTarget, true);

      // fire resume signals and event
      interaction._doPhase({
        interaction,
        event,
        phase: 'resume'
      });
      copyCoords(interaction.coords.prev, interaction.coords.cur);
      this.stop();
    }
    end() {
      this.interaction.move();
      this.interaction.end();
      this.stop();
    }
    stop() {
      this.active = this.smoothEnd = false;
      this.interaction.simulation = null;
      raf.cancel(this.timeout);
    }
  }
  function start$6({
    interaction,
    event
  }) {
    if (!interaction._interacting || interaction.simulation) {
      return null;
    }
    const started = interaction.inertia.start(event);

    // prevent action end if inertia or smoothEnd
    return started ? false : null;
  }

  // Check if the down event hits the current inertia target
  // control should be return to the user
  function resume(arg) {
    const {
      interaction,
      eventTarget
    } = arg;
    const state = interaction.inertia;
    if (!state.active) return;
    let element = eventTarget;

    // climb up the DOM tree from the event target
    while (is.element(element)) {
      // if interaction element is the current inertia target element
      if (element === interaction.element) {
        state.resume(arg);
        break;
      }
      element = parentNode(element);
    }
  }
  function stop({
    interaction
  }) {
    const state = interaction.inertia;
    if (state.active) {
      state.stop();
    }
  }
  function getOptions$1({
    interactable,
    prepared
  }) {
    return interactable && interactable.options && prepared.name && interactable.options[prepared.name].inertia;
  }
  const inertia = {
    id: 'inertia',
    before: ['modifiers', 'actions'],
    install: install$6,
    listeners: {
      'interactions:new': ({
        interaction
      }) => {
        interaction.inertia = new InertiaState(interaction);
      },
      'interactions:before-action-end': start$6,
      'interactions:down': resume,
      'interactions:stop': stop,
      'interactions:before-action-resume': arg => {
        const {
          modification
        } = arg.interaction;
        modification.stop(arg);
        modification.start(arg, arg.interaction.coords.cur.page);
        modification.applyToInteraction(arg);
      },
      'interactions:before-action-inertiastart': arg => arg.interaction.modification.setAndApply(arg),
      'interactions:action-resume': addEventModifiers,
      'interactions:action-inertiastart': addEventModifiers,
      'interactions:after-action-inertiastart': arg => arg.interaction.modification.restoreInteractionCoords(arg),
      'interactions:after-action-resume': arg => arg.interaction.modification.restoreInteractionCoords(arg)
    }
  };

  // http://stackoverflow.com/a/5634528/2280888
  function _getQBezierValue(t, p1, p2, p3) {
    const iT = 1 - t;
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
  var inertia$1 = inertia;

  function fireUntilImmediateStopped(event, listeners) {
    for (var _i = 0; _i < listeners.length; _i++) {
      var _ref;
      _ref = listeners[_i];
      const listener = _ref;
      if (event.immediatePropagationStopped) {
        break;
      }
      listener(event);
    }
  }
  class Eventable {
    options;
    types = {};
    propagationStopped = false;
    immediatePropagationStopped = false;
    global;
    constructor(options) {
      this.options = extend({}, options || {});
    }
    fire(event) {
      let listeners;
      const global = this.global;

      // Interactable#on() listeners
      // tslint:disable no-conditional-assignment
      if (listeners = this.types[event.type]) {
        fireUntilImmediateStopped(event, listeners);
      }

      // interact.on() listeners
      if (!event.propagationStopped && global && (listeners = global[event.type])) {
        fireUntilImmediateStopped(event, listeners);
      }
    }
    on(type, listener) {
      const listeners = normalize(type, listener);
      for (type in listeners) {
        this.types[type] = merge(this.types[type] || [], listeners[type]);
      }
    }
    off(type, listener) {
      const listeners = normalize(type, listener);
      for (type in listeners) {
        const eventList = this.types[type];
        if (!eventList || !eventList.length) {
          continue;
        }
        for (var _i2 = 0; _i2 < listeners[type].length; _i2++) {
          var _ref2;
          _ref2 = listeners[type][_i2];
          const subListener = _ref2;
          const index = eventList.indexOf(subListener);
          if (index !== -1) {
            eventList.splice(index, 1);
          }
        }
      }
    }
    getRect(_element) {
      return null;
    }
  }

  function install$5(scope) {
    var _scope$document;
    const targets = [];
    const delegatedEvents = {};
    const documents = [];
    const eventsMethods = {
      add,
      remove,
      addDelegate,
      removeDelegate,
      delegateListener,
      delegateUseCapture,
      delegatedEvents,
      documents,
      targets,
      supportsOptions: false,
      supportsPassive: false
    };

    // check if browser supports passive events and options arg
    (_scope$document = scope.document) == null || _scope$document.createElement('div').addEventListener('test', null, {
      get capture() {
        return eventsMethods.supportsOptions = true;
      },
      get passive() {
        return eventsMethods.supportsPassive = true;
      }
    });
    scope.events = eventsMethods;
    function add(eventTarget, type, listener, optionalArg) {
      if (!eventTarget.addEventListener) return;
      const options = getOptions(optionalArg);
      let target = find(targets, t => t.eventTarget === eventTarget);
      if (!target) {
        target = {
          eventTarget,
          events: {}
        };
        targets.push(target);
      }
      if (!target.events[type]) {
        target.events[type] = [];
      }
      if (!find(target.events[type], l => l.func === listener && optionsMatch(l.options, options))) {
        eventTarget.addEventListener(type, listener, eventsMethods.supportsOptions ? options : options.capture);
        target.events[type].push({
          func: listener,
          options
        });
      }
    }
    function remove(eventTarget, type, listener, optionalArg) {
      if (!eventTarget.addEventListener || !eventTarget.removeEventListener) return;
      const targetIndex = findIndex(targets, t => t.eventTarget === eventTarget);
      const target = targets[targetIndex];
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
      let typeIsEmpty = false;
      const typeListeners = target.events[type];
      if (typeListeners) {
        if (listener === 'all') {
          for (let i = typeListeners.length - 1; i >= 0; i--) {
            const entry = typeListeners[i];
            remove(eventTarget, type, entry.func, entry.options);
          }
          return;
        } else {
          const options = getOptions(optionalArg);
          for (let i = 0; i < typeListeners.length; i++) {
            const entry = typeListeners[i];
            if (entry.func === listener && optionsMatch(entry.options, options)) {
              eventTarget.removeEventListener(type, listener, eventsMethods.supportsOptions ? options : options.capture);
              typeListeners.splice(i, 1);
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
      const options = getOptions(optionalArg);
      if (!delegatedEvents[type]) {
        delegatedEvents[type] = [];

        // add delegate listener functions
        for (var _i = 0; _i < documents.length; _i++) {
          var _ref;
          _ref = documents[_i];
          const doc = _ref;
          add(doc, type, delegateListener);
          add(doc, type, delegateUseCapture, true);
        }
      }
      const delegates = delegatedEvents[type];
      let delegate = find(delegates, d => d.selector === selector && d.context === context);
      if (!delegate) {
        delegate = {
          selector,
          context,
          listeners: []
        };
        delegates.push(delegate);
      }
      delegate.listeners.push({
        func: listener,
        options
      });
    }
    function removeDelegate(selector, context, type, listener, optionalArg) {
      const options = getOptions(optionalArg);
      const delegates = delegatedEvents[type];
      let matchFound = false;
      let index;
      if (!delegates) return;

      // count from last index of delegated to 0
      for (index = delegates.length - 1; index >= 0; index--) {
        const cur = delegates[index];
        // look for matching selector and context Node
        if (cur.selector === selector && cur.context === context) {
          const {
            listeners
          } = cur;

          // each item of the listeners array is an array: [function, capture, passive]
          for (let i = listeners.length - 1; i >= 0; i--) {
            const entry = listeners[i];

            // check if the listener functions and capture and passive flags match
            if (entry.func === listener && optionsMatch(entry.options, options)) {
              // remove the listener from the array of listeners
              listeners.splice(i, 1);

              // if all listeners for this target have been removed
              // remove the target from the delegates array
              if (!listeners.length) {
                delegates.splice(index, 1);

                // remove delegate function from context
                remove(context, type, delegateListener);
                remove(context, type, delegateUseCapture, true);
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
      const options = getOptions(optionalArg);
      const fakeEvent = new FakeEvent(event);
      const delegates = delegatedEvents[event.type];
      const [eventTarget] = getEventTargets(event);
      let element = eventTarget;

      // climb up document tree looking for selector matches
      while (is.element(element)) {
        for (let i = 0; i < delegates.length; i++) {
          const cur = delegates[i];
          const {
            selector,
            context
          } = cur;
          if (matchesSelector(element, selector) && nodeContains(context, eventTarget) && nodeContains(context, element)) {
            const {
              listeners
            } = cur;
            fakeEvent.currentTarget = element;
            for (var _i2 = 0; _i2 < listeners.length; _i2++) {
              var _ref2;
              _ref2 = listeners[_i2];
              const entry = _ref2;
              if (optionsMatch(entry.options, options)) {
                entry.func(fakeEvent);
              }
            }
          }
        }
        element = parentNode(element);
      }
    }
    function delegateUseCapture(event) {
      return delegateListener.call(this, event, true);
    }

    // for type inferrence
    return eventsMethods;
  }
  class FakeEvent {
    currentTarget;
    originalEvent;
    type;
    constructor(originalEvent) {
      this.originalEvent = originalEvent;
      // duplicate the event so that currentTarget can be changed
      pointerExtend(this, originalEvent);
    }
    preventOriginalDefault() {
      this.originalEvent.preventDefault();
    }
    stopPropagation() {
      this.originalEvent.stopPropagation();
    }
    stopImmediatePropagation() {
      this.originalEvent.stopImmediatePropagation();
    }
  }
  function getOptions(param) {
    if (!is.object(param)) {
      return {
        capture: !!param,
        passive: false
      };
    }
    return {
      capture: !!param.capture,
      passive: !!param.passive
    };
  }
  function optionsMatch(a, b) {
    if (a === b) return true;
    if (typeof a === 'boolean') return !!b.capture === a && !!b.passive === false;
    return !!a.capture === !!b.capture && !!a.passive === !!b.passive;
  }
  var events = {
    id: 'events',
    install: install$5
  };

  const finder = {
    methodOrder: ['simulationResume', 'mouseOrPen', 'hasPointer', 'idle'],
    search(details) {
      for (var _i = 0; _i < finder.methodOrder.length; _i++) {
        var _ref;
        _ref = finder.methodOrder[_i];
        const method = _ref;
        const interaction = finder[method](details);
        if (interaction) {
          return interaction;
        }
      }
      return null;
    },
    // try to resume simulation with a new pointer
    simulationResume({
      pointerType,
      eventType,
      eventTarget,
      scope
    }) {
      if (!/down|start/i.test(eventType)) {
        return null;
      }
      for (var _i2 = 0; _i2 < scope.interactions.list.length; _i2++) {
        var _ref2;
        _ref2 = scope.interactions.list[_i2];
        const interaction = _ref2;
        let element = eventTarget;
        if (interaction.simulation && interaction.simulation.allowResume && interaction.pointerType === pointerType) {
          while (element) {
            // if the element is the interaction element
            if (element === interaction.element) {
              return interaction;
            }
            element = parentNode(element);
          }
        }
      }
      return null;
    },
    // if it's a mouse or pen interaction
    mouseOrPen({
      pointerId,
      pointerType,
      eventType,
      scope
    }) {
      if (pointerType !== 'mouse' && pointerType !== 'pen') {
        return null;
      }
      let firstNonActive;
      for (var _i3 = 0; _i3 < scope.interactions.list.length; _i3++) {
        var _ref3;
        _ref3 = scope.interactions.list[_i3];
        const interaction = _ref3;
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
        var _ref4;
        _ref4 = scope.interactions.list[_i4];
        const interaction = _ref4;
        if (interaction.pointerType === pointerType && !(/down/i.test(eventType) && interaction.simulation)) {
          return interaction;
        }
      }
      return null;
    },
    // get interaction that has this pointer
    hasPointer({
      pointerId,
      scope
    }) {
      for (var _i5 = 0; _i5 < scope.interactions.list.length; _i5++) {
        var _ref5;
        _ref5 = scope.interactions.list[_i5];
        const interaction = _ref5;
        if (hasPointerId(interaction, pointerId)) {
          return interaction;
        }
      }
      return null;
    },
    // get first idle interaction with a matching pointerType
    idle({
      pointerType,
      scope
    }) {
      for (var _i6 = 0; _i6 < scope.interactions.list.length; _i6++) {
        var _ref6;
        _ref6 = scope.interactions.list[_i6];
        const interaction = _ref6;
        // if there's already a pointer held down
        if (interaction.pointers.length === 1) {
          const target = interaction.interactable;
          // don't add this pointer if there is a target interactable and it
          // isn't gesturable
          if (target && !(target.options.gesture && target.options.gesture.enabled)) {
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
    return interaction.pointers.some(({
      id
    }) => id === pointerId);
  }
  var finder$1 = finder;

  const methodNames = ['pointerDown', 'pointerMove', 'pointerUp', 'updatePointer', 'removePointer', 'windowBlur'];
  function install$4(scope) {
    const listeners = {};
    for (var _i = 0; _i < methodNames.length; _i++) {
      var _ref;
      _ref = methodNames[_i];
      const method = _ref;
      listeners[method] = doOnInteractions(method, scope);
    }
    const pEventTypes = browser$1.pEventTypes;
    let docEvents;
    if (domObjects$1.PointerEvent) {
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
      listener(event) {
        for (var _i2 = 0; _i2 < scope.interactions.list.length; _i2++) {
          var _ref2;
          _ref2 = scope.interactions.list[_i2];
          const interaction = _ref2;
          interaction.documentBlur(event);
        }
      }
    });

    // for ignoring browser's simulated mouse events
    scope.prevTouchTime = 0;
    scope.Interaction = class extends Interaction {
      get pointerMoveTolerance() {
        return scope.interactions.pointerMoveTolerance;
      }
      set pointerMoveTolerance(value) {
        scope.interactions.pointerMoveTolerance = value;
      }
      _now() {
        return scope.now();
      }
    };
    scope.interactions = {
      // all active and idle interactions
      list: [],
      new(options) {
        options.scopeFire = (name, arg) => scope.fire(name, arg);
        const interaction = new scope.Interaction(options);
        scope.interactions.list.push(interaction);
        return interaction;
      },
      listeners,
      docEvents,
      pointerMoveTolerance: 1
    };
    function releasePointersOnRemovedEls() {
      // for all inactive touch interactions with pointers down
      for (var _i3 = 0; _i3 < scope.interactions.list.length; _i3++) {
        var _ref3;
        _ref3 = scope.interactions.list[_i3];
        const interaction = _ref3;
        if (!interaction.pointerIsDown || interaction.pointerType !== 'touch' || interaction._interacting) {
          continue;
        }

        // if a pointer is down on an element that is no longer in the DOM tree
        for (var _i4 = 0; _i4 < interaction.pointers.length; _i4++) {
          var _ref4;
          _ref4 = interaction.pointers[_i4];
          const pointer = _ref4;
          if (!scope.documents.some(({
            doc
          }) => nodeContains(doc, pointer.downTarget))) {
            // remove the pointer from the interaction
            interaction.removePointer(pointer.pointer, pointer.event);
          }
        }
      }
    }
    scope.usePlugin(interactablePreventDefault);
  }
  function doOnInteractions(method, scope) {
    return function (event) {
      const interactions = scope.interactions.list;
      const pointerType = getPointerType(event);
      const [eventTarget, curEventTarget] = getEventTargets(event);
      const matches = []; // [ [pointer, interaction], ...]

      if (/^touch/.test(event.type)) {
        scope.prevTouchTime = scope.now();

        // @ts-expect-error
        for (var _i5 = 0; _i5 < event.changedTouches.length; _i5++) {
          var _ref5;
          _ref5 = event.changedTouches[_i5];
          const changedTouch = _ref5;
          const pointer = changedTouch;
          const pointerId = getPointerId(pointer);
          const searchDetails = {
            pointer,
            pointerId,
            pointerType,
            eventType: event.type,
            eventTarget,
            curEventTarget,
            scope
          };
          const interaction = getInteraction(searchDetails);
          matches.push([searchDetails.pointer, searchDetails.eventTarget, searchDetails.curEventTarget, interaction]);
        }
      } else {
        let invalidPointer = false;
        if (!browser$1.supportsPointerEvent && /mouse/.test(event.type)) {
          // ignore mouse events while touch interactions are active
          for (let i = 0; i < interactions.length && !invalidPointer; i++) {
            invalidPointer = interactions[i].pointerType !== 'mouse' && interactions[i].pointerIsDown;
          }

          // try to ignore mouse events that are simulated by the browser
          // after a touch event
          invalidPointer = invalidPointer || scope.now() - scope.prevTouchTime < 500 ||
          // on iOS and Firefox Mobile, MouseEvent.timeStamp is zero if simulated
          event.timeStamp === 0;
        }
        if (!invalidPointer) {
          const searchDetails = {
            pointer: event,
            pointerId: getPointerId(event),
            pointerType,
            eventType: event.type,
            curEventTarget,
            eventTarget,
            scope
          };
          const interaction = getInteraction(searchDetails);
          matches.push([searchDetails.pointer, searchDetails.eventTarget, searchDetails.curEventTarget, interaction]);
        }
      }

      // eslint-disable-next-line no-shadow
      for (var _i6 = 0; _i6 < matches.length; _i6++) {
        const [pointer, eventTarget, curEventTarget, interaction] = matches[_i6];
        interaction[method](pointer, event, eventTarget, curEventTarget);
      }
    };
  }
  function getInteraction(searchDetails) {
    const {
      pointerType,
      scope
    } = searchDetails;
    const foundInteraction = finder$1.search(searchDetails);
    const signalArg = {
      interaction: foundInteraction,
      searchDetails
    };
    scope.fire('interactions:find', signalArg);
    return signalArg.interaction || scope.interactions.new({
      pointerType
    });
  }
  function onDocSignal({
    doc,
    scope,
    options
  }, eventMethodName) {
    const {
      interactions: {
        docEvents
      },
      events
    } = scope;
    const eventMethod = events[eventMethodName];
    if (scope.browser.isIOS && !options.events) {
      options.events = {
        passive: false
      };
    }

    // delegate event listener
    for (const eventType in events.delegatedEvents) {
      eventMethod(doc, eventType, events.delegateListener);
      eventMethod(doc, eventType, events.delegateUseCapture, true);
    }
    const eventOptions = options && options.events;
    for (var _i7 = 0; _i7 < docEvents.length; _i7++) {
      var _ref6;
      _ref6 = docEvents[_i7];
      const {
        type,
        listener
      } = _ref6;
      eventMethod(doc, type, listener, eventOptions);
    }
  }
  const interactions = {
    id: 'core/interactions',
    install: install$4,
    listeners: {
      'scope:add-document': arg => onDocSignal(arg, 'add'),
      'scope:remove-document': arg => onDocSignal(arg, 'remove'),
      'interactable:unset': ({
        interactable
      }, scope) => {
        // Stop and destroy related interactions when an Interactable is unset
        for (let i = scope.interactions.list.length - 1; i >= 0; i--) {
          const interaction = scope.interactions.list[i];
          if (interaction.interactable !== interactable) {
            continue;
          }
          interaction.stop();
          scope.fire('interactions:destroy', {
            interaction
          });
          interaction.destroy();
          if (scope.interactions.list.length > 2) {
            scope.interactions.list.splice(i, 1);
          }
        }
      }
    },
    onDocSignal,
    doOnInteractions,
    methodNames
  };
  var interactions$1 = interactions;

  /* eslint-disable no-dupe-class-members */
  var OnOffMethod = /*#__PURE__*/function (OnOffMethod) {
    OnOffMethod[OnOffMethod["On"] = 0] = "On";
    OnOffMethod[OnOffMethod["Off"] = 1] = "Off";
    return OnOffMethod;
  }(OnOffMethod || {});
  /**
   * ```ts
   * const interactable = interact('.cards')
   *   .draggable({
   *     listeners: { move: event => console.log(event.type, event.pageX, event.pageY) }
   *   })
   *   .resizable({
   *     listeners: { move: event => console.log(event.rect) },
   *     modifiers: [interact.modifiers.restrictEdges({ outer: 'parent' })]
   *   })
   * ```
   */
  class Interactable {
    /** @internal */get _defaults() {
      return {
        base: {},
        perAction: {},
        actions: {}
      };
    }
    target;
    /** @internal */
    options;
    /** @internal */
    _actions;
    /** @internal */
    events = new Eventable();
    /** @internal */
    _context;
    /** @internal */
    _win;
    /** @internal */
    _doc;
    /** @internal */
    _scopeEvents;
    constructor(target, options, defaultContext, scopeEvents) {
      this._actions = options.actions;
      this.target = target;
      this._context = options.context || defaultContext;
      this._win = getWindow(trySelector(target) ? this._context : target);
      this._doc = this._win.document;
      this._scopeEvents = scopeEvents;
      this.set(options);
    }
    setOnEvents(actionName, phases) {
      if (is.func(phases.onstart)) {
        this.on(`${actionName}start`, phases.onstart);
      }
      if (is.func(phases.onmove)) {
        this.on(`${actionName}move`, phases.onmove);
      }
      if (is.func(phases.onend)) {
        this.on(`${actionName}end`, phases.onend);
      }
      if (is.func(phases.oninertiastart)) {
        this.on(`${actionName}inertiastart`, phases.oninertiastart);
      }
      return this;
    }
    updatePerActionListeners(actionName, prev, cur) {
      var _this$_actions$map$ac;
      const actionFilter = (_this$_actions$map$ac = this._actions.map[actionName]) == null ? void 0 : _this$_actions$map$ac.filterEventType;
      const filter = type => (actionFilter == null || actionFilter(type)) && isNonNativeEvent(type, this._actions);
      if (is.array(prev) || is.object(prev)) {
        this._onOff(OnOffMethod.Off, actionName, prev, undefined, filter);
      }
      if (is.array(cur) || is.object(cur)) {
        this._onOff(OnOffMethod.On, actionName, cur, undefined, filter);
      }
    }
    setPerAction(actionName, options) {
      const defaults = this._defaults;

      // for all the default per-action options
      for (const optionName_ in options) {
        const optionName = optionName_;
        const actionOptions = this.options[actionName];
        const optionValue = options[optionName];

        // remove old event listeners and add new ones
        if (optionName === 'listeners') {
          this.updatePerActionListeners(actionName, actionOptions.listeners, optionValue);
        }

        // if the option value is an array
        if (is.array(optionValue)) {
          actionOptions[optionName] = from(optionValue);
        }
        // if the option value is an object
        else if (is.plainObject(optionValue)) {
          actionOptions[optionName] = extend(actionOptions[optionName] || {}, clone(optionValue));

          // set anabled field to true if it exists in the defaults
          if (is.object(defaults.perAction[optionName]) && 'enabled' in defaults.perAction[optionName]) {
            actionOptions[optionName].enabled = optionValue.enabled !== false;
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
    }

    /**
     * The default function to get an Interactables bounding rect. Can be
     * overridden using {@link Interactable.rectChecker}.
     *
     * @param {Element} [element] The element to measure.
     * @return {Rect} The object's bounding rectangle.
     */
    getRect(element) {
      element = element || (is.element(this.target) ? this.target : null);
      if (is.string(this.target)) {
        element = element || this._context.querySelector(this.target);
      }
      return getElementRect(element);
    }

    /**
     * Returns or sets the function used to calculate the interactable's
     * element's rectangle
     *
     * @param {function} [checker] A function which returns this Interactable's
     * bounding rectangle. See {@link Interactable.getRect}
     * @return {function | object} The checker function or this Interactable
     */

    rectChecker(checker) {
      if (is.func(checker)) {
        this.getRect = element => {
          const rect = extend({}, checker.apply(this, element));
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
        return this;
      }
      return this.getRect;
    }

    /** @internal */
    _backCompatOption(optionName, newValue) {
      if (trySelector(newValue) || is.object(newValue)) {
        this.options[optionName] = newValue;
        for (const action in this._actions.map) {
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
    origin(newValue) {
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

    deltaSource(newValue) {
      if (newValue === 'page' || newValue === 'client') {
        this.options.deltaSource = newValue;
        return this;
      }
      return this.options.deltaSource;
    }

    /** @internal */
    getAllElements() {
      const {
        target
      } = this;
      if (is.string(target)) {
        return Array.from(this._context.querySelectorAll(target));
      }
      if (is.func(target) && target.getAllElements) {
        return target.getAllElements();
      }
      return is.element(target) ? [target] : [];
    }

    /**
     * Gets the selector context Node of the Interactable. The default is
     * `window.document`.
     *
     * @return {Node} The context Node of this Interactable
     */
    context() {
      return this._context;
    }
    inContext(element) {
      return this._context === element.ownerDocument || nodeContains(this._context, element);
    }

    /** @internal */
    testIgnoreAllow(options, targetNode, eventTarget) {
      return !this.testIgnore(options.ignoreFrom, targetNode, eventTarget) && this.testAllow(options.allowFrom, targetNode, eventTarget);
    }

    /** @internal */
    testAllow(allowFrom, targetNode, element) {
      if (!allowFrom) {
        return true;
      }
      if (!is.element(element)) {
        return false;
      }
      if (is.string(allowFrom)) {
        return matchesUpTo(element, allowFrom, targetNode);
      } else if (is.element(allowFrom)) {
        return nodeContains(allowFrom, element);
      }
      return false;
    }

    /** @internal */
    testIgnore(ignoreFrom, targetNode, element) {
      if (!ignoreFrom || !is.element(element)) {
        return false;
      }
      if (is.string(ignoreFrom)) {
        return matchesUpTo(element, ignoreFrom, targetNode);
      } else if (is.element(ignoreFrom)) {
        return nodeContains(ignoreFrom, element);
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
    fire(iEvent) {
      this.events.fire(iEvent);
      return this;
    }

    /** @internal */
    _onOff(method, typeArg, listenerArg, options, filter) {
      if (is.object(typeArg) && !is.array(typeArg)) {
        options = listenerArg;
        listenerArg = null;
      }
      const listeners = normalize(typeArg, listenerArg, filter);
      for (let type in listeners) {
        if (type === 'wheel') {
          type = browser$1.wheelEvent;
        }
        for (var _i = 0; _i < listeners[type].length; _i++) {
          var _ref;
          _ref = listeners[type][_i];
          const listener = _ref;
          // if it is an action event type
          if (isNonNativeEvent(type, this._actions)) {
            this.events[method === OnOffMethod.On ? 'on' : 'off'](type, listener);
          }
          // delegated event
          else if (is.string(this.target)) {
            this._scopeEvents[method === OnOffMethod.On ? 'addDelegate' : 'removeDelegate'](this.target, this._context, type, listener, options);
          }
          // remove listener from this Interactable's element
          else {
            this._scopeEvents[method === OnOffMethod.On ? 'add' : 'remove'](this.target, type, listener, options);
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
    on(types, listener, options) {
      return this._onOff(OnOffMethod.On, types, listener, options);
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
    off(types, listener, options) {
      return this._onOff(OnOffMethod.Off, types, listener, options);
    }

    /**
     * Reset the options of this Interactable
     *
     * @param {object} options The new settings to apply
     * @return {object} This Interactable
     */
    set(options) {
      const defaults = this._defaults;
      if (!is.object(options)) {
        options = {};
      }
      this.options = clone(defaults.base);
      for (const actionName_ in this._actions.methodDict) {
        const actionName = actionName_;
        const methodName = this._actions.methodDict[actionName];
        this.options[actionName] = {};
        this.setPerAction(actionName, extend(extend({}, defaults.perAction), defaults.actions[actionName]));
        this[methodName](options[actionName]);
      }
      for (const setting in options) {
        if (setting === 'getRect') {
          this.rectChecker(options.getRect);
          continue;
        }
        if (is.func(this[setting])) {
          this[setting](options[setting]);
        }
      }
      return this;
    }

    /**
     * Remove this interactable from the list of interactables and remove it's
     * action capabilities and event listeners
     */
    unset() {
      if (is.string(this.target)) {
        // remove delegated events
        for (const type in this._scopeEvents.delegatedEvents) {
          const delegated = this._scopeEvents.delegatedEvents[type];
          for (let i = delegated.length - 1; i >= 0; i--) {
            const {
              selector,
              context,
              listeners
            } = delegated[i];
            if (selector === this.target && context === this._context) {
              delegated.splice(i, 1);
            }
            for (let l = listeners.length - 1; l >= 0; l--) {
              this._scopeEvents.removeDelegate(this.target, this._context, type, listeners[l][0], listeners[l][1]);
            }
          }
        }
      } else {
        this._scopeEvents.remove(this.target, 'all');
      }
    }
  }

  class InteractableSet {
    // all set interactables
    list = [];
    selectorMap = {};
    scope;
    constructor(scope) {
      this.scope = scope;
      scope.addListeners({
        'interactable:unset': ({
          interactable
        }) => {
          const {
            target
          } = interactable;
          const interactablesOnTarget = is.string(target) ? this.selectorMap[target] : target[this.scope.id];
          const targetIndex = findIndex(interactablesOnTarget, i => i === interactable);
          interactablesOnTarget.splice(targetIndex, 1);
        }
      });
    }
    new(target, options) {
      options = extend(options || {}, {
        actions: this.scope.actions
      });
      const interactable = new this.scope.Interactable(target, options, this.scope.document, this.scope.events);
      this.scope.addDocument(interactable._doc);
      this.list.push(interactable);
      if (is.string(target)) {
        if (!this.selectorMap[target]) {
          this.selectorMap[target] = [];
        }
        this.selectorMap[target].push(interactable);
      } else {
        if (!interactable.target[this.scope.id]) {
          Object.defineProperty(target, this.scope.id, {
            value: [],
            configurable: true
          });
        }
        target[this.scope.id].push(interactable);
      }
      this.scope.fire('interactable:new', {
        target,
        options,
        interactable,
        win: this.scope._win
      });
      return interactable;
    }
    getExisting(target, options) {
      const context = options && options.context || this.scope.document;
      const isSelector = is.string(target);
      const interactablesOnTarget = isSelector ? this.selectorMap[target] : target[this.scope.id];
      if (!interactablesOnTarget) return undefined;
      return find(interactablesOnTarget, interactable => interactable._context === context && (isSelector || interactable.inContext(target)));
    }
    forEachMatch(node, callback) {
      for (var _i = 0; _i < this.list.length; _i++) {
        var _ref;
        _ref = this.list[_i];
        const interactable = _ref;
        let ret;
        if ((is.string(interactable.target) ?
        // target is a selector and the element matches
        is.element(node) && matchesSelector(node, interactable.target) :
        // target is the element
        node === interactable.target) &&
        // the element is in context
        interactable.inContext(node)) {
          ret = callback(interactable);
        }
        if (ret !== undefined) {
          return ret;
        }
      }
    }
  }

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
   * @param {Element | string} target The HTML or SVG Element to interact with
   * or CSS selector
   * @return {Interactable}
   */

  function createInteractStatic(scope) {
    const interact = (target, options) => {
      let interactable = scope.interactables.getExisting(target, options);
      if (!interactable) {
        interactable = scope.interactables.new(target, options);
        interactable.events.global = interact.globalEvents;
      }
      return interactable;
    };

    // expose the functions used to calculate multi-touch properties
    interact.getPointerAverage = pointerAverage;
    interact.getTouchBBox = touchBBox;
    interact.getTouchDistance = touchDistance;
    interact.getTouchAngle = touchAngle;
    interact.getElementRect = getElementRect;
    interact.getElementClientRect = getElementClientRect;
    interact.matchesSelector = matchesSelector;
    interact.closest = closest;
    interact.globalEvents = {};

    // eslint-disable-next-line no-undef
    interact.version = "1.10.24";
    interact.scope = scope;
    interact.use = function (plugin, options) {
      this.scope.usePlugin(plugin, options);
      return this;
    };
    interact.isSet = function (target, options) {
      return !!this.scope.interactables.get(target, options && options.context);
    };
    interact.on = warnOnce(function on(type, listener, options) {
      if (is.string(type) && type.search(' ') !== -1) {
        type = type.trim().split(/ +/);
      }
      if (is.array(type)) {
        var _arr = type;
        for (var _i = 0; _i < _arr.length; _i++) {
          const eventType = _arr[_i];
          this.on(eventType, listener, options);
        }
        return this;
      }
      if (is.object(type)) {
        for (const prop in type) {
          this.on(prop, type[prop], listener);
        }
        return this;
      }

      // if it is an InteractEvent type, add listener to globalEvents
      if (isNonNativeEvent(type, this.scope.actions)) {
        // if this type of event was never bound
        if (!this.globalEvents[type]) {
          this.globalEvents[type] = [listener];
        } else {
          this.globalEvents[type].push(listener);
        }
      }
      // If non InteractEvent type, addEventListener to document
      else {
        this.scope.events.add(this.scope.document, type, listener, {
          options
        });
      }
      return this;
    }, 'The interact.on() method is being deprecated');
    interact.off = warnOnce(function off(type, listener, options) {
      if (is.string(type) && type.search(' ') !== -1) {
        type = type.trim().split(/ +/);
      }
      if (is.array(type)) {
        for (var _i2 = 0; _i2 < type.length; _i2++) {
          var _ref;
          _ref = type[_i2];
          const eventType = _ref;
          this.off(eventType, listener, options);
        }
        return this;
      }
      if (is.object(type)) {
        for (const prop in type) {
          this.off(prop, type[prop], listener);
        }
        return this;
      }
      if (isNonNativeEvent(type, this.scope.actions)) {
        let index;
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
    interact.supportsTouch = function () {
      return browser$1.supportsTouch;
    };
    interact.supportsPointerEvent = function () {
      return browser$1.supportsPointerEvent;
    };
    interact.stop = function () {
      for (var _i3 = 0; _i3 < this.scope.interactions.list.length; _i3++) {
        var _ref2;
        _ref2 = this.scope.interactions.list[_i3];
        const interaction = _ref2;
        interaction.stop();
      }
      return this;
    };
    interact.pointerMoveTolerance = function (newValue) {
      if (is.number(newValue)) {
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

  /** @internal */

  /** @internal */
  class Scope {
    id = `__interact_scope_${Math.floor(Math.random() * 100)}`;
    isInitialized = false;
    listenerMaps = [];
    browser = browser$1;
    defaults = clone(defaults$7);
    Eventable = Eventable;
    actions = {
      map: {},
      phases: {
        start: true,
        move: true,
        end: true
      },
      methodDict: {},
      phaselessTypes: {}
    };
    interactStatic = createInteractStatic(this);
    InteractEvent = InteractEvent;
    Interactable;
    interactables = new InteractableSet(this);

    // main window
    _win;

    // main document
    document;

    // main window
    window;

    // all documents being listened to
    documents = [];
    _plugins = {
      list: [],
      map: {}
    };
    constructor() {
      const scope = this;
      this.Interactable = class extends Interactable {
        get _defaults() {
          return scope.defaults;
        }
        set(options) {
          super.set(options);
          scope.fire('interactable:set', {
            options,
            interactable: this
          });
          return this;
        }
        unset() {
          super.unset();
          const index = scope.interactables.list.indexOf(this);
          if (index < 0) return;
          scope.interactables.list.splice(index, 1);
          scope.fire('interactable:unset', {
            interactable: this
          });
        }
      };
    }
    addListeners(map, id) {
      this.listenerMaps.push({
        id,
        map
      });
    }
    fire(name, arg) {
      for (var _i = 0; _i < this.listenerMaps.length; _i++) {
        var _ref;
        _ref = this.listenerMaps[_i];
        const {
          map: {
            [name]: listener
          }
        } = _ref;
        if (!!listener && listener(arg, this, name) === false) {
          return false;
        }
      }
    }
    onWindowUnload = event => this.removeDocument(event.target);
    init(window) {
      return this.isInitialized ? this : initScope(this, window);
    }
    pluginIsInstalled(plugin) {
      const {
        id
      } = plugin;
      return id ? !!this._plugins.map[id] : this._plugins.list.indexOf(plugin) !== -1;
    }
    usePlugin(plugin, options) {
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
        let index = 0;
        const len = this.listenerMaps.length;
        const before = plugin.before.reduce((acc, id) => {
          acc[id] = true;
          acc[pluginIdRoot(id)] = true;
          return acc;
        }, {});
        for (; index < len; index++) {
          const otherId = this.listenerMaps[index].id;
          if (otherId && (before[otherId] || before[pluginIdRoot(otherId)])) {
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
    addDocument(doc, options) {
      // do nothing if document is already known
      if (this.getDocIndex(doc) !== -1) {
        return false;
      }
      const window = getWindow(doc);
      options = options ? extend({}, options) : {};
      this.documents.push({
        doc,
        options
      });
      this.events.documents.push(doc);

      // don't add an unload event for the main document
      // so that the page may be cached in browser history
      if (doc !== this.document) {
        this.events.add(window, 'unload', this.onWindowUnload);
      }
      this.fire('scope:add-document', {
        doc,
        window,
        scope: this,
        options
      });
    }
    removeDocument(doc) {
      const index = this.getDocIndex(doc);
      const window = getWindow(doc);
      const options = this.documents[index].options;
      this.events.remove(window, 'unload', this.onWindowUnload);
      this.documents.splice(index, 1);
      this.events.documents.splice(index, 1);
      this.fire('scope:remove-document', {
        doc,
        window,
        scope: this,
        options
      });
    }
    getDocIndex(doc) {
      for (let i = 0; i < this.documents.length; i++) {
        if (this.documents[i].doc === doc) {
          return i;
        }
      }
      return -1;
    }
    getDocOptions(doc) {
      const docIndex = this.getDocIndex(doc);
      return docIndex === -1 ? null : this.documents[docIndex].options;
    }
    now() {
      return (this.window.Date || Date).now();
    }
  }

  /** @internal */
  function initScope(scope, window) {
    scope.isInitialized = true;
    if (is.window(window)) {
      init$3(window);
    }
    domObjects$1.init(window);
    browser$1.init(window);
    raf.init(window);

    // @ts-expect-error
    scope.window = window;
    scope.document = window.document;
    scope.usePlugin(interactions$1);
    scope.usePlugin(events);
    return scope;
  }
  function pluginIdRoot(id) {
    return id && id.replace(/\/.*$/, '');
  }

  const scope = new Scope();
  const interact = scope.interactStatic;
  var interact$1 = interact;
  const _global = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : window;
  scope.init(_global);

  var edgeTarget = (() => {});

  var elements = (() => {});

  var grid = (grid => {
    const coordFields = [['x', 'y'], ['left', 'top'], ['right', 'bottom'], ['width', 'height']].filter(([xField, yField]) => xField in grid || yField in grid);
    const gridFunc = (x, y) => {
      const {
        range,
        limits = {
          left: -Infinity,
          right: Infinity,
          top: -Infinity,
          bottom: Infinity
        },
        offset = {
          x: 0,
          y: 0
        }
      } = grid;
      const result = {
        range,
        grid,
        x: null,
        y: null
      };
      for (var _i = 0; _i < coordFields.length; _i++) {
        var _ref;
        _ref = coordFields[_i];
        const [xField, yField] = _ref;
        const gridx = Math.round((x - offset.x) / grid[xField]);
        const gridy = Math.round((y - offset.y) / grid[yField]);
        result[xField] = Math.max(limits.left, Math.min(limits.right, gridx * grid[xField] + offset.x));
        result[yField] = Math.max(limits.top, Math.min(limits.bottom, gridy * grid[yField] + offset.y));
      }
      return result;
    };
    gridFunc.grid = grid;
    gridFunc.coordFields = coordFields;
    return gridFunc;
  });

  /* eslint-disable import/no-named-as-default, import/no-unresolved */

  var allSnappers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    edgeTarget: edgeTarget,
    elements: elements,
    grid: grid
  });

  const snappersPlugin = {
    id: 'snappers',
    install(scope) {
      const {
        interactStatic: interact
      } = scope;
      interact.snappers = extend(interact.snappers || {}, allSnappers);
      interact.createSnapGrid = interact.snappers.grid;
    }
  };
  var snappers = snappersPlugin;

  /**
   * @module modifiers/aspectRatio
   *
   * @description
   * This modifier forces elements to be resized with a specified dx/dy ratio.
   *
   * ```js
   * interact(target).resizable({
   *   modifiers: [
   *     interact.modifiers.snapSize({
   *       targets: [ interact.snappers.grid({ x: 20, y: 20 }) ],
   *     }),
   *     interact.aspectRatio({ ratio: 'preserve' }),
   *   ],
   * });
   * ```
   */

  const aspectRatio = {
    start(arg) {
      const {
        state,
        rect,
        edges,
        pageCoords: coords
      } = arg;
      let {
        ratio,
        enabled
      } = state.options;
      const {
        equalDelta,
        modifiers
      } = state.options;
      if (ratio === 'preserve') {
        ratio = rect.width / rect.height;
      }
      state.startCoords = extend({}, coords);
      state.startRect = extend({}, rect);
      state.ratio = ratio;
      state.equalDelta = equalDelta;
      const linkedEdges = state.linkedEdges = {
        top: edges.top || edges.left && !edges.bottom,
        left: edges.left || edges.top && !edges.right,
        bottom: edges.bottom || edges.right && !edges.top,
        right: edges.right || edges.bottom && !edges.left
      };
      state.xIsPrimaryAxis = !!(edges.left || edges.right);
      if (state.equalDelta) {
        const sign = (linkedEdges.left ? 1 : -1) * (linkedEdges.top ? 1 : -1);
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
      if (enabled !== false) {
        extend(edges, linkedEdges);
      }
      if (!(modifiers != null && modifiers.length)) return;
      const subModification = new Modification(arg.interaction);
      subModification.copyFrom(arg.interaction.modification);
      subModification.prepareStates(modifiers);
      state.subModification = subModification;
      subModification.startAll({
        ...arg
      });
    },
    set(arg) {
      const {
        state,
        rect,
        coords
      } = arg;
      const {
        linkedEdges
      } = state;
      const initialCoords = extend({}, coords);
      const aspectMethod = state.equalDelta ? setEqualDelta : setRatio;
      extend(arg.edges, linkedEdges);
      aspectMethod(state, state.xIsPrimaryAxis, coords, rect);
      if (!state.subModification) {
        return null;
      }
      const correctedRect = extend({}, rect);
      addEdges(linkedEdges, correctedRect, {
        x: coords.x - initialCoords.x,
        y: coords.y - initialCoords.y
      });
      const result = state.subModification.setAll({
        ...arg,
        rect: correctedRect,
        edges: linkedEdges,
        pageCoords: coords,
        prevCoords: coords,
        prevRect: correctedRect
      });
      const {
        delta
      } = result;
      if (result.changed) {
        const xIsCriticalAxis = Math.abs(delta.x) > Math.abs(delta.y);

        // do aspect modification again with critical edge axis as primary
        aspectMethod(state, xIsCriticalAxis, result.coords, result.rect);
        extend(coords, result.coords);
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
  function setEqualDelta({
    startCoords,
    edgeSign
  }, xIsPrimaryAxis, coords) {
    if (xIsPrimaryAxis) {
      coords.y = startCoords.y + (coords.x - startCoords.x) * edgeSign.y;
    } else {
      coords.x = startCoords.x + (coords.y - startCoords.y) * edgeSign.x;
    }
  }
  function setRatio({
    startRect,
    startCoords,
    ratio,
    edgeSign
  }, xIsPrimaryAxis, coords, rect) {
    if (xIsPrimaryAxis) {
      const newHeight = rect.width / ratio;
      coords.y = startCoords.y + (newHeight - startRect.height) * edgeSign.y;
    } else {
      const newWidth = rect.height * ratio;
      coords.x = startCoords.x + (newWidth - startRect.width) * edgeSign.x;
    }
  }
  var aspectRatio$1 = makeModifier(aspectRatio, 'aspectRatio');

  const noop = () => {};
  noop._defaults = {};
  var rubberband = noop;

  function start$5({
    rect,
    startOffset,
    state,
    interaction,
    pageCoords
  }) {
    const {
      options
    } = state;
    const {
      elementRect
    } = options;
    const offset = extend({
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    }, options.offset || {});
    if (rect && elementRect) {
      const restriction = getRestrictionRect(options.restriction, interaction, pageCoords);
      if (restriction) {
        const widthDiff = restriction.right - restriction.left - rect.width;
        const heightDiff = restriction.bottom - restriction.top - rect.height;
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
  function set$4({
    coords,
    interaction,
    state
  }) {
    const {
      options,
      offset
    } = state;
    const restriction = getRestrictionRect(options.restriction, interaction, coords);
    if (!restriction) return;
    const rect = xywhToTlbr(restriction);
    coords.x = Math.max(Math.min(rect.right - offset.right, coords.x), rect.left + offset.left);
    coords.y = Math.max(Math.min(rect.bottom - offset.bottom, coords.y), rect.top + offset.top);
  }
  function getRestrictionRect(value, interaction, coords) {
    if (is.func(value)) {
      return resolveRectLike(value, interaction.interactable, interaction.element, [coords.x, coords.y, interaction]);
    } else {
      return resolveRectLike(value, interaction.interactable, interaction.element);
    }
  }
  const defaults$6 = {
    restriction: null,
    elementRect: null,
    offset: null,
    endOnly: false,
    enabled: false
  };
  const restrict = {
    start: start$5,
    set: set$4,
    defaults: defaults$6
  };
  var restrict$1 = makeModifier(restrict, 'restrict');

  // This modifier adds the options.resize.restrictEdges setting which sets min and
  // max for the top, left, bottom and right edges of the target being resized.
  //
  // interact(target).resize({
  //   edges: { top: true, left: true },
  //   restrictEdges: {
  //     inner: { top: 200, left: 200, right: 400, bottom: 400 },
  //     outer: { top:   0, left:   0, right: 600, bottom: 600 },
  //   },
  // })

  const noInner = {
    top: +Infinity,
    left: +Infinity,
    bottom: -Infinity,
    right: -Infinity
  };
  const noOuter = {
    top: -Infinity,
    left: -Infinity,
    bottom: +Infinity,
    right: +Infinity
  };
  function start$4({
    interaction,
    startOffset,
    state
  }) {
    const {
      options
    } = state;
    let offset;
    if (options) {
      const offsetRect = getRestrictionRect(options.offset, interaction, interaction.coords.start.page);
      offset = rectToXY(offsetRect);
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
  function set$3({
    coords,
    edges,
    interaction,
    state
  }) {
    const {
      offset,
      options
    } = state;
    if (!edges) {
      return;
    }
    const page = extend({}, coords);
    const inner = getRestrictionRect(options.inner, interaction, page) || {};
    const outer = getRestrictionRect(options.outer, interaction, page) || {};
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
      const edge = _arr[_i];
      if (!(edge in rect)) {
        rect[edge] = defaults[edge];
      }
    }
    return rect;
  }
  const defaults$5 = {
    inner: null,
    outer: null,
    offset: null,
    endOnly: false,
    enabled: false
  };
  const restrictEdges = {
    noInner,
    noOuter,
    start: start$4,
    set: set$3,
    defaults: defaults$5
  };
  var restrictEdges$1 = makeModifier(restrictEdges, 'restrictEdges');

  const defaults$4 = extend({
    get elementRect() {
      return {
        top: 0,
        left: 0,
        bottom: 1,
        right: 1
      };
    },
    set elementRect(_) {}
  }, restrict.defaults);
  const restrictRect = {
    start: restrict.start,
    set: restrict.set,
    defaults: defaults$4
  };
  var restrictRect$1 = makeModifier(restrictRect, 'restrictRect');

  const noMin = {
    width: -Infinity,
    height: -Infinity
  };
  const noMax = {
    width: +Infinity,
    height: +Infinity
  };
  function start$3(arg) {
    return restrictEdges.start(arg);
  }
  function set$2(arg) {
    const {
      interaction,
      state,
      rect,
      edges
    } = arg;
    const {
      options
    } = state;
    if (!edges) {
      return;
    }
    const minSize = tlbrToXywh(getRestrictionRect(options.min, interaction, arg.coords)) || noMin;
    const maxSize = tlbrToXywh(getRestrictionRect(options.max, interaction, arg.coords)) || noMax;
    state.options = {
      endOnly: options.endOnly,
      inner: extend({}, restrictEdges.noInner),
      outer: extend({}, restrictEdges.noOuter)
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
    restrictEdges.set(arg);
    state.options = options;
  }
  const defaults$3 = {
    min: null,
    max: null,
    endOnly: false,
    enabled: false
  };
  const restrictSize = {
    start: start$3,
    set: set$2,
    defaults: defaults$3
  };
  var restrictSize$1 = makeModifier(restrictSize, 'restrictSize');

  function start$2(arg) {
    const {
      interaction,
      interactable,
      element,
      rect,
      state,
      startOffset
    } = arg;
    const {
      options
    } = state;
    const origin = options.offsetWithOrigin ? getOrigin(arg) : {
      x: 0,
      y: 0
    };
    let snapOffset;
    if (options.offset === 'startCoords') {
      snapOffset = {
        x: interaction.coords.start.page.x,
        y: interaction.coords.start.page.y
      };
    } else {
      const offsetRect = resolveRectLike(options.offset, interactable, element, [interaction]);
      snapOffset = rectToXY(offsetRect) || {
        x: 0,
        y: 0
      };
      snapOffset.x += origin.x;
      snapOffset.y += origin.y;
    }
    const {
      relativePoints
    } = options;
    state.offsets = rect && relativePoints && relativePoints.length ? relativePoints.map((relativePoint, index) => ({
      index,
      relativePoint,
      x: startOffset.left - rect.width * relativePoint.x + snapOffset.x,
      y: startOffset.top - rect.height * relativePoint.y + snapOffset.y
    })) : [{
      index: 0,
      relativePoint: null,
      x: snapOffset.x,
      y: snapOffset.y
    }];
  }
  function set$1(arg) {
    const {
      interaction,
      coords,
      state
    } = arg;
    const {
      options,
      offsets
    } = state;
    const origin = getOriginXY(interaction.interactable, interaction.element, interaction.prepared.name);
    const page = extend({}, coords);
    const targets = [];
    if (!options.offsetWithOrigin) {
      page.x -= origin.x;
      page.y -= origin.y;
    }
    for (var _i = 0; _i < offsets.length; _i++) {
      var _ref;
      _ref = offsets[_i];
      const offset = _ref;
      const relativeX = page.x - offset.x;
      const relativeY = page.y - offset.y;
      for (let index = 0, len = options.targets.length; index < len; index++) {
        const snapTarget = options.targets[index];
        let target;
        if (is.func(snapTarget)) {
          target = snapTarget(relativeX, relativeY, interaction._proxy, offset, index);
        } else {
          target = snapTarget;
        }
        if (!target) {
          continue;
        }
        targets.push({
          x: (is.number(target.x) ? target.x : relativeX) + offset.x,
          y: (is.number(target.y) ? target.y : relativeY) + offset.y,
          range: is.number(target.range) ? target.range : options.range,
          source: snapTarget,
          index,
          offset
        });
      }
    }
    const closest = {
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
      const target = targets[_i2];
      const range = target.range;
      const dx = target.x - page.x;
      const dy = target.y - page.y;
      const distance = hypot(dx, dy);
      let inRange = distance <= range;

      // Infinite targets count as being out of range
      // compared to non infinite ones that are in range
      if (range === Infinity && closest.inRange && closest.range !== Infinity) {
        inRange = false;
      }
      if (!closest.target || (inRange ?
      // is the closest target in range?
      closest.inRange && range !== Infinity ?
      // the pointer is relatively deeper in this target
      distance / range < closest.distance / closest.range :
      // this target has Infinite range and the closest doesn't
      range === Infinity && closest.range !== Infinity ||
      // OR this target is closer that the previous closest
      distance < closest.distance :
      // The other is not in range and the pointer is closer to this target
      !closest.inRange && distance < closest.distance)) {
        closest.target = target;
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
    const {
      element
    } = arg.interaction;
    const optionsOrigin = rectToXY(resolveRectLike(arg.state.options.origin, null, null, [element]));
    const origin = optionsOrigin || getOriginXY(arg.interactable, element, arg.interaction.prepared.name);
    return origin;
  }
  const defaults$2 = {
    range: Infinity,
    targets: null,
    offset: null,
    offsetWithOrigin: true,
    origin: null,
    relativePoints: null,
    endOnly: false,
    enabled: false
  };
  const snap = {
    start: start$2,
    set: set$1,
    defaults: defaults$2
  };
  var snap$1 = makeModifier(snap, 'snap');

  // This modifier allows snapping of the size of targets during resize
  // interactions.

  function start$1(arg) {
    const {
      state,
      edges
    } = arg;
    const {
      options
    } = state;
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
    snap.start(arg);
    state.offsets = arg.state.offsets;
    arg.state = state;
  }
  function set(arg) {
    const {
      interaction,
      state,
      coords
    } = arg;
    const {
      options,
      offsets
    } = state;
    const relative = {
      x: coords.x - offsets[0].x,
      y: coords.y - offsets[0].y
    };
    state.options = extend({}, options);
    state.options.targets = [];
    for (var _i = 0; _i < (options.targets || []).length; _i++) {
      var _ref;
      _ref = (options.targets || [])[_i];
      const snapTarget = _ref;
      let target;
      if (is.func(snapTarget)) {
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
        const [xField, yField] = _ref2;
        if (xField in target || yField in target) {
          target.x = target[xField];
          target.y = target[yField];
          break;
        }
      }
      state.options.targets.push(target);
    }
    const returnValue = snap.set(arg);
    state.options = options;
    return returnValue;
  }
  const defaults$1 = {
    range: Infinity,
    targets: null,
    offset: null,
    endOnly: false,
    enabled: false
  };
  const snapSize = {
    start: start$1,
    set,
    defaults: defaults$1
  };
  var snapSize$1 = makeModifier(snapSize, 'snapSize');

  /**
   * @module modifiers/snapEdges
   *
   * @description
   * This modifier allows snapping of the edges of targets during resize
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

  function start(arg) {
    const {
      edges
    } = arg;
    if (!edges) {
      return null;
    }
    arg.state.targetFields = arg.state.targetFields || [[edges.left ? 'left' : 'right', edges.top ? 'top' : 'bottom']];
    return snapSize.start(arg);
  }
  const snapEdges = {
    start,
    set: snapSize.set,
    defaults: extend(clone(snapSize.defaults), {
      targets: undefined,
      range: undefined,
      offset: {
        x: 0,
        y: 0
      }
    })
  };
  var snapEdges$1 = makeModifier(snapEdges, 'snapEdges');

  /* eslint-disable n/no-extraneous-import, import/no-unresolved */
  var all = {
    aspectRatio: aspectRatio$1,
    restrictEdges: restrictEdges$1,
    restrict: restrict$1,
    restrictRect: restrictRect$1,
    restrictSize: restrictSize$1,
    snapEdges: snapEdges$1,
    snap: snap$1,
    snapSize: snapSize$1,
    spring: rubberband,
    avoid: rubberband,
    transform: rubberband,
    rubberband
  };

  /* eslint-enable import/no-duplicates */

  const modifiers = {
    id: 'modifiers',
    install(scope) {
      const {
        interactStatic: interact
      } = scope;
      scope.usePlugin(base);
      scope.usePlugin(snappers);
      interact.modifiers = all;

      // for backwrads compatibility
      for (const type in all) {
        const {
          _defaults,
          _methods
        } = all[type];
        _defaults._methods = _methods;
        scope.defaults.perAction[type] = _defaults;
      }
    }
  };
  var modifiers$1 = modifiers;

  class PointerEvent extends BaseEvent {
    constructor(type, pointer, event, eventTarget, interaction, timeStamp) {
      super(interaction);
      pointerExtend(this, event);
      if (event !== pointer) {
        pointerExtend(this, pointer);
      }
      this.timeStamp = timeStamp;
      this.originalEvent = event;
      this.type = type;
      this.pointerId = getPointerId(pointer);
      this.pointerType = getPointerType(pointer);
      this.target = eventTarget;
      this.currentTarget = null;
      if (type === 'tap') {
        const pointerIndex = interaction.getPointerIndex(pointer);
        this.dt = this.timeStamp - interaction.pointers[pointerIndex].downTime;
        const interval = this.timeStamp - interaction.tapTime;
        this.double = !!interaction.prevTap && interaction.prevTap.type !== 'doubletap' && interaction.prevTap.target === this.target && interval < 500;
      } else if (type === 'doubletap') {
        this.dt = pointer.timeStamp - interaction.tapTime;
        this.double = true;
      }
    }
    _subtractOrigin({
      x: originX,
      y: originY
    }) {
      this.pageX -= originX;
      this.pageY -= originY;
      this.clientX -= originX;
      this.clientY -= originY;
      return this;
    }
    _addOrigin({
      x: originX,
      y: originY
    }) {
      this.pageX += originX;
      this.pageY += originY;
      this.clientX += originX;
      this.clientY += originY;
      return this;
    }

    /**
     * Prevent the default behaviour of the original Event
     */
    preventDefault() {
      this.originalEvent.preventDefault();
    }
  }

  const defaults = {
    holdDuration: 600,
    ignoreFrom: null,
    allowFrom: null,
    origin: {
      x: 0,
      y: 0
    }
  };
  const pointerEvents$1 = {
    id: 'pointer-events/base',
    before: ['inertia', 'modifiers', 'auto-start', 'actions'],
    install: install$3,
    listeners: {
      'interactions:new': addInteractionProps,
      'interactions:update-pointer': addHoldInfo,
      'interactions:move': moveAndClearHold,
      'interactions:down': (arg, scope) => {
        downAndStartHold(arg, scope);
        fire(arg, scope);
      },
      'interactions:up': (arg, scope) => {
        clearHold(arg);
        fire(arg, scope);
        tapAfterUp(arg, scope);
      },
      'interactions:cancel': (arg, scope) => {
        clearHold(arg);
        fire(arg, scope);
      }
    },
    PointerEvent,
    fire,
    collectEventTargets,
    defaults,
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
    const {
      interaction,
      pointer,
      event,
      eventTarget,
      type,
      targets = collectEventTargets(arg, scope)
    } = arg;
    const pointerEvent = new PointerEvent(type, pointer, event, eventTarget, interaction, scope.now());
    scope.fire('pointerEvents:new', {
      pointerEvent
    });
    const signalArg = {
      interaction,
      pointer,
      event,
      eventTarget,
      targets,
      type,
      pointerEvent
    };
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      for (const prop in target.props || {}) {
        pointerEvent[prop] = target.props[prop];
      }
      const origin = getOriginXY(target.eventable, target.node);
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
      const prevTap = pointerEvent.double ? fire({
        interaction,
        pointer,
        event,
        eventTarget,
        type: 'doubletap'
      }, scope) : pointerEvent;
      interaction.prevTap = prevTap;
      interaction.tapTime = prevTap.timeStamp;
    }
    return pointerEvent;
  }
  function collectEventTargets({
    interaction,
    pointer,
    event,
    eventTarget,
    type
  }, scope) {
    const pointerIndex = interaction.getPointerIndex(pointer);
    const pointerInfo = interaction.pointers[pointerIndex];

    // do not fire a tap event if the pointer was moved before being lifted
    if (type === 'tap' && (interaction.pointerWasMoved ||
    // or if the pointerup target is different to the pointerdown target
    !(pointerInfo && pointerInfo.downTarget === eventTarget))) {
      return [];
    }
    const path = getPath(eventTarget);
    const signalArg = {
      interaction,
      pointer,
      event,
      eventTarget,
      type,
      path,
      targets: [],
      node: null
    };
    for (var _i = 0; _i < path.length; _i++) {
      var _ref;
      _ref = path[_i];
      const node = _ref;
      signalArg.node = node;
      scope.fire('pointerEvents:collect-targets', signalArg);
    }
    if (type === 'hold') {
      signalArg.targets = signalArg.targets.filter(target => {
        var _interaction$pointers;
        return target.eventable.options.holdDuration === ((_interaction$pointers = interaction.pointers[pointerIndex]) == null || (_interaction$pointers = _interaction$pointers.hold) == null ? void 0 : _interaction$pointers.duration);
      });
    }
    return signalArg.targets;
  }
  function addInteractionProps({
    interaction
  }) {
    interaction.prevTap = null; // the most recent tap event on this interaction
    interaction.tapTime = 0; // time of the most recent tap event
  }
  function addHoldInfo({
    down,
    pointerInfo
  }) {
    if (!down && pointerInfo.hold) {
      return;
    }
    pointerInfo.hold = {
      duration: Infinity,
      timeout: null
    };
  }
  function clearHold({
    interaction,
    pointerIndex
  }) {
    const hold = interaction.pointers[pointerIndex].hold;
    if (hold && hold.timeout) {
      clearTimeout(hold.timeout);
      hold.timeout = null;
    }
  }
  function moveAndClearHold(arg, scope) {
    const {
      interaction,
      pointer,
      event,
      eventTarget,
      duplicate
    } = arg;
    if (!duplicate && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
      if (interaction.pointerIsDown) {
        clearHold(arg);
      }
      fire({
        interaction,
        pointer,
        event,
        eventTarget: eventTarget,
        type: 'move'
      }, scope);
    }
  }
  function downAndStartHold({
    interaction,
    pointer,
    event,
    eventTarget,
    pointerIndex
  }, scope) {
    const timer = interaction.pointers[pointerIndex].hold;
    const path = getPath(eventTarget);
    const signalArg = {
      interaction,
      pointer,
      event,
      eventTarget,
      type: 'hold',
      targets: [],
      path,
      node: null
    };
    for (var _i2 = 0; _i2 < path.length; _i2++) {
      var _ref2;
      _ref2 = path[_i2];
      const node = _ref2;
      signalArg.node = node;
      scope.fire('pointerEvents:collect-targets', signalArg);
    }
    if (!signalArg.targets.length) return;
    let minDuration = Infinity;
    for (var _i3 = 0; _i3 < signalArg.targets.length; _i3++) {
      var _ref3;
      _ref3 = signalArg.targets[_i3];
      const target = _ref3;
      const holdDuration = target.eventable.options.holdDuration;
      if (holdDuration < minDuration) {
        minDuration = holdDuration;
      }
    }
    timer.duration = minDuration;
    timer.timeout = setTimeout(() => {
      fire({
        interaction,
        eventTarget,
        pointer,
        event,
        type: 'hold'
      }, scope);
    }, minDuration);
  }
  function tapAfterUp({
    interaction,
    pointer,
    event,
    eventTarget
  }, scope) {
    if (!interaction.pointerWasMoved) {
      fire({
        interaction,
        eventTarget,
        pointer,
        event,
        type: 'tap'
      }, scope);
    }
  }
  function install$3(scope) {
    scope.pointerEvents = pointerEvents$1;
    scope.defaults.actions.pointerEvents = pointerEvents$1.defaults;
    extend(scope.actions.phaselessTypes, pointerEvents$1.types);
  }

  var pointerEvents$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    default: pointerEvents$1
  });

  /* eslint-disable import/no-duplicates -- for typescript module augmentations */
  function install$2(scope) {
    scope.usePlugin(pointerEvents$1);
    const {
      pointerEvents
    } = scope;

    // don't repeat by default
    pointerEvents.defaults.holdRepeatInterval = 0;
    pointerEvents.types.holdrepeat = scope.actions.phaselessTypes.holdrepeat = true;
  }
  function onNew({
    pointerEvent
  }) {
    if (pointerEvent.type !== 'hold') return;
    pointerEvent.count = (pointerEvent.count || 0) + 1;
  }
  function onFired({
    interaction,
    pointerEvent,
    eventTarget,
    targets
  }, scope) {
    if (pointerEvent.type !== 'hold' || !targets.length) return;

    // get the repeat interval from the first eventable
    const interval = targets[0].eventable.options.holdRepeatInterval;

    // don't repeat if the interval is 0 or less
    if (interval <= 0) return;

    // set a timeout to fire the holdrepeat event
    interaction.holdIntervalHandle = setTimeout(() => {
      scope.pointerEvents.fire({
        interaction,
        eventTarget,
        type: 'hold',
        pointer: pointerEvent,
        event: pointerEvent
      }, scope);
    }, interval);
  }
  function endHoldRepeat({
    interaction
  }) {
    // set the interaction's holdStopTime property
    // to stop further holdRepeat events
    if (interaction.holdIntervalHandle) {
      clearInterval(interaction.holdIntervalHandle);
      interaction.holdIntervalHandle = null;
    }
  }
  const holdRepeat = {
    id: 'pointer-events/holdRepeat',
    install: install$2,
    listeners: ['move', 'up', 'cancel', 'endall'].reduce((acc, enderTypes) => {
      acc[`pointerEvents:${enderTypes}`] = endHoldRepeat;
      return acc;
    }, {
      'pointerEvents:new': onNew,
      'pointerEvents:fired': onFired
    })
  };
  var holdRepeat$1 = holdRepeat;

  function install$1(scope) {
    const {
      Interactable
    } = scope;
    Interactable.prototype.pointerEvents = function (options) {
      extend(this.events.options, options);
      return this;
    };
    const __backCompatOption = Interactable.prototype._backCompatOption;
    Interactable.prototype._backCompatOption = function (optionName, newValue) {
      const ret = __backCompatOption.call(this, optionName, newValue);
      if (ret === this) {
        this.events.options[optionName] = newValue;
      }
      return ret;
    };
  }
  const plugin$1 = {
    id: 'pointer-events/interactableTargets',
    install: install$1,
    listeners: {
      'pointerEvents:collect-targets': ({
        targets,
        node,
        type,
        eventTarget
      }, scope) => {
        scope.interactables.forEachMatch(node, interactable => {
          const eventable = interactable.events;
          const options = eventable.options;
          if (eventable.types[type] && eventable.types[type].length && interactable.testIgnoreAllow(options, node, eventTarget)) {
            targets.push({
              node,
              eventable,
              props: {
                interactable
              }
            });
          }
        });
      },
      'interactable:new': ({
        interactable
      }) => {
        interactable.events.getRect = function (element) {
          return interactable.getRect(element);
        };
      },
      'interactable:set': ({
        interactable,
        options
      }, scope) => {
        extend(interactable.events.options, scope.pointerEvents.defaults);
        extend(interactable.events.options, options.pointerEvents || {});
      }
    }
  };
  var interactableTargets = plugin$1;

  /* eslint-disable import/no-duplicates -- for typescript module augmentations */
  /* eslint-enable import/no-duplicates */

  const plugin = {
    id: 'pointer-events',
    install(scope) {
      scope.usePlugin(pointerEvents$2);
      scope.usePlugin(holdRepeat$1);
      scope.usePlugin(interactableTargets);
    }
  };
  var pointerEvents = plugin;

  function install(scope) {
    const {
      Interactable
    } = scope;
    scope.actions.phases.reflow = true;
    Interactable.prototype.reflow = function (action) {
      return doReflow(this, action, scope);
    };
  }
  function doReflow(interactable, action, scope) {
    const elements = interactable.getAllElements();

    // tslint:disable-next-line variable-name
    const Promise = scope.window.Promise;
    const promises = Promise ? [] : null;
    for (var _i = 0; _i < elements.length; _i++) {
      var _ref;
      _ref = elements[_i];
      const element = _ref;
      const rect = interactable.getRect(element);
      if (!rect) {
        break;
      }
      const runningInteraction = find(scope.interactions.list, interaction => {
        return interaction.interacting() && interaction.interactable === interactable && interaction.element === element && interaction.prepared.name === action.name;
      });
      let reflowPromise;
      if (runningInteraction) {
        runningInteraction.move();
        if (promises) {
          reflowPromise = runningInteraction._reflowPromise || new Promise(resolve => {
            runningInteraction._reflowResolve = resolve;
          });
        }
      } else {
        const xywh = tlbrToXywh(rect);
        const coords = {
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
        const event = coordsToEvent(coords);
        reflowPromise = startReflow(scope, interactable, element, action, event);
      }
      if (promises) {
        promises.push(reflowPromise);
      }
    }
    return promises && Promise.all(promises).then(() => interactable);
  }
  function startReflow(scope, interactable, element, action, event) {
    const interaction = scope.interactions.new({
      pointerType: 'reflow'
    });
    const signalArg = {
      interaction,
      event,
      pointer: event,
      eventTarget: element,
      phase: 'reflow'
    };
    interaction.interactable = interactable;
    interaction.element = element;
    interaction.prevEvent = event;
    interaction.updatePointer(event, event, element, true);
    setZeroCoords(interaction.coords.delta);
    copyAction(interaction.prepared, action);
    interaction._doPhase(signalArg);
    const {
      Promise
    } = scope.window;
    const reflowPromise = Promise ? new Promise(resolve => {
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
  const reflow = {
    id: 'reflow',
    install,
    listeners: {
      // remove completed reflow interactions
      'interactions:stop': ({
        interaction
      }, scope) => {
        if (interaction.pointerType === 'reflow') {
          if (interaction._reflowResolve) {
            interaction._reflowResolve();
          }
          remove(scope.interactions.list, interaction);
        }
      }
    }
  };
  var reflow$1 = reflow;

  /* eslint-disable import/no-duplicates -- for typescript module augmentations */
  /* eslint-enable import/no-duplicates */

  interact$1.use(interactablePreventDefault);
  interact$1.use(offset$1);

  // pointerEvents
  interact$1.use(pointerEvents);

  // inertia
  interact$1.use(inertia$1);

  // snap, resize, etc.
  interact$1.use(modifiers$1);

  // autoStart, hold
  interact$1.use(autoStart);

  // drag and drop, resize, gesture
  interact$1.use(actions);

  // autoScroll
  interact$1.use(autoScroll$1);

  // reflow
  interact$1.use(reflow$1);

  // eslint-disable-next-line no-undef
  {
    interact$1.use(devTools);
  }
  interact$1.default = interact$1;

  // eslint-disable-next-line import/no-extraneous-dependencies
  if (typeof module === 'object' && !!module) {
    try {
      module.exports = interact$1;
    } catch (_unused) {}
  }
  interact$1.default = interact$1;

  return interact$1;

}));
//# sourceMappingURL=interact.js.map
