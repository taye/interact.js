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
                    interaction.prepared.name = 'drag';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZ0F4aXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkcmFnQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sNEJBQTRCLENBQUE7QUFDdkQsT0FBTyxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUMxQyxPQUFPLFNBQVMsTUFBTSxRQUFRLENBQUE7QUFJOUIsU0FBUyxPQUFPLENBQUUsS0FBWTtJQUM1QixLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFHLENBQUMsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO1FBQ25GLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO1lBQUUsT0FBTTtTQUFFO1FBRXBELHlDQUF5QztRQUN6QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3pCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDekIsTUFBTSxhQUFhLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFBO1FBQ3JELE1BQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUE7UUFDekMsTUFBTSxXQUFXLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFbEUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsYUFBYSxDQUFDLFFBQVEsS0FBSyxPQUFPO1lBQzVELENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsdURBQXVEO1lBQ3hFLENBQUMsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFBO1FBRTFCLDZEQUE2RDtRQUM3RCxJQUFJLFdBQVcsS0FBSyxJQUFJLElBQUksU0FBUyxLQUFLLElBQUksSUFBSSxTQUFTLEtBQUssV0FBVyxFQUFFO1lBQzNFLDZCQUE2QjtZQUM3QixXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7WUFFaEMsa0RBQWtEO1lBQ2xELElBQUksT0FBTyxHQUFHLFdBQVcsQ0FBQTtZQUV6QixNQUFNLFlBQVksR0FBRyxVQUFVLFlBQVk7Z0JBQ3pDLElBQUksWUFBWSxLQUFLLFdBQVcsQ0FBQyxNQUFNLEVBQUU7b0JBQUUsT0FBTTtpQkFBRTtnQkFFbkQsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFBO2dCQUUvQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVc7b0JBQ3BCLFlBQVksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsRUFBRTtvQkFDL0QsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLFNBQVMsQ0FDbkMsV0FBVyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQTtvQkFFdkUsSUFBSSxNQUFNO3dCQUNOLE1BQU0sQ0FBQyxJQUFJLEtBQUssTUFBTTt3QkFDdEIsY0FBYyxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUM7d0JBQ3pDLFNBQVMsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxFQUFFO3dCQUMvRSxPQUFPLFlBQVksQ0FBQTtxQkFDcEI7aUJBQ0Y7WUFDSCxDQUFDLENBQUE7WUFFRCwwQkFBMEI7WUFDMUIsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUMxQixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUE7Z0JBRTVFLElBQUksWUFBWSxFQUFFO29CQUNoQixXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUE7b0JBQ2xDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFBO29CQUNqQyxXQUFXLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtvQkFDN0IsTUFBSztpQkFDTjtnQkFFRCxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFBO2FBQzlCO1NBQ0Y7SUFDSCxDQUFDLENBQUMsQ0FBQTtJQUVGLFNBQVMsY0FBYyxDQUFFLFNBQVMsRUFBRSxZQUFZO1FBQzlDLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFBRSxPQUFPLEtBQUssQ0FBQTtTQUFFO1FBRW5DLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQTtRQUVwRCxPQUFPLENBQUMsU0FBUyxLQUFLLElBQUksSUFBSSxRQUFRLEtBQUssSUFBSSxJQUFJLFFBQVEsS0FBSyxTQUFTLENBQUMsQ0FBQTtJQUM1RSxDQUFDO0FBQ0gsQ0FBQztBQUVELGVBQWUsRUFBRSxPQUFPLEVBQUUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHBhcmVudE5vZGUgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9kb21VdGlscydcbmltcG9ydCAqIGFzIGlzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2lzJ1xuaW1wb3J0IGF1dG9TdGFydCBmcm9tICcuL2Jhc2UnXG5cbnR5cGUgU2NvcGUgPSBpbXBvcnQgKCdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJykuU2NvcGVcblxuZnVuY3Rpb24gaW5zdGFsbCAoc2NvcGU6IFNjb3BlKSB7XG4gIHNjb3BlLmF1dG9TdGFydC5zaWduYWxzLm9uKCdiZWZvcmUtc3RhcnQnLCAgKHsgaW50ZXJhY3Rpb24sIGV2ZW50VGFyZ2V0LCBkeCwgZHkgfSkgPT4ge1xuICAgIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAnZHJhZycpIHsgcmV0dXJuIH1cblxuICAgIC8vIGNoZWNrIGlmIGEgZHJhZyBpcyBpbiB0aGUgY29ycmVjdCBheGlzXG4gICAgY29uc3QgYWJzWCA9IE1hdGguYWJzKGR4KVxuICAgIGNvbnN0IGFic1kgPSBNYXRoLmFicyhkeSlcbiAgICBjb25zdCB0YXJnZXRPcHRpb25zID0gaW50ZXJhY3Rpb24udGFyZ2V0Lm9wdGlvbnMuZHJhZ1xuICAgIGNvbnN0IHN0YXJ0QXhpcyA9IHRhcmdldE9wdGlvbnMuc3RhcnRBeGlzXG4gICAgY29uc3QgY3VycmVudEF4aXMgPSAoYWJzWCA+IGFic1kgPyAneCcgOiBhYnNYIDwgYWJzWSA/ICd5JyA6ICd4eScpXG5cbiAgICBpbnRlcmFjdGlvbi5wcmVwYXJlZC5heGlzID0gdGFyZ2V0T3B0aW9ucy5sb2NrQXhpcyA9PT0gJ3N0YXJ0J1xuICAgICAgPyBjdXJyZW50QXhpc1swXSAvLyBhbHdheXMgbG9jayB0byBvbmUgYXhpcyBldmVuIGlmIGN1cnJlbnRBeGlzID09PSAneHknXG4gICAgICA6IHRhcmdldE9wdGlvbnMubG9ja0F4aXNcblxuICAgIC8vIGlmIHRoZSBtb3ZlbWVudCBpc24ndCBpbiB0aGUgc3RhcnRBeGlzIG9mIHRoZSBpbnRlcmFjdGFibGVcbiAgICBpZiAoY3VycmVudEF4aXMgIT09ICd4eScgJiYgc3RhcnRBeGlzICE9PSAneHknICYmIHN0YXJ0QXhpcyAhPT0gY3VycmVudEF4aXMpIHtcbiAgICAgIC8vIGNhbmNlbCB0aGUgcHJlcGFyZWQgYWN0aW9uXG4gICAgICBpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lID0gbnVsbFxuXG4gICAgICAvLyB0aGVuIHRyeSB0byBnZXQgYSBkcmFnIGZyb20gYW5vdGhlciBpbmVyYWN0YWJsZVxuICAgICAgbGV0IGVsZW1lbnQgPSBldmVudFRhcmdldFxuXG4gICAgICBjb25zdCBnZXREcmFnZ2FibGUgPSBmdW5jdGlvbiAoaW50ZXJhY3RhYmxlKSB7XG4gICAgICAgIGlmIChpbnRlcmFjdGFibGUgPT09IGludGVyYWN0aW9uLnRhcmdldCkgeyByZXR1cm4gfVxuXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBpbnRlcmFjdGlvbi50YXJnZXQub3B0aW9ucy5kcmFnXG5cbiAgICAgICAgaWYgKCFvcHRpb25zLm1hbnVhbFN0YXJ0ICYmXG4gICAgICAgICAgICBpbnRlcmFjdGFibGUudGVzdElnbm9yZUFsbG93KG9wdGlvbnMsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0KSkge1xuICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IGludGVyYWN0YWJsZS5nZXRBY3Rpb24oXG4gICAgICAgICAgICBpbnRlcmFjdGlvbi5kb3duUG9pbnRlciwgaW50ZXJhY3Rpb24uZG93bkV2ZW50LCBpbnRlcmFjdGlvbiwgZWxlbWVudClcblxuICAgICAgICAgIGlmIChhY3Rpb24gJiZcbiAgICAgICAgICAgICAgYWN0aW9uLm5hbWUgPT09ICdkcmFnJyAmJlxuICAgICAgICAgICAgICBjaGVja1N0YXJ0QXhpcyhjdXJyZW50QXhpcywgaW50ZXJhY3RhYmxlKSAmJlxuICAgICAgICAgICAgICBhdXRvU3RhcnQudmFsaWRhdGVBY3Rpb24oYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGV2ZW50VGFyZ2V0LCBzY29wZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnRlcmFjdGFibGVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gY2hlY2sgYWxsIGludGVyYWN0YWJsZXNcbiAgICAgIHdoaWxlIChpcy5lbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgICAgIGNvbnN0IGludGVyYWN0YWJsZSA9IHNjb3BlLmludGVyYWN0YWJsZXMuZm9yRWFjaE1hdGNoKGVsZW1lbnQsIGdldERyYWdnYWJsZSlcblxuICAgICAgICBpZiAoaW50ZXJhY3RhYmxlKSB7XG4gICAgICAgICAgaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSA9ICdkcmFnJ1xuICAgICAgICAgIGludGVyYWN0aW9uLnRhcmdldCA9IGludGVyYWN0YWJsZVxuICAgICAgICAgIGludGVyYWN0aW9uLmVsZW1lbnQgPSBlbGVtZW50XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQgPSBwYXJlbnROb2RlKGVsZW1lbnQpXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIGZ1bmN0aW9uIGNoZWNrU3RhcnRBeGlzIChzdGFydEF4aXMsIGludGVyYWN0YWJsZSkge1xuICAgIGlmICghaW50ZXJhY3RhYmxlKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgICBjb25zdCB0aGlzQXhpcyA9IGludGVyYWN0YWJsZS5vcHRpb25zLmRyYWcuc3RhcnRBeGlzXG5cbiAgICByZXR1cm4gKHN0YXJ0QXhpcyA9PT0gJ3h5JyB8fCB0aGlzQXhpcyA9PT0gJ3h5JyB8fCB0aGlzQXhpcyA9PT0gc3RhcnRBeGlzKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHsgaW5zdGFsbCB9XG4iXX0=