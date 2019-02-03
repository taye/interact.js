import * as utils from './index';
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
                    element = utils.dom.parentNode(element);
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
    },
    // get first idle interaction with a matching pointerType
    idle({ pointerType, scope }) {
        for (const interaction of scope.interactions.list) {
            // if there's already a pointer held down
            if (interaction.pointers.length === 1) {
                const target = interaction.target;
                // don't add this pointer if there is a target interactable and it
                // isn't gesturable
                if (target && !target.options.gesture.enabled) {
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
    return utils.arr.some(interaction.pointers, ({ id }) => id === pointerId);
}
export default finder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3Rpb25GaW5kZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlcmFjdGlvbkZpbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLFNBQVMsQ0FBQTtBQUVoQyxNQUFNLE1BQU0sR0FBRztJQUNiLFdBQVcsRUFBRSxDQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFFO0lBRXZFLE1BQU0sQ0FBRSxPQUFPO1FBQ2IsS0FBSyxNQUFNLE1BQU0sSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFO1lBQ3ZDLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUUzQyxJQUFJLFdBQVcsRUFBRTtnQkFDZixPQUFPLFdBQVcsQ0FBQTthQUNuQjtTQUNGO0lBQ0gsQ0FBQztJQUVELDhDQUE4QztJQUM5QyxnQkFBZ0IsQ0FBRSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRTtRQUM5RCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUNsQyxPQUFPLElBQUksQ0FBQTtTQUNaO1FBRUQsS0FBSyxNQUFNLFdBQVcsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRTtZQUNqRCxJQUFJLE9BQU8sR0FBRyxXQUFXLENBQUE7WUFFekIsSUFBSSxXQUFXLENBQUMsVUFBVSxJQUFJLFdBQVcsQ0FBQyxVQUFVLENBQUMsV0FBVztnQkFDNUQsQ0FBQyxXQUFXLENBQUMsV0FBVyxLQUFLLFdBQVcsQ0FBQyxFQUFFO2dCQUM3QyxPQUFPLE9BQU8sRUFBRTtvQkFDZCw0Q0FBNEM7b0JBQzVDLElBQUksT0FBTyxLQUFLLFdBQVcsQ0FBQyxPQUFPLEVBQUU7d0JBQ25DLE9BQU8sV0FBVyxDQUFBO3FCQUNuQjtvQkFDRCxPQUFPLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUE7aUJBQ3hDO2FBQ0Y7U0FDRjtRQUVELE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVELHFDQUFxQztJQUNyQyxVQUFVLENBQUUsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUU7UUFDdEQsSUFBSSxXQUFXLEtBQUssT0FBTyxJQUFJLFdBQVcsS0FBSyxLQUFLLEVBQUU7WUFDcEQsT0FBTyxJQUFJLENBQUE7U0FDWjtRQUVELElBQUksY0FBYyxDQUFBO1FBRWxCLEtBQUssTUFBTSxXQUFXLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUU7WUFDakQsSUFBSSxXQUFXLENBQUMsV0FBVyxLQUFLLFdBQVcsRUFBRTtnQkFDM0MsbUVBQW1FO2dCQUNuRSxJQUFJLFdBQVcsQ0FBQyxVQUFVLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUFFLFNBQVE7aUJBQUU7Z0JBRWpGLHNEQUFzRDtnQkFDdEQsSUFBSSxXQUFXLENBQUMsV0FBVyxFQUFFLEVBQUU7b0JBQzdCLE9BQU8sV0FBVyxDQUFBO2lCQUNuQjtnQkFDRCw0REFBNEQ7cUJBQ3ZELElBQUksQ0FBQyxjQUFjLEVBQUU7b0JBQ3hCLGNBQWMsR0FBRyxXQUFXLENBQUE7aUJBQzdCO2FBQ0Y7U0FDRjtRQUVELHdFQUF3RTtRQUN4RSxjQUFjO1FBQ2QsSUFBSSxjQUFjLEVBQUU7WUFDbEIsT0FBTyxjQUFjLENBQUE7U0FDdEI7UUFFRCxxQ0FBcUM7UUFDckMsdUVBQXVFO1FBQ3ZFLFlBQVk7UUFDWixLQUFLLE1BQU0sV0FBVyxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFO1lBQ2pELElBQUksV0FBVyxDQUFDLFdBQVcsS0FBSyxXQUFXLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksV0FBVyxDQUFDLFVBQVUsQ0FBQyxFQUFFO2dCQUNuRyxPQUFPLFdBQVcsQ0FBQTthQUNuQjtTQUNGO1FBRUQsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsd0NBQXdDO0lBQ3hDLFVBQVUsQ0FBRSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUU7UUFDOUIsS0FBSyxNQUFNLFdBQVcsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRTtZQUNqRCxJQUFJLFlBQVksQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLEVBQUU7Z0JBQ3hDLE9BQU8sV0FBVyxDQUFBO2FBQ25CO1NBQ0Y7SUFDSCxDQUFDO0lBRUQseURBQXlEO0lBQ3pELElBQUksQ0FBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUU7UUFDMUIsS0FBSyxNQUFNLFdBQVcsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRTtZQUNqRCx5Q0FBeUM7WUFDekMsSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ3JDLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUE7Z0JBQ2pDLGtFQUFrRTtnQkFDbEUsbUJBQW1CO2dCQUNuQixJQUFJLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtvQkFDN0MsU0FBUTtpQkFDVDthQUNGO1lBQ0Qsd0NBQXdDO2lCQUNuQyxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtnQkFDekMsU0FBUTthQUNUO1lBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsS0FBSyxXQUFXLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQzNFLE9BQU8sV0FBVyxDQUFBO2FBQ25CO1NBQ0Y7UUFFRCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7Q0FDRixDQUFBO0FBRUQsU0FBUyxZQUFZLENBQUUsV0FBVyxFQUFFLFNBQVM7SUFDM0MsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLFNBQVMsQ0FBQyxDQUFBO0FBQzNFLENBQUM7QUFFRCxlQUFlLE1BQU0sQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4vaW5kZXgnXG5cbmNvbnN0IGZpbmRlciA9IHtcbiAgbWV0aG9kT3JkZXI6IFsgJ3NpbXVsYXRpb25SZXN1bWUnLCAnbW91c2VPclBlbicsICdoYXNQb2ludGVyJywgJ2lkbGUnIF0sXG5cbiAgc2VhcmNoIChkZXRhaWxzKSB7XG4gICAgZm9yIChjb25zdCBtZXRob2Qgb2YgZmluZGVyLm1ldGhvZE9yZGVyKSB7XG4gICAgICBjb25zdCBpbnRlcmFjdGlvbiA9IGZpbmRlclttZXRob2RdKGRldGFpbHMpXG5cbiAgICAgIGlmIChpbnRlcmFjdGlvbikge1xuICAgICAgICByZXR1cm4gaW50ZXJhY3Rpb25cbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gdHJ5IHRvIHJlc3VtZSBzaW11bGF0aW9uIHdpdGggYSBuZXcgcG9pbnRlclxuICBzaW11bGF0aW9uUmVzdW1lICh7IHBvaW50ZXJUeXBlLCBldmVudFR5cGUsIGV2ZW50VGFyZ2V0LCBzY29wZSB9KSB7XG4gICAgaWYgKCEvZG93bnxzdGFydC9pLnRlc3QoZXZlbnRUeXBlKSkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGludGVyYWN0aW9uIG9mIHNjb3BlLmludGVyYWN0aW9ucy5saXN0KSB7XG4gICAgICBsZXQgZWxlbWVudCA9IGV2ZW50VGFyZ2V0XG5cbiAgICAgIGlmIChpbnRlcmFjdGlvbi5zaW11bGF0aW9uICYmIGludGVyYWN0aW9uLnNpbXVsYXRpb24uYWxsb3dSZXN1bWUgJiZcbiAgICAgICAgICAoaW50ZXJhY3Rpb24ucG9pbnRlclR5cGUgPT09IHBvaW50ZXJUeXBlKSkge1xuICAgICAgICB3aGlsZSAoZWxlbWVudCkge1xuICAgICAgICAgIC8vIGlmIHRoZSBlbGVtZW50IGlzIHRoZSBpbnRlcmFjdGlvbiBlbGVtZW50XG4gICAgICAgICAgaWYgKGVsZW1lbnQgPT09IGludGVyYWN0aW9uLmVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdGlvblxuICAgICAgICAgIH1cbiAgICAgICAgICBlbGVtZW50ID0gdXRpbHMuZG9tLnBhcmVudE5vZGUoZWxlbWVudClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsXG4gIH0sXG5cbiAgLy8gaWYgaXQncyBhIG1vdXNlIG9yIHBlbiBpbnRlcmFjdGlvblxuICBtb3VzZU9yUGVuICh7IHBvaW50ZXJJZCwgcG9pbnRlclR5cGUsIGV2ZW50VHlwZSwgc2NvcGUgfSkge1xuICAgIGlmIChwb2ludGVyVHlwZSAhPT0gJ21vdXNlJyAmJiBwb2ludGVyVHlwZSAhPT0gJ3BlbicpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuXG4gICAgbGV0IGZpcnN0Tm9uQWN0aXZlXG5cbiAgICBmb3IgKGNvbnN0IGludGVyYWN0aW9uIG9mIHNjb3BlLmludGVyYWN0aW9ucy5saXN0KSB7XG4gICAgICBpZiAoaW50ZXJhY3Rpb24ucG9pbnRlclR5cGUgPT09IHBvaW50ZXJUeXBlKSB7XG4gICAgICAgIC8vIGlmIGl0J3MgYSBkb3duIGV2ZW50LCBza2lwIGludGVyYWN0aW9ucyB3aXRoIHJ1bm5pbmcgc2ltdWxhdGlvbnNcbiAgICAgICAgaWYgKGludGVyYWN0aW9uLnNpbXVsYXRpb24gJiYgIWhhc1BvaW50ZXJJZChpbnRlcmFjdGlvbiwgcG9pbnRlcklkKSkgeyBjb250aW51ZSB9XG5cbiAgICAgICAgLy8gaWYgdGhlIGludGVyYWN0aW9uIGlzIGFjdGl2ZSwgcmV0dXJuIGl0IGltbWVkaWF0ZWx5XG4gICAgICAgIGlmIChpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uXG4gICAgICAgIH1cbiAgICAgICAgLy8gb3RoZXJ3aXNlIHNhdmUgaXQgYW5kIGxvb2sgZm9yIGFub3RoZXIgYWN0aXZlIGludGVyYWN0aW9uXG4gICAgICAgIGVsc2UgaWYgKCFmaXJzdE5vbkFjdGl2ZSkge1xuICAgICAgICAgIGZpcnN0Tm9uQWN0aXZlID0gaW50ZXJhY3Rpb25cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGlmIG5vIGFjdGl2ZSBtb3VzZSBpbnRlcmFjdGlvbiB3YXMgZm91bmQgdXNlIHRoZSBmaXJzdCBpbmFjdGl2ZSBtb3VzZVxuICAgIC8vIGludGVyYWN0aW9uXG4gICAgaWYgKGZpcnN0Tm9uQWN0aXZlKSB7XG4gICAgICByZXR1cm4gZmlyc3ROb25BY3RpdmVcbiAgICB9XG5cbiAgICAvLyBmaW5kIGFueSBtb3VzZSBvciBwZW4gaW50ZXJhY3Rpb24uXG4gICAgLy8gaWdub3JlIHRoZSBpbnRlcmFjdGlvbiBpZiB0aGUgZXZlbnRUeXBlIGlzIGEgKmRvd24sIGFuZCBhIHNpbXVsYXRpb25cbiAgICAvLyBpcyBhY3RpdmVcbiAgICBmb3IgKGNvbnN0IGludGVyYWN0aW9uIG9mIHNjb3BlLmludGVyYWN0aW9ucy5saXN0KSB7XG4gICAgICBpZiAoaW50ZXJhY3Rpb24ucG9pbnRlclR5cGUgPT09IHBvaW50ZXJUeXBlICYmICEoL2Rvd24vaS50ZXN0KGV2ZW50VHlwZSkgJiYgaW50ZXJhY3Rpb24uc2ltdWxhdGlvbikpIHtcbiAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGxcbiAgfSxcblxuICAvLyBnZXQgaW50ZXJhY3Rpb24gdGhhdCBoYXMgdGhpcyBwb2ludGVyXG4gIGhhc1BvaW50ZXIgKHsgcG9pbnRlcklkLCBzY29wZSB9KSB7XG4gICAgZm9yIChjb25zdCBpbnRlcmFjdGlvbiBvZiBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCkge1xuICAgICAgaWYgKGhhc1BvaW50ZXJJZChpbnRlcmFjdGlvbiwgcG9pbnRlcklkKSkge1xuICAgICAgICByZXR1cm4gaW50ZXJhY3Rpb25cbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gZ2V0IGZpcnN0IGlkbGUgaW50ZXJhY3Rpb24gd2l0aCBhIG1hdGNoaW5nIHBvaW50ZXJUeXBlXG4gIGlkbGUgKHsgcG9pbnRlclR5cGUsIHNjb3BlIH0pIHtcbiAgICBmb3IgKGNvbnN0IGludGVyYWN0aW9uIG9mIHNjb3BlLmludGVyYWN0aW9ucy5saXN0KSB7XG4gICAgICAvLyBpZiB0aGVyZSdzIGFscmVhZHkgYSBwb2ludGVyIGhlbGQgZG93blxuICAgICAgaWYgKGludGVyYWN0aW9uLnBvaW50ZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBpbnRlcmFjdGlvbi50YXJnZXRcbiAgICAgICAgLy8gZG9uJ3QgYWRkIHRoaXMgcG9pbnRlciBpZiB0aGVyZSBpcyBhIHRhcmdldCBpbnRlcmFjdGFibGUgYW5kIGl0XG4gICAgICAgIC8vIGlzbid0IGdlc3R1cmFibGVcbiAgICAgICAgaWYgKHRhcmdldCAmJiAhdGFyZ2V0Lm9wdGlvbnMuZ2VzdHVyZS5lbmFibGVkKSB7XG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gbWF4aW11bSBvZiAyIHBvaW50ZXJzIHBlciBpbnRlcmFjdGlvblxuICAgICAgZWxzZSBpZiAoaW50ZXJhY3Rpb24ucG9pbnRlcnMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgaWYgKCFpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpICYmIChwb2ludGVyVHlwZSA9PT0gaW50ZXJhY3Rpb24ucG9pbnRlclR5cGUpKSB7XG4gICAgICAgIHJldHVybiBpbnRlcmFjdGlvblxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsXG4gIH0sXG59XG5cbmZ1bmN0aW9uIGhhc1BvaW50ZXJJZCAoaW50ZXJhY3Rpb24sIHBvaW50ZXJJZCkge1xuICByZXR1cm4gdXRpbHMuYXJyLnNvbWUoaW50ZXJhY3Rpb24ucG9pbnRlcnMsICh7IGlkIH0pID0+IGlkID09PSBwb2ludGVySWQpXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZpbmRlclxuIl19