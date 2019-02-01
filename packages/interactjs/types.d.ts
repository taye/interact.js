// Type definitions for interact.js
// Project: http://interactjs.io/
// Definitions by: Gaspard Bucher <feature-space.com>
//                  Taye Adeyemi <taye.me>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

import { Options as _Options } from '@interactjs/core/defaultOptions'
import _Interactable from '@interactjs/core/Interactable'
import _InteractEvent from '@interactjs/core/InteractEvent'
import _Interaction, { Action } from '@interactjs/core/Interaction'
import interact, { Plugin as _Plugin } from '@interactjs/interact/interact'

declare namespace Interact {
  export type Target = Window | Document | Element | string
  export type interact = typeof interact
  export type Plugin = _Plugin
  export type Interactable = _Interactable
  export type Interaction = _Interaction
  export type InteractEvent = _InteractEvent
  export type Options = _Options

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
    [key: string]: boolean | CSSSelector | DOMElement;
  }

  export type CommonOptions = Options

  export interface DraggableOptions extends Options {
    axis?: 'x' | 'y'
    oninertiastart?: Listeners
  }

  export interface DropzoneOptions extends Options {
    accept?: string
    // How the overlap is checked on the drop zone
    overlap?: 'pointer' | 'center' | number
    checker?: DropFunctionChecker

    ondropactivate?: Interact.Listeners
    ondropdeactivate?: Interact.Listeners
    ondragenter?: Interact.Listeners
    ondragleave?: Interact.Listeners
    ondropmove?: Interact.Listeners
    ondrop?: Interact.Listeners
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
    preserveAspectRatio: boolean,
    edges?: EdgeOptions | null
    // deprecated
    axis?: 'x' | 'y' | 'xy'
    //
    invert?: 'none' | 'negate' | 'reposition'
    margin: number,
    squareResize?: boolean
    oninertiastart?: Listeners
  }

  export type GesturableOptions = Options

  export type ActionChecker = (
    pointerEvent: any,
    defaultAction: string,
    interactable: Interactable,
    element: DOMElement,
    interaction: Interaction,
  ) => Action

  export type OriginFunction = (target: DOMElement)  => 'self' | 'parent' | Rect | Point | CSSSelector | DOMElement

  export interface PointerEventsOptions {
    holdDuration?: number
    allowFrom?: string
    ignoreFrom?: string
    origin?: 'self' | 'parent' | Rect | Point | CSSSelector | DOMElement | OriginFunction
  }

  export type RectChecker = (element: Element)  => Partial<Rect & Rect3>

  export type PointerEventType = MouseEvent | TouchEvent | PointerEvent
  export type PointerType = MouseEvent | Touch | PointerEvent

  export type EventTypes = string | string[] | {
    [index: string]: EventTypes | Listeners
  }

  export type Listener = (...args: any) => any
  export type Listeners = Listener | Listener[]

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
    dragstart?: Listeners
    dragmove?: Listeners
    draginertiastart?: Listeners
    dragend?: Listeners
    resizestart?: Listeners
    resizemove?: Listeners
    resizeinertiastart?: Listeners
    resizeend?: Listeners
    gesturestart?: Listeners
    gesturemove?: Listeners
    gestureend?: Listeners
    // drop
    dropactivate?: Listeners
    dropdeactivate?: Listeners
    dragenter?: Listeners
    dragleave?: Listeners
    dropmove?: Listeners
    drop?: Listeners
    // pointer events
    down?: Listeners
    move?: Listeners
    up?: Listeners
    cancel?: Listeners
    tap?: Listeners
    doubletap?: Listeners
    hold?: Listeners
  }

  export type OnEvent = OnEventName | OnEventName[]

  export interface InteractOptions {
    context?: DOMElement
  }
}

export as namespace Interact
export = Interact
