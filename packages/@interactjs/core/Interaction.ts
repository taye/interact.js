import type { ActionDefaults } from '@interactjs/core/options'
import type {
  Element,
  EdgeOptions,
  PointerEventType,
  PointerType,
  FullRect,
  CoordsSet,
} from '@interactjs/types/index'
import * as arr from '@interactjs/utils/arr'
import extend from '@interactjs/utils/extend'
import hypot from '@interactjs/utils/hypot'
import { warnOnce, copyAction } from '@interactjs/utils/misc'
import * as pointerUtils from '@interactjs/utils/pointerUtils'
import * as rectUtils from '@interactjs/utils/rect'

import type { EventPhase } from './InteractEvent'
import { InteractEvent } from './InteractEvent'
import type { Interactable } from './Interactable'
import { PointerInfo } from './PointerInfo'
import type { ActionName, Scope } from './scope'

export interface ActionProps<T extends ActionName | null = never> {
  name: T
  axis?: 'x' | 'y' | 'xy' | null
  edges?: EdgeOptions | null
}

export enum _ProxyValues {
  interactable = '',
  element = '',
  prepared = '',
  pointerIsDown = '',
  pointerWasMoved = '',
  _proxy = '',
}

export enum _ProxyMethods {
  start = '',
  move = '',
  end = '',
  stop = '',
  interacting = '',
}

export type PointerArgProps<T extends {} = {}> = {
  pointer: PointerType
  event: PointerEventType
  eventTarget: Node
  pointerIndex: number
  pointerInfo: PointerInfo
  interaction: Interaction<never>
} & T

export interface DoPhaseArg<T extends ActionName, P extends EventPhase> {
  event: PointerEventType
  phase: EventPhase
  interaction: Interaction<T>
  iEvent: InteractEvent<T, P>
  preEnd?: boolean
  type?: string
}

export type DoAnyPhaseArg = DoPhaseArg<ActionName, EventPhase>

declare module '@interactjs/core/scope' {
  interface SignalArgs {
    'interactions:new': { interaction: Interaction<ActionName> }
    'interactions:down': PointerArgProps<{
      type: 'down'
    }>
    'interactions:move': PointerArgProps<{
      type: 'move'
      dx: number
      dy: number
      duplicate: boolean
    }>
    'interactions:up': PointerArgProps<{
      type: 'up'
      curEventTarget: EventTarget
    }>
    'interactions:cancel': SignalArgs['interactions:up'] & {
      type: 'cancel'
      curEventTarget: EventTarget
    }
    'interactions:update-pointer': PointerArgProps<{
      down: boolean
    }>
    'interactions:remove-pointer': PointerArgProps
    'interactions:blur': { interaction: Interaction<never>, event: Event, type: 'blur' }
    'interactions:before-action-start': Omit<DoAnyPhaseArg, 'iEvent'>
    'interactions:action-start': DoAnyPhaseArg
    'interactions:after-action-start': DoAnyPhaseArg
    'interactions:before-action-move': Omit<DoAnyPhaseArg, 'iEvent'>
    'interactions:action-move': DoAnyPhaseArg
    'interactions:after-action-move': DoAnyPhaseArg
    'interactions:before-action-end': Omit<DoAnyPhaseArg, 'iEvent'>
    'interactions:action-end': DoAnyPhaseArg
    'interactions:after-action-end': DoAnyPhaseArg
    'interactions:stop': { interaction: Interaction }
  }
}

export type InteractionProxy<T extends ActionName | null = never> = Pick<
Interaction<T>,
keyof typeof _ProxyValues | keyof typeof _ProxyMethods
>

let idCounter = 0

export class Interaction<T extends ActionName | null = ActionName> {
  // current interactable being interacted with
  interactable: Interactable = null

  // the target element of the interactable
  element: Element = null
  rect: FullRect
  _rects?: {
    start: FullRect
    corrected: FullRect
    previous: FullRect
    delta: FullRect
  }
  edges: EdgeOptions

  _scopeFire: Scope['fire']

  // action that's ready to be fired on next move event
  prepared: ActionProps<T> = {
    name: null,
    axis: null,
    edges: null,
  }

  pointerType: string

  // keep track of added pointers
  pointers: PointerInfo[] = []

  // pointerdown/mousedown/touchstart event
  downEvent: PointerEventType = null

  downPointer: PointerType = {} as PointerType

  _latestPointer: {
    pointer: PointerType
    event: PointerEventType
    eventTarget: Node
  } = {
    pointer: null,
    event: null,
    eventTarget: null,
  }

  // previous action event
  prevEvent: InteractEvent<T, EventPhase> = null

  pointerIsDown = false
  pointerWasMoved = false
  _interacting = false
  _ending = false
  _stopped = true
  _proxy: InteractionProxy<T> = null

  simulation = null

  /** @internal */ get pointerMoveTolerance () {
    return 1
  }

  /**
   * @alias Interaction.prototype.move
   */
  doMove = warnOnce(function (this: Interaction, signalArg: any) {
    this.move(signalArg)
  }, 'The interaction.doMove() method has been renamed to interaction.move()')

  coords: CoordsSet = {
    // Starting InteractEvent pointer coordinates
    start: pointerUtils.newCoords(),
    // Previous native pointer move event coordinates
    prev: pointerUtils.newCoords(),
    // current native pointer move event coordinates
    cur: pointerUtils.newCoords(),
    // Change in coordinates and time of the pointer
    delta: pointerUtils.newCoords(),
    // pointer velocity
    velocity: pointerUtils.newCoords(),
  }

  readonly _id: number = idCounter++

  /** */
  constructor ({ pointerType, scopeFire }: { pointerType?: string, scopeFire: Scope['fire'] }) {
    this._scopeFire = scopeFire
    this.pointerType = pointerType

    const that = this

    this._proxy = {} as InteractionProxy<T>

    for (const key in _ProxyValues) {
      Object.defineProperty(this._proxy, key, {
        get () {
          return that[key]
        },
      })
    }

    for (const key in _ProxyMethods) {
      Object.defineProperty(this._proxy, key, {
        value: (...args: any[]) => that[key](...args),
      })
    }

    this._scopeFire('interactions:new', { interaction: this })
  }

  pointerDown (pointer: PointerType, event: PointerEventType, eventTarget: Node) {
    const pointerIndex = this.updatePointer(pointer, event, eventTarget, true)
    const pointerInfo = this.pointers[pointerIndex]

    this._scopeFire('interactions:down', {
      pointer,
      event,
      eventTarget,
      pointerIndex,
      pointerInfo,
      type: 'down',
      interaction: (this as unknown) as Interaction<never>,
    })
  }

  /**
   * ```js
   * interact(target)
   *   .draggable({
   *     // disable the default drag start by down->move
   *     manualStart: true
   *   })
   *   // start dragging after the user holds the pointer down
   *   .on('hold', function (event) {
   *     var interaction = event.interaction
   *
   *     if (!interaction.interacting()) {
   *       interaction.start({ name: 'drag' },
   *                         event.interactable,
   *                         event.currentTarget)
   *     }
   * })
   * ```
   *
   * Start an action with the given Interactable and Element as tartgets. The
   * action must be enabled for the target Interactable and an appropriate
   * number of pointers must be held down - 1 for drag/resize, 2 for gesture.
   *
   * Use it with `interactable.<action>able({ manualStart: false })` to always
   * [start actions manually](https://github.com/taye/interact.js/issues/114)
   *
   * @param {object} action   The action to be performed - drag, resize, etc.
   * @param {Interactable} target  The Interactable to target
   * @param {Element} element The DOM Element to target
   * @return {Boolean} Whether the interaction was successfully started
   */
  start<A extends ActionName> (action: ActionProps<A>, interactable: Interactable, element: Element): boolean {
    if (
      this.interacting() ||
      !this.pointerIsDown ||
      this.pointers.length < (action.name === 'gesture' ? 2 : 1) ||
      !interactable.options[action.name as keyof ActionDefaults].enabled
    ) {
      return false
    }

    copyAction(this.prepared, action)

    this.interactable = interactable
    this.element = element
    this.rect = interactable.getRect(element)
    this.edges = this.prepared.edges
      ? extend({}, this.prepared.edges)
      : { left: true, right: true, top: true, bottom: true }
    this._stopped = false
    this._interacting =
      this._doPhase({
        interaction: this,
        event: this.downEvent,
        phase: 'start',
      }) && !this._stopped

    return this._interacting
  }

  pointerMove (pointer: PointerType, event: PointerEventType, eventTarget: Node) {
    if (!this.simulation && !(this.modification && this.modification.endResult)) {
      this.updatePointer(pointer, event, eventTarget, false)
    }

    const duplicateMove =
      this.coords.cur.page.x === this.coords.prev.page.x &&
      this.coords.cur.page.y === this.coords.prev.page.y &&
      this.coords.cur.client.x === this.coords.prev.client.x &&
      this.coords.cur.client.y === this.coords.prev.client.y

    let dx: number
    let dy: number

    // register movement greater than pointerMoveTolerance
    if (this.pointerIsDown && !this.pointerWasMoved) {
      dx = this.coords.cur.client.x - this.coords.start.client.x
      dy = this.coords.cur.client.y - this.coords.start.client.y

      this.pointerWasMoved = hypot(dx, dy) > this.pointerMoveTolerance
    }

    const pointerIndex = this.getPointerIndex(pointer)
    const signalArg = {
      pointer,
      pointerIndex,
      pointerInfo: this.pointers[pointerIndex],
      event,
      type: 'move' as const,
      eventTarget,
      dx,
      dy,
      duplicate: duplicateMove,
      interaction: (this as unknown) as Interaction<never>,
    }

    if (!duplicateMove) {
      // set pointer coordinate, time changes and velocity
      pointerUtils.setCoordVelocity(this.coords.velocity, this.coords.delta)
    }

    this._scopeFire('interactions:move', signalArg)

    if (!duplicateMove && !this.simulation) {
      // if interacting, fire an 'action-move' signal etc
      if (this.interacting()) {
        signalArg.type = null
        this.move(signalArg)
      }

      if (this.pointerWasMoved) {
        pointerUtils.copyCoords(this.coords.prev, this.coords.cur)
      }
    }
  }

  /**
   * ```js
   * interact(target)
   *   .draggable(true)
   *   .on('dragmove', function (event) {
   *     if (someCondition) {
   *       // change the snap settings
   *       event.interactable.draggable({ snap: { targets: [] }})
   *       // fire another move event with re-calculated snap
   *       event.interaction.move()
   *     }
   *   })
   * ```
   *
   * Force a move of the current action at the same coordinates. Useful if
   * snap/restrict has been changed and you want a movement with the new
   * settings.
   */
  move (signalArg?: any) {
    if (!signalArg || !signalArg.event) {
      pointerUtils.setZeroCoords(this.coords.delta)
    }

    signalArg = extend(
      {
        pointer: this._latestPointer.pointer,
        event: this._latestPointer.event,
        eventTarget: this._latestPointer.eventTarget,
        interaction: this,
      },
      signalArg || {},
    )

    signalArg.phase = 'move'

    this._doPhase(signalArg)
  }

  // End interact move events and stop auto-scroll unless simulation is running
  pointerUp (pointer: PointerType, event: PointerEventType, eventTarget: Node, curEventTarget: EventTarget) {
    let pointerIndex = this.getPointerIndex(pointer)

    if (pointerIndex === -1) {
      pointerIndex = this.updatePointer(pointer, event, eventTarget, false)
    }

    const type = /cancel$/i.test(event.type) ? 'cancel' : 'up'

    this._scopeFire(`interactions:${type}` as 'interactions:up' | 'interactions:cancel', {
      pointer,
      pointerIndex,
      pointerInfo: this.pointers[pointerIndex],
      event,
      eventTarget,
      type: type as any,
      curEventTarget,
      interaction: (this as unknown) as Interaction<never>,
    })

    if (!this.simulation) {
      this.end(event)
    }

    this.removePointer(pointer, event)
  }

  documentBlur (event: Event) {
    this.end(event as any)
    this._scopeFire('interactions:blur', {
      event,
      type: 'blur',
      interaction: (this as unknown) as Interaction<never>,
    })
  }

  /**
   * ```js
   * interact(target)
   *   .draggable(true)
   *   .on('move', function (event) {
   *     if (event.pageX > 1000) {
   *       // end the current action
   *       event.interaction.end()
   *       // stop all further listeners from being called
   *       event.stopImmediatePropagation()
   *     }
   *   })
   * ```
   *
   * @param {PointerEvent} [event]
   */
  end (event?: PointerEventType) {
    this._ending = true
    event = event || this._latestPointer.event
    let endPhaseResult: boolean

    if (this.interacting()) {
      endPhaseResult = this._doPhase({
        event,
        interaction: this,
        phase: 'end',
      })
    }

    this._ending = false

    if (endPhaseResult === true) {
      this.stop()
    }
  }

  currentAction () {
    return this._interacting ? this.prepared.name : null
  }

  interacting () {
    return this._interacting
  }

  /** */
  stop () {
    this._scopeFire('interactions:stop', { interaction: this })

    this.interactable = this.element = null

    this._interacting = false
    this._stopped = true
    this.prepared.name = this.prevEvent = null
  }

  getPointerIndex (pointer: PointerType) {
    const pointerId = pointerUtils.getPointerId(pointer)

    // mouse and pen interactions may have only one pointer
    return this.pointerType === 'mouse' || this.pointerType === 'pen'
      ? this.pointers.length - 1
      : arr.findIndex(this.pointers, (curPointer) => curPointer.id === pointerId)
  }

  getPointerInfo (pointer: any) {
    return this.pointers[this.getPointerIndex(pointer)]
  }

  updatePointer (pointer: PointerType, event: PointerEventType, eventTarget: Node, down?: boolean) {
    const id = pointerUtils.getPointerId(pointer)
    let pointerIndex = this.getPointerIndex(pointer)
    let pointerInfo = this.pointers[pointerIndex]

    down = down === false ? false : down || /(down|start)$/i.test(event.type)

    if (!pointerInfo) {
      pointerInfo = new PointerInfo(id, pointer, event, null, null)

      pointerIndex = this.pointers.length
      this.pointers.push(pointerInfo)
    } else {
      pointerInfo.pointer = pointer
    }

    pointerUtils.setCoords(
      this.coords.cur,
      this.pointers.map((p) => p.pointer),
      this._now(),
    )
    pointerUtils.setCoordDeltas(this.coords.delta, this.coords.prev, this.coords.cur)

    if (down) {
      this.pointerIsDown = true

      pointerInfo.downTime = this.coords.cur.timeStamp
      pointerInfo.downTarget = eventTarget
      pointerUtils.pointerExtend(this.downPointer, pointer)

      if (!this.interacting()) {
        pointerUtils.copyCoords(this.coords.start, this.coords.cur)
        pointerUtils.copyCoords(this.coords.prev, this.coords.cur)

        this.downEvent = event
        this.pointerWasMoved = false
      }
    }

    this._updateLatestPointer(pointer, event, eventTarget)

    this._scopeFire('interactions:update-pointer', {
      pointer,
      event,
      eventTarget,
      down,
      pointerInfo,
      pointerIndex,
      interaction: (this as unknown) as Interaction<never>,
    })

    return pointerIndex
  }

  removePointer (pointer: PointerType, event: PointerEventType) {
    const pointerIndex = this.getPointerIndex(pointer)

    if (pointerIndex === -1) return

    const pointerInfo = this.pointers[pointerIndex]

    this._scopeFire('interactions:remove-pointer', {
      pointer,
      event,
      eventTarget: null,
      pointerIndex,
      pointerInfo,
      interaction: (this as unknown) as Interaction<never>,
    })

    this.pointers.splice(pointerIndex, 1)
    this.pointerIsDown = false
  }

  _updateLatestPointer (pointer: PointerType, event: PointerEventType, eventTarget: Node) {
    this._latestPointer.pointer = pointer
    this._latestPointer.event = event
    this._latestPointer.eventTarget = eventTarget
  }

  destroy () {
    this._latestPointer.pointer = null
    this._latestPointer.event = null
    this._latestPointer.eventTarget = null
  }

  _createPreparedEvent<P extends EventPhase> (
    event: PointerEventType,
    phase: P,
    preEnd?: boolean,
    type?: string,
  ) {
    return new InteractEvent<T, P>(this, event, this.prepared.name, phase, this.element, preEnd, type)
  }

  _fireEvent<P extends EventPhase> (iEvent: InteractEvent<T, P>) {
    this.interactable?.fire(iEvent)

    if (!this.prevEvent || iEvent.timeStamp >= this.prevEvent.timeStamp) {
      this.prevEvent = iEvent
    }
  }

  _doPhase<P extends EventPhase> (
    signalArg: Omit<DoPhaseArg<T, P>, 'iEvent'> & { iEvent?: InteractEvent<T, P> },
  ) {
    const { event, phase, preEnd, type } = signalArg
    const { rect } = this

    if (rect && phase === 'move') {
      // update the rect changes due to pointer move
      rectUtils.addEdges(this.edges, rect, this.coords.delta[this.interactable.options.deltaSource])

      rect.width = rect.right - rect.left
      rect.height = rect.bottom - rect.top
    }

    const beforeResult = this._scopeFire(`interactions:before-action-${phase}` as any, signalArg)

    if (beforeResult === false) {
      return false
    }

    const iEvent = (signalArg.iEvent = this._createPreparedEvent(event, phase, preEnd, type))

    this._scopeFire(`interactions:action-${phase}` as any, signalArg)

    if (phase === 'start') {
      this.prevEvent = iEvent
    }

    this._fireEvent(iEvent)

    this._scopeFire(`interactions:after-action-${phase}` as any, signalArg)

    return true
  }

  _now () {
    return Date.now()
  }
}

export default Interaction
export { PointerInfo }
