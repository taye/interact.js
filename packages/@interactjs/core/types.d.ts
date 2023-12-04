import type Interaction from '@interactjs/core/Interaction';
import type { Interactable } from './Interactable';
import type { PhaseMap, InteractEvent } from './InteractEvent';
import type { NativePointerEvent as NativePointerEvent_ } from './NativeTypes';
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
    (this: Interactable, options?: Partial<OrBoolean<T>> | boolean): typeof this;
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
export type NativePointerEventType = typeof NativePointerEvent_;
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
