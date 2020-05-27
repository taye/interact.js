/* eslint-disable import/no-extraneous-dependencies */
import * as dropEvent from '@interactjs/actions/drop/DropEvent'
import * as gesture from '@interactjs/actions/gesture/plugin'
import * as resize from '@interactjs/actions/resize/plugin'
import * as iEvent from '@interactjs/core/InteractEvent'
import * as iable from '@interactjs/core/Interactable'
import * as iSet from '@interactjs/core/InteractableSet'
import * as interaction from '@interactjs/core/Interaction'
import * as defaults from '@interactjs/core/defaultOptions'
import * as iStatic from '@interactjs/core/interactStatic'
import * as scope from '@interactjs/core/scope'
import * as snap from '@interactjs/modifiers/snap/pointer'
import { PointerEvent as _PointerEvent } from '@interactjs/pointer-events/PointerEvent'

// import module augmentations
import '@interactjs/actions/drag/plugin'
import '@interactjs/actions/drop/plugin'
import '@interactjs/arrange/plugin'
import '@interactjs/auto-scroll/plugin'
import '@interactjs/auto-start/InteractableMethods'
import '@interactjs/auto-start/base'
import '@interactjs/auto-start/plugin'
import '@interactjs/core/events'
import '@interactjs/interact/index'
import '@interactjs/core/interactablePreventDefault'
import '@interactjs/core/interactions'
import '@interactjs/dev-tools/plugin'
import '@interactjs/inertia/plugin'
import '@interactjs/modifiers/plugin'
import '@interactjs/pointer-events/base'
import '@interactjs/pointer-events/interactableTargets'
import '@interactjs/reflow/plugin'
import '@interactjs/snappers/plugin'

import _NativePointerEventType from './NativePointerEventType'

export type OrBoolean<T> = {
  [P in keyof T]: T[P] | boolean;
}

export type Element = HTMLElement | SVGElement
export type Context = Document | Element
export type EventTarget = Window | Document | Element
export type Target = EventTarget | string
export type Plugin = scope.Plugin
export type Actions = scope.Actions
export type ActionProps<T extends scope.ActionName = any> = interaction.ActionProps<T>
export type Interactable = iable.Interactable
/** @internal */ export type InteractableSet = iSet.InteractableSet
export type Scope = scope.Scope
/** @interanal */ export type InteractStatic = iStatic.InteractStatic
export type Interaction<T extends scope.ActionName = any> = interaction.Interaction<T>
export type InteractionProxy<T extends scope.ActionName = any> = interaction.InteractionProxy<T>
export type PointerArgProps<T extends {} = {}> = interaction.PointerArgProps<T>
export type InteractEvent<
  T extends keyof scope.ActionMap = never,
  P extends iEvent.EventPhase = iEvent.EventPhase,
> = iEvent.InteractEvent<T, P>
export type EventPhase = iEvent.EventPhase
export type Options = defaults.Options
export type ActionName = scope.ActionName
export type SignalArgs = scope.SignalArgs
export type DoPhaseArg<T extends ActionName, P extends EventPhase> = interaction.DoPhaseArg<T, P>
export type DoAnyPhaseArg = interaction.DoAnyPhaseArg

export type DragEvent = InteractEvent<'drag'>
export type DropEvent = dropEvent.DropEvent
export type ResizeEvent = resize.ResizeEvent
export type GestureEvent = gesture.GestureEvent
export type PointerEvent<T extends string = any> = _PointerEvent<T>

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Rect {
  top: number
  left: number
  bottom: number
  right: number
  width?: number
  height?: number
}

export type FullRect = Required<Rect>

export type RectFunction<T extends any[]> = (...args: T) => Rect | Element

export type RectResolvable<T extends any[]> = Rect | string | Element | RectFunction<T>

export type Dimensions = Point & Size

export interface CoordsSetMember {
  page: Point
  client: Point
  timeStamp: number
}

export interface CoordsSet {
  cur: CoordsSetMember
  prev: CoordsSetMember
  start: CoordsSetMember
  delta: CoordsSetMember
  velocity: CoordsSetMember
}

export interface HasGetRect {
  getRect (element: Element): Rect
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

export interface EdgeOptions {
  top?: boolean | string | Element
  left?: boolean | string | Element
  bottom?: boolean | string | Element
  right?: boolean | string | Element
}

export type CursorChecker<T extends ActionName = any> =
  (action: ActionProps<T>, interactable: Interactable, element: Element, interacting: boolean) => string

export interface ActionMethod<T> {
  (this: Interactable): T
  // eslint-disable-next-line no-undef
  (this: Interactable, options: Partial<OrBoolean<T>> | boolean): typeof this
}

export interface OptionMethod<T> {
  (this: Interactable): T
  // eslint-disable-next-line no-undef
  (this: Interactable, options: T): typeof this
}

export type PerActionDefaults = defaults.PerActionDefaults
export type OptionsArg = defaults.OptionsArg

export interface DraggableOptions extends PerActionDefaults {
  startAxis?: 'x' | 'y' | 'xy'
  lockAxis?: 'x' | 'y' | 'xy' | 'start'
  oninertiastart?: ListenersArg
  onstart?: ListenersArg
  onmove?: ListenersArg
  onend?: ListenersArg
}

export interface DropzoneOptions extends PerActionDefaults {
  accept?: string | Element | (({ dropzone, draggableElement }: {
    dropzone: Interactable
    draggableElement: Element
  }) => boolean)
  // How the overlap is checked on the drop zone
  overlap?: 'pointer' | 'center' | number
  checker?: DropFunctionChecker

  ondropactivate?: ListenersArg
  ondropdeactivate?: ListenersArg
  ondragenter?: ListenersArg
  ondragleave?: ListenersArg
  ondropmove?: ListenersArg
  ondrop?: ListenersArg
}

export type DropFunctionChecker = (
  dragEvent: any, // related drag operation
  event: any, // touch or mouse EventEmitter
  dropped: boolean, // default checker result
  dropzone: Interactable, // dropzone interactable
  dropElement: Element, // drop zone element
  draggable: Interactable, // draggable's Interactable
  draggableElement: Element, // dragged element
) => boolean

export interface ResizableOptions extends PerActionDefaults {
  square?: boolean
  preserveAspectRatio?: boolean
  edges?: EdgeOptions | null
  axis?: 'x' | 'y' | 'xy' // deprecated
  invert?: 'none' | 'negate' | 'reposition'
  margin?: number
  squareResize?: boolean
  oninertiastart?: ListenersArg
  onstart?: ListenersArg
  onmove?: ListenersArg
  onend?: ListenersArg
}

export interface GesturableOptions extends PerActionDefaults {
  onstart?: ListenersArg
  onmove?: ListenersArg
  onend?: ListenersArg
}

export type ActionChecker = (
  pointerEvent: any,
  defaultAction: string,
  interactable: Interactable,
  element: Element,
  interaction: Interaction,
) => ActionProps

export type OriginFunction = (target: Element) => Rect
export type SnapFunction = snap.SnapFunction
export type SnapTarget = snap.SnapTarget

export interface PointerEventsOptions {
  holdDuration?: number
  allowFrom?: string
  ignoreFrom?: string
  origin?: Rect | Point | string | Element | OriginFunction
}

export type RectChecker = (element: Element)  => Rect

export type NativePointerEventType = typeof _NativePointerEventType
export type PointerEventType = MouseEvent | TouchEvent | NativePointerEventType | PointerEvent | InteractEvent
export type PointerType = MouseEvent | Touch | NativePointerEventType | PointerEvent | InteractEvent

export type EventTypes = string | ListenerMap | Array<(string | ListenerMap)>

export type Listener = (...args: any[]) => any
export type Listeners = ListenerMap | ListenerMap[]
export type ListenersArg = Listener | ListenerMap | Array<(Listener | ListenerMap)>
export interface ListenerMap {
  [index: string]: ListenersArg | ListenersArg[]
}

export type ArrayElementType<T> = T extends Array<infer P> ? P : never
