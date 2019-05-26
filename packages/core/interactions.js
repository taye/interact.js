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
    let eventMap;
    if (domObjects.PointerEvent) {
        eventMap = [
            { type: pEventTypes.down, listener: releasePointersOnRemovedEls },
            { type: pEventTypes.down, listener: listeners.pointerDown },
            { type: pEventTypes.move, listener: listeners.pointerMove },
            { type: pEventTypes.up, listener: listeners.pointerUp },
            { type: pEventTypes.cancel, listener: listeners.pointerUp },
        ];
    }
    else {
        eventMap = [
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
    eventMap.push({
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
        eventMap,
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
    for (const { type, listener } of eventMap) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZXJhY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sT0FBTyxNQUFNLDJCQUEyQixDQUFBO0FBQy9DLE9BQU8sVUFBVSxNQUFNLDhCQUE4QixDQUFBO0FBQ3JELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQTtBQUN6RCxPQUFPLE1BQU0sTUFBTSwwQkFBMEIsQ0FBQTtBQUM3QyxPQUFPLFlBQVksTUFBTSxnQ0FBZ0MsQ0FBQTtBQUN6RCxPQUFPLE9BQU8sTUFBTSwyQkFBMkIsQ0FBQTtBQUMvQyxPQUFPLGVBQWUsTUFBTSxlQUFlLENBQUE7QUFDM0MsT0FBTyxNQUF5QixNQUFNLHFCQUFxQixDQUFBO0FBa0IzRCxNQUFNLFdBQVcsR0FBRztJQUNsQixhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVc7SUFDekMsZUFBZSxFQUFFLGVBQWUsRUFBRSxZQUFZO0NBQy9DLENBQUE7QUFFRCxTQUFTLE9BQU8sQ0FBRSxLQUFZO0lBQzVCLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUE7SUFFN0IsTUFBTSxTQUFTLEdBQUcsRUFBUyxDQUFBO0lBRTNCLEtBQUssTUFBTSxNQUFNLElBQUksV0FBVyxFQUFFO1FBQ2hDLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUE7S0FDcEQ7SUFFRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFBO0lBQ3ZDLElBQUksUUFBNEMsQ0FBQTtJQUVoRCxJQUFJLFVBQVUsQ0FBQyxZQUFZLEVBQUU7UUFDM0IsUUFBUSxHQUFHO1lBQ1QsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBSSxRQUFRLEVBQUUsMkJBQTJCLEVBQUU7WUFDbkUsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBSSxRQUFRLEVB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b20gJ0BpbnRlcmFjdGpzL3V0aWxzL2Jyb3dzZXInXG5pbXBvcnQgZG9tT2JqZWN0cyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9kb21PYmplY3RzJ1xuaW1wb3J0IHsgbm9kZUNvbnRhaW5zIH0gZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZG9tVXRpbHMnXG5pbXBvcnQgZXZlbnRzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2V2ZW50cydcbmltcG9ydCBwb2ludGVyVXRpbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvcG9pbnRlclV0aWxzJ1xuaW1wb3J0IFNpZ25hbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvU2lnbmFscydcbmltcG9ydCBJbnRlcmFjdGlvbkJhc2UgZnJvbSAnLi9JbnRlcmFjdGlvbidcbmltcG9ydCBmaW5kZXIsIHsgU2VhcmNoRGV0YWlscyB9IGZyb20gJy4vaW50ZXJhY3Rpb25GaW5kZXInXG5pbXBvcnQgeyBTY29wZSB9IGZyb20gJy4vc2NvcGUnXG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJyB7XG4gIGludGVyZmFjZSBTY29wZSB7XG4gICAgSW50ZXJhY3Rpb246IHR5cGVvZiBJbnRlcmFjdGlvbkJhc2VcbiAgICBpbnRlcmFjdGlvbnM6IHtcbiAgICAgIHNpZ25hbHM6IFNpZ25hbHNcbiAgICAgIG5ldzogKG9wdGlvbnM6IGFueSkgPT4gSW50ZXJhY3Rpb25CYXNlXG4gICAgICBsaXN0OiBJbnRlcmFjdGlvbkJhc2VbXVxuICAgICAgbGlzdGVuZXJzOiB7IFt0eXBlOiBzdHJpbmddOiBJbnRlcmFjdC5MaXN0ZW5lciB9XG4gICAgICBldmVudE1hcDogQXJyYXk8eyB0eXBlOiBzdHJpbmcsIGxpc3RlbmVyOiBJbnRlcmFjdC5MaXN0ZW5lciB9PlxuICAgICAgcG9pbnRlck1vdmVUb2xlcmFuY2U6IG51bWJlclxuICAgIH1cbiAgICBwcmV2VG91Y2hUaW1lOiBudW1iZXJcbiAgfVxufVxuXG5jb25zdCBtZXRob2ROYW1lcyA9IFtcbiAgJ3BvaW50ZXJEb3duJywgJ3BvaW50ZXJNb3ZlJywgJ3BvaW50ZXJVcCcsXG4gICd1cGRhdGVQb2ludGVyJywgJ3JlbW92ZVBvaW50ZXInLCAnd2luZG93Qmx1cicsXG5dXG5cbmZ1bmN0aW9uIGluc3RhbGwgKHNjb3BlOiBTY29wZSkge1xuICBjb25zdCBzaWduYWxzID0gbmV3IFNpZ25hbHMoKVxuXG4gIGNvbnN0IGxpc3RlbmVycyA9IHt9IGFzIGFueVxuXG4gIGZvciAoY29uc3QgbWV0aG9kIG9mIG1ldGhvZE5hbWVzKSB7XG4gICAgbGlzdGVuZXJzW21ldGhvZF0gPSBkb09uSW50ZXJhY3Rpb25zKG1ldGhvZCwgc2NvcGUpXG4gIH1cblxuICBjb25zdCBwRXZlbnRUeXBlcyA9IGJyb3dzZXIucEV2ZW50VHlwZXNcbiAgbGV0IGV2ZW50TWFwOiB0eXBlb2Ygc2NvcGUuaW50ZXJhY3Rpb25zLmV2ZW50TWFwXG5cbiAgaWYgKGRvbU9iamVjdHMuUG9pbnRlckV2ZW50KSB7XG4gICAgZXZlbnRNYXAgPSBbXG4gICAgICB7IHR5cGU6IHBFdmVudFR5cGVzLmRvd24sICAgbGlzdGVuZXI6IHJlbGVhc2VQb2ludGVyc09uUmVtb3ZlZEVscyB9LFxuICAgICAgeyB0eXBlOiBwRXZlbnRUeXBlcy5kb3duLCAgIGxpc3RlbmVyOiBsaXN0ZW5lcnMucG9pbnRlckRvd24gfSxcbiAgICAgIHsgdHlwZTogcEV2ZW50VHlwZXMubW92ZSwgICBsaXN0ZW5lcjogbGlzdGVuZXJzLnBvaW50ZXJNb3ZlIH0sXG4gICAgICB7IHR5cGU6IHBFdmVudFR5cGVzLnVwLCAgICAgbGlzdGVuZXI6IGxpc3RlbmVycy5wb2ludGVyVXAgfSxcbiAgICAgIHsgdHlwZTogcEV2ZW50VHlwZXMuY2FuY2VsLCBsaXN0ZW5lcjogbGlzdGVuZXJzLnBvaW50ZXJVcCB9LFxuICAgIF1cbiAgfVxuICBlbHNlIHtcbiAgICBldmVudE1hcCA9IFtcbiAgICAgIHsgdHlwZTogJ21vdXNlZG93bicsIGxpc3RlbmVyOiBsaXN0ZW5lcnMucG9pbnRlckRvd24gfSxcbiAgICAgIHsgdHlwZTogJ21vdXNlbW92ZScsIGxpc3RlbmVyOiBsaXN0ZW5lcnMucG9pbnRlck1vdmUgfSxcbiAgICAgIHsgdHlwZTogJ21vdXNldXAnLCBsaXN0ZW5lcjogbGlzdGVuZXJzLnBvaW50ZXJVcCB9LFxuXG4gICAgICB7IHR5cGU6ICd0b3VjaHN0YXJ0JywgbGlzdGVuZXI6IHJlbGVhc2VQb2ludGVyc09uUmVtb3ZlZEVscyB9LFxuICAgICAgeyB0eXBlOiAndG91Y2hzdGFydCcsIGxpc3RlbmVyOiBsaXN0ZW5lcnMucG9pbnRlckRvd24gfSxcbiAgICAgIHsgdHlwZTogJ3RvdWNobW92ZScsIGxpc3RlbmVyOiBsaXN0ZW5lcnMucG9pbnRlck1vdmUgfSxcbiAgICAgIHsgdHlwZTogJ3RvdWNoZW5kJywgbGlzdGVuZXI6IGxpc3RlbmVycy5wb2ludGVyVXAgfSxcbiAgICAgIHsgdHlwZTogJ3RvdWNoY2FuY2VsJywgbGlzdGVuZXI6IGxpc3RlbmVycy5wb2ludGVyVXAgfSxcbiAgICBdXG4gIH1cblxuICBldmVudE1hcC5wdXNoKHtcbiAgICB0eXBlOiAnYmx1cicsXG4gICAgbGlzdGVuZXIgKGV2ZW50KSB7XG4gICAgICBmb3IgKGNvbnN0IGludGVyYWN0aW9uIG9mIHNjb3BlLmludGVyYWN0aW9ucy5saXN0KSB7XG4gICAgICAgIGludGVyYWN0aW9uLmRvY3VtZW50Qmx1cihldmVudClcbiAgICAgIH1cbiAgICB9LFxuICB9KVxuXG4gIHNjb3BlLnNpZ25hbHMub24oJ2FkZC1kb2N1bWVudCcsIG9uRG9jU2lnbmFsKVxuICBzY29wZS5zaWduYWxzLm9uKCdyZW1vdmUtZG9jdW1lbnQnLCBvbkRvY1NpZ25hbClcblxuICAvLyBmb3IgaWdub3JpbmcgYnJvd3NlcidzIHNpbXVsYXRlZCBtb3VzZSBldmVudHNcbiAgc2NvcGUucHJldlRvdWNoVGltZSA9IDBcblxuICBzY29wZS5JbnRlcmFjdGlvbiA9IGNsYXNzIEludGVyYWN0aW9uIGV4dGVuZHMgSW50ZXJhY3Rpb25CYXNlIHtcbiAgICBnZXQgcG9pbnRlck1vdmVUb2xlcmFuY2UgKCkge1xuICAgICAgcmV0dXJuIHNjb3BlLmludGVyYWN0aW9ucy5wb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgIH1cblxuICAgIHNldCBwb2ludGVyTW92ZVRvbGVyYW5jZSAodmFsdWUpIHtcbiAgICAgIHNjb3BlLmludGVyYWN0aW9ucy5wb2ludGVyTW92ZVRvbGVyYW5jZSA9IHZhbHVlXG4gICAgfVxuXG4gICAgX25vdyAoKSB7IHJldHVybiBzY29wZS5ub3coKSB9XG4gIH1cblxuICBzY29wZS5pbnRlcmFjdGlvbnMgPSB7XG4gICAgc2lnbmFscyxcbiAgICAvLyBhbGwgYWN0aXZlIGFuZCBpZGxlIGludGVyYWN0aW9uc1xuICAgIGxpc3Q6IFtdLFxuICAgIG5ldyAob3B0aW9uczogeyBwb2ludGVyVHlwZT86IHN0cmluZywgc2lnbmFscz86IFNpZ25hbHMgfSkge1xuICAgICAgb3B0aW9ucy5zaWduYWxzID0gc2lnbmFsc1xuXG4gICAgICBjb25zdCBpbnRlcmFjdGlvbiA9IG5ldyBzY29wZS5JbnRlcmFjdGlvbihvcHRpb25zIGFzIFJlcXVpcmVkPHR5cGVvZiBvcHRpb25zPilcblxuICAgICAgc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QucHVzaChpbnRlcmFjdGlvbilcbiAgICAgIHJldHVybiBpbnRlcmFjdGlvblxuICAgIH0sXG4gICAgbGlzdGVuZXJzLFxuICAgIGV2ZW50TWFwLFxuICAgIHBvaW50ZXJNb3ZlVG9sZXJhbmNlOiAxLFxuICB9XG5cbiAgZnVuY3Rpb24gcmVsZWFzZVBvaW50ZXJzT25SZW1vdmVkRWxzICgpIHtcbiAgICAvLyBmb3IgYWxsIGluYWN0aXZlIHRvdWNoIGludGVyYWN0aW9ucyB3aXRoIHBvaW50ZXJzIGRvd25cbiAgICBmb3IgKGNvbnN0IGludGVyYWN0aW9uIG9mIHNjb3BlLmludGVyYWN0aW9ucy5saXN0KSB7XG4gICAgICBpZiAoIWludGVyYWN0aW9uLnBvaW50ZXJJc0Rvd24gfHxcbiAgICAgICAgaW50ZXJhY3Rpb24ucG9pbnRlclR5cGUgIT09ICd0b3VjaCcgfHxcbiAgICAgICAgaW50ZXJhY3Rpb24uX2ludGVyYWN0aW5nKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIGlmIGEgcG9pbnRlciBpcyBkb3duIG9uIGFuIGVsZW1lbnQgdGhhdCBpcyBubyBsb25nZXIgaW4gdGhlIERPTSB0cmVlXG4gICAgICBmb3IgKGNvbnN0IHBvaW50ZXIgb2YgaW50ZXJhY3Rpb24ucG9pbnRlcnMpIHtcbiAgICAgICAgaWYgKCFzY29wZS5kb2N1bWVudHMuc29tZSgoeyBkb2MgfSkgPT4gbm9kZUNvbnRhaW5zKGRvYywgcG9pbnRlci5kb3duVGFyZ2V0KSkpIHtcbiAgICAgICAgICAvLyByZW1vdmUgdGhlIHBvaW50ZXIgZnJvbSB0aGUgaW50ZXJhY3Rpb25cbiAgICAgICAgICBpbnRlcmFjdGlvbi5yZW1vdmVQb2ludGVyKHBvaW50ZXIucG9pbnRlciwgcG9pbnRlci5ldmVudClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBkb09uSW50ZXJhY3Rpb25zIChtZXRob2QsIHNjb3BlKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBjb25zdCBpbnRlcmFjdGlvbnMgPSBzY29wZS5pbnRlcmFjdGlvbnMubGlzdFxuXG4gICAgY29uc3QgcG9pbnRlclR5cGUgPSBwb2ludGVyVXRpbHMuZ2V0UG9pbnRlclR5cGUoZXZlbnQpXG4gICAgY29uc3QgW2V2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldF0gPSBwb2ludGVyVXRpbHMuZ2V0RXZlbnRUYXJnZXRzKGV2ZW50KVxuICAgIGNvbnN0IG1hdGNoZXMgPSBbXSAvLyBbIFtwb2ludGVyLCBpbnRlcmFjdGlvbl0sIC4uLl1cblxuICAgIGlmICgvXnRvdWNoLy50ZXN0KGV2ZW50LnR5cGUpKSB7XG4gICAgICBzY29wZS5wcmV2VG91Y2hUaW1lID0gc2NvcGUubm93KClcblxuICAgICAgZm9yIChjb25zdCBjaGFuZ2VkVG91Y2ggb2YgZXZlbnQuY2hhbmdlZFRvdWNoZXMpIHtcbiAgICAgICAgY29uc3QgcG9pbnRlciA9IGNoYW5nZWRUb3VjaFxuICAgICAgICBjb25zdCBwb2ludGVySWQgPSBwb2ludGVyVXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpXG4gICAgICAgIGNvbnN0IHNlYXJjaERldGFpbHM6IFNlYXJjaERldGFpbHMgPSB7XG4gICAgICAgICAgcG9pbnRlcixcbiAgICAgICAgICBwb2ludGVySWQsXG4gICAgICAgICAgcG9pbnRlclR5cGUsXG4gICAgICAgICAgZXZlbnRUeXBlOiBldmVudC50eXBlLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgICAgIGN1ckV2ZW50VGFyZ2V0LFxuICAgICAgICAgIHNjb3BlLFxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGludGVyYWN0aW9uID0gZ2V0SW50ZXJhY3Rpb24oc2VhcmNoRGV0YWlscylcblxuICAgICAgICBtYXRjaGVzLnB1c2goW1xuICAgICAgICAgIHNlYXJjaERldGFpbHMucG9pbnRlcixcbiAgICAgICAgICBzZWFyY2hEZXRhaWxzLmV2ZW50VGFyZ2V0LFxuICAgICAgICAgIHNlYXJjaERldGFpbHMuY3VyRXZlbnRUYXJnZXQsXG4gICAgICAgICAgaW50ZXJhY3Rpb24sXG4gICAgICAgIF0pXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbGV0IGludmFsaWRQb2ludGVyID0gZmFsc2VcblxuICAgICAgaWYgKCFicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50ICYmIC9tb3VzZS8udGVzdChldmVudC50eXBlKSkge1xuICAgICAgICAvLyBpZ25vcmUgbW91c2UgZXZlbnRzIHdoaWxlIHRvdWNoIGludGVyYWN0aW9ucyBhcmUgYWN0aXZlXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW50ZXJhY3Rpb25zLmxlbmd0aCAmJiAhaW52YWxpZFBvaW50ZXI7IGkrKykge1xuICAgICAgICAgIGludmFsaWRQb2ludGVyID0gaW50ZXJhY3Rpb25zW2ldLnBvaW50ZXJUeXBlICE9PSAnbW91c2UnICYmIGludGVyYWN0aW9uc1tpXS5wb2ludGVySXNEb3duXG4gICAgICAgIH1cblxuICAgICAgICAvLyB0cnkgdG8gaWdub3JlIG1vdXNlIGV2ZW50cyB0aGF0IGFyZSBzaW11bGF0ZWQgYnkgdGhlIGJyb3dzZXJcbiAgICAgICAgLy8gYWZ0ZXIgYSB0b3VjaCBldmVudFxuICAgICAgICBpbnZhbGlkUG9pbnRlciA9IGludmFsaWRQb2ludGVyIHx8XG4gICAgICAgICAgKHNjb3BlLm5vdygpIC0gc2NvcGUucHJldlRvdWNoVGltZSA8IDUwMCkgfHxcbiAgICAgICAgICAvLyBvbiBpT1MgYW5kIEZpcmVmb3ggTW9iaWxlLCBNb3VzZUV2ZW50LnRpbWVTdGFtcCBpcyB6ZXJvIGlmIHNpbXVsYXRlZFxuICAgICAgICAgIGV2ZW50LnRpbWVTdGFtcCA9PT0gMFxuICAgICAgfVxuXG4gICAgICBpZiAoIWludmFsaWRQb2ludGVyKSB7XG4gICAgICAgIGNvbnN0IHNlYXJjaERldGFpbHMgPSB7XG4gICAgICAgICAgcG9pbnRlcjogZXZlbnQsXG4gICAgICAgICAgcG9pbnRlcklkOiBwb2ludGVyVXRpbHMuZ2V0UG9pbnRlcklkKGV2ZW50KSxcbiAgICAgICAgICBwb2ludGVyVHlwZSxcbiAgICAgICAgICBldmVudFR5cGU6IGV2ZW50LnR5cGUsXG4gICAgICAgICAgY3VyRXZlbnRUYXJnZXQsXG4gICAgICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICAgICAgc2NvcGUsXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbnRlcmFjdGlvbiA9IGdldEludGVyYWN0aW9uKHNlYXJjaERldGFpbHMpXG5cbiAgICAgICAgbWF0Y2hlcy5wdXNoKFtcbiAgICAgICAgICBzZWFyY2hEZXRhaWxzLnBvaW50ZXIsXG4gICAgICAgICAgc2VhcmNoRGV0YWlscy5ldmVudFRhcmdldCxcbiAgICAgICAgICBzZWFyY2hEZXRhaWxzLmN1ckV2ZW50VGFyZ2V0LFxuICAgICAgICAgIGludGVyYWN0aW9uLFxuICAgICAgICBdKVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcbiAgICBmb3IgKGNvbnN0IFtwb2ludGVyLCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQsIGludGVyYWN0aW9uXSBvZiBtYXRjaGVzKSB7XG4gICAgICBpbnRlcmFjdGlvblttZXRob2RdKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldEludGVyYWN0aW9uIChzZWFyY2hEZXRhaWxzOiBTZWFyY2hEZXRhaWxzKSB7XG4gIGNvbnN0IHsgcG9pbnRlclR5cGUsIHNjb3BlIH0gPSBzZWFyY2hEZXRhaWxzXG5cbiAgY29uc3QgZm91bmRJbnRlcmFjdGlvbiA9IGZpbmRlci5zZWFyY2goc2VhcmNoRGV0YWlscylcbiAgY29uc3Qgc2lnbmFsQXJnID0geyBpbnRlcmFjdGlvbjogZm91bmRJbnRlcmFjdGlvbiwgc2VhcmNoRGV0YWlscyB9XG5cbiAgc2NvcGUuaW50ZXJhY3Rpb25zLnNpZ25hbHMuZmlyZSgnZmluZCcsIHNpZ25hbEFyZylcblxuICByZXR1cm4gc2lnbmFsQXJnLmludGVyYWN0aW9uIHx8IHNjb3BlLmludGVyYWN0aW9ucy5uZXcoeyBwb2ludGVyVHlwZSB9KVxufVxuXG5mdW5jdGlvbiBvbkRvY1NpZ25hbCAoeyBkb2MsIHNjb3BlLCBvcHRpb25zIH0sIHNpZ25hbE5hbWUpIHtcbiAgY29uc3QgeyBldmVudE1hcCB9ID0gc2NvcGUuaW50ZXJhY3Rpb25zXG4gIGNvbnN0IGV2ZW50TWV0aG9kID0gc2lnbmFsTmFtZS5pbmRleE9mKCdhZGQnKSA9PT0gMFxuICAgID8gZXZlbnRzLmFkZCA6IGV2ZW50cy5yZW1vdmVcblxuICBpZiAoc2NvcGUuYnJvd3Nlci5pc0lPUyAmJiAhb3B0aW9ucy5ldmVudHMpIHtcbiAgICBvcHRpb25zLmV2ZW50cyA9IHsgcGFzc2l2ZTogZmFsc2UgfVxuICB9XG5cbiAgLy8gZGVsZWdhdGUgZXZlbnQgbGlzdGVuZXJcbiAgZm9yIChjb25zdCBldmVudFR5cGUgaW4gZXZlbnRzLmRlbGVnYXRlZEV2ZW50cykge1xuICAgIGV2ZW50TWV0aG9kKGRvYywgZXZlbnRUeXBlLCBldmVudHMuZGVsZWdhdGVMaXN0ZW5lcilcbiAgICBldmVudE1ldGhvZChkb2MsIGV2ZW50VHlwZSwgZXZlbnRzLmRlbGVnYXRlVXNlQ2FwdHVyZSwgdHJ1ZSlcbiAgfVxuXG4gIGNvbnN0IGV2ZW50T3B0aW9ucyA9IG9wdGlvbnMgJiYgb3B0aW9ucy5ldmVudHNcblxuICBmb3IgKGNvbnN0IHsgdHlwZSwgbGlzdGVuZXIgfSBvZiBldmVudE1hcCkge1xuICAgIGV2ZW50TWV0aG9kKGRvYywgdHlwZSwgbGlzdGVuZXIsIGV2ZW50T3B0aW9ucylcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGlkOiAnY29yZS9pbnRlcmFjdGlvbnMnLFxuICBpbnN0YWxsLFxuICBvbkRvY1NpZ25hbCxcbiAgZG9PbkludGVyYWN0aW9ucyxcbiAgbWV0aG9kTmFtZXMsXG59XG4iXX0=