import { PerActionDefaults } from '@interactjs/core/defaultOptions'
import Eventable from '@interactjs/core/Eventable'
import Interaction from '@interactjs/core/Interaction'
import { Scope } from '@interactjs/core/scope'
import * as utils from '@interactjs/utils'
import PointerEvent from './PointerEvent'

export type EventTargetList = Array<{
  node: Node
  eventable: Eventable
  props: { [key: string]: any }
}>

export interface PointerEventOptions extends PerActionDefaults {
  enabled?: undefined // not used
  holdDuration?: number
  ignoreFrom?: any
  allowFrom?: any
  origin?: Interact.Point | string | Interact.Element
}

declare module '@interactjs/core/scope' {
  interface Scope {
    pointerEvents: typeof pointerEvents
  }
}

declare module '@interactjs/core/Interaction' {
  interface Interaction {
    prevTap?: PointerEvent<string>
    tapTime?: number
  }
}

declare module '@interactjs/core/PointerInfo' {
  interface PointerInfo {
    hold?: {
      duration: number
      timeout: any
    }
  }
}

declare module '@interactjs/core/defaultOptions' {
  interface ActionDefaults {
    pointerEvents: Interact.Options
  }
}

const defaults: PointerEventOptions = {
  holdDuration: 600,
  ignoreFrom  : null,
  allowFrom   : null,
  origin      : { x: 0, y: 0 },
}

const pointerEvents = {
  id: 'pointer-events/base',
  install,
  PointerEvent,
  fire,
  collectEventTargets,
  defaults,
  types: [
    'down',
    'move',
    'up',
    'cancel',
    'tap',
    'doubletap',
    'hold',
  ],
}

function fire<T extends string> (arg: {
  interaction: Interaction
  pointer: Interact.PointerType
  event: Interact.PointerEventType
  eventTarget: Interact.EventTarget
  targets?: EventTargetList
  pointerEvent?: PointerEvent<T>
  type: T
}, scope: Interact.Scope) {
  const {
    interaction, pointer, event, eventTarget,
    type = (arg as any).pointerEvent.type,
    targets = collectEventTargets(arg, scope),
  } = arg

  const {
    pointerEvent = new PointerEvent(type, pointer, event, eventTarget, interaction, scope.now()),
  } = arg

  const signalArg = {
    interaction,
    pointer,
    event,
    eventTarget,
    targets,
    type,
    pointerEvent,
  }

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i]

    for (const prop in target.props || {}) {
      (pointerEvent as any)[prop] = target.props[prop]
    }

    const origin = utils.getOriginXY(target.eventable, target.node)

    pointerEvent._subtractOrigin(origin)
    pointerEvent.eventable = target.eventable
    pointerEvent.currentTarget = target.node

    target.eventable.fire(pointerEvent)

    pointerEvent._addOrigin(origin)

    if (pointerEvent.immediatePropagationStopped ||
        (pointerEvent.propagationStopped &&
            (i + 1) < targets.length && targets[i + 1].node !== pointerEvent.currentTarget)) {
      break
    }
  }

  scope.signals.fire('pointerEvents:fired', signalArg)

  if (type === 'tap') {
    // if pointerEvent should make a double tap, create and fire a doubletap
    // PointerEvent and use that as the prevTap
    const prevTap = pointerEvent.double
      ? fire({
        interaction,
        pointer,
        event,
        eventTarget,
        type: 'doubletap',
      }, scope)
      : pointerEvent

    interaction.prevTap = prevTap
    interaction.tapTime = prevTap.timeStamp
  }

  return pointerEvent
}

function collectEventTargets<T extends string> ({ interaction, pointer, event, eventTarget, type }: {
  interaction: Interaction
  pointer: Interact.PointerType
  event: Interact.PointerEventType
  eventTarget: Interact.EventTarget
  type: T
}, scope: Interact.Scope) {
  const pointerIndex = interaction.getPointerIndex(pointer)
  const pointerInfo = interaction.pointers[pointerIndex]

  // do not fire a tap event if the pointer was moved before being lifted
  if (type === 'tap' && (interaction.pointerWasMoved ||
      // or if the pointerup target is different to the pointerdown target
      !(pointerInfo && pointerInfo.downTarget === eventTarget))) {
    return []
  }

  const path = utils.dom.getPath(eventTarget)
  const signalArg = {
    interaction,
    pointer,
    event,
    eventTarget,
    type,
    path,
    targets: [] as EventTargetList,
    node: null,
  }

  for (const node of path) {
    signalArg.node = node

    scope.signals.fire('pointerEvents:collect-targets', signalArg)
  }

  if (type === 'hold') {
    signalArg.targets = signalArg.targets.filter(target =>
      target.eventable.options.holdDuration === interaction.pointers[pointerIndex].hold.duration)
  }

  return signalArg.targets
}

function addInteractionProps ({ interaction }) {
  interaction.prevTap = null   // the most recent tap event on this interaction
  interaction.tapTime = 0     // time of the most recent tap event
}

function addHoldInfo ({ down, pointerInfo }) {
  if (!down && pointerInfo.hold) {
    return
  }

  pointerInfo.hold = { duration: Infinity, timeout: null }
}

function clearHold ({ interaction, pointerIndex }) {
  if (interaction.pointers[pointerIndex].hold) {
    clearTimeout(interaction.pointers[pointerIndex].hold.timeout)
  }
}

function moveAndClearHold ({ interaction, pointer, event, eventTarget, duplicateMove }, scope) {
  const pointerIndex = interaction.getPointerIndex(pointer)

  if (!duplicateMove && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
    if (interaction.pointerIsDown) {
      clearTimeout(interaction.pointers[pointerIndex].hold.timeout)
    }

    fire({
      interaction,
      pointer,
      event,
      eventTarget,
      type: 'move',
    }, scope)
  }
}

function downAndStartHold ({ interaction, pointer, event, eventTarget, pointerIndex }: Interact.SignalArg, scope: Interact.Scope) {
  const timer = interaction.pointers[pointerIndex].hold
  const path = utils.dom.getPath(eventTarget)
  const signalArg = {
    interaction,
    pointer,
    event,
    eventTarget,
    type: 'hold',
    targets: [] as EventTargetList,
    path,
    node: null,
  }

  for (const node of path) {
    signalArg.node = node

    scope.signals.fire('pointerEvents:collect-targets', signalArg)
  }

  if (!signalArg.targets.length) { return }

  let minDuration = Infinity

  for (const target of signalArg.targets) {
    const holdDuration = target.eventable.options.holdDuration

    if (holdDuration < minDuration) {
      minDuration = holdDuration
    }
  }

  timer.duration = minDuration
  timer.timeout = setTimeout(() => {
    fire({
      interaction,
      eventTarget,
      pointer,
      event,
      type: 'hold',
    }, scope)
  }, minDuration)
}

function tapAfterUp ({ interaction, pointer, event, eventTarget }: Interact.SignalArg, scope: Interact.Scope) {
  if (!interaction.pointerWasMoved) {
    fire({ interaction, eventTarget, pointer, event, type: 'tap' }, scope)
  }
}

function install (scope: Scope) {
  const {
    signals,
  } = scope

  scope.pointerEvents = pointerEvents
  scope.defaults.actions.pointerEvents = pointerEvents.defaults

  signals.addHandler({
    'interactions:new': addInteractionProps,
    'interactions:update-pointer': addHoldInfo,
    'interactions:move': arg => moveAndClearHold(arg, scope),
    'interactions:down': arg => {
      downAndStartHold(arg, scope)
      fire(arg, scope)
    },
    'interactions:up': arg => {
      clearHold(arg)
      fire(arg, scope)
      tapAfterUp(arg, scope)
    },
    'interactions:cancel': arg => {
      clearHold(arg)
      fire(arg, scope)
    },
  })
}

export default pointerEvents
