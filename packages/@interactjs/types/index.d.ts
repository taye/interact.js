declare module "@interactjs/utils/extend" {
    export default function extend<T, U extends object>(dest: U & Partial<T>, source: T): T & U;
}
declare module "@interactjs/core/options" {
    import type { Point, Listeners, OrBoolean, Element } from "@interactjs/core/types";
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
        origin?: Point | string | Element;
        listeners?: Listeners;
        allowFrom?: string | Element;
        ignoreFrom?: string | Element;
    }
    export type Options = Partial<BaseDefaults> & Partial<PerActionDefaults> & {
        [P in keyof ActionDefaults]?: Partial<ActionDefaults[P]>;
    };
    export interface OptionsArg extends BaseDefaults, OrBoolean<Partial<ActionDefaults>> {
    }
    export const defaults: Defaults;
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
        element: (thing: any) => thing is HTMLElement | SVGElement;
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
    import type { Rect, Target, Element } from "@interactjs/core/types";
    export function nodeContains(parent: Node, child: Node): boolean;
    export function closest(element: Node, selector: string): HTMLElement | SVGElement;
    export function parentNode(node: Node | Document): ParentNode;
    export function matchesSelector(element: Element, selector: string): boolean;
    export function indexOfDeepestElement(elements: Element[] | NodeListOf<globalThis.Element>): number;
    export function matchesUpTo(element: Element, selector: string, limit: Node): boolean;
    export function getActualElement(element: Element): any;
    export function getScrollXY(relevantWindow?: Window): {
        x: number;
        y: number;
    };
    export function getElementClientRect(element: Element): Required<Rect>;
    export function getElementRect(element: Element): Required<Rect>;
    export function getPath(node: Node | Document): any[];
    export function trySelector(value: Target): boolean;
}
declare module "@interactjs/utils/rect" {
    import type { HasGetRect, RectResolvable, Rect, Point, EdgeOptions } from "@interactjs/core/types";
    export function getStringOptionResult(value: any, target: HasGetRect, element: Node): ParentNode | Rect;
    export function resolveRectLike<T extends any[]>(value: RectResolvable<T>, target?: HasGetRect, element?: Node, functionArgs?: T): Rect;
    export function rectToXY(rect: Rect | Point): {
        x: number;
        y: number;
    };
    export function xywhToTlbr<T extends Partial<Rect & Point>>(rect: T): Rect & T;
    export function tlbrToXywh(rect: Rect & Partial<Point>): Required<Rect> & Point;
    export function addEdges(edges: EdgeOptions, rect: Rect, delta: Point): void;
}
declare module "@interactjs/utils/getOriginXY" {
    import type { PerActionDefaults } from "@interactjs/core/options";
    import type { ActionName, HasGetRect } from "@interactjs/core/types";
    export default function (target: HasGetRect & {
        options: PerActionDefaults;
    }, element: Node, actionName?: ActionName): {
        x: number;
        y: number;
    };
}
declare module "@interactjs/utils/hypot" {
    const _default_2: (x: number, y: number) => number;
    export default _default_2;
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
declare module "@interactjs/utils/clone" {
    export default function clone<T extends Object>(source: T): Partial<T>;
}
declare module "@interactjs/utils/normalizeListeners" {
    import type { EventTypes, Listener, ListenersArg } from "@interactjs/core/types";
    export interface NormalizedListeners {
        [type: string]: Listener[];
    }
    export default function normalize(type: EventTypes, listeners?: ListenersArg | ListenersArg[], result?: NormalizedListeners): NormalizedListeners;
}
declare module "@interactjs/core/Eventable" {
    import type { ListenersArg, Rect } from "@interactjs/core/types";
    import type { NormalizedListeners } from "@interactjs/utils/normalizeListeners";
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
        on(type: string, listener: ListenersArg): void;
        off(type: string, listener: ListenersArg): void;
        getRect(_element: Element): Rect;
    }
}
declare module "@interactjs/core/isNonNativeEvent" {
    import type { Actions } from "@interactjs/core/types";
    export default function isNonNativeEvent(type: string, actions: Actions): boolean;
}
declare module "@interactjs/core/Interactable" {
    import type { Scope } from "@interactjs/core/scope";
    import type { ActionName, Actions, Context, Element, EventTypes, Listeners, ListenersArg, OrBoolean, Target } from "@interactjs/core/types";
    import { Eventable } from "@interactjs/core/Eventable";
    import type { OptionsArg, Options } from "@interactjs/core/options";
    type IgnoreValue = string | Element | boolean;
    type DeltaSource = 'page' | 'client';
    /** */
    export class Interactable implements Partial<Eventable> {
        readonly options: Required<Options>;
        readonly _actions: Actions;
        readonly target: Target;
        readonly events: Eventable;
        readonly _context: Context;
        readonly _win: Window;
        readonly _doc: Document;
        readonly _scopeEvents: Scope['events'];
        /** */
        constructor(target: Target, options: any, defaultContext: Document | Element, scopeEvents: Scope['events']);
        setOnEvents(actionName: ActionName, phases: NonNullable<any>): this;
        updatePerActionListeners(actionName: ActionName, prev: Listeners, cur: Listeners): void;
        setPerAction(actionName: ActionName, options: OrBoolean<Options>): void;
        /**
         * The default function to get an Interactables bounding rect. Can be
         * overridden using {@link Interactable.rectChecker}.
         *
         * @param {Element} [element] The element to measure.
         * @return {Rect} The object's bounding rectangle.
         */
        getRect(element: Element): Required<import("@interactjs/core/types").Rect>;
        /**
         * Returns or sets the function used to calculate the interactable's
         * element's rectangle
         *
         * @param {function} [checker] A function which returns this Interactable's
         * bounding rectangle. See {@link Interactable.getRect}
         * @return {function | object} The checker function or this Interactable
         */
        rectChecker(): (element: Element) => any | null;
        rectChecker(checker: (element: Element) => any): this;
        _backCompatOption(optionName: keyof Options, newValue: any): any;
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
        context(): Context;
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
        _onOff(method: 'on' | 'off', typeArg: EventTypes, listenerArg?: ListenersArg | null, options?: any): this;
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
        on(types: EventTypes, listener?: ListenersArg, options?: any): this;
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
        off(types: string | string[] | EventTypes, listener?: ListenersArg, options?: any): this;
        /**
         * Reset the options of this Interactable
         *
         * @param {object} options The new settings to apply
         * @return {object} This Interactable
         */
        set(options: OptionsArg): this;
        /**
         * Remove this interactable from the list of interactables and remove it's
         * action capabilities and event listeners
         */
        unset(): void;
    }
}
declare module "@interactjs/core/BaseEvent" {
    import type { Interactable } from "@interactjs/core/Interactable";
    import type { Interaction, InteractionProxy } from "@interactjs/core/Interaction";
    import type { ActionName } from "@interactjs/core/types";
    export class BaseEvent<T extends ActionName | null = never> {
        type: string;
        target: EventTarget;
        currentTarget: Node;
        interactable: Interactable;
        _interaction: Interaction<T>;
        timeStamp: number;
        immediatePropagationStopped: boolean;
        propagationStopped: boolean;
        constructor(interaction: Interaction<T>);
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
    export interface BaseEvent<T extends ActionName> {
        interaction: InteractionProxy<T>;
    }
}
declare module "@interactjs/core/InteractEvent" {
    import type { Point, FullRect, PointerEventType, Element } from "@interactjs/core/types";
    import { BaseEvent } from "@interactjs/core/BaseEvent";
    import type { Interaction } from "@interactjs/core/Interaction";
    import type { ActionName } from "@interactjs/core/types";
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
    export class InteractEvent<T extends ActionName = never, P extends EventPhase = EventPhase> extends BaseEvent<T> {
        target: Element;
        currentTarget: Element;
        relatedTarget: Element | null;
        screenX?: number;
        screenY?: number;
        button: number;
        buttons: number;
        ctrlKey: boolean;
        shiftKey: boolean;
        altKey: boolean;
        metaKey: boolean;
        page: Point;
        client: Point;
        delta: Point;
        rect: FullRect;
        x0: number;
        y0: number;
        t0: number;
        dt: number;
        duration: number;
        clientX0: number;
        clientY0: number;
        velocity: Point;
        speed: number;
        swipe: ReturnType<InteractEvent<T>['getSwipe']>;
        axes?: 'x' | 'y' | 'xy';
        preEnd?: boolean;
        /** */
        constructor(interaction: Interaction<T>, event: PointerEventType, actionName: T, phase: P, element: Element, preEnd?: boolean, type?: string);
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
declare module "@interactjs/core/NativePointerEventType" {
    const NativePointerEvent: PointerEvent;
    export default NativePointerEvent;
}
declare module "@interactjs/core/types" {
    import type Interaction from "@interactjs/core/Interaction";
    import type { PhaseMap, InteractEvent } from "@interactjs/core/InteractEvent";
    import type { Interactable } from "@interactjs/core/Interactable";
    import type _NativePointerEventType from "@interactjs/core/NativePointerEventType";
    export type OrBoolean<T> = {
        [P in keyof T]: T[P] | boolean;
    };
    export type Element = HTMLElement | SVGElement;
    export type Context = Document | Element;
    export type EventTarget = Window | Document | Element;
    export type Target = EventTarget | string;
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
    export interface ActionMap {
    }
    export type ActionName = keyof ActionMap;
    export interface Actions {
        map: ActionMap;
        phases: PhaseMap;
        methodDict: Record<ActionName, keyof Interactable>;
        phaselessTypes: {
            [type: string]: true;
        };
    }
    export interface ActionProps<T extends ActionName | null = never> {
        name: T;
        axis?: 'x' | 'y' | 'xy' | null;
        edges?: EdgeOptions | null;
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
    export type ActionChecker = (pointerEvent: any, defaultAction: string, interactable: Interactable, element: Element, interaction: Interaction) => ActionProps;
    export type OriginFunction = (target: Element) => Rect;
    export interface PointerEventsOptions {
        holdDuration?: number;
        allowFrom?: string;
        ignoreFrom?: string;
        origin?: Rect | Point | string | Element | OriginFunction;
    }
    export type RectChecker = (element: Element) => Rect;
    export type NativePointerEventType = typeof _NativePointerEventType;
    export type PointerEventType = MouseEvent | TouchEvent | Partial<NativePointerEventType> | InteractEvent;
    export type PointerType = MouseEvent | Touch | Partial<NativePointerEventType> | InteractEvent;
    export type EventTypes = string | ListenerMap | Array<string | ListenerMap>;
    export type Listener = (...args: any[]) => any;
    export type Listeners = ListenerMap | ListenerMap[];
    export type ListenersArg = Listener | ListenerMap | Array<Listener | ListenerMap>;
    export interface ListenerMap {
        [index: string]: ListenersArg | ListenersArg[];
    }
    export type ArrayElementType<T> = T extends Array<infer P> ? P : never;
}
declare module "@interactjs/utils/misc" {
    import type { ActionName, ActionProps } from "@interactjs/core/types";
    export function warnOnce<T>(this: T, method: (...args: any[]) => any, message: string): (this: T) => any;
    export function copyAction<T extends ActionName>(dest: ActionProps<any>, src: ActionProps<T>): ActionProps<any>;
    export const sign: (n: number) => 1 | -1;
}
declare module "@interactjs/utils/pointerExtend" {
    export default function pointerExtend<T>(dest: Partial<T & {
        __set?: Partial<T>;
    }>, source: T): Partial<T & {
        __set?: Partial<T>;
    }>;
}
declare module "@interactjs/utils/pointerUtils" {
    import type { InteractEvent } from "@interactjs/core/InteractEvent";
    import type { CoordsSetMember, PointerType, Point, PointerEventType } from "@interactjs/core/types";
    import pointerExtend from "@interactjs/utils/pointerExtend";
    export function copyCoords(dest: CoordsSetMember, src: CoordsSetMember): void;
    export function setCoordDeltas(targetObj: CoordsSetMember, prev: CoordsSetMember, cur: CoordsSetMember): void;
    export function setCoordVelocity(targetObj: CoordsSetMember, delta: CoordsSetMember): void;
    export function setZeroCoords(targetObj: CoordsSetMember): void;
    export function isNativePointer(pointer: any): boolean;
    export function getXY(type: string, pointer: PointerType | InteractEvent, xy: Point): Point;
    export function getPageXY(pointer: PointerType | InteractEvent, page?: Point): Point;
    export function getClientXY(pointer: PointerType, client: Point): Point;
    export function getPointerId(pointer: {
        pointerId?: number;
        identifier?: number;
        type?: string;
    }): number;
    export function setCoords(dest: CoordsSetMember, pointers: any[], timeStamp: number): void;
    export function getTouchPair(event: TouchEvent | PointerType[]): PointerType[];
    export function pointerAverage(pointers: PointerType[]): {
        pageX: number;
        pageY: number;
        clientX: number;
        clientY: number;
        screenX: number;
        screenY: number;
    };
    export function touchBBox(event: PointerType[]): {
        x: number;
        y: number;
        left: number;
        top: number;
        right: number;
        bottom: number;
        width: number;
        height: number;
    };
    export function touchDistance(event: PointerType[] | TouchEvent, deltaSource: string): number;
    export function touchAngle(event: PointerType[] | TouchEvent, deltaSource: string): number;
    export function getPointerType(pointer: {
        pointerType?: string;
        identifier?: number;
        type?: string;
    }): string;
    export function getEventTargets(event: Event): any[];
    export function newCoords(): CoordsSetMember;
    export function coordsToEvent(coords: MockCoords): {
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
    } & PointerType & PointerEventType;
    export interface MockCoords {
        page: Point;
        client: Point;
        timeStamp?: number;
        pointerId?: any;
        target?: any;
        type?: string;
        pointerType?: string;
        buttons?: number;
    }
    export { pointerExtend };
}
declare module "@interactjs/core/PointerInfo" {
    import type { PointerEventType, PointerType } from "@interactjs/core/types";
    export class PointerInfo {
        id: number;
        pointer: PointerType;
        event: PointerEventType;
        downTime: number;
        downTarget: Node;
        constructor(id: number, pointer: PointerType, event: PointerEventType, downTime: number, downTarget: Node);
    }
}
declare module "@interactjs/core/Interaction" {
    import type { Element, EdgeOptions, PointerEventType, PointerType, FullRect, CoordsSet } from "@interactjs/core/types";
    import type { EventPhase } from "@interactjs/core/InteractEvent";
    import { InteractEvent } from "@interactjs/core/InteractEvent";
    import type { Interactable } from "@interactjs/core/Interactable";
    import { PointerInfo } from "@interactjs/core/PointerInfo";
    import type { Scope } from "@interactjs/core/scope";
    import type { ActionName, ActionProps } from "@interactjs/core/types";
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
        pointer: PointerType;
        event: PointerEventType;
        eventTarget: Node;
        pointerIndex: number;
        pointerInfo: PointerInfo;
        interaction: Interaction<never>;
    } & T;
    export interface DoPhaseArg<T extends ActionName, P extends EventPhase> {
        event: PointerEventType;
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
                interaction: Interaction<never>;
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
    export type InteractionProxy<T extends ActionName | null = never> = Pick<Interaction<T>, keyof typeof _ProxyValues | keyof typeof _ProxyMethods>;
    export class Interaction<T extends ActionName | null = ActionName> {
        interactable: Interactable | null;
        element: Element | null;
        rect: FullRect | null;
        _rects?: {
            start: FullRect;
            corrected: FullRect;
            previous: FullRect;
            delta: FullRect;
        };
        edges: EdgeOptions | null;
        _scopeFire: Scope['fire'];
        prepared: ActionProps<T>;
        pointerType: string;
        pointers: PointerInfo[];
        downEvent: PointerEventType | null;
        downPointer: PointerType;
        _latestPointer: {
            pointer: PointerType;
            event: PointerEventType;
            eventTarget: Node;
        };
        prevEvent: InteractEvent<T, EventPhase>;
        pointerIsDown: boolean;
        pointerWasMoved: boolean;
        _interacting: boolean;
        _ending: boolean;
        _stopped: boolean;
        _proxy: InteractionProxy<T> | null;
        simulation: any;
        /**
         * @alias Interaction.prototype.move
         */
        doMove: (this: void) => any;
        coords: CoordsSet;
        readonly _id: number;
        /** */
        constructor({ pointerType, scopeFire }: {
            pointerType?: string;
            scopeFire: Scope['fire'];
        });
        pointerDown(pointer: PointerType, event: PointerEventType, eventTarget: Node): void;
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
        start<A extends ActionName>(action: ActionProps<A>, interactable: Interactable, element: Element): boolean;
        pointerMove(pointer: PointerType, event: PointerEventType, eventTarget: Node): void;
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
        pointerUp(pointer: PointerType, event: PointerEventType, eventTarget: Node, curEventTarget: EventTarget): void;
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
        end(event?: PointerEventType): void;
        currentAction(): T;
        interacting(): boolean;
        /** */
        stop(): void;
        getPointerIndex(pointer: any): number;
        getPointerInfo(pointer: any): PointerInfo;
        updatePointer(pointer: PointerType, event: PointerEventType, eventTarget: Node, down?: boolean): number;
        removePointer(pointer: PointerType, event: PointerEventType): void;
        _updateLatestPointer(pointer: PointerType, event: PointerEventType, eventTarget: Node): void;
        destroy(): void;
        _createPreparedEvent<P extends EventPhase>(event: PointerEventType, phase: P, preEnd?: boolean, type?: string): InteractEvent<T, P>;
        _fireEvent<P extends EventPhase>(iEvent: InteractEvent<T, P>): void;
        _doPhase<P extends EventPhase>(signalArg: Omit<DoPhaseArg<T, P>, 'iEvent'> & {
            iEvent?: InteractEvent<T, P>;
        }): boolean;
        _now(): number;
    }
    export default Interaction;
    export { PointerInfo };
}
declare module "@interactjs/utils/raf" {
    function init(global: Window | typeof globalThis): void;
    const _default_3: {
        request: (callback: FrameRequestCallback) => number;
        cancel: (token: number) => void;
        init: typeof init;
    };
    export default _default_3;
}
declare module "@interactjs/core/InteractStatic" {
    /** @module interact */
    import type { Scope, Plugin } from "@interactjs/core/scope";
    import type { EventTypes, ListenersArg, Target } from "@interactjs/core/types";
    import * as domUtils from "@interactjs/utils/domUtils";
    import * as pointerUtils from "@interactjs/utils/pointerUtils";
    import type { Interactable } from "@interactjs/core/Interactable";
    import type { Options } from "@interactjs/core/options";
    module "@interactjs/core/InteractStatic" {
        interface InteractStatic {
            (target: Target, options?: Options): Interactable;
            getPointerAverage: typeof pointerUtils.pointerAverage;
            getTouchBBox: typeof pointerUtils.touchBBox;
            getTouchDistance: typeof pointerUtils.touchDistance;
            getTouchAngle: typeof pointerUtils.touchAngle;
            getElementRect: typeof domUtils.getElementRect;
            getElementClientRect: typeof domUtils.getElementClientRect;
            matchesSelector: typeof domUtils.matchesSelector;
            closest: typeof domUtils.closest;
            version: string;
            use(plugin: Plugin, options?: {
                [key: string]: any;
            }): any;
            isSet(target: Target, options?: any): boolean;
            on(type: string | EventTypes, listener: ListenersArg, options?: object): any;
            off(type: EventTypes, listener: any, options?: object): any;
            debug(): any;
            supportsTouch(): boolean;
            supportsPointerEvent(): boolean;
            stop(): any;
            pointerMoveTolerance(newValue?: number): any;
            addDocument(doc: Document, options?: object): void;
            removeDocument(doc: Document): void;
        }
    }
    type _InteractStatic = import("@interactjs/core/InteractStatic").InteractStatic;
    export function createInteractStatic(scope: Scope): _InteractStatic;
}
declare module "@interactjs/core/InteractableSet" {
    import type { Interactable } from "@interactjs/core/Interactable";
    import type { OptionsArg, Options } from "@interactjs/core/options";
    import type { Scope } from "@interactjs/core/scope";
    import type { Target, Context } from "@interactjs/core/types";
    module "@interactjs/core/scope" {
        interface SignalArgs {
            'interactable:new': {
                interactable: Interactable;
                target: Target;
                options: OptionsArg;
                win: Window;
            };
        }
    }
    interface InteractableScopeProp {
        context: Context;
        interactable: Interactable;
    }
    export class InteractableSet {
        list: Interactable[];
        selectorMap: {
            [selector: string]: InteractableScopeProp[];
        };
        scope: Scope;
        constructor(scope: Scope);
        new(target: Target, options?: any): Interactable;
        get(target: Target, options?: Options): Interactable;
        forEachMatch<T>(node: Node, callback: (interactable: Interactable) => T): void | T;
    }
}
declare module "@interactjs/core/events" {
    import type { Scope } from "@interactjs/core/scope";
    import type { Element } from "@interactjs/core/types";
    module "@interactjs/core/scope" {
        interface Scope {
            events: ReturnType<typeof install>;
        }
    }
    type Listener = (event: Event | FakeEvent) => any;
    function install(scope: Scope): {
        add: (eventTarget: EventTarget, type: string, listener: Listener, optionalArg?: boolean | any) => void;
        remove: (eventTarget: EventTarget, type: string, listener?: 'all' | Listener, optionalArg?: boolean | any) => void;
        addDelegate: (selector: string, context: Node, type: string, listener: Listener, optionalArg?: any) => void;
        removeDelegate: (selector: string, context: Document | Element, type: string, listener?: Listener, optionalArg?: any) => void;
        delegateListener: (event: Event | FakeEvent, optionalArg?: any) => void;
        delegateUseCapture: (this: Element, event: Event | FakeEvent) => any;
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
    const _default_4: {
        id: string;
        install: typeof install;
    };
    export default _default_4;
}
declare module "@interactjs/core/interactablePreventDefault" {
    import type { Interactable } from "@interactjs/core/Interactable";
    import type { Scope } from "@interactjs/core/scope";
    module "@interactjs/core/Interactable" {
        interface Interactable {
            preventDefault: typeof preventDefault;
            checkAndPreventDefault: (event: Event) => void;
        }
    }
    type PreventDefaultValue = 'always' | 'never' | 'auto';
    function preventDefault(this: Interactable): PreventDefaultValue;
    function preventDefault(this: Interactable, newValue: PreventDefaultValue): typeof this;
    export function install(scope: Scope): void;
    const _default_5: {
        id: string;
        install: typeof install;
        listeners: any;
    };
    export default _default_5;
}
declare module "@interactjs/core/interactionFinder" {
    import type Interaction from "@interactjs/core/Interaction";
    import type { Scope } from "@interactjs/core/scope";
    import type { PointerType } from "@interactjs/core/types";
    export interface SearchDetails {
        pointer: PointerType;
        pointerId: number;
        pointerType: string;
        eventType: string;
        eventTarget: EventTarget;
        curEventTarget: EventTarget;
        scope: Scope;
    }
    const finder: {
        methodOrder: readonly ["simulationResume", "mouseOrPen", "hasPointer", "idle"];
        search(details: SearchDetails): any;
        simulationResume({ pointerType, eventType, eventTarget, scope }: SearchDetails): Interaction<keyof import("@interactjs/core/types").ActionMap>;
        mouseOrPen({ pointerId, pointerType, eventType, scope }: SearchDetails): any;
        hasPointer({ pointerId, scope }: SearchDetails): Interaction<keyof import("@interactjs/core/types").ActionMap>;
        idle({ pointerType, scope }: SearchDetails): Interaction<keyof import("@interactjs/core/types").ActionMap>;
    };
    export default finder;
}
declare module "@interactjs/core/interactions" {
    import type { Plugin } from "@interactjs/core/scope";
    import type { ActionName, Listener } from "@interactjs/core/types";
    import InteractionBase from "@interactjs/core/Interaction";
    import type { SearchDetails } from "@interactjs/core/interactionFinder";
    module "@interactjs/core/scope" {
        interface Scope {
            Interaction: typeof InteractionBase;
            interactions: {
                new: <T extends ActionName>(options: any) => InteractionBase<T>;
                list: Array<InteractionBase<ActionName>>;
                listeners: {
                    [type: string]: Listener;
                };
                docEvents: Array<{
                    type: string;
                    listener: Listener;
                }>;
                pointerMoveTolerance: number;
            };
            prevTouchTime: number;
        }
        interface SignalArgs {
            'interactions:find': {
                interaction: InteractionBase;
                searchDetails: SearchDetails;
            };
        }
    }
    const interactions: Plugin;
    export default interactions;
}
declare module "@interactjs/core/scope" {
    import type Interaction from "@interactjs/core/Interaction";
    import { Eventable } from "@interactjs/core/Eventable";
    import { InteractEvent } from "@interactjs/core/InteractEvent";
    import { Interactable as InteractableBase } from "@interactjs/core/Interactable";
    import { InteractableSet } from "@interactjs/core/InteractableSet";
    import type { OptionsArg } from "@interactjs/core/options";
    import type { Actions } from "@interactjs/core/types";
    export interface SignalArgs {
        'scope:add-document': DocSignalArg;
        'scope:remove-document': DocSignalArg;
        'interactable:unset': {
            interactable: InteractableBase;
        };
        'interactable:set': {
            interactable: InteractableBase;
            options: OptionsArg;
        };
        'interactions:destroy': {
            interaction: Interaction;
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
        options: Record<string, any>;
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
        defaults: import("@interactjs/core/options").Defaults;
        Eventable: typeof Eventable;
        actions: Actions;
        interactStatic: import("@interactjs/core/InteractStatic").InteractStatic;
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
        init(window: Window | typeof globalThis): Scope;
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
    export function initScope(scope: Scope, window: Window | typeof globalThis): Scope;
}
declare module "@interactjs/interact/index" {
    const interact: import("@interactjs/core/InteractStatic").InteractStatic;
    export default interact;
}
declare module "@interactjs/actions/drag/plugin" {
    import type { InteractEvent } from "@interactjs/core/InteractEvent";
    import type { PerActionDefaults } from "@interactjs/core/options";
    import type { Plugin } from "@interactjs/core/scope";
    import type { ActionMethod, ListenersArg } from "@interactjs/core/types";
    module "@interactjs/core/Interactable" {
        interface Interactable {
            draggable: DraggableMethod;
        }
    }
    module "@interactjs/core/options" {
        interface ActionDefaults {
            drag: DraggableOptions;
        }
    }
    module "@interactjs/core/types" {
        interface ActionMap {
            drag?: typeof drag;
        }
    }
    export type DragEvent = InteractEvent<'drag'>;
    export type DraggableMethod = ActionMethod<DraggableOptions>;
    export interface DraggableOptions extends PerActionDefaults {
        startAxis?: 'x' | 'y' | 'xy';
        lockAxis?: 'x' | 'y' | 'xy' | 'start';
        oninertiastart?: ListenersArg;
        onstart?: ListenersArg;
        onmove?: ListenersArg;
        onend?: ListenersArg;
    }
    const drag: Plugin;
    export default drag;
}
declare module "@interactjs/actions/drop/DropEvent" {
    import { BaseEvent } from "@interactjs/core/BaseEvent";
    import type { InteractEvent } from "@interactjs/core/InteractEvent";
    import type { Interactable } from "@interactjs/core/Interactable";
    import type { Element } from "@interactjs/core/types";
    import type { DropState } from "@interactjs/actions/drop/plugin";
    export class DropEvent extends BaseEvent<'drag'> {
        target: Element;
        dropzone: Interactable;
        dragEvent: InteractEvent<'drag'>;
        relatedTarget: Element;
        draggable: Interactable;
        propagationStopped: boolean;
        immediatePropagationStopped: boolean;
        /**
         * Class of events fired on dropzones during drags with acceptable targets.
         */
        constructor(dropState: DropState, dragEvent: InteractEvent<'drag'>, type: string);
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
declare module "@interactjs/actions/drop/plugin" {
    import type { InteractEvent } from "@interactjs/core/InteractEvent";
    import type { Interactable } from "@interactjs/core/Interactable";
    import type { Interaction } from "@interactjs/core/Interaction";
    import type { PerActionDefaults } from "@interactjs/core/options";
    import type { Plugin } from "@interactjs/core/scope";
    import type { Element, PointerEventType, Rect, ListenersArg } from "@interactjs/core/types";
    import type { DragEvent } from "@interactjs/actions/drag/plugin";
    import { DropEvent } from "@interactjs/actions/drop/DropEvent";
    export type DropFunctionChecker = (dragEvent: any, // related drag operation
    event: any, // touch or mouse EventEmitter
    dropped: boolean, // default checker result
    dropzone: Interactable, // dropzone interactable
    dropElement: Element, // drop zone element
    draggable: Interactable, // draggable's Interactable
    draggableElement: Element) => boolean;
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
    export interface DropzoneMethod {
        (this: Interactable, options: DropzoneOptions | boolean): Interactable;
        (): DropzoneOptions;
    }
    module "@interactjs/core/Interactable" {
        interface Interactable {
            dropzone: DropzoneMethod;
            dropCheck: (dragEvent: InteractEvent, event: PointerEventType, draggable: Interactable, draggableElement: Element, dropElemen: Element, rect: any) => boolean;
        }
    }
    module "@interactjs/core/Interaction" {
        interface Interaction {
            dropState?: DropState;
        }
    }
    module "@interactjs/core/InteractEvent" {
        interface InteractEvent {
            prevDropzone?: Interactable;
            dropzone?: Interactable;
            dragEnter?: Element;
            dragLeave?: Element;
        }
    }
    module "@interactjs/core/options" {
        interface ActionDefaults {
            drop: DropzoneOptions;
        }
    }
    module "@interactjs/core/scope" {
        interface Scope {
            dynamicDrop?: boolean;
        }
        interface SignalArgs {
            'actions/drop:start': DropSignalArg;
            'actions/drop:move': DropSignalArg;
            'actions/drop:end': DropSignalArg;
        }
    }
    module "@interactjs/core/types" {
        interface ActionMap {
            drop?: typeof drop;
        }
    }
    module "@interactjs/core/InteractStatic" {
        interface InteractStatic {
            dynamicDrop: (this: InteractStatic, newValue?: boolean) => boolean | this;
        }
    }
    interface DropSignalArg {
        interaction: Interaction<'drag'>;
        dragEvent: DragEvent;
    }
    export interface ActiveDrop {
        dropzone: Interactable;
        element: Element;
        rect: Rect;
    }
    export interface DropState {
        cur: {
            dropzone: Interactable;
            element: Element;
        };
        prev: {
            dropzone: Interactable;
            element: Element;
        };
        rejected: boolean;
        events: FiredDropEvents;
        activeDrops: ActiveDrop[];
    }
    type FiredDropEvents = Partial<Record<'leave' | 'enter' | 'move' | 'drop' | 'activate' | 'deactivate', DropEvent>>;
    const drop: Plugin;
    export default drop;
}
declare module "@interactjs/actions/gesture/plugin" {
    import type { InteractEvent, EventPhase } from "@interactjs/core/InteractEvent";
    import type { Interaction, DoPhaseArg } from "@interactjs/core/Interaction";
    import type { PerActionDefaults } from "@interactjs/core/options";
    import type { Plugin } from "@interactjs/core/scope";
    import type { ActionMethod, Rect, PointerType, ListenersArg } from "@interactjs/core/types";
    export type GesturableMethod = ActionMethod<GesturableOptions>;
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
    module "@interactjs/core/options" {
        interface ActionDefaults {
            gesture: GesturableOptions;
        }
    }
    module "@interactjs/core/types" {
        interface ActionMap {
            gesture?: typeof gesture;
        }
    }
    export interface GesturableOptions extends PerActionDefaults {
        onstart?: ListenersArg;
        onmove?: ListenersArg;
        onend?: ListenersArg;
    }
    export interface GestureEvent extends InteractEvent<'gesture'> {
        distance: number;
        angle: number;
        da: number;
        scale: number;
        ds: number;
        box: Rect;
        touches: PointerType[];
    }
    export interface GestureSignalArg extends DoPhaseArg<'gesture', EventPhase> {
        iEvent: GestureEvent;
        interaction: Interaction<'gesture'>;
    }
    const gesture: Plugin;
    export default gesture;
}
declare module "@interactjs/actions/resize/plugin" {
    import type { EventPhase, InteractEvent } from "@interactjs/core/InteractEvent";
    import type { PerActionDefaults } from "@interactjs/core/options";
    import type { Plugin } from "@interactjs/core/scope";
    import type { ActionName, ActionProps, ActionMethod, EdgeOptions, FullRect, ListenersArg } from "@interactjs/core/types";
    export type EdgeName = 'top' | 'left' | 'bottom' | 'right';
    export type ResizableMethod = ActionMethod<ResizableOptions>;
    module "@interactjs/core/Interactable" {
        interface Interactable {
            resizable: ResizableMethod;
        }
    }
    module "@interactjs/core/Interaction" {
        interface Interaction<T extends ActionName | null = ActionName> {
            resizeAxes: 'x' | 'y' | 'xy';
            resizeStartAspectRatio: number;
        }
    }
    module "@interactjs/core/options" {
        interface ActionDefaults {
            resize: ResizableOptions;
        }
    }
    module "@interactjs/core/types" {
        interface ActionMap {
            resize?: typeof resize;
        }
    }
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
    export interface ResizeEvent<P extends EventPhase = EventPhase> extends InteractEvent<'resize', P> {
        deltaRect?: FullRect;
        edges?: ActionProps['edges'];
    }
    const resize: Plugin;
    export default resize;
}
declare module "@interactjs/actions/plugin" {
    import type { Scope } from "@interactjs/core/scope";
    const _default_6: {
        id: string;
        install(scope: Scope): void;
    };
    export default _default_6;
}
declare module "@interactjs/actions/index" { }
declare module "@interactjs/actions/drag/index" { }
declare module "@interactjs/actions/drop/index" { }
declare module "@interactjs/actions/gesture/index" { }
declare module "@interactjs/actions/resize/index" { }
declare module "@interactjs/auto-scroll/plugin" {
    import type { Interactable } from "@interactjs/core/Interactable";
    import type Interaction from "@interactjs/core/Interaction";
    import type { Plugin } from "@interactjs/core/scope";
    import type { ActionName, PointerType } from "@interactjs/core/types";
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
    module "@interactjs/core/options" {
        interface PerActionDefaults {
            autoScroll?: AutoScrollOptions;
        }
    }
    export interface AutoScrollOptions {
        container?: Window | HTMLElement | string;
        margin?: number;
        distance?: number;
        interval?: number;
        speed?: number;
        enabled?: boolean;
    }
    const autoScroll: {
        defaults: AutoScrollOptions;
        now: () => number;
        interaction: Interaction<keyof import("@interactjs/core/types").ActionMap>;
        i: number;
        x: number;
        y: number;
        isScrolling: boolean;
        prevTime: number;
        margin: number;
        speed: number;
        start(interaction: Interaction): void;
        stop(): void;
        scroll(): void;
        check(interactable: Interactable, actionName: ActionName): boolean;
        onInteractionMove<T extends keyof import("@interactjs/core/types").ActionMap>({ interaction, pointer, }: {
            interaction: Interaction<T>;
            pointer: PointerType;
        }): void;
    };
    export function getContainer(value: any, interactable: Interactable, element: Element): any;
    export function getScroll(container: any): {
        x: any;
        y: any;
    };
    export function getScrollSize(container: any): {
        x: any;
        y: any;
    };
    export function getScrollSizeDelta<T extends ActionName>({ interaction, element, }: {
        interaction: Partial<Interaction<T>>;
        element: Element;
    }, func: any): {
        x: number;
        y: number;
    };
    const autoScrollPlugin: Plugin;
    export default autoScrollPlugin;
}
declare module "@interactjs/auto-scroll/index" { }
declare module "@interactjs/auto-start/InteractableMethods" {
    import type { Interactable } from "@interactjs/core/Interactable";
    import type { Interaction } from "@interactjs/core/Interaction";
    import type { Scope } from "@interactjs/core/scope";
    import type { ActionProps, PointerType, PointerEventType, Element } from "@interactjs/core/types";
    module "@interactjs/core/Interactable" {
        interface Interactable {
            getAction: (this: Interactable, pointer: PointerType, event: PointerEventType, interaction: Interaction, element: Element) => ActionProps | null;
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
    function install(scope: Scope): void;
    function styleCursor(this: Interactable): boolean;
    function styleCursor(this: Interactable, newValue: boolean): typeof this;
    function actionChecker(this: Interactable, checker: any): any;
    const _default_7: {
        id: string;
        install: typeof install;
    };
    export default _default_7;
}
declare module "@interactjs/auto-start/base" {
    import type { Interactable } from "@interactjs/core/Interactable";
    import type { Interaction } from "@interactjs/core/Interaction";
    import type { Scope, Plugin } from "@interactjs/core/scope";
    import type { CursorChecker, Element, ActionName, ActionProps } from "@interactjs/core/types";
    module "@interactjs/core/InteractStatic" {
        interface InteractStatic {
            maxInteractions: (newValue: any) => any;
        }
    }
    module "@interactjs/core/scope" {
        interface Scope {
            autoStart: AutoStart;
        }
        interface SignalArgs {
            'autoStart:before-start': Omit<SignalArgs['interactions:move'], 'interaction'> & {
                interaction: Interaction<ActionName>;
            };
            'autoStart:prepared': {
                interaction: Interaction;
            };
            'auto-start:check': CheckSignalArg;
        }
    }
    module "@interactjs/core/options" {
        interface BaseDefaults {
            actionChecker?: any;
            cursorChecker?: any;
            styleCursor?: any;
        }
        interface PerActionDefaults {
            manualStart?: boolean;
            max?: number;
            maxPerElement?: number;
            allowFrom?: string | Element;
            ignoreFrom?: string | Element;
            cursorChecker?: CursorChecker;
            mouseButtons?: 0 | 1 | 2 | 4 | 8 | 16;
        }
    }
    interface CheckSignalArg {
        interactable: Interactable;
        interaction: Interaction;
        element: Element;
        action: ActionProps<ActionName>;
        buttons: number;
    }
    export interface AutoStart {
        maxInteractions: number;
        withinInteractionLimit: typeof withinInteractionLimit;
        cursorElement: Element;
    }
    function withinInteractionLimit<T extends ActionName>(interactable: Interactable, element: Element, action: ActionProps<T>, scope: Scope): boolean;
    const autoStart: Plugin;
    export default autoStart;
}
declare module "@interactjs/auto-start/dragAxis" {
    import type { SignalArgs, Scope } from "@interactjs/core/scope";
    function beforeStart({ interaction, eventTarget, dx, dy }: SignalArgs['interactions:move'], scope: Scope): void;
    const _default_8: {
        id: string;
        listeners: {
            'autoStart:before-start': typeof beforeStart;
        };
    };
    export default _default_8;
}
declare module "@interactjs/auto-start/hold" {
    import type { Plugin } from "@interactjs/core/scope";
    module "@interactjs/core/options" {
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
    const hold: Plugin;
    export default hold;
}
declare module "@interactjs/auto-start/plugin" {
    import type { Scope } from "@interactjs/core/scope";
    const _default_9: {
        id: string;
        install(scope: Scope): void;
    };
    export default _default_9;
}
declare module "@interactjs/auto-start/index" { }
declare module "@interactjs/core/tests/_helpers" {
    import type { PointerType, Rect, Target } from "@interactjs/core/types";
    import * as pointerUtils from "@interactjs/utils/pointerUtils";
    import type { Plugin } from "@interactjs/core/scope";
    import { Scope } from "@interactjs/core/scope";
    import type { ActionProps } from "@interactjs/core/types";
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
    export function newPointer(n?: number): PointerType;
    export function mockScope({ document }?: any): Scope;
    export function getProps<T extends {
        [key: string]: any;
    }, K extends keyof T>(src: T, props: readonly K[]): Pick<T, K>;
    export function testEnv<T extends Target = HTMLElement>({ plugins, target, rect, document, }?: {
        plugins?: Plugin[];
        target?: T;
        rect?: Rect;
        document?: Document;
    }): {
        scope: Scope;
        interaction: import("@interactjs/core/Interaction").Interaction<keyof import("@interactjs/core/types").ActionMap>;
        target: T;
        interactable: import("@interactjs/types").Interactable;
        coords: pointerUtils.MockCoords;
        event: {
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
        } & PointerType & import("@interactjs/core/types").PointerEventType;
        interact: import("@interactjs/core/InteractStatic").InteractStatic;
        start: <T_1 extends keyof import("@interactjs/core/types").ActionMap>(action: ActionProps<T_1>) => boolean;
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
declare module "@interactjs/dev-tools/visualizer/plugin" {
    const _default_10: {};
    export default _default_10;
}
declare module "@interactjs/dev-tools/plugin" {
    import type Interaction from "@interactjs/core/Interaction";
    import type { Plugin } from "@interactjs/core/scope";
    import type { OptionMethod } from "@interactjs/core/types";
    import visualizer from "@interactjs/dev-tools/visualizer/plugin";
    module "@interactjs/core/scope" {
        interface Scope {
            logger: Logger;
        }
    }
    module "@interactjs/core/InteractStatic" {
        interface InteractStatic {
            visializer: typeof visualizer;
        }
    }
    module "@interactjs/core/options" {
        interface BaseDefaults {
            devTools?: DevToolsOptions;
        }
    }
    module "@interactjs/core/Interactable" {
        interface Interactable {
            devTools: OptionMethod<DevToolsOptions>;
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
        perform: (interaction: Interaction) => boolean;
        getInfo: (interaction: Interaction) => any[];
    }
    enum CheckName {
        touchAction = "touchAction",
        boxSizing = "boxSizing",
        noListeners = "noListeners"
    }
    const defaultExport: Plugin;
    export default defaultExport;
}
declare module "@interactjs/dev-tools/index" { }
declare module "@interactjs/dev-tools/visualizer/plugin.stub" {
    const _default_11: {};
    export default _default_11;
}
declare module "@interactjs/dev-tools/visualizer/vueModules.stub" {
    export {};
}
declare module "@interactjs/dev-tools/visualizer/vueModules" {
    export {};
}
declare module "@interactjs/modifiers/types" {
    import type { EventPhase } from "@interactjs/core/InteractEvent";
    import type { Interactable } from "@interactjs/core/Interactable";
    import type Interaction from "@interactjs/core/Interaction";
    import type { EdgeOptions, FullRect, Point, Rect } from "@interactjs/core/types";
    export interface Modifier<Defaults = any, State extends ModifierState = any, Name extends string = any, Result = any> {
        options: Defaults;
        methods: {
            start?: (arg: ModifierArg<State>) => void;
            set?: (arg: ModifierArg<State>) => Result;
            beforeEnd?: (arg: ModifierArg<State>) => Point | void;
            stop?: (arg: ModifierArg<State>) => void;
        };
        name?: Name;
        enable: () => Modifier<Defaults, State, Name, Result>;
        disable: () => Modifier<Defaults, State, Name, Result>;
    }
    export type ModifierState<Defaults = unknown, StateProps = unknown, Name extends string = any> = {
        options: Defaults;
        methods?: Modifier<Defaults>['methods'];
        index?: number;
        name?: Name;
    } & StateProps;
    export interface ModifierArg<State extends ModifierState = ModifierState> {
        interaction: Interaction;
        interactable: Interactable;
        phase: EventPhase;
        rect: FullRect;
        edges: EdgeOptions;
        state: State;
        element: Element;
        pageCoords: Point;
        prevCoords: Point;
        prevRect?: FullRect;
        coords: Point;
        startOffset: Rect;
        preEnd?: boolean;
    }
    export interface ModifierModule<Defaults extends {
        enabled?: boolean;
    }, State extends ModifierState, Result = unknown> {
        defaults?: Defaults;
        start?(arg: ModifierArg<State>): void;
        set?(arg: ModifierArg<State>): Result;
        beforeEnd?(arg: ModifierArg<State>): Point | void;
        stop?(arg: ModifierArg<State>): void;
    }
    export interface ModifierFunction<Defaults extends {
        enabled?: boolean;
    }, State extends ModifierState, Name extends string> {
        (_options?: Partial<Defaults>): Modifier<Defaults, State, Name>;
        _defaults: Defaults;
        _methods: ModifierModule<Defaults, State>;
    }
}
declare module "@interactjs/modifiers/Modification" {
    import type { EventPhase } from "@interactjs/core/InteractEvent";
    import type { Interaction, DoAnyPhaseArg } from "@interactjs/core/Interaction";
    import type { EdgeOptions, FullRect, Point, Rect } from "@interactjs/core/types";
    import type { Modifier, ModifierArg, ModifierState } from "@interactjs/modifiers/types";
    export interface ModificationResult {
        delta: Point;
        rectDelta: Rect;
        coords: Point;
        rect: FullRect;
        eventProps: any[];
        changed: boolean;
    }
    interface MethodArg {
        phase: EventPhase;
        pageCoords: Point;
        rect: FullRect;
        coords: Point;
        preEnd?: boolean;
        skipModifiers?: number;
    }
    export default class Modification {
        states: ModifierState[];
        startOffset: Rect;
        startDelta: Point;
        result: ModificationResult;
        endResult: Point;
        edges: EdgeOptions;
        readonly interaction: Readonly<Interaction>;
        constructor(interaction: Interaction);
        start({ phase }: {
            phase: EventPhase;
        }, pageCoords: Point): ModificationResult;
        fillArg(arg: Partial<ModifierArg>): ModifierArg<{
            options: unknown;
            methods?: {
                start?: (arg: ModifierArg<any>) => void;
                set?: (arg: ModifierArg<any>) => any;
                beforeEnd?: (arg: ModifierArg<any>) => void | Point;
                stop?: (arg: ModifierArg<any>) => void;
            };
            index?: number;
            name?: any;
        }>;
        startAll(arg: MethodArg & Partial<ModifierArg>): void;
        setAll(arg: MethodArg & Partial<ModifierArg>): ModificationResult;
        applyToInteraction(arg: {
            phase: EventPhase;
            rect?: Rect;
        }): void;
        setAndApply(arg: Partial<DoAnyPhaseArg> & {
            phase: EventPhase;
            preEnd?: boolean;
            skipModifiers?: number;
            modifiedCoords?: Point;
        }): void | false;
        beforeEnd(arg: Omit<DoAnyPhaseArg, 'iEvent'> & {
            state?: ModifierState;
        }): void | false;
        stop(arg: {
            interaction: Interaction;
        }): void;
        prepareStates(modifierList: Modifier[]): {
            options: unknown;
            methods?: {
                start?: (arg: ModifierArg<any>) => void;
                set?: (arg: ModifierArg<any>) => any;
                beforeEnd?: (arg: ModifierArg<any>) => void | Point;
                stop?: (arg: ModifierArg<any>) => void;
            };
            index?: number;
            name?: any;
        }[];
        restoreInteractionCoords({ interaction: { coords, rect, modification } }: {
            interaction: Interaction;
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
    import type { InteractEvent } from "@interactjs/core/InteractEvent";
    import type Interaction from "@interactjs/core/Interaction";
    import type { Plugin } from "@interactjs/core/scope";
    import Modification from "@interactjs/modifiers/Modification";
    import type { Modifier, ModifierModule, ModifierState } from "@interactjs/modifiers/types";
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
    module "@interactjs/core/options" {
        interface PerActionDefaults {
            modifiers?: Modifier[];
        }
    }
    export function makeModifier<Defaults extends {
        enabled?: boolean;
    }, State extends ModifierState, Name extends string, Result>(module: ModifierModule<Defaults, State, Result>, name?: Name): {
        (_options?: Partial<Defaults>): Modifier<Defaults, State, Name, Result>;
        _defaults: Defaults;
        _methods: {
            start: (arg: import("@interactjs/modifiers/types").ModifierArg<State>) => void;
            set: (arg: import("@interactjs/modifiers/types").ModifierArg<State>) => Result;
            beforeEnd: (arg: import("@interactjs/modifiers/types").ModifierArg<State>) => void | import("@interactjs/types").Point;
            stop: (arg: import("@interactjs/modifiers/types").ModifierArg<State>) => void;
        };
    };
    export function addEventModifiers({ iEvent, interaction, }: {
        iEvent: InteractEvent<any>;
        interaction: Interaction<any>;
    }): void;
    const modifiersBase: Plugin;
    export default modifiersBase;
}
declare module "@interactjs/offset/plugin" {
    import type Interaction from "@interactjs/core/Interaction";
    import type { Plugin } from "@interactjs/core/scope";
    import type { Point } from "@interactjs/core/types";
    module "@interactjs/core/Interaction" {
        interface Interaction {
            offsetBy?: typeof offsetBy;
            offset: {
                total: Point;
                pending: Point;
            };
        }
        enum _ProxyMethods {
            offsetBy = ""
        }
    }
    export function addTotal(interaction: Interaction): void;
    export function applyPending(interaction: Interaction): boolean;
    function offsetBy(this: Interaction, { x, y }: Point): void;
    const offset: Plugin;
    export default offset;
}
declare module "@interactjs/inertia/plugin" {
    import type { Interaction, DoPhaseArg } from "@interactjs/core/Interaction";
    import type { SignalArgs, Plugin } from "@interactjs/core/scope";
    import type { ActionName, Point, PointerEventType } from "@interactjs/core/types";
    import Modification from "@interactjs/modifiers/Modification";
    import type { ModifierArg } from "@interactjs/modifiers/types";
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
    module "@interactjs/core/options" {
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
            'interactions:before-action-inertiastart': Omit<DoPhaseArg<ActionName, 'inertiastart'>, 'iEvent'>;
            'interactions:action-inertiastart': DoPhaseArg<ActionName, 'inertiastart'>;
            'interactions:after-action-inertiastart': DoPhaseArg<ActionName, 'inertiastart'>;
            'interactions:before-action-resume': Omit<DoPhaseArg<ActionName, 'resume'>, 'iEvent'>;
            'interactions:action-resume': DoPhaseArg<ActionName, 'resume'>;
            'interactions:after-action-resume': DoPhaseArg<ActionName, 'resume'>;
        }
    }
    export class InertiaState {
        active: boolean;
        isModified: boolean;
        smoothEnd: boolean;
        allowResume: boolean;
        modification: Modification;
        modifierCount: number;
        modifierArg: ModifierArg;
        startCoords: Point;
        t0: number;
        v0: number;
        te: number;
        targetOffset: Point;
        modifiedOffset: Point;
        currentOffset: Point;
        lambda_v0?: number;
        one_ve_v0?: number;
        timeout: number;
        readonly interaction: Interaction;
        constructor(interaction: Interaction);
        start(event: PointerEventType): boolean;
        startInertia(): void;
        startSmoothEnd(): void;
        onNextFrame(tickFn: () => void): void;
        inertiaTick(): void;
        smoothEndTick(): void;
        resume({ pointer, event, eventTarget }: SignalArgs['interactions:down']): void;
        end(): void;
        stop(): void;
    }
    const inertia: Plugin;
    export default inertia;
}
declare module "@interactjs/inertia/index" { }
declare module "@interactjs/snappers/edgeTarget" {
    const _default_12: () => void;
    export default _default_12;
}
declare module "@interactjs/snappers/elements" {
    const _default_13: () => void;
    export default _default_13;
}
declare module "@interactjs/modifiers/snap/pointer" {
    import type { Interaction, InteractionProxy } from "@interactjs/core/Interaction";
    import type { ActionName, Point, RectResolvable, Element } from "@interactjs/core/types";
    import type { ModifierArg, ModifierState } from "@interactjs/modifiers/types";
    export interface Offset {
        x: number;
        y: number;
        index: number;
        relativePoint?: Point | null;
    }
    export interface SnapPosition {
        x?: number;
        y?: number;
        range?: number;
        offset?: Offset;
        [index: string]: any;
    }
    export type SnapFunction = (x: number, y: number, interaction: InteractionProxy<ActionName>, offset: Offset, index: number) => SnapPosition;
    export type SnapTarget = SnapPosition | SnapFunction;
    export interface SnapOptions {
        targets: SnapTarget[] | null;
        range: number;
        relativePoints: Point[] | null;
        offset: Point | RectResolvable<[Interaction]> | 'startCoords' | null;
        offsetWithOrigin?: boolean;
        origin: RectResolvable<[Element]> | Point | null;
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
    const _default_14: {
        (_options?: Partial<SnapOptions>): import("@interactjs/modifiers/types").Modifier<SnapOptions, SnapState, "snap", {
            target: any;
            inRange: boolean;
            distance: number;
            range: number;
            delta: {
                x: number;
                y: number;
            };
        }>;
        _defaults: SnapOptions;
        _methods: {
            start: (arg: ModifierArg<SnapState>) => void;
            set: (arg: ModifierArg<SnapState>) => {
                target: any;
                inRange: boolean;
                distance: number;
                range: number;
                delta: {
                    x: number;
                    y: number;
                };
            };
            beforeEnd: (arg: ModifierArg<SnapState>) => void | Point;
            stop: (arg: ModifierArg<SnapState>) => void;
        };
    };
    export default _default_14;
    export { snap };
}
declare module "@interactjs/snappers/grid" {
    import type { Rect, Point } from "@interactjs/core/types";
    import type { SnapFunction } from "@interactjs/modifiers/snap/pointer";
    export type GridOptions = (Partial<Rect> | Point) & {
        range?: number;
        limits?: Rect;
        offset?: Point;
    };
    const _default_15: (grid: GridOptions) => SnapFunction & {
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
    import type { Plugin } from "@interactjs/core/scope";
    import * as allSnappers from "@interactjs/snappers/all";
    module "@interactjs/core/InteractStatic" {
        interface InteractStatic {
            snappers: typeof allSnappers;
            createSnapGrid: typeof allSnappers.grid;
        }
    }
    const snappersPlugin: Plugin;
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
    import type { Point, Rect, EdgeOptions } from "@interactjs/core/types";
    import Modification from "@interactjs/modifiers/Modification";
    import type { Modifier, ModifierModule, ModifierState } from "@interactjs/modifiers/types";
    export interface AspectRatioOptions {
        ratio?: number | 'preserve';
        equalDelta?: boolean;
        modifiers?: Modifier[];
        enabled?: boolean;
    }
    export type AspectRatioState = ModifierState<AspectRatioOptions, {
        startCoords: Point;
        startRect: Rect;
        linkedEdges: EdgeOptions;
        ratio: number;
        equalDelta: boolean;
        xIsPrimaryAxis: boolean;
        edgeSign: {
            x: number;
            y: number;
        };
        subModification: Modification;
    }>;
    const aspectRatio: ModifierModule<AspectRatioOptions, AspectRatioState>;
    const _default_16: {
        (_options?: Partial<AspectRatioOptions>): Modifier<AspectRatioOptions, AspectRatioState, "aspectRatio", unknown>;
        _defaults: AspectRatioOptions;
        _methods: {
            start: (arg: import("@interactjs/modifiers/types").ModifierArg<AspectRatioState>) => void;
            set: (arg: import("@interactjs/modifiers/types").ModifierArg<AspectRatioState>) => unknown;
            beforeEnd: (arg: import("@interactjs/modifiers/types").ModifierArg<AspectRatioState>) => void | Point;
            stop: (arg: import("@interactjs/modifiers/types").ModifierArg<AspectRatioState>) => void;
        };
    };
    export default _default_16;
    export { aspectRatio };
}
declare module "@interactjs/modifiers/noop" {
    import type { ModifierFunction } from "@interactjs/modifiers/types";
    const noop: ModifierFunction<any, any, "noop">;
    export default noop;
}
declare module "@interactjs/modifiers/avoid/avoid" {
    export { default } from "@interactjs/modifiers/noop";
}
declare module "@interactjs/modifiers/restrict/pointer" {
    import type Interaction from "@interactjs/core/Interaction";
    import type { RectResolvable, Rect, Point } from "@interactjs/core/types";
    import type { ModifierArg, ModifierModule, ModifierState } from "@interactjs/modifiers/types";
    export interface RestrictOptions {
        restriction: RectResolvable<[number, number, Interaction]>;
        elementRect: Rect;
        offset: Rect;
        endOnly: boolean;
        enabled?: boolean;
    }
    export type RestrictState = ModifierState<RestrictOptions, {
        offset: Rect;
    }>;
    export function getRestrictionRect(value: RectResolvable<[number, number, Interaction]>, interaction: Interaction, coords?: Point): Rect;
    const restrict: ModifierModule<RestrictOptions, RestrictState>;
    const _default_17: {
        (_options?: Partial<RestrictOptions>): import("@interactjs/modifiers/types").Modifier<RestrictOptions, RestrictState, "restrict", unknown>;
        _defaults: RestrictOptions;
        _methods: {
            start: (arg: ModifierArg<RestrictState>) => void;
            set: (arg: ModifierArg<RestrictState>) => unknown;
            beforeEnd: (arg: ModifierArg<RestrictState>) => void | Point;
            stop: (arg: ModifierArg<RestrictState>) => void;
        };
    };
    export default _default_17;
    export { restrict };
}
declare module "@interactjs/modifiers/restrict/edges" {
    import type { Point, Rect } from "@interactjs/core/types";
    import type { ModifierArg, ModifierState } from "@interactjs/modifiers/types";
    import type { RestrictOptions } from "@interactjs/modifiers/restrict/pointer";
    export interface RestrictEdgesOptions {
        inner: RestrictOptions['restriction'];
        outer: RestrictOptions['restriction'];
        offset?: RestrictOptions['offset'];
        endOnly: boolean;
        enabled?: boolean;
    }
    export type RestrictEdgesState = ModifierState<RestrictEdgesOptions, {
        inner: Rect;
        outer: Rect;
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
        (_options?: Partial<RestrictEdgesOptions>): import("@interactjs/modifiers/types").Modifier<RestrictEdgesOptions, RestrictEdgesState, "restrictEdges", void>;
        _defaults: RestrictEdgesOptions;
        _methods: {
            start: (arg: ModifierArg<RestrictEdgesState>) => void;
            set: (arg: ModifierArg<RestrictEdgesState>) => void;
            beforeEnd: (arg: ModifierArg<RestrictEdgesState>) => void | Point;
            stop: (arg: ModifierArg<RestrictEdgesState>) => void;
        };
    };
    export default _default_18;
    export { restrictEdges };
}
declare module "@interactjs/modifiers/restrict/rect" {
    const restrictRect: {
        start: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/pointer").RestrictState>) => void;
        set: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/pointer").RestrictState>) => unknown;
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
        }>): import("@interactjs/modifiers/types").Modifier<import("@interactjs/modifiers/restrict/pointer").RestrictOptions & {
            elementRect: {
                top: number;
                left: number;
                bottom: number;
                right: number;
            };
        }, import("@interactjs/modifiers/restrict/pointer").RestrictState, "restrictRect", unknown>;
        _defaults: import("@interactjs/modifiers/restrict/pointer").RestrictOptions & {
            elementRect: {
                top: number;
                left: number;
                bottom: number;
                right: number;
            };
        };
        _methods: {
            start: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/pointer").RestrictState>) => void;
            set: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/pointer").RestrictState>) => unknown;
            beforeEnd: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/pointer").RestrictState>) => void | import("@interactjs/types").Point;
            stop: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/pointer").RestrictState>) => void;
        };
    };
    export default _default_19;
    export { restrictRect };
}
declare module "@interactjs/modifiers/restrict/size" {
    import type { Point, Rect, Size } from "@interactjs/core/types";
    import type { ModifierArg, ModifierState } from "@interactjs/modifiers/types";
    import type { RestrictEdgesState } from "@interactjs/modifiers/restrict/edges";
    import type { RestrictOptions } from "@interactjs/modifiers/restrict/pointer";
    export interface RestrictSizeOptions {
        min?: Size | Point | RestrictOptions['restriction'];
        max?: Size | Point | RestrictOptions['restriction'];
        endOnly: boolean;
        enabled?: boolean;
    }
    function start(arg: ModifierArg<RestrictEdgesState>): void;
    export type RestrictSizeState = RestrictEdgesState & ModifierState<RestrictSizeOptions & {
        inner: Rect;
        outer: Rect;
    }, {
        min: Rect;
        max: Rect;
    }>;
    function set(arg: ModifierArg<RestrictSizeState>): void;
    const restrictSize: {
        start: typeof start;
        set: typeof set;
        defaults: RestrictSizeOptions;
    };
    const _default_20: {
        (_options?: Partial<RestrictSizeOptions>): import("@interactjs/modifiers/types").Modifier<RestrictSizeOptions, RestrictEdgesState, "restrictSize", void>;
        _defaults: RestrictSizeOptions;
        _methods: {
            start: (arg: ModifierArg<RestrictEdgesState>) => void;
            set: (arg: ModifierArg<RestrictEdgesState>) => void;
            beforeEnd: (arg: ModifierArg<RestrictEdgesState>) => void | Point;
            stop: (arg: ModifierArg<RestrictEdgesState>) => void;
        };
    };
    export default _default_20;
    export { restrictSize };
}
declare module "@interactjs/modifiers/rubberband/rubberband" {
    export { default } from "@interactjs/modifiers/noop";
}
declare module "@interactjs/modifiers/snap/size" {
    import type { ModifierArg } from "@interactjs/modifiers/types";
    import type { SnapOptions, SnapState } from "@interactjs/modifiers/snap/pointer";
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
        defaults: SnapSizeOptions;
    };
    const _default_21: {
        (_options?: Partial<SnapSizeOptions>): import("@interactjs/modifiers/types").Modifier<SnapSizeOptions, SnapState, "snapSize", {
            target: any;
            inRange: boolean;
            distance: number;
            range: number;
            delta: {
                x: number;
                y: number;
            };
        }>;
        _defaults: SnapSizeOptions;
        _methods: {
            start: (arg: ModifierArg<SnapState>) => void;
            set: (arg: ModifierArg<SnapState>) => {
                target: any;
                inRange: boolean;
                distance: number;
                range: number;
                delta: {
                    x: number;
                    y: number;
                };
            };
            beforeEnd: (arg: ModifierArg<SnapState>) => void | import("@interactjs/types").Point;
            stop: (arg: ModifierArg<SnapState>) => void;
        };
    };
    export default _default_21;
    export { snapSize };
}
declare module "@interactjs/modifiers/snap/edges" {
    import type { ModifierArg, ModifierModule } from "@interactjs/modifiers/types";
    import type { SnapOptions, SnapState } from "@interactjs/modifiers/snap/pointer";
    import { snapSize } from "@interactjs/modifiers/snap/size";
    export type SnapEdgesOptions = Pick<SnapOptions, 'targets' | 'range' | 'offset' | 'endOnly' | 'enabled'>;
    const snapEdges: ModifierModule<SnapEdgesOptions, SnapState, ReturnType<typeof snapSize.set>>;
    const _default_22: {
        (_options?: Partial<SnapEdgesOptions>): import("@interactjs/modifiers/types").Modifier<SnapEdgesOptions, SnapState, "snapEdges", {
            target: any;
            inRange: boolean;
            distance: number;
            range: number;
            delta: {
                x: number;
                y: number;
            };
        }>;
        _defaults: SnapEdgesOptions;
        _methods: {
            start: (arg: ModifierArg<SnapState>) => void;
            set: (arg: ModifierArg<SnapState>) => {
                target: any;
                inRange: boolean;
                distance: number;
                range: number;
                delta: {
                    x: number;
                    y: number;
                };
            };
            beforeEnd: (arg: ModifierArg<SnapState>) => void | import("@interactjs/types").Point;
            stop: (arg: ModifierArg<SnapState>) => void;
        };
    };
    export default _default_22;
    export { snapEdges };
}
declare module "@interactjs/modifiers/spring/spring" {
    export { default } from "@interactjs/modifiers/noop";
}
declare module "@interactjs/modifiers/transform/transform" {
    export { default } from "@interactjs/modifiers/noop";
}
declare module "@interactjs/modifiers/all" {
    const _default_23: {
        aspectRatio: {
            (_options?: Partial<import("@interactjs/modifiers/aspectRatio").AspectRatioOptions>): import("@interactjs/modifiers/types").Modifier<import("@interactjs/modifiers/aspectRatio").AspectRatioOptions, import("@interactjs/modifiers/aspectRatio").AspectRatioState, "aspectRatio", unknown>;
            _defaults: import("@interactjs/modifiers/aspectRatio").AspectRatioOptions;
            _methods: {
                start: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/aspectRatio").AspectRatioState>) => void;
                set: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/aspectRatio").AspectRatioState>) => unknown;
                beforeEnd: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/aspectRatio").AspectRatioState>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/aspectRatio").AspectRatioState>) => void;
            };
        };
        restrictEdges: {
            (_options?: Partial<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions>): import("@interactjs/modifiers/types").Modifier<import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions, import("@interactjs/modifiers/restrict/edges").RestrictEdgesState, "restrictEdges", void>;
            _defaults: import("@interactjs/modifiers/restrict/edges").RestrictEdgesOptions;
            _methods: {
                start: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/edges").RestrictEdgesState>) => void;
                set: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/edges").RestrictEdgesState>) => void;
                beforeEnd: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/edges").RestrictEdgesState>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/edges").RestrictEdgesState>) => void;
            };
        };
        restrict: {
            (_options?: Partial<import("@interactjs/modifiers/restrict/pointer").RestrictOptions>): import("@interactjs/modifiers/types").Modifier<import("@interactjs/modifiers/restrict/pointer").RestrictOptions, import("@interactjs/modifiers/restrict/pointer").RestrictState, "restrict", unknown>;
            _defaults: import("@interactjs/modifiers/restrict/pointer").RestrictOptions;
            _methods: {
                start: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/pointer").RestrictState>) => void;
                set: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/pointer").RestrictState>) => unknown;
                beforeEnd: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/pointer").RestrictState>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/pointer").RestrictState>) => void;
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
            }>): import("@interactjs/modifiers/types").Modifier<import("@interactjs/modifiers/restrict/pointer").RestrictOptions & {
                elementRect: {
                    top: number;
                    left: number;
                    bottom: number;
                    right: number;
                };
            }, import("@interactjs/modifiers/restrict/pointer").RestrictState, "restrictRect", unknown>;
            _defaults: import("@interactjs/modifiers/restrict/pointer").RestrictOptions & {
                elementRect: {
                    top: number;
                    left: number;
                    bottom: number;
                    right: number;
                };
            };
            _methods: {
                start: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/pointer").RestrictState>) => void;
                set: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/pointer").RestrictState>) => unknown;
                beforeEnd: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/pointer").RestrictState>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/pointer").RestrictState>) => void;
            };
        };
        restrictSize: {
            (_options?: Partial<import("@interactjs/modifiers/restrict/size").RestrictSizeOptions>): import("@interactjs/modifiers/types").Modifier<import("@interactjs/modifiers/restrict/size").RestrictSizeOptions, import("@interactjs/modifiers/restrict/edges").RestrictEdgesState, "restrictSize", void>;
            _defaults: import("@interactjs/modifiers/restrict/size").RestrictSizeOptions;
            _methods: {
                start: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/edges").RestrictEdgesState>) => void;
                set: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/edges").RestrictEdgesState>) => void;
                beforeEnd: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/edges").RestrictEdgesState>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/restrict/edges").RestrictEdgesState>) => void;
            };
        };
        snapEdges: {
            (_options?: Partial<import("@interactjs/modifiers/snap/edges").SnapEdgesOptions>): import("@interactjs/modifiers/types").Modifier<import("@interactjs/modifiers/snap/edges").SnapEdgesOptions, import("@interactjs/modifiers/snap/pointer").SnapState, "snapEdges", {
                target: any;
                inRange: boolean;
                distance: number;
                range: number;
                delta: {
                    x: number;
                    y: number;
                };
            }>;
            _defaults: import("@interactjs/modifiers/snap/edges").SnapEdgesOptions;
            _methods: {
                start: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/snap/pointer").SnapState>) => void;
                set: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/snap/pointer").SnapState>) => {
                    target: any;
                    inRange: boolean;
                    distance: number;
                    range: number;
                    delta: {
                        x: number;
                        y: number;
                    };
                };
                beforeEnd: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/snap/pointer").SnapState>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/snap/pointer").SnapState>) => void;
            };
        };
        snap: {
            (_options?: Partial<import("@interactjs/modifiers/snap/pointer").SnapOptions>): import("@interactjs/modifiers/types").Modifier<import("@interactjs/modifiers/snap/pointer").SnapOptions, import("@interactjs/modifiers/snap/pointer").SnapState, "snap", {
                target: any;
                inRange: boolean;
                distance: number;
                range: number;
                delta: {
                    x: number;
                    y: number;
                };
            }>;
            _defaults: import("@interactjs/modifiers/snap/pointer").SnapOptions;
            _methods: {
                start: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/snap/pointer").SnapState>) => void;
                set: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/snap/pointer").SnapState>) => {
                    target: any;
                    inRange: boolean;
                    distance: number;
                    range: number;
                    delta: {
                        x: number;
                        y: number;
                    };
                };
                beforeEnd: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/snap/pointer").SnapState>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/snap/pointer").SnapState>) => void;
            };
        };
        snapSize: {
            (_options?: Partial<import("@interactjs/modifiers/snap/size").SnapSizeOptions>): import("@interactjs/modifiers/types").Modifier<import("@interactjs/modifiers/snap/size").SnapSizeOptions, import("@interactjs/modifiers/snap/pointer").SnapState, "snapSize", {
                target: any;
                inRange: boolean;
                distance: number;
                range: number;
                delta: {
                    x: number;
                    y: number;
                };
            }>;
            _defaults: import("@interactjs/modifiers/snap/size").SnapSizeOptions;
            _methods: {
                start: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/snap/pointer").SnapState>) => void;
                set: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/snap/pointer").SnapState>) => {
                    target: any;
                    inRange: boolean;
                    distance: number;
                    range: number;
                    delta: {
                        x: number;
                        y: number;
                    };
                };
                beforeEnd: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/snap/pointer").SnapState>) => void | import("@interactjs/types").Point;
                stop: (arg: import("@interactjs/modifiers/types").ModifierArg<import("@interactjs/modifiers/snap/pointer").SnapState>) => void;
            };
        };
        spring: import("@interactjs/modifiers/types").ModifierFunction<any, any, "noop">;
        avoid: import("@interactjs/modifiers/types").ModifierFunction<any, any, "noop">;
        transform: import("@interactjs/modifiers/types").ModifierFunction<any, any, "noop">;
        rubberband: import("@interactjs/modifiers/types").ModifierFunction<any, any, "noop">;
    };
    export default _default_23;
}
declare module "@interactjs/modifiers/plugin" {
    import type { Plugin } from "@interactjs/core/scope";
    import all from "@interactjs/modifiers/all";
    module "@interactjs/core/InteractStatic" {
        interface InteractStatic {
            modifiers: typeof all;
        }
    }
    const modifiers: Plugin;
    export default modifiers;
}
declare module "@interactjs/pointer-events/PointerEvent" {
    import { BaseEvent } from "@interactjs/core/BaseEvent";
    import type Interaction from "@interactjs/core/Interaction";
    import type { PointerEventType, PointerType, Point } from "@interactjs/core/types";
    export default class PointerEvent<T extends string = any> extends BaseEvent<never> {
        type: T;
        originalEvent: PointerEventType;
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
        constructor(type: T, pointer: PointerType | PointerEvent<any>, event: PointerEventType, eventTarget: Node, interaction: Interaction<never>, timeStamp: number);
        _subtractOrigin({ x: originX, y: originY }: Point): this;
        _addOrigin({ x: originX, y: originY }: Point): this;
        /**
         * Prevent the default behaviour of the original Event
         */
        preventDefault(): void;
    }
    export { PointerEvent };
}
declare module "@interactjs/pointer-events/base" {
    import type { Eventable } from "@interactjs/core/Eventable";
    import type { Interaction } from "@interactjs/core/Interaction";
    import type { PerActionDefaults } from "@interactjs/core/options";
    import type { Plugin } from "@interactjs/core/scope";
    import type { Point, PointerType, PointerEventType, Element } from "@interactjs/core/types";
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
        origin?: Point | string | Element;
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
    module "@interactjs/core/options" {
        interface ActionDefaults {
            pointerEvents: Options;
        }
    }
    module "@interactjs/core/scope" {
        interface SignalArgs {
            'pointerEvents:new': {
                pointerEvent: PointerEvent<any>;
            };
            'pointerEvents:fired': {
                interaction: Interaction<null>;
                pointer: PointerType | PointerEvent<any>;
                event: PointerEventType | PointerEvent<any>;
                eventTarget: Node;
                pointerEvent: PointerEvent<any>;
                targets?: EventTargetList;
                type: string;
            };
            'pointerEvents:collect-targets': {
                interaction: Interaction<any>;
                pointer: PointerType | PointerEvent<any>;
                event: PointerEventType | PointerEvent<any>;
                eventTarget: Node;
                targets?: EventTargetList;
                type: string;
                path: Node[];
                node: null;
            };
        }
    }
    const pointerEvents: Plugin;
    export default pointerEvents;
}
declare module "@interactjs/pointer-events/holdRepeat" {
    import type { Plugin } from "@interactjs/core/scope";
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
    const holdRepeat: Plugin;
    export default holdRepeat;
}
declare module "@interactjs/pointer-events/interactableTargets" {
    import type { Interactable } from "@interactjs/core/Interactable";
    import type { Plugin } from "@interactjs/core/scope";
    module "@interactjs/core/Interactable" {
        interface Interactable {
            pointerEvents: typeof pointerEventsMethod;
            __backCompatOption: (optionName: string, newValue: any) => any;
        }
    }
    function pointerEventsMethod(this: Interactable, options: any): Interactable;
    const plugin: Plugin;
    export default plugin;
}
declare module "@interactjs/pointer-events/plugin" {
    import type { Plugin } from "@interactjs/core/scope";
    const plugin: Plugin;
    export default plugin;
}
declare module "@interactjs/reflow/plugin" {
    import type { Interactable } from "@interactjs/core/Interactable";
    import type { DoAnyPhaseArg } from "@interactjs/core/Interaction";
    import type { Scope, Plugin } from "@interactjs/core/scope";
    import type { ActionName, ActionProps } from "@interactjs/core/types";
    module "@interactjs/core/scope" {
        interface SignalArgs {
            'interactions:before-action-reflow': Omit<DoAnyPhaseArg, 'iEvent'>;
            'interactions:action-reflow': DoAnyPhaseArg;
            'interactions:after-action-reflow': DoAnyPhaseArg;
        }
    }
    module "@interactjs/core/Interactable" {
        interface Interactable {
            reflow: <T extends ActionName>(action: ActionProps<T>) => ReturnType<typeof doReflow>;
        }
    }
    module "@interactjs/core/Interaction" {
        interface Interaction {
            _reflowPromise: Promise<void>;
            _reflowResolve: (...args: unknown[]) => void;
        }
    }
    module "@interactjs/core/InteractEvent" {
        interface PhaseMap {
            reflow?: true;
        }
    }
    export function install(scope: Scope): void;
    function doReflow<T extends ActionName>(interactable: Interactable, action: ActionProps<T>, scope: Scope): Promise<Interactable>;
    const reflow: Plugin;
    export default reflow;
}
declare module "@interactjs/interactjs/index.stub" {
    import interact from "@interactjs/interact/index";
    export default interact;
    const _: {
        actions: {
            id: string;
            install(scope: import("@interactjs/core/scope").Scope): void;
        };
        autoScroll: import("@interactjs/types").Plugin;
        autoStart: {
            id: string;
            install(scope: import("@interactjs/core/scope").Scope): void;
        };
        interactablePreventDefault: {
            id: string;
            install: typeof import("@interactjs/core/interactablePreventDefault").install;
            listeners: any;
        };
        devTools: import("@interactjs/types").Plugin;
        inertia: import("@interactjs/types").Plugin;
        interact: import("@interactjs/core/InteractStatic").InteractStatic;
        modifiers: import("@interactjs/types").Plugin;
        offset: import("@interactjs/types").Plugin;
        pointerEvents: import("@interactjs/types").Plugin;
        reflow: import("@interactjs/types").Plugin;
    };
    export type __internal_plugin_types__ = typeof _;
}
declare module "@interactjs/interactjs/index" {
    import interact from "@interactjs/interact/index";
    export default interact;
    const _: {
        actions: {
            id: string;
            install(scope: import("@interactjs/core/scope").Scope): void;
        };
        autoScroll: import("@interactjs/types").Plugin;
        autoStart: {
            id: string;
            install(scope: import("@interactjs/core/scope").Scope): void;
        };
        interactablePreventDefault: {
            id: string;
            install: typeof import("@interactjs/core/interactablePreventDefault").install;
            listeners: any;
        };
        devTools: import("@interactjs/types").Plugin;
        inertia: import("@interactjs/types").Plugin;
        interact: import("@interactjs/core/InteractStatic").InteractStatic;
        modifiers: import("@interactjs/types").Plugin;
        offset: import("@interactjs/types").Plugin;
        pointerEvents: import("@interactjs/types").Plugin;
        reflow: import("@interactjs/types").Plugin;
    };
    export type __internal_plugin_types__ = typeof _;
}
declare module "@interactjs/modifiers/index" { }
declare module "@interactjs/modifiers/avoid/avoid.stub" {
    export { default } from "@interactjs/modifiers/noop";
}
declare module "@interactjs/modifiers/rubberband/rubberband.stub" {
    export { default } from "@interactjs/modifiers/noop";
}
declare module "@interactjs/modifiers/spring/spring.stub" {
    export { default } from "@interactjs/modifiers/noop";
}
declare module "@interactjs/modifiers/transform/transform.stub" {
    export { default } from "@interactjs/modifiers/noop";
}
declare module "@interactjs/pointer-events/index" { }
declare module "@interactjs/reflow/index" { }
declare module "@interactjs/snappers/edgeTarget.stub" {
    const _default_24: () => void;
    export default _default_24;
}
declare module "@interactjs/snappers/elements.stub" {
    const _default_25: () => void;
    export default _default_25;
}
declare module "@interactjs/snappers/index" { }
declare module "@interactjs/types/index" {
    import type { InteractEvent as _InteractEvent, EventPhase } from "@interactjs/core/InteractEvent";
    import type * as interaction from "@interactjs/core/Interaction";
    import type { ActionName, ActionProps as _ActionProps } from "@interactjs/core/types";
    export * from "@interactjs/core/types";
    export type { Plugin } from "@interactjs/core/scope";
    export type { EventPhase } from "@interactjs/core/InteractEvent";
    export type { Options } from "@interactjs/core/options";
    export type { PointerEvent } from "@interactjs/pointer-events/PointerEvent";
    export type { Interactable } from "@interactjs/core/Interactable";
    export type { DragEvent } from "@interactjs/actions/drag/plugin";
    export type { DropEvent } from "@interactjs/actions/drop/DropEvent";
    export type { GestureEvent } from "@interactjs/actions/gesture/plugin";
    export type { ResizeEvent } from "@interactjs/actions/resize/plugin";
    export type { SnapFunction, SnapTarget } from "@interactjs/modifiers/snap/pointer";
    export type ActionProps<T extends ActionName = ActionName> = _ActionProps<T>;
    export type Interaction<T extends ActionName = ActionName> = interaction.Interaction<T>;
    export type InteractionProxy<T extends ActionName = ActionName> = interaction.InteractionProxy<T>;
    export type PointerArgProps<T extends {} = {}> = interaction.PointerArgProps<T>;
    export type InteractEvent<T extends ActionName = never, P extends EventPhase = EventPhase> = _InteractEvent<T, P>;
}
declare module "@interactjs/utils/ElementState.stub" {
    const _default_26: {};
    export default _default_26;
}
declare module "@interactjs/utils/ElementState" {
    const _default_27: {};
    export default _default_27;
}
declare module "@interactjs/utils/center" {
    import type { Rect } from "@interactjs/core/types";
    const _default_28: (rect: Rect) => {
        x: number;
        y: number;
    };
    export default _default_28;
}
declare module "@interactjs/utils/displace.stub" {
    const _default_29: {};
    export default _default_29;
}
declare module "@interactjs/utils/displace" {
    const _default_30: {};
    export default _default_30;
}
declare module "@interactjs/utils/exchange.stub" {
    const _default_31: {};
    export default _default_31;
}
declare module "@interactjs/utils/exchange" {
    const _default_32: {};
    export default _default_32;
}
declare module "@interactjs/utils/shallowEqual" {
    export default function shallowEqual(left: any, right: any): boolean;
}
