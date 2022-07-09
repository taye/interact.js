import type Interaction from '@interactjs/core/Interaction';
import type { PhaseMap, InteractEvent } from './InteractEvent';
import type { Interactable } from './Interactable';
import type _NativePointerEventType from './NativePointerEventType';
export declare type OrBoolean<T> = {
    [P in keyof T]: T[P] | boolean;
};
export declare type Element = HTMLElement | SVGElement;
export declare type Context = Document | Element;
export declare type EventTarget = Window | Document | Element;
export declare type Target = EventTarget | string;
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
export declare type FullRect = Required<Rect>;
export declare type RectFunction<T extends any[]> = (...args: T) => Rect | Element;
export declare type RectResolvable<T extends any[]> = Rect | string | Element | RectFunction<T>;
export declare type Dimensions = Point & Size;
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
export declare type ActionName = keyof ActionMap;
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
export declare type InertiaOptions = InertiaOption | boolean;
export interface EdgeOptions {
    top?: boolean | string | Element;
    left?: boolean | string | Element;
    bottom?: boolean | string | Element;
    right?: boolean | string | Element;
}
export declare type CursorChecker = (action: ActionProps<ActionName>, interactable: Interactable, element: Element, interacting: boolean) => string;
export interface ActionMethod<T> {
    (this: Interactable): T;
    (this: Interactable, options: Partial<OrBoolean<T>> | boolean): typeof this;
}
export interface OptionMethod<T> {
    (this: Interactable): T;
    (this: Interactable, options: T): typeof this;
}
export declare type ActionChecker = (pointerEvent: any, defaultAction: string, interactable: Interactable, element: Element, interaction: Interaction) => ActionProps;
export declare type OriginFunction = (target: Element) => Rect;
export interface PointerEventsOptions {
    holdDuration?: number;
    allowFrom?: string;
    ignoreFrom?: string;
    origin?: Rect | Point | string | Element | OriginFunction;
}
export declare type RectChecker = (element: Element) => Rect;
export declare type NativePointerEventType = typeof _NativePointerEventType;
export declare type PointerEventType = MouseEvent | TouchEvent | Partial<NativePointerEventType> | InteractEvent;
export declare type PointerType = MouseEvent | Touch | Partial<NativePointerEventType> | InteractEvent;
export declare type EventTypes = string | ListenerMap | Array<string | ListenerMap>;
export declare type Listener = (...args: any[]) => any;
export declare type Listeners = ListenerMap | ListenerMap[];
export declare type ListenersArg = Listener | ListenerMap | Array<Listener | ListenerMap>;
export interface ListenerMap {
    [index: string]: ListenersArg | ListenersArg[];
}
export declare type ArrayElementType<T> = T extends Array<infer P> ? P : never;
