const domObjects = {};
const win = require('./window').window;

function blank () {}

domObjects.document           = win.document;
domObjects.DocumentFragment   = win.DocumentFragment   || blank;
domObjects.SVGElement         = win.SVGElement         || blank;
domObjects.SVGSVGElement      = win.SVGSVGElement      || blank;
domObjects.SVGElementInstance = win.SVGElementInstance || blank;
domObjects.Element            = win.Element            || blank;
domObjects.HTMLElement        = win.HTMLElement        || domObjects.Element;

domObjects.Event        = win.Event;
domObjects.Touch        = win.Touch || blank;
domObjects.PointerEvent = (win.PointerEvent || win.MSPointerEvent);

module.exports = domObjects;
