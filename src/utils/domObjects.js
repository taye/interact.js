'use strict';

var domObjects = {},
    win = require('./window').window,
    blank = function () {};

domObjects.document           = win.document;
domObjects.DocumentFragment   = win.DocumentFragment   || blank;
domObjects.SVGElement         = win.SVGElement         || blank;
domObjects.SVGSVGElement      = win.SVGSVGElement      || blank;
domObjects.SVGElementInstance = win.SVGElementInstance || blank;
domObjects.HTMLElement        = win.HTMLElement        || win.Element;

domObjects.PointerEvent = (win.PointerEvent || win.MSPointerEvent);

module.exports = domObjects;