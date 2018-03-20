const domObjects = {
  init,
};

function blank () {}

export default domObjects;

function init (window) {
  domObjects.document           = window.document;
  domObjects.DocumentFragment   = window.DocumentFragment   || blank;
  domObjects.SVGElement         = window.SVGElement         || blank;
  domObjects.SVGSVGElement      = window.SVGSVGElement      || blank;
  domObjects.SVGElementInstance = window.SVGElementInstance || blank;
  domObjects.Element            = window.Element            || blank;
  domObjects.HTMLElement        = window.HTMLElement        || domObjects.Element;

  domObjects.Event        = window.Event;
  domObjects.Touch        = window.Touch || blank;
  domObjects.PointerEvent = (window.PointerEvent || window.MSPointerEvent);
}
