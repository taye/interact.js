import browser from '@interactjs/utils/browser'
import domObjects from '@interactjs/utils/domObjects'
import { nodeContains } from '@interactjs/utils/domUtils'
import * as pointerUtils from '@interactjs/utils/pointerUtils'

import type { Scope, SignalArgs, Plugin } from '@interactjs/core/scope'
import type { ActionName, Listener } from '@interactjs/core/types'

/* eslint-disable import/no-duplicates -- for typescript module augmentations */
import './interactablePreventDefault'
import interactablePreventDefault from './interactablePreventDefault'
import InteractionBase from './Interaction'
/* eslint-enable import/no-duplicates */
import type { SearchDetails } from './interactionFinder'
import finder from './interactionFinder'

declare module '@interactjs/core/scope' {
  interface Scope {
    Interaction: typeof InteractionBase
    interactions: {
      new: <T extends ActionName>(options: any) => InteractionBase<T>
      list: Array<InteractionBase<ActionName>>
      listeners: { [type: string]: Listener }
      docEvents: Array<{ type: string; listener: Listener }>
      pointerMoveTolerance: number
    }
    prevTouchTime: number
  }

  interface SignalArgs {
    'interactions:find': {
      interaction: InteractionBase
      searchDetails: SearchDetails
    }
  }
}

const methodNames = [
  'pointerDown',
  'pointerMove',
  'pointerUp',
  'updatePointer',
  'removePointer',
  'windowBlur',
]

function install(scope: Scope) {
  const listeners = {} as any

  for (const method of methodNames) {
    listeners[method] = doOnInteractions(method, scope)
  }

  const pEventTypes = browser.pEventTypes
  let docEvents: typeof scope.interactions.docEvents

  if (domObjects.PointerEvent) {
    docEvents = [
      { type: pEventTypes.down, listener: releasePointersOnRemovedEls },
      { type: pEventTypes.down, listener: listeners.pointerDown },
      { type: pEventTypes.move, listener: listeners.pointerMove },
      { type: pEventTypes.up, listener: listeners.pointerUp },
      { type: pEventTypes.cancel, listener: listeners.pointerUp },
    ]
  } else {
    docEvents = [
      { type: 'mousedown', listener: listeners.pointerDown },
      { type: 'mousemove', listener: listeners.pointerMove },
      { type: 'mouseup', listener: listeners.pointerUp },

      { type: 'touchstart', listener: releasePointersOnRemovedEls },
      { type: 'touchstart', listener: listeners.pointerDown },
      { type: 'touchmove', listener: listeners.pointerMove },
      { type: 'touchend', listener: listeners.pointerUp },
      { type: 'touchcancel', listener: listeners.pointerUp },
    ]
  }

  docEvents.push({
    type: 'blur',
    listener(event) {
      for (const interaction of scope.interactions.list) {
        interaction.documentBlur(event)
      }
    },
  })

  // for ignoring browser's simulated mouse events
  scope.prevTouchTime = 0

  scope.Interaction = class<T extends ActionName> extends InteractionBase<T> {
    get pointerMoveTolerance() {
      return scope.interactions.pointerMoveTolerance
    }

    set pointerMoveTolerance(value) {
      scope.interactions.pointerMoveTolerance = value
    }

    _now() {
      return scope.now()
    }
  }

  scope.interactions = {
    // all active and idle interactions
    list: [],
    new<T extends ActionName>(options: { pointerType?: string; scopeFire?: Scope['fire'] }) {
      options.scopeFire = (name, arg) => scope.fire(name, arg)

      const interaction = new scope.Interaction<T>(options as Required<typeof options>)

      scope.interactions.list.push(interaction)
      return interaction
    },
    listeners,
    docEvents,
    pointerMoveTolerance: 1,
  }

  function releasePointersOnRemovedEls() {
    // for all inactive touch interactions with pointers down
    for (const interaction of scope.interactions.list) {
      if (!interaction.pointerIsDown || interaction.pointerType !== 'touch' || interaction._interacting) {
        continue
      }

      // if a pointer is down on an element that is no longer in the DOM tree
      for (const pointer of interaction.pointers) {
        if (!scope.documents.some(({ doc }) => nodeContains(doc, pointer.downTarget))) {
          // remove the pointer from the interaction
          interaction.removePointer(pointer.pointer, pointer.event)
        }
      }
    }
  }

  scope.usePlugin(interactablePreventDefault)
}

function doOnInteractions(method: string, scope: Scope) {
  return function (event: Event) {
    const interactions = scope.interactions.list

    const pointerType = pointerUtils.getPointerType(event)
    const [eventTarget, curEventTarget] = pointerUtils.getEventTargets(event)
    const matches: any[] = [] // [ [pointer, interaction], ...]

    if (/^touch/.test(event.type)) {
      scope.prevTouchTime = scope.now()

      // @ts-expect-error
      for (const changedTouch of event.changedTouches) {
        const pointer = changedTouch
        const pointerId = pointerUtils.getPointerId(pointer)
        const searchDetails: SearchDetails = {
          pointer,
          pointerId,
          pointerType,
          eventType: event.type,
          eventTarget,
          curEventTarget,
          scope,
        }
        const interaction = getInteraction(searchDetails)

        matches.push([
          searchDetails.pointer,
          searchDetails.eventTarget,
          searchDetails.curEventTarget,
          interaction,
        ])
      }
    } else {
      let invalidPointer = false

      if (!browser.supportsPointerEvent && /mouse/.test(event.type)) {
        // ignore mouse events while touch interactions are active
        for (let i = 0; i < interactions.length && !invalidPointer; i++) {
          invalidPointer = interactions[i].pointerType !== 'mouse' && interactions[i].pointerIsDown
        }

        // try to ignore mouse events that are simulated by the browser
        // after a touch event
        invalidPointer =
          invalidPointer ||
          scope.now() - scope.prevTouchTime < 500 ||
          // on iOS and Firefox Mobile, MouseEvent.timeStamp is zero if simulated
          event.timeStamp === 0
      }

      if (!invalidPointer) {
        const searchDetails = {
          pointer: event as PointerEvent,
          pointerId: pointerUtils.getPointerId(event as PointerEvent),
          pointerType,
          eventType: event.type,
          curEventTarget,
          eventTarget,
          scope,
        }

        const interaction = getInteraction(searchDetails)

        matches.push([
          searchDetails.pointer,
          searchDetails.eventTarget,
          searchDetails.curEventTarget,
          interaction,
        ])
      }
    }

    // eslint-disable-next-line no-shadow
    for (const [pointer, eventTarget, curEventTarget, interaction] of matches) {
      interaction[method](pointer, event, eventTarget, curEventTarget)
    }
  }
}

function getInteraction(searchDetails: SearchDetails) {
  const { pointerType, scope } = searchDetails

  const foundInteraction = finder.search(searchDetails)
  const signalArg = { interaction: foundInteraction, searchDetails }

  scope.fire('interactions:find', signalArg)

  return signalArg.interaction || scope.interactions.new({ pointerType })
}

function onDocSignal<T extends 'scope:add-document' | 'scope:remove-document'>(
  { doc, scope, options }: SignalArgs[T],
  eventMethodName: 'add' | 'remove',
) {
  const {
    interactions: { docEvents },
    events,
  } = scope
  const eventMethod = events[eventMethodName]

  if (scope.browser.isIOS && !options.events) {
    options.events = { passive: false }
  }

  // delegate event listener
  for (const eventType in events.delegatedEvents) {
    eventMethod(doc, eventType, events.delegateListener)
    eventMethod(doc, eventType, events.delegateUseCapture, true)
  }

  const eventOptions = options && options.events

  for (const { type, listener } of docEvents) {
    eventMethod(doc, type, listener, eventOptions)
  }
}

const interactions: Plugin = {
  id: 'core/interactions',
  install,
  listeners: {
    'scope:add-document': (arg) => onDocSignal(arg, 'add'),
    'scope:remove-document': (arg) => onDocSignal(arg, 'remove'),
    'interactable:unset': ({ interactable }, scope) => {
      // Stop and destroy related interactions when an Interactable is unset
      for (let i = scope.interactions.list.length - 1; i >= 0; i--) {
        const interaction = scope.interactions.list[i]

        if (interaction.interactable !== interactable) {
          continue
        }

        interaction.stop()
        scope.fire('interactions:destroy', { interaction })
        interaction.destroy()

        if (scope.interactions.list.length > 2) {
          scope.interactions.list.splice(i, 1)
        }
      }
    },
  },
  onDocSignal,
  doOnInteractions,
  methodNames,
}

export default interactions
