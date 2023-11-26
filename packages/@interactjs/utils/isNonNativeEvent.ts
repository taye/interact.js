import type { Actions } from '@interactjs/core/types'

export default function isNonNativeEvent(type: string, actions: Actions) {
  if (actions.phaselessTypes[type]) {
    return true
  }

  for (const name in actions.map) {
    if (type.indexOf(name) === 0 && type.substr(name.length) in actions.phases) {
      return true
    }
  }

  return false
}
