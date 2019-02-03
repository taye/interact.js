import browser from '@interactjs/utils/browser';
import domObjects from '@interactjs/utils/domObjects';
import events from '@interactjs/utils/events';
import finder from '@interactjs/utils/interactionFinder';
import pointerUtils from '@interactjs/utils/pointerUtils';
import Signals from '@interactjs/utils/Signals';
import InteractionBase from './Interaction';
const methodNames = [
    'pointerDown', 'pointerMove', 'pointerUp',
    'updatePointer', 'removePointer', 'windowBlur',
];
function install(scope) {
    const signals = new Signals();
    const listeners = {};
    for (const method of methodNames) {
        listeners[method] = doOnInteractions(method, scope);
    }
    const pEventTypes = browser.pEventTypes;
    const eventMap = {};
    if (domObjects.PointerEvent) {
        eventMap[pEventTypes.down] = listeners.pointerDown;
        eventMap[pEventTypes.move] = listeners.pointerMove;
        eventMap[pEventTypes.up] = listeners.pointerUp;
        eventMap[pEventTypes.cancel] = listeners.pointerUp;
    }
    else {
        eventMap.mousedown = listeners.pointerDown;
        eventMap.mousemove = listeners.pointerMove;
        eventMap.mouseup = listeners.pointerUp;
        eventMap.touchstart = listeners.pointerDown;
        eventMap.touchmove = listeners.pointerMove;
        eventMap.touchend = listeners.pointerUp;
        eventMap.touchcancel = listeners.pointerUp;
    }
    eventMap.blur = (event) => {
        for (const interaction of scope.interactions.list) {
            interaction.documentBlur(event);
        }
    };
    scope.signals.on('add-document', onDocSignal);
    scope.signals.on('remove-document', onDocSignal);
    // for ignoring browser's simulated mouse events
    scope.prevTouchTime = 0;
    scope.Interaction = class Interaction extends InteractionBase {
        get pointerMoveTolerance() {
            return scope.interactions.pointerMoveTolerance;
        }
        set pointerMoveTolerance(value) {
            scope.interactions.pointerMoveTolerance = value;
        }
    };
    scope.interactions = {
        signals,
        // all active and idle interactions
        list: [],
        new(options) {
            options.signals = signals;
            return new scope.Interaction(options);
        },
        listeners,
        eventMap,
        pointerMoveTolerance: 1,
    };
    scope.actions = {
        names: [],
        methodDict: {},
        eventTypes: [],
    };
}
function doOnInteractions(method, scope) {
    return function (event) {
        const interactions = scope.interactions.list;
        const pointerType = pointerUtils.getPointerType(event);
        const [eventTarget, curEventTarget] = pointerUtils.getEventTargets(event);
        const matches = []; // [ [pointer, interaction], ...]
        if (browser.supportsTouch && /touch/.test(event.type)) {
            scope.prevTouchTime = new Date().getTime();
            for (const changedTouch of event.changedTouches) {
                const pointer = changedTouch;
                const pointerId = pointerUtils.getPointerId(pointer);
                const searchDetails = {
                    pointer,
                    pointerId,
                    pointerType,
                    eventType: event.type,
                    eventTarget,
                    curEventTarget,
                    scope,
                };
                const interaction = getInteraction(searchDetails);
                matches.push([
                    searchDetails.pointer,
                    searchDetails.eventTarget,
                    searchDetails.curEventTarget,
                    interaction,
                ]);
            }
        }
        else {
            let invalidPointer = false;
            if (!browser.supportsPointerEvent && /mouse/.test(event.type)) {
                // ignore mouse events while touch interactions are active
                for (let i = 0; i < interactions.length && !invalidPointer; i++) {
                    invalidPointer = interactions[i].pointerType !== 'mouse' && interactions[i].pointerIsDown;
                }
                // try to ignore mouse events that are simulated by the browser
                // after a touch event
                invalidPointer = invalidPointer ||
                    (new Date().getTime() - scope.prevTouchTime < 500) ||
                    // on iOS and Firefox Mobile, MouseEvent.timeStamp is zero if simulated
                    event.timeStamp === 0;
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
                };
                const interaction = getInteraction(searchDetails);
                matches.push([
                    searchDetails.pointer,
                    searchDetails.eventTarget,
                    searchDetails.curEventTarget,
                    interaction,
                ]);
            }
        }
        // eslint-disable-next-line no-shadow
        for (const [pointer, eventTarget, curEventTarget, interaction] of matches) {
            interaction[method](pointer, event, eventTarget, curEventTarget);
        }
    };
}
function getInteraction(searchDetails) {
    const { pointerType, scope } = searchDetails;
    const foundInteraction = finder.search(searchDetails);
    const signalArg = { interaction: foundInteraction, searchDetails };
    scope.interactions.signals.fire('find', signalArg);
    return signalArg.interaction || newInteraction({ pointerType }, scope);
}
export function newInteraction(options, scope) {
    const interaction = scope.interactions.new(options);
    scope.interactions.list.push(interaction);
    return interaction;
}
function onDocSignal({ doc, scope, options }, signalName) {
    const { eventMap } = scope.interactions;
    const eventMethod = signalName.indexOf('add') === 0
        ? events.add : events.remove;
    if (scope.browser.isIOS && !options.events) {
        options.events = { passive: false };
    }
    // delegate event listener
    for (const eventType in events.delegatedEvents) {
        eventMethod(doc, eventType, events.delegateListener);
        eventMethod(doc, eventType, events.delegateUseCapture, true);
    }
    const eventOptions = options && options.events;
    for (const eventType in eventMap) {
        eventMethod(doc, eventType, eventMap[eventType], eventOptions);
    }
}
export default {
    install,
    onDocSignal,
    doOnInteractions,
    newInteraction,
    methodNames,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZXJhY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sT0FBTyxNQUFNLDJCQUEyQixDQUFBO0FBQy9DLE9BQU8sVUFBVSxNQUFNLDhCQUE4QixDQUFBO0FBQ3JELE9BQU8sTUFBTSxNQUFNLDBCQUEwQixDQUFBO0FBQzdDLE9BQU8sTUFBTSxNQUFNLHFDQUFxQyxDQUFBO0FBQ3hELE9BQU8sWUFBWSxNQUFNLGdDQUFnQyxDQUFBO0FBQ3pELE9BQU8sT0FBTyxNQUFNLDJCQUEyQixDQUFBO0FBQy9DLE9BQU8sZUFBZSxNQUFNLGVBQWUsQ0FBQTtBQXlCM0MsTUFBTSxXQUFXLEdBQUc7SUFDbEIsYUFBYSxFQUFFLGFBQWEsRUFBRSxXQUFXO0lBQ3pDLGVBQWUsRUFBRSxlQUFlLEVBQUUsWUFBWTtDQUMvQyxDQUFBO0FBRUQsU0FBUyxPQUFPLENBQUUsS0FBWTtJQUM1QixNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFBO0lBRTdCLE1BQU0sU0FBUyxHQUFHLEVBQVMsQ0FBQTtJQUUzQixLQUFLLE1BQU0sTUFBTSxJQUFJLFdBQVcsRUFBRTtRQUNoQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFBO0tBQ3BEO0lBRUQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQTtJQUN2QyxNQUFNLFFBQVEsR0FBRyxFQUEwQyxDQUFBO0lBRTNELElBQUksVUFBVSxDQUFDLFlBQVksRUFBRTtRQUMzQixRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBRyxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUE7UUFDcEQsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUcsR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFBO1FBQ3BELFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFLLEdB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LEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQTtLQUMvRDtBQUNILENBQUM7QUFFRCxlQUFlO0lBQ2IsT0FBTztJQUNQLFdBQVc7SUFDWCxnQkFBZ0I7SUFDaEIsY0FBYztJQUNkLFdBQVc7Q0FDWixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGJyb3dzZXIgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvYnJvd3NlcidcbmltcG9ydCBkb21PYmplY3RzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2RvbU9iamVjdHMnXG5pbXBvcnQgZXZlbnRzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2V2ZW50cydcbmltcG9ydCBmaW5kZXIgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvaW50ZXJhY3Rpb25GaW5kZXInXG5pbXBvcnQgcG9pbnRlclV0aWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL3BvaW50ZXJVdGlscydcbmltcG9ydCBTaWduYWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL1NpZ25hbHMnXG5pbXBvcnQgSW50ZXJhY3Rpb25CYXNlIGZyb20gJy4vSW50ZXJhY3Rpb24nXG5pbXBvcnQgeyBTY29wZSB9IGZyb20gJy4vc2NvcGUnXG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJyB7XG4gIGludGVyZmFjZSBTY29wZSB7XG4gICAgSW50ZXJhY3Rpb246IHR5cGVvZiBJbnRlcmFjdGlvbkJhc2VcbiAgICBpbnRlcmFjdGlvbnM6IHtcbiAgICAgIHNpZ25hbHM6IFNpZ25hbHNcbiAgICAgIG5ldzogKG9wdGlvbnM6IGFueSkgPT4gSW50ZXJhY3Rpb25CYXNlXG4gICAgICBsaXN0OiBJbnRlcmFjdGlvbkJhc2VbXVxuICAgICAgbGlzdGVuZXJzOiB7IFt0eXBlOiBzdHJpbmddOiBJbnRlcmFjdC5MaXN0ZW5lciB9XG4gICAgICBldmVudE1hcDogYW55XG4gICAgICBwb2ludGVyTW92ZVRvbGVyYW5jZTogbnVtYmVyXG4gICAgfVxuICAgIGFjdGlvbnM6IEFjdGlvbnNcbiAgICBwcmV2VG91Y2hUaW1lOiBudW1iZXJcbiAgfVxuXG4gIGludGVyZmFjZSBBY3Rpb25zIHtcbiAgICBuYW1lczogc3RyaW5nW11cbiAgICBtZXRob2REaWN0OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9XG4gICAgZXZlbnRUeXBlczogc3RyaW5nW11cbiAgfVxufVxuXG5jb25zdCBtZXRob2ROYW1lcyA9IFtcbiAgJ3BvaW50ZXJEb3duJywgJ3BvaW50ZXJNb3ZlJywgJ3BvaW50ZXJVcCcsXG4gICd1cGRhdGVQb2ludGVyJywgJ3JlbW92ZVBvaW50ZXInLCAnd2luZG93Qmx1cicsXG5dXG5cbmZ1bmN0aW9uIGluc3RhbGwgKHNjb3BlOiBTY29wZSkge1xuICBjb25zdCBzaWduYWxzID0gbmV3IFNpZ25hbHMoKVxuXG4gIGNvbnN0IGxpc3RlbmVycyA9IHt9IGFzIGFueVxuXG4gIGZvciAoY29uc3QgbWV0aG9kIG9mIG1ldGhvZE5hbWVzKSB7XG4gICAgbGlzdGVuZXJzW21ldGhvZF0gPSBkb09uSW50ZXJhY3Rpb25zKG1ldGhvZCwgc2NvcGUpXG4gIH1cblxuICBjb25zdCBwRXZlbnRUeXBlcyA9IGJyb3dzZXIucEV2ZW50VHlwZXNcbiAgY29uc3QgZXZlbnRNYXAgPSB7fSBhcyB7IFtrZXk6IHN0cmluZ106IEludGVyYWN0Lkxpc3RlbmVyIH1cblxuICBpZiAoZG9tT2JqZWN0cy5Qb2ludGVyRXZlbnQpIHtcbiAgICBldmVudE1hcFtwRXZlbnRUeXBlcy5kb3duICBdID0gbGlzdGVuZXJzLnBvaW50ZXJEb3duXG4gICAgZXZlbnRNYXBbcEV2ZW50VHlwZXMubW92ZSAgXSA9IGxpc3RlbmVycy5wb2ludGVyTW92ZVxuICAgIGV2ZW50TWFwW3BFdmVudFR5cGVzLnVwICAgIF0gPSBsaXN0ZW5lcnMucG9pbnRlclVwXG4gICAgZXZlbnRNYXBbcEV2ZW50VHlwZXMuY2FuY2VsXSA9IGxpc3RlbmVycy5wb2ludGVyVXBcbiAgfVxuICBlbHNlIHtcbiAgICBldmVudE1hcC5tb3VzZWRvd24gICA9IGxpc3RlbmVycy5wb2ludGVyRG93blxuICAgIGV2ZW50TWFwLm1vdXNlbW92ZSAgID0gbGlzdGVuZXJzLnBvaW50ZXJNb3ZlXG4gICAgZXZlbnRNYXAubW91c2V1cCAgICAgPSBsaXN0ZW5lcnMucG9pbnRlclVwXG5cbiAgICBldmVudE1hcC50b3VjaHN0YXJ0ICA9IGxpc3RlbmVycy5wb2ludGVyRG93blxuICAgIGV2ZW50TWFwLnRvdWNobW92ZSAgID0gbGlzdGVuZXJzLnBvaW50ZXJNb3ZlXG4gICAgZXZlbnRNYXAudG91Y2hlbmQgICAgPSBsaXN0ZW5lcnMucG9pbnRlclVwXG4gICAgZXZlbnRNYXAudG91Y2hjYW5jZWwgPSBsaXN0ZW5lcnMucG9pbnRlclVwXG4gIH1cblxuICBldmVudE1hcC5ibHVyID0gKGV2ZW50KSA9PiB7XG4gICAgZm9yIChjb25zdCBpbnRlcmFjdGlvbiBvZiBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCkge1xuICAgICAgaW50ZXJhY3Rpb24uZG9jdW1lbnRCbHVyKGV2ZW50KVxuICAgIH1cbiAgfVxuXG4gIHNjb3BlLnNpZ25hbHMub24oJ2FkZC1kb2N1bWVudCcsIG9uRG9jU2lnbmFsKVxuICBzY29wZS5zaWduYWxzLm9uKCdyZW1vdmUtZG9jdW1lbnQnLCBvbkRvY1NpZ25hbClcblxuICAvLyBmb3IgaWdub3JpbmcgYnJvd3NlcidzIHNpbXVsYXRlZCBtb3VzZSBldmVudHNcbiAgc2NvcGUucHJldlRvdWNoVGltZSA9IDBcblxuICBzY29wZS5JbnRlcmFjdGlvbiA9IGNsYXNzIEludGVyYWN0aW9uIGV4dGVuZHMgSW50ZXJhY3Rpb25CYXNlIHtcbiAgICBnZXQgcG9pbnRlck1vdmVUb2xlcmFuY2UgKCkge1xuICAgICAgcmV0dXJuIHNjb3BlLmludGVyYWN0aW9ucy5wb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgIH1cblxuICAgIHNldCBwb2ludGVyTW92ZVRvbGVyYW5jZSAodmFsdWUpIHtcbiAgICAgIHNjb3BlLmludGVyYWN0aW9ucy5wb2ludGVyTW92ZVRvbGVyYW5jZSA9IHZhbHVlXG4gICAgfVxuICB9XG4gIHNjb3BlLmludGVyYWN0aW9ucyA9IHtcbiAgICBzaWduYWxzLFxuICAgIC8vIGFsbCBhY3RpdmUgYW5kIGlkbGUgaW50ZXJhY3Rpb25zXG4gICAgbGlzdDogW10sXG4gICAgbmV3IChvcHRpb25zKSB7XG4gICAgICBvcHRpb25zLnNpZ25hbHMgPSBzaWduYWxzXG5cbiAgICAgIHJldHVybiBuZXcgc2NvcGUuSW50ZXJhY3Rpb24ob3B0aW9ucylcbiAgICB9LFxuICAgIGxpc3RlbmVycyxcbiAgICBldmVudE1hcCxcbiAgICBwb2ludGVyTW92ZVRvbGVyYW5jZTogMSxcbiAgfVxuXG4gIHNjb3BlLmFjdGlvbnMgPSB7XG4gICAgbmFtZXM6IFtdLFxuICAgIG1ldGhvZERpY3Q6IHt9LFxuICAgIGV2ZW50VHlwZXM6IFtdLFxuICB9XG59XG5cbmZ1bmN0aW9uIGRvT25JbnRlcmFjdGlvbnMgKG1ldGhvZCwgc2NvcGUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgIGNvbnN0IGludGVyYWN0aW9ucyA9IHNjb3BlLmludGVyYWN0aW9ucy5saXN0XG5cbiAgICBjb25zdCBwb2ludGVyVHlwZSA9IHBvaW50ZXJVdGlscy5nZXRQb2ludGVyVHlwZShldmVudClcbiAgICBjb25zdCBbZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0XSA9IHBvaW50ZXJVdGlscy5nZXRFdmVudFRhcmdldHMoZXZlbnQpXG4gICAgY29uc3QgbWF0Y2hlcyA9IFtdIC8vIFsgW3BvaW50ZXIsIGludGVyYWN0aW9uXSwgLi4uXVxuXG4gICAgaWYgKGJyb3dzZXIuc3VwcG9ydHNUb3VjaCAmJiAvdG91Y2gvLnRlc3QoZXZlbnQudHlwZSkpIHtcbiAgICAgIHNjb3BlLnByZXZUb3VjaFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuXG4gICAgICBmb3IgKGNvbnN0IGNoYW5nZWRUb3VjaCBvZiBldmVudC5jaGFuZ2VkVG91Y2hlcykge1xuICAgICAgICBjb25zdCBwb2ludGVyID0gY2hhbmdlZFRvdWNoXG4gICAgICAgIGNvbnN0IHBvaW50ZXJJZCA9IHBvaW50ZXJVdGlscy5nZXRQb2ludGVySWQocG9pbnRlcilcbiAgICAgICAgY29uc3Qgc2VhcmNoRGV0YWlscyA9IHtcbiAgICAgICAgICBwb2ludGVyLFxuICAgICAgICAgIHBvaW50ZXJJZCxcbiAgICAgICAgICBwb2ludGVyVHlwZSxcbiAgICAgICAgICBldmVudFR5cGU6IGV2ZW50LnR5cGUsXG4gICAgICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICAgICAgY3VyRXZlbnRUYXJnZXQsXG4gICAgICAgICAgc2NvcGUsXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW50ZXJhY3Rpb24gPSBnZXRJbnRlcmFjdGlvbihzZWFyY2hEZXRhaWxzKVxuXG4gICAgICAgIG1hdGNoZXMucHVzaChbXG4gICAgICAgICAgc2VhcmNoRGV0YWlscy5wb2ludGVyLFxuICAgICAgICAgIHNlYXJjaERldGFpbHMuZXZlbnRUYXJnZXQsXG4gICAgICAgICAgc2VhcmNoRGV0YWlscy5jdXJFdmVudFRhcmdldCxcbiAgICAgICAgICBpbnRlcmFjdGlvbixcbiAgICAgICAgXSlcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBsZXQgaW52YWxpZFBvaW50ZXIgPSBmYWxzZVxuXG4gICAgICBpZiAoIWJyb3dzZXIuc3VwcG9ydHNQb2ludGVyRXZlbnQgJiYgL21vdXNlLy50ZXN0KGV2ZW50LnR5cGUpKSB7XG4gICAgICAgIC8vIGlnbm9yZSBtb3VzZSBldmVudHMgd2hpbGUgdG91Y2ggaW50ZXJhY3Rpb25zIGFyZSBhY3RpdmVcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnRlcmFjdGlvbnMubGVuZ3RoICYmICFpbnZhbGlkUG9pbnRlcjsgaSsrKSB7XG4gICAgICAgICAgaW52YWxpZFBvaW50ZXIgPSBpbnRlcmFjdGlvbnNbaV0ucG9pbnRlclR5cGUgIT09ICdtb3VzZScgJiYgaW50ZXJhY3Rpb25zW2ldLnBvaW50ZXJJc0Rvd25cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRyeSB0byBpZ25vcmUgbW91c2UgZXZlbnRzIHRoYXQgYXJlIHNpbXVsYXRlZCBieSB0aGUgYnJvd3NlclxuICAgICAgICAvLyBhZnRlciBhIHRvdWNoIGV2ZW50XG4gICAgICAgIGludmFsaWRQb2ludGVyID0gaW52YWxpZFBvaW50ZXIgfHxcbiAgICAgICAgICAobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzY29wZS5wcmV2VG91Y2hUaW1lIDwgNTAwKSB8fFxuICAgICAgICAgIC8vIG9uIGlPUyBhbmQgRmlyZWZveCBNb2JpbGUsIE1vdXNlRXZlbnQudGltZVN0YW1wIGlzIHplcm8gaWYgc2ltdWxhdGVkXG4gICAgICAgICAgZXZlbnQudGltZVN0YW1wID09PSAwXG4gICAgICB9XG5cbiAgICAgIGlmICghaW52YWxpZFBvaW50ZXIpIHtcbiAgICAgICAgY29uc3Qgc2VhcmNoRGV0YWlscyA9IHtcbiAgICAgICAgICBwb2ludGVyOiBldmVudCxcbiAgICAgICAgICBwb2ludGVySWQ6IHBvaW50ZXJVdGlscy5nZXRQb2ludGVySWQoZXZlbnQpLFxuICAgICAgICAgIHBvaW50ZXJUeXBlLFxuICAgICAgICAgIGV2ZW50VHlwZTogZXZlbnQudHlwZSxcbiAgICAgICAgICBjdXJFdmVudFRhcmdldCxcbiAgICAgICAgICBldmVudFRhcmdldCxcbiAgICAgICAgICBzY29wZSxcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGludGVyYWN0aW9uID0gZ2V0SW50ZXJhY3Rpb24oc2VhcmNoRGV0YWlscylcblxuICAgICAgICBtYXRjaGVzLnB1c2goW1xuICAgICAgICAgIHNlYXJjaERldGFpbHMucG9pbnRlcixcbiAgICAgICAgICBzZWFyY2hEZXRhaWxzLmV2ZW50VGFyZ2V0LFxuICAgICAgICAgIHNlYXJjaERldGFpbHMuY3VyRXZlbnRUYXJnZXQsXG4gICAgICAgICAgaW50ZXJhY3Rpb24sXG4gICAgICAgIF0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNoYWRvd1xuICAgIGZvciAoY29uc3QgW3BvaW50ZXIsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCwgaW50ZXJhY3Rpb25dIG9mIG1hdGNoZXMpIHtcbiAgICAgIGludGVyYWN0aW9uW21ldGhvZF0ocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldClcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0SW50ZXJhY3Rpb24gKHNlYXJjaERldGFpbHMpIHtcbiAgY29uc3QgeyBwb2ludGVyVHlwZSwgc2NvcGUgfSA9IHNlYXJjaERldGFpbHNcblxuICBjb25zdCBmb3VuZEludGVyYWN0aW9uID0gZmluZGVyLnNlYXJjaChzZWFyY2hEZXRhaWxzKVxuICBjb25zdCBzaWduYWxBcmcgPSB7IGludGVyYWN0aW9uOiBmb3VuZEludGVyYWN0aW9uLCBzZWFyY2hEZXRhaWxzIH1cblxuICBzY29wZS5pbnRlcmFjdGlvbnMuc2lnbmFscy5maXJlKCdmaW5kJywgc2lnbmFsQXJnKVxuXG4gIHJldHVybiBzaWduYWxBcmcuaW50ZXJhY3Rpb24gfHwgbmV3SW50ZXJhY3Rpb24oeyBwb2ludGVyVHlwZSB9LCBzY29wZSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5ld0ludGVyYWN0aW9uIChvcHRpb25zLCBzY29wZSkge1xuICBjb25zdCBpbnRlcmFjdGlvbiA9IHNjb3BlLmludGVyYWN0aW9ucy5uZXcob3B0aW9ucylcblxuICBzY29wZS5pbnRlcmFjdGlvbnMubGlzdC5wdXNoKGludGVyYWN0aW9uKVxuICByZXR1cm4gaW50ZXJhY3Rpb25cbn1cblxuZnVuY3Rpb24gb25Eb2NTaWduYWwgKHsgZG9jLCBzY29wZSwgb3B0aW9ucyB9LCBzaWduYWxOYW1lKSB7XG4gIGNvbnN0IHsgZXZlbnRNYXAgfSA9IHNjb3BlLmludGVyYWN0aW9uc1xuICBjb25zdCBldmVudE1ldGhvZCA9IHNpZ25hbE5hbWUuaW5kZXhPZignYWRkJykgPT09IDBcbiAgICA/IGV2ZW50cy5hZGQgOiBldmVudHMucmVtb3ZlXG5cbiAgaWYgKHNjb3BlLmJyb3dzZXIuaXNJT1MgJiYgIW9wdGlvbnMuZXZlbnRzKSB7XG4gICAgb3B0aW9ucy5ldmVudHMgPSB7IHBhc3NpdmU6IGZhbHNlIH1cbiAgfVxuXG4gIC8vIGRlbGVnYXRlIGV2ZW50IGxpc3RlbmVyXG4gIGZvciAoY29uc3QgZXZlbnRUeXBlIGluIGV2ZW50cy5kZWxlZ2F0ZWRFdmVudHMpIHtcbiAgICBldmVudE1ldGhvZChkb2MsIGV2ZW50VHlwZSwgZXZlbnRzLmRlbGVnYXRlTGlzdGVuZXIpXG4gICAgZXZlbnRNZXRob2QoZG9jLCBldmVudFR5cGUsIGV2ZW50cy5kZWxlZ2F0ZVVzZUNhcHR1cmUsIHRydWUpXG4gIH1cblxuICBjb25zdCBldmVudE9wdGlvbnMgPSBvcHRpb25zICYmIG9wdGlvbnMuZXZlbnRzXG5cbiAgZm9yIChjb25zdCBldmVudFR5cGUgaW4gZXZlbnRNYXApIHtcbiAgICBldmVudE1ldGhvZChkb2MsIGV2ZW50VHlwZSwgZXZlbnRNYXBbZXZlbnRUeXBlXSwgZXZlbnRPcHRpb25zKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgaW5zdGFsbCxcbiAgb25Eb2NTaWduYWwsXG4gIGRvT25JbnRlcmFjdGlvbnMsXG4gIG5ld0ludGVyYWN0aW9uLFxuICBtZXRob2ROYW1lcyxcbn1cbiJdfQ==