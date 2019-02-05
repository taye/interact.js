import { newInteraction } from '@interactjs/core/interactions';
import { arr, extend, is, pointer as pointerUtils, rect as rectUtils, win } from '@interactjs/utils';
export function install(scope) {
    const { actions, interactions, 
    /** @lends Interactable */
    // eslint-disable-next-line no-shadow
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sK0JBQStCLENBQUE7QUFFOUQsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE9BQU8sSUFBSSxZQUFZLEVBQUUsSUFBSSxJQUFJLFNBQVMsRUFBRSxHQUFHLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQWNwRyxNQUFNLFVBQVUsT0FBTyxDQUFFLEtBQVk7SUFDbkMsTUFBTSxFQUNKLE9BQU8sRUFDUCxZQUFZO0lBQ1osMEJBQTBCO0lBQzFCLHFDQUFxQztJQUNyQyxZQUFZLEdBQ2IsR0FBRyxLQUFLLENBQUE7SUFFVCxnQ0FBZ0M7SUFDaEMsS0FBSyxNQUFNLFVBQVUsSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFO1FBQ3RDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxRQUFRLENBQUMsQ0FBQTtLQUMvQztJQUVELHVDQUF1QztJQUN2QyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUU7UUFDbEQsSUFBSSxXQUFXLENBQUMsV0FBVyxLQUFLLFFBQVEsRUFBRTtZQUN4QyxXQUFXLENBQUMsY0FBYyxFQUFFLENBQUE7WUFDNUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQTtTQUNqRDtJQUNILENBQUMsQ0FBQyxDQUFBO0lBRUY7Ozs7Ozs7Ozs7Ozs7OztPQWVHO0lBQ0gsWUFBWSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsVUFBVSxNQUFNO1FBQzlDLE9BQU8sTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDcEMsQ0FBQyxDQUFBO0FBQ0gsQ0FBQztB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Q0FBQTtBQUN0QixDQUFDO0FBRUQsZUFBZSxFQUFFLE9BQU8sRUFBRSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEludGVyYWN0YWJsZSBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0YWJsZSdcbmltcG9ydCB7IEFjdGlvbiwgSW50ZXJhY3Rpb24gfSBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0aW9uJ1xuaW1wb3J0IHsgbmV3SW50ZXJhY3Rpb24gfSBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL2ludGVyYWN0aW9ucydcbmltcG9ydCB7IFNjb3BlIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9zY29wZSdcbmltcG9ydCB7IGFyciwgZXh0ZW5kLCBpcywgcG9pbnRlciBhcyBwb2ludGVyVXRpbHMsIHJlY3QgYXMgcmVjdFV0aWxzLCB3aW4gfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscydcblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3RhYmxlJyB7XG4gIGludGVyZmFjZSBJbnRlcmFjdGFibGUge1xuICAgIHJlZmxvdzogKGFjdGlvbjogQWN0aW9uKSA9PiBSZXR1cm5UeXBlPHR5cGVvZiByZWZsb3c+XG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3Rpb24nIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0aW9uIHtcbiAgICBfcmVmbG93UmVzb2x2ZTogKCkgPT4gdm9pZFxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qge1xuICAgIGFjdGlvbnMsXG4gICAgaW50ZXJhY3Rpb25zLFxuICAgIC8qKiBAbGVuZHMgSW50ZXJhY3RhYmxlICovXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNoYWRvd1xuICAgIEludGVyYWN0YWJsZSxcbiAgfSA9IHNjb3BlXG5cbiAgLy8gYWRkIGFjdGlvbiByZWZsb3cgZXZlbnQgdHlwZXNcbiAgZm9yIChjb25zdCBhY3Rpb25OYW1lIG9mIGFjdGlvbnMubmFtZXMpIHtcbiAgICBhY3Rpb25zLmV2ZW50VHlwZXMucHVzaChgJHthY3Rpb25OYW1lfXJlZmxvd2ApXG4gIH1cblxuICAvLyByZW1vdmUgY29tcGxldGVkIHJlZmxvdyBpbnRlcmFjdGlvbnNcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ3N0b3AnLCAoeyBpbnRlcmFjdGlvbiB9KSA9PiB7XG4gICAgaWYgKGludGVyYWN0aW9uLnBvaW50ZXJUeXBlID09PSAncmVmbG93Jykge1xuICAgICAgaW50ZXJhY3Rpb24uX3JlZmxvd1Jlc29sdmUoKVxuICAgICAgYXJyLnJlbW92ZShzY29wZS5pbnRlcmFjdGlvbnMubGlzdCwgaW50ZXJhY3Rpb24pXG4gICAgfVxuICB9KVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBjb25zdCBpbnRlcmFjdGFibGUgPSBpbnRlcmFjdCh0YXJnZXQpO1xuICAgKiBjb25zdCBkcmFnID0geyBuYW1lOiBkcmFnLCBheGlzOiAneCcgfTtcbiAgICogY29uc3QgcmVzaXplID0geyBuYW1lOiByZXNpemUsIGVkZ2VzOiB7IGxlZnQ6IHRydWUsIGJvdHRvbTogdHJ1ZSB9O1xuICAgKlxuICAgKiBpbnRlcmFjdGFibGUucmVmbG93KGRyYWcpO1xuICAgKiBpbnRlcmFjdGFibGUucmVmbG93KHJlc2l6ZSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBTdGFydCBhbiBhY3Rpb24gc2VxdWVuY2UgdG8gcmUtYXBwbHkgbW9kaWZpZXJzLCBjaGVjayBkcm9wcywgZXRjLlxuICAgKlxuICAgKiBAcGFyYW0geyBPYmplY3QgfSBhY3Rpb24gVGhlIGFjdGlvbiB0byBiZWdpblxuICAgKiBAcGFyYW0geyBzdHJpbmcgfSBhY3Rpb24ubmFtZSBUaGUgbmFtZSBvZiB0aGUgYWN0aW9uXG4gICAqIEByZXR1cm5zIHsgUHJvbWlzZTxJbnRlcmFjdGFibGU+IH1cbiAgICovXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUucmVmbG93ID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgIHJldHVybiByZWZsb3codGhpcywgYWN0aW9uLCBzY29wZSlcbiAgfVxufVxuXG5mdW5jdGlvbiByZWZsb3cgKGludGVyYWN0YWJsZTogSW50ZXJhY3RhYmxlLCBhY3Rpb246IEFjdGlvbiwgc2NvcGU6IFNjb3BlKSB7XG4gIGNvbnN0IGVsZW1lbnRzID0gaXMuc3RyaW5nKGludGVyYWN0YWJsZS50YXJnZXQpXG4gICAgPyBhcnIuZnJvbShpbnRlcmFjdGFibGUuX2NvbnRleHQucXVlcnlTZWxlY3RvckFsbChpbnRlcmFjdGFibGUudGFyZ2V0KSlcbiAgICA6IFtpbnRlcmFjdGFibGUudGFyZ2V0XVxuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZSB2YXJpYWJsZS1uYW1lXG4gIGNvbnN0IFByb21pc2UgPSAod2luLndpbmRvdyBhcyBhbnkpLlByb21pc2VcbiAgY29uc3QgcHJvbWlzZXM6IEFycmF5PFByb21pc2U8bnVsbD4+IHwgbnVsbCA9IFByb21pc2UgPyBbXSA6IG51bGxcblxuICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZWxlbWVudHMpIHtcbiAgICBjb25zdCByZWN0ID0gaW50ZXJhY3RhYmxlLmdldFJlY3QoZWxlbWVudClcblxuICAgIGlmICghcmVjdCkgeyBicmVhayB9XG5cbiAgICBjb25zdCBydW5uaW5nSW50ZXJhY3Rpb24gPSBhcnIuZmluZChcbiAgICAgIHNjb3BlLmludGVyYWN0aW9ucy5saXN0LFxuICAgICAgKGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbikgPT4ge1xuICAgICAgICByZXR1cm4gaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKSAmJlxuICAgICAgICAgIGludGVyYWN0aW9uLnRhcmdldCA9PT0gaW50ZXJhY3RhYmxlICYmXG4gICAgICAgICAgaW50ZXJhY3Rpb24uZWxlbWVudCA9PT0gZWxlbWVudCAmJlxuICAgICAgICAgIGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgPT09IGFjdGlvbi5uYW1lXG4gICAgICB9KVxuICAgIGxldCByZWZsb3dQcm9taXNlOiBQcm9taXNlPG51bGw+XG5cbiAgICBpZiAocnVubmluZ0ludGVyYWN0aW9uKSB7XG4gICAgICBydW5uaW5nSW50ZXJhY3Rpb24ubW92ZSgpXG5cbiAgICAgIHJlZmxvd1Byb21pc2UgPSBydW5uaW5nSW50ZXJhY3Rpb24uX3JlZmxvd1Byb21pc2UgfHwgbmV3IFByb21pc2UoKHJlc29sdmU6IGFueSkgPT4ge1xuICAgICAgICBydW5uaW5nSW50ZXJhY3Rpb24uX3JlZmxvd1Jlc29sdmUgPSByZXNvbHZlXG4gICAgICB9KVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnN0IHh5d2ggPSByZWN0VXRpbHMudGxiclRvWHl3aChyZWN0KVxuICAgICAgY29uc3QgY29vcmRzID0ge1xuICAgICAgICBwYWdlICAgICA6IHsgeDogeHl3aC54LCB5OiB4eXdoLnkgfSxcbiAgICAgICAgY2xpZW50ICAgOiB7IHg6IHh5d2gueCwgeTogeHl3aC55IH0sXG4gICAgICAgIHRpbWVTdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgIH1cblxuICAgICAgY29uc3QgZXZlbnQgPSBwb2ludGVyVXRpbHMuY29vcmRzVG9FdmVudChjb29yZHMpXG4gICAgICByZWZsb3dQcm9taXNlID0gc3RhcnRSZWZsb3coc2NvcGUsIGludGVyYWN0YWJsZSwgZWxlbWVudCwgYWN0aW9uLCBldmVudClcbiAgICB9XG5cbiAgICBpZiAocHJvbWlzZXMpIHtcbiAgICAgIHByb21pc2VzLnB1c2gocmVmbG93UHJvbWlzZSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcHJvbWlzZXMgJiYgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4gaW50ZXJhY3RhYmxlKVxufVxuXG5mdW5jdGlvbiBzdGFydFJlZmxvdyAoc2NvcGU6IFNjb3BlLCBpbnRlcmFjdGFibGU6IEludGVyYWN0YWJsZSwgZWxlbWVudDogRWxlbWVudCwgYWN0aW9uOiBBY3Rpb24sIGV2ZW50OiBhbnkpIHtcbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBuZXdJbnRlcmFjdGlvbih7IHBvaW50ZXJUeXBlOiAncmVmbG93JyB9LCBzY29wZSlcbiAgY29uc3Qgc2lnbmFsQXJnID0ge1xuICAgIGludGVyYWN0aW9uLFxuICAgIGV2ZW50LFxuICAgIHBvaW50ZXI6IGV2ZW50LFxuICAgIGV2ZW50VGFyZ2V0OiBlbGVtZW50LFxuICAgIHBoYXNlOiAncmVmbG93JyxcbiAgfVxuXG4gIGludGVyYWN0aW9uLnRhcmdldCA9IGludGVyYWN0YWJsZVxuICBpbnRlcmFjdGlvbi5lbGVtZW50ID0gZWxlbWVudFxuICBpbnRlcmFjdGlvbi5wcmVwYXJlZCA9IGV4dGVuZCh7fSwgYWN0aW9uKVxuICBpbnRlcmFjdGlvbi5wcmV2RXZlbnQgPSBldmVudFxuICBpbnRlcmFjdGlvbi51cGRhdGVQb2ludGVyKGV2ZW50LCBldmVudCwgZWxlbWVudCwgdHJ1ZSlcblxuICBpbnRlcmFjdGlvbi5fZG9QaGFzZShzaWduYWxBcmcpXG5cbiAgY29uc3QgcmVmbG93UHJvbWlzZSA9ICh3aW4ud2luZG93IGFzIHVua25vd24gYXMgYW55KS5Qcm9taXNlXG4gICAgPyBuZXcgKHdpbi53aW5kb3cgYXMgdW5rbm93biBhcyBhbnkpLlByb21pc2UoKHJlc29sdmU6IGFueSkgPT4ge1xuICAgICAgaW50ZXJhY3Rpb24uX3JlZmxvd1Jlc29sdmUgPSByZXNvbHZlXG4gICAgfSlcbiAgICA6IG51bGxcblxuICBpbnRlcmFjdGlvbi5fcmVmbG93UHJvbWlzZSA9IHJlZmxvd1Byb21pc2VcbiAgaW50ZXJhY3Rpb24uc3RhcnQoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpXG5cbiAgaWYgKGludGVyYWN0aW9uLl9pbnRlcmFjdGluZykge1xuICAgIGludGVyYWN0aW9uLm1vdmUoc2lnbmFsQXJnKVxuICAgIGludGVyYWN0aW9uLmVuZChldmVudClcbiAgfVxuICBlbHNlIHtcbiAgICBpbnRlcmFjdGlvbi5zdG9wKClcbiAgfVxuXG4gIGludGVyYWN0aW9uLnJlbW92ZVBvaW50ZXIoZXZlbnQsIGV2ZW50KVxuICBpbnRlcmFjdGlvbi5wb2ludGVySXNEb3duID0gZmFsc2VcblxuICByZXR1cm4gcmVmbG93UHJvbWlzZVxufVxuXG5leHBvcnQgZGVmYXVsdCB7IGluc3RhbGwgfVxuIl19