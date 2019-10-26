import { matchesSelector, nodeContains } from '@interactjs/utils/domUtils';
import events from '@interactjs/utils/events';
import * as is from '@interactjs/utils/is';
import { getWindow } from '@interactjs/utils/window';
function preventDefault(newValue) {
    if (/^(always|never|auto)$/.test(newValue)) {
        this.options.preventDefault = newValue;
        return this;
    }
    if (is.bool(newValue)) {
        this.options.preventDefault = newValue ? 'always' : 'never';
        return this;
    }
    return this.options.preventDefault;
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
    if (interaction.interactable) {
        interaction.interactable.checkAndPreventDefault(event);
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
    Interactable.prototype.preventDefault = preventDefault;
    Interactable.prototype.checkAndPreventDefault = function (event) {
        return checkAndPreventDefault(this, scope, event);
    };
    for (const eventSignal of ['down', 'move', 'up', 'cancel']) {
        scope.interactions.signals.on(eventSignal, onInteractionEvent);
    }
    // prevent native HTML5 drag on interact.js target elements
    scope.interactions.docEvents.push({
        type: 'dragstart',
        listener(event) {
            for (const interaction of scope.interactions.list) {
                if (interaction.element &&
                    (interaction.element === event.target ||
                        nodeContains(interaction.element, event.target))) {
                    interaction.interactable.checkAndPreventDefault(event);
                    return;
                }
            }
        },
    });
}
export default {
    id: 'core/interactablePreventDefault',
    install,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3RhYmxlUHJldmVudERlZmF1bHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlcmFjdGFibGVQcmV2ZW50RGVmYXVsdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQzFFLE9BQU8sTUFBTSxNQUFNLDBCQUEwQixDQUFBO0FBQzdDLE9BQU8sS0FBSyxFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUFDMUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDBCQUEwQixDQUFBO0FBU3BELFNBQVMsY0FBYyxDQUErQixRQUFzQztJQUMxRixJQUFJLHVCQUF1QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUMxQyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUE7UUFDdEMsT0FBTyxJQUFJLENBQUE7S0FDWjtJQUVELElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUNyQixJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFBO1FBQzNELE9BQU8sSUFBSSxDQUFBO0tBQ1o7SUFFRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFBO0FBQ3BDLENBQUM7QUFFRCxTQUFTLHNCQUFzQixDQUFFLFlBQW1DLEVBQUUsS0FBcUIsRUFBRSxLQUFZO0lBQ3ZHLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFBO0lBRW5ELElBQUksT0FBTyxLQUFLLE9BQU8sRUFBRTtRQUFFLE9BQU07S0FBRTtJQUVuQyxJQUFJLE9BQU8sS0FBSyxRQUFRLEVBQUU7UUFDeEIsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFBO1FBQ3RCLE9BQU07S0FDUDtJQUVELHFCQUFxQjtJQUVyQiw0RUFBNEU7SUFDNUUseUVBQXlFO0lBQ3pFLHdFQUF3RTtJQUN4RSxJQUFJLE1BQU0sQ0FBQyxlQUFlLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNwRSxNQUFNLEdBQUcsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQTtRQUM1QyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBRTNDLElBQUksQ0FBQyxDQUFDLFVBQVUsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEtBQUssS0FBSyxFQUFFO1lBQzdFLE9BQU07U0FDUDtLQUNGO0lBRUQsNkNBQTZDO0lBQzdDLElBQUksc0NBQXNDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUMzRCxPQUFNO0tBQ1A7SUFFRCw0Q0FBNEM7SUFDNUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7UUFDeEIsZUFBZSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsdUVBQXVFLENBQUMsRUFBRTtRQUMxRyxPQUFNO0tBQ1A7SUFFRCxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUE7QUFDeEIsQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFzQjtJQUNyRSxJQUFJLFdBQVcsQ0FBQyxZQUFZLEVBQUU7UUFDNUIsV0FBVyxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFjLENBQUMsQ0FBQTtLQUNoRTtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsT0FBTyxDQUFFLEtBQXFCO0lBQzVDLDBCQUEwQjtJQUMxQixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFBO0lBRXZDOzs7Ozs7Ozs7T0FTRztJQUNILFlBQVksQ0FBQyxTQUFTLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQTtJQUV0RCxZQUFZLENBQUMsU0FBUyxDQUFDLHNCQUFzQixHQUFHLFVBQVUsS0FBSztRQUM3RCxPQUFPLHNCQUFzQixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDbkQsQ0FBQyxDQUFBO0lBRUQsS0FBSyxNQUFNLFdBQVcsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxFQUFFO1FBQzFELEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsa0JBQWtCLENBQUMsQ0FBQTtLQUMvRDtJQUVELDJEQUEyRDtJQUMzRCxLQUFLLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7UUFDaEMsSUFBSSxFQUFFLFdBQVc7UUFDakIsUUFBUSxDQUFFLEtBQUs7WUFDYixLQUFLLE1BQU0sV0FBVyxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFO2dCQUNqRCxJQUFJLFdBQVcsQ0FBQyxPQUFPO29CQUNyQixDQUFDLFdBQVcsQ0FBQyxPQUFPLEtBQUssS0FBSyxDQUFDLE1BQU07d0JBQ3BDLFlBQVksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFO29CQUNuRCxXQUFXLENBQUMsWUFBWSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFBO29CQUN0RCxPQUFNO2lCQUNQO2FBQ0Y7UUFDSCxDQUFDO0tBQ0YsQ0FBQyxDQUFBO0FBQ0osQ0FBQztBQUlELGVBQWU7SUFDYixFQUFFLEVBQUUsaUNBQWlDO0lBQ3JDLE9BQU87Q0FDUixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbWF0Y2hlc1NlbGVjdG9yLCBub2RlQ29udGFpbnMgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9kb21VdGlscydcbmltcG9ydCBldmVudHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZXZlbnRzJ1xuaW1wb3J0ICogYXMgaXMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvaXMnXG5pbXBvcnQgeyBnZXRXaW5kb3cgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy93aW5kb3cnXG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0YWJsZScge1xuICBpbnRlcmZhY2UgSW50ZXJhY3RhYmxlIHtcbiAgICBwcmV2ZW50RGVmYXVsdDogdHlwZW9mIHByZXZlbnREZWZhdWx0XG4gICAgY2hlY2tBbmRQcmV2ZW50RGVmYXVsdDogKGV2ZW50OiBFdmVudCkgPT4gdm9pZFxuICB9XG59XG5cbmZ1bmN0aW9uIHByZXZlbnREZWZhdWx0ICh0aGlzOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsIG5ld1ZhbHVlPzogJ2Fsd2F5cycgfCAnbmV2ZXInIHwgJ2F1dG8nKSB7XG4gIGlmICgvXihhbHdheXN8bmV2ZXJ8YXV0bykkLy50ZXN0KG5ld1ZhbHVlKSkge1xuICAgIHRoaXMub3B0aW9ucy5wcmV2ZW50RGVmYXVsdCA9IG5ld1ZhbHVlXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIGlmIChpcy5ib29sKG5ld1ZhbHVlKSkge1xuICAgIHRoaXMub3B0aW9ucy5wcmV2ZW50RGVmYXVsdCA9IG5ld1ZhbHVlID8gJ2Fsd2F5cycgOiAnbmV2ZXInXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHJldHVybiB0aGlzLm9wdGlvbnMucHJldmVudERlZmF1bHRcbn1cblxuZnVuY3Rpb24gY2hlY2tBbmRQcmV2ZW50RGVmYXVsdCAoaW50ZXJhY3RhYmxlOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsIHNjb3BlOiBJbnRlcmFjdC5TY29wZSwgZXZlbnQ6IEV2ZW50KSB7XG4gIGNvbnN0IHNldHRpbmcgPSBpbnRlcmFjdGFibGUub3B0aW9ucy5wcmV2ZW50RGVmYXVsdFxuXG4gIGlmIChzZXR0aW5nID09PSAnbmV2ZXInKSB7IHJldHVybiB9XG5cbiAgaWYgKHNldHRpbmcgPT09ICdhbHdheXMnKSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIHJldHVyblxuICB9XG5cbiAgLy8gc2V0dGluZyA9PT0gJ2F1dG8nXG5cbiAgLy8gaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgcGFzc2l2ZSBldmVudCBsaXN0ZW5lcnMgYW5kIGlzbid0IHJ1bm5pbmcgb24gaU9TLFxuICAvLyBkb24ndCBwcmV2ZW50RGVmYXVsdCBvZiB0b3VjaHtzdGFydCxtb3ZlfSBldmVudHMuIENTUyB0b3VjaC1hY3Rpb24gYW5kXG4gIC8vIHVzZXItc2VsZWN0IHNob3VsZCBiZSB1c2VkIGluc3RlYWQgb2YgY2FsbGluZyBldmVudC5wcmV2ZW50RGVmYXVsdCgpLlxuICBpZiAoZXZlbnRzLnN1cHBvcnRzUGFzc2l2ZSAmJiAvXnRvdWNoKHN0YXJ0fG1vdmUpJC8udGVzdChldmVudC50eXBlKSkge1xuICAgIGNvbnN0IGRvYyA9IGdldFdpbmRvdyhldmVudC50YXJnZXQpLmRvY3VtZW50XG4gICAgY29uc3QgZG9jT3B0aW9ucyA9IHNjb3BlLmdldERvY09wdGlvbnMoZG9jKVxuXG4gICAgaWYgKCEoZG9jT3B0aW9ucyAmJiBkb2NPcHRpb25zLmV2ZW50cykgfHwgZG9jT3B0aW9ucy5ldmVudHMucGFzc2l2ZSAhPT0gZmFsc2UpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgfVxuXG4gIC8vIGRvbid0IHByZXZlbnREZWZhdWx0IG9mIHBvaW50ZXJkb3duIGV2ZW50c1xuICBpZiAoL14obW91c2V8cG9pbnRlcnx0b3VjaCkqKGRvd258c3RhcnQpL2kudGVzdChldmVudC50eXBlKSkge1xuICAgIHJldHVyblxuICB9XG5cbiAgLy8gZG9uJ3QgcHJldmVudERlZmF1bHQgb24gZWRpdGFibGUgZWxlbWVudHNcbiAgaWYgKGlzLmVsZW1lbnQoZXZlbnQudGFyZ2V0KSAmJlxuICAgICAgbWF0Y2hlc1NlbGVjdG9yKGV2ZW50LnRhcmdldCwgJ2lucHV0LHNlbGVjdCx0ZXh0YXJlYSxbY29udGVudGVkaXRhYmxlPXRydWVdLFtjb250ZW50ZWRpdGFibGU9dHJ1ZV0gKicpKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG59XG5cbmZ1bmN0aW9uIG9uSW50ZXJhY3Rpb25FdmVudCAoeyBpbnRlcmFjdGlvbiwgZXZlbnQgfTogSW50ZXJhY3QuU2lnbmFsQXJnKSB7XG4gIGlmIChpbnRlcmFjdGlvbi5pbnRlcmFjdGFibGUpIHtcbiAgICBpbnRlcmFjdGlvbi5pbnRlcmFjdGFibGUuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdChldmVudCBhcyBFdmVudClcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFsbCAoc2NvcGU6IEludGVyYWN0LlNjb3BlKSB7XG4gIC8qKiBAbGVuZHMgSW50ZXJhY3RhYmxlICovXG4gIGNvbnN0IEludGVyYWN0YWJsZSA9IHNjb3BlLkludGVyYWN0YWJsZVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciB0byBwcmV2ZW50IHRoZSBicm93c2VyJ3MgZGVmYXVsdCBiZWhhdmlvdXIgaW5cbiAgICogcmVzcG9uc2UgdG8gcG9pbnRlciBldmVudHMuIENhbiBiZSBzZXQgdG86XG4gICAqICAtIGAnYWx3YXlzJ2AgdG8gYWx3YXlzIHByZXZlbnRcbiAgICogIC0gYCduZXZlcidgIHRvIG5ldmVyIHByZXZlbnRcbiAgICogIC0gYCdhdXRvJ2AgdG8gbGV0IGludGVyYWN0LmpzIHRyeSB0byBkZXRlcm1pbmUgd2hhdCB3b3VsZCBiZSBiZXN0XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbmV3VmFsdWVdIGAnYWx3YXlzJ2AsIGAnbmV2ZXInYCBvciBgJ2F1dG8nYFxuICAgKiBAcmV0dXJuIHtzdHJpbmcgfCBJbnRlcmFjdGFibGV9IFRoZSBjdXJyZW50IHNldHRpbmcgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUucHJldmVudERlZmF1bHQgPSBwcmV2ZW50RGVmYXVsdFxuXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUuY2hlY2tBbmRQcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgIHJldHVybiBjaGVja0FuZFByZXZlbnREZWZhdWx0KHRoaXMsIHNjb3BlLCBldmVudClcbiAgfVxuXG4gIGZvciAoY29uc3QgZXZlbnRTaWduYWwgb2YgWydkb3duJywgJ21vdmUnLCAndXAnLCAnY2FuY2VsJ10pIHtcbiAgICBzY29wZS5pbnRlcmFjdGlvbnMuc2lnbmFscy5vbihldmVudFNpZ25hbCwgb25JbnRlcmFjdGlvbkV2ZW50KVxuICB9XG5cbiAgLy8gcHJldmVudCBuYXRpdmUgSFRNTDUgZHJhZyBvbiBpbnRlcmFjdC5qcyB0YXJnZXQgZWxlbWVudHNcbiAgc2NvcGUuaW50ZXJhY3Rpb25zLmRvY0V2ZW50cy5wdXNoKHtcbiAgICB0eXBlOiAnZHJhZ3N0YXJ0JyxcbiAgICBsaXN0ZW5lciAoZXZlbnQpIHtcbiAgICAgIGZvciAoY29uc3QgaW50ZXJhY3Rpb24gb2Ygc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QpIHtcbiAgICAgICAgaWYgKGludGVyYWN0aW9uLmVsZW1lbnQgJiZcbiAgICAgICAgICAoaW50ZXJhY3Rpb24uZWxlbWVudCA9PT0gZXZlbnQudGFyZ2V0IHx8XG4gICAgICAgICAgIG5vZGVDb250YWlucyhpbnRlcmFjdGlvbi5lbGVtZW50LCBldmVudC50YXJnZXQpKSkge1xuICAgICAgICAgIGludGVyYWN0aW9uLmludGVyYWN0YWJsZS5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50KVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgfSlcbn1cblxuZXhwb3J0IHR5cGUgSW5zdGFsbCA9IHR5cGVvZiBpbnN0YWxsXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgaWQ6ICdjb3JlL2ludGVyYWN0YWJsZVByZXZlbnREZWZhdWx0JyxcbiAgaW5zdGFsbCxcbn1cbiJdfQ==