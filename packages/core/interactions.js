import browser from '@interactjs/utils/browser';
import domObjects from '@interactjs/utils/domObjects';
import { nodeContains } from '@interactjs/utils/domUtils';
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
    let docEvents;
    if (domObjects.PointerEvent) {
        docEvents = [
            { type: pEventTypes.down, listener: releasePointersOnRemovedEls },
            { type: pEventTypes.down, listener: listeners.pointerDown },
            { type: pEventTypes.move, listener: listeners.pointerMove },
            { type: pEventTypes.up, listener: listeners.pointerUp },
            { type: pEventTypes.cancel, listener: listeners.pointerUp },
        ];
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
        ];
    }
    docEvents.push({
        type: 'blur',
        listener(event) {
            for (const interaction of scope.interactions.list) {
                interaction.documentBlur(event);
            }
        },
    });
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
        docEvents,
        pointerMoveTolerance: 1,
    };
    function releasePointersOnRemovedEls() {
        // for all inactive touch interactions with pointers down
        for (const interaction of scope.interactions.list) {
            if (!interaction.pointerIsDown ||
                interaction.pointerType !== 'touch' ||
                interaction._interacting) {
                continue;
            }
            // if a pointer is down on an element that is no longer in the DOM tree
            for (const pointer of interaction.pointers) {
                if (!scope.documents.some(({ doc }) => nodeContains(doc, pointer.downTarget))) {
                    // remove the pointer from the interaction
                    interaction.removePointer(pointer.pointer, pointer.event);
                }
            }
        }
    }
}
function doOnInteractions(method, scope) {
    return function (event) {
        const interactions = scope.interactions.list;
        const pointerType = pointerUtils.getPointerType(event);
        const [eventTarget, curEventTarget] = pointerUtils.getEventTargets(event);
        const matches = []; // [ [pointer, interaction], ...]
        if (/^touch/.test(event.type)) {
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
    const { docEvents } = scope.interactions;
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
    for (const { type, listener } of docEvents) {
        eventMethod(doc, type, listener, eventOptions);
    }
}
export default {
    id: 'core/interactions',
    install,
    onDocSignal,
    doOnInteractions,
    methodNames,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZXJhY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sT0FBTyxNQUFNLDJCQUEyQixDQUFBO0FBQy9DLE9BQU8sVUFBVSxNQUFNLDhCQUE4QixDQUFBO0FBQ3JELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQTtBQUN6RCxPQUFPLE1BQU0sTUFBTSwwQkFBMEIsQ0FBQTtBQUM3QyxPQUFPLFlBQVksTUFBTSxnQ0FBZ0MsQ0FBQTtBQUN6RCxPQUFPLE9BQU8sTUFBTSwyQkFBMkIsQ0FBQTtBQUMvQyxPQUFPLGVBQWUsTUFBTSxlQUFlLENBQUE7QUFDM0MsT0FBTyxNQUF5QixNQUFNLHFCQUFxQixDQUFBO0FBa0IzRCxNQUFNLFdBQVcsR0FBRztJQUNsQixhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVc7SUFDekMsZUFBZSxFQUFFLGVBQWUsRUFBRSxZQUFZO0NBQy9DLENBQUE7QUFFRCxTQUFTLE9BQU8sQ0FBRSxLQUFZO0lBQzVCLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUE7SUFFN0IsTUFBTSxTQUFTLEdBQUcsRUFBUyxDQUFBO0lBRTNCLEtBQUssTUFBTSxNQUFNLElBQUksV0FBVyxFQUFFO1FBQ2hDLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUE7S0FDcEQ7SUFFRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFBO0lBQ3ZDLElBQUksU0FBOEMsQ0FBQTtJQUVsRCxJQUFJLFVBQVUsQ0FBQyxZQUFZLEVBQUU7UUFDM0IsU0FBUyxHQUFHO1lBQ1YsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBSSxRQUFRLEVBQUUsMkJBQTJCLEVBQUU7WUFDbkUsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBSSxRQUFRLEVB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b20gJ0BpbnRlcmFjdGpzL3V0aWxzL2Jyb3dzZXInXG5pbXBvcnQgZG9tT2JqZWN0cyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9kb21PYmplY3RzJ1xuaW1wb3J0IHsgbm9kZUNvbnRhaW5zIH0gZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZG9tVXRpbHMnXG5pbXBvcnQgZXZlbnRzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2V2ZW50cydcbmltcG9ydCBwb2ludGVyVXRpbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvcG9pbnRlclV0aWxzJ1xuaW1wb3J0IFNpZ25hbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvU2lnbmFscydcbmltcG9ydCBJbnRlcmFjdGlvbkJhc2UgZnJvbSAnLi9JbnRlcmFjdGlvbidcbmltcG9ydCBmaW5kZXIsIHsgU2VhcmNoRGV0YWlscyB9IGZyb20gJy4vaW50ZXJhY3Rpb25GaW5kZXInXG5pbXBvcnQgeyBTY29wZSB9IGZyb20gJy4vc2NvcGUnXG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJyB7XG4gIGludGVyZmFjZSBTY29wZSB7XG4gICAgSW50ZXJhY3Rpb246IHR5cGVvZiBJbnRlcmFjdGlvbkJhc2VcbiAgICBpbnRlcmFjdGlvbnM6IHtcbiAgICAgIHNpZ25hbHM6IFNpZ25hbHNcbiAgICAgIG5ldzogKG9wdGlvbnM6IGFueSkgPT4gSW50ZXJhY3Rpb25CYXNlXG4gICAgICBsaXN0OiBJbnRlcmFjdGlvbkJhc2VbXVxuICAgICAgbGlzdGVuZXJzOiB7IFt0eXBlOiBzdHJpbmddOiBJbnRlcmFjdC5MaXN0ZW5lciB9XG4gICAgICBkb2NFdmVudHM6IEFycmF5PHsgdHlwZTogc3RyaW5nLCBsaXN0ZW5lcjogSW50ZXJhY3QuTGlzdGVuZXIgfT5cbiAgICAgIHBvaW50ZXJNb3ZlVG9sZXJhbmNlOiBudW1iZXJcbiAgICB9XG4gICAgcHJldlRvdWNoVGltZTogbnVtYmVyXG4gIH1cbn1cblxuY29uc3QgbWV0aG9kTmFtZXMgPSBbXG4gICdwb2ludGVyRG93bicsICdwb2ludGVyTW92ZScsICdwb2ludGVyVXAnLFxuICAndXBkYXRlUG9pbnRlcicsICdyZW1vdmVQb2ludGVyJywgJ3dpbmRvd0JsdXInLFxuXVxuXG5mdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qgc2lnbmFscyA9IG5ldyBTaWduYWxzKClcblxuICBjb25zdCBsaXN0ZW5lcnMgPSB7fSBhcyBhbnlcblxuICBmb3IgKGNvbnN0IG1ldGhvZCBvZiBtZXRob2ROYW1lcykge1xuICAgIGxpc3RlbmVyc1ttZXRob2RdID0gZG9PbkludGVyYWN0aW9ucyhtZXRob2QsIHNjb3BlKVxuICB9XG5cbiAgY29uc3QgcEV2ZW50VHlwZXMgPSBicm93c2VyLnBFdmVudFR5cGVzXG4gIGxldCBkb2NFdmVudHM6IHR5cGVvZiBzY29wZS5pbnRlcmFjdGlvbnMuZG9jRXZlbnRzXG5cbiAgaWYgKGRvbU9iamVjdHMuUG9pbnRlckV2ZW50KSB7XG4gICAgZG9jRXZlbnRzID0gW1xuICAgICAgeyB0eXBlOiBwRXZlbnRUeXBlcy5kb3duLCAgIGxpc3RlbmVyOiByZWxlYXNlUG9pbnRlcnNPblJlbW92ZWRFbHMgfSxcbiAgICAgIHsgdHlwZTogcEV2ZW50VHlwZXMuZG93biwgICBsaXN0ZW5lcjogbGlzdGVuZXJzLnBvaW50ZXJEb3duIH0sXG4gICAgICB7IHR5cGU6IHBFdmVudFR5cGVzLm1vdmUsICAgbGlzdGVuZXI6IGxpc3RlbmVycy5wb2ludGVyTW92ZSB9LFxuICAgICAgeyB0eXBlOiBwRXZlbnRUeXBlcy51cCwgICAgIGxpc3RlbmVyOiBsaXN0ZW5lcnMucG9pbnRlclVwIH0sXG4gICAgICB7IHR5cGU6IHBFdmVudFR5cGVzLmNhbmNlbCwgbGlzdGVuZXI6IGxpc3RlbmVycy5wb2ludGVyVXAgfSxcbiAgICBdXG4gIH1cbiAgZWxzZSB7XG4gICAgZG9jRXZlbnRzID0gW1xuICAgICAgeyB0eXBlOiAnbW91c2Vkb3duJywgbGlzdGVuZXI6IGxpc3RlbmVycy5wb2ludGVyRG93biB9LFxuICAgICAgeyB0eXBlOiAnbW91c2Vtb3ZlJywgbGlzdGVuZXI6IGxpc3RlbmVycy5wb2ludGVyTW92ZSB9LFxuICAgICAgeyB0eXBlOiAnbW91c2V1cCcsIGxpc3RlbmVyOiBsaXN0ZW5lcnMucG9pbnRlclVwIH0sXG5cbiAgICAgIHsgdHlwZTogJ3RvdWNoc3RhcnQnLCBsaXN0ZW5lcjogcmVsZWFzZVBvaW50ZXJzT25SZW1vdmVkRWxzIH0sXG4gICAgICB7IHR5cGU6ICd0b3VjaHN0YXJ0JywgbGlzdGVuZXI6IGxpc3RlbmVycy5wb2ludGVyRG93biB9LFxuICAgICAgeyB0eXBlOiAndG91Y2htb3ZlJywgbGlzdGVuZXI6IGxpc3RlbmVycy5wb2ludGVyTW92ZSB9LFxuICAgICAgeyB0eXBlOiAndG91Y2hlbmQnLCBsaXN0ZW5lcjogbGlzdGVuZXJzLnBvaW50ZXJVcCB9LFxuICAgICAgeyB0eXBlOiAndG91Y2hjYW5jZWwnLCBsaXN0ZW5lcjogbGlzdGVuZXJzLnBvaW50ZXJVcCB9LFxuICAgIF1cbiAgfVxuXG4gIGRvY0V2ZW50cy5wdXNoKHtcbiAgICB0eXBlOiAnYmx1cicsXG4gICAgbGlzdGVuZXIgKGV2ZW50KSB7XG4gICAgICBmb3IgKGNvbnN0IGludGVyYWN0aW9uIG9mIHNjb3BlLmludGVyYWN0aW9ucy5saXN0KSB7XG4gICAgICAgIGludGVyYWN0aW9uLmRvY3VtZW50Qmx1cihldmVudClcbiAgICAgIH1cbiAgICB9LFxuICB9KVxuXG4gIHNjb3BlLnNpZ25hbHMub24oJ2FkZC1kb2N1bWVudCcsIG9uRG9jU2lnbmFsKVxuICBzY29wZS5zaWduYWxzLm9uKCdyZW1vdmUtZG9jdW1lbnQnLCBvbkRvY1NpZ25hbClcblxuICAvLyBmb3IgaWdub3JpbmcgYnJvd3NlcidzIHNpbXVsYXRlZCBtb3VzZSBldmVudHNcbiAgc2NvcGUucHJldlRvdWNoVGltZSA9IDBcblxuICBzY29wZS5JbnRlcmFjdGlvbiA9IGNsYXNzIEludGVyYWN0aW9uIGV4dGVuZHMgSW50ZXJhY3Rpb25CYXNlIHtcbiAgICBnZXQgcG9pbnRlck1vdmVUb2xlcmFuY2UgKCkge1xuICAgICAgcmV0dXJuIHNjb3BlLmludGVyYWN0aW9ucy5wb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgIH1cblxuICAgIHNldCBwb2ludGVyTW92ZVRvbGVyYW5jZSAodmFsdWUpIHtcbiAgICAgIHNjb3BlLmludGVyYWN0aW9ucy5wb2ludGVyTW92ZVRvbGVyYW5jZSA9IHZhbHVlXG4gICAgfVxuXG4gICAgX25vdyAoKSB7IHJldHVybiBzY29wZS5ub3coKSB9XG4gIH1cblxuICBzY29wZS5pbnRlcmFjdGlvbnMgPSB7XG4gICAgc2lnbmFscyxcbiAgICAvLyBhbGwgYWN0aXZlIGFuZCBpZGxlIGludGVyYWN0aW9uc1xuICAgIGxpc3Q6IFtdLFxuICAgIG5ldyAob3B0aW9uczogeyBwb2ludGVyVHlwZT86IHN0cmluZywgc2lnbmFscz86IFNpZ25hbHMgfSkge1xuICAgICAgb3B0aW9ucy5zaWduYWxzID0gc2lnbmFsc1xuXG4gICAgICBjb25zdCBpbnRlcmFjdGlvbiA9IG5ldyBzY29wZS5JbnRlcmFjdGlvbihvcHRpb25zIGFzIFJlcXVpcmVkPHR5cGVvZiBvcHRpb25zPilcblxuICAgICAgc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QucHVzaChpbnRlcmFjdGlvbilcbiAgICAgIHJldHVybiBpbnRlcmFjdGlvblxuICAgIH0sXG4gICAgbGlzdGVuZXJzLFxuICAgIGRvY0V2ZW50cyxcbiAgICBwb2ludGVyTW92ZVRvbGVyYW5jZTogMSxcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbGVhc2VQb2ludGVyc09uUmVtb3ZlZEVscyAoKSB7XG4gICAgLy8gZm9yIGFsbCBpbmFjdGl2ZSB0b3VjaCBpbnRlcmFjdGlvbnMgd2l0aCBwb2ludGVycyBkb3duXG4gICAgZm9yIChjb25zdCBpbnRlcmFjdGlvbiBvZiBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCkge1xuICAgICAgaWYgKCFpbnRlcmFjdGlvbi5wb2ludGVySXNEb3duIHx8XG4gICAgICAgIGludGVyYWN0aW9uLnBvaW50ZXJUeXBlICE9PSAndG91Y2gnIHx8XG4gICAgICAgIGludGVyYWN0aW9uLl9pbnRlcmFjdGluZykge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyBpZiBhIHBvaW50ZXIgaXMgZG93biBvbiBhbiBlbGVtZW50IHRoYXQgaXMgbm8gbG9uZ2VyIGluIHRoZSBET00gdHJlZVxuICAgICAgZm9yIChjb25zdCBwb2ludGVyIG9mIGludGVyYWN0aW9uLnBvaW50ZXJzKSB7XG4gICAgICAgIGlmICghc2NvcGUuZG9jdW1lbnRzLnNvbWUoKHsgZG9jIH0pID0+IG5vZGVDb250YWlucyhkb2MsIHBvaW50ZXIuZG93blRhcmdldCkpKSB7XG4gICAgICAgICAgLy8gcmVtb3ZlIHRoZSBwb2ludGVyIGZyb20gdGhlIGludGVyYWN0aW9uXG4gICAgICAgICAgaW50ZXJhY3Rpb24ucmVtb3ZlUG9pbnRlcihwb2ludGVyLnBvaW50ZXIsIHBvaW50ZXIuZXZlbnQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZG9PbkludGVyYWN0aW9ucyAobWV0aG9kLCBzY29wZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgY29uc3QgaW50ZXJhY3Rpb25zID0gc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3RcblxuICAgIGNvbnN0IHBvaW50ZXJUeXBlID0gcG9pbnRlclV0aWxzLmdldFBvaW50ZXJUeXBlKGV2ZW50KVxuICAgIGNvbnN0IFtldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXRdID0gcG9pbnRlclV0aWxzLmdldEV2ZW50VGFyZ2V0cyhldmVudClcbiAgICBjb25zdCBtYXRjaGVzID0gW10gLy8gWyBbcG9pbnRlciwgaW50ZXJhY3Rpb25dLCAuLi5dXG5cbiAgICBpZiAoL150b3VjaC8udGVzdChldmVudC50eXBlKSkge1xuICAgICAgc2NvcGUucHJldlRvdWNoVGltZSA9IHNjb3BlLm5vdygpXG5cbiAgICAgIGZvciAoY29uc3QgY2hhbmdlZFRvdWNoIG9mIGV2ZW50LmNoYW5nZWRUb3VjaGVzKSB7XG4gICAgICAgIGNvbnN0IHBvaW50ZXIgPSBjaGFuZ2VkVG91Y2hcbiAgICAgICAgY29uc3QgcG9pbnRlcklkID0gcG9pbnRlclV0aWxzLmdldFBvaW50ZXJJZChwb2ludGVyKVxuICAgICAgICBjb25zdCBzZWFyY2hEZXRhaWxzOiBTZWFyY2hEZXRhaWxzID0ge1xuICAgICAgICAgIHBvaW50ZXIsXG4gICAgICAgICAgcG9pbnRlcklkLFxuICAgICAgICAgIHBvaW50ZXJUeXBlLFxuICAgICAgICAgIGV2ZW50VHlwZTogZXZlbnQudHlwZSxcbiAgICAgICAgICBldmVudFRhcmdldCxcbiAgICAgICAgICBjdXJFdmVudFRhcmdldCxcbiAgICAgICAgICBzY29wZSxcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbnRlcmFjdGlvbiA9IGdldEludGVyYWN0aW9uKHNlYXJjaERldGFpbHMpXG5cbiAgICAgICAgbWF0Y2hlcy5wdXNoKFtcbiAgICAgICAgICBzZWFyY2hEZXRhaWxzLnBvaW50ZXIsXG4gICAgICAgICAgc2VhcmNoRGV0YWlscy5ldmVudFRhcmdldCxcbiAgICAgICAgICBzZWFyY2hEZXRhaWxzLmN1ckV2ZW50VGFyZ2V0LFxuICAgICAgICAgIGludGVyYWN0aW9uLFxuICAgICAgICBdKVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGxldCBpbnZhbGlkUG9pbnRlciA9IGZhbHNlXG5cbiAgICAgIGlmICghYnJvd3Nlci5zdXBwb3J0c1BvaW50ZXJFdmVudCAmJiAvbW91c2UvLnRlc3QoZXZlbnQudHlwZSkpIHtcbiAgICAgICAgLy8gaWdub3JlIG1vdXNlIGV2ZW50cyB3aGlsZSB0b3VjaCBpbnRlcmFjdGlvbnMgYXJlIGFjdGl2ZVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGludGVyYWN0aW9ucy5sZW5ndGggJiYgIWludmFsaWRQb2ludGVyOyBpKyspIHtcbiAgICAgICAgICBpbnZhbGlkUG9pbnRlciA9IGludGVyYWN0aW9uc1tpXS5wb2ludGVyVHlwZSAhPT0gJ21vdXNlJyAmJiBpbnRlcmFjdGlvbnNbaV0ucG9pbnRlcklzRG93blxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHJ5IHRvIGlnbm9yZSBtb3VzZSBldmVudHMgdGhhdCBhcmUgc2ltdWxhdGVkIGJ5IHRoZSBicm93c2VyXG4gICAgICAgIC8vIGFmdGVyIGEgdG91Y2ggZXZlbnRcbiAgICAgICAgaW52YWxpZFBvaW50ZXIgPSBpbnZhbGlkUG9pbnRlciB8fFxuICAgICAgICAgIChzY29wZS5ub3coKSAtIHNjb3BlLnByZXZUb3VjaFRpbWUgPCA1MDApIHx8XG4gICAgICAgICAgLy8gb24gaU9TIGFuZCBGaXJlZm94IE1vYmlsZSwgTW91c2VFdmVudC50aW1lU3RhbXAgaXMgemVybyBpZiBzaW11bGF0ZWRcbiAgICAgICAgICBldmVudC50aW1lU3RhbXAgPT09IDBcbiAgICAgIH1cblxuICAgICAgaWYgKCFpbnZhbGlkUG9pbnRlcikge1xuICAgICAgICBjb25zdCBzZWFyY2hEZXRhaWxzID0ge1xuICAgICAgICAgIHBvaW50ZXI6IGV2ZW50LFxuICAgICAgICAgIHBvaW50ZXJJZDogcG9pbnRlclV0aWxzLmdldFBvaW50ZXJJZChldmVudCksXG4gICAgICAgICAgcG9pbnRlclR5cGUsXG4gICAgICAgICAgZXZlbnRUeXBlOiBldmVudC50eXBlLFxuICAgICAgICAgIGN1ckV2ZW50VGFyZ2V0LFxuICAgICAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgICAgIHNjb3BlLFxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW50ZXJhY3Rpb24gPSBnZXRJbnRlcmFjdGlvbihzZWFyY2hEZXRhaWxzKVxuXG4gICAgICAgIG1hdGNoZXMucHVzaChbXG4gICAgICAgICAgc2VhcmNoRGV0YWlscy5wb2ludGVyLFxuICAgICAgICAgIHNlYXJjaERldGFpbHMuZXZlbnRUYXJnZXQsXG4gICAgICAgICAgc2VhcmNoRGV0YWlscy5jdXJFdmVudFRhcmdldCxcbiAgICAgICAgICBpbnRlcmFjdGlvbixcbiAgICAgICAgXSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tc2hhZG93XG4gICAgZm9yIChjb25zdCBbcG9pbnRlciwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0LCBpbnRlcmFjdGlvbl0gb2YgbWF0Y2hlcykge1xuICAgICAgaW50ZXJhY3Rpb25bbWV0aG9kXShwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRJbnRlcmFjdGlvbiAoc2VhcmNoRGV0YWlsczogU2VhcmNoRGV0YWlscykge1xuICBjb25zdCB7IHBvaW50ZXJUeXBlLCBzY29wZSB9ID0gc2VhcmNoRGV0YWlsc1xuXG4gIGNvbnN0IGZvdW5kSW50ZXJhY3Rpb24gPSBmaW5kZXIuc2VhcmNoKHNlYXJjaERldGFpbHMpXG4gIGNvbnN0IHNpZ25hbEFyZyA9IHsgaW50ZXJhY3Rpb246IGZvdW5kSW50ZXJhY3Rpb24sIHNlYXJjaERldGFpbHMgfVxuXG4gIHNjb3BlLmludGVyYWN0aW9ucy5zaWduYWxzLmZpcmUoJ2ZpbmQnLCBzaWduYWxBcmcpXG5cbiAgcmV0dXJuIHNpZ25hbEFyZy5pbnRlcmFjdGlvbiB8fCBzY29wZS5pbnRlcmFjdGlvbnMubmV3KHsgcG9pbnRlclR5cGUgfSlcbn1cblxuZnVuY3Rpb24gb25Eb2NTaWduYWwgKHsgZG9jLCBzY29wZSwgb3B0aW9ucyB9LCBzaWduYWxOYW1lKSB7XG4gIGNvbnN0IHsgZG9jRXZlbnRzIH0gPSBzY29wZS5pbnRlcmFjdGlvbnNcbiAgY29uc3QgZXZlbnRNZXRob2QgPSBzaWduYWxOYW1lLmluZGV4T2YoJ2FkZCcpID09PSAwXG4gICAgPyBldmVudHMuYWRkIDogZXZlbnRzLnJlbW92ZVxuXG4gIGlmIChzY29wZS5icm93c2VyLmlzSU9TICYmICFvcHRpb25zLmV2ZW50cykge1xuICAgIG9wdGlvbnMuZXZlbnRzID0geyBwYXNzaXZlOiBmYWxzZSB9XG4gIH1cblxuICAvLyBkZWxlZ2F0ZSBldmVudCBsaXN0ZW5lclxuICBmb3IgKGNvbnN0IGV2ZW50VHlwZSBpbiBldmVudHMuZGVsZWdhdGVkRXZlbnRzKSB7XG4gICAgZXZlbnRNZXRob2QoZG9jLCBldmVudFR5cGUsIGV2ZW50cy5kZWxlZ2F0ZUxpc3RlbmVyKVxuICAgIGV2ZW50TWV0aG9kKGRvYywgZXZlbnRUeXBlLCBldmVudHMuZGVsZWdhdGVVc2VDYXB0dXJlLCB0cnVlKVxuICB9XG5cbiAgY29uc3QgZXZlbnRPcHRpb25zID0gb3B0aW9ucyAmJiBvcHRpb25zLmV2ZW50c1xuXG4gIGZvciAoY29uc3QgeyB0eXBlLCBsaXN0ZW5lciB9IG9mIGRvY0V2ZW50cykge1xuICAgIGV2ZW50TWV0aG9kKGRvYywgdHlwZSwgbGlzdGVuZXIsIGV2ZW50T3B0aW9ucylcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGlkOiAnY29yZS9pbnRlcmFjdGlvbnMnLFxuICBpbnN0YWxsLFxuICBvbkRvY1NpZ25hbCxcbiAgZG9PbkludGVyYWN0aW9ucyxcbiAgbWV0aG9kTmFtZXMsXG59XG4iXX0=