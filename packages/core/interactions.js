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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZXJhY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sT0FBTyxNQUFNLDJCQUEyQixDQUFBO0FBQy9DLE9BQU8sVUFBVSxNQUFNLDhCQUE4QixDQUFBO0FBQ3JELE9BQU8sTUFBTSxNQUFNLDBCQUEwQixDQUFBO0FBQzdDLE9BQU8sTUFBeUIsTUFBTSxxQ0FBcUMsQ0FBQTtBQUMzRSxPQUFPLFlBQVksTUFBTSxnQ0FBZ0MsQ0FBQTtBQUN6RCxPQUFPLE9BQU8sTUFBTSwyQkFBMkIsQ0FBQTtBQUMvQyxPQUFPLGVBQWUsTUFBTSxlQUFlLENBQUE7QUFrQjNDLE1BQU0sV0FBVyxHQUFHO0lBQ2xCLGFBQWEsRUFBRSxhQUFhLEVBQUUsV0FBVztJQUN6QyxlQUFlLEVBQUUsZUFBZSxFQUFFLFlBQVk7Q0FDL0MsQ0FBQTtBQUVELFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQTtJQUU3QixNQUFNLFNBQVMsR0FBRyxFQUFTLENBQUE7SUFFM0IsS0FBSyxNQUFNLE1BQU0sSUFBSSxXQUFXLEVBQUU7UUFDaEMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQTtLQUNwRDtJQUVELE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUE7SUFDdkMsTUFBTSxRQUFRLEdBQUcsRUFBMEMsQ0FBQTtJQUUzRCxJQUFJLFVBQVUsQ0FBQyxZQUFZLEVBQUU7UUFDM0IsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUcsR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFBO1FBQ3BELFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFHLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBQTtRQUNwRCxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBSyxH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QU87SUFDUCxXQUFXO0lBQ1gsZ0JBQWdCO0lBQ2hCLGNBQWM7SUFDZCxXQUFXO0NBQ1osQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBicm93c2VyIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2Jyb3dzZXInXG5pbXBvcnQgZG9tT2JqZWN0cyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9kb21PYmplY3RzJ1xuaW1wb3J0IGV2ZW50cyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9ldmVudHMnXG5pbXBvcnQgZmluZGVyLCB7IFNlYXJjaERldGFpbHMgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9pbnRlcmFjdGlvbkZpbmRlcidcbmltcG9ydCBwb2ludGVyVXRpbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvcG9pbnRlclV0aWxzJ1xuaW1wb3J0IFNpZ25hbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvU2lnbmFscydcbmltcG9ydCBJbnRlcmFjdGlvbkJhc2UgZnJvbSAnLi9JbnRlcmFjdGlvbidcbmltcG9ydCB7IFNjb3BlIH0gZnJvbSAnLi9zY29wZSdcblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnIHtcbiAgaW50ZXJmYWNlIFNjb3BlIHtcbiAgICBJbnRlcmFjdGlvbjogdHlwZW9mIEludGVyYWN0aW9uQmFzZVxuICAgIGludGVyYWN0aW9uczoge1xuICAgICAgc2lnbmFsczogU2lnbmFsc1xuICAgICAgbmV3OiAob3B0aW9uczogYW55KSA9PiBJbnRlcmFjdGlvbkJhc2VcbiAgICAgIGxpc3Q6IEludGVyYWN0aW9uQmFzZVtdXG4gICAgICBsaXN0ZW5lcnM6IHsgW3R5cGU6IHN0cmluZ106IEludGVyYWN0Lkxpc3RlbmVyIH1cbiAgICAgIGV2ZW50TWFwOiBhbnlcbiAgICAgIHBvaW50ZXJNb3ZlVG9sZXJhbmNlOiBudW1iZXJcbiAgICB9XG4gICAgcHJldlRvdWNoVGltZTogbnVtYmVyXG4gIH1cbn1cblxuY29uc3QgbWV0aG9kTmFtZXMgPSBbXG4gICdwb2ludGVyRG93bicsICdwb2ludGVyTW92ZScsICdwb2ludGVyVXAnLFxuICAndXBkYXRlUG9pbnRlcicsICdyZW1vdmVQb2ludGVyJywgJ3dpbmRvd0JsdXInLFxuXVxuXG5mdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qgc2lnbmFscyA9IG5ldyBTaWduYWxzKClcblxuICBjb25zdCBsaXN0ZW5lcnMgPSB7fSBhcyBhbnlcblxuICBmb3IgKGNvbnN0IG1ldGhvZCBvZiBtZXRob2ROYW1lcykge1xuICAgIGxpc3RlbmVyc1ttZXRob2RdID0gZG9PbkludGVyYWN0aW9ucyhtZXRob2QsIHNjb3BlKVxuICB9XG5cbiAgY29uc3QgcEV2ZW50VHlwZXMgPSBicm93c2VyLnBFdmVudFR5cGVzXG4gIGNvbnN0IGV2ZW50TWFwID0ge30gYXMgeyBba2V5OiBzdHJpbmddOiBJbnRlcmFjdC5MaXN0ZW5lciB9XG5cbiAgaWYgKGRvbU9iamVjdHMuUG9pbnRlckV2ZW50KSB7XG4gICAgZXZlbnRNYXBbcEV2ZW50VHlwZXMuZG93biAgXSA9IGxpc3RlbmVycy5wb2ludGVyRG93blxuICAgIGV2ZW50TWFwW3BFdmVudFR5cGVzLm1vdmUgIF0gPSBsaXN0ZW5lcnMucG9pbnRlck1vdmVcbiAgICBldmVudE1hcFtwRXZlbnRUeXBlcy51cCAgICBdID0gbGlzdGVuZXJzLnBvaW50ZXJVcFxuICAgIGV2ZW50TWFwW3BFdmVudFR5cGVzLmNhbmNlbF0gPSBsaXN0ZW5lcnMucG9pbnRlclVwXG4gIH1cbiAgZWxzZSB7XG4gICAgZXZlbnRNYXAubW91c2Vkb3duICAgPSBsaXN0ZW5lcnMucG9pbnRlckRvd25cbiAgICBldmVudE1hcC5tb3VzZW1vdmUgICA9IGxpc3RlbmVycy5wb2ludGVyTW92ZVxuICAgIGV2ZW50TWFwLm1vdXNldXAgICAgID0gbGlzdGVuZXJzLnBvaW50ZXJVcFxuXG4gICAgZXZlbnRNYXAudG91Y2hzdGFydCAgPSBsaXN0ZW5lcnMucG9pbnRlckRvd25cbiAgICBldmVudE1hcC50b3VjaG1vdmUgICA9IGxpc3RlbmVycy5wb2ludGVyTW92ZVxuICAgIGV2ZW50TWFwLnRvdWNoZW5kICAgID0gbGlzdGVuZXJzLnBvaW50ZXJVcFxuICAgIGV2ZW50TWFwLnRvdWNoY2FuY2VsID0gbGlzdGVuZXJzLnBvaW50ZXJVcFxuICB9XG5cbiAgZXZlbnRNYXAuYmx1ciA9IChldmVudCkgPT4ge1xuICAgIGZvciAoY29uc3QgaW50ZXJhY3Rpb24gb2Ygc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QpIHtcbiAgICAgIGludGVyYWN0aW9uLmRvY3VtZW50Qmx1cihldmVudClcbiAgICB9XG4gIH1cblxuICBzY29wZS5zaWduYWxzLm9uKCdhZGQtZG9jdW1lbnQnLCBvbkRvY1NpZ25hbClcbiAgc2NvcGUuc2lnbmFscy5vbigncmVtb3ZlLWRvY3VtZW50Jywgb25Eb2NTaWduYWwpXG5cbiAgLy8gZm9yIGlnbm9yaW5nIGJyb3dzZXIncyBzaW11bGF0ZWQgbW91c2UgZXZlbnRzXG4gIHNjb3BlLnByZXZUb3VjaFRpbWUgPSAwXG5cbiAgc2NvcGUuSW50ZXJhY3Rpb24gPSBjbGFzcyBJbnRlcmFjdGlvbiBleHRlbmRzIEludGVyYWN0aW9uQmFzZSB7XG4gICAgZ2V0IHBvaW50ZXJNb3ZlVG9sZXJhbmNlICgpIHtcbiAgICAgIHJldHVybiBzY29wZS5pbnRlcmFjdGlvbnMucG9pbnRlck1vdmVUb2xlcmFuY2VcbiAgICB9XG5cbiAgICBzZXQgcG9pbnRlck1vdmVUb2xlcmFuY2UgKHZhbHVlKSB7XG4gICAgICBzY29wZS5pbnRlcmFjdGlvbnMucG9pbnRlck1vdmVUb2xlcmFuY2UgPSB2YWx1ZVxuICAgIH1cbiAgfVxuICBzY29wZS5pbnRlcmFjdGlvbnMgPSB7XG4gICAgc2lnbmFscyxcbiAgICAvLyBhbGwgYWN0aXZlIGFuZCBpZGxlIGludGVyYWN0aW9uc1xuICAgIGxpc3Q6IFtdLFxuICAgIG5ldyAob3B0aW9uczogeyBwb2ludGVyVHlwZT86IHN0cmluZywgc2lnbmFscz86IFNpZ25hbHMgfSkge1xuICAgICAgb3B0aW9ucy5zaWduYWxzID0gc2lnbmFsc1xuXG4gICAgICByZXR1cm4gbmV3IHNjb3BlLkludGVyYWN0aW9uKG9wdGlvbnMgYXMgUmVxdWlyZWQ8dHlwZW9mIG9wdGlvbnM+KVxuICAgIH0sXG4gICAgbGlzdGVuZXJzLFxuICAgIGV2ZW50TWFwLFxuICAgIHBvaW50ZXJNb3ZlVG9sZXJhbmNlOiAxLFxuICB9XG59XG5cbmZ1bmN0aW9uIGRvT25JbnRlcmFjdGlvbnMgKG1ldGhvZCwgc2NvcGUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChldmVudCkge1xuICAgIGNvbnN0IGludGVyYWN0aW9ucyA9IHNjb3BlLmludGVyYWN0aW9ucy5saXN0XG5cbiAgICBjb25zdCBwb2ludGVyVHlwZSA9IHBvaW50ZXJVdGlscy5nZXRQb2ludGVyVHlwZShldmVudClcbiAgICBjb25zdCBbZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0XSA9IHBvaW50ZXJVdGlscy5nZXRFdmVudFRhcmdldHMoZXZlbnQpXG4gICAgY29uc3QgbWF0Y2hlcyA9IFtdIC8vIFsgW3BvaW50ZXIsIGludGVyYWN0aW9uXSwgLi4uXVxuXG4gICAgaWYgKGJyb3dzZXIuc3VwcG9ydHNUb3VjaCAmJiAvdG91Y2gvLnRlc3QoZXZlbnQudHlwZSkpIHtcbiAgICAgIHNjb3BlLnByZXZUb3VjaFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxuXG4gICAgICBmb3IgKGNvbnN0IGNoYW5nZWRUb3VjaCBvZiBldmVudC5jaGFuZ2VkVG91Y2hlcykge1xuICAgICAgICBjb25zdCBwb2ludGVyID0gY2hhbmdlZFRvdWNoXG4gICAgICAgIGNvbnN0IHBvaW50ZXJJZCA9IHBvaW50ZXJVdGlscy5nZXRQb2ludGVySWQocG9pbnRlcilcbiAgICAgICAgY29uc3Qgc2VhcmNoRGV0YWlsczogU2VhcmNoRGV0YWlscyA9IHtcbiAgICAgICAgICBwb2ludGVyLFxuICAgICAgICAgIHBvaW50ZXJJZCxcbiAgICAgICAgICBwb2ludGVyVHlwZSxcbiAgICAgICAgICBldmVudFR5cGU6IGV2ZW50LnR5cGUsXG4gICAgICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICAgICAgY3VyRXZlbnRUYXJnZXQsXG4gICAgICAgICAgc2NvcGUsXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW50ZXJhY3Rpb24gPSBnZXRJbnRlcmFjdGlvbihzZWFyY2hEZXRhaWxzKVxuXG4gICAgICAgIG1hdGNoZXMucHVzaChbXG4gICAgICAgICAgc2VhcmNoRGV0YWlscy5wb2ludGVyLFxuICAgICAgICAgIHNlYXJjaERldGFpbHMuZXZlbnRUYXJnZXQsXG4gICAgICAgICAgc2VhcmNoRGV0YWlscy5jdXJFdmVudFRhcmdldCxcbiAgICAgICAgICBpbnRlcmFjdGlvbixcbiAgICAgICAgXSlcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBsZXQgaW52YWxpZFBvaW50ZXIgPSBmYWxzZVxuXG4gICAgICBpZiAoIWJyb3dzZXIuc3VwcG9ydHNQb2ludGVyRXZlbnQgJiYgL21vdXNlLy50ZXN0KGV2ZW50LnR5cGUpKSB7XG4gICAgICAgIC8vIGlnbm9yZSBtb3VzZSBldmVudHMgd2hpbGUgdG91Y2ggaW50ZXJhY3Rpb25zIGFyZSBhY3RpdmVcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnRlcmFjdGlvbnMubGVuZ3RoICYmICFpbnZhbGlkUG9pbnRlcjsgaSsrKSB7XG4gICAgICAgICAgaW52YWxpZFBvaW50ZXIgPSBpbnRlcmFjdGlvbnNbaV0ucG9pbnRlclR5cGUgIT09ICdtb3VzZScgJiYgaW50ZXJhY3Rpb25zW2ldLnBvaW50ZXJJc0Rvd25cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRyeSB0byBpZ25vcmUgbW91c2UgZXZlbnRzIHRoYXQgYXJlIHNpbXVsYXRlZCBieSB0aGUgYnJvd3NlclxuICAgICAgICAvLyBhZnRlciBhIHRvdWNoIGV2ZW50XG4gICAgICAgIGludmFsaWRQb2ludGVyID0gaW52YWxpZFBvaW50ZXIgfHxcbiAgICAgICAgICAobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzY29wZS5wcmV2VG91Y2hUaW1lIDwgNTAwKSB8fFxuICAgICAgICAgIC8vIG9uIGlPUyBhbmQgRmlyZWZveCBNb2JpbGUsIE1vdXNlRXZlbnQudGltZVN0YW1wIGlzIHplcm8gaWYgc2ltdWxhdGVkXG4gICAgICAgICAgZXZlbnQudGltZVN0YW1wID09PSAwXG4gICAgICB9XG5cbiAgICAgIGlmICghaW52YWxpZFBvaW50ZXIpIHtcbiAgICAgICAgY29uc3Qgc2VhcmNoRGV0YWlscyA9IHtcbiAgICAgICAgICBwb2ludGVyOiBldmVudCxcbiAgICAgICAgICBwb2ludGVySWQ6IHBvaW50ZXJVdGlscy5nZXRQb2ludGVySWQoZXZlbnQpLFxuICAgICAgICAgIHBvaW50ZXJUeXBlLFxuICAgICAgICAgIGV2ZW50VHlwZTogZXZlbnQudHlwZSxcbiAgICAgICAgICBjdXJFdmVudFRhcmdldCxcbiAgICAgICAgICBldmVudFRhcmdldCxcbiAgICAgICAgICBzY29wZSxcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGludGVyYWN0aW9uID0gZ2V0SW50ZXJhY3Rpb24oc2VhcmNoRGV0YWlscylcblxuICAgICAgICBtYXRjaGVzLnB1c2goW1xuICAgICAgICAgIHNlYXJjaERldGFpbHMucG9pbnRlcixcbiAgICAgICAgICBzZWFyY2hEZXRhaWxzLmV2ZW50VGFyZ2V0LFxuICAgICAgICAgIHNlYXJjaERldGFpbHMuY3VyRXZlbnRUYXJnZXQsXG4gICAgICAgICAgaW50ZXJhY3Rpb24sXG4gICAgICAgIF0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNoYWRvd1xuICAgIGZvciAoY29uc3QgW3BvaW50ZXIsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCwgaW50ZXJhY3Rpb25dIG9mIG1hdGNoZXMpIHtcbiAgICAgIGludGVyYWN0aW9uW21ldGhvZF0ocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldClcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0SW50ZXJhY3Rpb24gKHNlYXJjaERldGFpbHM6IFNlYXJjaERldGFpbHMpIHtcbiAgY29uc3QgeyBwb2ludGVyVHlwZSwgc2NvcGUgfSA9IHNlYXJjaERldGFpbHNcblxuICBjb25zdCBmb3VuZEludGVyYWN0aW9uID0gZmluZGVyLnNlYXJjaChzZWFyY2hEZXRhaWxzKVxuICBjb25zdCBzaWduYWxBcmcgPSB7IGludGVyYWN0aW9uOiBmb3VuZEludGVyYWN0aW9uLCBzZWFyY2hEZXRhaWxzIH1cblxuICBzY29wZS5pbnRlcmFjdGlvbnMuc2lnbmFscy5maXJlKCdmaW5kJywgc2lnbmFsQXJnKVxuXG4gIHJldHVybiBzaWduYWxBcmcuaW50ZXJhY3Rpb24gfHwgbmV3SW50ZXJhY3Rpb24oeyBwb2ludGVyVHlwZSB9LCBzY29wZSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5ld0ludGVyYWN0aW9uIChvcHRpb25zLCBzY29wZSkge1xuICBjb25zdCBpbnRlcmFjdGlvbiA9IHNjb3BlLmludGVyYWN0aW9ucy5uZXcob3B0aW9ucylcblxuICBzY29wZS5pbnRlcmFjdGlvbnMubGlzdC5wdXNoKGludGVyYWN0aW9uKVxuICByZXR1cm4gaW50ZXJhY3Rpb25cbn1cblxuZnVuY3Rpb24gb25Eb2NTaWduYWwgKHsgZG9jLCBzY29wZSwgb3B0aW9ucyB9LCBzaWduYWxOYW1lKSB7XG4gIGNvbnN0IHsgZXZlbnRNYXAgfSA9IHNjb3BlLmludGVyYWN0aW9uc1xuICBjb25zdCBldmVudE1ldGhvZCA9IHNpZ25hbE5hbWUuaW5kZXhPZignYWRkJykgPT09IDBcbiAgICA/IGV2ZW50cy5hZGQgOiBldmVudHMucmVtb3ZlXG5cbiAgaWYgKHNjb3BlLmJyb3dzZXIuaXNJT1MgJiYgIW9wdGlvbnMuZXZlbnRzKSB7XG4gICAgb3B0aW9ucy5ldmVudHMgPSB7IHBhc3NpdmU6IGZhbHNlIH1cbiAgfVxuXG4gIC8vIGRlbGVnYXRlIGV2ZW50IGxpc3RlbmVyXG4gIGZvciAoY29uc3QgZXZlbnRUeXBlIGluIGV2ZW50cy5kZWxlZ2F0ZWRFdmVudHMpIHtcbiAgICBldmVudE1ldGhvZChkb2MsIGV2ZW50VHlwZSwgZXZlbnRzLmRlbGVnYXRlTGlzdGVuZXIpXG4gICAgZXZlbnRNZXRob2QoZG9jLCBldmVudFR5cGUsIGV2ZW50cy5kZWxlZ2F0ZVVzZUNhcHR1cmUsIHRydWUpXG4gIH1cblxuICBjb25zdCBldmVudE9wdGlvbnMgPSBvcHRpb25zICYmIG9wdGlvbnMuZXZlbnRzXG5cbiAgZm9yIChjb25zdCBldmVudFR5cGUgaW4gZXZlbnRNYXApIHtcbiAgICBldmVudE1ldGhvZChkb2MsIGV2ZW50VHlwZSwgZXZlbnRNYXBbZXZlbnRUeXBlXSwgZXZlbnRPcHRpb25zKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgaW5zdGFsbCxcbiAgb25Eb2NTaWduYWwsXG4gIGRvT25JbnRlcmFjdGlvbnMsXG4gIG5ld0ludGVyYWN0aW9uLFxuICBtZXRob2ROYW1lcyxcbn1cbiJdfQ==