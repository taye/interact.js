const { window } = require('./window');
const is     = require('./is');
const domObjects = require('./domObjects');

const Element = domObjects.Element;
const navigator  = window.navigator;

const browser = {
  // Does the browser support touch input?
  supportsTouch: !!(('ontouchstart' in window) || is.function(window.DocumentTouch)
                     && domObjects.document instanceof window.DocumentTouch),

  // Does the browser support PointerEvents
  supportsPointerEvent: !!domObjects.PointerEvent,

  isIE8: ('attachEvent' in window) && !('addEventListener' in window),

  // Opera Mobile must be handled differently
  isOperaMobile: (navigator.appName === 'Opera'
      && browser.supportsTouch
      && navigator.userAgent.match('Presto')),

  // scrolling doesn't change the result of getClientRects on iOS 7
  isIOS7: (/iP(hone|od|ad)/.test(navigator.platform)
           && /OS 7[^\d]/.test(navigator.appVersion)),

  isIe9OrOlder: /MSIE (8|9)/.test(navigator.userAgent),

  // prefix matchesSelector
  prefixedMatchesSelector: 'matches' in Element.prototype
    ? 'matches': 'webkitMatchesSelector' in Element.prototype
    ? 'webkitMatchesSelector': 'mozMatchesSelector' in Element.prototype
    ? 'mozMatchesSelector': 'oMatchesSelector' in Element.prototype
    ? 'oMatchesSelector': 'msMatchesSelector',

  useMatchesSelectorPolyfill: false,

  pEventTypes: (domObjects.PointerEvent
    ? (domObjects.PointerEvent === window.MSPointerEvent
      ? {
        up:     'MSPointerUp',
        down:   'MSPointerDown',
        over:   'mouseover',
        out:    'mouseout',
        move:   'MSPointerMove',
        cancel: 'MSPointerCancel',
      }
      : {
        up:     'pointerup',
        down:   'pointerdown',
        over:   'pointerover',
        out:    'pointerout',
        move:   'pointermove',
        cancel: 'pointercancel',
      })
    : null),

  // because Webkit and Opera still use 'mousewheel' event type
  wheelEvent: 'onmousewheel' in domObjects.document? 'mousewheel': 'wheel',

};

browser.useMatchesSelectorPolyfill = !is.function(Element.prototype[browser.prefixedMatchesSelector]);

module.exports = browser;
