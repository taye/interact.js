"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _domObjects = _interopRequireDefault(require("./domObjects"));
var _is = _interopRequireDefault(require("./is"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const browser = {
  init,
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
function init(window) {
  const Element = _domObjects.default.Element;
  const navigator = window.navigator || {};

  // Does the browser support touch input?
  browser.supportsTouch = 'ontouchstart' in window || _is.default.func(window.DocumentTouch) && _domObjects.default.document instanceof window.DocumentTouch;

  // Does the browser support PointerEvents
  // https://github.com/taye/interact.js/issues/703#issuecomment-471570492
  browser.supportsPointerEvent = navigator.pointerEnabled !== false && !!_domObjects.default.PointerEvent;
  browser.isIOS = /iP(hone|od|ad)/.test(navigator.platform);

  // scrolling doesn't change the result of getClientRects on iOS 7
  browser.isIOS7 = /iP(hone|od|ad)/.test(navigator.platform) && /OS 7[^\d]/.test(navigator.appVersion);
  browser.isIe9 = /MSIE 9/.test(navigator.userAgent);

  // Opera Mobile must be handled differently
  browser.isOperaMobile = navigator.appName === 'Opera' && browser.supportsTouch && /Presto/.test(navigator.userAgent);

  // prefix matchesSelector
  browser.prefixedMatchesSelector = 'matches' in Element.prototype ? 'matches' : 'webkitMatchesSelector' in Element.prototype ? 'webkitMatchesSelector' : 'mozMatchesSelector' in Element.prototype ? 'mozMatchesSelector' : 'oMatchesSelector' in Element.prototype ? 'oMatchesSelector' : 'msMatchesSelector';
  browser.pEventTypes = browser.supportsPointerEvent ? _domObjects.default.PointerEvent === window.MSPointerEvent ? {
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
  browser.wheelEvent = _domObjects.default.document && 'onmousewheel' in _domObjects.default.document ? 'mousewheel' : 'wheel';
}
var _default = exports.default = browser;
//# sourceMappingURL=browser.js.map