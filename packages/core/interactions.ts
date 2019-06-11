import browser from '@interactjs/utils/browser'
import domObjects from '@interactjs/utils/domObjects'
import { nodeContains } from '@interactjs/utils/domUtils'
import events from '@interactjs/utils/events'
import pointerUtils from '@interactjs/utils/pointerUtils'
import Signals from '@interactjs/utils/Signals'
import InteractionBase from './Interaction'
import finder, { SearchDetails } from './interactionFinder'
import { Scope } from './scope'

declare module '@interactjs/core/scope' {
  interface Scope {
    Interaction: typeof InteractionBase
    interactions: {
      signals: Signals
      new: (options: any) => InteractionBase
      list: InteractionBase[]
      listeners: { [type: string]: Interact.Listener }
      docEvents: Array<{ type: string, listener: Interact.Listener }>
      pointerMoveTolerance: number
    }
    prevTouchTime: number
  }
}

const methodNames = [
  'pointerDown', 'pointerMove', 'pointerUp',
  'updatePointer', 'removePointer', 'windowBlur',
]

function install (scope: Scope) {
  const signals = new Signals()

  const listeners = {} as any

  for (const method of methodNames) {
    listeners[method] = doOnInteractions(method, scope)
  }

  const pEventTypes = browser.pEventTypes
  let docEvents: typeof scope.interactions.docEvents

  if (domObjects.PointerEvent) {
    docEvents = [
      { type: pEventTypes.down,   listener: releasePointersOnRemovedEls },
      { type: pEventTypes.down,   listener: listeners.pointerDown },
      { type: pEventTypes.move,   listener: listeners.pointerMove },
      { type: pEventTypes.up,     listener: listeners.pointerUp },
      { type: pEventTypes.cancel, listener: listeners.pointerUp },
    ]
  }
  else {
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
    listener (event) {
      for (const interaction of scope.interactions.list) {
        interaction.documentBlur(event)
      }
    },
  })

  scope.signals.on('add-document', onDocSignal)
  scope.signals.on('remove-document', onDocSignal)

  // for ignoring browser's simulated mouse events
  scope.prevTouchTime = 0

  scope.Interaction = class Interaction extends InteractionBase {
    get pointerMoveTolerance () {
      return scope.interactions.pointerMoveTolerance
    }

    set pointerMoveTolerance (value) {
      scope.interactions.pointerMoveTolerance = value
    }

    _now () { return scope.now() }
  }

  scope.interactions = {
    signals,
    // all active and idle interactions
    list: [],
    new (options: { pointerType?: string, signals?: Signals }) {
      options.signals = signals

      const interaction = new scope.Interaction(options as Required<typeof options>)

      scope.interactions.list.push(interaction)
      return interaction
    },
    listeners,
    docEvents,
    pointerMoveTolerance: 1,
  }

  function releasePointersOnRemovedEls () {
    // for all inactive touch interactions with pointers down
    for (const interaction of scope.interactions.list) {
      if (!interaction.pointerIsDown ||
        interaction.pointerType !== 'touch' ||
        interaction._interacting) {
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
}

function doOnInteractions (method, scope) {
  return function (event) {
    const interactions = scope.interactions.list

    const pointerType = pointerUtils.getPointerType(event)
    const [eventTarget, curEventTarget] = pointerUtils.getEventTargets(event)
    const matches = [] // [ [pointer, interaction], ...]

    if (/^touch/.test(event.type)) {
      scope.prevTouchTime = scope.now()

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
    }
    else {
      let invalidPointer = false

      if (!browser.supportsPointerEvent && /mouse/.test(event.type)) {
        // ignore mouse events while touch interactions are active
        for (let i = 0; i < interactions.length && !invalidPointer; i++) {
          invalidPointer = interactions[i].pointerType !== 'mouse' && interactions[i].pointerIsDown
        }

        // try to ignore mouse events that are simulated by the browser
        // after a touch event
        invalidPointer = invalidPointer ||
          (scope.now() - scope.prevTouchTime < 500) ||
          // on iOS and Firefox Mobile, MouseEvent.timeStamp is zero if simulated
          event.timeStamp === 0
      }

      if (!invalidPointer) {
        const searchDetails = {
          pointer: event,
          pointerId: pointerUtils.getPointerId(event),
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

function getInteraction (searchDetails: SearchDetails) {
  const { pointerType, scope } = searchDetails

  const foundInteraction = finder.search(searchDetails)
  const signalArg = { interaction: foundInteraction, searchDetails }

  scope.interactions.signals.fire('find', signalArg)

  return signalArg.interaction || scope.interactions.new({ pointerType })
}

function onDocSignal ({ doc, scope, options }, signalName) {
  const { docEvents } = scope.interactions
  const eventMethod = signalName.indexOf('add') === 0
    ? events.add : events.remove

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

export default {
  id: 'core/interactions',
  install,
  onDocSignal,
  doOnInteractions,
  methodNames,
}
