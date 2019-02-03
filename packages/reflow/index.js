import { newInteraction } from '@interactjs/core/interactions';
import { arr, extend, is, pointer as pointerUtils, rect as rectUtils, win } from '@interactjs/utils';
export function install(scope) {
    const { actions, interactions, 
    /** @lends Interactable */
    Interactable, } = scope;
    // add action reflow event types
    for (const actionName of actions.names) {
        actions.eventTypes.push(`${actionName}reflow`);
    }
    // remove completed reflow interactions
    interactions.signals.on('stop', ({ interaction }) => {
        if (interaction.pointerType === 'reflow') {
            interaction._reflowResolve();
            arr.remove(scope.interactions.list, interaction);
        }
    });
    /**
     * ```js
     * const interactable = interact(target);
     * const drag = { name: drag, axis: 'x' };
     * const resize = { name: resize, edges: { left: true, bottom: true };
     *
     * interactable.reflow(drag);
     * interactable.reflow(resize);
     * ```
     *
     * Start an action sequence to re-apply modifiers, check drops, etc.
     *
     * @param { Object } action The action to begin
     * @param { string } action.name The name of the action
     * @returns { Promise<Interactable> }
     */
    Interactable.prototype.reflow = function (action) {
        return reflow(this, action, scope);
    };
}
function reflow(interactable, action, scope) {
    const elements = is.string(interactable.target)
        ? arr.from(interactable._context.querySelectorAll(interactable.target))
        : [interactable.target];
    // tslint:disable-next-line variable-name
    const Promise = win.window.Promise;
    const promises = Promise ? [] : null;
    for (const element of elements) {
        const rect = interactable.getRect(element);
        if (!rect) {
            break;
        }
        const runningInteraction = arr.find(scope.interactions.list, (interaction) => {
            return interaction.interacting() &&
                interaction.target === interactable &&
                interaction.element === element &&
                interaction.prepared.name === action.name;
        });
        let reflowPromise;
        if (runningInteraction) {
            runningInteraction.move();
            reflowPromise = runningInteraction._reflowPromise || new Promise((resolve) => {
                runningInteraction._reflowResolve = resolve;
            });
        }
        else {
            const xywh = rectUtils.tlbrToXywh(rect);
            const coords = {
                page: { x: xywh.x, y: xywh.y },
                client: { x: xywh.x, y: xywh.y },
                timeStamp: Date.now(),
            };
            const event = pointerUtils.coordsToEvent(coords);
            reflowPromise = startReflow(scope, interactable, element, action, event);
        }
        if (promises) {
            promises.push(reflowPromise);
        }
    }
    return promises && Promise.all(promises).then(() => interactable);
}
function startReflow(scope, interactable, element, action, event) {
    const interaction = newInteraction({ pointerType: 'reflow' }, scope);
    const signalArg = {
        interaction,
        event,
        pointer: event,
        eventTarget: element,
        phase: 'reflow',
    };
    interaction.target = interactable;
    interaction.element = element;
    interaction.prepared = extend({}, action);
    interaction.prevEvent = event;
    interaction.updatePointer(event, event, element, true);
    interaction._doPhase(signalArg);
    const reflowPromise = win.window.Promise
        ? new win.window.Promise((resolve) => {
            interaction._reflowResolve = resolve;
        })
        : null;
    interaction._reflowPromise = reflowPromise;
    interaction.start(action, interactable, element);
    if (interaction._interacting) {
        interaction.move(signalArg);
        interaction.end(event);
    }
    else {
        interaction.stop();
    }
    interaction.removePointer(event, event);
    interaction.pointerIsDown = false;
    return reflowPromise;
}
export default { install };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sK0JBQStCLENBQUE7QUFFOUQsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE9BQU8sSUFBSSxZQUFZLEVBQUUsSUFBSSxJQUFJLFNBQVMsRUFBRSxHQUFHLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQVNwRyxNQUFNLFVBQVUsT0FBTyxDQUFFLEtBQVk7SUFDbkMsTUFBTSxFQUNKLE9BQU8sRUFDUCxZQUFZO0lBQ1osMEJBQTBCO0lBQzFCLFlBQVksR0FDYixHQUFHLEtBQUssQ0FBQTtJQUVULGdDQUFnQztJQUNoQyxLQUFLLE1BQU0sVUFBVSxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUU7UUFDdEMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLFFBQVEsQ0FBQyxDQUFBO0tBQy9DO0lBRUQsdUNBQXVDO0lBQ3ZDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRTtRQUNsRCxJQUFJLFdBQVcsQ0FBQyxXQUFXLEtBQUssUUFBUSxFQUFFO1lBQ3hDLFdBQVcsQ0FBQyxjQUFjLEVBQUUsQ0FBQTtZQUM1QixHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFBO1NBQ2pEO0lBQ0gsQ0FBQyxDQUFDLENBQUE7SUFFRjs7Ozs7Ozs7Ozs7Ozs7O09BZUc7SUFDSCxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxVQUFVLE1BQU07UUFDOUMsT0FBTyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUNwQyxDQUFDLENBQUE7QUFDSCxDQUFDO0FBRUQsU0FBUyxNQUFN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QUM7QUFFRCxlQUFlLEVBQUUsT0FBTyxFQUFFLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBY3Rpb24sIEludGVyYWN0aW9uIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbidcbmltcG9ydCB7IG5ld0ludGVyYWN0aW9uIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9pbnRlcmFjdGlvbnMnXG5pbXBvcnQgeyBTY29wZSB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnXG5pbXBvcnQgeyBhcnIsIGV4dGVuZCwgaXMsIHBvaW50ZXIgYXMgcG9pbnRlclV0aWxzLCByZWN0IGFzIHJlY3RVdGlscywgd2luIH0gZnJvbSAnQGludGVyYWN0anMvdXRpbHMnXG50eXBlIEludGVyYWN0YWJsZSA9IGltcG9ydCAoJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3RhYmxlJykuZGVmYXVsdFxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGFibGUnIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0YWJsZSB7XG4gICAgcmVmbG93OiAoYWN0aW9uOiBBY3Rpb24pID0+IFJldHVyblR5cGU8dHlwZW9mIHJlZmxvdz5cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFsbCAoc2NvcGU6IFNjb3BlKSB7XG4gIGNvbnN0IHtcbiAgICBhY3Rpb25zLFxuICAgIGludGVyYWN0aW9ucyxcbiAgICAvKiogQGxlbmRzIEludGVyYWN0YWJsZSAqL1xuICAgIEludGVyYWN0YWJsZSxcbiAgfSA9IHNjb3BlXG5cbiAgLy8gYWRkIGFjdGlvbiByZWZsb3cgZXZlbnQgdHlwZXNcbiAgZm9yIChjb25zdCBhY3Rpb25OYW1lIG9mIGFjdGlvbnMubmFtZXMpIHtcbiAgICBhY3Rpb25zLmV2ZW50VHlwZXMucHVzaChgJHthY3Rpb25OYW1lfXJlZmxvd2ApXG4gIH1cblxuICAvLyByZW1vdmUgY29tcGxldGVkIHJlZmxvdyBpbnRlcmFjdGlvbnNcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ3N0b3AnLCAoeyBpbnRlcmFjdGlvbiB9KSA9PiB7XG4gICAgaWYgKGludGVyYWN0aW9uLnBvaW50ZXJUeXBlID09PSAncmVmbG93Jykge1xuICAgICAgaW50ZXJhY3Rpb24uX3JlZmxvd1Jlc29sdmUoKVxuICAgICAgYXJyLnJlbW92ZShzY29wZS5pbnRlcmFjdGlvbnMubGlzdCwgaW50ZXJhY3Rpb24pXG4gICAgfVxuICB9KVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBjb25zdCBpbnRlcmFjdGFibGUgPSBpbnRlcmFjdCh0YXJnZXQpO1xuICAgKiBjb25zdCBkcmFnID0geyBuYW1lOiBkcmFnLCBheGlzOiAneCcgfTtcbiAgICogY29uc3QgcmVzaXplID0geyBuYW1lOiByZXNpemUsIGVkZ2VzOiB7IGxlZnQ6IHRydWUsIGJvdHRvbTogdHJ1ZSB9O1xuICAgKlxuICAgKiBpbnRlcmFjdGFibGUucmVmbG93KGRyYWcpO1xuICAgKiBpbnRlcmFjdGFibGUucmVmbG93KHJlc2l6ZSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBTdGFydCBhbiBhY3Rpb24gc2VxdWVuY2UgdG8gcmUtYXBwbHkgbW9kaWZpZXJzLCBjaGVjayBkcm9wcywgZXRjLlxuICAgKlxuICAgKiBAcGFyYW0geyBPYmplY3QgfSBhY3Rpb24gVGhlIGFjdGlvbiB0byBiZWdpblxuICAgKiBAcGFyYW0geyBzdHJpbmcgfSBhY3Rpb24ubmFtZSBUaGUgbmFtZSBvZiB0aGUgYWN0aW9uXG4gICAqIEByZXR1cm5zIHsgUHJvbWlzZTxJbnRlcmFjdGFibGU+IH1cbiAgICovXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUucmVmbG93ID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgIHJldHVybiByZWZsb3codGhpcywgYWN0aW9uLCBzY29wZSlcbiAgfVxufVxuXG5mdW5jdGlvbiByZWZsb3cgKGludGVyYWN0YWJsZTogSW50ZXJhY3RhYmxlLCBhY3Rpb246IEFjdGlvbiwgc2NvcGU6IFNjb3BlKSB7XG4gIGNvbnN0IGVsZW1lbnRzID0gaXMuc3RyaW5nKGludGVyYWN0YWJsZS50YXJnZXQpXG4gICAgPyBhcnIuZnJvbShpbnRlcmFjdGFibGUuX2NvbnRleHQucXVlcnlTZWxlY3RvckFsbChpbnRlcmFjdGFibGUudGFyZ2V0KSlcbiAgICA6IFtpbnRlcmFjdGFibGUudGFyZ2V0XVxuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZSB2YXJpYWJsZS1uYW1lXG4gIGNvbnN0IFByb21pc2UgPSAod2luLndpbmRvdyBhcyBhbnkpLlByb21pc2VcbiAgY29uc3QgcHJvbWlzZXM6IEFycmF5PFByb21pc2U8bnVsbD4+IHwgbnVsbCA9IFByb21pc2UgPyBbXSA6IG51bGxcblxuICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZWxlbWVudHMpIHtcbiAgICBjb25zdCByZWN0ID0gaW50ZXJhY3RhYmxlLmdldFJlY3QoZWxlbWVudClcblxuICAgIGlmICghcmVjdCkgeyBicmVhayB9XG5cbiAgICBjb25zdCBydW5uaW5nSW50ZXJhY3Rpb24gPSBhcnIuZmluZChcbiAgICAgIHNjb3BlLmludGVyYWN0aW9ucy5saXN0LFxuICAgICAgKGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbikgPT4ge1xuICAgICAgICByZXR1cm4gaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKSAmJlxuICAgICAgICAgIGludGVyYWN0aW9uLnRhcmdldCA9PT0gaW50ZXJhY3RhYmxlICYmXG4gICAgICAgICAgaW50ZXJhY3Rpb24uZWxlbWVudCA9PT0gZWxlbWVudCAmJlxuICAgICAgICAgIGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgPT09IGFjdGlvbi5uYW1lXG4gICAgICB9KVxuICAgIGxldCByZWZsb3dQcm9taXNlOiBQcm9taXNlPG51bGw+XG5cbiAgICBpZiAocnVubmluZ0ludGVyYWN0aW9uKSB7XG4gICAgICBydW5uaW5nSW50ZXJhY3Rpb24ubW92ZSgpXG5cbiAgICAgIHJlZmxvd1Byb21pc2UgPSBydW5uaW5nSW50ZXJhY3Rpb24uX3JlZmxvd1Byb21pc2UgfHwgbmV3IFByb21pc2UoKHJlc29sdmU6IGFueSkgPT4ge1xuICAgICAgICBydW5uaW5nSW50ZXJhY3Rpb24uX3JlZmxvd1Jlc29sdmUgPSByZXNvbHZlXG4gICAgICB9KVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnN0IHh5d2ggPSByZWN0VXRpbHMudGxiclRvWHl3aChyZWN0KVxuICAgICAgY29uc3QgY29vcmRzID0ge1xuICAgICAgICBwYWdlICAgICA6IHsgeDogeHl3aC54LCB5OiB4eXdoLnkgfSxcbiAgICAgICAgY2xpZW50ICAgOiB7IHg6IHh5d2gueCwgeTogeHl3aC55IH0sXG4gICAgICAgIHRpbWVTdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgZXZlbnQgPSBwb2ludGVyVXRpbHMuY29vcmRzVG9FdmVudChjb29yZHMpXG4gICAgICByZWZsb3dQcm9taXNlID0gc3RhcnRSZWZsb3coc2NvcGUsIGludGVyYWN0YWJsZSwgZWxlbWVudCwgYWN0aW9uLCBldmVudClcbiAgICB9XG5cbiAgICBpZiAocHJvbWlzZXMpIHtcbiAgICAgIHByb21pc2VzLnB1c2gocmVmbG93UHJvbWlzZSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcHJvbWlzZXMgJiYgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4gaW50ZXJhY3RhYmxlKVxufVxuXG5mdW5jdGlvbiBzdGFydFJlZmxvdyAoc2NvcGU6IFNjb3BlLCBpbnRlcmFjdGFibGU6IEludGVyYWN0YWJsZSwgZWxlbWVudDogRWxlbWVudCwgYWN0aW9uOiBBY3Rpb24sIGV2ZW50OiBhbnkpIHtcbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBuZXdJbnRlcmFjdGlvbih7IHBvaW50ZXJUeXBlOiAncmVmbG93JyB9LCBzY29wZSlcbiAgY29uc3Qgc2lnbmFsQXJnID0ge1xuICAgIGludGVyYWN0aW9uLFxuICAgIGV2ZW50LFxuICAgIHBvaW50ZXI6IGV2ZW50LFxuICAgIGV2ZW50VGFyZ2V0OiBlbGVtZW50LFxuICAgIHBoYXNlOiAncmVmbG93JyxcbiAgfVxuXG4gIGludGVyYWN0aW9uLnRhcmdldCA9IGludGVyYWN0YWJsZVxuICBpbnRlcmFjdGlvbi5lbGVtZW50ID0gZWxlbWVudFxuICBpbnRlcmFjdGlvbi5wcmVwYXJlZCA9IGV4dGVuZCh7fSwgYWN0aW9uKVxuICBpbnRlcmFjdGlvbi5wcmV2RXZlbnQgPSBldmVudFxuICBpbnRlcmFjdGlvbi51cGRhdGVQb2ludGVyKGV2ZW50LCBldmVudCwgZWxlbWVudCwgdHJ1ZSlcblxuICBpbnRlcmFjdGlvbi5fZG9QaGFzZShzaWduYWxBcmcpXG5cbiAgY29uc3QgcmVmbG93UHJvbWlzZSA9ICh3aW4ud2luZG93IGFzIHVua25vd24gYXMgYW55KS5Qcm9taXNlXG4gICAgPyBuZXcgKHdpbi53aW5kb3cgYXMgdW5rbm93biBhcyBhbnkpLlByb21pc2UoKHJlc29sdmU6IGFueSkgPT4ge1xuICAgICAgaW50ZXJhY3Rpb24uX3JlZmxvd1Jlc29sdmUgPSByZXNvbHZlXG4gICAgfSlcbiAgICA6IG51bGxcblxuICBpbnRlcmFjdGlvbi5fcmVmbG93UHJvbWlzZSA9IHJlZmxvd1Byb21pc2VcbiAgaW50ZXJhY3Rpb24uc3RhcnQoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpXG5cbiAgaWYgKGludGVyYWN0aW9uLl9pbnRlcmFjdGluZykge1xuICAgIGludGVyYWN0aW9uLm1vdmUoc2lnbmFsQXJnKVxuICAgIGludGVyYWN0aW9uLmVuZChldmVudClcbiAgfVxuICBlbHNlIHtcbiAgICBpbnRlcmFjdGlvbi5zdG9wKClcbiAgfVxuXG4gIGludGVyYWN0aW9uLnJlbW92ZVBvaW50ZXIoZXZlbnQsIGV2ZW50KVxuICBpbnRlcmFjdGlvbi5wb2ludGVySXNEb3duID0gZmFsc2VcblxuICByZXR1cm4gcmVmbG93UHJvbWlzZVxufVxuXG5leHBvcnQgZGVmYXVsdCB7IGluc3RhbGwgfVxuIl19