import * as utils from '@interactjs/utils/index'
import Interactable from './Interactable'
import InteractEvent, { EventPhase } from './InteractEvent'
import PointerInfo from './PointerInfo'
import { ActionName } from './scope'

export interface ActionProps<T extends ActionName = any> {
  name: T
  axis?: 'x' | 'y' | 'xy'
  edges?: Interact.EdgeOptions
}

export interface StartAction extends ActionProps {
  name: ActionName | string
}

export enum _ProxyValues {
  interactable = '',
  element = '',
  prepared = '',
  pointerIsDown = '',
  pointerWasMoved = '',
  _proxy = ''
}

export enum _ProxyMethods {
  start = '',
  move = '',
  end = '',
  stop = '',
  interacting = ''
}

export type PointerArgProps<T extends {} = {}> = {
  pointer: Interact.PointerType
  event: Interact.PointerEventType
  eventTarget: Interact.EventTarget
  pointerIndex: number
  interaction: Interaction
} & T

export interface DoPhaseArg {
  event: Interact.PointerEventType
  phase: EventPhase
  interaction: Interaction
  iEvent: InteractEvent
  preEnd?: boolean
  type?: string
}

declare module '@interactjs/core/scope' {
  interface SignalArgs {
    'interactions:new': { interaction: Interaction }
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
      pointerInfo: PointerInfo
      down: boolean
    }>
    'interactions:remove-pointer': PointerArgProps<{
      pointerInfo: PointerInfo
    }>
    'interactions:blur'
    'interactions:before-action-start': Omit<DoPhaseArg, 'iEvent'>
    'interactions:action-start': DoPhaseArg
    'interactions:after-action-start': DoPhaseArg
    'interactions:before-action-move': Omit<DoPhaseArg, 'iEvent'>
    'interactions:action-move': DoPhaseArg
    'interactions:after-action-move': DoPhaseArg
    'interactions:before-action-end': Omit<DoPhaseArg, 'iEvent'>
    'interactions:action-end': DoPhaseArg
    'interactions:after-action-end': DoPhaseArg
    'interactions:stop': { interaction: Interaction }
  }
}

export type _InteractionProxy = Pick<
Interaction,
keyof typeof _ProxyValues | keyof typeof _ProxyMethods
>

let idCounter = 0

export class Interaction<T extends ActionName = any> {
  // current interactable being interacted with
  interactable: Interactable = null

  // the target element of the interactable
  element: Interact.Element = null
  rect: Interact.FullRect
  _rects?: {
    start: Interact.FullRect
    corrected: Interact.FullRect
    previous: Interact.FullRect
    delta: Interact.FullRect
  }
  edges: Interact.EdgeOptions

  _scopeFire: Interact.Scope['fire']

  // action that's ready to be fired on next move event
  prepared: ActionProps<T> = {
    name : null,
    axis : null,
    edges: null,
  }

  pointerType: string

  // keep track of added pointers
  pointers: PointerInfo[] = []

  // pointerdown/mousedown/touchstart event
  downEvent: Interact.PointerEventType = null

  downPointer: Interact.PointerType = {} as Interact.PointerType

  _latestPointer: {
    pointer: Interact.EventTarget
    event: Interact.PointerEventType
    eventTarget: Node
  } = {
    pointer: null,
    event: null,
    eventTarget: null,
  }

  // previous action event
  prevEvent: InteractEvent<T> = null

  pointerIsDown = false
  pointerWasMoved = false
  _interacting = false
  _ending = false
  _stopped = true
  _proxy: _InteractionProxy = null

  simulation = null

  get pointerMoveTolerance () {
    return 1
  }

  /**
   * @alias Interaction.prototype.move
   */
  doMove = utils.warnOnce(
    function (this: Interaction, signalArg: any) {
      this.move(signalArg)
    },
    'The interaction.doMove() method has been renamed to interaction.move()')

  coords: Interact.CoordsSet = {
    // Starting InteractEvent pointer coordinates
    start: utils.pointer.newCoords(),
    // Previous native pointer move event coordinates
    prev: utils.pointer.newCoords(),
    // current native pointer move event coordinates
    cur: utils.pointer.newCoords(),
    // Change in coordinates and time of the pointer
    delta: utils.pointer.newCoords(),
    // pointer velocity
    velocity: utils.pointer.newCoords(),
  }

  readonly _id: number = idCounter++

  /** */
  constructor ({ pointerType, scopeFire }: {
    pointerType?: string
    scopeFire: Interact.Scope['fire']
  }) {
    this._scopeFire = scopeFire
    this.pointerType = pointerType

    const that = this

    this._proxy = {} as _InteractionProxy

    for (const key in _ProxyValues) {
      Object.defineProperty(this._proxy, key, {
        get () { return that[key] },
      })
    }

    for (const key in _ProxyMethods) {
      Object.defineProperty(this._proxy, key, {
        value: (...args) => that[key](...args),
      })
    }

    this._scopeFire('interactions:new', { interaction: this })
  }

  pointerDown (pointer: Interact.PointerType, event: Interact.PointerEventType, eventTarget: Interact.EventTarget) {
    const pointerIndex = this.updatePointer(pointer, event, eventTarget, true)

    this._scopeFire('interactions:down', {
      pointer,
      event,
      eventTarget,
      pointerIndex,
      type: 'down',
      interaction: this,
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
   * @return {object} interact
   */
  start (action: StartAction, interactable: Interactable, element: Interact.Element) {
    if (this.interacting() ||
        !this.pointerIsDown ||
        this.pointers.length < (action.name === ActionName.Gesture ? 2 : 1) ||
        !interactable.options[action.name].enabled) {
      return false
    }

    utils.copyAction(this.prepared, action)

    this.interactable = interactable
    this.element      = element
    this.rect         = interactable.getRect(element)
    this.edges        = utils.extend({}, this.prepared.edges)
    this._stopped     = false
    this._interacting = this._doPhase({
      interaction: this,
      event: this.downEvent,
      phase: EventPhase.Start,
    }) && !this._stopped

    return this._interacting
  }

  pointerMove (pointer: Interact.PointerType, event: Interact.PointerEventType, eventTarget: Interact.EventTarget) {
    if (!this.simulation && !(this.modifiers && this.modifiers.endResult)) {
      this.updatePointer(pointer, event, eventTarget, false)
      utils.pointer.setCoords(this.coords.cur, this.pointers.map(p => p.pointer), this._now())
    }

    const duplicateMove = (this.coords.cur.page.x === this.coords.prev.page.x &&
                           this.coords.cur.page.y === this.coords.prev.page.y &&
                           this.coords.cur.client.x === this.coords.prev.client.x &&
                           this.coords.cur.client.y === this.coords.prev.client.y)

    let dx
    let dy

    // register movement greater than pointerMoveTolerance
    if (this.pointerIsDown && !this.pointerWasMoved) {
      dx = this.coords.cur.client.x - this.coords.start.client.x
      dy = this.coords.cur.client.y - this.coords.start.client.y

      this.pointerWasMoved = utils.hypot(dx, dy) > this.pointerMoveTolerance
    }

    const signalArg = {
      pointer,
      pointerIndex: this.getPointerIndex(pointer),
      event,
      type: 'move' as const,
      eventTarget,
      dx,
      dy,
      duplicate: duplicateMove,
      interaction: this,
    }

    if (!duplicateMove) {
      // set pointer coordinate, time changes and velocity
      utils.pointer.setCoordDeltas(this.coords.delta, this.coords.prev, this.coords.cur)
      utils.pointer.setCoordVelocity(this.coords.velocity, this.coords.delta)
    }

    this._scopeFire('interactions:move', signalArg)

    if (!duplicateMove) {
      // if interacting, fire an 'action-move' signal etc
      if (this.interacting()) {
        signalArg.type = null
        this.move(signalArg)
      }

      if (this.pointerWasMoved) {
        utils.pointer.copyCoords(this.coords.prev, this.coords.cur)
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
  move (signalArg?) {
    if (!signalArg || !signalArg.event) {
      utils.pointer.setZeroCoords(this.coords.delta)
    }

    signalArg = utils.extend({
      pointer: this._latestPointer.pointer,
      event: this._latestPointer.event,
      eventTarget: this._latestPointer.eventTarget,
      interaction: this,
    }, signalArg || {})

    signalArg.phase = EventPhase.Move

    this._doPhase(signalArg)
  }

  // End interact move events and stop auto-scroll unless simulation is running
  pointerUp (pointer: Interact.PointerType, event: Interact.PointerEventType, eventTarget: Interact.EventTarget, curEventTarget: Interact.EventTarget) {
    let pointerIndex = this.getPointerIndex(pointer)

    if (pointerIndex === -1) {
      pointerIndex = this.updatePointer(pointer, event, eventTarget, false)
    }

    const type = /cancel$/i.test(event.type) ? 'cancel' : 'up'

    this._scopeFire(`interactions:${type}` as 'interactions:up' | 'interactions:cancel', {
      pointer,
      pointerIndex,
      event,
      eventTarget,
      type: type as any,
      curEventTarget,
      interaction: this,
    })

    if (!this.simulation) {
      this.end(event)
    }

    this.pointerIsDown = false
    this.removePointer(pointer, event)
  }

  documentBlur (event) {
    this.end(event)
    this._scopeFire('interactions:blur', { event, type: 'blur', interaction: this })
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
  end (event?: Interact.PointerEventType) {
    this._ending = true
    event = event || this._latestPointer.event
    let endPhaseResult

    if (this.interacting()) {
      endPhaseResult = this._doPhase({
        event,
        interaction: this,
        phase: EventPhase.End,
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

  getPointerIndex (pointer) {
    const pointerId = utils.pointer.getPointerId(pointer)

    // mouse and pen interactions may have only one pointer
    return (this.pointerType === 'mouse' || this.pointerType === 'pen')
      ? this.pointers.length - 1
      : utils.arr.findIndex(this.pointers, curPointer => curPointer.id === pointerId)
  }

  getPointerInfo (pointer) {
    return this.pointers[this.getPointerIndex(pointer)]
  }

  updatePointer (pointer: Interact.PointerType, event: Interact.PointerEventType, eventTarget: Interact.EventTarget, down?: boolean) {
    const id = utils.pointer.getPointerId(pointer)
    let pointerIndex = this.getPointerIndex(pointer)
    let pointerInfo = this.pointers[pointerIndex]

    down = down === false
      ? false
      : down || /(down|start)$/i.test(event.type)

    if (!pointerInfo) {
      pointerInfo = new PointerInfo(
        id,
        pointer,
        event,
        null,
        null,
      )

      pointerIndex = this.pointers.length
      this.pointers.push(pointerInfo)
    }
    else {
      pointerInfo.pointer = pointer
    }

    if (down) {
      this.pointerIsDown = true

      if (!this.interacting()) {
        utils.pointer.setCoords(this.coords.start, this.pointers.map(p => p.pointer), this._now())

        utils.pointer.copyCoords(this.coords.cur, this.coords.start)
        utils.pointer.copyCoords(this.coords.prev, this.coords.start)
        utils.pointer.pointerExtend(this.downPointer, pointer)

        this.downEvent = event
        pointerInfo.downTime = this.coords.cur.timeStamp
        pointerInfo.downTarget = eventTarget

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
      interaction: this,
    })

    return pointerIndex
  }

  removePointer (pointer: Interact.PointerType, event: Interact.PointerEventType) {
    const pointerIndex = this.getPointerIndex(pointer)

    if (pointerIndex === -1) { return }

    const pointerInfo = this.pointers[pointerIndex]

    this._scopeFire('interactions:remove-pointer', {
      pointer,
      event,
      eventTarget: null,
      pointerIndex,
      pointerInfo,
      interaction: this,
    })

    this.pointers.splice(pointerIndex, 1)
  }

  _updateLatestPointer (pointer, event, eventTarget) {
    this._latestPointer.pointer = pointer
    this._latestPointer.event = event
    this._latestPointer.eventTarget = eventTarget
  }

  destroy () {
    this._latestPointer.pointer = null
    this._latestPointer.event = null
    this._latestPointer.eventTarget = null
  }

  _createPreparedEvent (event: Interact.PointerEventType, phase: EventPhase, preEnd?: boolean, type?: string) {
    const actionName = this.prepared.name

    return new InteractEvent(this, event, actionName, phase, this.element, null, preEnd, type)
  }

  _fireEvent (iEvent) {
    this.interactable.fire(iEvent)

    if (!this.prevEvent || iEvent.timeStamp >= this.prevEvent.timeStamp) {
      this.prevEvent = iEvent
    }
  }

  _doPhase (signalArg: Omit<DoPhaseArg, 'iEvent'> & { iEvent?: InteractEvent<T> }) {
    const { event, phase, preEnd, type } = signalArg
    const { rect, coords: { delta } } = this

    if (rect && phase === EventPhase.Move) {
      // update the rect modifications
      const edges = this.edges || this.prepared.edges || { left: true, right: true, top: true, bottom: true }
      utils.rect.addEdges(edges, rect, delta[this.interactable.options.deltaSource])

      rect.width = rect.right - rect.left
      rect.height = rect.bottom - rect.top
    }

    const beforeResult = this._scopeFire(`interactions:before-action-${phase}` as any, signalArg)

    if (beforeResult === false) {
      return false
    }

    const iEvent = signalArg.iEvent = this._createPreparedEvent(event, phase, preEnd, type)

    this._scopeFire(`interactions:action-${phase}` as any, signalArg)

    this._fireEvent(iEvent)

    this._scopeFire(`interactions:after-action-${phase}` as any, signalArg)

    return true
  }

  _now () { return Date.now() }
}

export default Interaction
export { PointerInfo }
