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
        const targetOptions = interaction.interactable.options.drag;
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
                if (interactable === interaction.interactable) {
                    return;
                }
                const options = interaction.interactable.options.drag;
                if (!options.manualStart &&
                    interactable.testIgnoreAllow(options, element, eventTarget)) {
                    const action = interactable.getAction(interaction.downPointer, interaction.downEvent, interaction, element);
                    if (action &&
                        action.name === ActionName.Drag &&
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
                    interaction.interactable = interactable;
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
        const thisAxis = interactable.options[ActionName.Drag].startAxis;
        return (startAxis === 'xy' || thisAxis === 'xy' || thisAxis === startAxis);
    }
}
export default {
    id: 'auto-start/dragAxis',
    install,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZ0F4aXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkcmFnQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sd0JBQXdCLENBQUE7QUFDbkQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQ3ZELE9BQU8sS0FBSyxFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUFDMUMsT0FBTyxTQUFTLE1BQU0sUUFBUSxDQUFBO0FBSTlCLFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRyxDQUFDLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRTtRQUNuRixJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtZQUFFLE9BQU07U0FBRTtRQUVwRCx5Q0FBeUM7UUFDekMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUN6QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3pCLE1BQU0sYUFBYSxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQTtRQUMzRCxNQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFBO1FBQ3pDLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRWxFLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxRQUFRLEtBQUssT0FBTztZQUM1RCxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBZSxDQUFDLHVEQUF1RDtZQUN0RixDQUFDLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQTtRQUUxQiw2REFBNkQ7UUFDN0QsSUFBSSxXQUFXLEtBQUssSUFBSSxJQUFJLFNBQVMsS0FBSyxJQUFJLElBQUksU0FBUyxLQUFLLFdBQVcsRUFBRTtZQUMzRSw2QkFBNkI7WUFDN0IsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1lBRWhDLGtEQUFrRDtZQUNsRCxJQUFJLE9BQU8sR0FBRyxXQUFXLENBQUE7WUFFekIsTUFBTSxZQUFZLEdBQUcsVUFBVSxZQUFZO2dCQUN6QyxJQUFJLFlBQVksS0FBSyxXQUFXLENBQUMsWUFBWSxFQUFFO29CQUFFLE9BQU07aUJBQUU7Z0JBRXpELE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQTtnQkFFckQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXO29CQUNwQixZQUFZLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLEVBQUU7b0JBQy9ELE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQ25DLFdBQVcsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUE7b0JBRXZFLElBQUksTUFBTTt3QkFDTixNQUFNLENBQUMsSUFBSSxLQUFLLFVBQVUsQ0FBQyxJQUFJO3dCQUMvQixjQUFjLENBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQzt3QkFDekMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLEVBQUU7d0JBQy9FLE9BQU8sWUFBWSxDQUFBO3FCQUNwQjtpQkFDRjtZQUNILENBQUMsQ0FBQTtZQUVELDBCQUEwQjtZQUMxQixPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQzFCLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQTtnQkFFNUUsSUFBSSxZQUFZLEVBQUU7b0JBQ2hCLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUE7b0JBQzNDLFdBQVcsQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFBO29CQUN2QyxXQUFXLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtvQkFDN0IsTUFBSztpQkFDTjtnQkFFRCxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFBO2FBQzlCO1NBQ0Y7SUFDSCxDQUFDLENBQUMsQ0FBQTtJQUVGLFNBQVMsY0FBYyxDQUFFLFNBQVMsRUFBRSxZQUFZO1FBQzlDLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFBRSxPQUFPLEtBQUssQ0FBQTtTQUFFO1FBRW5DLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQTtRQUVoRSxPQUFPLENBQUMsU0FBUyxLQUFLLElBQUksSUFBSSxRQUFRLEtBQUssSUFBSSxJQUFJLFFBQVEsS0FBSyxTQUFTLENBQUMsQ0FBQTtJQUM1RSxDQUFDO0FBQ0gsQ0FBQztBQUVELGVBQWU7SUFDYixFQUFFLEVBQUUscUJBQXFCO0lBQ3pCLE9BQU87Q0FDUixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWN0aW9uTmFtZSB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnXG5pbXBvcnQgeyBwYXJlbnROb2RlIH0gZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZG9tVXRpbHMnXG5pbXBvcnQgKiBhcyBpcyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9pcydcbmltcG9ydCBhdXRvU3RhcnQgZnJvbSAnLi9iYXNlJ1xuXG50eXBlIFNjb3BlID0gaW1wb3J0ICgnQGludGVyYWN0anMvY29yZS9zY29wZScpLlNjb3BlXG5cbmZ1bmN0aW9uIGluc3RhbGwgKHNjb3BlOiBTY29wZSkge1xuICBzY29wZS5hdXRvU3RhcnQuc2lnbmFscy5vbignYmVmb3JlLXN0YXJ0JywgICh7IGludGVyYWN0aW9uLCBldmVudFRhcmdldCwgZHgsIGR5IH0pID0+IHtcbiAgICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ2RyYWcnKSB7IHJldHVybiB9XG5cbiAgICAvLyBjaGVjayBpZiBhIGRyYWcgaXMgaW4gdGhlIGNvcnJlY3QgYXhpc1xuICAgIGNvbnN0IGFic1ggPSBNYXRoLmFicyhkeClcbiAgICBjb25zdCBhYnNZID0gTWF0aC5hYnMoZHkpXG4gICAgY29uc3QgdGFyZ2V0T3B0aW9ucyA9IGludGVyYWN0aW9uLmludGVyYWN0YWJsZS5vcHRpb25zLmRyYWdcbiAgICBjb25zdCBzdGFydEF4aXMgPSB0YXJnZXRPcHRpb25zLnN0YXJ0QXhpc1xuICAgIGNvbnN0IGN1cnJlbnRBeGlzID0gKGFic1ggPiBhYnNZID8gJ3gnIDogYWJzWCA8IGFic1kgPyAneScgOiAneHknKVxuXG4gICAgaW50ZXJhY3Rpb24ucHJlcGFyZWQuYXhpcyA9IHRhcmdldE9wdGlvbnMubG9ja0F4aXMgPT09ICdzdGFydCdcbiAgICAgID8gY3VycmVudEF4aXNbMF0gIGFzICd4JyB8ICd5JyAvLyBhbHdheXMgbG9jayB0byBvbmUgYXhpcyBldmVuIGlmIGN1cnJlbnRBeGlzID09PSAneHknXG4gICAgICA6IHRhcmdldE9wdGlvbnMubG9ja0F4aXNcblxuICAgIC8vIGlmIHRoZSBtb3ZlbWVudCBpc24ndCBpbiB0aGUgc3RhcnRBeGlzIG9mIHRoZSBpbnRlcmFjdGFibGVcbiAgICBpZiAoY3VycmVudEF4aXMgIT09ICd4eScgJiYgc3RhcnRBeGlzICE9PSAneHknICYmIHN0YXJ0QXhpcyAhPT0gY3VycmVudEF4aXMpIHtcbiAgICAgIC8vIGNhbmNlbCB0aGUgcHJlcGFyZWQgYWN0aW9uXG4gICAgICBpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lID0gbnVsbFxuXG4gICAgICAvLyB0aGVuIHRyeSB0byBnZXQgYSBkcmFnIGZyb20gYW5vdGhlciBpbmVyYWN0YWJsZVxuICAgICAgbGV0IGVsZW1lbnQgPSBldmVudFRhcmdldFxuXG4gICAgICBjb25zdCBnZXREcmFnZ2FibGUgPSBmdW5jdGlvbiAoaW50ZXJhY3RhYmxlKSB7XG4gICAgICAgIGlmIChpbnRlcmFjdGFibGUgPT09IGludGVyYWN0aW9uLmludGVyYWN0YWJsZSkgeyByZXR1cm4gfVxuXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBpbnRlcmFjdGlvbi5pbnRlcmFjdGFibGUub3B0aW9ucy5kcmFnXG5cbiAgICAgICAgaWYgKCFvcHRpb25zLm1hbnVhbFN0YXJ0ICYmXG4gICAgICAgICAgICBpbnRlcmFjdGFibGUudGVzdElnbm9yZUFsbG93KG9wdGlvbnMsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0KSkge1xuICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IGludGVyYWN0YWJsZS5nZXRBY3Rpb24oXG4gICAgICAgICAgICBpbnRlcmFjdGlvbi5kb3duUG9pbnRlciwgaW50ZXJhY3Rpb24uZG93bkV2ZW50LCBpbnRlcmFjdGlvbiwgZWxlbWVudClcblxuICAgICAgICAgIGlmIChhY3Rpb24gJiZcbiAgICAgICAgICAgICAgYWN0aW9uLm5hbWUgPT09IEFjdGlvbk5hbWUuRHJhZyAmJlxuICAgICAgICAgICAgICBjaGVja1N0YXJ0QXhpcyhjdXJyZW50QXhpcywgaW50ZXJhY3RhYmxlKSAmJlxuICAgICAgICAgICAgICBhdXRvU3RhcnQudmFsaWRhdGVBY3Rpb24oYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0LCBzY29wZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdGFibGVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gY2hlY2sgYWxsIGludGVyYWN0YWJsZXNcbiAgICAgIHdoaWxlIChpcy5lbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgICAgIGNvbnN0IGludGVyYWN0YWJsZSA9IHNjb3BlLmludGVyYWN0YWJsZXMuZm9yRWFjaE1hdGNoKGVsZW1lbnQsIGdldERyYWdnYWJsZSlcblxuICAgICAgICBpZiAoaW50ZXJhY3RhYmxlKSB7XG4gICAgICAgICAgaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSA9IEFjdGlvbk5hbWUuRHJhZ1xuICAgICAgICAgIGludGVyYWN0aW9uLmludGVyYWN0YWJsZSA9IGludGVyYWN0YWJsZVxuICAgICAgICAgIGludGVyYWN0aW9uLmVsZW1lbnQgPSBlbGVtZW50XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQgPSBwYXJlbnROb2RlKGVsZW1lbnQpXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIGZ1bmN0aW9uIGNoZWNrU3RhcnRBeGlzIChzdGFydEF4aXMsIGludGVyYWN0YWJsZSkge1xuICAgIGlmICghaW50ZXJhY3RhYmxlKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgICBjb25zdCB0aGlzQXhpcyA9IGludGVyYWN0YWJsZS5vcHRpb25zW0FjdGlvbk5hbWUuRHJhZ10uc3RhcnRBeGlzXG5cbiAgICByZXR1cm4gKHN0YXJ0QXhpcyA9PT0gJ3h5JyB8fCB0aGlzQXhpcyA9PT0gJ3h5JyB8fCB0aGlzQXhpcyA9PT0gc3RhcnRBeGlzKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgaWQ6ICdhdXRvLXN0YXJ0L2RyYWdBeGlzJyxcbiAgaW5zdGFsbCxcbn1cbiJdfQ==