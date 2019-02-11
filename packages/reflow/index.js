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
export default { install };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sK0JBQStCLENBQUE7QUFFOUQsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE9BQU8sSUFBSSxZQUFZLEVBQUUsSUFBSSxJQUFJLFNBQVMsRUFBRSxHQUFHLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQWNwRyxNQUFNLFVBQVUsT0FBTyxDQUFFLEtBQVk7SUFDbkMsTUFBTSxFQUNKLE9BQU8sRUFDUCxZQUFZO0lBQ1osMEJBQTBCO0lBQzFCLHFDQUFxQztJQUNyQyxZQUFZLEdBQ2IsR0FBRyxLQUFLLENBQUE7SUFFVCxnQ0FBZ0M7SUFDaEMsS0FBSyxNQUFNLFVBQVUsSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFO1FBQ3RDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxRQUFRLENBQUMsQ0FBQTtLQUMvQztJQUVELHVDQUF1QztJQUN2QyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUU7UUFDbEQsSUFBSSxXQUFXLENBQUMsV0FBVyxLQUFLLFFBQVEsRUFBRTtZQUN4QyxJQUFJLFdBQVcsQ0FBQyxjQUFjLEVBQUU7Z0JBQzlCLFdBQVcsQ0FBQyxjQUFjLEVBQUUsQ0FBQTthQUM3QjtZQUVELEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUE7U0FDakQ7SUFDSCxDQUFDLENBQUMsQ0FBQTtJQUVGOzs7Ozs7Ozs7Ozs7Ozs7T0FlRztJQUNILFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFVBQVUsTUFBTTtRQUM5QyxPQUFPLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUss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QUFLLENBQUMsQ0FBQTtJQUN2QyxXQUFXLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQTtJQUVqQyxPQUFPLGFBQWEsQ0FBQTtBQUN0QixDQUFDO0FBRUQsZUFBZSxFQUFFLE9BQU8sRUFBRSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEludGVyYWN0YWJsZSBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0YWJsZSdcbmltcG9ydCB7IEFjdGlvblByb3BzLCBJbnRlcmFjdGlvbiB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3Rpb24nXG5pbXBvcnQgeyBuZXdJbnRlcmFjdGlvbiB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvaW50ZXJhY3Rpb25zJ1xuaW1wb3J0IHsgU2NvcGUgfSBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJ1xuaW1wb3J0IHsgYXJyLCBleHRlbmQsIGlzLCBwb2ludGVyIGFzIHBvaW50ZXJVdGlscywgcmVjdCBhcyByZWN0VXRpbHMsIHdpbiB9IGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzJ1xuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGFibGUnIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0YWJsZSB7XG4gICAgcmVmbG93OiAoYWN0aW9uOiBBY3Rpb25Qcm9wcykgPT4gUmV0dXJuVHlwZTx0eXBlb2YgcmVmbG93PlxuICB9XG59XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0aW9uJyB7XG4gIGludGVyZmFjZSBJbnRlcmFjdGlvbiB7XG4gICAgX3JlZmxvd1Jlc29sdmU6ICgpID0+IHZvaWRcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFsbCAoc2NvcGU6IFNjb3BlKSB7XG4gIGNvbnN0IHtcbiAgICBhY3Rpb25zLFxuICAgIGludGVyYWN0aW9ucyxcbiAgICAvKiogQGxlbmRzIEludGVyYWN0YWJsZSAqL1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcbiAgICBJbnRlcmFjdGFibGUsXG4gIH0gPSBzY29wZVxuXG4gIC8vIGFkZCBhY3Rpb24gcmVmbG93IGV2ZW50IHR5cGVzXG4gIGZvciAoY29uc3QgYWN0aW9uTmFtZSBvZiBhY3Rpb25zLm5hbWVzKSB7XG4gICAgYWN0aW9ucy5ldmVudFR5cGVzLnB1c2goYCR7YWN0aW9uTmFtZX1yZWZsb3dgKVxuICB9XG5cbiAgLy8gcmVtb3ZlIGNvbXBsZXRlZCByZWZsb3cgaW50ZXJhY3Rpb25zXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdzdG9wJywgKHsgaW50ZXJhY3Rpb24gfSkgPT4ge1xuICAgIGlmIChpbnRlcmFjdGlvbi5wb2ludGVyVHlwZSA9PT0gJ3JlZmxvdycpIHtcbiAgICAgIGlmIChpbnRlcmFjdGlvbi5fcmVmbG93UmVzb2x2ZSkge1xuICAgICAgICBpbnRlcmFjdGlvbi5fcmVmbG93UmVzb2x2ZSgpXG4gICAgICB9XG5cbiAgICAgIGFyci5yZW1vdmUoc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QsIGludGVyYWN0aW9uKVxuICAgIH1cbiAgfSlcblxuICAvKipcbiAgICogYGBganNcbiAgICogY29uc3QgaW50ZXJhY3RhYmxlID0gaW50ZXJhY3QodGFyZ2V0KTtcbiAgICogY29uc3QgZHJhZyA9IHsgbmFtZTogZHJhZywgYXhpczogJ3gnIH07XG4gICAqIGNvbnN0IHJlc2l6ZSA9IHsgbmFtZTogcmVzaXplLCBlZGdlczogeyBsZWZ0OiB0cnVlLCBib3R0b206IHRydWUgfTtcbiAgICpcbiAgICogaW50ZXJhY3RhYmxlLnJlZmxvdyhkcmFnKTtcbiAgICogaW50ZXJhY3RhYmxlLnJlZmxvdyhyZXNpemUpO1xuICAgKiBgYGBcbiAgICpcbiAgICogU3RhcnQgYW4gYWN0aW9uIHNlcXVlbmNlIHRvIHJlLWFwcGx5IG1vZGlmaWVycywgY2hlY2sgZHJvcHMsIGV0Yy5cbiAgICpcbiAgICogQHBhcmFtIHsgT2JqZWN0IH0gYWN0aW9uIFRoZSBhY3Rpb24gdG8gYmVnaW5cbiAgICogQHBhcmFtIHsgc3RyaW5nIH0gYWN0aW9uLm5hbWUgVGhlIG5hbWUgb2YgdGhlIGFjdGlvblxuICAgKiBAcmV0dXJucyB7IFByb21pc2U8SW50ZXJhY3RhYmxlPiB9XG4gICAqL1xuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLnJlZmxvdyA9IGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICByZXR1cm4gcmVmbG93KHRoaXMsIGFjdGlvbiwgc2NvcGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gcmVmbG93IChpbnRlcmFjdGFibGU6IEludGVyYWN0YWJsZSwgYWN0aW9uOiBBY3Rpb25Qcm9wcywgc2NvcGU6IFNjb3BlKTogUHJvbWlzZTxJbnRlcmFjdGFibGU+IHtcbiAgY29uc3QgZWxlbWVudHMgPSBpcy5zdHJpbmcoaW50ZXJhY3RhYmxlLnRhcmdldClcbiAgICA/IGFyci5mcm9tKGludGVyYWN0YWJsZS5fY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKGludGVyYWN0YWJsZS50YXJnZXQpKVxuICAgIDogW2ludGVyYWN0YWJsZS50YXJnZXRdXG5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lIHZhcmlhYmxlLW5hbWVcbiAgY29uc3QgUHJvbWlzZSA9ICh3aW4ud2luZG93IGFzIGFueSkuUHJvbWlzZVxuICBjb25zdCBwcm9taXNlczogQXJyYXk8UHJvbWlzZTxudWxsPj4gfCBudWxsID0gUHJvbWlzZSA/IFtdIDogbnVsbFxuXG4gIGZvciAoY29uc3QgZWxlbWVudCBvZiBlbGVtZW50cykge1xuICAgIGNvbnN0IHJlY3QgPSBpbnRlcmFjdGFibGUuZ2V0UmVjdChlbGVtZW50KVxuXG4gICAgaWYgKCFyZWN0KSB7IGJyZWFrIH1cblxuICAgIGNvbnN0IHJ1bm5pbmdJbnRlcmFjdGlvbiA9IGFyci5maW5kKFxuICAgICAgc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QsXG4gICAgICAoaW50ZXJhY3Rpb246IEludGVyYWN0aW9uKSA9PiB7XG4gICAgICAgIHJldHVybiBpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpICYmXG4gICAgICAgICAgaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlID09PSBpbnRlcmFjdGFibGUgJiZcbiAgICAgICAgICBpbnRlcmFjdGlvbi5lbGVtZW50ID09PSBlbGVtZW50ICYmXG4gICAgICAgICAgaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSA9PT0gYWN0aW9uLm5hbWVcbiAgICAgIH0pXG4gICAgbGV0IHJlZmxvd1Byb21pc2U6IFByb21pc2U8bnVsbD5cblxuICAgIGlmIChydW5uaW5nSW50ZXJhY3Rpb24pIHtcbiAgICAgIHJ1bm5pbmdJbnRlcmFjdGlvbi5tb3ZlKClcblxuICAgICAgaWYgKHByb21pc2VzKSB7XG4gICAgICAgIHJlZmxvd1Byb21pc2UgPSBydW5uaW5nSW50ZXJhY3Rpb24uX3JlZmxvd1Byb21pc2UgfHwgbmV3IFByb21pc2UoKHJlc29sdmU6IGFueSkgPT4ge1xuICAgICAgICAgIHJ1bm5pbmdJbnRlcmFjdGlvbi5fcmVmbG93UmVzb2x2ZSA9IHJlc29sdmVcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb25zdCB4eXdoID0gcmVjdFV0aWxzLnRsYnJUb1h5d2gocmVjdClcbiAgICAgIGNvbnN0IGNvb3JkcyA9IHtcbiAgICAgICAgcGFnZSAgICAgOiB7IHg6IHh5d2gueCwgeTogeHl3aC55IH0sXG4gICAgICAgIGNsaWVudCAgIDogeyB4OiB4eXdoLngsIHk6IHh5d2gueSB9LFxuICAgICAgICB0aW1lU3RhbXA6IERhdGUubm93KCksXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGV2ZW50ID0gcG9pbnRlclV0aWxzLmNvb3Jkc1RvRXZlbnQoY29vcmRzKVxuICAgICAgcmVmbG93UHJvbWlzZSA9IHN0YXJ0UmVmbG93KHNjb3BlLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGFjdGlvbiwgZXZlbnQpXG4gICAgfVxuXG4gICAgaWYgKHByb21pc2VzKSB7XG4gICAgICBwcm9taXNlcy5wdXNoKHJlZmxvd1Byb21pc2UpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHByb21pc2VzICYmIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKCgpID0+IGludGVyYWN0YWJsZSlcbn1cblxuZnVuY3Rpb24gc3RhcnRSZWZsb3cgKHNjb3BlOiBTY29wZSwgaW50ZXJhY3RhYmxlOiBJbnRlcmFjdGFibGUsIGVsZW1lbnQ6IEVsZW1lbnQsIGFjdGlvbjogQWN0aW9uUHJvcHMsIGV2ZW50OiBhbnkpIHtcbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBuZXdJbnRlcmFjdGlvbih7IHBvaW50ZXJUeXBlOiAncmVmbG93JyB9LCBzY29wZSlcbiAgY29uc3Qgc2lnbmFsQXJnID0ge1xuICAgIGludGVyYWN0aW9uLFxuICAgIGV2ZW50LFxuICAgIHBvaW50ZXI6IGV2ZW50LFxuICAgIGV2ZW50VGFyZ2V0OiBlbGVtZW50LFxuICAgIHBoYXNlOiAncmVmbG93JyxcbiAgfVxuXG4gIGludGVyYWN0aW9uLmludGVyYWN0YWJsZSA9IGludGVyYWN0YWJsZVxuICBpbnRlcmFjdGlvbi5lbGVtZW50ID0gZWxlbWVudFxuICBpbnRlcmFjdGlvbi5wcmVwYXJlZCA9IGV4dGVuZCh7fSwgYWN0aW9uKVxuICBpbnRlcmFjdGlvbi5wcmV2RXZlbnQgPSBldmVudFxuICBpbnRlcmFjdGlvbi51cGRhdGVQb2ludGVyKGV2ZW50LCBldmVudCwgZWxlbWVudCwgdHJ1ZSlcblxuICBpbnRlcmFjdGlvbi5fZG9QaGFzZShzaWduYWxBcmcpXG5cbiAgY29uc3QgcmVmbG93UHJvbWlzZSA9ICh3aW4ud2luZG93IGFzIHVua25vd24gYXMgYW55KS5Qcm9taXNlXG4gICAgPyBuZXcgKHdpbi53aW5kb3cgYXMgdW5rbm93biBhcyBhbnkpLlByb21pc2UoKHJlc29sdmU6IGFueSkgPT4ge1xuICAgICAgaW50ZXJhY3Rpb24uX3JlZmxvd1Jlc29sdmUgPSByZXNvbHZlXG4gICAgfSlcbiAgICA6IG51bGxcblxuICBpbnRlcmFjdGlvbi5fcmVmbG93UHJvbWlzZSA9IHJlZmxvd1Byb21pc2VcbiAgaW50ZXJhY3Rpb24uc3RhcnQoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpXG5cbiAgaWYgKGludGVyYWN0aW9uLl9pbnRlcmFjdGluZykge1xuICAgIGludGVyYWN0aW9uLm1vdmUoc2lnbmFsQXJnKVxuICAgIGludGVyYWN0aW9uLmVuZChldmVudClcbiAgfVxuICBlbHNlIHtcbiAgICBpbnRlcmFjdGlvbi5zdG9wKClcbiAgfVxuXG4gIGludGVyYWN0aW9uLnJlbW92ZVBvaW50ZXIoZXZlbnQsIGV2ZW50KVxuICBpbnRlcmFjdGlvbi5wb2ludGVySXNEb3duID0gZmFsc2VcblxuICByZXR1cm4gcmVmbG93UHJvbWlzZVxufVxuXG5leHBvcnQgZGVmYXVsdCB7IGluc3RhbGwgfVxuIl19