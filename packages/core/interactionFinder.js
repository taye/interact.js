import * as dom from '@interactjs/utils/domUtils';
const finder = {
    methodOrder: ['simulationResume', 'mouseOrPen', 'hasPointer', 'idle'],
    search(details) {
        for (const method of finder.methodOrder) {
            const interaction = finder[method](details);
            if (interaction) {
                return interaction;
            }
        }
    },
    // try to resume simulation with a new pointer
    simulationResume({ pointerType, eventType, eventTarget, scope }) {
        if (!/down|start/i.test(eventType)) {
            return null;
        }
        for (const interaction of scope.interactions.list) {
            let element = eventTarget;
            if (interaction.simulation && interaction.simulation.allowResume &&
                (interaction.pointerType === pointerType)) {
                while (element) {
                    // if the element is the interaction element
                    if (element === interaction.element) {
                        return interaction;
                    }
                    element = dom.parentNode(element);
                }
            }
        }
        return null;
    },
    // if it's a mouse or pen interaction
    mouseOrPen({ pointerId, pointerType, eventType, scope }) {
        if (pointerType !== 'mouse' && pointerType !== 'pen') {
            return null;
        }
        let firstNonActive;
        for (const interaction of scope.interactions.list) {
            if (interaction.pointerType === pointerType) {
                // if it's a down event, skip interactions with running simulations
                if (interaction.simulation && !hasPointerId(interaction, pointerId)) {
                    continue;
                }
                // if the interaction is active, return it immediately
                if (interaction.interacting()) {
                    return interaction;
                }
                // otherwise save it and look for another active interaction
                else if (!firstNonActive) {
                    firstNonActive = interaction;
                }
            }
        }
        // if no active mouse interaction was found use the first inactive mouse
        // interaction
        if (firstNonActive) {
            return firstNonActive;
        }
        // find any mouse or pen interaction.
        // ignore the interaction if the eventType is a *down, and a simulation
        // is active
        for (const interaction of scope.interactions.list) {
            if (interaction.pointerType === pointerType && !(/down/i.test(eventType) && interaction.simulation)) {
                return interaction;
            }
        }
        return null;
    },
    // get interaction that has this pointer
    hasPointer({ pointerId, scope }) {
        for (const interaction of scope.interactions.list) {
            if (hasPointerId(interaction, pointerId)) {
                return interaction;
            }
        }
        return null;
    },
    // get first idle interaction with a matching pointerType
    idle({ pointerType, scope }) {
        for (const interaction of scope.interactions.list) {
            // if there's already a pointer held down
            if (interaction.pointers.length === 1) {
                const target = interaction.interactable;
                // don't add this pointer if there is a target interactable and it
                // isn't gesturable
                if (target && !(target.options.gesture && target.options.gesture.enabled)) {
                    continue;
                }
            }
            // maximum of 2 pointers per interaction
            else if (interaction.pointers.length >= 2) {
                continue;
            }
            if (!interaction.interacting() && (pointerType === interaction.pointerType)) {
                return interaction;
            }
        }
        return null;
    },
};
function hasPointerId(interaction, pointerId) {
    return interaction.pointers.some(({ id }) => id === pointerId);
}
export default finder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3Rpb25GaW5kZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlcmFjdGlvbkZpbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssR0FBRyxNQUFNLDRCQUE0QixDQUFBO0FBWWpELE1BQU0sTUFBTSxHQUFHO0lBQ2IsV0FBVyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUM7SUFFckUsTUFBTSxDQUFFLE9BQU87UUFDYixLQUFLLE1BQU0sTUFBTSxJQUFJLE1BQU0sQ0FBQyxXQUFXLEVBQUU7WUFDdkMsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBRTNDLElBQUksV0FBVyxFQUFFO2dCQUNmLE9BQU8sV0FBVyxDQUFBO2FBQ25CO1NBQ0Y7SUFDSCxDQUFDO0lBRUQsOENBQThDO0lBQzlDLGdCQUFnQixDQUFFLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFpQjtRQUM3RSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUNsQyxPQUFPLElBQUksQ0FBQTtTQUNaO1FBRUQsS0FBSyxNQUFNLFdBQVcsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRTtZQUNqRCxJQUFJLE9BQU8sR0FBRyxXQUFXLENBQUE7WUFFekIsSUFBSSxXQUFXLENBQUMsVUFBVSxJQUFJLFdBQVcsQ0FBQyxVQUFVLENBQUMsV0FBVztnQkFDNUQsQ0FBQyxXQUFXLENBQUMsV0FBVyxLQUFLLFdBQVcsQ0FBQyxFQUFFO2dCQUM3QyxPQUFPLE9BQU8sRUFBRTtvQkFDZCw0Q0FBNEM7b0JBQzVDLElBQUksT0FBTyxLQUFLLFdBQVcsQ0FBQyxPQUFPLEVBQUU7d0JBQ25DLE9BQU8sV0FBVyxDQUFBO3FCQUNuQjtvQkFDRCxPQUFPLEdBQUcsR0FBRyxDQUFD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LFNBQWlCO0lBQ3pFLE9BQU8sV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUE7QUFDaEUsQ0FBQztBQUVELGVBQWUsTUFBTSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZG9tIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2RvbVV0aWxzJ1xuXG5leHBvcnQgaW50ZXJmYWNlIFNlYXJjaERldGFpbHMge1xuICBwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZVxuICBwb2ludGVySWQ6IG51bWJlclxuICBwb2ludGVyVHlwZTogc3RyaW5nXG4gIGV2ZW50VHlwZTogc3RyaW5nXG4gIGV2ZW50VGFyZ2V0OiBJbnRlcmFjdC5FdmVudFRhcmdldFxuICBjdXJFdmVudFRhcmdldDogSW50ZXJhY3QuRXZlbnRUYXJnZXRcbiAgc2NvcGU6IEludGVyYWN0LlNjb3BlXG59XG5cbmNvbnN0IGZpbmRlciA9IHtcbiAgbWV0aG9kT3JkZXI6IFsnc2ltdWxhdGlvblJlc3VtZScsICdtb3VzZU9yUGVuJywgJ2hhc1BvaW50ZXInLCAnaWRsZSddLFxuXG4gIHNlYXJjaCAoZGV0YWlscykge1xuICAgIGZvciAoY29uc3QgbWV0aG9kIG9mIGZpbmRlci5tZXRob2RPcmRlcikge1xuICAgICAgY29uc3QgaW50ZXJhY3Rpb24gPSBmaW5kZXJbbWV0aG9kXShkZXRhaWxzKVxuXG4gICAgICBpZiAoaW50ZXJhY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vIHRyeSB0byByZXN1bWUgc2ltdWxhdGlvbiB3aXRoIGEgbmV3IHBvaW50ZXJcbiAgc2ltdWxhdGlvblJlc3VtZSAoeyBwb2ludGVyVHlwZSwgZXZlbnRUeXBlLCBldmVudFRhcmdldCwgc2NvcGUgfTogU2VhcmNoRGV0YWlscykge1xuICAgIGlmICghL2Rvd258c3RhcnQvaS50ZXN0KGV2ZW50VHlwZSkpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBpbnRlcmFjdGlvbiBvZiBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCkge1xuICAgICAgbGV0IGVsZW1lbnQgPSBldmVudFRhcmdldFxuXG4gICAgICBpZiAoaW50ZXJhY3Rpb24uc2ltdWxhdGlvbiAmJiBpbnRlcmFjdGlvbi5zaW11bGF0aW9uLmFsbG93UmVzdW1lICYmXG4gICAgICAgICAgKGludGVyYWN0aW9uLnBvaW50ZXJUeXBlID09PSBwb2ludGVyVHlwZSkpIHtcbiAgICAgICAgd2hpbGUgKGVsZW1lbnQpIHtcbiAgICAgICAgICAvLyBpZiB0aGUgZWxlbWVudCBpcyB0aGUgaW50ZXJhY3Rpb24gZWxlbWVudFxuICAgICAgICAgIGlmIChlbGVtZW50ID09PSBpbnRlcmFjdGlvbi5lbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Rpb25cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxlbWVudCA9IGRvbS5wYXJlbnROb2RlKGVsZW1lbnQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbFxuICB9LFxuXG4gIC8vIGlmIGl0J3MgYSBtb3VzZSBvciBwZW4gaW50ZXJhY3Rpb25cbiAgbW91c2VPclBlbiAoeyBwb2ludGVySWQsIHBvaW50ZXJUeXBlLCBldmVudFR5cGUsIHNjb3BlIH06IFNlYXJjaERldGFpbHMpIHtcbiAgICBpZiAocG9pbnRlclR5cGUgIT09ICdtb3VzZScgJiYgcG9pbnRlclR5cGUgIT09ICdwZW4nKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cblxuICAgIGxldCBmaXJzdE5vbkFjdGl2ZVxuXG4gICAgZm9yIChjb25zdCBpbnRlcmFjdGlvbiBvZiBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCkge1xuICAgICAgaWYgKGludGVyYWN0aW9uLnBvaW50ZXJUeXBlID09PSBwb2ludGVyVHlwZSkge1xuICAgICAgICAvLyBpZiBpdCdzIGEgZG93biBldmVudCwgc2tpcCBpbnRlcmFjdGlvbnMgd2l0aCBydW5uaW5nIHNpbXVsYXRpb25zXG4gICAgICAgIGlmIChpbnRlcmFjdGlvbi5zaW11bGF0aW9uICYmICFoYXNQb2ludGVySWQoaW50ZXJhY3Rpb24sIHBvaW50ZXJJZCkpIHsgY29udGludWUgfVxuXG4gICAgICAgIC8vIGlmIHRoZSBpbnRlcmFjdGlvbiBpcyBhY3RpdmUsIHJldHVybiBpdCBpbW1lZGlhdGVseVxuICAgICAgICBpZiAoaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgIHJldHVybiBpbnRlcmFjdGlvblxuICAgICAgICB9XG4gICAgICAgIC8vIG90aGVyd2lzZSBzYXZlIGl0IGFuZCBsb29rIGZvciBhbm90aGVyIGFjdGl2ZSBpbnRlcmFjdGlvblxuICAgICAgICBlbHNlIGlmICghZmlyc3ROb25BY3RpdmUpIHtcbiAgICAgICAgICBmaXJzdE5vbkFjdGl2ZSA9IGludGVyYWN0aW9uXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpZiBubyBhY3RpdmUgbW91c2UgaW50ZXJhY3Rpb24gd2FzIGZvdW5kIHVzZSB0aGUgZmlyc3QgaW5hY3RpdmUgbW91c2VcbiAgICAvLyBpbnRlcmFjdGlvblxuICAgIGlmIChmaXJzdE5vbkFjdGl2ZSkge1xuICAgICAgcmV0dXJuIGZpcnN0Tm9uQWN0aXZlXG4gICAgfVxuXG4gICAgLy8gZmluZCBhbnkgbW91c2Ugb3IgcGVuIGludGVyYWN0aW9uLlxuICAgIC8vIGlnbm9yZSB0aGUgaW50ZXJhY3Rpb24gaWYgdGhlIGV2ZW50VHlwZSBpcyBhICpkb3duLCBhbmQgYSBzaW11bGF0aW9uXG4gICAgLy8gaXMgYWN0aXZlXG4gICAgZm9yIChjb25zdCBpbnRlcmFjdGlvbiBvZiBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCkge1xuICAgICAgaWYgKGludGVyYWN0aW9uLnBvaW50ZXJUeXBlID09PSBwb2ludGVyVHlwZSAmJiAhKC9kb3duL2kudGVzdChldmVudFR5cGUpICYmIGludGVyYWN0aW9uLnNpbXVsYXRpb24pKSB7XG4gICAgICAgIHJldHVybiBpbnRlcmFjdGlvblxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsXG4gIH0sXG5cbiAgLy8gZ2V0IGludGVyYWN0aW9uIHRoYXQgaGFzIHRoaXMgcG9pbnRlclxuICBoYXNQb2ludGVyICh7IHBvaW50ZXJJZCwgc2NvcGUgfTogU2VhcmNoRGV0YWlscykge1xuICAgIGZvciAoY29uc3QgaW50ZXJhY3Rpb24gb2Ygc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QpIHtcbiAgICAgIGlmIChoYXNQb2ludGVySWQoaW50ZXJhY3Rpb24sIHBvaW50ZXJJZCkpIHtcbiAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGxcbiAgfSxcblxuICAvLyBnZXQgZmlyc3QgaWRsZSBpbnRlcmFjdGlvbiB3aXRoIGEgbWF0Y2hpbmcgcG9pbnRlclR5cGVcbiAgaWRsZSAoeyBwb2ludGVyVHlwZSwgc2NvcGUgfTogU2VhcmNoRGV0YWlscykge1xuICAgIGZvciAoY29uc3QgaW50ZXJhY3Rpb24gb2Ygc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QpIHtcbiAgICAgIC8vIGlmIHRoZXJlJ3MgYWxyZWFkeSBhIHBvaW50ZXIgaGVsZCBkb3duXG4gICAgICBpZiAoaW50ZXJhY3Rpb24ucG9pbnRlcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGludGVyYWN0aW9uLmludGVyYWN0YWJsZVxuICAgICAgICAvLyBkb24ndCBhZGQgdGhpcyBwb2ludGVyIGlmIHRoZXJlIGlzIGEgdGFyZ2V0IGludGVyYWN0YWJsZSBhbmQgaXRcbiAgICAgICAgLy8gaXNuJ3QgZ2VzdHVyYWJsZVxuICAgICAgICBpZiAodGFyZ2V0ICYmICEodGFyZ2V0Lm9wdGlvbnMuZ2VzdHVyZSAmJiB0YXJnZXQub3B0aW9ucy5nZXN0dXJlLmVuYWJsZWQpKSB7XG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gbWF4aW11bSBvZiAyIHBvaW50ZXJzIHBlciBpbnRlcmFjdGlvblxuICAgICAgZWxzZSBpZiAoaW50ZXJhY3Rpb24ucG9pbnRlcnMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgaWYgKCFpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpICYmIChwb2ludGVyVHlwZSA9PT0gaW50ZXJhY3Rpb24ucG9pbnRlclR5cGUpKSB7XG4gICAgICAgIHJldHVybiBpbnRlcmFjdGlvblxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsXG4gIH0sXG59XG5cbmZ1bmN0aW9uIGhhc1BvaW50ZXJJZCAoaW50ZXJhY3Rpb246IEludGVyYWN0LkludGVyYWN0aW9uLCBwb2ludGVySWQ6IG51bWJlcikge1xuICByZXR1cm4gaW50ZXJhY3Rpb24ucG9pbnRlcnMuc29tZSgoeyBpZCB9KSA9PiBpZCA9PT0gcG9pbnRlcklkKVxufVxuXG5leHBvcnQgZGVmYXVsdCBmaW5kZXJcbiJdfQ==