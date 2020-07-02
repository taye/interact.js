import { Eventable } from '@interactjs/core/Eventable'
import { Interaction } from '@interactjs/core/Interaction'
import { PerActionDefaults } from '@interactjs/core/defaultOptions'
import { Scope } from '@interactjs/core/scope'
import * as Interact from '@interactjs/types/index'
import * as domUtils from '@interactjs/utils/domUtils'
import extend from '@interactjs/utils/extend'
import getOriginXY from '@interactjs/utils/getOriginXY'

import { PointerEvent } from './PointerEvent'

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

declare module '@interactjs/core/scope' {
  interface SignalArgs {
    'pointerEvents:new': { pointerEvent: PointerEvent<any> }
    'pointerEvents:fired': {
      interaction: Interaction
      pointer: Interact.PointerType | PointerEvent<any>
      event: Interact.PointerEventType | PointerEvent<any>
      eventTarget: Interact.EventTarget
      pointerEvent: PointerEvent<any>
      targets?: EventTargetList
      type: string
    }
    'pointerEvents:collect-targets': {
      interaction: Interaction
      pointer: Interact.PointerType | PointerEvent<any>
      event: Interact.PointerEventType | PointerEvent<any>
      eventTarget: Interact.EventTarget
      targets?: EventTargetList
      type: string
      path: Node[]
      node: null
    }
  }
}

const defaults: PointerEventOptions = {
  holdDuration: 600,
  ignoreFrom  : null,
  allowFrom   : null,
  origin      : { x: 0, y: 0 },
}

const pointerEvents: Interact.Plugin = {
  id: 'pointer-events/base',
  before: ['inertia', 'modifiers', 'auto-start', 'actions'],
  install,
  listeners: {
    'interactions:new': addInteractionProps,
    'interactions:update-pointer': addHoldInfo,
    'interactions:move': moveAndClearHold,
    'interactions:down': (arg, scope) => {
      downAndStartHold(arg, scope)
      fire(arg, scope)
    },
    'interactions:up': (arg, scope) => {
      clearHold(arg)
      fire(arg, scope)
      tapAfterUp(arg, scope)
    },
    'interactions:cancel': (arg, scope) => {
      clearHold(arg)
      fire(arg, scope)
    },
  },
  PointerEvent,
  fire,
  collectEventTargets,
  defaults,
  types: {
    down: true,
    move: true,
    up: true,
    cancel: true,
    tap: true,
    doubletap: true,
    hold: true,
  } as { [type: string]: true },
}

function fire<T extends string> (
  arg: {
    pointer: Interact.PointerType | PointerEvent<any>
    event: Interact.PointerEventType | PointerEvent<any>
    eventTarget: Interact.EventTarget
    interaction: Interaction
    type: T
    targets?: EventTargetList
  },
  scope: Interact.Scope,
) {
  const {
    interaction,
    pointer,
    event,
    eventTarget,
    type,
    targets = collectEventTargets(arg, scope),
  } = arg

  const pointerEvent = new PointerEvent(type, pointer, event, eventTarget, interaction, scope.now())

  scope.fire('pointerEvents:new', { pointerEvent })

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

    const origin = getOriginXY(target.eventable, target.node)

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

  scope.fire('pointerEvents:fired', signalArg)

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
  pointer: Interact.PointerType | PointerEvent<any>
  event: Interact.PointerEventType | PointerEvent<any>
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

  const path = domUtils.getPath(eventTarget as Interact.Element | Document)
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

    scope.fire('pointerEvents:collect-targets', signalArg)
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

function addHoldInfo ({ down, pointerInfo }: Interact.SignalArgs['interactions:update-pointer']) {
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

function moveAndClearHold (
  { interaction, pointer, event, eventTarget, duplicate }: Interact.SignalArgs['interactions:move'],
  scope: Interact.Scope,
) {
  const pointerIndex = interaction.getPointerIndex(pointer)

  if (!duplicate && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
    if (interaction.pointerIsDown) {
      clearTimeout(interaction.pointers[pointerIndex].hold.timeout)
    }

    fire({
      interaction,
      pointer,
      event,
      eventTarget: eventTarget as Interact.Element,
      type: 'move',
    }, scope)
  }
}

function downAndStartHold ({ interaction, pointer, event, eventTarget, pointerIndex }: Interact.SignalArgs['interactions:down'], scope: Interact.Scope) {
  const timer = interaction.pointers[pointerIndex].hold
  const path = domUtils.getPath(eventTarget as Interact.Element | Document)
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

    scope.fire('pointerEvents:collect-targets', signalArg)
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

function tapAfterUp ({ interaction, pointer, event, eventTarget }: Interact.SignalArgs['interactions:up'], scope: Interact.Scope) {
  if (!interaction.pointerWasMoved) {
    fire({ interaction, eventTarget, pointer, event, type: 'tap' }, scope)
  }
}

function install (scope: Scope) {
  scope.pointerEvents = pointerEvents
  scope.defaults.actions.pointerEvents = pointerEvents.defaults
  extend(scope.actions.phaselessTypes, pointerEvents.types)
}

export default pointerEvents
