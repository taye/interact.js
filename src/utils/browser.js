'use strict';

var browser = {},
    win = require('./window'),
    domObjects = require('./domObjects');

// Does the browser support touch input?
browser.supportsTouch = !!(('ontouchstart' in win) || win.window.DocumentTouch && domObjects.document instanceof win.DocumentTouch);

// Does the browser support PointerEvents
browser.supportsPointerEvent = !!domObjects.PointerEvent;

// Opera Mobile must be handled differently
browser.isOperaMobile = (navigator.appName == 'Opera'
                                && browser.supportsTouch
                                && navigator.userAgent.match('Presto'));

// scrolling doesn't change the result of
// getBoundingClientRect/getClientRects on iOS <=7 but it does on iOS 8
browser.isIOS7orLower = (/iP(hone|od|ad)/.test(navigator.platform)
                                && /OS [1-7][^\d]/.test(navigator.appVersion));

module.exports = browser;
