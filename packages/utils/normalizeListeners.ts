import extend from './extend'
import * as is from './is'

export interface NormalizedListeners {
  [type: string]: Interact.Listener[]
}

export default function normalize (
  type: Interact.EventTypes,
  listeners?: Interact.ListenersArg | Interact.ListenersArg[],
  result?: NormalizedListeners,
): NormalizedListeners {
  result = result || {}

  if (is.string(type) && type.search(' ') !== -1) {
    type = split(type)
  }

  if (is.array(type)) {
    return type.reduce<NormalizedListeners>(
      (acc, t) => extend(acc, normalize(t, listeners, result)),
      result
    )
  }

  // ({ type: fn }) -> ('', { type: fn })
  if (is.object(type)) {
    listeners = type
    type = ''
  }

  if (is.func(listeners)) {
    result[type] = result[type] || []
    result[type].push(listeners)
  }
  else if (is.array(listeners)) {
    for (const l of listeners) {
      normalize(type, l, result)
    }
  }
  else if (is.object(listeners)) {
    for (const prefix in listeners) {
      const combinedTypes = split(prefix).map((p) => `${type}${p}`)

      normalize(combinedTypes, listeners[prefix], result)
    }
  }

  return result as NormalizedListeners
}

function split (type: string) {
  return type.trim().split(/ +/)
}
