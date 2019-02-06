// Type definitions for interact.js
// Project: http://interactjs.io/
// Definitions by: Gaspard Bucher <feature-space.com>
//                  Taye Adeyemi <taye.me>

import * as actions from '@interactjs/actions'
import { BaseDefaults, Options as _Options, PerActionDefaults } from '@interactjs/core/defaultOptions'
import _Interactable from '@interactjs/core/Interactable'
import _InteractEvent, { EventPhase as _EventPhase } from '@interactjs/core/InteractEvent'
import _Interaction, { ActionProps as _ActionProps } from '@interactjs/core/Interaction'
import { ActionName as _ActionName } from '@interactjs/core/scope'
import interact, { Plugin as _Plugin } from '@interactjs/interact/interact'
import { SignalArg as _SignalArg } from '@interactjs/utils/Signals'

declare namespace Interact {
  type OrBoolean<T> = {
    [P in keyof T]: T[P] | boolean;
  }

  export type Target = Window | Document | Element | string
  export type interact = typeof interact
  export type Plugin = _Plugin
  export type ActionProps = _ActionProps
  export type Interactable = _Interactable
  export type Interaction<T extends _ActionName = any> = _Interaction<T>
  export type InteractEvent<
    T extends _ActionName = any,
    P extends _EventPhase = any,
  > = _InteractEvent<T, P>
  export type EventPhase = _EventPhase
  export type Options = _Options
  export type ActionName = _ActionName
  export type SignalArg = _SignalArg

  export type DragEvent = actions.DragEvent
  export type ResizeEvent = actions.ResizeEvent
  export type GestureEvent = actions.GestureEvent

  export interface Point {
    x: number
    y: number
    [index: string]: number
  }

  export interface SnapPosition {
    x: number
    y: number
    range?: number
  }

  export interface Rect {
    top: number
    left: number
    bottom: number
    right: number
    [index: string]: number
  }

  export interface Rect2 {
    x: number
    y: number
    width: number
    height: number
    [index: string]: number
  }

  export interface Rect3 {
    width: number
    height: number
    [index: string]: number
  }

  export type SnapFunction = (x: number, y: number) => SnapPosition

  export type SnapTarget = SnapPosition | SnapFunction
  export interface SnapOptions {
    targets?: SnapTarget[]
    // target range
    range?: number
    // self points for snappin [0,0] = top-left, [1,1] = bottom righ
    relativePoints?: Point[]
    // startCoords = offset snapping from drag start page position
    offset?: Point | 'startCoords'
  }

  export interface InertiaOption {
    resistance?: number
    minSpeed?: number
    endSpeed?: number
    allowResume?: boolean
    zeroResumeDelta?: boolean
    smoothEndDuration?: number
  }
  export type InertiaOptions = InertiaOption | boolean

  export interface AutoScrollOption {
    container?: DOMElement
    margin?: number
    distance?: number
    interval?: number
  }
  export type AutoScrollOptions = AutoScrollOption | boolean

  export type CSSSelector = string
  export type DOMElement = any

  export interface RestrictOption {
    // where to drag over
    restriction?: Rect | Rect2 | CSSSelector | DOMElement | 'self' | 'parent'
    // what part of self is allowed to drag over
    elementRect?: Rect
    // restrict just before the end drag
    endOnly?: boolean
  }

  export interface RestrictSizeOption {
    min?: Rect3
    max?: Rect3
  }

  export interface EdgeOptions {
    top?: boolean | CSSSelector | DOMElement
    left?: boolean | CSSSelector | DOMElement
    bottom?: boolean | CSSSelector | DOMElement
    right?: boolean | CSSSelector | DOMElement
    [key: string]: boolean | CSSSelector | DOMElement
  }

  export interface OptionsArg extends BaseDefaults, Interact.OrBoolean<PerActionDefaults> {}

  export interface DraggableOptions extends Options {
    axis?: 'x' | 'y'
    oninertiastart?: ListenersArg
  }

  export interface DropzoneOptions extends Options {
    accept?: string
    // How the overlap is checked on the drop zone
    overlap?: 'pointer' | 'center' | number
    checker?: DropFunctionChecker

    ondropactivate?: Interact.ListenersArg
    ondropdeactivate?: Interact.ListenersArg
    ondragenter?: Interact.ListenersArg
    ondragleave?: Interact.ListenersArg
    ondropmove?: Interact.ListenersArg
    ondrop?: Interact.ListenersArg
  }

  export type DropFunctionChecker = (
    dragEvent: any, // related drag operation
    event: any, // touch or mouse EventEmitter
    dropped: boolean, // default checker result
    dropzone: Interact.Interactable, // dropzone interactable
    dropElement: Element, // drop zone element
    draggable: Interact.Interactable, // draggable's Interactable
    draggableElement: Element, // dragged element
  ) => boolean

  export interface ResizableOptions extends Options {
    square?: boolean
    preserveAspectRatio?: boolean,
    edges?: EdgeOptions | null
    // deprecated
    axis?: 'x' | 'y' | 'xy'
    //
    invert?: 'none' | 'negate' | 'reposition'
    margin?: number,
    squareResize?: boolean
    oninertiastart?: ListenersArg
  }

  export type GesturableOptions = Options

  export type ActionChecker = (
    pointerEvent: any,
    defaultAction: string,
    interactable: Interactable,
    element: DOMElement,
    interaction: Interaction,
  ) => ActionProps

  export type OriginFunction = (target: DOMElement)  => 'self' | 'parent' | Rect | Point | CSSSelector | DOMElement

  export interface PointerEventsOptions {
    holdDuration?: number
    allowFrom?: string
    ignoreFrom?: string
    origin?: 'self' | 'parent' | Rect | Point | CSSSelector | DOMElement | OriginFunction
  }

  export type RectChecker = (element: Element)  => Partial<Rect & Rect3>

  export type PointerEventType = MouseEvent | TouchEvent | PointerEvent | InteractEvent
  export type PointerType = MouseEvent | Touch | PointerEvent | InteractEvent

  export type EventTypes = string | ListenerMap | Array<(string | ListenerMap)>

  export type Listener = (...args: any) => any
  export type Listeners = ListenerMap | ListenerMap[]
  export type ListenersArg = Listener | ListenerMap | Array<(Listener | ListenerMap)>
  export interface ListenerMap {
    [index: string]: ListenersArg | ListenersArg[]
  }

  export type OnEventName =
    'dragstart'
    | 'dragmove'
    | 'draginertiastart'
    | 'dragend'
    | 'resizestart'
    | 'resizemove'
    | 'resizeinertiastart'
    | 'resizeend'
    | 'gesturestart'
    | 'gesturemove'
    | 'gestureend'
    // drop
    | 'dropactivate'
    | 'dropdeactivate'
    | 'dragenter'
    | 'dragleave'
    | 'dropmove'
    | 'drop'
    // pointer events
    | 'down'
    | 'move'
    | 'up'
    | 'cancel'
    | 'tap'
    | 'doubletap'
    | 'hold'

  export interface OnEventFunctions {
    dragstart?: ListenersArg
    dragmove?: ListenersArg
    draginertiastart?: ListenersArg
    dragend?: ListenersArg
    resizestart?: ListenersArg
    resizemove?: ListenersArg
    resizeinertiastart?: ListenersArg
    resizeend?: ListenersArg
    gesturestart?: ListenersArg
    gesturemove?: ListenersArg
    gestureend?: ListenersArg
    // drop
    dropactivate?: ListenersArg
    dropdeactivate?: ListenersArg
    dragenter?: ListenersArg
    dragleave?: ListenersArg
    dropmove?: ListenersArg
    drop?: ListenersArg
    // pointer events
    down?: ListenersArg
    move?: ListenersArg
    up?: ListenersArg
    cancel?: ListenersArg
    tap?: ListenersArg
    doubletap?: ListenersArg
    hold?: ListenersArg
  }

  export type OnEvent = OnEventName | OnEventName[]

  export interface InteractOptions {
    context?: DOMElement
  }
}

export as namespace Interact
export = Interact
