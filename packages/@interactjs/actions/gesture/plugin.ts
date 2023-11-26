import type { Interactable } from '@interactjs/core/Interactable'
import type { InteractEvent, EventPhase } from '@interactjs/core/InteractEvent'
import type { Interaction, DoPhaseArg } from '@interactjs/core/Interaction'
import type { PerActionDefaults } from '@interactjs/core/options'
import type { Scope, Plugin } from '@interactjs/core/scope'
import type { Rect, PointerType, ListenersArg, OrBoolean } from '@interactjs/core/types'
import is from '@interactjs/utils/is'
import * as pointerUtils from '@interactjs/utils/pointerUtils'

declare module '@interactjs/core/Interaction' {
  interface Interaction {
    gesture?: {
      angle: number // angle from first to second touch
      distance: number
      scale: number // gesture.distance / gesture.startDistance
      startAngle: number // angle of line joining two touches
      startDistance: number // distance between two touches of touchStart
    }
  }
}

declare module '@interactjs/core/Interactable' {
  interface Interactable {
    gesturable(options: Partial<OrBoolean<GesturableOptions>> | boolean): this
    gesturable(): GesturableOptions
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
     * @param options - true/false or An object with event listeners to be fired on gesture events (makes the Interactable gesturable)
     * @returns A boolean indicating if this can be the target of gesture events, or this Interactable
     */
    gesturable(options?: Partial<OrBoolean<GesturableOptions>> | boolean): this | GesturableOptions
  }
}

declare module '@interactjs/core/options' {
  interface ActionDefaults {
    gesture: GesturableOptions
  }
}

declare module '@interactjs/core/types' {
  interface ActionMap {
    gesture?: typeof gesture
  }
}

export interface GesturableOptions extends PerActionDefaults {
  onstart?: ListenersArg
  onmove?: ListenersArg
  onend?: ListenersArg
}

export interface GestureEvent extends InteractEvent<'gesture'> {
  distance: number
  angle: number
  da: number // angle change
  scale: number // ratio of distance start to current event
  ds: number // scale change
  box: Rect // enclosing box of all points
  touches: PointerType[]
}

export interface GestureSignalArg extends DoPhaseArg<'gesture', EventPhase> {
  iEvent: GestureEvent
  interaction: Interaction<'gesture'>
}

function install(scope: Scope) {
  const { actions, Interactable, defaults } = scope

  Interactable.prototype.gesturable = function (
    this: InstanceType<typeof Interactable>,
    options: GesturableOptions | boolean,
  ) {
    if (is.object(options)) {
      this.options.gesture.enabled = options.enabled !== false
      this.setPerAction('gesture', options)
      this.setOnEvents('gesture', options)

      return this
    }

    if (is.bool(options)) {
      this.options.gesture.enabled = options

      return this
    }

    return this.options.gesture as GesturableOptions
  } as Interactable['gesturable']

  actions.map.gesture = gesture
  actions.methodDict.gesture = 'gesturable'

  defaults.actions.gesture = gesture.defaults
}

function updateGestureProps({ interaction, iEvent, phase }: GestureSignalArg) {
  if (interaction.prepared.name !== 'gesture') return

  const pointers = interaction.pointers.map((p) => p.pointer)
  const starting = phase === 'start'
  const ending = phase === 'end'
  const deltaSource = interaction.interactable.options.deltaSource

  iEvent.touches = [pointers[0], pointers[1]]

  if (starting) {
    iEvent.distance = pointerUtils.touchDistance(pointers, deltaSource)
    iEvent.box = pointerUtils.touchBBox(pointers)
    iEvent.scale = 1
    iEvent.ds = 0
    iEvent.angle = pointerUtils.touchAngle(pointers, deltaSource)
    iEvent.da = 0

    interaction.gesture.startDistance = iEvent.distance
    interaction.gesture.startAngle = iEvent.angle
  } else if (ending || interaction.pointers.length < 2) {
    const prevEvent = interaction.prevEvent as GestureEvent

    iEvent.distance = prevEvent.distance
    iEvent.box = prevEvent.box
    iEvent.scale = prevEvent.scale
    iEvent.ds = 0
    iEvent.angle = prevEvent.angle
    iEvent.da = 0
  } else {
    iEvent.distance = pointerUtils.touchDistance(pointers, deltaSource)
    iEvent.box = pointerUtils.touchBBox(pointers)
    iEvent.scale = iEvent.distance / interaction.gesture.startDistance
    iEvent.angle = pointerUtils.touchAngle(pointers, deltaSource)

    iEvent.ds = iEvent.scale - interaction.gesture.scale
    iEvent.da = iEvent.angle - interaction.gesture.angle
  }

  interaction.gesture.distance = iEvent.distance
  interaction.gesture.angle = iEvent.angle

  if (is.number(iEvent.scale) && iEvent.scale !== Infinity && !isNaN(iEvent.scale)) {
    interaction.gesture.scale = iEvent.scale
  }
}

const gesture: Plugin = {
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

    'auto-start:check': (arg) => {
      if (arg.interaction.pointers.length < 2) {
        return undefined
      }

      const gestureOptions = arg.interactable.options.gesture

      if (!(gestureOptions && gestureOptions.enabled)) {
        return undefined
      }

      arg.action = { name: 'gesture' }

      return false
    },
  },

  defaults: {},

  getCursor() {
    return ''
  },

  filterEventType: (type: string) => type.search('gesture') === 0,
}

export default gesture
