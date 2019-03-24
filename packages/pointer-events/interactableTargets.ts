import { Scope } from '@interactjs/core/scope'
import { merge } from '@interactjs/utils/arr'
import extend from '@interactjs/utils/extend'
import * as is from '@interactjs/utils/is'
type Interactable = import ('@interactjs/core/Interactable').default

declare module '@interactjs/core/Interactable' {
  interface Interactable {
    pointerEvents: typeof pointerEventsMethod
    __backCompatOption: (optionName: string, newValue: any) => any
  }
}

function install (scope: Scope) {
  const {
    pointerEvents,
    actions,
    Interactable,
    interactables,
  } = scope

  pointerEvents.signals.on('collect-targets', ({ targets, element, type, eventTarget }: any) => {
    scope.interactables.forEachMatch(element, (interactable: Interactable) => {
      const eventable = interactable.events
      const options = eventable.options

      if (
        eventable.types[type] &&
        eventable.types[type].length &&
        is.element(element) &&
        interactable.testIgnoreAllow(options, element, eventTarget)) {
        targets.push({
          element,
          eventable,
          props: { interactable },
        })
      }
    })
  })

  interactables.signals.on('new', ({ interactable }) => {
    interactable.events.getRect = function (element: Element) {
      return interactable.getRect(element)
    }
  })

  interactables.signals.on('set', ({ interactable, options }) => {
    extend(interactable.events.options, pointerEvents.defaults)
    extend(interactable.events.options, options.pointerEvents || {})
  })

  merge(actions.eventTypes, pointerEvents.types)

  Interactable.prototype.pointerEvents = pointerEventsMethod

  const __backCompatOption = Interactable.prototype._backCompatOption

  Interactable.prototype._backCompatOption = function (optionName, newValue) {
    const ret = __backCompatOption.call(this, optionName, newValue)

    if (ret === this) {
      this.events.options[optionName] = newValue
    }

    return ret
  }
}

function pointerEventsMethod (this: Interactable, options: any) {
  extend(this.events.options, options)

  return this
}

export default {
  id: 'pointer-events/interactableTargets',
  install,
}
