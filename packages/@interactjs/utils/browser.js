/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import domObjects from './domObjects.js';
import is from './is.js';
import './isWindow.js';
import './window.js';
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
  const Element = domObjects.Element;
  const navigator = window.navigator || {};

  // Does the browser support touch input?
  browser.supportsTouch = 'ontouchstart' in window || is.func(window.DocumentTouch) && domObjects.document instanceof window.DocumentTouch;

  // Does the browser support PointerEvents
  // https://github.com/taye/interact.js/issues/703#issuecomment-471570492
  browser.supportsPointerEvent = navigator.pointerEnabled !== false && !!domObjects.PointerEvent;
  browser.isIOS = /iP(hone|od|ad)/.test(navigator.platform);

  // scrolling doesn't change the result of getClientRects on iOS 7
  browser.isIOS7 = /iP(hone|od|ad)/.test(navigator.platform) && /OS 7[^\d]/.test(navigator.appVersion);
  browser.isIe9 = /MSIE 9/.test(navigator.userAgent);

  // Opera Mobile must be handled differently
  browser.isOperaMobile = navigator.appName === 'Opera' && browser.supportsTouch && /Presto/.test(navigator.userAgent);

  // prefix matchesSelector
  browser.prefixedMatchesSelector = 'matches' in Element.prototype ? 'matches' : 'webkitMatchesSelector' in Element.prototype ? 'webkitMatchesSelector' : 'mozMatchesSelector' in Element.prototype ? 'mozMatchesSelector' : 'oMatchesSelector' in Element.prototype ? 'oMatchesSelector' : 'msMatchesSelector';
  browser.pEventTypes = browser.supportsPointerEvent ? domObjects.PointerEvent === window.MSPointerEvent ? {
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
  browser.wheelEvent = domObjects.document && 'onmousewheel' in domObjects.document ? 'mousewheel' : 'wheel';
}
export { browser as default };
//# sourceMappingURL=browser.js.map
