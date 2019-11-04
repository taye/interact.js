import { Scope } from '@interactjs/core/scope'
import { merge } from '@interactjs/utils/arr'
import extend from '@interactjs/utils/extend'

type Interactable = import ('@interactjs/core/Interactable').default
type EventTargetList = import ('./base').EventTargetList

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
    signals,
  } = scope

  signals.addHandler({
    'pointerEvents:collect-targets': ({
      targets,
      node,
      type,
      eventTarget,
    }: {
      targets: EventTargetList
      node: Node
      type: string
      eventTarget: Interact.Element
    }) => {
      scope.interactables.forEachMatch(node, (interactable: Interactable) => {
        const eventable = interactable.events
        const options = eventable.options

        if (
          eventable.types[type] &&
          eventable.types[type].length &&
          interactable.testIgnoreAllow(options, node, eventTarget)) {
          targets.push({
            node,
            eventable,
            props: { interactable },
          })
        }
      })
    },

    'interactable:new': ({ interactable }) => {
      interactable.events.getRect = function (element: Interact.Element) {
        return interactable.getRect(element)
      }
    },

    'interactable:set': ({ interactable, options }) => {
      extend(interactable.events.options, pointerEvents.defaults)
      extend(interactable.events.options, options.pointerEvents || {})
    },
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
