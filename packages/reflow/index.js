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
            if (interaction._reflowResolve) {
                interaction._reflowResolve();
            }
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
                interaction.interactable === interactable &&
                interaction.element === element &&
                interaction.prepared.name === action.name;
        });
        let reflowPromise;
        if (runningInteraction) {
            runningInteraction.move();
            if (promises) {
                reflowPromise = runningInteraction._reflowPromise || new Promise((resolve) => {
                    runningInteraction._reflowResolve = resolve;
                });
            }
        }
        else {
            const xywh = rectUtils.tlbrToXywh(rect);
            const coords = {
                page: { x: xywh.x, y: xywh.y },
                client: { x: xywh.x, y: xywh.y },
                timeStamp: scope.now(),
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
    interaction.interactable = interactable;
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
export default {
    id: 'reflow',
    install,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sK0JBQStCLENBQUE7QUFFOUQsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE9BQU8sSUFBSSxZQUFZLEVBQUUsSUFBSSxJQUFJLFNBQVMsRUFBRSxHQUFHLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQWNwRyxNQUFNLFVBQVUsT0FBTyxDQUFFLEtBQVk7SUFDbkMsTUFBTSxFQUNKLE9BQU8sRUFDUCxZQUFZO0lBQ1osMEJBQTBCO0lBQzFCLHFDQUFxQztJQUNyQyxZQUFZLEdBQ2IsR0FBRyxLQUFLLENBQUE7SUFFVCxnQ0FBZ0M7SUFDaEMsS0FBSyxNQUFNLFVBQVUsSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFO1FBQ3RDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxRQUFRLENBQUMsQ0FBQTtLQUMvQztJQUVELHVDQUF1QztJQUN2QyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUU7UUFDbEQsSUFBSSxXQUFXLENBQUMsV0FBVyxLQUFLLFFBQVEsRUFBRTtZQUN4QyxJQUFJLFdBQVcsQ0FBQyxjQUFjLEVBQUU7Z0JBQzlCLFdBQVcsQ0FBQyxjQUFjLEVBQUUsQ0FBQTthQUM3QjtZQUVELEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUE7U0FDakQ7SUFDSCxDQUFDLENBQUMsQ0FBQTtJQUVGOzs7Ozs7Ozs7Ozs7Ozs7T0FlRztJQUNILFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFVBQVUsTUFBTTtRQUM5QyxPQUFPLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUss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QUFLLENBQUMsQ0FBQTtJQUN2QyxXQUFXLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQTtJQUVqQyxPQUFPLGFBQWEsQ0FBQTtBQUN0QixDQUFDO0FBRUQsZUFBZTtJQUNiLEVBQUUsRUFBRSxRQUFRO0lBQ1osT0FBTztDQUNXLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgSW50ZXJhY3RhYmxlIGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3RhYmxlJ1xuaW1wb3J0IHsgQWN0aW9uUHJvcHMsIEludGVyYWN0aW9uIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbidcbmltcG9ydCB7IG5ld0ludGVyYWN0aW9uIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9pbnRlcmFjdGlvbnMnXG5pbXBvcnQgeyBTY29wZSB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnXG5pbXBvcnQgeyBhcnIsIGV4dGVuZCwgaXMsIHBvaW50ZXIgYXMgcG9pbnRlclV0aWxzLCByZWN0IGFzIHJlY3RVdGlscywgd2luIH0gZnJvbSAnQGludGVyYWN0anMvdXRpbHMnXG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0YWJsZScge1xuICBpbnRlcmZhY2UgSW50ZXJhY3RhYmxlIHtcbiAgICByZWZsb3c6IChhY3Rpb246IEFjdGlvblByb3BzKSA9PiBSZXR1cm5UeXBlPHR5cGVvZiByZWZsb3c+XG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3Rpb24nIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0aW9uIHtcbiAgICBfcmVmbG93UmVzb2x2ZTogKCkgPT4gdm9pZFxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qge1xuICAgIGFjdGlvbnMsXG4gICAgaW50ZXJhY3Rpb25zLFxuICAgIC8qKiBAbGVuZHMgSW50ZXJhY3RhYmxlICovXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNoYWRvd1xuICAgIEludGVyYWN0YWJsZSxcbiAgfSA9IHNjb3BlXG5cbiAgLy8gYWRkIGFjdGlvbiByZWZsb3cgZXZlbnQgdHlwZXNcbiAgZm9yIChjb25zdCBhY3Rpb25OYW1lIG9mIGFjdGlvbnMubmFtZXMpIHtcbiAgICBhY3Rpb25zLmV2ZW50VHlwZXMucHVzaChgJHthY3Rpb25OYW1lfXJlZmxvd2ApXG4gIH1cblxuICAvLyByZW1vdmUgY29tcGxldGVkIHJlZmxvdyBpbnRlcmFjdGlvbnNcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ3N0b3AnLCAoeyBpbnRlcmFjdGlvbiB9KSA9PiB7XG4gICAgaWYgKGludGVyYWN0aW9uLnBvaW50ZXJUeXBlID09PSAncmVmbG93Jykge1xuICAgICAgaWYgKGludGVyYWN0aW9uLl9yZWZsb3dSZXNvbHZlKSB7XG4gICAgICAgIGludGVyYWN0aW9uLl9yZWZsb3dSZXNvbHZlKClcbiAgICAgIH1cblxuICAgICAgYXJyLnJlbW92ZShzY29wZS5pbnRlcmFjdGlvbnMubGlzdCwgaW50ZXJhY3Rpb24pXG4gICAgfVxuICB9KVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBjb25zdCBpbnRlcmFjdGFibGUgPSBpbnRlcmFjdCh0YXJnZXQpO1xuICAgKiBjb25zdCBkcmFnID0geyBuYW1lOiBkcmFnLCBheGlzOiAneCcgfTtcbiAgICogY29uc3QgcmVzaXplID0geyBuYW1lOiByZXNpemUsIGVkZ2VzOiB7IGxlZnQ6IHRydWUsIGJvdHRvbTogdHJ1ZSB9O1xuICAgKlxuICAgKiBpbnRlcmFjdGFibGUucmVmbG93KGRyYWcpO1xuICAgKiBpbnRlcmFjdGFibGUucmVmbG93KHJlc2l6ZSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBTdGFydCBhbiBhY3Rpb24gc2VxdWVuY2UgdG8gcmUtYXBwbHkgbW9kaWZpZXJzLCBjaGVjayBkcm9wcywgZXRjLlxuICAgKlxuICAgKiBAcGFyYW0geyBPYmplY3QgfSBhY3Rpb24gVGhlIGFjdGlvbiB0byBiZWdpblxuICAgKiBAcGFyYW0geyBzdHJpbmcgfSBhY3Rpb24ubmFtZSBUaGUgbmFtZSBvZiB0aGUgYWN0aW9uXG4gICAqIEByZXR1cm5zIHsgUHJvbWlzZTxJbnRlcmFjdGFibGU+IH1cbiAgICovXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUucmVmbG93ID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgIHJldHVybiByZWZsb3codGhpcywgYWN0aW9uLCBzY29wZSlcbiAgfVxufVxuXG5mdW5jdGlvbiByZWZsb3cgKGludGVyYWN0YWJsZTogSW50ZXJhY3RhYmxlLCBhY3Rpb246IEFjdGlvblByb3BzLCBzY29wZTogU2NvcGUpOiBQcm9taXNlPEludGVyYWN0YWJsZT4ge1xuICBjb25zdCBlbGVtZW50cyA9IGlzLnN0cmluZyhpbnRlcmFjdGFibGUudGFyZ2V0KVxuICAgID8gYXJyLmZyb20oaW50ZXJhY3RhYmxlLl9jb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoaW50ZXJhY3RhYmxlLnRhcmdldCkpXG4gICAgOiBbaW50ZXJhY3RhYmxlLnRhcmdldF1cblxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmUgdmFyaWFibGUtbmFtZVxuICBjb25zdCBQcm9taXNlID0gKHdpbi53aW5kb3cgYXMgYW55KS5Qcm9taXNlXG4gIGNvbnN0IHByb21pc2VzOiBBcnJheTxQcm9taXNlPG51bGw+PiB8IG51bGwgPSBQcm9taXNlID8gW10gOiBudWxsXG5cbiAgZm9yIChjb25zdCBlbGVtZW50IG9mIGVsZW1lbnRzKSB7XG4gICAgY29uc3QgcmVjdCA9IGludGVyYWN0YWJsZS5nZXRSZWN0KGVsZW1lbnQpXG5cbiAgICBpZiAoIXJlY3QpIHsgYnJlYWsgfVxuXG4gICAgY29uc3QgcnVubmluZ0ludGVyYWN0aW9uID0gYXJyLmZpbmQoXG4gICAgICBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCxcbiAgICAgIChpbnRlcmFjdGlvbjogSW50ZXJhY3Rpb24pID0+IHtcbiAgICAgICAgcmV0dXJuIGludGVyYWN0aW9uLmludGVyYWN0aW5nKCkgJiZcbiAgICAgICAgICBpbnRlcmFjdGlvbi5pbnRlcmFjdGFibGUgPT09IGludGVyYWN0YWJsZSAmJlxuICAgICAgICAgIGludGVyYWN0aW9uLmVsZW1lbnQgPT09IGVsZW1lbnQgJiZcbiAgICAgICAgICBpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lID09PSBhY3Rpb24ubmFtZVxuICAgICAgfSlcbiAgICBsZXQgcmVmbG93UHJvbWlzZTogUHJvbWlzZTxudWxsPlxuXG4gICAgaWYgKHJ1bm5pbmdJbnRlcmFjdGlvbikge1xuICAgICAgcnVubmluZ0ludGVyYWN0aW9uLm1vdmUoKVxuXG4gICAgICBpZiAocHJvbWlzZXMpIHtcbiAgICAgICAgcmVmbG93UHJvbWlzZSA9IHJ1bm5pbmdJbnRlcmFjdGlvbi5fcmVmbG93UHJvbWlzZSB8fCBuZXcgUHJvbWlzZSgocmVzb2x2ZTogYW55KSA9PiB7XG4gICAgICAgICAgcnVubmluZ0ludGVyYWN0aW9uLl9yZWZsb3dSZXNvbHZlID0gcmVzb2x2ZVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNvbnN0IHh5d2ggPSByZWN0VXRpbHMudGxiclRvWHl3aChyZWN0KVxuICAgICAgY29uc3QgY29vcmRzID0ge1xuICAgICAgICBwYWdlICAgICA6IHsgeDogeHl3aC54LCB5OiB4eXdoLnkgfSxcbiAgICAgICAgY2xpZW50ICAgOiB7IHg6IHh5d2gueCwgeTogeHl3aC55IH0sXG4gICAgICAgIHRpbWVTdGFtcDogc2NvcGUubm93KCksXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGV2ZW50ID0gcG9pbnRlclV0aWxzLmNvb3Jkc1RvRXZlbnQoY29vcmRzKVxuICAgICAgcmVmbG93UHJvbWlzZSA9IHN0YXJ0UmVmbG93KHNjb3BlLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGFjdGlvbiwgZXZlbnQpXG4gICAgfVxuXG4gICAgaWYgKHByb21pc2VzKSB7XG4gICAgICBwcm9taXNlcy5wdXNoKHJlZmxvd1Byb21pc2UpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHByb21pc2VzICYmIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKCgpID0+IGludGVyYWN0YWJsZSlcbn1cblxuZnVuY3Rpb24gc3RhcnRSZWZsb3cgKHNjb3BlOiBTY29wZSwgaW50ZXJhY3RhYmxlOiBJbnRlcmFjdGFibGUsIGVsZW1lbnQ6IEVsZW1lbnQsIGFjdGlvbjogQWN0aW9uUHJvcHMsIGV2ZW50OiBhbnkpIHtcbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBuZXdJbnRlcmFjdGlvbih7IHBvaW50ZXJUeXBlOiAncmVmbG93JyB9LCBzY29wZSlcbiAgY29uc3Qgc2lnbmFsQXJnID0ge1xuICAgIGludGVyYWN0aW9uLFxuICAgIGV2ZW50LFxuICAgIHBvaW50ZXI6IGV2ZW50LFxuICAgIGV2ZW50VGFyZ2V0OiBlbGVtZW50LFxuICAgIHBoYXNlOiAncmVmbG93JyxcbiAgfVxuXG4gIGludGVyYWN0aW9uLmludGVyYWN0YWJsZSA9IGludGVyYWN0YWJsZVxuICBpbnRlcmFjdGlvbi5lbGVtZW50ID0gZWxlbWVudFxuICBpbnRlcmFjdGlvbi5wcmVwYXJlZCA9IGV4dGVuZCh7fSwgYWN0aW9uKVxuICBpbnRlcmFjdGlvbi5wcmV2RXZlbnQgPSBldmVudFxuICBpbnRlcmFjdGlvbi51cGRhdGVQb2ludGVyKGV2ZW50LCBldmVudCwgZWxlbWVudCwgdHJ1ZSlcblxuICBpbnRlcmFjdGlvbi5fZG9QaGFzZShzaWduYWxBcmcpXG5cbiAgY29uc3QgcmVmbG93UHJvbWlzZSA9ICh3aW4ud2luZG93IGFzIHVua25vd24gYXMgYW55KS5Qcm9taXNlXG4gICAgPyBuZXcgKHdpbi53aW5kb3cgYXMgdW5rbm93biBhcyBhbnkpLlByb21pc2UoKHJlc29sdmU6IGFueSkgPT4ge1xuICAgICAgaW50ZXJhY3Rpb24uX3JlZmxvd1Jlc29sdmUgPSByZXNvbHZlXG4gICAgfSlcbiAgICA6IG51bGxcblxuICBpbnRlcmFjdGlvbi5fcmVmbG93UHJvbWlzZSA9IHJlZmxvd1Byb21pc2VcbiAgaW50ZXJhY3Rpb24uc3RhcnQoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpXG5cbiAgaWYgKGludGVyYWN0aW9uLl9pbnRlcmFjdGluZykge1xuICAgIGludGVyYWN0aW9uLm1vdmUoc2lnbmFsQXJnKVxuICAgIGludGVyYWN0aW9uLmVuZChldmVudClcbiAgfVxuICBlbHNlIHtcbiAgICBpbnRlcmFjdGlvbi5zdG9wKClcbiAgfVxuXG4gIGludGVyYWN0aW9uLnJlbW92ZVBvaW50ZXIoZXZlbnQsIGV2ZW50KVxuICBpbnRlcmFjdGlvbi5wb2ludGVySXNEb3duID0gZmFsc2VcblxuICByZXR1cm4gcmVmbG93UHJvbWlzZVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGlkOiAncmVmbG93JyxcbiAgaW5zdGFsbCxcbn0gYXMgSW50ZXJhY3QuUGx1Z2luXG4iXX0=