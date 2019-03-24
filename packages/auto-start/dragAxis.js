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
        const thisAxis = interactable.options.drag.startAxis;
        return (startAxis === 'xy' || thisAxis === 'xy' || thisAxis === startAxis);
    }
}
export default {
    id: 'auto-start/dragAxis',
    install,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZ0F4aXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkcmFnQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sd0JBQXdCLENBQUE7QUFDbkQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQ3ZELE9BQU8sS0FBSyxFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUFDMUMsT0FBTyxTQUFTLE1BQU0sUUFBUSxDQUFBO0FBSTlCLFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRyxDQUFDLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRTtRQUNuRixJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtZQUFFLE9BQU07U0FBRTtRQUVwRCx5Q0FBeUM7UUFDekMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUN6QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3pCLE1BQU0sYUFBYSxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQTtRQUMzRCxNQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFBO1FBQ3pDLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRWxFLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxRQUFRLEtBQUssT0FBTztZQUM1RCxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBZSxDQUFDLHVEQUF1RDtZQUN0RixDQUFDLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQTtRQUUxQiw2REFBNkQ7UUFDN0QsSUFBSSxXQUFXLEtBQUssSUFBSSxJQUFJLFNBQVMsS0FBSyxJQUFJLElBQUksU0FBUyxLQUFLLFdBQVcsRUFBRTtZQUMzRSw2QkFBNkI7WUFDN0IsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1lBRWhDLGtEQUFrRDtZQUNsRCxJQUFJLE9BQU8sR0FBRyxXQUFXLENBQUE7WUFFekIsTUFBTSxZQUFZLEdBQUcsVUFBVSxZQUFZO2dCQUN6QyxJQUFJLFlBQVksS0FBSyxXQUFXLENBQUMsWUFBWSxFQUFFO29CQUFFLE9BQU07aUJBQUU7Z0JBRXpELE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQTtnQkFFckQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXO29CQUNwQixZQUFZLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLEVBQUU7b0JBQy9ELE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQ25DLFdBQVcsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUE7b0JBRXZFLElBQUksTUFBTTt3QkFDTixNQUFNLENBQUMsSUFBSSxLQUFLLE1BQU07d0JBQ3RCLGNBQWMsQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDO3dCQUN6QyxTQUFTLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsRUFBRTt3QkFDL0UsT0FBTyxZQUFZLENBQUE7cUJBQ3BCO2lCQUNGO1lBQ0gsQ0FBQyxDQUFBO1lBRUQsMEJBQTBCO1lBQzFCLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDMUIsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFBO2dCQUU1RSxJQUFJLFlBQVksRUFBRTtvQkFDaEIsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQTtvQkFDM0MsV0FBVyxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUE7b0JBQ3ZDLFdBQVcsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO29CQUM3QixNQUFLO2lCQUNOO2dCQUVELE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUE7YUFDOUI7U0FDRjtJQUNILENBQUMsQ0FBQyxDQUFBO0lBRUYsU0FBUyxjQUFjLENBQUUsU0FBUyxFQUFFLFlBQVk7UUFDOUMsSUFBSSxDQUFDLFlBQVksRUFBRTtZQUFFLE9BQU8sS0FBSyxDQUFBO1NBQUU7UUFFbkMsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFBO1FBRXBELE9BQU8sQ0FBQyxTQUFTLEtBQUssSUFBSSxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksUUFBUSxLQUFLLFNBQVMsQ0FBQyxDQUFBO0lBQzVFLENBQUM7QUFDSCxDQUFDO0FBRUQsZUFBZTtJQUNiLEVBQUUsRUFBRSxxQkFBcUI7SUFDekIsT0FBTztDQUNSLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBY3Rpb25OYW1lIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9zY29wZSdcbmltcG9ydCB7IHBhcmVudE5vZGUgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9kb21VdGlscydcbmltcG9ydCAqIGFzIGlzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2lzJ1xuaW1wb3J0IGF1dG9TdGFydCBmcm9tICcuL2Jhc2UnXG5cbnR5cGUgU2NvcGUgPSBpbXBvcnQgKCdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJykuU2NvcGVcblxuZnVuY3Rpb24gaW5zdGFsbCAoc2NvcGU6IFNjb3BlKSB7XG4gIHNjb3BlLmF1dG9TdGFydC5zaWduYWxzLm9uKCdiZWZvcmUtc3RhcnQnLCAgKHsgaW50ZXJhY3Rpb24sIGV2ZW50VGFyZ2V0LCBkeCwgZHkgfSkgPT4ge1xuICAgIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAnZHJhZycpIHsgcmV0dXJuIH1cblxuICAgIC8vIGNoZWNrIGlmIGEgZHJhZyBpcyBpbiB0aGUgY29ycmVjdCBheGlzXG4gICAgY29uc3QgYWJzWCA9IE1hdGguYWJzKGR4KVxuICAgIGNvbnN0IGFic1kgPSBNYXRoLmFicyhkeSlcbiAgICBjb25zdCB0YXJnZXRPcHRpb25zID0gaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJhZ1xuICAgIGNvbnN0IHN0YXJ0QXhpcyA9IHRhcmdldE9wdGlvbnMuc3RhcnRBeGlzXG4gICAgY29uc3QgY3VycmVudEF4aXMgPSAoYWJzWCA+IGFic1kgPyAneCcgOiBhYnNYIDwgYWJzWSA/ICd5JyA6ICd4eScpXG5cbiAgICBpbnRlcmFjdGlvbi5wcmVwYXJlZC5heGlzID0gdGFyZ2V0T3B0aW9ucy5sb2NrQXhpcyA9PT0gJ3N0YXJ0J1xuICAgICAgPyBjdXJyZW50QXhpc1swXSAgYXMgJ3gnIHwgJ3knIC8vIGFsd2F5cyBsb2NrIHRvIG9uZSBheGlzIGV2ZW4gaWYgY3VycmVudEF4aXMgPT09ICd4eSdcbiAgICAgIDogdGFyZ2V0T3B0aW9ucy5sb2NrQXhpc1xuXG4gICAgLy8gaWYgdGhlIG1vdmVtZW50IGlzbid0IGluIHRoZSBzdGFydEF4aXMgb2YgdGhlIGludGVyYWN0YWJsZVxuICAgIGlmIChjdXJyZW50QXhpcyAhPT0gJ3h5JyAmJiBzdGFydEF4aXMgIT09ICd4eScgJiYgc3RhcnRBeGlzICE9PSBjdXJyZW50QXhpcykge1xuICAgICAgLy8gY2FuY2VsIHRoZSBwcmVwYXJlZCBhY3Rpb25cbiAgICAgIGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgPSBudWxsXG5cbiAgICAgIC8vIHRoZW4gdHJ5IHRvIGdldCBhIGRyYWcgZnJvbSBhbm90aGVyIGluZXJhY3RhYmxlXG4gICAgICBsZXQgZWxlbWVudCA9IGV2ZW50VGFyZ2V0XG5cbiAgICAgIGNvbnN0IGdldERyYWdnYWJsZSA9IGZ1bmN0aW9uIChpbnRlcmFjdGFibGUpIHtcbiAgICAgICAgaWYgKGludGVyYWN0YWJsZSA9PT0gaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlKSB7IHJldHVybiB9XG5cbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGludGVyYWN0aW9uLmludGVyYWN0YWJsZS5vcHRpb25zLmRyYWdcblxuICAgICAgICBpZiAoIW9wdGlvbnMubWFudWFsU3RhcnQgJiZcbiAgICAgICAgICAgIGludGVyYWN0YWJsZS50ZXN0SWdub3JlQWxsb3cob3B0aW9ucywgZWxlbWVudCwgZXZlbnRUYXJnZXQpKSB7XG4gICAgICAgICAgY29uc3QgYWN0aW9uID0gaW50ZXJhY3RhYmxlLmdldEFjdGlvbihcbiAgICAgICAgICAgIGludGVyYWN0aW9uLmRvd25Qb2ludGVyLCBpbnRlcmFjdGlvbi5kb3duRXZlbnQsIGludGVyYWN0aW9uLCBlbGVtZW50KVxuXG4gICAgICAgICAgaWYgKGFjdGlvbiAmJlxuICAgICAgICAgICAgICBhY3Rpb24ubmFtZSA9PT0gJ2RyYWcnICYmXG4gICAgICAgICAgICAgIGNoZWNrU3RhcnRBeGlzKGN1cnJlbnRBeGlzLCBpbnRlcmFjdGFibGUpICYmXG4gICAgICAgICAgICAgIGF1dG9TdGFydC52YWxpZGF0ZUFjdGlvbihhY3Rpb24sIGludGVyYWN0YWJsZSwgZWxlbWVudCwgZXZlbnRUYXJnZXQsIHNjb3BlKSkge1xuICAgICAgICAgICAgcmV0dXJuIGludGVyYWN0YWJsZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBjaGVjayBhbGwgaW50ZXJhY3RhYmxlc1xuICAgICAgd2hpbGUgKGlzLmVsZW1lbnQoZWxlbWVudCkpIHtcbiAgICAgICAgY29uc3QgaW50ZXJhY3RhYmxlID0gc2NvcGUuaW50ZXJhY3RhYmxlcy5mb3JFYWNoTWF0Y2goZWxlbWVudCwgZ2V0RHJhZ2dhYmxlKVxuXG4gICAgICAgIGlmIChpbnRlcmFjdGFibGUpIHtcbiAgICAgICAgICBpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lID0gQWN0aW9uTmFtZS5EcmFnXG4gICAgICAgICAgaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlID0gaW50ZXJhY3RhYmxlXG4gICAgICAgICAgaW50ZXJhY3Rpb24uZWxlbWVudCA9IGVsZW1lbnRcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbWVudCA9IHBhcmVudE5vZGUoZWxlbWVudClcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgZnVuY3Rpb24gY2hlY2tTdGFydEF4aXMgKHN0YXJ0QXhpcywgaW50ZXJhY3RhYmxlKSB7XG4gICAgaWYgKCFpbnRlcmFjdGFibGUpIHsgcmV0dXJuIGZhbHNlIH1cblxuICAgIGNvbnN0IHRoaXNBeGlzID0gaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJhZy5zdGFydEF4aXNcblxuICAgIHJldHVybiAoc3RhcnRBeGlzID09PSAneHknIHx8IHRoaXNBeGlzID09PSAneHknIHx8IHRoaXNBeGlzID09PSBzdGFydEF4aXMpXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBpZDogJ2F1dG8tc3RhcnQvZHJhZ0F4aXMnLFxuICBpbnN0YWxsLFxufVxuIl19