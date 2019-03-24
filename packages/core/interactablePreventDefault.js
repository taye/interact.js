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
                interaction.interactable.checkAndPreventDefault(event);
                return;
            }
        }
    };
}
export default {
    id: 'core/interactablePreventDefault',
    install,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3RhYmxlUHJldmVudERlZmF1bHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnRlcmFjdGFibGVQcmV2ZW50RGVmYXVsdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQzFFLE9BQU8sTUFBTSxNQUFNLDBCQUEwQixDQUFBO0FBQzdDLE9BQU8sS0FBSyxFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUFDMUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDBCQUEwQixDQUFBO0FBRXBELFNBQVMsY0FBYyxDQUFFLFlBQVksRUFBRSxRQUFRO0lBQzdDLElBQUksdUJBQXVCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzFDLFlBQVksQ0FBQyxPQUFPLENBQUMsY0FBYyxHQUFHLFFBQVEsQ0FBQTtRQUM5QyxPQUFPLFlBQVksQ0FBQTtLQUNwQjtJQUVELElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUNyQixZQUFZLENBQUMsT0FBTyxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFBO1FBQ25FLE9BQU8sWUFBWSxDQUFBO0tBQ3BCO0lBRUQsT0FBTyxZQUFZLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQTtBQUM1QyxDQUFDO0FBRUQsU0FBUyxzQkFBc0IsQ0FBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLEtBQUs7SUFDekQsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUE7SUFFbkQsSUFBSSxPQUFPLEtBQUssT0FBTyxFQUFFO1FBQUUsT0FBTTtLQUFFO0lBRW5DLElBQUksT0FBTyxLQUFLLFFBQVEsRUFBRTtRQUN4QixLQUFLLENBQUMsY0FBYyxFQUFFLENBQUE7UUFDdEIsT0FBTTtLQUNQO0lBRUQscUJBQXFCO0lBRXJCLDRFQUE0RTtJQUM1RSx5RUFBeUU7SUFDekUsd0VBQXdFO0lBQ3hFLElBQUksTUFBTSxDQUFDLGVBQWUsSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3BFLE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFBO1FBQzVDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUE7UUFFM0MsSUFBSSxDQUFDLENBQUMsVUFBVSxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLE9BQU8sS0FBSyxLQUFLLEVBQUU7WUFDN0UsT0FBTTtTQUNQO0tBQ0Y7SUFFRCw2Q0FBNkM7SUFDN0MsSUFBSSxzQ0FBc0MsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQzNELE9BQU07S0FDUDtJQUVELDRDQUE0QztJQUM1QyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUN4QixlQUFlLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSx1RUFBdUUsQ0FBQyxFQUFFO1FBQzFHLE9BQU07S0FDUDtJQUVELEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQTtBQUN4QixDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUU7SUFDakQsSUFBSSxXQUFXLENBQUMsWUFBWSxFQUFFO1FBQzVCLFdBQVcsQ0FBQyxZQUFZLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUE7S0FDdkQ7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLE9BQU8sQ0FBRSxLQUFLO0lBQzVCLDBCQUEwQjtJQUMxQixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFBO0lBRXZDOzs7Ozs7Ozs7T0FTRztJQUNILFlBQVksQ0FBQyxTQUFTLENBQUMsY0FBYyxHQUFHLFVBQVUsUUFBUTtRQUN4RCxPQUFPLGNBQWMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDdkMsQ0FBQyxDQUFBO0lBRUQsWUFBWSxDQUFDLFNBQVMsQ0FBQyxzQkFBc0IsR0FBRyxVQUFVLEtBQUs7UUFDN0QsT0FBTyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQ25ELENBQUMsQ0FBQTtJQUVELEtBQUssTUFBTSxXQUFXLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsRUFBRTtRQUMxRCxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLGtCQUFrQixDQUFDLENBQUE7S0FDL0Q7SUFFRCwyREFBMkQ7SUFDM0QsS0FBSyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLFNBQVMsaUJBQWlCLENBQUUsS0FBSztRQUN2RSxLQUFLLE1BQU0sV0FBVyxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFO1lBQ2pELElBQUksV0FBVyxDQUFDLE9BQU87Z0JBQ3JCLENBQUMsV0FBVyxDQUFDLE9BQU8sS0FBSyxLQUFLLENBQUMsTUFBTTtvQkFDbkMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUU7Z0JBQ3BELFdBQVcsQ0FBQyxZQUFZLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUE7Z0JBQ3RELE9BQU07YUFDUDtTQUNGO0lBQ0gsQ0FBQyxDQUFBO0FBQ0gsQ0FBQztBQUlELGVBQWU7SUFDYixFQUFFLEVBQUUsaUNBQWlDO0lBQ3JDLE9BQU87Q0FDUixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbWF0Y2hlc1NlbGVjdG9yLCBub2RlQ29udGFpbnMgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9kb21VdGlscydcbmltcG9ydCBldmVudHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZXZlbnRzJ1xuaW1wb3J0ICogYXMgaXMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvaXMnXG5pbXBvcnQgeyBnZXRXaW5kb3cgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy93aW5kb3cnXG5cbmZ1bmN0aW9uIHByZXZlbnREZWZhdWx0IChpbnRlcmFjdGFibGUsIG5ld1ZhbHVlKSB7XG4gIGlmICgvXihhbHdheXN8bmV2ZXJ8YXV0bykkLy50ZXN0KG5ld1ZhbHVlKSkge1xuICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnByZXZlbnREZWZhdWx0ID0gbmV3VmFsdWVcbiAgICByZXR1cm4gaW50ZXJhY3RhYmxlXG4gIH1cblxuICBpZiAoaXMuYm9vbChuZXdWYWx1ZSkpIHtcbiAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5wcmV2ZW50RGVmYXVsdCA9IG5ld1ZhbHVlID8gJ2Fsd2F5cycgOiAnbmV2ZXInXG4gICAgcmV0dXJuIGludGVyYWN0YWJsZVxuICB9XG5cbiAgcmV0dXJuIGludGVyYWN0YWJsZS5vcHRpb25zLnByZXZlbnREZWZhdWx0XG59XG5cbmZ1bmN0aW9uIGNoZWNrQW5kUHJldmVudERlZmF1bHQgKGludGVyYWN0YWJsZSwgc2NvcGUsIGV2ZW50KSB7XG4gIGNvbnN0IHNldHRpbmcgPSBpbnRlcmFjdGFibGUub3B0aW9ucy5wcmV2ZW50RGVmYXVsdFxuXG4gIGlmIChzZXR0aW5nID09PSAnbmV2ZXInKSB7IHJldHVybiB9XG5cbiAgaWYgKHNldHRpbmcgPT09ICdhbHdheXMnKSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxuICAgIHJldHVyblxuICB9XG5cbiAgLy8gc2V0dGluZyA9PT0gJ2F1dG8nXG5cbiAgLy8gaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgcGFzc2l2ZSBldmVudCBsaXN0ZW5lcnMgYW5kIGlzbid0IHJ1bm5pbmcgb24gaU9TLFxuICAvLyBkb24ndCBwcmV2ZW50RGVmYXVsdCBvZiB0b3VjaHtzdGFydCxtb3ZlfSBldmVudHMuIENTUyB0b3VjaC1hY3Rpb24gYW5kXG4gIC8vIHVzZXItc2VsZWN0IHNob3VsZCBiZSB1c2VkIGluc3RlYWQgb2YgY2FsbGluZyBldmVudC5wcmV2ZW50RGVmYXVsdCgpLlxuICBpZiAoZXZlbnRzLnN1cHBvcnRzUGFzc2l2ZSAmJiAvXnRvdWNoKHN0YXJ0fG1vdmUpJC8udGVzdChldmVudC50eXBlKSkge1xuICAgIGNvbnN0IGRvYyA9IGdldFdpbmRvdyhldmVudC50YXJnZXQpLmRvY3VtZW50XG4gICAgY29uc3QgZG9jT3B0aW9ucyA9IHNjb3BlLmdldERvY09wdGlvbnMoZG9jKVxuXG4gICAgaWYgKCEoZG9jT3B0aW9ucyAmJiBkb2NPcHRpb25zLmV2ZW50cykgfHwgZG9jT3B0aW9ucy5ldmVudHMucGFzc2l2ZSAhPT0gZmFsc2UpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgfVxuXG4gIC8vIGRvbid0IHByZXZlbnREZWZhdWx0IG9mIHBvaW50ZXJkb3duIGV2ZW50c1xuICBpZiAoL14obW91c2V8cG9pbnRlcnx0b3VjaCkqKGRvd258c3RhcnQpL2kudGVzdChldmVudC50eXBlKSkge1xuICAgIHJldHVyblxuICB9XG5cbiAgLy8gZG9uJ3QgcHJldmVudERlZmF1bHQgb24gZWRpdGFibGUgZWxlbWVudHNcbiAgaWYgKGlzLmVsZW1lbnQoZXZlbnQudGFyZ2V0KSAmJlxuICAgICAgbWF0Y2hlc1NlbGVjdG9yKGV2ZW50LnRhcmdldCwgJ2lucHV0LHNlbGVjdCx0ZXh0YXJlYSxbY29udGVudGVkaXRhYmxlPXRydWVdLFtjb250ZW50ZWRpdGFibGU9dHJ1ZV0gKicpKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG59XG5cbmZ1bmN0aW9uIG9uSW50ZXJhY3Rpb25FdmVudCAoeyBpbnRlcmFjdGlvbiwgZXZlbnQgfSkge1xuICBpZiAoaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlKSB7XG4gICAgaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlLmNoZWNrQW5kUHJldmVudERlZmF1bHQoZXZlbnQpXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbGwgKHNjb3BlKSB7XG4gIC8qKiBAbGVuZHMgSW50ZXJhY3RhYmxlICovXG4gIGNvbnN0IEludGVyYWN0YWJsZSA9IHNjb3BlLkludGVyYWN0YWJsZVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciB0byBwcmV2ZW50IHRoZSBicm93c2VyJ3MgZGVmYXVsdCBiZWhhdmlvdXIgaW5cbiAgICogcmVzcG9uc2UgdG8gcG9pbnRlciBldmVudHMuIENhbiBiZSBzZXQgdG86XG4gICAqICAtIGAnYWx3YXlzJ2AgdG8gYWx3YXlzIHByZXZlbnRcbiAgICogIC0gYCduZXZlcidgIHRvIG5ldmVyIHByZXZlbnRcbiAgICogIC0gYCdhdXRvJ2AgdG8gbGV0IGludGVyYWN0LmpzIHRyeSB0byBkZXRlcm1pbmUgd2hhdCB3b3VsZCBiZSBiZXN0XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbmV3VmFsdWVdIGAnYWx3YXlzJ2AsIGAnbmV2ZXInYCBvciBgJ2F1dG8nYFxuICAgKiBAcmV0dXJuIHtzdHJpbmcgfCBJbnRlcmFjdGFibGV9IFRoZSBjdXJyZW50IHNldHRpbmcgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUucHJldmVudERlZmF1bHQgPSBmdW5jdGlvbiAobmV3VmFsdWUpIHtcbiAgICByZXR1cm4gcHJldmVudERlZmF1bHQodGhpcywgbmV3VmFsdWUpXG4gIH1cblxuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLmNoZWNrQW5kUHJldmVudERlZmF1bHQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICByZXR1cm4gY2hlY2tBbmRQcmV2ZW50RGVmYXVsdCh0aGlzLCBzY29wZSwgZXZlbnQpXG4gIH1cblxuICBmb3IgKGNvbnN0IGV2ZW50U2lnbmFsIG9mIFsnZG93bicsICdtb3ZlJywgJ3VwJywgJ2NhbmNlbCddKSB7XG4gICAgc2NvcGUuaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oZXZlbnRTaWduYWwsIG9uSW50ZXJhY3Rpb25FdmVudClcbiAgfVxuXG4gIC8vIHByZXZlbnQgbmF0aXZlIEhUTUw1IGRyYWcgb24gaW50ZXJhY3QuanMgdGFyZ2V0IGVsZW1lbnRzXG4gIHNjb3BlLmludGVyYWN0aW9ucy5ldmVudE1hcC5kcmFnc3RhcnQgPSBmdW5jdGlvbiBwcmV2ZW50TmF0aXZlRHJhZyAoZXZlbnQpIHtcbiAgICBmb3IgKGNvbnN0IGludGVyYWN0aW9uIG9mIHNjb3BlLmludGVyYWN0aW9ucy5saXN0KSB7XG4gICAgICBpZiAoaW50ZXJhY3Rpb24uZWxlbWVudCAmJlxuICAgICAgICAoaW50ZXJhY3Rpb24uZWxlbWVudCA9PT0gZXZlbnQudGFyZ2V0IHx8XG4gICAgICAgICAgbm9kZUNvbnRhaW5zKGludGVyYWN0aW9uLmVsZW1lbnQsIGV2ZW50LnRhcmdldCkpKSB7XG4gICAgICAgIGludGVyYWN0aW9uLmludGVyYWN0YWJsZS5jaGVja0FuZFByZXZlbnREZWZhdWx0KGV2ZW50KVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgSW5zdGFsbCA9IHR5cGVvZiBpbnN0YWxsXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgaWQ6ICdjb3JlL2ludGVyYWN0YWJsZVByZXZlbnREZWZhdWx0JyxcbiAgaW5zdGFsbCxcbn1cbiJdfQ==