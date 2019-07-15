// Type definitions for interact.js
// Project: http://interactjs.io/
// Definitions by: Gaspard Bucher <feature-space.com>
//                  Taye Adeyemi <taye.me>

import * as actions from '@interactjs/actions'
import * as defaults from '@interactjs/core/defaultOptions'
import _Interactable from '@interactjs/core/Interactable'
import _InteractableSet from '@interactjs/core/InteractableSet'
import * as iEvent from '@interactjs/core/InteractEvent'
import * as interaction from '@interactjs/core/Interaction'
import * as scope from '@interactjs/core/scope'
import interact from '@interactjs/interact/interact'
import * as signals from '@interactjs/utils/Signals'

declare namespace Interact {
  type OrBoolean<T> = {
    [P in keyof T]: T[P] | boolean;
  }

  export type EventTarget = Window | Document | Element
  export type Target = Interact.EventTarget | string
  export type interact = typeof interact
  export type Plugin = scope.Plugin
  export type ActionProps<T extends ActionName = any> = interaction.ActionProps<T>
  export type Interactable = _Interactable
  export type __InteractableSet = _InteractableSet
  export type Scope = scope.Scope
  export type Interaction<T extends scope.ActionName = any> = interaction.Interaction<T>
  export type InteractEvent<
    T extends scope.ActionName = any,
    P extends iEvent.EventPhase = any,
  > = iEvent.InteractEvent<T, P>
  export type EventPhase = iEvent.EventPhase
  export type Options = defaults.Options
  export type ActionName = scope.ActionName
  export type SignalArg<T extends scope.ActionName = any> = signals.SignalArg<T>
  export type SignalListener = signals.SignalListener

  export type DragEvent = actions.DragEvent
  export type ResizeEvent = actions.ResizeEvent
  export type GestureEvent = actions.GestureEvent

  export interface Point {
    x: number
    y: number
    [index: string]: number
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
    (action: ActionProps, interactable: Interactable, element: Element) => string

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

  export interface OptionsArg extends defaults.BaseDefaults, Interact.OrBoolean<defaults.PerActionDefaults> {}

  export interface DraggableOptions extends Options {
    startAxis?: 'x' | 'y' | 'xy'
    lockAxis?: 'x' | 'y' | 'xy' | 'start'
    cursorChecker?: Interact.CursorChecker
    oninertiastart?: ListenersArg
    onstart?: Interact.ListenersArg
    onmove?: Interact.ListenersArg
    onend?: Interact.ListenersArg
  }

  export interface DropzoneOptions extends Options {
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

  export interface ResizableOptions extends Options {
    square?: boolean
    preserveAspectRatio?: boolean
    edges?: EdgeOptions | null
    axis?: 'x' | 'y' | 'xy' // deprecated
    invert?: 'none' | 'negate' | 'reposition'
    margin?: number
    squareResize?: boolean
    cursorChecker?: Interact.CursorChecker
    oninertiastart?: ListenersArg
    onstart?: Interact.ListenersArg
    onmove?: Interact.ListenersArg
    onend?: Interact.ListenersArg
  }

  export interface GesturableOptions extends Options {
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

  export interface PointerEventsOptions {
    holdDuration?: number
    allowFrom?: string
    ignoreFrom?: string
    origin?: Rect | Point | string | Element | OriginFunction
  }

  export type RectChecker = (element: Element)  => Rect

  export type PointerEventType = MouseEvent | TouchEvent | PointerEvent | InteractEvent
  export type PointerType = MouseEvent | Touch | PointerEvent | InteractEvent

  export type EventTypes = string | ListenerMap | Array<(string | ListenerMap)>

  export type Listener = (...args: any) => any
  export type Listeners = ListenerMap | ListenerMap[]
  export type ListenersArg = Listener | ListenerMap | Array<(Listener | ListenerMap)>
  export interface ListenerMap {
    [index: string]: ListenersArg | ListenersArg[]
  }
}

export as namespace Interact
export = Interact
