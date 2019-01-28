// Type definitions for interact.js
// Project: http://interactjs.io/
// Definitions by: Gaspard Bucher <feature-space.com>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

import Interactable from '@interactjs/core/Interactable';
import { Action } from '@interactjs/core/Interaction';

declare namespace Interact {
  type Target = Element | String

  interface Point {
    x: number
    y: number
  }

  interface SnapPosition {
    x: number
    y: number
    range?: number
  }

  interface Rect {
    top: number
    left: number
    bottom: number
    right: number
  }

  interface Rect2 {
    x: number
    y: number
    width: number
    height: number
  }

  interface Rect3 {
    width: number
    height: number
  }

  interface SnapFunction {
    ( x: number, y: number ) : SnapPosition
  }

  type SnapTarget = SnapPosition | SnapFunction
  type SnapOptions = {
    targets?: SnapTarget[]
    // target range
    range?: number
    // self points for snappin [0,0] = top-left, [1,1] = bottom righ
    relativePoints?: Point[]
    // startCoords = offset snapping from drag start page position
    offset?: Point | 'startCoords'
  }

  interface InertiaOption {
    resistance?: number
    minSpeed?: number
    endSpeed?: number
    allowResume?: boolean
    zeroResumeDelta?: boolean
    smoothEndDuration?: number
  }
  type InertiaOptions = InertiaOption | boolean

  interface AutoScrollOption {
    container?: DOMElement
    margin?: number
    distance?: number
    interval?: number
  }
  type AutoScrollOptions = AutoScrollOption | boolean

  type CSSSelector = string
  type DOMElement = any

  type RestrictOption = {
    // where to drag over
    restriction?: Rect | Rect2 | CSSSelector | DOMElement | 'self' | 'parent'
    // what part of self is allowed to drag over
    elementRect?: Rect
    // restrict just before the end drag
    endOnly?: boolean
  }

  interface RestrictSizeOption {
    min?: Rect3
    max?: Rect3
  }

  interface EdgeOptions {
    top?: boolean | CSSSelector | DOMElement
    left?: boolean | CSSSelector | DOMElement
    bottom?: boolean | CSSSelector | DOMElement
    right?: boolean | CSSSelector | DOMElement
  }

  interface CommonOptions {
    enabled?: boolean
    allowFrom?: string
    ignoreFrom?: string
    max?: number
    maxPerElement?: number
    manualStart?: boolean
    hold?: number
    snap?: SnapOptions
    restrict?: RestrictOption
    inertia?: InertiaOptions
    autoScroll?: AutoScrollOptions
    onstart?: Listeners
    onmove?: Listeners
    onend?: Listeners
  }

  interface DraggableOptions extends CommonOptions{
    axis?: 'x' | 'y'
    oninertiastart?: Listeners
  }

  interface ResizableOptions extends CommonOptions {
    snapSize?: SnapOptions
    restrictSize?: RestrictSizeOption
    square?: boolean
    edges?: EdgeOptions
    // deprecated
    axis?: 'x' | 'y'
    //
    invert?: 'none' | 'negate' | 'reposition'
    squareResize?: boolean
    oninertiastart?: Listeners
  }

  interface GesturableOptions extends CommonOptions {
  }

  interface Interaction {
    doMove () : void
    end ( event: PointerEvent ): void
    start ( action: Action ): any
    stop () : void
  }

  interface ActionChecker {
    ( pointerEvent: any
    , defaultAction: string
    , interactable: Interactable
    , element: DOMElement
    , interaction: Interaction
    ): Action }

  interface DropFunctionChecker {
    ( dragEvent: any // related drag operation
    , event: any // touch or mouse EventEmitter
    , dropped: boolean // default checker result
    , dropzone: Interactable // dropzone interactable
    , dropElement: DOMElement // drop zone element
    , draggable: Interactable // draggable's Interactable
    , draggableElement: DOMElement // dragged element
    ) : boolean
  }

  interface DropZoneOptions {
    accept?: CSSSelector
    // How the overlap is checked on the drop zone
    overlap?: 'pointer' | 'center' | number
    checker?: DropFunctionChecker

    ondropactivate?: Listeners
    ondropdeactivate?: Listeners
    ondragenter?: Listeners
    ondragleave?: Listeners
    ondropmove?: Listeners
    ondrop?: Listeners
  }

  interface OriginFunction {
    ( target: DOMElement ) : 'self' | 'parent' | Rect | Point | CSSSelector | DOMElement;
  }

  interface PointerEventsOptions {
    holdDuration?: number
    allowFrom?: string
    ignoreFrom?: string
    origin?: 'self' | 'parent' | Rect | Point | CSSSelector | DOMElement | OriginFunction;
  }

  interface RectChecker {
    ( element: Element ) : Partial<Rect & Rect3>
  }

  type PointerEventType = MouseEvent | TouchEvent | PointerEvent;
  type PointerType = MouseEvent | Touch | PointerEvent

  type EventTypes = String | String[] | {
    [index: string]: EventTypes | Listeners
  }

  type Listeners = Function | Function[]


  type OnEventName =
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

  interface OnEventFunctions {
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

  type OnEvent = OnEventName | OnEventName[]

  interface InteractOptions {
    context?: DOMElement
  }

  /*
  interface InteractStatic {
    ( el: DOMElement | CSSSelector, opts?: InteractOptions | any): Interactable
    maxInteractions () : number
    maxInteractions ( newValue: number) : InteractStatic
    off ( opt: OnEvent | OnEventFunctions, listener?: Listeners ) : InteractStatic
    on ( opt: OnEvent | OnEventFunctions, listener?: Listeners ) : InteractStatic
    supportsTouch () : boolean
    supportsPointerEvent () : boolean
    stop ( event: any ) : InteractStatic
    pointerMoveTolerance () : number
    pointerMoveTolerance ( tol: number ) : InteractStatic
    createSnapGrid ( grid: { x: number, y: number, range?: number, offset?: Point, limits?: Rect } ) : SnapFunction
    isSet ( element: DOMElement | CSSSelector ) : boolean
    addDocument ( document: Document, options: any ) : void
    removeDocument ( document: Document, options: any ) : void
    use ( plugin: Plugin) : InteractStatic;
  }
  */
}

export as namespace Interact;
export = Interact;
