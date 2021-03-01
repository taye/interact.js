import type { EventPhase, InteractEvent } from '@interactjs/core/InteractEvent'
import type { Interactable } from '@interactjs/core/Interactable'
import type { Interaction, DoPhaseArg } from '@interactjs/core/Interaction'
import type { Scope, Plugin } from '@interactjs/core/scope'
import type { DropzoneOptions, Element, PointerEventType, Rect } from '@interactjs/types/index'
import * as domUtils from '@interactjs/utils/domUtils'
import extend from '@interactjs/utils/extend'
import getOriginXY from '@interactjs/utils/getOriginXY'
import is from '@interactjs/utils/is'
import normalizeListeners from '@interactjs/utils/normalizeListeners'
import * as pointerUtils from '@interactjs/utils/pointerUtils'

import type { DragEvent } from '../drag/plugin'
import drag from '../drag/plugin'

import { DropEvent } from './DropEvent'

export interface DropzoneMethod {
  (this: Interactable, options: DropzoneOptions | boolean): Interactable
  (): DropzoneOptions
}

declare module '@interactjs/core/Interactable' {
  interface Interactable {
    dropzone: DropzoneMethod
    dropCheck: (
      dragEvent: InteractEvent,
      event: PointerEventType,
      draggable: Interactable,
      draggableElement: Element,
      dropElemen: Element,
      rect: any,
    ) => boolean
  }
}

declare module '@interactjs/core/Interaction' {
  interface Interaction {
    dropState?: DropState
  }
}

declare module '@interactjs/core/InteractEvent' {
  interface InteractEvent {
    prevDropzone?: Interactable
    dropzone?: Interactable
    dragEnter?: Element
    dragLeave?: Element
  }
}

declare module '@interactjs/core/options' {
  interface ActionDefaults {
    drop: DropzoneOptions
  }
}

declare module '@interactjs/core/scope' {
  interface ActionMap {
    drop?: typeof drop
  }

  interface Scope {
    dynamicDrop?: boolean
  }

  interface SignalArgs {
    'actions/drop:start': DropSignalArg
    'actions/drop:move': DropSignalArg
    'actions/drop:end': DropSignalArg
  }
}

declare module '@interactjs/core/InteractStatic' {
  interface InteractStatic {
    dynamicDrop: (this: InteractStatic, newValue?: boolean) => boolean | this
  }
}

interface DropSignalArg {
  interaction: Interaction<'drag'>
  dragEvent: DragEvent
}

export interface ActiveDrop {
  dropzone: Interactable
  element: Element
  rect: Rect
}

export interface DropState {
  cur: {
    // the dropzone a drag target might be dropped into
    dropzone: Interactable
    // the element at the time of checking
    element: Element
  }
  prev: {
    // the dropzone that was recently dragged away from
    dropzone: Interactable
    // the element at the time of checking
    element: Element
  }
  // wheather the potential drop was rejected from a listener
  rejected: boolean
  // the drop events related to the current drag event
  events: FiredDropEvents
  activeDrops: ActiveDrop[]
}

function install (scope: Scope) {
  const {
    actions,
    /** @lends module:interact */
    interactStatic: interact,
    /** @lends Interactable */
    Interactable,
    defaults,
  } = scope

  scope.usePlugin(drag)

  /**
   *
   * ```js
   * interact('.drop').dropzone({
   *   accept: '.can-drop' || document.getElementById('single-drop'),
   *   overlap: 'pointer' || 'center' || zeroToOne
   * }
   * ```
   *
   * Returns or sets whether draggables can be dropped onto this target to
   * trigger drop events
   *
   * Dropzones can receive the following events:
   *  - `dropactivate` and `dropdeactivate` when an acceptable drag starts and ends
   *  - `dragenter` and `dragleave` when a draggable enters and leaves the dropzone
   *  - `dragmove` when a draggable that has entered the dropzone is moved
   *  - `drop` when a draggable is dropped into this dropzone
   *
   * Use the `accept` option to allow only elements that match the given CSS
   * selector or element. The value can be:
   *
   *  - **an Element** - only that element can be dropped into this dropzone.
   *  - **a string**, - the element being dragged must match it as a CSS selector.
   *  - **`null`** - accept options is cleared - it accepts any element.
   *
   * Use the `overlap` option to set how drops are checked for. The allowed
   * values are:
   *
   *   - `'pointer'`, the pointer must be over the dropzone (default)
   *   - `'center'`, the draggable element's center must be over the dropzone
   *   - a number from 0-1 which is the `(intersection area) / (draggable area)`.
   *   e.g. `0.5` for drop to happen when half of the area of the draggable is
   *   over the dropzone
   *
   * Use the `checker` option to specify a function to check if a dragged element
   * is over this Interactable.
   *
   * @param {boolean | object | null} [options] The new options to be set.
   * @return {object | Interactable} The current setting or this Interactable
   */
  Interactable.prototype.dropzone = function (this: Interactable, options?: DropzoneOptions | boolean) {
    return dropzoneMethod(this, options)
  } as Interactable['dropzone']

  /**
   * ```js
   * interact(target)
   * .dropChecker(function(dragEvent,         // related dragmove or dragend event
   *                       event,             // TouchEvent/PointerEvent/MouseEvent
   *                       dropped,           // bool result of the default checker
   *                       dropzone,          // dropzone Interactable
   *                       dropElement,       // dropzone elemnt
   *                       draggable,         // draggable Interactable
   *                       draggableElement) {// draggable element
   *
   *   return dropped && event.target.hasAttribute('allow-drop')
   * }
   * ```
   */
  Interactable.prototype.dropCheck = function (
    this: Interactable,
    dragEvent,
    event,
    draggable,
    draggableElement,
    dropElement,
    rect,
  ) {
    return dropCheckMethod(this, dragEvent, event, draggable, draggableElement, dropElement, rect)
  }

  /**
   * Returns or sets whether the dimensions of dropzone elements are calculated
   * on every dragmove or only on dragstart for the default dropChecker
   *
   * @param {boolean} [newValue] True to check on each move. False to check only
   * before start
   * @return {boolean | interact} The current setting or interact
   */
  interact.dynamicDrop = function (newValue?: boolean) {
    if (is.bool(newValue)) {
      // if (dragging && scope.dynamicDrop !== newValue && !newValue) {
      //  calcRects(dropzones)
      // }

      scope.dynamicDrop = newValue

      return interact
    }
    return scope.dynamicDrop
  }

  extend(actions.phaselessTypes, {
    dragenter: true,
    dragleave: true,
    dropactivate: true,
    dropdeactivate: true,
    dropmove: true,
    drop: true,
  })
  actions.methodDict.drop = 'dropzone'

  scope.dynamicDrop = false

  defaults.actions.drop = drop.defaults
}

function collectDrops ({ interactables }: Scope, draggableElement: Element) {
  const drops: ActiveDrop[] = []

  // collect all dropzones and their elements which qualify for a drop
  for (const dropzone of interactables.list) {
    if (!dropzone.options.drop.enabled) {
      continue
    }

    const accept = dropzone.options.drop.accept

    // test the draggable draggableElement against the dropzone's accept setting
    if (
      (is.element(accept) && accept !== draggableElement) ||
      (is.string(accept) && !domUtils.matchesSelector(draggableElement, accept)) ||
      (is.func(accept) && !accept({ dropzone, draggableElement }))
    ) {
      continue
    }

    // query for new elements if necessary
    const dropElements = (is.string(dropzone.target)
      ? dropzone._context.querySelectorAll(dropzone.target)
      : is.array(dropzone.target)
        ? dropzone.target
        : [dropzone.target]) as Element[]

    for (const dropzoneElement of dropElements) {
      if (dropzoneElement !== draggableElement) {
        drops.push({
          dropzone,
          element: dropzoneElement,
          rect: dropzone.getRect(dropzoneElement),
        })
      }
    }
  }

  return drops
}

function fireActivationEvents (activeDrops: ActiveDrop[], event: DropEvent) {
  // loop through all active dropzones and trigger event
  for (const { dropzone, element } of activeDrops.slice()) {
    event.dropzone = dropzone

    // set current element as event target
    event.target = element
    dropzone.fire(event)
    event.propagationStopped = event.immediatePropagationStopped = false
  }
}

// return a new array of possible drops. getActiveDrops should always be
// called when a drag has just started or a drag event happens while
// dynamicDrop is true
function getActiveDrops (scope: Scope, dragElement: Element) {
  // get dropzones and their elements that could receive the draggable
  const activeDrops = collectDrops(scope, dragElement)

  for (const activeDrop of activeDrops) {
    activeDrop.rect = activeDrop.dropzone.getRect(activeDrop.element)
  }

  return activeDrops
}

function getDrop (
  { dropState, interactable: draggable, element: dragElement }: Partial<Interaction>,
  dragEvent,
  pointerEvent,
) {
  const validDrops = []

  // collect all dropzones and their elements which qualify for a drop
  for (const { dropzone, element: dropzoneElement, rect } of dropState.activeDrops) {
    validDrops.push(
      dropzone.dropCheck(dragEvent, pointerEvent, draggable, dragElement, dropzoneElement, rect)
        ? dropzoneElement
        : null,
    )
  }

  // get the most appropriate dropzone based on DOM depth and order
  const dropIndex = domUtils.indexOfDeepestElement(validDrops)

  return dropState.activeDrops[dropIndex] || null
}

function getDropEvents (interaction: Interaction, _pointerEvent, dragEvent: DragEvent) {
  const { dropState } = interaction
  const dropEvents = {
    enter: null,
    leave: null,
    activate: null,
    deactivate: null,
    move: null,
    drop: null,
  }

  if (dragEvent.type === 'dragstart') {
    dropEvents.activate = new DropEvent(dropState, dragEvent, 'dropactivate')

    dropEvents.activate.target = null
    dropEvents.activate.dropzone = null
  }
  if (dragEvent.type === 'dragend') {
    dropEvents.deactivate = new DropEvent(dropState, dragEvent, 'dropdeactivate')

    dropEvents.deactivate.target = null
    dropEvents.deactivate.dropzone = null
  }

  if (dropState.rejected) {
    return dropEvents
  }

  if (dropState.cur.element !== dropState.prev.element) {
    // if there was a previous dropzone, create a dragleave event
    if (dropState.prev.dropzone) {
      dropEvents.leave = new DropEvent(dropState, dragEvent, 'dragleave')

      dragEvent.dragLeave = dropEvents.leave.target = dropState.prev.element
      dragEvent.prevDropzone = dropEvents.leave.dropzone = dropState.prev.dropzone
    }
    // if dropzone is not null, create a dragenter event
    if (dropState.cur.dropzone) {
      dropEvents.enter = new DropEvent(dropState, dragEvent, 'dragenter')

      dragEvent.dragEnter = dropState.cur.element
      dragEvent.dropzone = dropState.cur.dropzone
    }
  }

  if (dragEvent.type === 'dragend' && dropState.cur.dropzone) {
    dropEvents.drop = new DropEvent(dropState, dragEvent, 'drop')

    dragEvent.dropzone = dropState.cur.dropzone
    dragEvent.relatedTarget = dropState.cur.element
  }
  if (dragEvent.type === 'dragmove' && dropState.cur.dropzone) {
    dropEvents.move = new DropEvent(dropState, dragEvent, 'dropmove')

    dropEvents.move.dragmove = dragEvent
    dragEvent.dropzone = dropState.cur.dropzone
  }

  return dropEvents
}

type FiredDropEvents = Partial<
Record<'leave' | 'enter' | 'move' | 'drop' | 'activate' | 'deactivate', DropEvent>
>

function fireDropEvents (interaction: Interaction, events: FiredDropEvents) {
  const { dropState } = interaction
  const { activeDrops, cur, prev } = dropState

  if (events.leave) {
    prev.dropzone.fire(events.leave)
  }
  if (events.enter) {
    cur.dropzone.fire(events.enter)
  }
  if (events.move) {
    cur.dropzone.fire(events.move)
  }
  if (events.drop) {
    cur.dropzone.fire(events.drop)
  }

  if (events.deactivate) {
    fireActivationEvents(activeDrops, events.deactivate)
  }

  dropState.prev.dropzone = cur.dropzone
  dropState.prev.element = cur.element
}

function onEventCreated ({ interaction, iEvent, event }: DoPhaseArg<'drag', EventPhase>, scope: Scope) {
  if (iEvent.type !== 'dragmove' && iEvent.type !== 'dragend') {
    return
  }

  const { dropState } = interaction

  if (scope.dynamicDrop) {
    dropState.activeDrops = getActiveDrops(scope, interaction.element)
  }

  const dragEvent = iEvent
  const dropResult = getDrop(interaction, dragEvent, event)

  // update rejected status
  dropState.rejected =
    dropState.rejected &&
    !!dropResult &&
    dropResult.dropzone === dropState.cur.dropzone &&
    dropResult.element === dropState.cur.element

  dropState.cur.dropzone = dropResult && dropResult.dropzone
  dropState.cur.element = dropResult && dropResult.element

  dropState.events = getDropEvents(interaction, event, dragEvent)
}

function dropzoneMethod(interactable: Interactable): DropzoneOptions
function dropzoneMethod(interactable: Interactable, options: DropzoneOptions | boolean): Interactable
function dropzoneMethod (interactable: Interactable, options?: DropzoneOptions | boolean) {
  if (is.object(options)) {
    interactable.options.drop.enabled = options.enabled !== false

    if (options.listeners) {
      const normalized = normalizeListeners(options.listeners)
      // rename 'drop' to '' as it will be prefixed with 'drop'
      const corrected = Object.keys(normalized).reduce((acc, type) => {
        const correctedType = /^(enter|leave)/.test(type)
          ? `drag${type}`
          : /^(activate|deactivate|move)/.test(type)
            ? `drop${type}`
            : type

        acc[correctedType] = normalized[type]

        return acc
      }, {})

      interactable.off(interactable.options.drop.listeners)
      interactable.on(corrected)
      interactable.options.drop.listeners = corrected
    }

    if (is.func(options.ondrop)) {
      interactable.on('drop', options.ondrop)
    }
    if (is.func(options.ondropactivate)) {
      interactable.on('dropactivate', options.ondropactivate)
    }
    if (is.func(options.ondropdeactivate)) {
      interactable.on('dropdeactivate', options.ondropdeactivate)
    }
    if (is.func(options.ondragenter)) {
      interactable.on('dragenter', options.ondragenter)
    }
    if (is.func(options.ondragleave)) {
      interactable.on('dragleave', options.ondragleave)
    }
    if (is.func(options.ondropmove)) {
      interactable.on('dropmove', options.ondropmove)
    }

    if (/^(pointer|center)$/.test(options.overlap as string)) {
      interactable.options.drop.overlap = options.overlap
    } else if (is.number(options.overlap)) {
      interactable.options.drop.overlap = Math.max(Math.min(1, options.overlap), 0)
    }
    if ('accept' in options) {
      interactable.options.drop.accept = options.accept
    }
    if ('checker' in options) {
      interactable.options.drop.checker = options.checker
    }

    return interactable
  }

  if (is.bool(options)) {
    interactable.options.drop.enabled = options

    return interactable
  }

  return interactable.options.drop
}

function dropCheckMethod (
  interactable: Interactable,
  dragEvent: InteractEvent,
  event: PointerEventType,
  draggable: Interactable,
  draggableElement: Element,
  dropElement: Element,
  rect: any,
) {
  let dropped = false

  // if the dropzone has no rect (eg. display: none)
  // call the custom dropChecker or just return false
  if (!(rect = rect || interactable.getRect(dropElement))) {
    return interactable.options.drop.checker
      ? interactable.options.drop.checker(
        dragEvent,
        event,
        dropped,
        interactable,
        dropElement,
        draggable,
        draggableElement,
      )
      : false
  }

  const dropOverlap = interactable.options.drop.overlap

  if (dropOverlap === 'pointer') {
    const origin = getOriginXY(draggable, draggableElement, 'drag')
    const page = pointerUtils.getPageXY(dragEvent)

    page.x += origin.x
    page.y += origin.y

    const horizontal = page.x > rect.left && page.x < rect.right
    const vertical = page.y > rect.top && page.y < rect.bottom

    dropped = horizontal && vertical
  }

  const dragRect = draggable.getRect(draggableElement)

  if (dragRect && dropOverlap === 'center') {
    const cx = dragRect.left + dragRect.width / 2
    const cy = dragRect.top + dragRect.height / 2

    dropped = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom
  }

  if (dragRect && is.number(dropOverlap)) {
    const overlapArea =
      Math.max(0, Math.min(rect.right, dragRect.right) - Math.max(rect.left, dragRect.left)) *
      Math.max(0, Math.min(rect.bottom, dragRect.bottom) - Math.max(rect.top, dragRect.top))

    const overlapRatio = overlapArea / (dragRect.width * dragRect.height)

    dropped = overlapRatio >= dropOverlap
  }

  if (interactable.options.drop.checker) {
    dropped = interactable.options.drop.checker(
      dragEvent,
      event,
      dropped,
      interactable,
      dropElement,
      draggable,
      draggableElement,
    )
  }

  return dropped
}

const drop: Plugin = {
  id: 'actions/drop',
  install,
  listeners: {
    'interactions:before-action-start': ({ interaction }) => {
      if (interaction.prepared.name !== 'drag') {
        return
      }

      interaction.dropState = {
        cur: {
          dropzone: null,
          element: null,
        },
        prev: {
          dropzone: null,
          element: null,
        },
        rejected: null,
        events: null,
        activeDrops: [],
      }
    },

    'interactions:after-action-start': (
      { interaction, event, iEvent: dragEvent }: DoPhaseArg<'drag', EventPhase>,
      scope,
    ) => {
      if (interaction.prepared.name !== 'drag') {
        return
      }

      const { dropState } = interaction

      // reset active dropzones
      dropState.activeDrops = null
      dropState.events = null
      dropState.activeDrops = getActiveDrops(scope, interaction.element)
      dropState.events = getDropEvents(interaction, event, dragEvent)

      if (dropState.events.activate) {
        fireActivationEvents(dropState.activeDrops, dropState.events.activate)
        scope.fire('actions/drop:start', { interaction, dragEvent })
      }
    },

    'interactions:action-move': onEventCreated,

    'interactions:after-action-move': (
      { interaction, iEvent: dragEvent }: DoPhaseArg<'drag', EventPhase>,
      scope,
    ) => {
      if (interaction.prepared.name !== 'drag') {
        return
      }

      fireDropEvents(interaction, interaction.dropState.events)

      scope.fire('actions/drop:move', { interaction, dragEvent })
      interaction.dropState.events = {}
    },

    'interactions:action-end': (arg: DoPhaseArg<'drag', EventPhase>, scope) => {
      if (arg.interaction.prepared.name !== 'drag') {
        return
      }

      const { interaction, iEvent: dragEvent } = arg

      onEventCreated(arg, scope)
      fireDropEvents(interaction, interaction.dropState.events)
      scope.fire('actions/drop:end', { interaction, dragEvent })
    },

    'interactions:stop': ({ interaction }) => {
      if (interaction.prepared.name !== 'drag') {
        return
      }

      const { dropState } = interaction

      if (dropState) {
        dropState.activeDrops = null
        dropState.events = null
        dropState.cur.dropzone = null
        dropState.cur.element = null
        dropState.prev.dropzone = null
        dropState.prev.element = null
        dropState.rejected = false
      }
    },
  },
  getActiveDrops,
  getDrop,
  getDropEvents,
  fireDropEvents,
  defaults: {
    enabled: false,
    accept: null,
    overlap: 'pointer',
  } as DropzoneOptions,
}

export default drop
