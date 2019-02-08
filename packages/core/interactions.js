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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZXJhY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sT0FBTyxNQUFNLDJCQUEyQixDQUFBO0FBQy9DLE9BQU8sVUFBVSxNQUFNLDhCQUE4QixDQUFBO0FBQ3JELE9BQU8sTUFBTSxNQUFNLDBCQUEwQixDQUFBO0FBQzdDLE9BQU8sTUFBeUIsTUFBTSxxQ0FBcUMsQ0FBQTtBQUMzRSxPQUFPLFlBQVksTUFBTSxnQ0FBZ0MsQ0FBQTtBQUN6RCxPQUFPLE9BQU8sTUFBTSwyQkFBMkIsQ0FBQTtBQUMvQyxPQUFPLGVBQWUsTUFBTSxlQUFlLENBQUE7QUFrQjNDLE1BQU0sV0FBVyxHQUFHO0lBQ2xCLGFBQWEsRUFBRSxhQUFhLEVBQUUsV0FBVztJQUN6QyxlQUFlLEVBQUUsZUFBZSxFQUFFLFlBQVk7Q0FDL0MsQ0FBQTtBQUVELFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQTtJQUU3QixNQUFNLFNBQVMsR0FBRyxFQUFTLENBQUE7SUFFM0IsS0FBSyxNQUFNLE1BQU0sSUFBSSxXQUFXLEVBQUU7UUFDaEMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQTtLQUNwRDtJQUVELE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUE7SUFDdkMsTUFBTSxRQUFRLEdBQUcsRUFBMEMsQ0FBQTtJQUUzRCxJQUFJLFVBQVUsQ0FBQyxZQUFZLEVBQUU7UUFDM0IsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUcsR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFBO1FBQ3BELFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFHLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBQTtRQUNwRCxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBSyxH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SUFDUCxXQUFXO0lBQ1gsZ0JBQWdCO0lBQ2hCLGNBQWM7SUFDZCxXQUFXO0NBQ1osQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBicm93c2VyIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2Jyb3dzZXInXG5pbXBvcnQgZG9tT2JqZWN0cyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9kb21PYmplY3RzJ1xuaW1wb3J0IGV2ZW50cyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9ldmVudHMnXG5pbXBvcnQgZmluZGVyLCB7IFNlYXJjaERldGFpbHMgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9pbnRlcmFjdGlvbkZpbmRlcidcbmltcG9ydCBwb2ludGVyVXRpbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvcG9pbnRlclV0aWxzJ1xuaW1wb3J0IFNpZ25hbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvU2lnbmFscydcbmltcG9ydCBJbnRlcmFjdGlvbkJhc2UgZnJvbSAnLi9JbnRlcmFjdGlvbidcbmltcG9ydCB7IFNjb3BlIH0gZnJvbSAnLi9zY29wZSdcblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnIHtcbiAgaW50ZXJmYWNlIFNjb3BlIHtcbiAgICBJbnRlcmFjdGlvbjogdHlwZW9mIEludGVyYWN0aW9uQmFzZVxuICAgIGludGVyYWN0aW9uczoge1xuICAgICAgc2lnbmFsczogU2lnbmFsc1xuICAgICAgbmV3OiAob3B0aW9uczogYW55KSA9PiBJbnRlcmFjdGlvbkJhc2VcbiAgICAgIGxpc3Q6IEludGVyYWN0aW9uQmFzZVtdXG4gICAgICBsaXN0ZW5lcnM6IHsgW3R5cGU6IHN0cmluZ106IEludGVyYWN0Lkxpc3RlbmVyIH1cbiAgICAgIGV2ZW50TWFwOiBhbnlcbiAgICAgIHBvaW50ZXJNb3ZlVG9sZXJhbmNlOiBudW1iZXJcbiAgICB9XG4gICAgcHJldlRvdWNoVGltZTogbnVtYmVyXG4gIH1cbn1cblxuY29uc3QgbWV0aG9kTmFtZXMgPSBbXG4gICdwb2ludGVyRG93bicsICdwb2ludGVyTW92ZScsICdwb2ludGVyVXAnLFxuICAndXBkYXRlUG9pbnRlcicsICdyZW1vdmVQb2ludGVyJywgJ3dpbmRvd0JsdXInLFxuXVxuXG5mdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qgc2lnbmFscyA9IG5ldyBTaWduYWxzKClcblxuICBjb25zdCBsaXN0ZW5lcnMgPSB7fSBhcyBhbnlcblxuICBmb3IgKGNvbnN0IG1ldGhvZCBvZiBtZXRob2ROYW1lcykge1xuICAgIGxpc3RlbmVyc1ttZXRob2RdID0gZG9PbkludGVyYWN0aW9ucyhtZXRob2QsIHNjb3BlKVxuICB9XG5cbiAgY29uc3QgcEV2ZW50VHlwZXMgPSBicm93c2VyLnBFdmVudFR5cGVzXG4gIGNvbnN0IGV2ZW50TWFwID0ge30gYXMgeyBba2V5OiBzdHJpbmddOiBJbnRlcmFjdC5MaXN0ZW5lciB9XG5cbiAgaWYgKGRvbU9iamVjdHMuUG9pbnRlckV2ZW50KSB7XG4gICAgZXZlbnRNYXBbcEV2ZW50VHlwZXMuZG93biAgXSA9IGxpc3RlbmVycy5wb2ludGVyRG93blxuICAgIGV2ZW50TWFwW3BFdmVudFR5cGVzLm1vdmUgIF0gPSBsaXN0ZW5lcnMucG9pbnRlck1vdmVcbiAgICBldmVudE1hcFtwRXZlbnRUeXBlcy51cCAgICBdID0gbGlzdGVuZXJzLnBvaW50ZXJVcFxuICAgIGV2ZW50TWFwW3BFdmVudFR5cGVzLmNhbmNlbF0gPSBsaXN0ZW5lcnMucG9pbnRlclVwXG4gIH1cbiAgZWxzZSB7XG4gICAgZXZlbnRNYXAubW91c2Vkb3duICAgPSBsaXN0ZW5lcnMucG9pbnRlckRvd25cbiAgICBldmVudE1hcC5tb3VzZW1vdmUgICA9IGxpc3RlbmVycy5wb2ludGVyTW92ZVxuICAgIGV2ZW50TWFwLm1vdXNldXAgICAgID0gbGlzdGVuZXJzLnBvaW50ZXJVcFxuXG4gICAgZXZlbnRNYXAudG91Y2hzdGFydCAgPSBsaXN0ZW5lcnMucG9pbnRlckRvd25cbiAgICBldmVudE1hcC50b3VjaG1vdmUgICA9IGxpc3RlbmVycy5wb2ludGVyTW92ZVxuICAgIGV2ZW50TWFwLnRvdWNoZW5kICAgID0gbGlzdGVuZXJzLnBvaW50ZXJVcFxuICAgIGV2ZW50TWFwLnRvdWNoY2FuY2VsID0gbGlzdGVuZXJzLnBvaW50ZXJVcFxuICB9XG5cbiAgZXZlbnRNYXAuYmx1ciA9IChldmVudCkgPT4ge1xuICAgIGZvciAoY29uc3QgaW50ZXJhY3Rpb24gb2Ygc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QpIHtcbiAgICAgIGludGVyYWN0aW9uLmRvY3VtZW50Qmx1cihldmVudClcbiAgICB9XG4gIH1cblxuICBzY29wZS5zaWduYWxzLm9uKCdhZGQtZG9jdW1lbnQnLCBvbkRvY1NpZ25hbClcbiAgc2NvcGUuc2lnbmFscy5vbigncmVtb3ZlLWRvY3VtZW50Jywgb25Eb2NTaWduYWwpXG5cbiAgLy8gZm9yIGlnbm9yaW5nIGJyb3dzZXIncyBzaW11bGF0ZWQgbW91c2UgZXZlbnRzXG4gIHNjb3BlLnByZXZUb3VjaFRpbWUgPSAwXG5cbiAgc2NvcGUuSW50ZXJhY3Rpb24gPSBjbGFzcyBJbnRlcmFjdGlvbiBleHRlbmRzIEludGVyYWN0aW9uQmFzZSB7XG4gICAgZ2V0IHBvaW50ZXJNb3ZlVG9sZXJhbmNlICgpIHtcbiAgICAgIHJldHVybiBzY29wZS5pbnRlcmFjdGlvbnMucG9pbnRlck1vdmVUb2xlcmFuY2VcbiAgICB9XG5cbiAgICBzZXQgcG9pbnRlck1vdmVUb2xlcmFuY2UgKHZhbHVlKSB7XG4gICAgICBzY29wZS5pbnRlcmFjdGlvbnMucG9pbnRlck1vdmVUb2xlcmFuY2UgPSB2YWx1ZVxuICAgIH1cbiAgfVxuICBzY29wZS5pbnRlcmFjdGlvbnMgPSB7XG4gICAgc2lnbmFscyxcbiAgICAvLyBhbGwgYWN0aXZlIGFuZCBpZGxlIGludGVyYWN0aW9uc1xuICAgIGxpc3Q6IFtdLFxuICAgIG5ldyAob3B0aW9ucykge1xuICAgICAgb3B0aW9ucy5zaWduYWxzID0gc2lnbmFsc1xuXG4gICAgICByZXR1cm4gbmV3IHNjb3BlLkludGVyYWN0aW9uKG9wdGlvbnMpXG4gICAgfSxcbiAgICBsaXN0ZW5lcnMsXG4gICAgZXZlbnRNYXAsXG4gICAgcG9pbnRlck1vdmVUb2xlcmFuY2U6IDEsXG4gIH1cbn1cblxuZnVuY3Rpb24gZG9PbkludGVyYWN0aW9ucyAobWV0aG9kLCBzY29wZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgY29uc3QgaW50ZXJhY3Rpb25zID0gc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3RcblxuICAgIGNvbnN0IHBvaW50ZXJUeXBlID0gcG9pbnRlclV0aWxzLmdldFBvaW50ZXJUeXBlKGV2ZW50KVxuICAgIGNvbnN0IFtldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXRdID0gcG9pbnRlclV0aWxzLmdldEV2ZW50VGFyZ2V0cyhldmVudClcbiAgICBjb25zdCBtYXRjaGVzID0gW10gLy8gWyBbcG9pbnRlciwgaW50ZXJhY3Rpb25dLCAuLi5dXG5cbiAgICBpZiAoYnJvd3Nlci5zdXBwb3J0c1RvdWNoICYmIC90b3VjaC8udGVzdChldmVudC50eXBlKSkge1xuICAgICAgc2NvcGUucHJldlRvdWNoVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpXG5cbiAgICAgIGZvciAoY29uc3QgY2hhbmdlZFRvdWNoIG9mIGV2ZW50LmNoYW5nZWRUb3VjaGVzKSB7XG4gICAgICAgIGNvbnN0IHBvaW50ZXIgPSBjaGFuZ2VkVG91Y2hcbiAgICAgICAgY29uc3QgcG9pbnRlcklkID0gcG9pbnRlclV0aWxzLmdldFBvaW50ZXJJZChwb2ludGVyKVxuICAgICAgICBjb25zdCBzZWFyY2hEZXRhaWxzOiBTZWFyY2hEZXRhaWxzID0ge1xuICAgICAgICAgIHBvaW50ZXIsXG4gICAgICAgICAgcG9pbnRlcklkLFxuICAgICAgICAgIHBvaW50ZXJUeXBlLFxuICAgICAgICAgIGV2ZW50VHlwZTogZXZlbnQudHlwZSxcbiAgICAgICAgICBldmVudFRhcmdldCxcbiAgICAgICAgICBjdXJFdmVudFRhcmdldCxcbiAgICAgICAgICBzY29wZSxcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbnRlcmFjdGlvbiA9IGdldEludGVyYWN0aW9uKHNlYXJjaERldGFpbHMpXG5cbiAgICAgICAgbWF0Y2hlcy5wdXNoKFtcbiAgICAgICAgICBzZWFyY2hEZXRhaWxzLnBvaW50ZXIsXG4gICAgICAgICAgc2VhcmNoRGV0YWlscy5ldmVudFRhcmdldCxcbiAgICAgICAgICBzZWFyY2hEZXRhaWxzLmN1ckV2ZW50VGFyZ2V0LFxuICAgICAgICAgIGludGVyYWN0aW9uLFxuICAgICAgICBdKVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGxldCBpbnZhbGlkUG9pbnRlciA9IGZhbHNlXG5cbiAgICAgIGlmICghYnJvd3Nlci5zdXBwb3J0c1BvaW50ZXJFdmVudCAmJiAvbW91c2UvLnRlc3QoZXZlbnQudHlwZSkpIHtcbiAgICAgICAgLy8gaWdub3JlIG1vdXNlIGV2ZW50cyB3aGlsZSB0b3VjaCBpbnRlcmFjdGlvbnMgYXJlIGFjdGl2ZVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGludGVyYWN0aW9ucy5sZW5ndGggJiYgIWludmFsaWRQb2ludGVyOyBpKyspIHtcbiAgICAgICAgICBpbnZhbGlkUG9pbnRlciA9IGludGVyYWN0aW9uc1tpXS5wb2ludGVyVHlwZSAhPT0gJ21vdXNlJyAmJiBpbnRlcmFjdGlvbnNbaV0ucG9pbnRlcklzRG93blxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHJ5IHRvIGlnbm9yZSBtb3VzZSBldmVudHMgdGhhdCBhcmUgc2ltdWxhdGVkIGJ5IHRoZSBicm93c2VyXG4gICAgICAgIC8vIGFmdGVyIGEgdG91Y2ggZXZlbnRcbiAgICAgICAgaW52YWxpZFBvaW50ZXIgPSBpbnZhbGlkUG9pbnRlciB8fFxuICAgICAgICAgIChuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHNjb3BlLnByZXZUb3VjaFRpbWUgPCA1MDApIHx8XG4gICAgICAgICAgLy8gb24gaU9TIGFuZCBGaXJlZm94IE1vYmlsZSwgTW91c2VFdmVudC50aW1lU3RhbXAgaXMgemVybyBpZiBzaW11bGF0ZWRcbiAgICAgICAgICBldmVudC50aW1lU3RhbXAgPT09IDBcbiAgICAgIH1cblxuICAgICAgaWYgKCFpbnZhbGlkUG9pbnRlcikge1xuICAgICAgICBjb25zdCBzZWFyY2hEZXRhaWxzID0ge1xuICAgICAgICAgIHBvaW50ZXI6IGV2ZW50LFxuICAgICAgICAgIHBvaW50ZXJJZDogcG9pbnRlclV0aWxzLmdldFBvaW50ZXJJZChldmVudCksXG4gICAgICAgICAgcG9pbnRlclR5cGUsXG4gICAgICAgICAgZXZlbnRUeXBlOiBldmVudC50eXBlLFxuICAgICAgICAgIGN1ckV2ZW50VGFyZ2V0LFxuICAgICAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgICAgIHNjb3BlLFxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW50ZXJhY3Rpb24gPSBnZXRJbnRlcmFjdGlvbihzZWFyY2hEZXRhaWxzKVxuXG4gICAgICAgIG1hdGNoZXMucHVzaChbXG4gICAgICAgICAgc2VhcmNoRGV0YWlscy5wb2ludGVyLFxuICAgICAgICAgIHNlYXJjaERldGFpbHMuZXZlbnRUYXJnZXQsXG4gICAgICAgICAgc2VhcmNoRGV0YWlscy5jdXJFdmVudFRhcmdldCxcbiAgICAgICAgICBpbnRlcmFjdGlvbixcbiAgICAgICAgXSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tc2hhZG93XG4gICAgZm9yIChjb25zdCBbcG9pbnRlciwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0LCBpbnRlcmFjdGlvbl0gb2YgbWF0Y2hlcykge1xuICAgICAgaW50ZXJhY3Rpb25bbWV0aG9kXShwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRJbnRlcmFjdGlvbiAoc2VhcmNoRGV0YWlsczogU2VhcmNoRGV0YWlscykge1xuICBjb25zdCB7IHBvaW50ZXJUeXBlLCBzY29wZSB9ID0gc2VhcmNoRGV0YWlsc1xuXG4gIGNvbnN0IGZvdW5kSW50ZXJhY3Rpb24gPSBmaW5kZXIuc2VhcmNoKHNlYXJjaERldGFpbHMpXG4gIGNvbnN0IHNpZ25hbEFyZyA9IHsgaW50ZXJhY3Rpb246IGZvdW5kSW50ZXJhY3Rpb24sIHNlYXJjaERldGFpbHMgfVxuXG4gIHNjb3BlLmludGVyYWN0aW9ucy5zaWduYWxzLmZpcmUoJ2ZpbmQnLCBzaWduYWxBcmcpXG5cbiAgcmV0dXJuIHNpZ25hbEFyZy5pbnRlcmFjdGlvbiB8fCBuZXdJbnRlcmFjdGlvbih7IHBvaW50ZXJUeXBlIH0sIHNjb3BlKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbmV3SW50ZXJhY3Rpb24gKG9wdGlvbnMsIHNjb3BlKSB7XG4gIGNvbnN0IGludGVyYWN0aW9uID0gc2NvcGUuaW50ZXJhY3Rpb25zLm5ldyhvcHRpb25zKVxuXG4gIHNjb3BlLmludGVyYWN0aW9ucy5saXN0LnB1c2goaW50ZXJhY3Rpb24pXG4gIHJldHVybiBpbnRlcmFjdGlvblxufVxuXG5mdW5jdGlvbiBvbkRvY1NpZ25hbCAoeyBkb2MsIHNjb3BlLCBvcHRpb25zIH0sIHNpZ25hbE5hbWUpIHtcbiAgY29uc3QgeyBldmVudE1hcCB9ID0gc2NvcGUuaW50ZXJhY3Rpb25zXG4gIGNvbnN0IGV2ZW50TWV0aG9kID0gc2lnbmFsTmFtZS5pbmRleE9mKCdhZGQnKSA9PT0gMFxuICAgID8gZXZlbnRzLmFkZCA6IGV2ZW50cy5yZW1vdmVcblxuICBpZiAoc2NvcGUuYnJvd3Nlci5pc0lPUyAmJiAhb3B0aW9ucy5ldmVudHMpIHtcbiAgICBvcHRpb25zLmV2ZW50cyA9IHsgcGFzc2l2ZTogZmFsc2UgfVxuICB9XG5cbiAgLy8gZGVsZWdhdGUgZXZlbnQgbGlzdGVuZXJcbiAgZm9yIChjb25zdCBldmVudFR5cGUgaW4gZXZlbnRzLmRlbGVnYXRlZEV2ZW50cykge1xuICAgIGV2ZW50TWV0aG9kKGRvYywgZXZlbnRUeXBlLCBldmVudHMuZGVsZWdhdGVMaXN0ZW5lcilcbiAgICBldmVudE1ldGhvZChkb2MsIGV2ZW50VHlwZSwgZXZlbnRzLmRlbGVnYXRlVXNlQ2FwdHVyZSwgdHJ1ZSlcbiAgfVxuXG4gIGNvbnN0IGV2ZW50T3B0aW9ucyA9IG9wdGlvbnMgJiYgb3B0aW9ucy5ldmVudHNcblxuICBmb3IgKGNvbnN0IGV2ZW50VHlwZSBpbiBldmVudE1hcCkge1xuICAgIGV2ZW50TWV0aG9kKGRvYywgZXZlbnRUeXBlLCBldmVudE1hcFtldmVudFR5cGVdLCBldmVudE9wdGlvbnMpXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBpbnN0YWxsLFxuICBvbkRvY1NpZ25hbCxcbiAgZG9PbkludGVyYWN0aW9ucyxcbiAgbmV3SW50ZXJhY3Rpb24sXG4gIG1ldGhvZE5hbWVzLFxufVxuIl19