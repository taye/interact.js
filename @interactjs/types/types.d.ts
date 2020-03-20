// Type definitions for interact.js
// Project: http://interactjs.io/
// Definitions by: Gaspard Bucher <feature-space.com>
//                  Taye Adeyemi <taye.me>

import * as drag from '@interactjs/actions/drag'
import * as drop from '@interactjs/actions/drop'
import * as gesture from '@interactjs/actions/gesture'
import * as resize from '@interactjs/actions/resize'
import * as arrange from '@interactjs/arrange'
import * as iEvent from '@interactjs/core/InteractEvent'
import _InteractStatic from '@interactjs/core/InteractStatic'
import _Interactable from '@interactjs/core/Interactable'
import _InteractableSet from '@interactjs/core/InteractableSet'
import * as interaction from '@interactjs/core/Interaction'
import * as defaults from '@interactjs/core/defaultOptions'
import * as scope from '@interactjs/core/scope'
import * as snap from '@interactjs/modifiers/snap/pointer'
import { PointerEvent as _PointerEvent } from '@interactjs/pointer-events/PointerEvent'

// import module augmentations
import '@interactjs/auto-scroll'
import '@interactjs/auto-start'
import '@interactjs/auto-start/InteractableMethods'
import '@interactjs/core/interactablePreventDefault'
import '@interactjs/dev-tools'
import '@interactjs/inertia'
import '@interactjs/core/interactions'
import '@interactjs/modifiers'
import '@interactjs/pointer-events/base'
import '@interactjs/pointer-events/interactableTargets'
import '@interactjs/reflow'
import '@interactjs/snappers'

import SymbolTree from '@interactjs/symbol-tree'
import _ElementState from '@interactjs/utils/ElementState'
import _NativePointerEventType from './NativePointerEventType'

declare namespace Interact {
  type OrBoolean<T> = {
    [P in keyof T]: T[P] | boolean;
  }

  export type Element = HTMLElement | SVGElement
  export type Context = Document | Element
  export type EventTarget = Window | Document | Element
  export type Target = Interact.EventTarget | string
  export type InteractStatic = _InteractStatic
  export type Plugin = scope.Plugin
  export type ActionProps<T extends scope.ActionName = any> = interaction.ActionProps<T>
  export type Interactable = _Interactable
  export type __InteractableSet = _InteractableSet
  export type Scope = scope.Scope
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

  export type RectFunction<T extends any[]> = (...args: T) => Interact.Rect | Element

  export type RectResolvable<T extends any[]> = Rect | string | Element | RectFunction<T>

  export type Dimensions = Point & Size

  export interface CoordsSetMember {
    page: Interact.Point
    client: Interact.Point
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
    getRect (element: Interact.Element): Interact.Rect
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
    (action: ActionProps, interactable: Interactable, element: Element, interacting: boolean) => string

  export interface ActionMethod<T> {
    (this: Interact.Interactable): T
    // eslint-disable-next-line no-undef
    (this: Interact.Interactable, options: Partial<Interact.OrBoolean<T>> | boolean): typeof this
  }

  export interface OptionMethod<T> {
    (this: Interact.Interactable): T
    // eslint-disable-next-line no-undef
    (this: Interact.Interactable, options: T): typeof this
  }

  export type PerActionDefaults = defaults.PerActionDefaults
  export type OptionsArg = defaults.OptionsArg

  export interface DraggableOptions extends PerActionDefaults {
    startAxis?: 'x' | 'y' | 'xy'
    lockAxis?: 'x' | 'y' | 'xy' | 'start'
    oninertiastart?: ListenersArg
    onstart?: Interact.ListenersArg
    onmove?: Interact.ListenersArg
    onend?: Interact.ListenersArg
  }

  export interface DropzoneOptions extends PerActionDefaults {
    accept?: string | Element | (({ dropzone, draggableElement }: {
      dropzone: Interact.Interactable
      draggableElement: Element
    }) => boolean)
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

  export interface ResizableOptions extends PerActionDefaults {
    square?: boolean
    preserveAspectRatio?: boolean
    edges?: EdgeOptions | null
    axis?: 'x' | 'y' | 'xy' // deprecated
    invert?: 'none' | 'negate' | 'reposition'
    margin?: number
    squareResize?: boolean
    oninertiastart?: ListenersArg
    onstart?: Interact.ListenersArg
    onmove?: Interact.ListenersArg
    onend?: Interact.ListenersArg
  }

  export interface GesturableOptions extends PerActionDefaults {
    onstart?: Interact.ListenersArg
    onmove?: Interact.ListenersArg
    onend?: Interact.ListenersArg
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

  type ArrayElementType<T> = T extends Array<infer P> ? P : never

  export type ElementState = _ElementState

  export namespace Arrange {
    export type Mode = arrange.ArrangeMode
    export type ArrangeEvent = arrange.ArrangeEvent

    export interface State {
      active: boolean
      mode: arrange.ArrangeMode
      relativePoint: Interact.Point
      ending: boolean
      tree: typeof SymbolTree
      startPos: Position
      prevPos: Position
      rejected: Position
      finalPos: Position
      prevSwap?: Swap
      prevDropzone?: drop.ActiveDrop
      draggableChild: ElementState
      feedbackChild: ElementState
      mirroring: boolean
      dropzones: drop.ActiveDrop[]
      updatePromise: PromiseLike<void>
      movedDuringDisplacement: boolean
    }

    export interface Position {
      dropzone: Interact.Interactable
      parent: Element
      index: number
    }

    export interface Swap {
      child: ElementState
      parent: Element
    }
  }
}

export as namespace Interact
export = Interact
