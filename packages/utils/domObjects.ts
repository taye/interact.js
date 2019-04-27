const domObjects: {
  init: any,
  document: Document,
  DocumentFragment: typeof DocumentFragment,
  SVGElement: typeof SVGElement,
  SVGSVGElement: typeof SVGSVGElement,
  SVGElementInstance: any,
  Element: typeof Element,
  HTMLElement: typeof HTMLElement,
  Event: typeof Event,
  Touch: typeof Touch,
  PointerEvent: typeof PointerEvent,
} =
{
  init,
  document: null as any,
  DocumentFragment: null as any,
  SVGElement: null as any,
  SVGSVGElement: null as any,
  // eslint-disable-next-line no-undef
  SVGElementInstance: null as any,
  Element: null as any,
  HTMLElement: null as any,
  Event: null as any,
  Touch: null as any,
  PointerEvent: null as any,
}

function blank () {}

export default domObjects

function init (window: Window) {
  const win = window as any

  domObjects.document           = win.document
  domObjects.DocumentFragment   = win.DocumentFragment   || blank
  domObjects.SVGElement         = win.SVGElement         || blank
  domObjects.SVGSVGElement      = win.SVGSVGElement      || blank
  domObjects.SVGElementInstance = win.SVGElementInstance || blank
  domObjects.Element            = win.Element            || blank
  domObjects.HTMLElement        = win.HTMLElement        || domObjects.Element

  domObjects.Event        = win.Event
  domObjects.Touch        = win.Touch || blank
  domObjects.PointerEvent = (win.PointerEvent || win.MSPointerEvent)
}
