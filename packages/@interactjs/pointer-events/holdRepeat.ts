import { ListenerMap } from '@interactjs/core/scope'
import * as Interact from '@interactjs/types/index'

import PointerEvent from './PointerEvent'
import basePlugin from './base'

declare module '@interactjs/core/Interaction' {
  interface Interaction {
    holdIntervalHandle?: any
  }
}

declare module '@interactjs/pointer-events/PointerEvent' {
  interface PointerEvent<T extends string = any> {
    count?: number
  }
}

declare module '@interactjs/pointer-events/base' {
  interface PointerEventOptions {
    holdRepeatInterval?: number
  }
}

function install (scope: Interact.Scope) {
  scope.usePlugin(basePlugin)

  const {
    pointerEvents,
  } = scope

  // don't repeat by default
  pointerEvents.defaults.holdRepeatInterval = 0
  pointerEvents.types.holdrepeat = scope.actions.phaselessTypes.holdrepeat = true
}

function onNew ({ pointerEvent }: { pointerEvent: PointerEvent<any> }) {
  if (pointerEvent.type !== 'hold') { return }

  pointerEvent.count = (pointerEvent.count || 0) + 1
}

function onFired (
  { interaction, pointerEvent, eventTarget, targets }: Interact.SignalArgs['pointerEvents:fired'],
  scope: Interact.Scope,
) {
  if (pointerEvent.type !== 'hold' || !targets.length) { return }

  // get the repeat interval from the first eventable
  const interval = targets[0].eventable.options.holdRepeatInterval

  // don't repeat if the interval is 0 or less
  if (interval <= 0) { return }

  // set a timeout to fire the holdrepeat event
  interaction.holdIntervalHandle = setTimeout(() => {
    scope.pointerEvents.fire({
      interaction,
      eventTarget,
      type: 'hold',
      pointer: pointerEvent,
      event: pointerEvent,
    }, scope)
  }, interval)
}

function endHoldRepeat ({ interaction }: { interaction: Interact.Interaction }) {
  // set the interaction's holdStopTime property
  // to stop further holdRepeat events
  if (interaction.holdIntervalHandle) {
    clearInterval(interaction.holdIntervalHandle)
    interaction.holdIntervalHandle = null
  }
}

const holdRepeat: Interact.Plugin = {
  id: 'pointer-events/holdRepeat',
  install,
  listeners: ['move', 'up', 'cancel', 'endall'].reduce(
    (acc, enderTypes) => {
      (acc as any)[`pointerEvents:${enderTypes}`] = endHoldRepeat
      return acc
    },
    {
      'pointerEvents:new': onNew,
      'pointerEvents:fired': onFired,
    } as ListenerMap,
  ),
}

export default holdRepeat
