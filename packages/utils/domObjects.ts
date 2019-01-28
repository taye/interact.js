const domObjects = {
  init,
  document: null as Document,
  DocumentFragment: null as typeof DocumentFragment,
  SVGElement: null as typeof SVGElement,
  SVGSVGElement: null as typeof SVGSVGElement,
  // eslint-disable-next-line no-undef
  SVGElementInstance: null as typeof SVGElementInstance,
  Element: null as typeof Element,
  HTMLElement: null as typeof HTMLElement,
  Event: null as typeof Event,
  Touch: null as typeof Touch,
  PointerEvent: null as typeof PointerEvent,
};

function blank () {}

export default domObjects;

function init (window: Window) {
  const win = window as any;

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
}
