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
        return null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3Rpb25GaW5kZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlcmFjdGlvbkZpbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLFNBQVMsQ0FBQTtBQVloQyxNQUFNLE1BQU0sR0FBRztJQUNiLFdBQVcsRUFBRSxDQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFFO0lBRXZFLE1BQU0sQ0FBRSxPQUFPO1FBQ2IsS0FBSyxNQUFNLE1BQU0sSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFO1lBQ3ZDLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUUzQyxJQUFJLFdBQVcsRUFBRTtnQkFDZixPQUFPLFdBQVcsQ0FBQTthQUNuQjtTQUNGO0lBQ0gsQ0FBQztJQUVELDhDQUE4QztJQUM5QyxnQkFBZ0IsQ0FBRSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBaUI7UUFDN0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDbEMsT0FBTyxJQUFJLENBQUE7U0FDWjtRQUVELEtBQUssTUFBTSxXQUFXLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUU7WUFDakQsSUFBSSxPQUFPLEdBQUcsV0FBVyxDQUFBO1lBRXpCLElBQUksV0FBVyxDQUFDLFVBQVUsSUFBSSxXQUFXLENBQUMsVUFBVSxDQUFDLFdBQVc7Z0JBQzVELENBQUMsV0FBVyxDQUFDLFdBQVcsS0FBSyxXQUFXLENBQUMsRUFBRTtnQkFDN0MsT0FBTyxPQUFPLEVBQUU7b0JBQ2QsNENBQTRDO29CQUM1QyxJQUFJLE9BQU8sS0FBSyxXQUFXLENBQUMsT0FBTyxFQUFFO3dCQUNuQyxPQUFPLFdBQVcsQ0FBQTtxQkFDbkI7b0JBQ0QsT0FBTyxHQUFHLEtBQUssQ0FBQyxH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QUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLFNBQVMsQ0FBQyxDQUFBO0FBQzNFLENBQUM7QUFFRCxlQUFlLE1BQU0sQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4vaW5kZXgnXG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VhcmNoRGV0YWlscyB7XG4gIHBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlXG4gIHBvaW50ZXJJZDogbnVtYmVyXG4gIHBvaW50ZXJUeXBlOiBzdHJpbmdcbiAgZXZlbnRUeXBlOiBzdHJpbmdcbiAgZXZlbnRUYXJnZXQ6IFdpbmRvdyB8IERvY3VtZW50IHwgRWxlbWVudFxuICBjdXJFdmVudFRhcmdldDogV2luZG93IHwgRG9jdW1lbnQgfCBFbGVtZW50XG4gIHNjb3BlOiBJbnRlcmFjdC5TY29wZVxufVxuXG5jb25zdCBmaW5kZXIgPSB7XG4gIG1ldGhvZE9yZGVyOiBbICdzaW11bGF0aW9uUmVzdW1lJywgJ21vdXNlT3JQZW4nLCAnaGFzUG9pbnRlcicsICdpZGxlJyBdLFxuXG4gIHNlYXJjaCAoZGV0YWlscykge1xuICAgIGZvciAoY29uc3QgbWV0aG9kIG9mIGZpbmRlci5tZXRob2RPcmRlcikge1xuICAgICAgY29uc3QgaW50ZXJhY3Rpb24gPSBmaW5kZXJbbWV0aG9kXShkZXRhaWxzKVxuXG4gICAgICBpZiAoaW50ZXJhY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vIHRyeSB0byByZXN1bWUgc2ltdWxhdGlvbiB3aXRoIGEgbmV3IHBvaW50ZXJcbiAgc2ltdWxhdGlvblJlc3VtZSAoeyBwb2ludGVyVHlwZSwgZXZlbnRUeXBlLCBldmVudFRhcmdldCwgc2NvcGUgfTogU2VhcmNoRGV0YWlscykge1xuICAgIGlmICghL2Rvd258c3RhcnQvaS50ZXN0KGV2ZW50VHlwZSkpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBpbnRlcmFjdGlvbiBvZiBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCkge1xuICAgICAgbGV0IGVsZW1lbnQgPSBldmVudFRhcmdldFxuXG4gICAgICBpZiAoaW50ZXJhY3Rpb24uc2ltdWxhdGlvbiAmJiBpbnRlcmFjdGlvbi5zaW11bGF0aW9uLmFsbG93UmVzdW1lICYmXG4gICAgICAgICAgKGludGVyYWN0aW9uLnBvaW50ZXJUeXBlID09PSBwb2ludGVyVHlwZSkpIHtcbiAgICAgICAgd2hpbGUgKGVsZW1lbnQpIHtcbiAgICAgICAgICAvLyBpZiB0aGUgZWxlbWVudCBpcyB0aGUgaW50ZXJhY3Rpb24gZWxlbWVudFxuICAgICAgICAgIGlmIChlbGVtZW50ID09PSBpbnRlcmFjdGlvbi5lbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3Rpb25cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxlbWVudCA9IHV0aWxzLmRvbS5wYXJlbnROb2RlKGVsZW1lbnQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbFxuICB9LFxuXG4gIC8vIGlmIGl0J3MgYSBtb3VzZSBvciBwZW4gaW50ZXJhY3Rpb25cbiAgbW91c2VPclBlbiAoeyBwb2ludGVySWQsIHBvaW50ZXJUeXBlLCBldmVudFR5cGUsIHNjb3BlIH06IFNlYXJjaERldGFpbHMpIHtcbiAgICBpZiAocG9pbnRlclR5cGUgIT09ICdtb3VzZScgJiYgcG9pbnRlclR5cGUgIT09ICdwZW4nKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cblxuICAgIGxldCBmaXJzdE5vbkFjdGl2ZVxuXG4gICAgZm9yIChjb25zdCBpbnRlcmFjdGlvbiBvZiBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCkge1xuICAgICAgaWYgKGludGVyYWN0aW9uLnBvaW50ZXJUeXBlID09PSBwb2ludGVyVHlwZSkge1xuICAgICAgICAvLyBpZiBpdCdzIGEgZG93biBldmVudCwgc2tpcCBpbnRlcmFjdGlvbnMgd2l0aCBydW5uaW5nIHNpbXVsYXRpb25zXG4gICAgICAgIGlmIChpbnRlcmFjdGlvbi5zaW11bGF0aW9uICYmICFoYXNQb2ludGVySWQoaW50ZXJhY3Rpb24sIHBvaW50ZXJJZCkpIHsgY29udGludWUgfVxuXG4gICAgICAgIC8vIGlmIHRoZSBpbnRlcmFjdGlvbiBpcyBhY3RpdmUsIHJldHVybiBpdCBpbW1lZGlhdGVseVxuICAgICAgICBpZiAoaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICAgIHJldHVybiBpbnRlcmFjdGlvblxuICAgICAgICB9XG4gICAgICAgIC8vIG90aGVyd2lzZSBzYXZlIGl0IGFuZCBsb29rIGZvciBhbm90aGVyIGFjdGl2ZSBpbnRlcmFjdGlvblxuICAgICAgICBlbHNlIGlmICghZmlyc3ROb25BY3RpdmUpIHtcbiAgICAgICAgICBmaXJzdE5vbkFjdGl2ZSA9IGludGVyYWN0aW9uXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpZiBubyBhY3RpdmUgbW91c2UgaW50ZXJhY3Rpb24gd2FzIGZvdW5kIHVzZSB0aGUgZmlyc3QgaW5hY3RpdmUgbW91c2VcbiAgICAvLyBpbnRlcmFjdGlvblxuICAgIGlmIChmaXJzdE5vbkFjdGl2ZSkge1xuICAgICAgcmV0dXJuIGZpcnN0Tm9uQWN0aXZlXG4gICAgfVxuXG4gICAgLy8gZmluZCBhbnkgbW91c2Ugb3IgcGVuIGludGVyYWN0aW9uLlxuICAgIC8vIGlnbm9yZSB0aGUgaW50ZXJhY3Rpb24gaWYgdGhlIGV2ZW50VHlwZSBpcyBhICpkb3duLCBhbmQgYSBzaW11bGF0aW9uXG4gICAgLy8gaXMgYWN0aXZlXG4gICAgZm9yIChjb25zdCBpbnRlcmFjdGlvbiBvZiBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCkge1xuICAgICAgaWYgKGludGVyYWN0aW9uLnBvaW50ZXJUeXBlID09PSBwb2ludGVyVHlwZSAmJiAhKC9kb3duL2kudGVzdChldmVudFR5cGUpICYmIGludGVyYWN0aW9uLnNpbXVsYXRpb24pKSB7XG4gICAgICAgIHJldHVybiBpbnRlcmFjdGlvblxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsXG4gIH0sXG5cbiAgLy8gZ2V0IGludGVyYWN0aW9uIHRoYXQgaGFzIHRoaXMgcG9pbnRlclxuICBoYXNQb2ludGVyICh7IHBvaW50ZXJJZCwgc2NvcGUgfTogU2VhcmNoRGV0YWlscykge1xuICAgIGZvciAoY29uc3QgaW50ZXJhY3Rpb24gb2Ygc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QpIHtcbiAgICAgIGlmIChoYXNQb2ludGVySWQoaW50ZXJhY3Rpb24sIHBvaW50ZXJJZCkpIHtcbiAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGxcbiAgfSxcblxuICAvLyBnZXQgZmlyc3QgaWRsZSBpbnRlcmFjdGlvbiB3aXRoIGEgbWF0Y2hpbmcgcG9pbnRlclR5cGVcbiAgaWRsZSAoeyBwb2ludGVyVHlwZSwgc2NvcGUgfTogU2VhcmNoRGV0YWlscykge1xuICAgIGZvciAoY29uc3QgaW50ZXJhY3Rpb24gb2Ygc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QpIHtcbiAgICAgIC8vIGlmIHRoZXJlJ3MgYWxyZWFkeSBhIHBvaW50ZXIgaGVsZCBkb3duXG4gICAgICBpZiAoaW50ZXJhY3Rpb24ucG9pbnRlcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGludGVyYWN0aW9uLnRhcmdldFxuICAgICAgICAvLyBkb24ndCBhZGQgdGhpcyBwb2ludGVyIGlmIHRoZXJlIGlzIGEgdGFyZ2V0IGludGVyYWN0YWJsZSBhbmQgaXRcbiAgICAgICAgLy8gaXNuJ3QgZ2VzdHVyYWJsZVxuICAgICAgICBpZiAodGFyZ2V0ICYmICF0YXJnZXQub3B0aW9ucy5nZXN0dXJlLmVuYWJsZWQpIHtcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBtYXhpbXVtIG9mIDIgcG9pbnRlcnMgcGVyIGludGVyYWN0aW9uXG4gICAgICBlbHNlIGlmIChpbnRlcmFjdGlvbi5wb2ludGVycy5sZW5ndGggPj0gMikge1xuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBpZiAoIWludGVyYWN0aW9uLmludGVyYWN0aW5nKCkgJiYgKHBvaW50ZXJUeXBlID09PSBpbnRlcmFjdGlvbi5wb2ludGVyVHlwZSkpIHtcbiAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGxcbiAgfSxcbn1cblxuZnVuY3Rpb24gaGFzUG9pbnRlcklkIChpbnRlcmFjdGlvbiwgcG9pbnRlcklkKSB7XG4gIHJldHVybiB1dGlscy5hcnIuc29tZShpbnRlcmFjdGlvbi5wb2ludGVycywgKHsgaWQgfSkgPT4gaWQgPT09IHBvaW50ZXJJZClcbn1cblxuZXhwb3J0IGRlZmF1bHQgZmluZGVyXG4iXX0=