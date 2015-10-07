const win        = require('./window');
const isType     = require('./isType');
const domObjects = require('./domObjects');

const browser = {
  // Does the browser support touch input?
  supportsTouch: !!(('ontouchstart' in win.window) || win.window.DocumentTouch
                     && domObjects.document instanceof win.DocumentTouch),

  // Does the browser support PointerEvents
  supportsPointerEvent: !!domObjects.PointerEvent,

  isIE8: ('attachEvent' in win.window) && !('addEventListener' in win.window),

  // Opera Mobile must be handled differently
  isOperaMobile: (navigator.appName === 'Opera'
      && browser.supportsTouch
      && navigator.userAgent.match('Presto')),

  // scrolling doesn't change the result of getClientRects on iOS 7
  isIOS7: (/iP(hone|od|ad)/.test(navigator.platform)
           && /OS 7[^\d]/.test(navigator.appVersion)),

  isIe9OrOlder: domObjects.document.all && !win.window.atob,

  // prefix matchesSelector
  prefixedMatchesSelector: 'matches' in Element.prototype
    ? 'matches': 'webkitMatchesSelector' in Element.prototype
    ? 'webkitMatchesSelector': 'mozMatchesSelector' in Element.prototype
    ? 'mozMatchesSelector': 'oMatchesSelector' in Element.prototype
    ? 'oMatchesSelector': 'msMatchesSelector',

  useMatchesSelectorPolyfill: false,

  pEventTypes: (domObjects.PointerEvent
    ? (domObjects.PointerEvent === win.window.MSPointerEvent
      ? { up: 'MSPointerUp', down: 'MSPointerDown', over: 'mouseover',
          out: 'mouseout', move: 'MSPointerMove', cancel: 'MSPointerCancel' }
      : { up: 'pointerup', down: 'pointerdown', over: 'pointerover',
          out: 'pointerout', move: 'pointermove', cancel: 'pointercancel' })
    : null),
};

browser.useMatchesSelectorPolyfill = !isType.isFunction(Element.prototype[browser.prefixedMatchesSelector]);

module.exports = browser;
