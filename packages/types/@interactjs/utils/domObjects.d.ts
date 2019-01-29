declare const domObjects: {
    init: typeof init;
    document: Document;
    DocumentFragment: {
        new (): DocumentFragment;
        prototype: DocumentFragment;
    };
    SVGElement: {
        new (): SVGElement;
        prototype: SVGElement;
    };
    SVGSVGElement: {
        new (): SVGSVGElement;
        prototype: SVGSVGElement;
        readonly SVG_ZOOMANDPAN_DISABLE: number;
        readonly SVG_ZOOMANDPAN_MAGNIFY: number;
        readonly SVG_ZOOMANDPAN_UNKNOWN: number;
    };
    SVGElementInstance: {
        new (): SVGElementInstance;
        prototype: SVGElementInstance;
    };
    Element: {
        new (): Element;
        prototype: Element;
    };
    HTMLElement: {
        new (): HTMLElement;
        prototype: HTMLElement;
    };
    Event: {
        new (type: string, eventInitDict?: EventInit): Event;
        prototype: Event;
        readonly AT_TARGET: number;
        readonly BUBBLING_PHASE: number;
        readonly CAPTURING_PHASE: number;
        readonly NONE: number;
    };
    Touch: {
        new (touchInitDict: TouchInit): Touch;
        prototype: Touch;
    };
    PointerEvent: {
        new (type: string, eventInitDict?: PointerEventInit): PointerEvent;
        prototype: PointerEvent;
    };
};
export default domObjects;
declare function init(window: Window): void;
