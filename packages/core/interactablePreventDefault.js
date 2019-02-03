import { matchesSelector, nodeContains } from '@interactjs/utils/domUtils';
import events from '@interactjs/utils/events';
import * as is from '@interactjs/utils/is';
import { getWindow } from '@interactjs/utils/window';
function preventDefault(interactable, newValue) {
    if (/^(always|never|auto)$/.test(newValue)) {
        interactable.options.preventDefault = newValue;
        return interactable;
    }
    if (is.bool(newValue)) {
        interactable.options.preventDefault = newValue ? 'always' : 'never';
        return interactable;
    }
    return interactable.options.preventDefault;
}
function checkAndPreventDefault(interactable, scope, event) {
    const setting = interactable.options.preventDefault;
    if (setting === 'never') {
        return;
    }
    if (setting === 'always') {
        event.preventDefault();
        return;
    }
    // setting === 'auto'
    // if the browser supports passive event listeners and isn't running on iOS,
    // don't preventDefault of touch{start,move} events. CSS touch-action and
    // user-select should be used instead of calling event.preventDefault().
    if (events.supportsPassive && /^touch(start|move)$/.test(event.type)) {
        const doc = getWindow(event.target).document;
        const docOptions = scope.getDocOptions(doc);
        if (!(docOptions && docOptions.events) || docOptions.events.passive !== false) {
            return;
        }
    }
    // don't preventDefault of pointerdown events
    if (/^(mouse|pointer|touch)*(down|start)/i.test(event.type)) {
        return;
    }
    // don't preventDefault on editable elements
    if (is.element(event.target) &&
        matchesSelector(event.target, 'input,select,textarea,[contenteditable=true],[contenteditable=true] *')) {
        return;
    }
    event.preventDefault();
}
function onInteractionEvent({ interaction, event }) {
    if (interaction.target) {
        interaction.target.checkAndPreventDefault(event);
    }
}
export function install(scope) {
    /** @lends Interactable */
    const Interactable = scope.Interactable;
    /**
     * Returns or sets whether to prevent the browser's default behaviour in
     * response to pointer events. Can be set to:
     *  - `'always'` to always prevent
     *  - `'never'` to never prevent
     *  - `'auto'` to let interact.js try to determine what would be best
     *
     * @param {string} [newValue] `'always'`, `'never'` or `'auto'`
     * @return {string | Interactable} The current setting or this Interactable
     */
    Interactable.prototype.preventDefault = function (newValue) {
        return preventDefault(this, newValue);
    };
    Interactable.prototype.checkAndPreventDefault = function (event) {
        return checkAndPreventDefault(this, scope, event);
    };
    for (const eventSignal of ['down', 'move', 'up', 'cancel']) {
        scope.interactions.signals.on(eventSignal, onInteractionEvent);
    }
    // prevent native HTML5 drag on interact.js target elements
    scope.interactions.eventMap.dragstart = function preventNativeDrag(event) {
        for (const interaction of scope.interactions.list) {
            if (interaction.element &&
                (interaction.element === event.target ||
                    nodeContains(interaction.element, event.target))) {
                interaction.target.checkAndPreventDefault(event);
                return;
            }
        }
    };
}
export default { install };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3RhYmxlUHJldmVudERlZmF1bHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlcmFjdGFibGVQcmV2ZW50RGVmYXVsdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQzFFLE9BQU8sTUFBTSxNQUFNLDBCQUEwQixDQUFBO0FBQzdDLE9BQU8sS0FBSyxFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUFDMUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDBCQUEwQixDQUFBO0FBRXBELFNBQVMsY0FBYyxDQUFFLFlBQVksRUFBRSxRQUFRO0lBQzdDLElBQUksdUJBQXVCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzFDLFlBQVksQ0FBQyxPQUFPLENBQUMsY0FBYyxHQUFHLFFBQVEsQ0FBQTtRQUM5QyxPQUFPLFlBQVksQ0FBQTtLQUNwQjtJQUVELElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUNyQixZQUFZLENBQUMsT0FBTyxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFBO1FBQ25FLE9BQU8sWUFBWSxDQUFBO0tBQ3BCO0lBRUQsT0FBTyxZQUFZLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQTtBQUM1QyxDQUFDO0FBRUQsU0FBUyxzQkFBc0IsQ0FBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLEtBQUs7SUFDekQsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUE7SUFFbkQsSUFBSSxPQUFPLEtBQUssT0FBTyxFQUFFO1FBQUUsT0FBTTtLQUFFO0lBRW5DLElBQUksT0FBTyxLQUFLLFFBQVEsRUFBRTtRQUN4QixLQUFLLENBQUMsY0FBYyxFQUFFLENBQUE7UUFDdEIsT0FBTTtLQUNQO0lBRUQscUJBQXFCO0lBRXJCLDRFQUE0RTtJQUM1RSx5RUFBeUU7SUFDekUsd0VBQXdFO0lBQ3hFLElBQUksTUFBTSxDQUFDLGVBQWUsSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3BFLE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFBO1FBQzVDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUE7UUFFM0MsSUFBSSxDQUFDLENBQUMsVUFBVSxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLE9BQU8sS0FBSyxLQUFLLEVBQUU7WUFDN0UsT0FBTTtTQUNQO0tBQ0Y7SUFFRCw2Q0FBNkM7SUFDN0MsSUFBSSxzQ0FBc0MsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQzNELE9BQU07S0FDUDtJQUVELDRDQUE0QztJQUM1QyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUN4QixlQUFlLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSx1RUFBdUUsQ0FBQyxFQUFFO1FBQzFHLE9BQU07S0FDUDtJQUVELEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQTtBQUN4QixDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUU7SUFDakQsSUFBSSxXQUFXLENBQUMsTUFBTSxFQUFFO1FBQ3RCLFdBQVcsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUE7S0FDakQ7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLE9BQU8sQ0FBRSxLQUFLO0lBQzVCLDBCQUEwQjtJQUMxQixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFBO0lBRXZDOzs7Ozs7Ozs7T0FTRztJQUNILFlBQVksQ0FBQyxTQUFTLENBQUMsY0FBYyxHQUFHLFVBQVUsUUFBUTtRQUN4RCxPQUFPLGNBQWMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDdkMsQ0FBQyxDQUFBO0lBRUQsWUFBWSxDQUFDLFNBQVMsQ0FBQyxzQkFBc0IsR0FBRyxVQUFVLEtBQUs7UUFDN0QsT0FBTyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQ25ELENBQUMsQ0FBQTtJQUVELEtBQUssTUFBTSxXQUFXLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsRUFBRTtRQUMxRCxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLGtCQUFrQixDQUFDLENBQUE7S0FDL0Q7SUFFRCwyREFBMkQ7SUFDM0QsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLFNBQVMsaUJBQWlCLENBQUUsS0FBSztRQUN2RSxLQUFLLE1BQU0sV0FBVyxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFO1lBQ2pELElBQUksV0FBVyxDQUFDLE9BQU87Z0JBQ3JCLENBQUMsV0FBVyxDQUFDLE9BQU8sS0FBSyxLQUFLLENBQUMsTUFBTTtvQkFDbkMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUU7Z0JBQ3BELFdBQVcsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUE7Z0JBQ2hELE9BQU07YUFDUDtTQUNGO0lBQ0gsQ0FBQyxDQUFBO0FBQ0gsQ0FBQztBQUlELGVBQWUsRUFBRSxPQUFPLEVBQUUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IG1hdGNoZXNTZWxlY3Rvciwgbm9kZUNvbnRhaW5zIH0gZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZG9tVXRpbHMnXG5pbXBvcnQgZXZlbnRzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2V2ZW50cydcbmltcG9ydCAqIGFzIGlzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2lzJ1xuaW1wb3J0IHsgZ2V0V2luZG93IH0gZnJvbSAnQGludGVyYWN0anMvdXRpbHMvd2luZG93J1xuXG5mdW5jdGlvbiBwcmV2ZW50RGVmYXVsdCAoaW50ZXJhY3RhYmxlLCBuZXdWYWx1ZSkge1xuICBpZiAoL14oYWx3YXlzfG5ldmVyfGF1dG8pJC8udGVzdChuZXdWYWx1ZSkpIHtcbiAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5wcmV2ZW50RGVmYXVsdCA9IG5ld1ZhbHVlXG4gICAgcmV0dXJuIGludGVyYWN0YWJsZVxuICB9XG5cbiAgaWYgKGlzLmJvb2wobmV3VmFsdWUpKSB7XG4gICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucHJldmVudERlZmF1bHQgPSBuZXdWYWx1ZSA/ICdhbHdheXMnIDogJ25ldmVyJ1xuICAgIHJldHVybiBpbnRlcmFjdGFibGVcbiAgfVxuXG4gIHJldHVybiBpbnRlcmFjdGFibGUub3B0aW9ucy5wcmV2ZW50RGVmYXVsdFxufVxuXG5mdW5jdGlvbiBjaGVja0FuZFByZXZlbnREZWZhdWx0IChpbnRlcmFjdGFibGUsIHNjb3BlLCBldmVudCkge1xuICBjb25zdCBzZXR0aW5nID0gaW50ZXJhY3RhYmxlLm9wdGlvbnMucHJldmVudERlZmF1bHRcblxuICBpZiAoc2V0dGluZyA9PT0gJ25ldmVyJykgeyByZXR1cm4gfVxuXG4gIGlmIChzZXR0aW5nID09PSAnYWx3YXlzJykge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICByZXR1cm5cbiAgfVxuXG4gIC8vIHNldHRpbmcgPT09ICdhdXRvJ1xuXG4gIC8vIGlmIHRoZSBicm93c2VyIHN1cHBvcnRzIHBhc3NpdmUgZXZlbnQgbGlzdGVuZXJzIGFuZCBpc24ndCBydW5uaW5nIG9uIGlPUyxcbiAgLy8gZG9uJ3QgcHJldmVudERlZmF1bHQgb2YgdG91Y2h7c3RhcnQsbW92ZX0gZXZlbnRzLiBDU1MgdG91Y2gtYWN0aW9uIGFuZFxuICAvLyB1c2VyLXNlbGVjdCBzaG91bGQgYmUgdXNlZCBpbnN0ZWFkIG9mIGNhbGxpbmcgZXZlbnQucHJldmVudERlZmF1bHQoKS5cbiAgaWYgKGV2ZW50cy5zdXBwb3J0c1Bhc3NpdmUgJiYgL150b3VjaChzdGFydHxtb3ZlKSQvLnRlc3QoZXZlbnQudHlwZSkpIHtcbiAgICBjb25zdCBkb2MgPSBnZXRXaW5kb3coZXZlbnQudGFyZ2V0KS5kb2N1bWVudFxuICAgIGNvbnN0IGRvY09wdGlvbnMgPSBzY29wZS5nZXREb2NPcHRpb25zKGRvYylcblxuICAgIGlmICghKGRvY09wdGlvbnMgJiYgZG9jT3B0aW9ucy5ldmVudHMpIHx8IGRvY09wdGlvbnMuZXZlbnRzLnBhc3NpdmUgIT09IGZhbHNlKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gIH1cblxuICAvLyBkb24ndCBwcmV2ZW50RGVmYXVsdCBvZiBwb2ludGVyZG93biBldmVudHNcbiAgaWYgKC9eKG1vdXNlfHBvaW50ZXJ8dG91Y2gpKihkb3dufHN0YXJ0KS9pLnRlc3QoZXZlbnQudHlwZSkpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIC8vIGRvbid0IHByZXZlbnREZWZhdWx0IG9uIGVkaXRhYmxlIGVsZW1lbnRzXG4gIGlmIChpcy5lbGVtZW50KGV2ZW50LnRhcmdldCkgJiZcbiAgICAgIG1hdGNoZXNTZWxlY3RvcihldmVudC50YXJnZXQsICdpbnB1dCxzZWxlY3QsdGV4dGFyZWEsW2NvbnRlbnRlZGl0YWJsZT10cnVlXSxbY29udGVudGVkaXRhYmxlPXRydWVdIConKSkge1xuICAgIHJldHVyblxuICB9XG5cbiAgZXZlbnQucHJldmVudERlZmF1bHQoKVxufVxuXG5mdW5jdGlvbiBvbkludGVyYWN0aW9uRXZlbnQgKHsgaW50ZXJhY3Rpb24sIGV2ZW50IH0pIHtcbiAgaWYgKGludGVyYWN0aW9uLnRhcmdldCkge1xuICAgIGludGVyYWN0aW9uLnRhcmdldC5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50KVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YWxsIChzY29wZSkge1xuICAvKiogQGxlbmRzIEludGVyYWN0YWJsZSAqL1xuICBjb25zdCBJbnRlcmFjdGFibGUgPSBzY29wZS5JbnRlcmFjdGFibGVcblxuICAvKipcbiAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgdG8gcHJldmVudCB0aGUgYnJvd3NlcidzIGRlZmF1bHQgYmVoYXZpb3VyIGluXG4gICAqIHJlc3BvbnNlIHRvIHBvaW50ZXIgZXZlbnRzLiBDYW4gYmUgc2V0IHRvOlxuICAgKiAgLSBgJ2Fsd2F5cydgIHRvIGFsd2F5cyBwcmV2ZW50XG4gICAqICAtIGAnbmV2ZXInYCB0byBuZXZlciBwcmV2ZW50XG4gICAqICAtIGAnYXV0bydgIHRvIGxldCBpbnRlcmFjdC5qcyB0cnkgdG8gZGV0ZXJtaW5lIHdoYXQgd291bGQgYmUgYmVzdFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gW25ld1ZhbHVlXSBgJ2Fsd2F5cydgLCBgJ25ldmVyJ2Agb3IgYCdhdXRvJ2BcbiAgICogQHJldHVybiB7c3RyaW5nIHwgSW50ZXJhY3RhYmxlfSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLnByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24gKG5ld1ZhbHVlKSB7XG4gICAgcmV0dXJuIHByZXZlbnREZWZhdWx0KHRoaXMsIG5ld1ZhbHVlKVxuICB9XG5cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5jaGVja0FuZFByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgcmV0dXJuIGNoZWNrQW5kUHJldmVudERlZmF1bHQodGhpcywgc2NvcGUsIGV2ZW50KVxuICB9XG5cbiAgZm9yIChjb25zdCBldmVudFNpZ25hbCBvZiBbJ2Rvd24nLCAnbW92ZScsICd1cCcsICdjYW5jZWwnXSkge1xuICAgIHNjb3BlLmludGVyYWN0aW9ucy5zaWduYWxzLm9uKGV2ZW50U2lnbmFsLCBvbkludGVyYWN0aW9uRXZlbnQpXG4gIH1cblxuICAvLyBwcmV2ZW50IG5hdGl2ZSBIVE1MNSBkcmFnIG9uIGludGVyYWN0LmpzIHRhcmdldCBlbGVtZW50c1xuICBzY29wZS5pbnRlcmFjdGlvbnMuZXZlbnRNYXAuZHJhZ3N0YXJ0ID0gZnVuY3Rpb24gcHJldmVudE5hdGl2ZURyYWcgKGV2ZW50KSB7XG4gICAgZm9yIChjb25zdCBpbnRlcmFjdGlvbiBvZiBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCkge1xuICAgICAgaWYgKGludGVyYWN0aW9uLmVsZW1lbnQgJiZcbiAgICAgICAgKGludGVyYWN0aW9uLmVsZW1lbnQgPT09IGV2ZW50LnRhcmdldCB8fFxuICAgICAgICAgIG5vZGVDb250YWlucyhpbnRlcmFjdGlvbi5lbGVtZW50LCBldmVudC50YXJnZXQpKSkge1xuICAgICAgICBpbnRlcmFjdGlvbi50YXJnZXQuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudClcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCB0eXBlIEluc3RhbGwgPSB0eXBlb2YgaW5zdGFsbFxuXG5leHBvcnQgZGVmYXVsdCB7IGluc3RhbGwgfVxuIl19