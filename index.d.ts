// Type definitions for interact.js
// Project: http://interactjs.io/
// Definitions by: Gaspard Bucher <feature-space.com>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare namespace interact {
  interface Position {
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

  interface SnapFunction {
    ( x: number, y: number ) : SnapPosition
  }

  type SnapTarget = SnapPosition | SnapFunction
  type SnapOptions = {
    targets?: SnapTarget[]
    // target range
    range?: number
    // self points for snappin [0,0] = top-left, [1,1] = bottom righ
    relativePoints?: Position[]
    // startCoords = offset snapping from drag start page position
    offset?: Position | 'startCoords'
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

  interface EdgeOptions {
    top?: boolean | CSSSelector | DOMElement
    left?: boolean | CSSSelector | DOMElement
    bottom?: boolean | CSSSelector | DOMElement
    right?: boolean | CSSSelector | DOMElement
  }

  interface DraggableOptions {
    max?: number
    maxPerElement?: number
    manualStart?: boolean
    snap?: SnapOptions
    restrict?: RestrictOption;
    inertia?: InertiaOptions
    autoScroll?: AutoScrollOptions
    axis?: 'x' | 'y'
    onstart?: Listener
    onmove?: Listener
    oninertiastart?: Listener
    onend?: Listener
  }

  interface ResizableOptions {
    max?: number
    maxPerElement?: number
    manualStart?: boolean
    snap?: SnapOptions
    restrict?: RestrictOption;
    inertia?: InertiaOptions
    autoScroll?: AutoScrollOptions

    square?: boolean,
    edges?: EdgeOptions
    // deprecated
    axis?: 'x' | 'y'
    //
    invert?: 'none' | 'negate' | 'reposition'
    squareResize?: boolean
    onstart?: Listener
    onmove?: Listener
    oninertiastart?: Listener
    onend?: Listener
  }

  interface GesturableOptions {
    max?: Number,
    maxPerElement?: Number,
    manualStart?: Boolean,
    restrict?: RestrictOption
    onstart?: Listener
    onmove?: Listener
    onend?: Listener
  }

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

    ondropactivate?: Listener
    ondropdeactivate?: Listener
    ondragenter?: Listener
    ondragleave?: Listener
    ondropmove?: Listener
    ondrop?: Listener
  }

  interface InteractEvent {
    // For other things specific to each event (See W3C), use
    // event [ 'bubbles' ] instead of event.bubbles
    // on every touch/drag event
    type: string
    target: DOMElement
    relatedTarget: DOMElement
    currentTarget: DOMElement
    preventDefault ()
    pageX: number
    pageY: number
    clientX: number
    clientY: number
    screenX: number
    screenY: number
    button: number
    buttons: number
    ctrlKey: boolean
    shiftKey: boolean
    altKey: boolean
    metaKey: boolean
    // added by interact.js
    interactable: Interactable
    interaction: any
    x0: number
    y0: number
    clientX0: number
    clientY0: number
    dx: number
    dy: number
    velocityX: number
    velocityY: number
    speed: number
    timeStamp: any
    // drag
    dragEnter?: DOMElement
    dragLeave?: DOMElement
    // resize
    axes: Position
    // gestureend
    distance: number
    angle: number
    da: number // angle change
    scale: number // ratio of distance start to current event
    ds: number // scale change
    box: Rect // enclosing box of all points
  }

  interface Listener {
    ( e: InteractEvent ): void
  }

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
    dragstart?: Listener
    dragmove?: Listener
    draginertiastart?: Listener
    dragend?: Listener
    resizestart?: Listener
    resizemove?: Listener
    resizeinertiastart?: Listener
    resizeend?: Listener
    gesturestart?: Listener
    gesturemove?: Listener
    gestureend?: Listener
    // drop
    dropactivate?: Listener
    dropdeactivate?: Listener
    dragenter?: Listener
    dragleave?: Listener
    dropmove?: Listener
    drop?: Listener
    // pointer events
    down?: Listener
    move?: Listener
    up?: Listener
    cancel?: Listener
    tap?: Listener
    doubletap?: Listener
    hold?: Listener
  }

  type OnEvent = OnEventName | OnEventName[]

  interface Interactable {
    draggable ( opt: DraggableOptions ) : Interactable
    resizable ( opt: ResizableOptions ) : Interactable
    gesturable ( opt: GesturableOptions ) : Interactable
    dropzone ( opt: DropZoneOptions ) : Interactable
    on ( opt: OnEvent, listener?: Listener ) : Interactable
    on ( opt: OnEventFunctions ) : Interactable
    styleCursor ( yesno: boolean ) : Interactable
    createSnapGrid ( opt: { x: number, y: number, range: number, offset: Position } ) : SnapFunction
    test ( x : SnapFunction )
  }

  interface InteractOptions {
    context: DOMElement
  }

  interface InteractStatic {
    ( el: DOMElement | CSSSelector, opts?: InteractOptions ): Interactable
    on ( opt: OnEvent | OnEventFunctions, listener?: Listener ) : Interactable
    supportsTouch () : boolean
    supportsPointerEvent () : boolean
    stop ( event: any ) : InteractStatic
    pointerMoveTolerance ( tol?: number ) : number | InteractStatic
    // TODO
    isSet ( any ) : any
    off ( any ) : any
    debug ( any ) : any
    addDocument ( any ) : any
    removeDocument ( any ) : any
  }
}

declare var interact:interact.InteractStatic;
export as namespace interact;
export = interact;
