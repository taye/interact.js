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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3Rpb25GaW5kZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlcmFjdGlvbkZpbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssR0FBRyxNQUFNLDRCQUE0QixDQUFBO0FBWWpELE1BQU0sTUFBTSxHQUFHO0lBQ2IsV0FBVyxFQUFFLENBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUU7SUFFdkUsTUFBTSxDQUFFLE9BQU87UUFDYixLQUFLLE1BQU0sTUFBTSxJQUFJLE1BQU0sQ0FBQyxXQUFXLEVBQUU7WUFDdkMsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBRTNDLElBQUksV0FBVyxFQUFFO2dCQUNmLE9BQU8sV0FBVyxDQUFBO2FBQ25CO1NBQ0Y7SUFDSCxDQUFDO0lBRUQsOENBQThDO0lBQzlDLGdCQUFnQixDQUFFLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFpQjtRQUM3RSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUNsQyxPQUFPLElBQUksQ0FBQTtTQUNaO1FBRUQsS0FBSyxNQUFNLFdBQVcsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRTtZQUNqRCxJQUFJLE9BQU8sR0FBRyxXQUFXLENBQUE7WUFFekIsSUFBSSxXQUFXLENBQUMsVUFBVSxJQUFJLFdBQVcsQ0FBQyxVQUFVLENBQUMsV0FBVztnQkFDNUQsQ0FBQyxXQUFXLENBQUMsV0FBVyxLQUFLLFdBQVcsQ0FBQyxFQUFFO2dCQUM3QyxPQUFPLE9BQU8sRUFBRTtvQkFDZCw0Q0FBNEM7b0JBQzVDLElBQUksT0FBTyxLQUFLLFdBQVcsQ0FBQyxPQUFPLEVBQUU7d0JBQ25DLE9BQU8sV0FBVyxDQUFBO3FCQUNuQjtvQkFDRCxPQUFPLEdBQUcsR0FBRyxDQUFD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LFNBQWlCO0lBQ3pFLE9BQU8sV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUE7QUFDaEUsQ0FBQztBQUVELGVBQWUsTUFBTSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZG9tIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2RvbVV0aWxzJ1xuXG5leHBvcnQgaW50ZXJmYWNlIFNlYXJjaERldGFpbHMge1xuICBwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZVxuICBwb2ludGVySWQ6IG51bWJlclxuICBwb2ludGVyVHlwZTogc3RyaW5nXG4gIGV2ZW50VHlwZTogc3RyaW5nXG4gIGV2ZW50VGFyZ2V0OiBJbnRlcmFjdC5FdmVudFRhcmdldFxuICBjdXJFdmVudFRhcmdldDogSW50ZXJhY3QuRXZlbnRUYXJnZXRcbiAgc2NvcGU6IEludGVyYWN0LlNjb3BlXG59XG5cbmNvbnN0IGZpbmRlciA9IHtcbiAgbWV0aG9kT3JkZXI6IFsgJ3NpbXVsYXRpb25SZXN1bWUnLCAnbW91c2VPclBlbicsICdoYXNQb2ludGVyJywgJ2lkbGUnIF0sXG5cbiAgc2VhcmNoIChkZXRhaWxzKSB7XG4gICAgZm9yIChjb25zdCBtZXRob2Qgb2YgZmluZGVyLm1ldGhvZE9yZGVyKSB7XG4gICAgICBjb25zdCBpbnRlcmFjdGlvbiA9IGZpbmRlclttZXRob2RdKGRldGFpbHMpXG5cbiAgICAgIGlmIChpbnRlcmFjdGlvbikge1xuICAgICAgICByZXR1cm4gaW50ZXJhY3Rpb25cbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gdHJ5IHRvIHJlc3VtZSBzaW11bGF0aW9uIHdpdGggYSBuZXcgcG9pbnRlclxuICBzaW11bGF0aW9uUmVzdW1lICh7IHBvaW50ZXJUeXBlLCBldmVudFR5cGUsIGV2ZW50VGFyZ2V0LCBzY29wZSB9OiBTZWFyY2hEZXRhaWxzKSB7XG4gICAgaWYgKCEvZG93bnxzdGFydC9pLnRlc3QoZXZlbnRUeXBlKSkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGludGVyYWN0aW9uIG9mIHNjb3BlLmludGVyYWN0aW9ucy5saXN0KSB7XG4gICAgICBsZXQgZWxlbWVudCA9IGV2ZW50VGFyZ2V0XG5cbiAgICAgIGlmIChpbnRlcmFjdGlvbi5zaW11bGF0aW9uICYmIGludGVyYWN0aW9uLnNpbXVsYXRpb24uYWxsb3dSZXN1bWUgJiZcbiAgICAgICAgICAoaW50ZXJhY3Rpb24ucG9pbnRlclR5cGUgPT09IHBvaW50ZXJUeXBlKSkge1xuICAgICAgICB3aGlsZSAoZWxlbWVudCkge1xuICAgICAgICAgIC8vIGlmIHRoZSBlbGVtZW50IGlzIHRoZSBpbnRlcmFjdGlvbiBlbGVtZW50XG4gICAgICAgICAgaWYgKGVsZW1lbnQgPT09IGludGVyYWN0aW9uLmVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdGlvblxuICAgICAgICAgIH1cbiAgICAgICAgICBlbGVtZW50ID0gZG9tLnBhcmVudE5vZGUoZWxlbWVudClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsXG4gIH0sXG5cbiAgLy8gaWYgaXQncyBhIG1vdXNlIG9yIHBlbiBpbnRlcmFjdGlvblxuICBtb3VzZU9yUGVuICh7IHBvaW50ZXJJZCwgcG9pbnRlclR5cGUsIGV2ZW50VHlwZSwgc2NvcGUgfTogU2VhcmNoRGV0YWlscykge1xuICAgIGlmIChwb2ludGVyVHlwZSAhPT0gJ21vdXNlJyAmJiBwb2ludGVyVHlwZSAhPT0gJ3BlbicpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuXG4gICAgbGV0IGZpcnN0Tm9uQWN0aXZlXG5cbiAgICBmb3IgKGNvbnN0IGludGVyYWN0aW9uIG9mIHNjb3BlLmludGVyYWN0aW9ucy5saXN0KSB7XG4gICAgICBpZiAoaW50ZXJhY3Rpb24ucG9pbnRlclR5cGUgPT09IHBvaW50ZXJUeXBlKSB7XG4gICAgICAgIC8vIGlmIGl0J3MgYSBkb3duIGV2ZW50LCBza2lwIGludGVyYWN0aW9ucyB3aXRoIHJ1bm5pbmcgc2ltdWxhdGlvbnNcbiAgICAgICAgaWYgKGludGVyYWN0aW9uLnNpbXVsYXRpb24gJiYgIWhhc1BvaW50ZXJJZChpbnRlcmFjdGlvbiwgcG9pbnRlcklkKSkgeyBjb250aW51ZSB9XG5cbiAgICAgICAgLy8gaWYgdGhlIGludGVyYWN0aW9uIGlzIGFjdGl2ZSwgcmV0dXJuIGl0IGltbWVkaWF0ZWx5XG4gICAgICAgIGlmIChpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uXG4gICAgICAgIH1cbiAgICAgICAgLy8gb3RoZXJ3aXNlIHNhdmUgaXQgYW5kIGxvb2sgZm9yIGFub3RoZXIgYWN0aXZlIGludGVyYWN0aW9uXG4gICAgICAgIGVsc2UgaWYgKCFmaXJzdE5vbkFjdGl2ZSkge1xuICAgICAgICAgIGZpcnN0Tm9uQWN0aXZlID0gaW50ZXJhY3Rpb25cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGlmIG5vIGFjdGl2ZSBtb3VzZSBpbnRlcmFjdGlvbiB3YXMgZm91bmQgdXNlIHRoZSBmaXJzdCBpbmFjdGl2ZSBtb3VzZVxuICAgIC8vIGludGVyYWN0aW9uXG4gICAgaWYgKGZpcnN0Tm9uQWN0aXZlKSB7XG4gICAgICByZXR1cm4gZmlyc3ROb25BY3RpdmVcbiAgICB9XG5cbiAgICAvLyBmaW5kIGFueSBtb3VzZSBvciBwZW4gaW50ZXJhY3Rpb24uXG4gICAgLy8gaWdub3JlIHRoZSBpbnRlcmFjdGlvbiBpZiB0aGUgZXZlbnRUeXBlIGlzIGEgKmRvd24sIGFuZCBhIHNpbXVsYXRpb25cbiAgICAvLyBpcyBhY3RpdmVcbiAgICBmb3IgKGNvbnN0IGludGVyYWN0aW9uIG9mIHNjb3BlLmludGVyYWN0aW9ucy5saXN0KSB7XG4gICAgICBpZiAoaW50ZXJhY3Rpb24ucG9pbnRlclR5cGUgPT09IHBvaW50ZXJUeXBlICYmICEoL2Rvd24vaS50ZXN0KGV2ZW50VHlwZSkgJiYgaW50ZXJhY3Rpb24uc2ltdWxhdGlvbikpIHtcbiAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGxcbiAgfSxcblxuICAvLyBnZXQgaW50ZXJhY3Rpb24gdGhhdCBoYXMgdGhpcyBwb2ludGVyXG4gIGhhc1BvaW50ZXIgKHsgcG9pbnRlcklkLCBzY29wZSB9OiBTZWFyY2hEZXRhaWxzKSB7XG4gICAgZm9yIChjb25zdCBpbnRlcmFjdGlvbiBvZiBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCkge1xuICAgICAgaWYgKGhhc1BvaW50ZXJJZChpbnRlcmFjdGlvbiwgcG9pbnRlcklkKSkge1xuICAgICAgICByZXR1cm4gaW50ZXJhY3Rpb25cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbFxuICB9LFxuXG4gIC8vIGdldCBmaXJzdCBpZGxlIGludGVyYWN0aW9uIHdpdGggYSBtYXRjaGluZyBwb2ludGVyVHlwZVxuICBpZGxlICh7IHBvaW50ZXJUeXBlLCBzY29wZSB9OiBTZWFyY2hEZXRhaWxzKSB7XG4gICAgZm9yIChjb25zdCBpbnRlcmFjdGlvbiBvZiBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCkge1xuICAgICAgLy8gaWYgdGhlcmUncyBhbHJlYWR5IGEgcG9pbnRlciBoZWxkIGRvd25cbiAgICAgIGlmIChpbnRlcmFjdGlvbi5wb2ludGVycy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlXG4gICAgICAgIC8vIGRvbid0IGFkZCB0aGlzIHBvaW50ZXIgaWYgdGhlcmUgaXMgYSB0YXJnZXQgaW50ZXJhY3RhYmxlIGFuZCBpdFxuICAgICAgICAvLyBpc24ndCBnZXN0dXJhYmxlXG4gICAgICAgIGlmICh0YXJnZXQgJiYgISh0YXJnZXQub3B0aW9ucy5nZXN0dXJlICYmIHRhcmdldC5vcHRpb25zLmdlc3R1cmUuZW5hYmxlZCkpIHtcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBtYXhpbXVtIG9mIDIgcG9pbnRlcnMgcGVyIGludGVyYWN0aW9uXG4gICAgICBlbHNlIGlmIChpbnRlcmFjdGlvbi5wb2ludGVycy5sZW5ndGggPj0gMikge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBpZiAoIWludGVyYWN0aW9uLmludGVyYWN0aW5nKCkgJiYgKHBvaW50ZXJUeXBlID09PSBpbnRlcmFjdGlvbi5wb2ludGVyVHlwZSkpIHtcbiAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGxcbiAgfSxcbn1cblxuZnVuY3Rpb24gaGFzUG9pbnRlcklkIChpbnRlcmFjdGlvbjogSW50ZXJhY3QuSW50ZXJhY3Rpb24sIHBvaW50ZXJJZDogbnVtYmVyKSB7XG4gIHJldHVybiBpbnRlcmFjdGlvbi5wb2ludGVycy5zb21lKCh7IGlkIH0pID0+IGlkID09PSBwb2ludGVySWQpXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZpbmRlclxuIl19