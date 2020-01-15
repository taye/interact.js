import InteractEvent from '@interactjs/core/InteractEvent'
import { ActionName, Scope } from '@interactjs/core/scope'
import * as utils from '@interactjs/utils/index'

export type GesturableMethod = Interact.ActionMethod<Interact.GesturableOptions>

declare module '@interactjs/core/Interaction' {
  interface Interaction {
    gesture?: {
      angle: number           // angle from first to second touch
      distance: number
      scale: number           // gesture.distance / gesture.startDistance
      startAngle: number      // angle of line joining two touches
      startDistance: number   // distance between two touches of touchStart
    }
  }
}

declare module '@interactjs/core/Interactable' {
  interface Interactable {
    gesturable: GesturableMethod
  }
}

declare module '@interactjs/core/defaultOptions' {
  interface ActionDefaults {
    gesture: Interact.GesturableOptions
  }
}

declare module '@interactjs/core/scope' {
  interface Actions {
    [ActionName.Gesture]?: typeof gesture
  }

  // eslint-disable-next-line no-shadow
  enum ActionName {
    Gesture = 'gesture'
  }
}

(ActionName as any).Gesture = 'gesture'

export interface GestureEvent extends Interact.InteractEvent<ActionName.Gesture> {
  distance: number
  angle: number
  da: number // angle change
  scale: number // ratio of distance start to current event
  ds: number // scale change
  box: Interact.Rect // enclosing box of all points
  touches: Interact.PointerType[]
}

export interface GestureSignalArg extends Interact.DoPhaseArg {
  iEvent: GestureEvent
  interaction: Interact.Interaction<ActionName.Gesture>
  event: Interact.PointerEventType | GestureEvent
}

function install (scope: Scope) {
  const {
    actions,
    Interactable,
    defaults,
  } = scope

  /**
   * ```js
   * interact(element).gesturable({
   *     onstart: function (event) {},
   *     onmove : function (event) {},
   *     onend  : function (event) {},
   *
   *     // limit multiple gestures.
   *     // See the explanation in {@link Interactable.draggable} example
   *     max: Infinity,
   *     maxPerElement: 1,
   * })
   *
   * var isGestureable = interact(element).gesturable()
   * ```
   *
   * Gets or sets whether multitouch gestures can be performed on the target
   *
   * @param {boolean | object} [options] true/false or An object with event
   * listeners to be fired on gesture events (makes the Interactable gesturable)
   * @return {boolean | Interactable} A boolean indicating if this can be the
   * target of gesture events, or this Interactable
   */
  Interactable.prototype.gesturable = function (this: Interact.Interactable, options: Interact.GesturableOptions | boolean) {
    if (utils.is.object(options)) {
      this.options.gesture.enabled = options.enabled !== false
      this.setPerAction(ActionName.Gesture, options)
      this.setOnEvents(ActionName.Gesture, options)

      return this
    }

    if (utils.is.bool(options)) {
      this.options.gesture.enabled = options

      return this
    }

    return this.options.gesture as Interact.Options
  } as GesturableMethod

  actions[ActionName.Gesture] = gesture
  actions.names.push(ActionName.Gesture)
  utils.arr.merge(actions.eventTypes, [
    'gesturestart',
    'gesturemove',
    'gestureend',
  ])
  actions.methodDict.gesture = 'gesturable'

  defaults.actions.gesture = gesture.defaults
}

function updateGestureProps ({ interaction, iEvent, event, phase }: GestureSignalArg) {
  if (interaction.prepared.name !== 'gesture') { return }

  const pointers = interaction.pointers.map(p => p.pointer)
  const starting = phase === 'start'
  const ending = phase === 'end'
  const deltaSource = interaction.interactable.options.deltaSource

  iEvent.touches = [pointers[0], pointers[1]]

  if (starting) {
    iEvent.distance = utils.pointer.touchDistance(pointers, deltaSource)
    iEvent.box      = utils.pointer.touchBBox(pointers)
    iEvent.scale    = 1
    iEvent.ds       = 0
    iEvent.angle    = utils.pointer.touchAngle(pointers, deltaSource)
    iEvent.da       = 0

    interaction.gesture.startDistance = iEvent.distance
    interaction.gesture.startAngle = iEvent.angle
  }
  else if (ending || event instanceof InteractEvent) {
    const prevEvent = interaction.prevEvent as GestureEvent

    iEvent.distance = prevEvent.distance
    iEvent.box      = prevEvent.box
    iEvent.scale    = prevEvent.scale
    iEvent.ds       = 0
    iEvent.angle    = prevEvent.angle
    iEvent.da       = 0
  }
  else {
    iEvent.distance = utils.pointer.touchDistance(pointers, deltaSource)
    iEvent.box      = utils.pointer.touchBBox(pointers)
    iEvent.scale    = iEvent.distance / interaction.gesture.startDistance
    iEvent.angle    = utils.pointer.touchAngle(pointers, deltaSource)

    iEvent.ds = iEvent.scale - interaction.gesture.scale
    iEvent.da = iEvent.angle - interaction.gesture.angle
  }

  interaction.gesture.distance = iEvent.distance
  interaction.gesture.angle = iEvent.angle

  if (utils.is.number(iEvent.scale) &&
      iEvent.scale !== Infinity &&
      !isNaN(iEvent.scale)) {
    interaction.gesture.scale = iEvent.scale
  }
}

const gesture: Interact.Plugin = {
  id: 'actions/gesture',
  before: ['actions/drag', 'actions/resize'],
  install,
  listeners: {
    'interactions:action-start': updateGestureProps,
    'interactions:action-move': updateGestureProps,
    'interactions:action-end': updateGestureProps,

    'interactions:new': ({ interaction }) => {
      interaction.gesture = {
        angle: 0,
        distance: 0,
        scale: 1,
        startAngle: 0,
        startDistance: 0,
      }
    },

    'auto-start:check': arg => {
      if (arg.interaction.pointers.length < 2) {
        return undefined
      }

      const gestureOptions = arg.interactable.options.gesture

      if (!(gestureOptions && gestureOptions.enabled)) {
        return undefined
      }

      arg.action = { name: ActionName.Gesture }

      return false
    },
  },

  defaults: {
  },

  getCursor () {
    return ''
  },
}

export default gesture
