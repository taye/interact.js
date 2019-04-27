import browser from '@interactjs/utils/browser';
import domObjects from '@interactjs/utils/domObjects';
import events from '@interactjs/utils/events';
import pointerUtils from '@interactjs/utils/pointerUtils';
import Signals from '@interactjs/utils/Signals';
import InteractionBase from './Interaction';
import finder from './interactionFinder';
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
        _now() { return scope.now(); }
    };
    scope.interactions = {
        signals,
        // all active and idle interactions
        list: [],
        new(options) {
            options.signals = signals;
            const interaction = new scope.Interaction(options);
            scope.interactions.list.push(interaction);
            return interaction;
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
            scope.prevTouchTime = scope.now();
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
                    (scope.now() - scope.prevTouchTime < 500) ||
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
    return signalArg.interaction || scope.interactions.new({ pointerType });
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
    id: 'core/interactions',
    install,
    onDocSignal,
    doOnInteractions,
    methodNames,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZXJhY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sT0FBTyxNQUFNLDJCQUEyQixDQUFBO0FBQy9DLE9BQU8sVUFBVSxNQUFNLDhCQUE4QixDQUFBO0FBQ3JELE9BQU8sTUFBTSxNQUFNLDBCQUEwQixDQUFBO0FBQzdDLE9BQU8sWUFBWSxNQUFNLGdDQUFnQyxDQUFBO0FBQ3pELE9BQU8sT0FBTyxNQUFNLDJCQUEyQixDQUFBO0FBQy9DLE9BQU8sZUFBZSxNQUFNLGVBQWUsQ0FBQTtBQUMzQyxPQUFPLE1BQXlCLE1BQU0scUJBQXFCLENBQUE7QUFrQjNELE1BQU0sV0FBVyxHQUFHO0lBQ2xCLGFBQWEsRUFBRSxhQUFhLEVBQUUsV0FBVztJQUN6QyxlQUFlLEVBQUUsZUFBZSxFQUFFLFlBQVk7Q0FDL0MsQ0FBQTtBQUVELFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQTtJQUU3QixNQUFNLFNBQVMsR0FBRyxFQUFTLENBQUE7SUFFM0IsS0FBSyxNQUFNLE1BQU0sSUFBSSxXQUFXLEVBQUU7UUFDaEMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQTtLQUNwRDtJQUVELE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUE7SUFDdkMsTUFBTSxRQUFRLEdBQUcsRUFBMEMsQ0FBQTtJQUUzRCxJQUFJLFVBQVUsQ0FBQyxZQUFZLEVBQUU7UUFDM0IsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUcsR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFBO1FBQ3BELFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFHLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBQTtRQUNwRCxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBSyxH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Q1osQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBicm93c2VyIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2Jyb3dzZXInXG5pbXBvcnQgZG9tT2JqZWN0cyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9kb21PYmplY3RzJ1xuaW1wb3J0IGV2ZW50cyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9ldmVudHMnXG5pbXBvcnQgcG9pbnRlclV0aWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL3BvaW50ZXJVdGlscydcbmltcG9ydCBTaWduYWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL1NpZ25hbHMnXG5pbXBvcnQgSW50ZXJhY3Rpb25CYXNlIGZyb20gJy4vSW50ZXJhY3Rpb24nXG5pbXBvcnQgZmluZGVyLCB7IFNlYXJjaERldGFpbHMgfSBmcm9tICcuL2ludGVyYWN0aW9uRmluZGVyJ1xuaW1wb3J0IHsgU2NvcGUgfSBmcm9tICcuL3Njb3BlJ1xuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9zY29wZScge1xuICBpbnRlcmZhY2UgU2NvcGUge1xuICAgIEludGVyYWN0aW9uOiB0eXBlb2YgSW50ZXJhY3Rpb25CYXNlXG4gICAgaW50ZXJhY3Rpb25zOiB7XG4gICAgICBzaWduYWxzOiBTaWduYWxzXG4gICAgICBuZXc6IChvcHRpb25zOiBhbnkpID0+IEludGVyYWN0aW9uQmFzZVxuICAgICAgbGlzdDogSW50ZXJhY3Rpb25CYXNlW11cbiAgICAgIGxpc3RlbmVyczogeyBbdHlwZTogc3RyaW5nXTogSW50ZXJhY3QuTGlzdGVuZXIgfVxuICAgICAgZXZlbnRNYXA6IGFueVxuICAgICAgcG9pbnRlck1vdmVUb2xlcmFuY2U6IG51bWJlclxuICAgIH1cbiAgICBwcmV2VG91Y2hUaW1lOiBudW1iZXJcbiAgfVxufVxuXG5jb25zdCBtZXRob2ROYW1lcyA9IFtcbiAgJ3BvaW50ZXJEb3duJywgJ3BvaW50ZXJNb3ZlJywgJ3BvaW50ZXJVcCcsXG4gICd1cGRhdGVQb2ludGVyJywgJ3JlbW92ZVBvaW50ZXInLCAnd2luZG93Qmx1cicsXG5dXG5cbmZ1bmN0aW9uIGluc3RhbGwgKHNjb3BlOiBTY29wZSkge1xuICBjb25zdCBzaWduYWxzID0gbmV3IFNpZ25hbHMoKVxuXG4gIGNvbnN0IGxpc3RlbmVycyA9IHt9IGFzIGFueVxuXG4gIGZvciAoY29uc3QgbWV0aG9kIG9mIG1ldGhvZE5hbWVzKSB7XG4gICAgbGlzdGVuZXJzW21ldGhvZF0gPSBkb09uSW50ZXJhY3Rpb25zKG1ldGhvZCwgc2NvcGUpXG4gIH1cblxuICBjb25zdCBwRXZlbnRUeXBlcyA9IGJyb3dzZXIucEV2ZW50VHlwZXNcbiAgY29uc3QgZXZlbnRNYXAgPSB7fSBhcyB7IFtrZXk6IHN0cmluZ106IEludGVyYWN0Lkxpc3RlbmVyIH1cblxuICBpZiAoZG9tT2JqZWN0cy5Qb2ludGVyRXZlbnQpIHtcbiAgICBldmVudE1hcFtwRXZlbnRUeXBlcy5kb3duICBdID0gbGlzdGVuZXJzLnBvaW50ZXJEb3duXG4gICAgZXZlbnRNYXBbcEV2ZW50VHlwZXMubW92ZSAgXSA9IGxpc3RlbmVycy5wb2ludGVyTW92ZVxuICAgIGV2ZW50TWFwW3BFdmVudFR5cGVzLnVwICAgIF0gPSBsaXN0ZW5lcnMucG9pbnRlclVwXG4gICAgZXZlbnRNYXBbcEV2ZW50VHlwZXMuY2FuY2VsXSA9IGxpc3RlbmVycy5wb2ludGVyVXBcbiAgfVxuICBlbHNlIHtcbiAgICBldmVudE1hcC5tb3VzZWRvd24gICA9IGxpc3RlbmVycy5wb2ludGVyRG93blxuICAgIGV2ZW50TWFwLm1vdXNlbW92ZSAgID0gbGlzdGVuZXJzLnBvaW50ZXJNb3ZlXG4gICAgZXZlbnRNYXAubW91c2V1cCAgICAgPSBsaXN0ZW5lcnMucG9pbnRlclVwXG5cbiAgICBldmVudE1hcC50b3VjaHN0YXJ0ICA9IGxpc3RlbmVycy5wb2ludGVyRG93blxuICAgIGV2ZW50TWFwLnRvdWNobW92ZSAgID0gbGlzdGVuZXJzLnBvaW50ZXJNb3ZlXG4gICAgZXZlbnRNYXAudG91Y2hlbmQgICAgPSBsaXN0ZW5lcnMucG9pbnRlclVwXG4gICAgZXZlbnRNYXAudG91Y2hjYW5jZWwgPSBsaXN0ZW5lcnMucG9pbnRlclVwXG4gIH1cblxuICBldmVudE1hcC5ibHVyID0gKGV2ZW50KSA9PiB7XG4gICAgZm9yIChjb25zdCBpbnRlcmFjdGlvbiBvZiBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCkge1xuICAgICAgaW50ZXJhY3Rpb24uZG9jdW1lbnRCbHVyKGV2ZW50KVxuICAgIH1cbiAgfVxuXG4gIHNjb3BlLnNpZ25hbHMub24oJ2FkZC1kb2N1bWVudCcsIG9uRG9jU2lnbmFsKVxuICBzY29wZS5zaWduYWxzLm9uKCdyZW1vdmUtZG9jdW1lbnQnLCBvbkRvY1NpZ25hbClcblxuICAvLyBmb3IgaWdub3JpbmcgYnJvd3NlcidzIHNpbXVsYXRlZCBtb3VzZSBldmVudHNcbiAgc2NvcGUucHJldlRvdWNoVGltZSA9IDBcblxuICBzY29wZS5JbnRlcmFjdGlvbiA9IGNsYXNzIEludGVyYWN0aW9uIGV4dGVuZHMgSW50ZXJhY3Rpb25CYXNlIHtcbiAgICBnZXQgcG9pbnRlck1vdmVUb2xlcmFuY2UgKCkge1xuICAgICAgcmV0dXJuIHNjb3BlLmludGVyYWN0aW9ucy5wb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgIH1cblxuICAgIHNldCBwb2ludGVyTW92ZVRvbGVyYW5jZSAodmFsdWUpIHtcbiAgICAgIHNjb3BlLmludGVyYWN0aW9ucy5wb2ludGVyTW92ZVRvbGVyYW5jZSA9IHZhbHVlXG4gICAgfVxuXG4gICAgX25vdyAoKSB7IHJldHVybiBzY29wZS5ub3coKSB9XG4gIH1cbiAgc2NvcGUuaW50ZXJhY3Rpb25zID0ge1xuICAgIHNpZ25hbHMsXG4gICAgLy8gYWxsIGFjdGl2ZSBhbmQgaWRsZSBpbnRlcmFjdGlvbnNcbiAgICBsaXN0OiBbXSxcbiAgICBuZXcgKG9wdGlvbnM6IHsgcG9pbnRlclR5cGU/OiBzdHJpbmcsIHNpZ25hbHM/OiBTaWduYWxzIH0pIHtcbiAgICAgIG9wdGlvbnMuc2lnbmFscyA9IHNpZ25hbHNcblxuICAgICAgY29uc3QgaW50ZXJhY3Rpb24gPSBuZXcgc2NvcGUuSW50ZXJhY3Rpb24ob3B0aW9ucyBhcyBSZXF1aXJlZDx0eXBlb2Ygb3B0aW9ucz4pXG5cbiAgICAgIHNjb3BlLmludGVyYWN0aW9ucy5saXN0LnB1c2goaW50ZXJhY3Rpb24pXG4gICAgICByZXR1cm4gaW50ZXJhY3Rpb25cbiAgICB9LFxuICAgIGxpc3RlbmVycyxcbiAgICBldmVudE1hcCxcbiAgICBwb2ludGVyTW92ZVRvbGVyYW5jZTogMSxcbiAgfVxufVxuXG5mdW5jdGlvbiBkb09uSW50ZXJhY3Rpb25zIChtZXRob2QsIHNjb3BlKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBjb25zdCBpbnRlcmFjdGlvbnMgPSBzY29wZS5pbnRlcmFjdGlvbnMubGlzdFxuXG4gICAgY29uc3QgcG9pbnRlclR5cGUgPSBwb2ludGVyVXRpbHMuZ2V0UG9pbnRlclR5cGUoZXZlbnQpXG4gICAgY29uc3QgW2V2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldF0gPSBwb2ludGVyVXRpbHMuZ2V0RXZlbnRUYXJnZXRzKGV2ZW50KVxuICAgIGNvbnN0IG1hdGNoZXMgPSBbXSAvLyBbIFtwb2ludGVyLCBpbnRlcmFjdGlvbl0sIC4uLl1cblxuICAgIGlmIChicm93c2VyLnN1cHBvcnRzVG91Y2ggJiYgL3RvdWNoLy50ZXN0KGV2ZW50LnR5cGUpKSB7XG4gICAgICBzY29wZS5wcmV2VG91Y2hUaW1lID0gc2NvcGUubm93KClcblxuICAgICAgZm9yIChjb25zdCBjaGFuZ2VkVG91Y2ggb2YgZXZlbnQuY2hhbmdlZFRvdWNoZXMpIHtcbiAgICAgICAgY29uc3QgcG9pbnRlciA9IGNoYW5nZWRUb3VjaFxuICAgICAgICBjb25zdCBwb2ludGVySWQgPSBwb2ludGVyVXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpXG4gICAgICAgIGNvbnN0IHNlYXJjaERldGFpbHM6IFNlYXJjaERldGFpbHMgPSB7XG4gICAgICAgICAgcG9pbnRlcixcbiAgICAgICAgICBwb2ludGVySWQsXG4gICAgICAgICAgcG9pbnRlclR5cGUsXG4gICAgICAgICAgZXZlbnRUeXBlOiBldmVudC50eXBlLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgICAgIGN1ckV2ZW50VGFyZ2V0LFxuICAgICAgICAgIHNjb3BlLFxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGludGVyYWN0aW9uID0gZ2V0SW50ZXJhY3Rpb24oc2VhcmNoRGV0YWlscylcblxuICAgICAgICBtYXRjaGVzLnB1c2goW1xuICAgICAgICAgIHNlYXJjaERldGFpbHMucG9pbnRlcixcbiAgICAgICAgICBzZWFyY2hEZXRhaWxzLmV2ZW50VGFyZ2V0LFxuICAgICAgICAgIHNlYXJjaERldGFpbHMuY3VyRXZlbnRUYXJnZXQsXG4gICAgICAgICAgaW50ZXJhY3Rpb24sXG4gICAgICAgIF0pXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbGV0IGludmFsaWRQb2ludGVyID0gZmFsc2VcblxuICAgICAgaWYgKCFicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50ICYmIC9tb3VzZS8udGVzdChldmVudC50eXBlKSkge1xuICAgICAgICAvLyBpZ25vcmUgbW91c2UgZXZlbnRzIHdoaWxlIHRvdWNoIGludGVyYWN0aW9ucyBhcmUgYWN0aXZlXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW50ZXJhY3Rpb25zLmxlbmd0aCAmJiAhaW52YWxpZFBvaW50ZXI7IGkrKykge1xuICAgICAgICAgIGludmFsaWRQb2ludGVyID0gaW50ZXJhY3Rpb25zW2ldLnBvaW50ZXJUeXBlICE9PSAnbW91c2UnICYmIGludGVyYWN0aW9uc1tpXS5wb2ludGVySXNEb3duXG4gICAgICAgIH1cblxuICAgICAgICAvLyB0cnkgdG8gaWdub3JlIG1vdXNlIGV2ZW50cyB0aGF0IGFyZSBzaW11bGF0ZWQgYnkgdGhlIGJyb3dzZXJcbiAgICAgICAgLy8gYWZ0ZXIgYSB0b3VjaCBldmVudFxuICAgICAgICBpbnZhbGlkUG9pbnRlciA9IGludmFsaWRQb2ludGVyIHx8XG4gICAgICAgICAgKHNjb3BlLm5vdygpIC0gc2NvcGUucHJldlRvdWNoVGltZSA8IDUwMCkgfHxcbiAgICAgICAgICAvLyBvbiBpT1MgYW5kIEZpcmVmb3ggTW9iaWxlLCBNb3VzZUV2ZW50LnRpbWVTdGFtcCBpcyB6ZXJvIGlmIHNpbXVsYXRlZFxuICAgICAgICAgIGV2ZW50LnRpbWVTdGFtcCA9PT0gMFxuICAgICAgfVxuXG4gICAgICBpZiAoIWludmFsaWRQb2ludGVyKSB7XG4gICAgICAgIGNvbnN0IHNlYXJjaERldGFpbHMgPSB7XG4gICAgICAgICAgcG9pbnRlcjogZXZlbnQsXG4gICAgICAgICAgcG9pbnRlcklkOiBwb2ludGVyVXRpbHMuZ2V0UG9pbnRlcklkKGV2ZW50KSxcbiAgICAgICAgICBwb2ludGVyVHlwZSxcbiAgICAgICAgICBldmVudFR5cGU6IGV2ZW50LnR5cGUsXG4gICAgICAgICAgY3VyRXZlbnRUYXJnZXQsXG4gICAgICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICAgICAgc2NvcGUsXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbnRlcmFjdGlvbiA9IGdldEludGVyYWN0aW9uKHNlYXJjaERldGFpbHMpXG5cbiAgICAgICAgbWF0Y2hlcy5wdXNoKFtcbiAgICAgICAgICBzZWFyY2hEZXRhaWxzLnBvaW50ZXIsXG4gICAgICAgICAgc2VhcmNoRGV0YWlscy5ldmVudFRhcmdldCxcbiAgICAgICAgICBzZWFyY2hEZXRhaWxzLmN1ckV2ZW50VGFyZ2V0LFxuICAgICAgICAgIGludGVyYWN0aW9uLFxuICAgICAgICBdKVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcbiAgICBmb3IgKGNvbnN0IFtwb2ludGVyLCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQsIGludGVyYWN0aW9uXSBvZiBtYXRjaGVzKSB7XG4gICAgICBpbnRlcmFjdGlvblttZXRob2RdKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldEludGVyYWN0aW9uIChzZWFyY2hEZXRhaWxzOiBTZWFyY2hEZXRhaWxzKSB7XG4gIGNvbnN0IHsgcG9pbnRlclR5cGUsIHNjb3BlIH0gPSBzZWFyY2hEZXRhaWxzXG5cbiAgY29uc3QgZm91bmRJbnRlcmFjdGlvbiA9IGZpbmRlci5zZWFyY2goc2VhcmNoRGV0YWlscylcbiAgY29uc3Qgc2lnbmFsQXJnID0geyBpbnRlcmFjdGlvbjogZm91bmRJbnRlcmFjdGlvbiwgc2VhcmNoRGV0YWlscyB9XG5cbiAgc2NvcGUuaW50ZXJhY3Rpb25zLnNpZ25hbHMuZmlyZSgnZmluZCcsIHNpZ25hbEFyZylcblxuICByZXR1cm4gc2lnbmFsQXJnLmludGVyYWN0aW9uIHx8IHNjb3BlLmludGVyYWN0aW9ucy5uZXcoeyBwb2ludGVyVHlwZSB9KVxufVxuXG5mdW5jdGlvbiBvbkRvY1NpZ25hbCAoeyBkb2MsIHNjb3BlLCBvcHRpb25zIH0sIHNpZ25hbE5hbWUpIHtcbiAgY29uc3QgeyBldmVudE1hcCB9ID0gc2NvcGUuaW50ZXJhY3Rpb25zXG4gIGNvbnN0IGV2ZW50TWV0aG9kID0gc2lnbmFsTmFtZS5pbmRleE9mKCdhZGQnKSA9PT0gMFxuICAgID8gZXZlbnRzLmFkZCA6IGV2ZW50cy5yZW1vdmVcblxuICBpZiAoc2NvcGUuYnJvd3Nlci5pc0lPUyAmJiAhb3B0aW9ucy5ldmVudHMpIHtcbiAgICBvcHRpb25zLmV2ZW50cyA9IHsgcGFzc2l2ZTogZmFsc2UgfVxuICB9XG5cbiAgLy8gZGVsZWdhdGUgZXZlbnQgbGlzdGVuZXJcbiAgZm9yIChjb25zdCBldmVudFR5cGUgaW4gZXZlbnRzLmRlbGVnYXRlZEV2ZW50cykge1xuICAgIGV2ZW50TWV0aG9kKGRvYywgZXZlbnRUeXBlLCBldmVudHMuZGVsZWdhdGVMaXN0ZW5lcilcbiAgICBldmVudE1ldGhvZChkb2MsIGV2ZW50VHlwZSwgZXZlbnRzLmRlbGVnYXRlVXNlQ2FwdHVyZSwgdHJ1ZSlcbiAgfVxuXG4gIGNvbnN0IGV2ZW50T3B0aW9ucyA9IG9wdGlvbnMgJiYgb3B0aW9ucy5ldmVudHNcblxuICBmb3IgKGNvbnN0IGV2ZW50VHlwZSBpbiBldmVudE1hcCkge1xuICAgIGV2ZW50TWV0aG9kKGRvYywgZXZlbnRUeXBlLCBldmVudE1hcFtldmVudFR5cGVdLCBldmVudE9wdGlvbnMpXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBpZDogJ2NvcmUvaW50ZXJhY3Rpb25zJyxcbiAgaW5zdGFsbCxcbiAgb25Eb2NTaWduYWwsXG4gIGRvT25JbnRlcmFjdGlvbnMsXG4gIG1ldGhvZE5hbWVzLFxufVxuIl19