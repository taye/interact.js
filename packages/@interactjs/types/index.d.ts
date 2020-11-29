declare module "@interactjs/core/BaseEvent" {
    import * as Interact from "@interactjs/types/index";
    export class BaseEvent<T extends Interact.ActionName = never> {
        type: string;
        target: EventTarget;
        currentTarget: Node;
        interactable: Interact.Interactable;
        _interaction: Interact.Interaction<T>;
        timeStamp: any;
        immediatePropagationStopped: boolean;
        propagationStopped: boolean;
        constructor(interaction: Interact.Interaction<T>);
        preventDefault(): void;
        /**
         * Don't call any other listeners (even on the current target)
         */
        stopPropagation(): void;
        /**
         * Don't call listeners on the remaining targets
         */
        stopImmediatePropagation(): void;
    }
    export interface BaseEvent<T extends Interact.ActionName> {
        interaction: Interact.InteractionProxy<T>;
    }
}
declare module "@interactjs/utils/extend" {
    export default function extend<T, U extends object>(dest: U & Partial<T>, source: T): T & U;
}
declare module "@interactjs/utils/domObjects" {
    const domObjects: {
        init: any;
        document: Document;
        DocumentFragment: typeof DocumentFragment;
        SVGElement: typeof SVGElement;
        SVGSVGElement: typeof SVGSVGElement;
        SVGElementInstance: any;
        Element: typeof Element;
        HTMLElement: typeof HTMLElement;
        Event: typeof Event;
        Touch: typeof Touch;
        PointerEvent: typeof PointerEvent;
    };
    export default domObjects;
}
declare module "@interactjs/utils/isWindow" {
    const _default: (thing: any) => boolean;
    export default _default;
}
declare module "@interactjs/utils/window" {
    export let realWindow: Window;
    let win: Window;
    export { win as window };
    export function init(window: Window & {
        wrap?: (...args: any[]) => any;
    }): void;
    export function getWindow(node: any): any;
}
declare module "@interactjs/utils/is" {
    import * as Interact from "@interactjs/types/index";
    const _default_1: {
        window: (thing: any) => thing is Window;
        docFrag: (thing: any) => thing is DocumentFragment;
        object: (thing: any) => thing is {
            [index: string]: any;
        };
        func: (thing: any) => thing is (...args: any[]) => any;
        number: (thing: any) => thing is number;
        bool: (thing: any) => thing is boolean;
        string: (thing: any) => thing is string;
        element: (thing: any) => thing is Interact.Element;
        plainObject: (thing: any) => thing is {
            [index: string]: any;
        };
        array: <T extends unknown>(thing: any) => thing is T[];
    };
    export default _default_1;
}
declare module "@interactjs/utils/browser" {
    const browser: {
        init: typeof init;
        supportsTouch: boolean;
        supportsPointerEvent: boolean;
        isIOS7: boolean;
        isIOS: boolean;
        isIe9: boolean;
        isOperaMobile: boolean;
        prefixedMatchesSelector: "matches";
        pEventTypes: {
            up: string;
            down: string;
            over: string;
            out: string;
            move: string;
            cancel: string;
        };
        wheelEvent: string;
    };
    function init(window: any): void;
    export default browser;
}
declare module "@interactjs/utils/domUtils" {
    import * as Interact from "@interactjs/types/index";
    export function nodeContains(parent: Node, child: Node): boolean;
    export function closest(element: Node, selector: string): Interact.Element;
    export function parentNode(node: Node | Document): Node & ParentNode;
    export function matchesSelector(element: Interact.Element, selector: string): boolean;
    export function indexOfDeepestElement(elements: Interact.Element[] | NodeListOf<Element>): number;
    export function matchesUpTo(element: Interact.Element, selector: string, limit: Node): boolean;
    export function getActualElement(element: Interact.Element): Interact.Element;
    export function getScrollXY(relevantWindow?: Window): {
        x: number;
        y: number;
    };
    export function getElementClientRect(element: Interact.Element): Required<Interact.Rect>;
    export function getElementRect(element: Interact.Element): Required<Interact.Rect>;
    export function getPath(node: Node | Document): any[];
    export function trySelector(value: Interact.Target): boolean;
}
declare module "@interactjs/utils/rect" {
    import * as Interact from "@interactjs/types/index";
    export function getStringOptionResult(value: any, target: Interact.HasGetRect, element: Node): (Node & ParentNode) | Interact.Rect;
    export function resolveRectLike<T extends any[]>(value: Interact.RectResolvable<T>, target?: Interact.HasGetRect, element?: Node, functionArgs?: T): Interact.Rect;
    export function rectToXY(rect: Interact.Rect | Interact.Point): {
        x: number;
        y: number;
    };
    export function xywhToTlbr<T extends Partial<Interact.Rect & Interact.Point>>(rect: T): Interact.Rect & T;
    export function tlbrToXywh(rect: Interact.Rect & Partial<Interact.Point>): Required<Interact.Rect> & Interact.Point;
    export function addEdges(edges: Interact.EdgeOptions, rect: Interact.Rect, delta: Interact.Point): void;
}
declare module "@interactjs/utils/getOriginXY" {
    import * as Interact from "@interactjs/types/index";
    export default function (target: Interact.HasGetRect & {
        options: Interact.PerActionDefaults;
    }, element: Node, actionName?: Interact.ActionName): {
        x: number;
        y: number;
    };
}
declare module "@interactjs/utils/hypot" {
    const _default_2: (x: number, y: number) => number;
    export default _default_2;
}
declare module "@interactjs/core/defaultOptions" {
    import * as Interact from "@interactjs/types/index";
    export interface Defaults {
        base: BaseDefaults;
        perAction: PerActionDefaults;
        actions: ActionDefaults;
    }
    export interface ActionDefaults {
    }
    export interface BaseDefaults {
        preventDefault?: 'auto' | 'never' | string;
        deltaSource?: 'page' | 'client';
        context?: Node;
    }
    export interface PerActionDefaults {
        enabled?: boolean;
        origin?: Interact.Point | string | Interact.Element;
        listeners?: Interact.Listeners;
        allowFrom?: string | Interact.Element;
        ignoreFrom?: string | Interact.Element;
    }
    export type Options = Partial<BaseDefaults> & Partial<PerActionDefaults> & {
        [P in keyof ActionDefaults]?: Partial<ActionDefaults[P]>;
    };
    export interface OptionsArg extends BaseDefaults, Interact.OrBoolean<Partial<ActionDefaults>> {
    }
    export const defaults: Defaults;
}
declare module "@interactjs/utils/arr" {
    type Filter<T> = (element: T, index: number, array: T[]) => boolean;
    export const contains: <T>(array: T[], target: T) => boolean;
    export const remove: <T>(array: T[], target: T) => T[];
    export const merge: <T, U>(target: (T | U)[], source: U[]) => (T | U)[];
    export const from: <T = any>(source: ArrayLike<T>) => T[];
    export const findIndex: <T>(array: T[], func: Filter<T>) => number;
    export const find: <T = any>(array: T[], func: Filter<T>) => T;
}
declare module "@interactjs/utils/misc" {
    import * as Interact from "@interactjs/types/index";
    export function warnOnce<T>(this: T, method: (...args: any[]) => any, message: string): (this: T) => any;
    export function copyAction(dest: Interact.ActionProps, src: Interact.ActionProps): Interact.ActionProps<"drag" | "drop" | "resize" | "gesture">;
}
declare module "@interactjs/utils/pointerExtend" {
    function pointerExtend<T>(dest: Partial<T>, source: T): Partial<T>;
    namespace pointerExtend {
        var prefixedPropREs: {
            [prefix: string]: RegExp;
        };
    }
    export default pointerExtend;
}
declare module "@interactjs/utils/pointerUtils" {
    import * as Interact from "@interactjs/types/index";
    import pointerExtend from "@interactjs/utils/pointerExtend";
    export function copyCoords(dest: Interact.CoordsSetMember, src: Interact.CoordsSetMember): void;
    export function setCoordDeltas(targetObj: Interact.CoordsSetMember, prev: Interact.CoordsSetMember, cur: Interact.CoordsSetMember): void;
    export function setCoordVelocity(targetObj: Interact.CoordsSetMember, delta: Interact.CoordsSetMember): void;
    export function setZeroCoords(targetObj: Interact.CoordsSetMember): void;
    export function isNativePointer(pointer: any): boolean;
    export function getXY(type: string, pointer: Interact.PointerType | Interact.InteractEvent, xy: Interact.Point): Interact.Point;
    export function getPageXY(pointer: Interact.PointerType | Interact.InteractEvent, page?: Interact.Point): Interact.Point;
    export function getClientXY(pointer: Interact.PointerType, client: Interact.Point): Interact.Point;
    export function getPointerId(pointer: {
        pointerId?: number;
        identifier?: number;
        type?: string;
    }): number;
    export function setCoords(dest: Interact.CoordsSetMember, pointers: any[], timeStamp: number): void;
    export function getTouchPair(event: TouchEvent | Interact.PointerType[]): Interact.PointerType[];
    export function pointerAverage(pointers: Interact.PointerType[]): {
        pageX: number;
        pageY: number;
        clientX: number;
        clientY: number;
        screenX: number;
        screenY: number;
    };
    export function touchBBox(event: Interact.PointerType[]): {
        x: number;
        y: number;
        left: number;
        top: number;
        right: number;
        bottom: number;
        width: number;
        height: number;
    };
    export function touchDistance(event: Interact.PointerType[] | TouchEvent, deltaSource: string): number;
    export function touchAngle(event: Interact.PointerType[] | TouchEvent, deltaSource: string): number;
    export function getPointerType(pointer: {
        pointerType?: string;
        identifier?: number;
        type?: string;
    }): string;
    export function getEventTargets(event: Event): Interact.Element[];
    export function newCoords(): Interact.CoordsSetMember;
    export function coordsToEvent(coords: MockCoords): ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & Touch & MouseEvent) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & Touch & PointerEvent) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & Touch & TouchEvent) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & Touch & Interact.PointerEvent<any>) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & Touch & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow">) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & MouseEvent) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & MouseEvent & PointerEvent) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & MouseEvent & TouchEvent) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & MouseEvent & Interact.PointerEvent<any>) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & MouseEvent & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow">) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & PointerEvent & MouseEvent) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & PointerEvent) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & PointerEvent & TouchEvent) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & PointerEvent & Interact.PointerEvent<any>) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & PointerEvent & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow">) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & Interact.PointerEvent<any> & MouseEvent) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & Interact.PointerEvent<any> & PointerEvent) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & Interact.PointerEvent<any> & TouchEvent) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & Interact.PointerEvent<any>) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & Interact.PointerEvent<any> & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow">) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow"> & MouseEvent) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow"> & PointerEvent) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow"> & TouchEvent) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow"> & Interact.PointerEvent<any>) | ({
        coords: MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow">);
    export interface MockCoords {
        page: Interact.Point;
        client: Interact.Point;
        timeStamp?: number;
        pointerId?: any;
        target?: any;
        type?: string;
        pointerType?: string;
        buttons?: number;
    }
    export { pointerExtend };
}
declare module "@interactjs/utils/clone" {
    export default function clone<T extends Object>(source: T): Partial<T>;
}
declare module "@interactjs/utils/normalizeListeners" {
    import * as Interact from "@interactjs/types/index";
    export interface NormalizedListeners {
        [type: string]: Interact.Listener[];
    }
    export default function normalize(type: Interact.EventTypes, listeners?: Interact.ListenersArg | Interact.ListenersArg[], result?: NormalizedListeners): NormalizedListeners;
}
declare module "@interactjs/core/Eventable" {
    import * as Interact from "@interactjs/types/index";
    import { NormalizedListeners } from "@interactjs/utils/normalizeListeners";
    export class Eventable {
        options: any;
        types: NormalizedListeners;
        propagationStopped: boolean;
        immediatePropagationStopped: boolean;
        global: any;
        constructor(options?: {
            [index: string]: any;
        });
        fire<T extends {
            type: string;
            propagationStopped?: boolean;
        }>(event: T): void;
        on(type: string, listener: Interact.ListenersArg): void;
        off(type: string, listener: Interact.ListenersArg): void;
        getRect(_element: Interact.Element): Interact.Rect;
    }
}
declare module "@interactjs/core/isNonNativeEvent" {
    import * as Interact from "@interactjs/types/index";
    export default function isNonNativeEvent(type: string, actions: Interact.Actions): boolean;
}
declare module "@interactjs/core/Interactable" {
    import * as Interact from "@interactjs/types/index";
    import { Eventable } from "@interactjs/core/Eventable";
    import { Options } from "@interactjs/core/defaultOptions";
    type IgnoreValue = string | Interact.Element | boolean;
    type DeltaSource = 'page' | 'client';
    /** */
    export class Interactable implements Partial<Eventable> {
        readonly options: Required<Options>;
        readonly _actions: Interact.Actions;
        readonly target: Interact.Target;
        readonly events: Eventable;
        readonly _context: Interact.Context;
        readonly _win: Window;
        readonly _doc: Document;
        readonly _scopeEvents: Interact.Scope['events'];
        /** */
        constructor(target: Interact.Target, options: any, defaultContext: Document | Interact.Element, scopeEvents: Interact.Scope['events']);
        setOnEvents(actionName: Interact.ActionName, phases: NonNullable<any>): this;
        updatePerActionListeners(actionName: Interact.ActionName, prev: Interact.Listeners, cur: Interact.Listeners): void;
        setPerAction(actionName: Interact.ActionName, options: Interact.OrBoolean<Options>): void;
        /**
         * The default function to get an Interactables bounding rect. Can be
         * overridden using {@link Interactable.rectChecker}.
         *
         * @param {Element} [element] The element to measure.
         * @return {Interact.Rect} The object's bounding rectangle.
         */
        getRect(element: Interact.Element): Required<Interact.Rect>;
        /**
         * Returns or sets the function used to calculate the interactable's
         * element's rectangle
         *
         * @param {function} [checker] A function which returns this Interactable's
         * bounding rectangle. See {@link Interactable.getRect}
         * @return {function | object} The checker function or this Interactable
         */
        rectChecker(): (element: Interact.Element) => any | null;
        rectChecker(checker: (element: Interact.Element) => any): this;
        _backCompatOption(optionName: keyof Interact.Options, newValue: any): any;
        /**
         * Gets or sets the origin of the Interactable's element.  The x and y
         * of the origin will be subtracted from action event coordinates.
         *
         * @param {Element | object | string} [origin] An HTML or SVG Element whose
         * rect will be used, an object eg. { x: 0, y: 0 } or string 'parent', 'self'
         * or any CSS selector
         *
         * @return {object} The current origin or this Interactable
         */
        origin(newValue: any): any;
        /**
         * Returns or sets the mouse coordinate types used to calculate the
         * movement of the pointer.
         *
         * @param {string} [newValue] Use 'client' if you will be scrolling while
         * interacting; Use 'page' if you want autoScroll to work
         * @return {string | object} The current deltaSource or this Interactable
         */
        deltaSource(): DeltaSource;
        deltaSource(newValue: DeltaSource): this;
        /**
         * Gets the selector context Node of the Interactable. The default is
         * `window.document`.
         *
         * @return {Node} The context Node of this Interactable
         */
        context(): Interact.Context;
        inContext(element: Document | Node): boolean;
        testIgnoreAllow(this: Interactable, options: {
            ignoreFrom?: IgnoreValue;
            allowFrom?: IgnoreValue;
        }, targetNode: Node, eventTarget: Node): boolean;
        testAllow(this: Interactable, allowFrom: IgnoreValue, targetNode: Node, element: Node): boolean;
        testIgnore(this: Interactable, ignoreFrom: IgnoreValue, targetNode: Node, element: Node): boolean;
        /**
         * Calls listeners for the given InteractEvent type bound globally
         * and directly to this Interactable
         *
         * @param {InteractEvent} iEvent The InteractEvent object to be fired on this
         * Interactable
         * @return {Interactable} this Interactable
         */
        fire<E extends {
            type: string;
        }>(iEvent: E): this;
        _onOff(method: 'on' | 'off', typeArg: Interact.EventTypes, listenerArg?: Interact.ListenersArg | null, options?: any): this;
        /**
         * Binds a listener for an InteractEvent, pointerEvent or DOM event.
         *
         * @param {string | array | object} types The types of events to listen
         * for
         * @param {function | array | object} [listener] The event listener function(s)
         * @param {object | boolean} [options] options object or useCapture flag for
         * addEventListener
         * @return {Interactable} This Interactable
         */
        on(types: Interact.EventTypes, listener?: Interact.ListenersArg, options?: any): this;
        /**
         * Removes an InteractEvent, pointerEvent or DOM event listener.
         *
         * @param {string | array | object} types The types of events that were
         * listened for
         * @param {function | array | object} [listener] The event listener function(s)
         * @param {object | boolean} [options] options object or useCapture flag for
         * removeEventListener
         * @return {Interactable} This Interactable
         */
        off(types: string | string[] | Interact.EventTypes, listener?: Interact.ListenersArg, options?: any): this;
        /**
         * Reset the options of this Interactable
         *
         * @param {object} options The new settings to apply
         * @return {object} This Interactable
         */
        set(options: Interact.OptionsArg): this;
        /**
         * Remove this interactable from the list of interactables and remove it's
         * action capabilities and event listeners
         */
        unset(): void;
    }
}
declare module "@interactjs/core/PointerInfo" {
    import * as Interact from "@interactjs/types/index";
    export class PointerInfo {
        id: number;
        pointer: Interact.PointerType;
        event: Interact.PointerEventType;
        downTime: number;
        downTarget: Node;
        constructor(id: number, pointer: Interact.PointerType, event: Interact.PointerEventType, downTime: number, downTarget: Node);
    }
}
declare module "@interactjs/core/Interaction" {
    import * as Interact from "@interactjs/types/index";
    import { InteractEvent, EventPhase } from "@interactjs/core/InteractEvent";
    import { Interactable } from "@interactjs/core/Interactable";
    import { PointerInfo } from "@interactjs/core/PointerInfo";
    import { ActionName } from "@interactjs/core/scope";
    export interface ActionProps<T extends ActionName = never> {
        name: T;
        axis?: 'x' | 'y' | 'xy';
        edges?: Interact.EdgeOptions;
    }
    export enum _ProxyValues {
        interactable = "",
        element = "",
        prepared = "",
        pointerIsDown = "",
        pointerWasMoved = "",
        _proxy = ""
    }
    export enum _ProxyMethods {
        start = "",
        move = "",
        end = "",
        stop = "",
        interacting = ""
    }
    export type PointerArgProps<T extends {} = {}> = {
        pointer: Interact.PointerType;
        event: Interact.PointerEventType;
        eventTarget: Node;
        pointerIndex: number;
        pointerInfo: PointerInfo;
        interaction: Interaction<never>;
    } & T;
    export interface DoPhaseArg<T extends ActionName, P extends EventPhase> {
        event: Interact.PointerEventType;
        phase: EventPhase;
        interaction: Interaction<T>;
        iEvent: InteractEvent<T, P>;
        preEnd?: boolean;
        type?: string;
    }
    export type DoAnyPhaseArg = DoPhaseArg<ActionName, EventPhase>;
    module "@interactjs/core/scope" {
        interface SignalArgs {
            'interactions:new': {
                interaction: Interaction<ActionName>;
            };
            'interactions:down': PointerArgProps<{
                type: 'down';
            }>;
            'interactions:move': PointerArgProps<{
                type: 'move';
                dx: number;
                dy: number;
                duplicate: boolean;
            }>;
            'interactions:up': PointerArgProps<{
                type: 'up';
                curEventTarget: EventTarget;
            }>;
            'interactions:cancel': SignalArgs['interactions:up'] & {
                type: 'cancel';
                curEventTarget: EventTarget;
            };
            'interactions:update-pointer': PointerArgProps<{
                down: boolean;
            }>;
            'interactions:remove-pointer': PointerArgProps;
            'interactions:blur': {
                interaction: Interaction;
                event: Event;
                type: 'blur';
            };
            'interactions:before-action-start': Omit<DoAnyPhaseArg, 'iEvent'>;
            'interactions:action-start': DoAnyPhaseArg;
            'interactions:after-action-start': DoAnyPhaseArg;
            'interactions:before-action-move': Omit<DoAnyPhaseArg, 'iEvent'>;
            'interactions:action-move': DoAnyPhaseArg;
            'interactions:after-action-move': DoAnyPhaseArg;
            'interactions:before-action-end': Omit<DoAnyPhaseArg, 'iEvent'>;
            'interactions:action-end': DoAnyPhaseArg;
            'interactions:after-action-end': DoAnyPhaseArg;
            'interactions:stop': {
                interaction: Interaction;
            };
        }
    }
    export type InteractionProxy<T extends ActionName = ActionName> = Pick<Interaction<T>, keyof typeof _ProxyValues | keyof typeof _ProxyMethods>;
    export class Interaction<T extends ActionName = ActionName> {
        interactable: Interactable;
        element: Interact.Element;
        rect: Interact.FullRect;
        _rects?: {
            start: Interact.FullRect;
            corrected: Interact.FullRect;
            previous: Interact.FullRect;
            delta: Interact.FullRect;
        };
        edges: Interact.EdgeOptions;
        _scopeFire: Interact.Scope['fire'];
        prepared: ActionProps<T>;
        pointerType: string;
        pointers: PointerInfo[];
        downEvent: Interact.PointerEventType;
        downPointer: Interact.PointerType;
        _latestPointer: {
            pointer: Interact.PointerType;
            event: Interact.PointerEventType;
            eventTarget: Node;
        };
        prevEvent: InteractEvent<T, EventPhase>;
        pointerIsDown: boolean;
        pointerWasMoved: boolean;
        _interacting: boolean;
        _ending: boolean;
        _stopped: boolean;
        _proxy: InteractionProxy<T>;
        simulation: any;
        /**
         * @alias Interaction.prototype.move
         */
        doMove: (this: void) => any;
        coords: Interact.CoordsSet;
        readonly _id: number;
        /** */
        constructor({ pointerType, scopeFire }: {
            pointerType?: string;
            scopeFire: Interact.Scope['fire'];
        });
        pointerDown(pointer: Interact.PointerType, event: Interact.PointerEventType, eventTarget: Node): void;
        /**
         * ```js
         * interact(target)
         *   .draggable({
         *     // disable the default drag start by down->move
         *     manualStart: true
         *   })
         *   // start dragging after the user holds the pointer down
         *   .on('hold', function (event) {
         *     var interaction = event.interaction
         *
         *     if (!interaction.interacting()) {
         *       interaction.start({ name: 'drag' },
         *                         event.interactable,
         *                         event.currentTarget)
         *     }
         * })
         * ```
         *
         * Start an action with the given Interactable and Element as tartgets. The
         * action must be enabled for the target Interactable and an appropriate
         * number of pointers must be held down - 1 for drag/resize, 2 for gesture.
         *
         * Use it with `interactable.<action>able({ manualStart: false })` to always
         * [start actions manually](https://github.com/taye/interact.js/issues/114)
         *
         * @param {object} action   The action to be performed - drag, resize, etc.
         * @param {Interactable} target  The Interactable to target
         * @param {Element} element The DOM Element to target
         * @return {Boolean} Whether the interaction was successfully started
         */
        start<A extends ActionName>(action: ActionProps<A>, interactable: Interactable, element: Interact.Element): boolean;
        pointerMove(pointer: Interact.PointerType, event: Interact.PointerEventType, eventTarget: Node): void;
        /**
         * ```js
         * interact(target)
         *   .draggable(true)
         *   .on('dragmove', function (event) {
         *     if (someCondition) {
         *       // change the snap settings
         *       event.interactable.draggable({ snap: { targets: [] }})
         *       // fire another move event with re-calculated snap
         *       event.interaction.move()
         *     }
         *   })
         * ```
         *
         * Force a move of the current action at the same coordinates. Useful if
         * snap/restrict has been changed and you want a movement with the new
         * settings.
         */
        move(signalArg?: any): void;
        pointerUp(pointer: Interact.PointerType, event: Interact.PointerEventType, eventTarget: Node, curEventTarget: Interact.EventTarget): void;
        documentBlur(event: Event): void;
        /**
         * ```js
         * interact(target)
         *   .draggable(true)
         *   .on('move', function (event) {
         *     if (event.pageX > 1000) {
         *       // end the current action
         *       event.interaction.end()
         *       // stop all further listeners from being called
         *       event.stopImmediatePropagation()
         *     }
         *   })
         * ```
         *
         * @param {PointerEvent} [event]
         */
        end(event?: Interact.PointerEventType): void;
        currentAction(): T;
        interacting(): boolean;
        /** */
        stop(): void;
        getPointerIndex(pointer: Interact.PointerType): number;
        getPointerInfo(pointer: any): PointerInfo;
        updatePointer(pointer: Interact.PointerType, event: Interact.PointerEventType, eventTarget: Node, down?: boolean): number;
        removePointer(pointer: Interact.PointerType, event: Interact.PointerEventType): void;
        _updateLatestPointer(pointer: Interact.PointerType, event: Interact.PointerEventType, eventTarget: Node): void;
        destroy(): void;
        _createPreparedEvent<P extends EventPhase>(event: Interact.PointerEventType, phase: P, preEnd?: boolean, type?: string): InteractEvent<T, P>;
        _fireEvent<P extends EventPhase>(iEvent: InteractEvent<T, P>): void;
        _doPhase<P extends EventPhase>(signalArg: Omit<DoPhaseArg<T, P>, 'iEvent'> & {
            iEvent?: InteractEvent<T, P>;
        }): boolean;
        _now(): number;
    }
    export default Interaction;
    export { PointerInfo };
}
declare module "@interactjs/core/InteractEvent" {
    import * as Interact from "@interactjs/types/index";
    import { BaseEvent } from "@interactjs/core/BaseEvent";
    import { Interaction } from "@interactjs/core/Interaction";
    export type EventPhase = keyof PhaseMap;
    export interface PhaseMap {
        start: true;
        move: true;
        end: true;
    }
    export interface InteractEvent {
        pageX: number;
        pageY: number;
        clientX: number;
        clientY: number;
        dx: number;
        dy: number;
        velocityX: number;
        velocityY: number;
    }
    export class InteractEvent<T extends Interact.ActionName = never, P extends EventPhase = EventPhase> extends BaseEvent<T> {
        target: Interact.Element;
        currentTarget: Interact.Element;
        relatedTarget: null;
        screenX?: number;
        screenY?: number;
        button: number;
        buttons: number;
        ctrlKey: boolean;
        shiftKey: boolean;
        altKey: boolean;
        metaKey: boolean;
        page: Interact.Point;
        client: Interact.Point;
        delta: Interact.Point;
        rect: Interact.FullRect;
        x0: number;
        y0: number;
        t0: number;
        dt: number;
        duration: number;
        clientX0: number;
        clientY0: number;
        velocity: Interact.Point;
        speed: number;
        swipe: ReturnType<InteractEvent<T>['getSwipe']>;
        timeStamp: any;
        dragEnter?: Interact.Element;
        dragLeave?: Interact.Element;
        axes?: 'x' | 'y' | 'xy';
        preEnd?: boolean;
        /** */
        constructor(interaction: Interaction<T>, event: Interact.PointerEventType, actionName: T, phase: P, element: Interact.Element, preEnd?: boolean, type?: string);
        getSwipe(): {
            up: boolean;
            down: boolean;
            left: boolean;
            right: boolean;
            angle: number;
            speed: number;
            velocity: {
                x: number;
                y: number;
            };
        };
        preventDefault(): void;
        /**
         * Don't call listeners on the remaining targets
         */
        stopImmediatePropagation(): void;
        /**
         * Don't call any other listeners (even on the current target)
         */
        stopPropagation(): void;
    }
}
declare module "@interactjs/actions/drag/plugin" {
    import * as Interact from "@interactjs/types/index";
    module "@interactjs/core/Interactable" {
        interface Interactable {
            draggable: DraggableMethod;
        }
    }
    module "@interactjs/core/defaultOptions" {
        interface ActionDefaults {
            drag: Interact.DraggableOptions;
        }
    }
    module "@interactjs/core/scope" {
        interface ActionMap {
            drag?: typeof drag;
        }
    }
    export type DragEvent = Interact.InteractEvent<'drag'>;
    export type DraggableMethod = Interact.ActionMethod<Interact.DraggableOptions>;
    const drag: Interact.Plugin;
    export default drag;
}
declare module "@interactjs/actions/drop/plugin" {
    import { InteractEvent } from "@interactjs/core/InteractEvent";
    import { Interactable } from "@interactjs/core/Interactable";
    import * as Interact from "@interactjs/types/index";
    export interface DropzoneMethod {
        (this: Interactable, options: Interact.DropzoneOptions | boolean): Interact.Interactable;
        (): Interact.DropzoneOptions;
    }
    module "@interactjs/core/Interactable" {
        interface Interactable {
            dropzone: DropzoneMethod;
            dropCheck: (dragEvent: InteractEvent, event: Interact.PointerEventType, draggable: Interactable, draggableElement: Interact.Element, dropElemen: Interact.Element, rect: any) => boolean;
        }
    }
    module "@interactjs/core/Interaction" {
        interface Interaction {
            dropState?: DropState;
        }
    }
    module "@interactjs/core/defaultOptions" {
        interface ActionDefaults {
            drop: Interact.DropzoneOptions;
        }
    }
    module "@interactjs/core/scope" {
        interface ActionMap {
            drop?: typeof drop;
        }
        interface Scope {
            dynamicDrop?: boolean;
        }
        interface SignalArgs {
            'actions/drop:start': DropSignalArg;
            'actions/drop:move': DropSignalArg;
            'actions/drop:end': DropSignalArg;
        }
    }
    module "@interactjs/core/interactStatic" {
        interface InteractStatic {
            dynamicDrop: (this: Interact.InteractStatic, newValue?: boolean) => boolean | this;
        }
    }
    interface DropSignalArg {
        interaction: Interact.Interaction<'drag'>;
        dragEvent: Interact.DragEvent;
    }
    export interface ActiveDrop {
        dropzone: Interactable;
        element: Interact.Element;
        rect: Interact.Rect;
    }
    export interface DropState {
        cur: {
            dropzone: Interactable;
            element: Interact.Element;
        };
        prev: {
            dropzone: Interactable;
            element: Interact.Element;
        };
        rejected: boolean;
        events: any;
        activeDrops: ActiveDrop[];
    }
    const drop: Interact.Plugin;
    export default drop;
}
declare module "@interactjs/actions/drop/DropEvent" {
    import { BaseEvent } from "@interactjs/core/BaseEvent";
    import { InteractEvent } from "@interactjs/core/InteractEvent";
    import { Interactable } from "@interactjs/core/Interactable";
    import * as Interact from "@interactjs/types/index";
    export class DropEvent extends BaseEvent<'drag'> {
        target: Interact.Element;
        dropzone: Interactable;
        dragEvent: InteractEvent<'drag'>;
        relatedTarget: Interact.Element;
        draggable: Interactable;
        timeStamp: number;
        propagationStopped: boolean;
        immediatePropagationStopped: boolean;
        /**
         * Class of events fired on dropzones during drags with acceptable targets.
         */
        constructor(dropState: import("@interactjs/actions/drop/plugin").DropState, dragEvent: InteractEvent<'drag'>, type: string);
        /**
         * If this is a `dropactivate` event, the dropzone element will be
         * deactivated.
         *
         * If this is a `dragmove` or `dragenter`, a `dragleave` will be fired on the
         * dropzone element and more.
         */
        reject(): void;
        preventDefault(): void;
        stopPropagation(): void;
        stopImmediatePropagation(): void;
    }
}
declare module "@interactjs/actions/gesture/plugin" {
    import * as Interact from "@interactjs/types/index";
    export type GesturableMethod = Interact.ActionMethod<Interact.GesturableOptions>;
    module "@interactjs/core/Interaction" {
        interface Interaction {
            gesture?: {
                angle: number;
                distance: number;
                scale: number;
                startAngle: number;
                startDistance: number;
            };
        }
    }
    module "@interactjs/core/Interactable" {
        interface Interactable {
            gesturable: GesturableMethod;
        }
    }
    module "@interactjs/core/defaultOptions" {
        interface ActionDefaults {
            gesture: Interact.GesturableOptions;
        }
    }
    module "@interactjs/core/scope" {
        interface ActionMap {
            gesture?: typeof gesture;
        }
    }
    export interface GestureEvent extends Interact.InteractEvent<'gesture'> {
        distance: number;
        angle: number;
        da: number;
        scale: number;
        ds: number;
        box: Interact.Rect;
        touches: Interact.PointerType[];
    }
    export interface GestureSignalArg extends Interact.DoPhaseArg<'gesture', Interact.EventPhase> {
        iEvent: GestureEvent;
        interaction: Interact.Interaction<'gesture'>;
    }
    const gesture: Interact.Plugin;
    export default gesture;
}
declare module "@interactjs/actions/resize/plugin" {
    import * as Interact from "@interactjs/types/index";
    export type EdgeName = 'top' | 'left' | 'bottom' | 'right';
    export type ResizableMethod = Interact.ActionMethod<Interact.ResizableOptions>;
    module "@interactjs/core/Interactable" {
        interface Interactable {
            resizable: ResizableMethod;
        }
    }
    module "@interactjs/core/Interaction" {
        interface Interaction {
            resizeAxes: 'x' | 'y' | 'xy';
            resizeStartAspectRatio: number;
        }
    }
    module "@interactjs/core/defaultOptions" {
        interface ActionDefaults {
            resize: Interact.ResizableOptions;
        }
    }
    module "@interactjs/core/scope" {
        interface ActionMap {
            resize?: typeof resize;
        }
    }
    export interface ResizeEvent<P extends Interact.EventPhase = Interact.EventPhase> extends Interact.InteractEvent<'resize', P> {
        deltaRect?: Interact.FullRect;
        edges?: Interact.ActionProps['edges'];
    }
    const resize: Interact.Plugin;
    export default resize;
}
declare module "@interactjs/core/InteractableSet" {
    import { Interactable } from "@interactjs/core/Interactable";
    import * as Interact from "@interactjs/types/index";
    module "@interactjs/core/scope" {
        interface SignalArgs {
            'interactable:new': {
                interactable: Interact.Interactable;
                target: Interact.Target;
                options: Interact.OptionsArg;
                win: Window;
            };
        }
    }
    interface InteractableScopeProp {
        context: Document | Interact.Element;
        interactable: Interact.Interactable;
    }
    export class InteractableSet {
        list: Interact.Interactable[];
        selectorMap: {
            [selector: string]: InteractableScopeProp[];
        };
        scope: Interact.Scope;
        constructor(scope: Interact.Scope);
        new(target: Interact.Target, options?: any): Interactable;
        get(target: Interact.Target, options?: Interact.Options): Interactable;
        forEachMatch<T>(node: Node, callback: (interactable: Interact.Interactable) => T): void | T;
    }
}
declare module "@interactjs/core/interactStatic" {
    /** @module interact */
    import * as Interact from "@interactjs/types/index";
    import * as domUtils from "@interactjs/utils/domUtils";
    import * as pointerUtils from "@interactjs/utils/pointerUtils";
    import { Interactable } from "@interactjs/core/Interactable";
    import { Options } from "@interactjs/core/defaultOptions";
    export interface InteractStatic {
        (target: Interact.Target, options?: Options): Interactable;
        getPointerAverage: typeof pointerUtils.pointerAverage;
        getTouchBBox: typeof pointerUtils.touchBBox;
        getTouchDistance: typeof pointerUtils.touchDistance;
        getTouchAngle: typeof pointerUtils.touchAngle;
        getElementRect: typeof domUtils.getElementRect;
        getElementClientRect: typeof domUtils.getElementClientRect;
        matchesSelector: typeof domUtils.matchesSelector;
        closest: typeof domUtils.closest;
        version: string;
        use(plugin: Interact.Plugin, options?: {
            [key: string]: any;
        }): any;
        isSet(target: Interact.Element, options?: any): boolean;
        on(type: string | Interact.EventTypes, listener: Interact.ListenersArg, options?: object): any;
        off(type: Interact.EventTypes, listener: any, options?: object): any;
        debug(): any;
        supportsTouch(): boolean;
        supportsPointerEvent(): boolean;
        stop(): any;
        pointerMoveTolerance(newValue?: number): any;
        addDocument(doc: Document, options?: object): void;
        removeDocument(doc: Document): void;
    }
    export function createInteractStatic(scope: Interact.Scope): Interact.InteractStatic;
}
declare module "@interactjs/modifiers/Modification" {
    import * as Interact from "@interactjs/types/index";
    import { Modifier, ModifierArg, ModifierState } from "@interactjs/modifiers/base";
    export interface ModificationResult {
        delta: Interact.Point;
        rectDelta: Interact.Rect;
        coords: Interact.Point;
        rect: Interact.FullRect;
        eventProps: any[];
        changed: boolean;
    }
    interface MethodArg {
        phase: Interact.EventPhase;
        pageCoords?: Interact.Point;
        rect?: Interact.FullRect;
        coords?: Interact.Point;
        preEnd?: boolean;
        skipModifiers?: number;
    }
    export default class Modification {
        states: ModifierState[];
        startOffset: Interact.Rect;
        startDelta: Interact.Point;
        result?: ModificationResult;
        endResult?: Interact.Point;
        edges: Interact.EdgeOptions;
        readonly interaction: Readonly<Interact.Interaction>;
        constructor(interaction: Interact.Interaction);
        start({ phase }: MethodArg, pageCoords: Interact.Point): ModificationResult;
        fillArg(arg: Partial<ModifierArg>): void;
        startAll(arg: MethodArg & Partial<ModifierArg>): void;
        setAll(arg: MethodArg & Partial<ModifierArg>): ModificationResult;
        applyToInteraction(arg: {
            phase: Interact.EventPhase;
            rect?: Interact.Rect;
        }): void;
        setAndApply(arg: Partial<Interact.DoAnyPhaseArg> & {
            phase: Interact.EventPhase;
            preEnd?: boolean;
            skipModifiers?: number;
            modifiedCoords?: Interact.Point;
        }): void | false;
        beforeEnd(arg: Omit<Interact.DoAnyPhaseArg, 'iEvent'> & {
            state?: ModifierState;
        }): void | false;
        stop(arg: {
            interaction: Interact.Interaction;
        }): void;
        prepareStates(modifierList: Modifier[]): {
            options: {};
            methods?: {
                start?: (arg: ModifierArg<any>) => void;
                set: (arg: ModifierArg<any>) => void;
                beforeEnd?: (arg: ModifierArg<any>) => void | Interact.Point;
                stop?: (arg: ModifierArg<any>) => void;
            };
            index?: number;
            name?: any;
        }[];
        restoreInteractionCoords({ interaction: { coords, rect, modification } }: {
            interaction: Interact.Interaction;
        }): void;
        shouldDo(options: any, preEnd?: boolean, phase?: string, requireEndOnly?: boolean): boolean;
        copyFrom(other: Modification): void;
        destroy(): void;
    }
    export function getRectOffset(rect: any, coords: any): {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
}
declare module "@interactjs/modifiers/base" {
    import * as Interact from "@interactjs/types/index";
    import Modification from "@interactjs/modifiers/Modification";
    module "@interactjs/core/Interaction" {
        interface Interaction {
            modification?: Modification;
        }
    }
    module "@interactjs/core/InteractEvent" {
        interface InteractEvent {
            modifiers?: Array<{
                name: string;
                [key: string]: any;
            }>;
        }
    }
    module "@interactjs/core/defaultOptions" {
        interface PerActionDefaults {
            modifiers?: Modifier[];
        }
    }
    export interface Modifier<Defaults = any, State extends ModifierState = any, Name extends string = any> {
        options?: Defaults;
        methods: {
            start?: (arg: ModifierArg<State>) => void;
            set: (arg: ModifierArg<State>) => void;
            beforeEnd?: (arg: ModifierArg<State>) => Interact.Point | void;
            stop?: (arg: ModifierArg<State>) => void;
        };
        name?: Name;
        enable: () => Modifier<Defaults, State, Name>;
        disable: () => Modifier<Defaults, State, Name>;
    }
    export type ModifierState<Defaults = {}, StateProps extends {
        [prop: string]: any;
    } = {}, Name extends string = any> = {
        options: Defaults;
        methods?: Modifier<Defaults>['methods'];
        index?: number;
        name?: Name;
    } & StateProps;
    export interface ModifierArg<State extends ModifierState = ModifierState> {
        interaction: Interact.Interaction;
        interactable: Interact.Interactable;
        phase: Interact.EventPhase;
        rect: Interact.FullRect;
        edges: Interact.EdgeOptions;
        state?: State;
        element: Interact.Element;
        pageCoords?: Interact.Point;
        prevCoords?: Interact.Point;
        prevRect?: Interact.FullRect;
        coords?: Interact.Point;
        startOffset?: Interact.Rect;
        preEnd?: boolean;
    }
    export interface ModifierModule<Defaults extends {
        enabled?: boolean;
    }, State extends ModifierState> {
        defaults?: Defaults;
        start?(arg: ModifierArg<State>): void;
        set?(arg: ModifierArg<State>): any;
        beforeEnd?(arg: ModifierArg<State>): Interact.Point | void;
        stop?(arg: ModifierArg<State>): void;
    }
    export interface ModifierFunction<Defaults extends {
        enabled?: boolean;
    }, State extends ModifierState, Name extends string> {
        (_options?: Partial<Defaults>): Modifier<Defaults, State, Name>;
        _defaults: Defaults;
        _methods: ModifierModule<Defaults, State>;
    }
    export function makeModifier<Defaults extends {
        enabled?: boolean;
    }, State extends ModifierState, Name extends string>(module: ModifierModule<Defaults, State>, name?: Name): {
        (_options?: Partial<Defaults>): Modifier<Defaults, State, Name>;
        _defaults: Defaults;
        _methods: {
            start: (arg: ModifierArg<State>) => void;
            set: (arg: ModifierArg<State>) => any;
            beforeEnd: (arg: ModifierArg<State>) => void | Interact.Point;
            stop: (arg: ModifierArg<State>) => void;
        };
    };
    export function addEventModifiers({ iEvent, interaction: { modification: { result } } }: {
        iEvent: Interact.InteractEvent<any>;
        interaction: Interact.Interaction<any>;
    }): void;
    const modifiersBase: Interact.Plugin;
    export default modifiersBase;
}
declare module "@interactjs/modifiers/snap/pointer" {
    import * as Interact from "@interactjs/types/index";
    import { ModifierArg, ModifierState } from "@interactjs/modifiers/base";
    export interface Offset {
        x: number;
        y: number;
        index: number;
        relativePoint?: Interact.Point;
    }
    export interface SnapPosition {
        x?: number;
        y?: number;
        range?: number;
        offset?: Offset;
        [index: string]: any;
    }
    export type SnapFunction = (x: number, y: number, interaction: Interact.InteractionProxy, offset: Offset, index: number) => SnapPosition;
    export type SnapTarget = SnapPosition | SnapFunction;
    export interface SnapOptions {
        targets: SnapTarget[];
        range: number;
        relativePoints: Interact.Point[];
        offset: Interact.Point | Interact.RectResolvable<[Interact.Interaction]> | 'startCoords';
        offsetWithOrigin?: boolean;
        origin: Interact.RectResolvable<[Interact.Element]> | Interact.Point;
        endOnly?: boolean;
        enabled?: boolean;
    }
    export type SnapState = ModifierState<SnapOptions, {
        offsets?: Offset[];
        closest?: any;
        targetFields?: string[][];
    }>;
    function start(arg: ModifierArg<SnapState>): void;
    function set(arg: ModifierArg<SnapState>): {
        target: any;
        inRange: boolean;
        distance: number;
        range: number;
        delta: {
            x: number;
            y: number;
        };
    };
    const snap: {
        start: typeof start;
        set: typeof set;
        defaults: SnapOptions;
    };
    const _default_3: {
        (_options?: Partial<SnapOptions>): import("@interactjs/modifiers/base").Modifier<SnapOptions, ModifierState<SnapOptions, {
            offsets?: Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>, "snap">;
        _defaults: SnapOptions;
        _methods: {
            start: (arg: ModifierArg<ModifierState<SnapOptions, {
                offsets?: Offset[];
                closest?: any;
                targetFields?: string[][];
            }, any>>) => void;
            set: (arg: ModifierArg<ModifierState<SnapOptions, {
                offsets?: Offset[];
                closest?: any;
                targetFields?: string[][];
            }, any>>) => any;
            beforeEnd: (arg: ModifierArg<ModifierState<SnapOptions, {
                offsets?: Offset[];
                closest?: any;
                targetFields?: string[][];
            }, any>>) => void | Interact.Point;
            stop: (arg: ModifierArg<ModifierState<SnapOptions, {
                offsets?: Offset[];
                closest?: any;
                targetFields?: string[][];
            }, any>>) => void;
        };
    };
    export default _default_3;
    export { snap };
}
declare module "@interactjs/pointer-events/PointerEvent" {
    import * as Interact from "@interactjs/types/index";
    import { BaseEvent } from "@interactjs/core/BaseEvent";
    export default class PointerEvent<T extends string = any> extends BaseEvent<never> {
        type: T;
        originalEvent: Interact.PointerEventType;
        pointerId: number;
        pointerType: string;
        double: boolean;
        pageX: number;
        pageY: number;
        clientX: number;
        clientY: number;
        dt: number;
        eventable: any;
        [key: string]: any;
        /** */
        constructor(type: T, pointer: Interact.PointerType | PointerEvent<any>, event: Interact.PointerEventType, eventTarget: Node, interaction: Interact.Interaction<never>, timeStamp: number);
        _subtractOrigin({ x: originX, y: originY }: Interact.Point): this;
        _addOrigin({ x: originX, y: originY }: Interact.Point): this;
        /**
         * Prevent the default behaviour of the original Event
         */
        preventDefault(): void;
    }
    export { PointerEvent };
}
declare module "@interactjs/arrange/plugin" {
    export type ArrangeEvent = {};
    export type ArrangeMode = {};
    const _default_4: {};
    export default _default_4;
}
declare module "@interactjs/utils/raf" {
    function init(window: Window): void;
    const _default_5: {
        request: (callback: FrameRequestCallback) => number;
        cancel: (token: number) => void;
        init: typeof init;
    };
    export default _default_5;
}
declare module "@interactjs/auto-scroll/plugin" {
    import * as Interact from "@interactjs/types/index";
    module "@interactjs/core/scope" {
        interface Scope {
            autoScroll: typeof autoScroll;
        }
    }
    module "@interactjs/core/Interaction" {
        interface Interaction {
            autoScroll?: typeof autoScroll;
        }
    }
    module "@interactjs/core/defaultOptions" {
        interface PerActionDefaults {
            autoScroll?: AutoScrollOptions;
        }
    }
    export interface AutoScrollOptions {
        container?: Window | HTMLElement;
        margin?: number;
        distance?: number;
        interval?: number;
        speed?: number;
        enabled?: boolean;
    }
    const autoScroll: {
        defaults: AutoScrollOptions;
        now: () => number;
        interaction: Interact.Interaction<"drag" | "drop" | "resize" | "gesture">;
        i: number;
        x: number;
        y: number;
        isScrolling: boolean;
        prevTime: number;
        margin: number;
        speed: number;
        start(interaction: Interact.Interaction): void;
        stop(): void;
        scroll(): void;
        check(interactable: Interact.Interactable, actionName: Interact.ActionName): boolean;
        onInteractionMove<T extends "drag" | "drop" | "resize" | "gesture">({ interaction, pointer }: {
            interaction: Interact.Interaction<T>;
            pointer: Interact.PointerType;
        }): void;
    };
    export function getContainer(value: any, interactable: Interact.Interactable, element: Interact.Element): any;
    export function getScroll(container: any): {
        x: any;
        y: any;
    };
    export function getScrollSize(container: any): {
        x: any;
        y: any;
    };
    export function getScrollSizeDelta<T extends Interact.ActionName>({ interaction, element }: {
        interaction: Partial<Interact.Interaction<T>>;
        element: Interact.Element;
    }, func: any): {
        x: number;
        y: number;
    };
    const autoScrollPlugin: Interact.Plugin;
    export default autoScrollPlugin;
}
declare module "@interactjs/auto-start/InteractableMethods" {
    import * as Interact from "@interactjs/types/index";
    module "@interactjs/core/Interactable" {
        interface Interactable {
            getAction: (this: Interact.Interactable, pointer: Interact.PointerType, event: Interact.PointerEventType, interaction: Interact.Interaction, element: Interact.Element) => Interact.ActionProps | null;
            styleCursor: typeof styleCursor;
            actionChecker: typeof actionChecker;
            ignoreFrom: {
                (...args: any[]): Interactable;
                (): boolean;
            };
            allowFrom: {
                (...args: any[]): Interactable;
                (): boolean;
            };
        }
    }
    function install(scope: Interact.Scope): void;
    function styleCursor(this: Interact.Interactable): boolean;
    function styleCursor(this: Interact.Interactable, newValue: boolean): typeof this;
    function actionChecker(this: Interact.Interactable, checker: any): any;
    const _default_6: {
        id: string;
        install: typeof install;
    };
    export default _default_6;
}
declare module "@interactjs/auto-start/base" {
    import * as Interact from "@interactjs/types/index";
    module "@interactjs/core/interactStatic" {
        interface InteractStatic {
            maxInteractions: (newValue: any) => any;
        }
    }
    module "@interactjs/core/scope" {
        interface Scope {
            autoStart: AutoStart;
        }
        interface SignalArgs {
            'autoStart:before-start': Interact.SignalArgs['interactions:move'];
            'autoStart:prepared': {
                interaction: Interact.Interaction;
            };
            'auto-start:check': CheckSignalArg;
        }
    }
    module "@interactjs/core/defaultOptions" {
        interface BaseDefaults {
            actionChecker?: any;
            cursorChecker?: any;
            styleCursor?: any;
        }
        interface PerActionDefaults {
            manualStart?: boolean;
            max?: number;
            maxPerElement?: number;
            allowFrom?: string | Interact.Element;
            ignoreFrom?: string | Interact.Element;
            cursorChecker?: Interact.CursorChecker;
            mouseButtons?: 0 | 1 | 2 | 4 | 8 | 16;
        }
    }
    interface CheckSignalArg {
        interactable: Interact.Interactable;
        interaction: Interact.Interaction;
        element: Interact.Element;
        action: Interact.ActionProps;
        buttons: number;
    }
    export interface AutoStart {
        maxInteractions: number;
        withinInteractionLimit: typeof withinInteractionLimit;
        cursorElement: Interact.Element;
    }
    function withinInteractionLimit<T extends Interact.ActionName>(interactable: Interact.Interactable, element: Interact.Element, action: Interact.ActionProps<T>, scope: Interact.Scope): boolean;
    const autoStart: Interact.Plugin;
    export default autoStart;
}
declare module "@interactjs/auto-start/dragAxis" {
    import * as Interact from "@interactjs/types/index";
    function beforeStart({ interaction, eventTarget, dx, dy }: Interact.SignalArgs['interactions:move'], scope: Interact.Scope): void;
    const _default_7: {
        id: string;
        listeners: {
            'autoStart:before-start': typeof beforeStart;
        };
    };
    export default _default_7;
}
declare module "@interactjs/auto-start/hold" {
    import * as Interact from "@interactjs/types/index";
    module "@interactjs/core/defaultOptions" {
        interface PerActionDefaults {
            hold?: number;
            delay?: number;
        }
    }
    module "@interactjs/core/Interaction" {
        interface Interaction {
            autoStartHoldTimer?: any;
        }
    }
    function install(scope: Interact.Scope): void;
    function getHoldDuration(interaction: Interact.Interaction): number;
    const _default_8: {
        id: string;
        install: typeof install;
        listeners: {
            'interactions:new': ({ interaction }: {
                interaction: any;
            }) => void;
            'autoStart:prepared': ({ interaction }: {
                interaction: any;
            }) => void;
            'interactions:move': ({ interaction, duplicate }: {
                interaction: any;
                duplicate: any;
            }) => void;
            'autoStart:before-start': ({ interaction }: {
                interaction: any;
            }) => void;
        };
        getHoldDuration: typeof getHoldDuration;
    };
    export default _default_8;
}
declare module "@interactjs/auto-start/plugin" {
    import * as Interact from "@interactjs/types/index";
    const _default_9: {
        id: string;
        install(scope: Interact.Scope): void;
    };
    export default _default_9;
}
declare module "@interactjs/core/events" {
    import * as Interact from "@interactjs/types/index";
    module "@interactjs/core/scope" {
        interface Scope {
            events: ReturnType<typeof install>;
        }
    }
    type Listener = (event: Event | FakeEvent) => any;
    function install(scope: Interact.Scope): {
        add: (eventTarget: EventTarget, type: string, listener: Listener, optionalArg?: boolean | any) => void;
        remove: (eventTarget: EventTarget, type: string, listener?: 'all' | Listener, optionalArg?: boolean | any) => void;
        addDelegate: (selector: string, context: Node, type: string, listener: Listener, optionalArg?: any) => void;
        removeDelegate: (selector: string, context: Document | Interact.Element, type: string, listener?: Listener, optionalArg?: any) => void;
        delegateListener: (event: Event | FakeEvent, optionalArg?: any) => void;
        delegateUseCapture: (this: Interact.Element, event: Event | FakeEvent) => any;
        delegatedEvents: {
            [type: string]: {
                selector: string;
                context: Node;
                listeners: Array<[Listener, {
                    capture: boolean;
                    passive: boolean;
                }]>;
            }[];
        };
        documents: Document[];
        targets: {
            eventTarget: EventTarget;
            events: {
                [type: string]: Listener[];
            };
        }[];
        supportsOptions: boolean;
        supportsPassive: boolean;
    };
    class FakeEvent implements Partial<Event> {
        currentTarget: Node;
        originalEvent: Event;
        type: string;
        constructor(originalEvent: Event);
        preventOriginalDefault(): void;
        stopPropagation(): void;
        stopImmediatePropagation(): void;
    }
    const _default_10: {
        id: string;
        install: typeof install;
    };
    export default _default_10;
}
declare module "@interactjs/core/interactablePreventDefault" {
    import * as Interact from "@interactjs/types/index";
    module "@interactjs/core/Interactable" {
        interface Interactable {
            preventDefault: typeof preventDefault;
            checkAndPreventDefault: (event: Event) => void;
        }
    }
    type PreventDefaultValue = 'always' | 'never' | 'auto';
    function preventDefault(this: Interact.Interactable): PreventDefaultValue;
    function preventDefault(this: Interact.Interactable, newValue: PreventDefaultValue): typeof this;
    export function install(scope: Interact.Scope): void;
    const _default_11: {
        id: string;
        install: typeof install;
        listeners: any;
    };
    export default _default_11;
}
declare module "@interactjs/core/interactionFinder" {
    import * as Interact from "@interactjs/types/index";
    export interface SearchDetails {
        pointer: Interact.PointerType;
        pointerId: number;
        pointerType: string;
        eventType: string;
        eventTarget: Interact.EventTarget;
        curEventTarget: Interact.EventTarget;
        scope: Interact.Scope;
    }
    const finder: {
        methodOrder: readonly ["simulationResume", "mouseOrPen", "hasPointer", "idle"];
        search(details: SearchDetails): any;
        simulationResume({ pointerType, eventType, eventTarget, scope }: SearchDetails): import("@interactjs/core/Interaction").Interaction<"drag" | "drop" | "resize" | "gesture">;
        mouseOrPen({ pointerId, pointerType, eventType, scope }: SearchDetails): any;
        hasPointer({ pointerId, scope }: SearchDetails): import("@interactjs/core/Interaction").Interaction<"drag" | "drop" | "resize" | "gesture">;
        idle({ pointerType, scope }: SearchDetails): import("@interactjs/core/Interaction").Interaction<"drag" | "drop" | "resize" | "gesture">;
    };
    export default finder;
}
declare module "@interactjs/core/interactions" {
    import * as Interact from "@interactjs/types/index";
    import InteractionBase from "@interactjs/core/Interaction";
    import { SearchDetails } from "@interactjs/core/interactionFinder";
    module "@interactjs/core/scope" {
        interface Scope {
            Interaction: typeof InteractionBase;
            interactions: {
                new: <T extends Interact.ActionName>(options: any) => InteractionBase<T>;
                list: Array<InteractionBase<ActionName>>;
                listeners: {
                    [type: string]: Interact.Listener;
                };
                docEvents: Array<{
                    type: string;
                    listener: Interact.Listener;
                }>;
                pointerMoveTolerance: number;
            };
            prevTouchTime: number;
        }
    }
    module "@interactjs/core/scope" {
        interface SignalArgs {
            'interactions:find': {
                interaction: InteractionBase;
                searchDetails: SearchDetails;
            };
        }
    }
    const interactions: Interact.Plugin;
    export default interactions;
}
declare module "@interactjs/dev-tools/visualizer/plugin" {
    const _default_12: {};
    export default _default_12;
}
declare module "@interactjs/dev-tools/plugin" {
    import * as Interact from "@interactjs/types/index";
    import visualizer from "@interactjs/dev-tools/visualizer/plugin";
    module "@interactjs/core/scope" {
        interface Scope {
            logger: Logger;
        }
    }
    module "@interactjs/core/interactStatic" {
        interface InteractStatic {
            visializer: typeof visualizer;
        }
    }
    module "@interactjs/core/defaultOptions" {
        interface BaseDefaults {
            devTools?: DevToolsOptions;
        }
    }
    module "@interactjs/core/Interactable" {
        interface Interactable {
            devTools: Interact.OptionMethod<DevToolsOptions>;
        }
    }
    export interface DevToolsOptions {
        ignore: {
            [P in keyof typeof CheckName]?: boolean;
        };
    }
    export interface Logger {
        warn: (...args: any[]) => void;
        error: (...args: any[]) => void;
        log: (...args: any[]) => void;
    }
    export interface Check {
        name: CheckName;
        text: string;
        perform: (interaction: Interact.Interaction) => boolean;
        getInfo: (interaction: Interact.Interaction) => any[];
    }
    enum CheckName {
        touchAction = "touchAction",
        boxSizing = "boxSizing",
        noListeners = "noListeners"
    }
    const defaultExport: Interact.Plugin;
    export default defaultExport;
}
declare module "@interactjs/offset/plugin" {
    import * as Interact from "@interactjs/types/index";
    module "@interactjs/core/Interaction" {
        interface Interaction {
            offsetBy?: typeof offsetBy;
            offset: {
                total: Interact.Point;
                pending: Interact.Point;
            };
        }
        enum _ProxyMethods {
            offsetBy = ""
        }
    }
    export function addTotal(interaction: Interact.Interaction): void;
    export function applyPending(interaction: Interact.Interaction): boolean;
    function offsetBy(this: Interact.Interaction, { x, y }: Interact.Point): void;
    const offset: Interact.Plugin;
    export default offset;
}
declare module "@interactjs/inertia/plugin" {
    import Modification from "@interactjs/modifiers/Modification";
    import * as modifiers from "@interactjs/modifiers/base";
    import * as Interact from "@interactjs/types/index";
    module "@interactjs/core/InteractEvent" {
        interface PhaseMap {
            resume?: true;
            inertiastart?: true;
        }
    }
    module "@interactjs/core/Interaction" {
        interface Interaction {
            inertia?: InertiaState;
        }
    }
    module "@interactjs/core/defaultOptions" {
        interface PerActionDefaults {
            inertia?: {
                enabled?: boolean;
                resistance?: number;
                minSpeed?: number;
                endSpeed?: number;
                allowResume?: true;
                smoothEndDuration?: number;
            };
        }
    }
    module "@interactjs/core/scope" {
        interface SignalArgs {
            'interactions:before-action-inertiastart': Omit<Interact.DoPhaseArg<Interact.ActionName, 'inertiastart'>, 'iEvent'>;
            'interactions:action-inertiastart': Interact.DoPhaseArg<Interact.ActionName, 'inertiastart'>;
            'interactions:after-action-inertiastart': Interact.DoPhaseArg<Interact.ActionName, 'inertiastart'>;
            'interactions:before-action-resume': Omit<Interact.DoPhaseArg<Interact.ActionName, 'resume'>, 'iEvent'>;
            'interactions:action-resume': Interact.DoPhaseArg<Interact.ActionName, 'resume'>;
            'interactions:after-action-resume': Interact.DoPhaseArg<Interact.ActionName, 'resume'>;
        }
    }
    export class InertiaState {
        active: boolean;
        isModified: boolean;
        smoothEnd: boolean;
        allowResume: boolean;
        modification: Modification;
        modifierCount: number;
        modifierArg: modifiers.ModifierArg;
        startCoords: Interact.Point;
        t0: number;
        v0: number;
        te: number;
        targetOffset: Interact.Point;
        modifiedOffset: Interact.Point;
        currentOffset: Interact.Point;
        lambda_v0?: number;
        one_ve_v0?: number;
        timeout: number;
        readonly interaction: Interact.Interaction;
        constructor(interaction: Interact.Interaction);
        start(event: Interact.PointerEventType): boolean;
        startInertia(): void;
        startSmoothEnd(): void;
        onNextFrame(tickFn: () => void): void;
        inertiaTick(): void;
        smoothEndTick(): void;
        resume({ pointer, event, eventTarget }: Interact.SignalArgs['interactions:down']): void;
        end(): void;
        stop(): void;
    }
    const inertia: Interact.Plugin;
    export default inertia;
}
declare module "@interactjs/snappers/edgeTarget" {
    const _default_13: () => void;
    export default _default_13;
}
declare module "@interactjs/snappers/elements" {
    const _default_14: () => void;
    export default _default_14;
}
declare module "@interactjs/snappers/grid" {
    import * as Interact from "@interactjs/types/index";
    export type GridOptions = (Partial<Interact.Rect> | Interact.Point) & {
        range?: number;
        limits?: Interact.Rect;
        offset?: Interact.Point;
    };
    const _default_15: (grid: GridOptions) => import("@interactjs/modifiers/snap/pointer").SnapFunction & {
        grid: GridOptions;
        coordFields: (readonly ["x", "y"] | readonly ["left", "top"] | readonly ["right", "bottom"] | readonly ["width", "height"])[];
    };
    export default _default_15;
}
declare module "@interactjs/snappers/all" {
    export { default as edgeTarget } from "@interactjs/snappers/edgeTarget";
    export { default as elements } from "@interactjs/snappers/elements";
    export { default as grid } from "@interactjs/snappers/grid";
}
declare module "@interactjs/snappers/plugin" {
    import * as Interact from "@interactjs/types/index";
    import * as allSnappers from "@interactjs/snappers/all";
    module "@interactjs/core/interactStatic" {
        interface InteractStatic {
            snappers: typeof allSnappers;
            createSnapGrid: typeof allSnappers.grid;
        }
    }
    const snappersPlugin: Interact.Plugin;
    export default snappersPlugin;
}
declare module "@interactjs/modifiers/aspectRatio" {
    /**
     * @module modifiers/aspectRatio
     *
     * @description
     * This module forces elements to be resized with a specified dx/dy ratio.
     *
     * ```js
     * interact(target).resizable({
     *   modifiers: [
     *     interact.modifiers.snapSize({
     *       targets: [ interact.snappers.grid({ x: 20, y: 20 }) ],
     *     }),
     *     interact.aspectRatio({ ratio: 'preserve' }),
     *   ],
     * });
     * ```
     */
    import * as Interact from "@interactjs/types/index";
    import Modification from "@interactjs/modifiers/Modification";
    import { Modifier, ModifierModule, ModifierState } from "@interactjs/modifiers/base";
    export interface AspectRatioOptions {
        ratio?: number | 'preserve';
        equalDelta?: boolean;
        modifiers?: Modifier[];
        enabled?: boolean;
    }
    export type AspectRatioState = ModifierState<AspectRatioOptions, {
        startCoords: Interact.Point;
        startRect: Interact.Rect;
        linkedEdges: Interact.EdgeOptions;
        ratio: number;
        equalDelta: boolean;
        xIsPrimaryAxis: boolean;
        edgeSign: 1 | -1;
        subModification: Modification;
    }>;
    const aspectRatio: ModifierModule<AspectRatioOptions, AspectRatioState>;
    const _default_16: {
        (_options?: Partial<AspectRatioOptions>): Modifier<AspectRatioOptions, ModifierState<AspectRatioOptions, {
            startCoords: Interact.Point;
            startRect: Interact.Rect;
            linkedEdges: Interact.EdgeOptions;
            ratio: number;
            equalDelta: boolean;
            xIsPrimaryAxis: boolean;
            edgeSign: 1 | -1;
            subModification: Modification;
        }, any>, "aspectRatio">;
        _defaults: AspectRatioOptions;
        _methods: {
            start: (arg: import("@interactjs/modifiers/base").ModifierArg<ModifierState<AspectRatioOptions, {
                startCoords: Interact.Point;
                startRect: Interact.Rect;
                linkedEdges: Interact.EdgeOptions;
                ratio: number;
                equalDelta: boolean;
                xIsPrimaryAxis: boolean;
                edgeSign: 1 | -1;
                subModification: Modification;
            }, any>>) => void;
            set: (arg: import("@interactjs/modifiers/base").ModifierArg<ModifierState<AspectRatioOptions, {
                startCoords: Interact.Point;
                startRect: Interact.Rect;
                linkedEdges: Interact.EdgeOptions;
                ratio: number;
                equalDelta: boolean;
                xIsPrimaryAxis: boolean;
                edgeSign: 1 | -1;
                subModification: Modification;
            }, any>>) => any;
            beforeEnd: (arg: import("@interactjs/modifiers/base").ModifierArg<ModifierState<AspectRatioOptions, {
                startCoords: Interact.Point;
                startRect: Interact.Rect;
                linkedEdges: Interact.EdgeOptions;
                ratio: number;
                equalDelta: boolean;
                xIsPrimaryAxis: boolean;
                edgeSign: 1 | -1;
                subModification: Modification;
            }, any>>) => void | Interact.Point;
            stop: (arg: import("@interactjs/modifiers/base").ModifierArg<ModifierState<AspectRatioOptions, {
                startCoords: Interact.Point;
                startRect: Interact.Rect;
                linkedEdges: Interact.EdgeOptions;
                ratio: number;
                equalDelta: boolean;
                xIsPrimaryAxis: boolean;
                edgeSign: 1 | -1;
                subModification: Modification;
            }, any>>) => void;
        };
    };
    export default _default_16;
    export { aspectRatio };
}
declare module "@interactjs/modifiers/noop" {
    import { ModifierFunction } from "@interactjs/modifiers/base";
    const noop: ModifierFunction<any, any, "noop">;
    export default noop;
}
declare module "@interactjs/modifiers/avoid" {
    export { default } from "@interactjs/modifiers/noop";
}
declare module "@interactjs/modifiers/restrict/pointer" {
    import * as Interact from "@interactjs/types/index";
    import { ModifierArg, ModifierModule, ModifierState } from "@interactjs/modifiers/base";
    export interface RestrictOptions {
        restriction: Interact.RectResolvable<[number, number, Interact.Interaction]>;
        elementRect: Interact.Rect;
        offset: Interact.Rect;
        endOnly: boolean;
        enabled?: boolean;
    }
    export type RestrictState = ModifierState<RestrictOptions, {
        offset: Interact.Rect;
    }>;
    export function getRestrictionRect(value: Interact.RectResolvable<[number, number, Interact.Interaction]>, interaction: Interact.Interaction, coords?: Interact.Point): Interact.Rect;
    const restrict: ModifierModule<RestrictOptions, RestrictState>;
    const _default_17: {
        (_options?: Partial<RestrictOptions>): import("@interactjs/modifiers/base").Modifier<RestrictOptions, ModifierState<RestrictOptions, {
            offset: Interact.Rect;
        }, any>, "restrict">;
        _defaults: RestrictOptions;
        _methods: {
            start: (arg: ModifierArg<ModifierState<RestrictOptions, {
                offset: Interact.Rect;
            }, any>>) => void;
            set: (arg: ModifierArg<ModifierState<RestrictOptions, {
                offset: Interact.Rect;
            }, any>>) => any;
            beforeEnd: (arg: ModifierArg<ModifierState<RestrictOptions, {
                offset: Interact.Rect;
            }, any>>) => void | Interact.Point;
            stop: (arg: ModifierArg<ModifierState<RestrictOptions, {
                offset: Interact.Rect;
            }, any>>) => void;
        };
    };
    export default _default_17;
    export { restrict };
}
declare module "@interactjs/modifiers/restrict/edges" {
    import * as Interact from "@interactjs/types/index";
    import { ModifierArg, ModifierState } from "@interactjs/modifiers/base";
    import { RestrictOptions } from "@interactjs/modifiers/restrict/pointer";
    export interface RestrictEdgesOptions {
        inner: RestrictOptions['restriction'];
        outer: RestrictOptions['restriction'];
        offset?: RestrictOptions['offset'];
        endOnly: boolean;
        enabled?: boolean;
    }
    export type RestrictEdgesState = ModifierState<RestrictEdgesOptions, {
        inner: Interact.Rect;
        outer: Interact.Rect;
        offset: RestrictEdgesOptions['offset'];
    }>;
    function start({ interaction, startOffset, state }: ModifierArg<RestrictEdgesState>): void;
    function set({ coords, edges, interaction, state }: ModifierArg<RestrictEdgesState>): void;
    const restrictEdges: {
        noInner: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
        noOuter: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
        start: typeof start;
        set: typeof set;
        defaults: RestrictEdgesOptions;
    };
    const _default_18: {
        (_options?: Partial<RestrictEdgesOptions>): import("@interactjs/modifiers/base").Modifier<RestrictEdgesOptions, ModifierState<RestrictEdgesOptions, {
            inner: Interact.Rect;
            outer: Interact.Rect;
            offset: Interact.Rect;
        }, any>, "restrictEdges">;
        _defaults: RestrictEdgesOptions;
        _methods: {
            start: (arg: ModifierArg<ModifierState<RestrictEdgesOptions, {
                inner: Interact.Rect;
                outer: Interact.Rect;
                offset: Interact.Rect;
            }, any>>) => void;
            set: (arg: ModifierArg<ModifierState<RestrictEdgesOptions, {
                inner: Interact.Rect;
                outer: Interact.Rect;
                offset: Interact.Rect;
            }, any>>) => any;
            beforeEnd: (arg: ModifierArg<ModifierState<RestrictEdgesOptions, {
                inner: Interact.Rect;
                outer: Interact.Rect;
                offset: Interact.Rect;
            }, any>>) => void | Interact.Point;
            stop: (arg: ModifierArg<ModifierState<RestrictEdgesOptions, {
                inner: Interact.Rect;
                outer: Interact.Rect;
                offset: Interact.Rect;
            }, any>>) => void;
        };
    };
    export default _default_18;
    export { restrictEdges };
}
declare module "@interactjs/modifiers/restrict/rect" {
    const restrictRect: {
        start: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
            offset: import("@interactjs/types").Rect;
        }, any>>) => void;
        set: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
            offset: import("@interactjs/types").Rect;
        }, any>>) => any;
        defaults: import("@interactjs/modifiers/restrict/pointer").RestrictOptions & {
            elementRect: {
                top: number;
                left: number;
                bottom: number;
                right: number;
            };
        };
    };
    const _default_19: {
        (_options?: Partial<import("@interactjs/modifiers/restrict/pointer").RestrictOptions & {
            elementRect: {
                top: number;
                left: number;
                bottom: number;
                right: number;
            };
        }>): import("@interactjs/modifiers/base").Modifier<import("@interactjs/modifiers/restrict/pointer").RestrictOptions & {
            elementRect: {
                top: number;
                left: number;
                bottom: number;
                right: number;
            };
        }, import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
            offset: import("@interactjs/types").Rect;
        }, any>, "restrictRect">;
        _defaults: import("@interactjs/modifiers/restrict/pointer").RestrictOptions & {
            elementRect: {
                top: number;
                left: number;
                bottom: number;
                right: number;
            };
        };
        _methods: {
            start: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
                offset: import("@interactjs/types").Rect;
            }, any>>) => void;
            set: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
                offset: import("@interactjs/types").Rect;
            }, any>>) => any;
            beforeEnd: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
                offset: import("@interactjs/types").Rect;
            }, any>>) => void | import("@interactjs/types").Point;
            stop: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
                offset: import("@interactjs/types").Rect;
            }, any>>) => void;
        };
    };
    export default _default_19;
    export { restrictRect };
}
declare module "@interactjs/modifiers/restrict/size" {
    import * as Interact from "@interactjs/types/index";
    import { ModifierArg, ModifierState } from "@interactjs/modifiers/base";
    import { RestrictEdgesState } from "@interactjs/modifiers/restrict/edges";
    import { RestrictOptions } from "@interactjs/modifiers/restrict/pointer";
    export interface RestrictSizeOptions {
        min?: Interact.Size | Interact.Point | RestrictOptions['restriction'];
        max?: Interact.Size | Interact.Point | RestrictOptions['restriction'];
        endOnly: boolean;
        enabled?: boolean;
    }
    function start(arg: ModifierArg<RestrictEdgesState>): void;
    export type RestrictSizeState = RestrictEdgesState & ModifierState<RestrictSizeOptions & {
        inner: Interact.Rect;
        outer: Interact.Rect;
    }, {
        min: Interact.Rect;
        max: Interact.Rect;
    }>;
    function set(arg: ModifierArg<RestrictSizeState>): void;
    const restrictSize: {
        start: typeof start;
        set: typeof set;
        defaults: RestrictSizeOptions;
    };
    const _default_20: {
        (_options?: Partial<RestrictSizeOptions>): import("@interactjs/modifiers/base").Modifier<RestrictSizeOptions, ModifierState<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, {
            inner: Interact.Rect;
            outer: Interact.Rect;
            offset: Interact.Rect;
        }, any>, "restrictSize">;
        _defaults: RestrictSizeOptions;
        _methods: {
            start: (arg: ModifierArg<ModifierState<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, {
                inner: Interact.Rect;
                outer: Interact.Rect;
                offset: Interact.Rect;
            }, any>>) => void;
            set: (arg: ModifierArg<ModifierState<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, {
                inner: Interact.Rect;
                outer: Interact.Rect;
                offset: Interact.Rect;
            }, any>>) => any;
            beforeEnd: (arg: ModifierArg<ModifierState<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, {
                inner: Interact.Rect;
                outer: Interact.Rect;
                offset: Interact.Rect;
            }, any>>) => void | Interact.Point;
            stop: (arg: ModifierArg<ModifierState<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, {
                inner: Interact.Rect;
                outer: Interact.Rect;
                offset: Interact.Rect;
            }, any>>) => void;
        };
    };
    export default _default_20;
    export { restrictSize };
}
declare module "@interactjs/modifiers/rubberband" {
    export { default } from "@interactjs/modifiers/noop";
}
declare module "@interactjs/modifiers/snap/size" {
    import { ModifierArg } from "@interactjs/modifiers/base";
    import { SnapOptions, SnapState } from "@interactjs/modifiers/snap/pointer";
    export type SnapSizeOptions = Pick<SnapOptions, 'targets' | 'offset' | 'endOnly' | 'range' | 'enabled'>;
    function start(arg: ModifierArg<SnapState>): any;
    function set(arg: any): {
        target: any;
        inRange: boolean;
        distance: number;
        range: number;
        delta: {
            x: number;
            y: number;
        };
    };
    const snapSize: {
        start: typeof start;
        set: typeof set;
        defaults: Pick<SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">;
    };
    const _default_21: {
        (_options?: Partial<Pick<SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">>): import("@interactjs/modifiers/base").Modifier<Pick<SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">, import("@interactjs/modifiers/base").ModifierState<SnapOptions, {
            offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>, "snapSize">;
        _defaults: Pick<SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">;
        _methods: {
            start: (arg: ModifierArg<import("@interactjs/modifiers/base").ModifierState<SnapOptions, {
                offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                closest?: any;
                targetFields?: string[][];
            }, any>>) => void;
            set: (arg: ModifierArg<import("@interactjs/modifiers/base").ModifierState<SnapOptions, {
                offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                closest?: any;
                targetFields?: string[][];
            }, any>>) => any;
            beforeEnd: (arg: ModifierArg<import("@interactjs/modifiers/base").ModifierState<SnapOptions, {
                offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                closest?: any;
                targetFields?: string[][];
            }, any>>) => void | import("@interactjs/types").Point;
            stop: (arg: ModifierArg<import("@interactjs/modifiers/base").ModifierState<SnapOptions, {
                offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                closest?: any;
                targetFields?: string[][];
            }, any>>) => void;
        };
    };
    export default _default_21;
    export { snapSize };
}
declare module "@interactjs/modifiers/snap/edges" {
    import { ModifierArg, ModifierModule } from "@interactjs/modifiers/base";
    import { SnapOptions, SnapState } from "@interactjs/modifiers/snap/pointer";
    export type SnapEdgesOptions = Pick<SnapOptions, 'targets' | 'range' | 'offset' | 'endOnly' | 'enabled'>;
    const snapEdges: ModifierModule<SnapEdgesOptions, SnapState>;
    const _default_22: {
        (_options?: Partial<Pick<SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">>): import("@interactjs/modifiers/base").Modifier<Pick<SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">, import("@interactjs/modifiers/base").ModifierState<SnapOptions, {
            offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>, "snapEdges">;
        _defaults: Pick<SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">;
        _methods: {
            start: (arg: ModifierArg<import("@interactjs/modifiers/base").ModifierState<SnapOptions, {
                offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                closest?: any;
                targetFields?: string[][];
            }, any>>) => void;
            set: (arg: ModifierArg<import("@interactjs/modifiers/base").ModifierState<SnapOptions, {
                offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                closest?: any;
                targetFields?: string[][];
            }, any>>) => any;
            beforeEnd: (arg: ModifierArg<import("@interactjs/modifiers/base").ModifierState<SnapOptions, {
                offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                closest?: any;
                targetFields?: string[][];
            }, any>>) => void | import("@interactjs/types").Point;
            stop: (arg: ModifierArg<import("@interactjs/modifiers/base").ModifierState<SnapOptions, {
                offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                closest?: any;
                targetFields?: string[][];
            }, any>>) => void;
        };
    };
    export default _default_22;
    export { snapEdges };
}
declare module "@interactjs/modifiers/spring" {
    export { default } from "@interactjs/modifiers/noop";
}
declare module "@interactjs/modifiers/transform" {
    export { default } from "@interactjs/modifiers/noop";
}
declare module "@interactjs/modifiers/all" {
    const _default_23: {
        aspectRatio: {
            (_options?: Partial<import("@interactjs/modifiers/aspectRatio").AspectRatioOptions>): import("@interactjs/modifiers/base").Modifier<import("@interactjs/modifiers/aspectRatio").AspectRatioOptions, import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/aspectRatio").AspectRatioOptions, {
                startCoords: import("@interactjs/types").Point;
                startRect: import("@interactjs/types").Rect;
                linkedEdges: import("@interactjs/types").EdgeOptions;
                ratio: number;
                equalDelta: boolean;
                xIsPrimaryAxis: boolean;
                edgeSign: 1 | -1;
                subModification: import("@interactjs/modifiers/Modification").default;
            }, any>, "aspectRatio">;
            _defaults: import("@interactjs/modifiers/aspectRatio").AspectRatioOptions;
            _methods: {
                start: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/aspectRatio").AspectRatioOptions, {
                    startCoords: import("@interactjs/types").Point;
                    startRect: import("@interactjs/types").Rect;
                    linkedEdges: import("@interactjs/types").EdgeOptions;
                    ratio: number;
                    equalDelta: boolean;
                    xIsPrimaryAxis: boolean;
                    edgeSign: 1 | -1;
                    subModification: import("@interactjs/modifiers/Modification").default;
                }, any>>) => void;
                set: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/aspectRatio").AspectRatioOptions, {
                    startCoords: import("@interactjs/types").Point;
                    startRect: import("@interactjs/types").Rect;
                    linkedEdges: import("@interactjs/types").EdgeOptions;
                    ratio: number;
                    equalDelta: boolean;
                    xIsPrimaryAxis: boolean;
                    edgeSign: 1 | -1;
                    subModification: import("@interactjs/modifiers/Modification").default;
                }, any>>) => any;
                beforeEnd: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/aspectRatio").AspectRatioOptions, {
                    startCoords: import("@interactjs/types").Point;
                    startRect: import("@interactjs/types").Rect;
                    linkedEdges: import("@interactjs/types").EdgeOptions;
                    ratio: number;
                    equalDelta: boolean;
                    xIsPrimaryAxis: boolean;
                    edgeSign: 1 | -1;
                    subModification: import("@interactjs/modifiers/Modification").default;
                }, any>>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/aspectRatio").AspectRatioOptions, {
                    startCoords: import("@interactjs/types").Point;
                    startRect: import("@interactjs/types").Rect;
                    linkedEdges: import("@interactjs/types").EdgeOptions;
                    ratio: number;
                    equalDelta: boolean;
                    xIsPrimaryAxis: boolean;
                    edgeSign: 1 | -1;
                    subModification: import("@interactjs/modifiers/Modification").default;
                }, any>>) => void;
            };
        };
        restrictEdges: {
            (_options?: Partial<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions>): import("@interactjs/modifiers/base").Modifier<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, {
                inner: import("@interactjs/types").Rect;
                outer: import("@interactjs/types").Rect;
                offset: import("@interactjs/types").Rect;
            }, any>, "restrictEdges">;
            _defaults: import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions;
            _methods: {
                start: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, {
                    inner: import("@interactjs/types").Rect;
                    outer: import("@interactjs/types").Rect;
                    offset: import("@interactjs/types").Rect;
                }, any>>) => void;
                set: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, {
                    inner: import("@interactjs/types").Rect;
                    outer: import("@interactjs/types").Rect;
                    offset: import("@interactjs/types").Rect;
                }, any>>) => any;
                beforeEnd: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, {
                    inner: import("@interactjs/types").Rect;
                    outer: import("@interactjs/types").Rect;
                    offset: import("@interactjs/types").Rect;
                }, any>>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, {
                    inner: import("@interactjs/types").Rect;
                    outer: import("@interactjs/types").Rect;
                    offset: import("@interactjs/types").Rect;
                }, any>>) => void;
            };
        };
        restrict: {
            (_options?: Partial<import("@interactjs/modifiers/restrict/pointer").RestrictOptions>): import("@interactjs/modifiers/base").Modifier<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
                offset: import("@interactjs/types").Rect;
            }, any>, "restrict">;
            _defaults: import("@interactjs/modifiers/restrict/pointer").RestrictOptions;
            _methods: {
                start: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
                    offset: import("@interactjs/types").Rect;
                }, any>>) => void;
                set: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
                    offset: import("@interactjs/types").Rect;
                }, any>>) => any;
                beforeEnd: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
                    offset: import("@interactjs/types").Rect;
                }, any>>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
                    offset: import("@interactjs/types").Rect;
                }, any>>) => void;
            };
        };
        restrictRect: {
            (_options?: Partial<import("@interactjs/modifiers/restrict/pointer").RestrictOptions & {
                elementRect: {
                    top: number;
                    left: number;
                    bottom: number;
                    right: number;
                };
            }>): import("@interactjs/modifiers/base").Modifier<import("@interactjs/modifiers/restrict/pointer").RestrictOptions & {
                elementRect: {
                    top: number;
                    left: number;
                    bottom: number;
                    right: number;
                };
            }, import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
                offset: import("@interactjs/types").Rect;
            }, any>, "restrictRect">;
            _defaults: import("@interactjs/modifiers/restrict/pointer").RestrictOptions & {
                elementRect: {
                    top: number;
                    left: number;
                    bottom: number;
                    right: number;
                };
            };
            _methods: {
                start: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
                    offset: import("@interactjs/types").Rect;
                }, any>>) => void;
                set: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
                    offset: import("@interactjs/types").Rect;
                }, any>>) => any;
                beforeEnd: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
                    offset: import("@interactjs/types").Rect;
                }, any>>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, {
                    offset: import("@interactjs/types").Rect;
                }, any>>) => void;
            };
        };
        restrictSize: {
            (_options?: Partial<import("@interactjs/modifiers/restrict/size").RestrictSizeOptions>): import("@interactjs/modifiers/base").Modifier<import("@interactjs/modifiers/restrict/size").RestrictSizeOptions, import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, {
                inner: import("@interactjs/types").Rect;
                outer: import("@interactjs/types").Rect;
                offset: import("@interactjs/types").Rect;
            }, any>, "restrictSize">;
            _defaults: import("@interactjs/modifiers/restrict/size").RestrictSizeOptions;
            _methods: {
                start: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, {
                    inner: import("@interactjs/types").Rect;
                    outer: import("@interactjs/types").Rect;
                    offset: import("@interactjs/types").Rect;
                }, any>>) => void;
                set: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, {
                    inner: import("@interactjs/types").Rect;
                    outer: import("@interactjs/types").Rect;
                    offset: import("@interactjs/types").Rect;
                }, any>>) => any;
                beforeEnd: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, {
                    inner: import("@interactjs/types").Rect;
                    outer: import("@interactjs/types").Rect;
                    offset: import("@interactjs/types").Rect;
                }, any>>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, {
                    inner: import("@interactjs/types").Rect;
                    outer: import("@interactjs/types").Rect;
                    offset: import("@interactjs/types").Rect;
                }, any>>) => void;
            };
        };
        snapEdges: {
            (_options?: Partial<Pick<import("@interactjs/modifiers/snap/pointer").SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">>): import("@interactjs/modifiers/base").Modifier<Pick<import("@interactjs/modifiers/snap/pointer").SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">, import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/snap/pointer").SnapOptions, {
                offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                closest?: any;
                targetFields?: string[][];
            }, any>, "snapEdges">;
            _defaults: Pick<import("@interactjs/modifiers/snap/pointer").SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">;
            _methods: {
                start: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/snap/pointer").SnapOptions, {
                    offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                    closest?: any;
                    targetFields?: string[][];
                }, any>>) => void;
                set: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/snap/pointer").SnapOptions, {
                    offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                    closest?: any;
                    targetFields?: string[][];
                }, any>>) => any;
                beforeEnd: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/snap/pointer").SnapOptions, {
                    offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                    closest?: any;
                    targetFields?: string[][];
                }, any>>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/snap/pointer").SnapOptions, {
                    offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                    closest?: any;
                    targetFields?: string[][];
                }, any>>) => void;
            };
        };
        snap: {
            (_options?: Partial<import("@interactjs/modifiers/snap/pointer").SnapOptions>): import("@interactjs/modifiers/base").Modifier<import("@interactjs/modifiers/snap/pointer").SnapOptions, import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/snap/pointer").SnapOptions, {
                offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                closest?: any;
                targetFields?: string[][];
            }, any>, "snap">;
            _defaults: import("@interactjs/modifiers/snap/pointer").SnapOptions;
            _methods: {
                start: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/snap/pointer").SnapOptions, {
                    offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                    closest?: any;
                    targetFields?: string[][];
                }, any>>) => void;
                set: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/snap/pointer").SnapOptions, {
                    offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                    closest?: any;
                    targetFields?: string[][];
                }, any>>) => any;
                beforeEnd: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/snap/pointer").SnapOptions, {
                    offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                    closest?: any;
                    targetFields?: string[][];
                }, any>>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/snap/pointer").SnapOptions, {
                    offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                    closest?: any;
                    targetFields?: string[][];
                }, any>>) => void;
            };
        };
        snapSize: {
            (_options?: Partial<Pick<import("@interactjs/modifiers/snap/pointer").SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">>): import("@interactjs/modifiers/base").Modifier<Pick<import("@interactjs/modifiers/snap/pointer").SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">, import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/snap/pointer").SnapOptions, {
                offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                closest?: any;
                targetFields?: string[][];
            }, any>, "snapSize">;
            _defaults: Pick<import("@interactjs/modifiers/snap/pointer").SnapOptions, "enabled" | "offset" | "range" | "endOnly" | "targets">;
            _methods: {
                start: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/snap/pointer").SnapOptions, {
                    offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                    closest?: any;
                    targetFields?: string[][];
                }, any>>) => void;
                set: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/snap/pointer").SnapOptions, {
                    offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                    closest?: any;
                    targetFields?: string[][];
                }, any>>) => any;
                beforeEnd: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/snap/pointer").SnapOptions, {
                    offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                    closest?: any;
                    targetFields?: string[][];
                }, any>>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/base").ModifierArg<import("@interactjs/modifiers/base").ModifierState<import("@interactjs/modifiers/snap/pointer").SnapOptions, {
                    offsets?: import("@interactjs/modifiers/snap/pointer").Offset[];
                    closest?: any;
                    targetFields?: string[][];
                }, any>>) => void;
            };
        };
        spring: import("@interactjs/modifiers/base").ModifierFunction<any, any, "noop">;
        avoid: import("@interactjs/modifiers/base").ModifierFunction<any, any, "noop">;
        transform: import("@interactjs/modifiers/base").ModifierFunction<any, any, "noop">;
        rubberband: import("@interactjs/modifiers/base").ModifierFunction<any, any, "noop">;
    };
    export default _default_23;
}
declare module "@interactjs/modifiers/plugin" {
    import * as Interact from "@interactjs/types/index";
    import all from "@interactjs/modifiers/all";
    module "@interactjs/core/interactStatic" {
        interface InteractStatic {
            modifiers: typeof all;
        }
    }
    const modifiers: Interact.Plugin;
    export default modifiers;
}
declare module "@interactjs/pointer-events/base" {
    import { Eventable } from "@interactjs/core/Eventable";
    import { Interaction } from "@interactjs/core/Interaction";
    import { PerActionDefaults } from "@interactjs/core/defaultOptions";
    import * as Interact from "@interactjs/types/index";
    import { PointerEvent } from "@interactjs/pointer-events/PointerEvent";
    export type EventTargetList = Array<{
        node: Node;
        eventable: Eventable;
        props: {
            [key: string]: any;
        };
    }>;
    export interface PointerEventOptions extends PerActionDefaults {
        enabled?: undefined;
        holdDuration?: number;
        ignoreFrom?: any;
        allowFrom?: any;
        origin?: Interact.Point | string | Interact.Element;
    }
    module "@interactjs/core/scope" {
        interface Scope {
            pointerEvents: typeof pointerEvents;
        }
    }
    module "@interactjs/core/Interaction" {
        interface Interaction {
            prevTap?: PointerEvent<string>;
            tapTime?: number;
        }
    }
    module "@interactjs/core/PointerInfo" {
        interface PointerInfo {
            hold?: {
                duration: number;
                timeout: any;
            };
        }
    }
    module "@interactjs/core/defaultOptions" {
        interface ActionDefaults {
            pointerEvents: Interact.Options;
        }
    }
    module "@interactjs/core/scope" {
        interface SignalArgs {
            'pointerEvents:new': {
                pointerEvent: PointerEvent<any>;
            };
            'pointerEvents:fired': {
                interaction: Interaction<never>;
                pointer: Interact.PointerType | PointerEvent<any>;
                event: Interact.PointerEventType | PointerEvent<any>;
                eventTarget: Node;
                pointerEvent: PointerEvent<any>;
                targets?: EventTargetList;
                type: string;
            };
            'pointerEvents:collect-targets': {
                interaction: Interaction<never>;
                pointer: Interact.PointerType | PointerEvent<any>;
                event: Interact.PointerEventType | PointerEvent<any>;
                eventTarget: Node;
                targets?: EventTargetList;
                type: string;
                path: Node[];
                node: null;
            };
        }
    }
    const pointerEvents: Interact.Plugin;
    export default pointerEvents;
}
declare module "@interactjs/pointer-events/interactableTargets" {
    import * as Interact from "@interactjs/types/index";
    module "@interactjs/core/Interactable" {
        interface Interactable {
            pointerEvents: typeof pointerEventsMethod;
            __backCompatOption: (optionName: string, newValue: any) => any;
        }
    }
    function pointerEventsMethod(this: Interact.Interactable, options: any): import("@interactjs/core/Interactable").Interactable;
    const plugin: Interact.Plugin;
    export default plugin;
}
declare module "@interactjs/reflow/plugin" {
    import { Interactable } from "@interactjs/core/Interactable";
    import { ActionProps } from "@interactjs/core/Interaction";
    import { Scope } from "@interactjs/core/scope";
    import * as Interact from "@interactjs/types/index";
    module "@interactjs/core/scope" {
        interface SignalArgs {
            'interactions:before-action-reflow': Omit<Interact.DoAnyPhaseArg, 'iEvent'>;
            'interactions:action-reflow': Interact.DoAnyPhaseArg;
            'interactions:after-action-reflow': Interact.DoAnyPhaseArg;
        }
    }
    module "@interactjs/core/Interactable" {
        interface Interactable {
            reflow: <T extends Interact.ActionName>(action: ActionProps<T>) => ReturnType<typeof reflow>;
        }
    }
    module "@interactjs/core/Interaction" {
        interface Interaction {
            _reflowPromise: Promise<void>;
            _reflowResolve: () => void;
        }
    }
    module "@interactjs/core/InteractEvent" {
        interface PhaseMap {
            reflow?: true;
        }
    }
    export function install(scope: Scope): void;
    function reflow<T extends Interact.ActionName>(interactable: Interactable, action: ActionProps<T>, scope: Scope): Promise<Interactable>;
    const _default_24: import("@interactjs/core/scope").Plugin;
    export default _default_24;
}
declare module "@interactjs/types/NativePointerEventType" {
    const NativePointerEvent: PointerEvent;
    export default NativePointerEvent;
}
declare module "@interactjs/types/index" {
    import * as dropEvent from "@interactjs/actions/drop/DropEvent";
    import * as gesture from "@interactjs/actions/gesture/plugin";
    import * as resize from "@interactjs/actions/resize/plugin";
    import * as iEvent from "@interactjs/core/InteractEvent";
    import * as iable from "@interactjs/core/Interactable";
    import * as interaction from "@interactjs/core/Interaction";
    import * as defaults from "@interactjs/core/defaultOptions";
    import * as iStatic from "@interactjs/core/interactStatic";
    import * as scope from "@interactjs/core/scope";
    import * as snap from "@interactjs/modifiers/snap/pointer";
    import { PointerEvent as _PointerEvent } from "@interactjs/pointer-events/PointerEvent";
    import "@interactjs/actions/drag/plugin";
    import "@interactjs/actions/drop/plugin";
    import "@interactjs/arrange/plugin";
    import "@interactjs/auto-scroll/plugin";
    import "@interactjs/auto-start/InteractableMethods";
    import "@interactjs/auto-start/base";
    import "@interactjs/auto-start/plugin";
    import "@interactjs/core/events";
    import "@interactjs/interact/index";
    import "@interactjs/core/interactablePreventDefault";
    import "@interactjs/core/interactions";
    import "@interactjs/dev-tools/plugin";
    import "@interactjs/inertia/plugin";
    import "@interactjs/modifiers/plugin";
    import "@interactjs/pointer-events/base";
    import "@interactjs/pointer-events/interactableTargets";
    import "@interactjs/reflow/plugin";
    import "@interactjs/snappers/plugin";
    import _NativePointerEventType from "@interactjs/types/NativePointerEventType";
    export type OrBoolean<T> = {
        [P in keyof T]: T[P] | boolean;
    };
    export type Element = HTMLElement | SVGElement;
    export type Context = Document | Element;
    export type EventTarget = Window | Document | Element;
    export type Target = EventTarget | string;
    export type Plugin = scope.Plugin;
    export type Actions = scope.Actions;
    export type ActionProps<T extends scope.ActionName = ActionName> = interaction.ActionProps<T>;
    export type Interactable = iable.Interactable;
    export type Scope = scope.Scope;
    /** @interanal */ export type InteractStatic = iStatic.InteractStatic;
    export type Interaction<T extends scope.ActionName = ActionName> = interaction.Interaction<T>;
    export type InteractionProxy<T extends scope.ActionName = ActionName> = interaction.InteractionProxy<T>;
    export type PointerArgProps<T extends {} = {}> = interaction.PointerArgProps<T>;
    export type InteractEvent<T extends keyof scope.ActionMap = never, P extends iEvent.EventPhase = iEvent.EventPhase> = iEvent.InteractEvent<T, P>;
    export type EventPhase = iEvent.EventPhase;
    export type Options = defaults.Options;
    export type ActionName = scope.ActionName;
    export type SignalArgs = scope.SignalArgs;
    export type DoPhaseArg<T extends ActionName, P extends EventPhase> = interaction.DoPhaseArg<T, P>;
    export type DoAnyPhaseArg = interaction.DoAnyPhaseArg;
    export type DragEvent = InteractEvent<'drag'>;
    export type DropEvent = dropEvent.DropEvent;
    export type ResizeEvent = resize.ResizeEvent;
    export type GestureEvent = gesture.GestureEvent;
    export type PointerEvent<T extends string = any> = _PointerEvent<T>;
    export interface Point {
        x: number;
        y: number;
    }
    export interface Size {
        width: number;
        height: number;
    }
    export interface Rect {
        top: number;
        left: number;
        bottom: number;
        right: number;
        width?: number;
        height?: number;
    }
    export type FullRect = Required<Rect>;
    export type RectFunction<T extends any[]> = (...args: T) => Rect | Element;
    export type RectResolvable<T extends any[]> = Rect | string | Element | RectFunction<T>;
    export type Dimensions = Point & Size;
    export interface CoordsSetMember {
        page: Point;
        client: Point;
        timeStamp: number;
    }
    export interface CoordsSet {
        cur: CoordsSetMember;
        prev: CoordsSetMember;
        start: CoordsSetMember;
        delta: CoordsSetMember;
        velocity: CoordsSetMember;
    }
    export interface HasGetRect {
        getRect(element: Element): Rect;
    }
    export interface InertiaOption {
        resistance?: number;
        minSpeed?: number;
        endSpeed?: number;
        allowResume?: boolean;
        smoothEndDuration?: number;
    }
    export type InertiaOptions = InertiaOption | boolean;
    export interface EdgeOptions {
        top?: boolean | string | Element;
        left?: boolean | string | Element;
        bottom?: boolean | string | Element;
        right?: boolean | string | Element;
    }
    export type CursorChecker = (action: ActionProps<ActionName>, interactable: Interactable, element: Element, interacting: boolean) => string;
    export interface ActionMethod<T> {
        (this: Interactable): T;
        (this: Interactable, options: Partial<OrBoolean<T>> | boolean): typeof this;
    }
    export interface OptionMethod<T> {
        (this: Interactable): T;
        (this: Interactable, options: T): typeof this;
    }
    export type PerActionDefaults = defaults.PerActionDefaults;
    export type OptionsArg = defaults.OptionsArg;
    export interface DraggableOptions extends PerActionDefaults {
        startAxis?: 'x' | 'y' | 'xy';
        lockAxis?: 'x' | 'y' | 'xy' | 'start';
        oninertiastart?: ListenersArg;
        onstart?: ListenersArg;
        onmove?: ListenersArg;
        onend?: ListenersArg;
    }
    export interface DropzoneOptions extends PerActionDefaults {
        accept?: string | Element | (({ dropzone, draggableElement }: {
            dropzone: Interactable;
            draggableElement: Element;
        }) => boolean);
        overlap?: 'pointer' | 'center' | number;
        checker?: DropFunctionChecker;
        ondropactivate?: ListenersArg;
        ondropdeactivate?: ListenersArg;
        ondragenter?: ListenersArg;
        ondragleave?: ListenersArg;
        ondropmove?: ListenersArg;
        ondrop?: ListenersArg;
    }
    export type DropFunctionChecker = (dragEvent: any, // related drag operation
    event: any, // touch or mouse EventEmitter
    dropped: boolean, // default checker result
    dropzone: Interactable, // dropzone interactable
    dropElement: Element, // drop zone element
    draggable: Interactable, // draggable's Interactable
    draggableElement: Element) => boolean;
    export interface ResizableOptions extends PerActionDefaults {
        square?: boolean;
        preserveAspectRatio?: boolean;
        edges?: EdgeOptions | null;
        axis?: 'x' | 'y' | 'xy';
        invert?: 'none' | 'negate' | 'reposition';
        margin?: number;
        squareResize?: boolean;
        oninertiastart?: ListenersArg;
        onstart?: ListenersArg;
        onmove?: ListenersArg;
        onend?: ListenersArg;
    }
    export interface GesturableOptions extends PerActionDefaults {
        onstart?: ListenersArg;
        onmove?: ListenersArg;
        onend?: ListenersArg;
    }
    export type ActionChecker = (pointerEvent: any, defaultAction: string, interactable: Interactable, element: Element, interaction: Interaction) => ActionProps;
    export type OriginFunction = (target: Element) => Rect;
    export type SnapFunction = snap.SnapFunction;
    export type SnapTarget = snap.SnapTarget;
    export interface PointerEventsOptions {
        holdDuration?: number;
        allowFrom?: string;
        ignoreFrom?: string;
        origin?: Rect | Point | string | Element | OriginFunction;
    }
    export type RectChecker = (element: Element) => Rect;
    export type NativePointerEventType = typeof _NativePointerEventType;
    export type PointerEventType = MouseEvent | TouchEvent | NativePointerEventType | PointerEvent | InteractEvent;
    export type PointerType = MouseEvent | Touch | NativePointerEventType | PointerEvent | InteractEvent;
    export type EventTypes = string | ListenerMap | Array<(string | ListenerMap)>;
    export type Listener = (...args: any[]) => any;
    export type Listeners = ListenerMap | ListenerMap[];
    export type ListenersArg = Listener | ListenerMap | Array<(Listener | ListenerMap)>;
    export interface ListenerMap {
        [index: string]: ListenersArg | ListenersArg[];
    }
    export type ArrayElementType<T> = T extends Array<infer P> ? P : never;
}
declare module "@interactjs/core/scope" {
    import * as Interact from "@interactjs/types/index";
    import { Eventable } from "@interactjs/core/Eventable";
    import { InteractEvent, PhaseMap } from "@interactjs/core/InteractEvent";
    import { Interactable as InteractableBase } from "@interactjs/core/Interactable";
    import { InteractableSet } from "@interactjs/core/InteractableSet";
    export interface SignalArgs {
        'scope:add-document': DocSignalArg;
        'scope:remove-document': DocSignalArg;
        'interactable:unset': {
            interactable: InteractableBase;
        };
        'interactable:set': {
            interactable: InteractableBase;
            options: Interact.OptionsArg;
        };
        'interactions:destroy': {
            interaction: Interact.Interaction;
        };
    }
    export type ListenerName = keyof SignalArgs;
    export type ListenerMap = {
        [P in ListenerName]?: (arg: SignalArgs[P], scope: Scope, signalName: P) => void | boolean;
    };
    interface DocSignalArg {
        doc: Document;
        window: Window;
        scope: Scope;
        options?: {
            [index: string]: any;
        };
    }
    export interface ActionMap {
    }
    export type ActionName = keyof ActionMap;
    export interface Actions {
        map: ActionMap;
        phases: PhaseMap;
        methodDict: {
            [P in ActionName]?: keyof Interact.Interactable;
        };
        phaselessTypes: {
            [type: string]: true;
        };
    }
    export interface Plugin {
        [key: string]: any;
        id?: string;
        listeners?: ListenerMap;
        before?: string[];
        install?(scope: Scope, options?: any): void;
    }
    export class Scope {
        id: string;
        isInitialized: boolean;
        listenerMaps: Array<{
            map: ListenerMap;
            id: string;
        }>;
        browser: {
            init: (window: any) => void;
            supportsTouch: boolean;
            supportsPointerEvent: boolean;
            isIOS7: boolean;
            isIOS: boolean;
            isIe9: boolean;
            isOperaMobile: boolean;
            prefixedMatchesSelector: "matches";
            pEventTypes: {
                up: string;
                down: string;
                over: string;
                out: string;
                move: string;
                cancel: string;
            };
            wheelEvent: string;
        };
        defaults: import("@interactjs/core/defaultOptions").Defaults;
        Eventable: typeof Eventable;
        actions: Actions;
        interactStatic: import("@interactjs/core/interactStatic").InteractStatic;
        InteractEvent: typeof InteractEvent;
        Interactable: typeof InteractableBase;
        interactables: InteractableSet;
        _win: Window;
        document: Document;
        window: Window;
        documents: Array<{
            doc: Document;
            options: any;
        }>;
        _plugins: {
            list: Plugin[];
            map: {
                [id: string]: Plugin;
            };
        };
        constructor();
        addListeners(map: ListenerMap, id?: string): void;
        fire<T extends ListenerName>(name: T, arg: SignalArgs[T]): void | false;
        onWindowUnload: (event: BeforeUnloadEvent) => void;
        init(window: Window): Scope;
        pluginIsInstalled(plugin: Plugin): boolean | Plugin;
        usePlugin(plugin: Plugin, options?: {
            [key: string]: any;
        }): this;
        addDocument(doc: Document, options?: any): void | false;
        removeDocument(doc: Document): void;
        getDocIndex(doc: Document): number;
        getDocOptions(doc: Document): any;
        now(): number;
    }
    export function initScope(scope: Scope, window: Window): Scope;
}
declare module "@interactjs/interact/index" {
    import { Scope } from "@interactjs/core/scope";
    const interact: import("@interactjs/core/interactStatic").InteractStatic;
    export default interact;
    export const init: (win: Window) => Scope;
}
declare module "@interactjs/actions/plugin" {
    import * as Interact from "@interactjs/types/index";
    const _default_25: {
        id: string;
        install(scope: Interact.Scope): void;
    };
    export default _default_25;
}
declare module "@interactjs/actions/index" { }
declare module "@interactjs/actions/drag/index" { }
declare module "@interactjs/actions/drop/index" { }
declare module "@interactjs/actions/gesture/index" { }
declare module "@interactjs/actions/resize/index" { }
declare module "@interactjs/auto-scroll/index" { }
declare module "@interactjs/auto-start/index" { }
declare module "@interactjs/clone/plugin" {
    const _default_26: {};
    export default _default_26;
}
declare module "@interactjs/core/tests/_helpers" {
    import * as Interact from "@interactjs/types/index";
    import * as pointerUtils from "@interactjs/utils/pointerUtils";
    import { Scope } from "@interactjs/core/scope";
    export function unique(): number;
    export function uniqueProps(obj: any): void;
    export function newCoordsSet(n?: number): {
        start: {
            page: {
                x: number;
                y: number;
            };
            client: {
                x: number;
                y: number;
            };
            timeStamp: number;
        };
        cur: {
            page: {
                x: number;
                y: number;
            };
            client: {
                x: number;
                y: number;
            };
            timeStamp: number;
        };
        prev: {
            page: {
                x: number;
                y: number;
            };
            client: {
                x: number;
                y: number;
            };
            timeStamp: number;
        };
        delta: {
            page: {
                x: number;
                y: number;
            };
            client: {
                x: number;
                y: number;
            };
            timeStamp: number;
        };
        velocity: {
            page: {
                x: number;
                y: number;
            };
            client: {
                x: number;
                y: number;
            };
            timeStamp: number;
        };
    };
    export function newPointer(n?: number): Interact.PointerType;
    export function mockScope(options?: any): Scope;
    export function getProps<T extends {
        [key: string]: any;
    }, K extends keyof T>(src: T, props: readonly K[]): Pick<T, K>;
    export function testEnv<T extends Interact.Target = HTMLElement>({ plugins, target, rect, }?: {
        plugins?: Interact.Plugin[];
        target?: T;
        rect?: Interact.Rect;
    }): {
        scope: Scope;
        interaction: import("@interactjs/core/Interaction").Interaction<any>;
        target: T;
        interactable: import("@interactjs/core/Interactable").Interactable;
        coords: pointerUtils.MockCoords;
        event: ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & Touch & MouseEvent) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & Touch & PointerEvent) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & Touch & TouchEvent) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & Touch & Interact.PointerEvent<any>) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & Touch & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow">) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & MouseEvent) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & MouseEvent & PointerEvent) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & MouseEvent & TouchEvent) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & MouseEvent & Interact.PointerEvent<any>) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & MouseEvent & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow">) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & PointerEvent & MouseEvent) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & PointerEvent) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & PointerEvent & TouchEvent) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & PointerEvent & Interact.PointerEvent<any>) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & PointerEvent & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow">) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & Interact.PointerEvent<any> & MouseEvent) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & Interact.PointerEvent<any> & PointerEvent) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & Interact.PointerEvent<any> & TouchEvent) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & Interact.PointerEvent<any>) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & Interact.PointerEvent<any> & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow">) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow"> & MouseEvent) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow"> & PointerEvent) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow"> & TouchEvent) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow"> & Interact.PointerEvent<any>) | ({
            coords: pointerUtils.MockCoords;
            readonly page: any;
            readonly client: any;
            readonly timeStamp: any;
            readonly pageX: any;
            readonly pageY: any;
            readonly clientX: any;
            readonly clientY: any;
            readonly pointerId: any;
            readonly target: any;
            readonly type: any;
            readonly pointerType: any;
            readonly buttons: any;
            preventDefault(): void;
        } & Interact.InteractEvent<never, "end" | "start" | "resume" | "move" | "inertiastart" | "reflow">);
        interact: import("@interactjs/core/interactStatic").InteractStatic;
        start: (action: Interact.ActionProps) => boolean;
        stop: () => void;
        down: () => void;
        move: (force?: boolean) => void;
        up: () => void;
    };
    export function timeout(n: number): Promise<unknown>;
    export function ltrbwh(left: number, top: number, right: number, bottom: number, width: number, height: number): {
        left: number;
        top: number;
        right: number;
        bottom: number;
        width: number;
        height: number;
    };
}
declare module "@interactjs/dev-tools/index" { }
declare module "@interactjs/feedback/plugin" {
    const _default_27: {};
    export default _default_27;
}
declare module "@interactjs/iframes/plugin" {
    const _default_28: {};
    export default _default_28;
}
declare module "@interactjs/inertia/index" { }
declare module "@interactjs/multi-target/plugin" {
    const _default_29: {};
    export default _default_29;
}
declare module "@interactjs/pointer-events/holdRepeat" {
    import * as Interact from "@interactjs/types/index";
    module "@interactjs/core/Interaction" {
        interface Interaction {
            holdIntervalHandle?: any;
        }
    }
    module "@interactjs/pointer-events/PointerEvent" {
        interface PointerEvent<T extends string = any> {
            count?: number;
        }
    }
    module "@interactjs/pointer-events/base" {
        interface PointerEventOptions {
            holdRepeatInterval?: number;
        }
    }
    const holdRepeat: Interact.Plugin;
    export default holdRepeat;
}
declare module "@interactjs/pointer-events/plugin" {
    import * as Interact from "@interactjs/types/index";
    const plugin: Interact.Plugin;
    export default plugin;
}
declare module "@interactjs/react/plugin" {
    const _default_30: {};
    export default _default_30;
}
declare module "@interactjs/utils/displace" {
    const _default_31: {};
    export default _default_31;
}
declare module "@interactjs/utils/exchange" {
    export const exchange: {};
}
declare module "@interactjs/vue/plugin" {
    const _default_32: {};
    export default _default_32;
}
declare module "@interactjs/interactjs/index" {
    import interact from "@interactjs/interact/index";
    import * as displace from "@interactjs/utils/displace";
    import { exchange } from "@interactjs/utils/exchange";
    import * as pointerUtils from "@interactjs/utils/pointerUtils";
    module "@interactjs/core/interactStatic" {
        interface InteractStatic {
            __utils: {
                exchange: typeof exchange;
                displace: typeof displace;
                pointer: typeof pointerUtils;
            };
        }
    }
    export default interact;
}
declare module "@interactjs/modifiers/index" { }
declare module "@interactjs/pointer-events/index" { }
declare module "@interactjs/reflow/index" { }
declare module "interactjs/index" {
    import interact from "@interactjs/interactjs/index";
    export default interact;
}
