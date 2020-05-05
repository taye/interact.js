import * as gesture from '@interactjs/actions/gesture/plugin';
import * as resize from '@interactjs/actions/resize/plugin';
import * as iEvent from '@interactjs/core/InteractEvent';
import _Interactable from '@interactjs/core/Interactable';
import * as interaction from '@interactjs/core/Interaction';
import * as defaults from '@interactjs/core/defaultOptions';
import * as scope from '@interactjs/core/scope';
import * as snap from '@interactjs/modifiers/snap/pointer';
import { PointerEvent as _PointerEvent } from '@interactjs/pointer-events/PointerEvent';
import '@interactjs/actions/drag/plugin';
import '@interactjs/actions/drop/plugin';
import '@interactjs/arrange/plugin';
import '@interactjs/auto-scroll/plugin';
import '@interactjs/auto-start/InteractableMethods';
import '@interactjs/auto-start/base';
import '@interactjs/auto-start/plugin';
import '@interactjs/core/events';
import '@interactjs/core/interactablePreventDefault';
import '@interactjs/core/interactions';
import '@interactjs/dev-tools/plugin';
import '@interactjs/inertia/plugin';
import '@interactjs/modifiers/plugin';
import '@interactjs/pointer-events/base';
import '@interactjs/pointer-events/interactableTargets';
import '@interactjs/reflow/plugin';
import '@interactjs/snappers/plugin';
import _NativePointerEventType from './NativePointerEventType';
export declare type OrBoolean<T> = {
    [P in keyof T]: T[P] | boolean;
};
export declare type Element = HTMLElement | SVGElement;
export declare type Context = Document | Element;
export declare type EventTarget = Window | Document | Element;
export declare type Target = EventTarget | string;
export declare type Plugin = scope.Plugin;
export declare type ActionProps<T extends scope.ActionName = any> = interaction.ActionProps<T>;
export declare type Interactable = _Interactable;
export declare type Scope = scope.Scope;
export declare type Interaction<T extends scope.ActionName = any> = interaction.Interaction<T>;
export declare type InteractionProxy<T extends scope.ActionName = any> = interaction.InteractionProxy<T>;
export declare type PointerArgProps<T extends {} = {}> = interaction.PointerArgProps<T>;
export declare type InteractEvent<T extends keyof scope.ActionMap = never, P extends iEvent.EventPhase = iEvent.EventPhase> = iEvent.InteractEvent<T, P>;
export declare type EventPhase = iEvent.EventPhase;
export declare type Options = defaults.Options;
export declare type ActionName = scope.ActionName;
export declare type SignalArgs = scope.SignalArgs;
export declare type DoPhaseArg<T extends ActionName, P extends EventPhase> = interaction.DoPhaseArg<T, P>;
export declare type DoAnyPhaseArg = interaction.DoAnyPhaseArg;
export declare type DragEvent = InteractEvent<'drag'>;
export declare type ResizeEvent = resize.ResizeEvent;
export declare type GestureEvent = gesture.GestureEvent;
export declare type PointerEvent<T extends string = any> = _PointerEvent<T>;
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
export interface InertiaOption {
    resistance?: number;
    minSpeed?: number;
    endSpeed?: number;
    allowResume?: boolean;
    zeroResumeDelta?: boolean;
    smoothEndDuration?: number;
}
export declare type InertiaOptions = InertiaOption | boolean;
export interface EdgeOptions {
    top?: boolean | string | Element;
    left?: boolean | string | Element;
    bottom?: boolean | string | Element;
    right?: boolean | string | Element;
}
export declare type CursorChecker<T extends ActionName = any> = (action: ActionProps<T>, interactable: Interactable, element: Element, interacting: boolean) => string;
export interface ActionMethod<T> {
    (this: Interactable): T;
    (this: Interactable, options: Partial<OrBoolean<T>> | boolean): typeof this;
}
export interface OptionMethod<T> {
    (this: Interactable): T;
    (this: Interactable, options: T): typeof this;
}
export declare type PerActionDefaults = defaults.PerActionDefaults;
export declare type OptionsArg = defaults.OptionsArg;
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
export declare type DropFunctionChecker = (dragEvent: any, // related drag operation
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
export declare type ActionChecker = (pointerEvent: any, defaultAction: string, interactable: Interactable, element: Element, interaction: Interaction) => ActionProps;
export declare type OriginFunction = (target: Element) => Rect;
export declare type SnapFunction = snap.SnapFunction;
export declare type SnapTarget = snap.SnapTarget;
export interface PointerEventsOptions {
    holdDuration?: number;
    allowFrom?: string;
    ignoreFrom?: string;
    origin?: Rect | Point | string | Element | OriginFunction;
}
export declare type RectChecker = (element: Element) => Rect;
export declare type NativePointerEventType = typeof _NativePointerEventType;
export declare type PointerEventType = MouseEvent | TouchEvent | NativePointerEventType | PointerEvent | InteractEvent;
export declare type PointerType = MouseEvent | Touch | NativePointerEventType | PointerEvent | InteractEvent;
export declare type EventTypes = string | ListenerMap | Array<(string | ListenerMap)>;
export declare type Listener = (...args: any[]) => any;
export declare type Listeners = ListenerMap | ListenerMap[];
export declare type ListenersArg = Listener | ListenerMap | Array<(Listener | ListenerMap)>;
export interface ListenerMap {
    [index: string]: ListenersArg | ListenersArg[];
}
export declare type ArrayElementType<T> = T extends Array<infer P> ? P : never;
