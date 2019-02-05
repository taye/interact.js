import { ActionName } from '@interactjs/core/scope';
import { parentNode } from '@interactjs/utils/domUtils';
import * as is from '@interactjs/utils/is';
import autoStart from './base';
function install(scope) {
    scope.autoStart.signals.on('before-start', ({ interaction, eventTarget, dx, dy }) => {
        if (interaction.prepared.name !== 'drag') {
            return;
        }
        // check if a drag is in the correct axis
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        const targetOptions = interaction.target.options.drag;
        const startAxis = targetOptions.startAxis;
        const currentAxis = (absX > absY ? 'x' : absX < absY ? 'y' : 'xy');
        interaction.prepared.axis = targetOptions.lockAxis === 'start'
            ? currentAxis[0] // always lock to one axis even if currentAxis === 'xy'
            : targetOptions.lockAxis;
        // if the movement isn't in the startAxis of the interactable
        if (currentAxis !== 'xy' && startAxis !== 'xy' && startAxis !== currentAxis) {
            // cancel the prepared action
            interaction.prepared.name = null;
            // then try to get a drag from another ineractable
            let element = eventTarget;
            const getDraggable = function (interactable) {
                if (interactable === interaction.target) {
                    return;
                }
                const options = interaction.target.options.drag;
                if (!options.manualStart &&
                    interactable.testIgnoreAllow(options, element, eventTarget)) {
                    const action = interactable.getAction(interaction.downPointer, interaction.downEvent, interaction, element);
                    if (action &&
                        action.name === 'drag' &&
                        checkStartAxis(currentAxis, interactable) &&
                        autoStart.validateAction(action, interactable, element, eventTarget, scope)) {
                        return interactable;
                    }
                }
            };
            // check all interactables
            while (is.element(element)) {
                const interactable = scope.interactables.forEachMatch(element, getDraggable);
                if (interactable) {
                    interaction.prepared.name = ActionName.Drag;
                    interaction.target = interactable;
                    interaction.element = element;
                    break;
                }
                element = parentNode(element);
            }
        }
    });
    function checkStartAxis(startAxis, interactable) {
        if (!interactable) {
            return false;
        }
        const thisAxis = interactable.options.drag.startAxis;
        return (startAxis === 'xy' || thisAxis === 'xy' || thisAxis === startAxis);
    }
}
export default { install };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZ0F4aXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkcmFnQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sd0JBQXdCLENBQUE7QUFDbkQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQ3ZELE9BQU8sS0FBSyxFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUFDMUMsT0FBTyxTQUFTLE1BQU0sUUFBUSxDQUFBO0FBSTlCLFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRyxDQUFDLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRTtRQUNuRixJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtZQUFFLE9BQU07U0FBRTtRQUVwRCx5Q0FBeUM7UUFDekMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUN6QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3pCLE1BQU0sYUFBYSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQTtRQUNyRCxNQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFBO1FBQ3pDLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRWxFLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxRQUFRLEtBQUssT0FBTztZQUM1RCxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLHVEQUF1RDtZQUN4RSxDQUFDLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQTtRQUUxQiw2REFBNkQ7UUFDN0QsSUFBSSxXQUFXLEtBQUssSUFBSSxJQUFJLFNBQVMsS0FBSyxJQUFJLElBQUksU0FBUyxLQUFLLFdBQVcsRUFBRTtZQUMzRSw2QkFBNkI7WUFDN0IsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1lBRWhDLGtEQUFrRDtZQUNsRCxJQUFJLE9BQU8sR0FBRyxXQUFXLENBQUE7WUFFekIsTUFBTSxZQUFZLEdBQUcsVUFBVSxZQUFZO2dCQUN6QyxJQUFJLFlBQVksS0FBSyxXQUFXLENBQUMsTUFBTSxFQUFFO29CQUFFLE9BQU07aUJBQUU7Z0JBRW5ELE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQTtnQkFFL0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXO29CQUNwQixZQUFZLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLEVBQUU7b0JBQy9ELE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQ25DLFdBQVcsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUE7b0JBRXZFLElBQUksTUFBTTt3QkFDTixNQUFNLENBQUMsSUFBSSxLQUFLLE1BQU07d0JBQ3RCLGNBQWMsQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDO3dCQUN6QyxTQUFTLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsRUFBRTt3QkFDL0UsT0FBTyxZQUFZLENBQUE7cUJBQ3BCO2lCQUNGO1lBQ0gsQ0FBQyxDQUFBO1lBRUQsMEJBQTBCO1lBQzFCLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDMUIsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFBO2dCQUU1RSxJQUFJLFlBQVksRUFBRTtvQkFDaEIsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQTtvQkFDM0MsV0FBVyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUE7b0JBQ2pDLFdBQVcsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO29CQUM3QixNQUFLO2lCQUNOO2dCQUVELE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUE7YUFDOUI7U0FDRjtJQUNILENBQUMsQ0FBQyxDQUFBO0lBRUYsU0FBUyxjQUFjLENBQUUsU0FBUyxFQUFFLFlBQVk7UUFDOUMsSUFBSSxDQUFDLFlBQVksRUFBRTtZQUFFLE9BQU8sS0FBSyxDQUFBO1NBQUU7UUFFbkMsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFBO1FBRXBELE9BQU8sQ0FBQyxTQUFTLEtBQUssSUFBSSxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksUUFBUSxLQUFLLFNBQVMsQ0FBQyxDQUFBO0lBQzVFLENBQUM7QUFDSCxDQUFDO0FBRUQsZUFBZSxFQUFFLE9BQU8sRUFBRSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWN0aW9uTmFtZSB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnXG5pbXBvcnQgeyBwYXJlbnROb2RlIH0gZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZG9tVXRpbHMnXG5pbXBvcnQgKiBhcyBpcyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9pcydcbmltcG9ydCBhdXRvU3RhcnQgZnJvbSAnLi9iYXNlJ1xuXG50eXBlIFNjb3BlID0gaW1wb3J0ICgnQGludGVyYWN0anMvY29yZS9zY29wZScpLlNjb3BlXG5cbmZ1bmN0aW9uIGluc3RhbGwgKHNjb3BlOiBTY29wZSkge1xuICBzY29wZS5hdXRvU3RhcnQuc2lnbmFscy5vbignYmVmb3JlLXN0YXJ0JywgICh7IGludGVyYWN0aW9uLCBldmVudFRhcmdldCwgZHgsIGR5IH0pID0+IHtcbiAgICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ2RyYWcnKSB7IHJldHVybiB9XG5cbiAgICAvLyBjaGVjayBpZiBhIGRyYWcgaXMgaW4gdGhlIGNvcnJlY3QgYXhpc1xuICAgIGNvbnN0IGFic1ggPSBNYXRoLmFicyhkeClcbiAgICBjb25zdCBhYnNZID0gTWF0aC5hYnMoZHkpXG4gICAgY29uc3QgdGFyZ2V0T3B0aW9ucyA9IGludGVyYWN0aW9uLnRhcmdldC5vcHRpb25zLmRyYWdcbiAgICBjb25zdCBzdGFydEF4aXMgPSB0YXJnZXRPcHRpb25zLnN0YXJ0QXhpc1xuICAgIGNvbnN0IGN1cnJlbnRBeGlzID0gKGFic1ggPiBhYnNZID8gJ3gnIDogYWJzWCA8IGFic1kgPyAneScgOiAneHknKVxuXG4gICAgaW50ZXJhY3Rpb24ucHJlcGFyZWQuYXhpcyA9IHRhcmdldE9wdGlvbnMubG9ja0F4aXMgPT09ICdzdGFydCdcbiAgICAgID8gY3VycmVudEF4aXNbMF0gLy8gYWx3YXlzIGxvY2sgdG8gb25lIGF4aXMgZXZlbiBpZiBjdXJyZW50QXhpcyA9PT0gJ3h5J1xuICAgICAgOiB0YXJnZXRPcHRpb25zLmxvY2tBeGlzXG5cbiAgICAvLyBpZiB0aGUgbW92ZW1lbnQgaXNuJ3QgaW4gdGhlIHN0YXJ0QXhpcyBvZiB0aGUgaW50ZXJhY3RhYmxlXG4gICAgaWYgKGN1cnJlbnRBeGlzICE9PSAneHknICYmIHN0YXJ0QXhpcyAhPT0gJ3h5JyAmJiBzdGFydEF4aXMgIT09IGN1cnJlbnRBeGlzKSB7XG4gICAgICAvLyBjYW5jZWwgdGhlIHByZXBhcmVkIGFjdGlvblxuICAgICAgaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSA9IG51bGxcblxuICAgICAgLy8gdGhlbiB0cnkgdG8gZ2V0IGEgZHJhZyBmcm9tIGFub3RoZXIgaW5lcmFjdGFibGVcbiAgICAgIGxldCBlbGVtZW50ID0gZXZlbnRUYXJnZXRcblxuICAgICAgY29uc3QgZ2V0RHJhZ2dhYmxlID0gZnVuY3Rpb24gKGludGVyYWN0YWJsZSkge1xuICAgICAgICBpZiAoaW50ZXJhY3RhYmxlID09PSBpbnRlcmFjdGlvbi50YXJnZXQpIHsgcmV0dXJuIH1cblxuICAgICAgICBjb25zdCBvcHRpb25zID0gaW50ZXJhY3Rpb24udGFyZ2V0Lm9wdGlvbnMuZHJhZ1xuXG4gICAgICAgIGlmICghb3B0aW9ucy5tYW51YWxTdGFydCAmJlxuICAgICAgICAgICAgaW50ZXJhY3RhYmxlLnRlc3RJZ25vcmVBbGxvdyhvcHRpb25zLCBlbGVtZW50LCBldmVudFRhcmdldCkpIHtcbiAgICAgICAgICBjb25zdCBhY3Rpb24gPSBpbnRlcmFjdGFibGUuZ2V0QWN0aW9uKFxuICAgICAgICAgICAgaW50ZXJhY3Rpb24uZG93blBvaW50ZXIsIGludGVyYWN0aW9uLmRvd25FdmVudCwgaW50ZXJhY3Rpb24sIGVsZW1lbnQpXG5cbiAgICAgICAgICBpZiAoYWN0aW9uICYmXG4gICAgICAgICAgICAgIGFjdGlvbi5uYW1lID09PSAnZHJhZycgJiZcbiAgICAgICAgICAgICAgY2hlY2tTdGFydEF4aXMoY3VycmVudEF4aXMsIGludGVyYWN0YWJsZSkgJiZcbiAgICAgICAgICAgICAgYXV0b1N0YXJ0LnZhbGlkYXRlQWN0aW9uKGFjdGlvbiwgaW50ZXJhY3RhYmxlLCBlbGVtZW50LCBldmVudFRhcmdldCwgc2NvcGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaW50ZXJhY3RhYmxlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGNoZWNrIGFsbCBpbnRlcmFjdGFibGVzXG4gICAgICB3aGlsZSAoaXMuZWxlbWVudChlbGVtZW50KSkge1xuICAgICAgICBjb25zdCBpbnRlcmFjdGFibGUgPSBzY29wZS5pbnRlcmFjdGFibGVzLmZvckVhY2hNYXRjaChlbGVtZW50LCBnZXREcmFnZ2FibGUpXG5cbiAgICAgICAgaWYgKGludGVyYWN0YWJsZSkge1xuICAgICAgICAgIGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgPSBBY3Rpb25OYW1lLkRyYWdcbiAgICAgICAgICBpbnRlcmFjdGlvbi50YXJnZXQgPSBpbnRlcmFjdGFibGVcbiAgICAgICAgICBpbnRlcmFjdGlvbi5lbGVtZW50ID0gZWxlbWVudFxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50ID0gcGFyZW50Tm9kZShlbGVtZW50KVxuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICBmdW5jdGlvbiBjaGVja1N0YXJ0QXhpcyAoc3RhcnRBeGlzLCBpbnRlcmFjdGFibGUpIHtcbiAgICBpZiAoIWludGVyYWN0YWJsZSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gICAgY29uc3QgdGhpc0F4aXMgPSBpbnRlcmFjdGFibGUub3B0aW9ucy5kcmFnLnN0YXJ0QXhpc1xuXG4gICAgcmV0dXJuIChzdGFydEF4aXMgPT09ICd4eScgfHwgdGhpc0F4aXMgPT09ICd4eScgfHwgdGhpc0F4aXMgPT09IHN0YXJ0QXhpcylcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7IGluc3RhbGwgfVxuIl19