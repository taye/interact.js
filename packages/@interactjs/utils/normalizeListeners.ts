import type { EventTypes, Listener, ListenersArg } from '@interactjs/core/types'

import is from './is'

export interface NormalizedListeners {
  [type: string]: Listener[]
}

export default function normalize(
  type: EventTypes,
  listeners?: ListenersArg | ListenersArg[] | null,
  filter = (_typeOrPrefix: string) => true,
  result?: NormalizedListeners,
): NormalizedListeners {
  result = result || {}

  if (is.string(type) && type.search(' ') !== -1) {
    type = split(type)
  }

  if (is.array(type)) {
    type.forEach((t) => normalize(t, listeners, filter, result))
    return result
  }

  // before:  type = [{ drag: () => {} }], listeners = undefined
  // after:   type = ''                  , listeners = [{ drag: () => {} }]
  if (is.object(type)) {
    listeners = type
    type = ''
  }

  if (is.func(listeners) && filter(type)) {
    result[type] = result[type] || []
    result[type].push(listeners)
  } else if (is.array(listeners)) {
    for (const l of listeners) {
      normalize(type, l, filter, result)
    }
  } else if (is.object(listeners)) {
    for (const prefix in listeners) {
      const combinedTypes = split(prefix).map((p) => `${type}${p}`)

      normalize(combinedTypes, listeners[prefix], filter, result)
    }
  }

  return result as NormalizedListeners
}

function split(type: string) {
  return type.trim().split(/ +/)
}
