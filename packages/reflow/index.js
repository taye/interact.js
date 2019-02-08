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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sK0JBQStCLENBQUE7QUFFOUQsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE9BQU8sSUFBSSxZQUFZLEVBQUUsSUFBSSxJQUFJLFNBQVMsRUFBRSxHQUFHLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQWNwRyxNQUFNLFVBQVUsT0FBTyxDQUFFLEtBQVk7SUFDbkMsTUFBTSxFQUNKLE9BQU8sRUFDUCxZQUFZO0lBQ1osMEJBQTBCO0lBQzFCLHFDQUFxQztJQUNyQyxZQUFZLEdBQ2IsR0FBRyxLQUFLLENBQUE7SUFFVCxnQ0FBZ0M7SUFDaEMsS0FBSyxNQUFNLFVBQVUsSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFO1FBQ3RDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxRQUFRLENBQUMsQ0FBQTtLQUMvQztJQUVELHVDQUF1QztJQUN2QyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUU7UUFDbEQsSUFBSSxXQUFXLENBQUMsV0FBVyxLQUFLLFFBQVEsRUFBRTtZQUN4QyxXQUFXLENBQUMsY0FBYyxFQUFFLENBQUE7WUFDNUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQTtTQUNqRDtJQUNILENBQUMsQ0FBQyxDQUFBO0lBRUY7Ozs7Ozs7Ozs7Ozs7OztPQWVHO0lBQ0gsWUFBWSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsVUFBVSxNQUFNO1FBQzlDLE9BQU8sTUFBTSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDcEMsQ0FBQyxDQUFBO0FBQ0gsQ0FBQztB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YSxDQUFBO0FBQ3RCLENBQUM7QUFFRCxlQUFlLEVBQUUsT0FBTyxFQUFFLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgSW50ZXJhY3RhYmxlIGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3RhYmxlJ1xuaW1wb3J0IHsgQWN0aW9uUHJvcHMsIEludGVyYWN0aW9uIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbidcbmltcG9ydCB7IG5ld0ludGVyYWN0aW9uIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9pbnRlcmFjdGlvbnMnXG5pbXBvcnQgeyBTY29wZSB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnXG5pbXBvcnQgeyBhcnIsIGV4dGVuZCwgaXMsIHBvaW50ZXIgYXMgcG9pbnRlclV0aWxzLCByZWN0IGFzIHJlY3RVdGlscywgd2luIH0gZnJvbSAnQGludGVyYWN0anMvdXRpbHMnXG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0YWJsZScge1xuICBpbnRlcmZhY2UgSW50ZXJhY3RhYmxlIHtcbiAgICByZWZsb3c6IChhY3Rpb246IEFjdGlvblByb3BzKSA9PiBSZXR1cm5UeXBlPHR5cGVvZiByZWZsb3c+XG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3Rpb24nIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0aW9uIHtcbiAgICBfcmVmbG93UmVzb2x2ZTogKCkgPT4gdm9pZFxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qge1xuICAgIGFjdGlvbnMsXG4gICAgaW50ZXJhY3Rpb25zLFxuICAgIC8qKiBAbGVuZHMgSW50ZXJhY3RhYmxlICovXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNoYWRvd1xuICAgIEludGVyYWN0YWJsZSxcbiAgfSA9IHNjb3BlXG5cbiAgLy8gYWRkIGFjdGlvbiByZWZsb3cgZXZlbnQgdHlwZXNcbiAgZm9yIChjb25zdCBhY3Rpb25OYW1lIG9mIGFjdGlvbnMubmFtZXMpIHtcbiAgICBhY3Rpb25zLmV2ZW50VHlwZXMucHVzaChgJHthY3Rpb25OYW1lfXJlZmxvd2ApXG4gIH1cblxuICAvLyByZW1vdmUgY29tcGxldGVkIHJlZmxvdyBpbnRlcmFjdGlvbnNcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ3N0b3AnLCAoeyBpbnRlcmFjdGlvbiB9KSA9PiB7XG4gICAgaWYgKGludGVyYWN0aW9uLnBvaW50ZXJUeXBlID09PSAncmVmbG93Jykge1xuICAgICAgaW50ZXJhY3Rpb24uX3JlZmxvd1Jlc29sdmUoKVxuICAgICAgYXJyLnJlbW92ZShzY29wZS5pbnRlcmFjdGlvbnMubGlzdCwgaW50ZXJhY3Rpb24pXG4gICAgfVxuICB9KVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBjb25zdCBpbnRlcmFjdGFibGUgPSBpbnRlcmFjdCh0YXJnZXQpO1xuICAgKiBjb25zdCBkcmFnID0geyBuYW1lOiBkcmFnLCBheGlzOiAneCcgfTtcbiAgICogY29uc3QgcmVzaXplID0geyBuYW1lOiByZXNpemUsIGVkZ2VzOiB7IGxlZnQ6IHRydWUsIGJvdHRvbTogdHJ1ZSB9O1xuICAgKlxuICAgKiBpbnRlcmFjdGFibGUucmVmbG93KGRyYWcpO1xuICAgKiBpbnRlcmFjdGFibGUucmVmbG93KHJlc2l6ZSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBTdGFydCBhbiBhY3Rpb24gc2VxdWVuY2UgdG8gcmUtYXBwbHkgbW9kaWZpZXJzLCBjaGVjayBkcm9wcywgZXRjLlxuICAgKlxuICAgKiBAcGFyYW0geyBPYmplY3QgfSBhY3Rpb24gVGhlIGFjdGlvbiB0byBiZWdpblxuICAgKiBAcGFyYW0geyBzdHJpbmcgfSBhY3Rpb24ubmFtZSBUaGUgbmFtZSBvZiB0aGUgYWN0aW9uXG4gICAqIEByZXR1cm5zIHsgUHJvbWlzZTxJbnRlcmFjdGFibGU+IH1cbiAgICovXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUucmVmbG93ID0gZnVuY3Rpb24gKGFjdGlvbikge1xuICAgIHJldHVybiByZWZsb3codGhpcywgYWN0aW9uLCBzY29wZSlcbiAgfVxufVxuXG5mdW5jdGlvbiByZWZsb3cgKGludGVyYWN0YWJsZTogSW50ZXJhY3RhYmxlLCBhY3Rpb246IEFjdGlvblByb3BzLCBzY29wZTogU2NvcGUpIHtcbiAgY29uc3QgZWxlbWVudHMgPSBpcy5zdHJpbmcoaW50ZXJhY3RhYmxlLnRhcmdldClcbiAgICA/IGFyci5mcm9tKGludGVyYWN0YWJsZS5fY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKGludGVyYWN0YWJsZS50YXJnZXQpKVxuICAgIDogW2ludGVyYWN0YWJsZS50YXJnZXRdXG5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lIHZhcmlhYmxlLW5hbWVcbiAgY29uc3QgUHJvbWlzZSA9ICh3aW4ud2luZG93IGFzIGFueSkuUHJvbWlzZVxuICBjb25zdCBwcm9taXNlczogQXJyYXk8UHJvbWlzZTxudWxsPj4gfCBudWxsID0gUHJvbWlzZSA/IFtdIDogbnVsbFxuXG4gIGZvciAoY29uc3QgZWxlbWVudCBvZiBlbGVtZW50cykge1xuICAgIGNvbnN0IHJlY3QgPSBpbnRlcmFjdGFibGUuZ2V0UmVjdChlbGVtZW50KVxuXG4gICAgaWYgKCFyZWN0KSB7IGJyZWFrIH1cblxuICAgIGNvbnN0IHJ1bm5pbmdJbnRlcmFjdGlvbiA9IGFyci5maW5kKFxuICAgICAgc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QsXG4gICAgICAoaW50ZXJhY3Rpb246IEludGVyYWN0aW9uKSA9PiB7XG4gICAgICAgIHJldHVybiBpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpICYmXG4gICAgICAgICAgaW50ZXJhY3Rpb24udGFyZ2V0ID09PSBpbnRlcmFjdGFibGUgJiZcbiAgICAgICAgICBpbnRlcmFjdGlvbi5lbGVtZW50ID09PSBlbGVtZW50ICYmXG4gICAgICAgICAgaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSA9PT0gYWN0aW9uLm5hbWVcbiAgICAgIH0pXG4gICAgbGV0IHJlZmxvd1Byb21pc2U6IFByb21pc2U8bnVsbD5cblxuICAgIGlmIChydW5uaW5nSW50ZXJhY3Rpb24pIHtcbiAgICAgIHJ1bm5pbmdJbnRlcmFjdGlvbi5tb3ZlKClcblxuICAgICAgcmVmbG93UHJvbWlzZSA9IHJ1bm5pbmdJbnRlcmFjdGlvbi5fcmVmbG93UHJvbWlzZSB8fCBuZXcgUHJvbWlzZSgocmVzb2x2ZTogYW55KSA9PiB7XG4gICAgICAgIHJ1bm5pbmdJbnRlcmFjdGlvbi5fcmVmbG93UmVzb2x2ZSA9IHJlc29sdmVcbiAgICAgIH0pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc3QgeHl3aCA9IHJlY3RVdGlscy50bGJyVG9YeXdoKHJlY3QpXG4gICAgICBjb25zdCBjb29yZHMgPSB7XG4gICAgICAgIHBhZ2UgICAgIDogeyB4OiB4eXdoLngsIHk6IHh5d2gueSB9LFxuICAgICAgICBjbGllbnQgICA6IHsgeDogeHl3aC54LCB5OiB4eXdoLnkgfSxcbiAgICAgICAgdGltZVN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgfVxuXG4gICAgICBjb25zdCBldmVudCA9IHBvaW50ZXJVdGlscy5jb29yZHNUb0V2ZW50KGNvb3JkcylcbiAgICAgIHJlZmxvd1Byb21pc2UgPSBzdGFydFJlZmxvdyhzY29wZSwgaW50ZXJhY3RhYmxlLCBlbGVtZW50LCBhY3Rpb24sIGV2ZW50KVxuICAgIH1cblxuICAgIGlmIChwcm9taXNlcykge1xuICAgICAgcHJvbWlzZXMucHVzaChyZWZsb3dQcm9taXNlKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwcm9taXNlcyAmJiBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigoKSA9PiBpbnRlcmFjdGFibGUpXG59XG5cbmZ1bmN0aW9uIHN0YXJ0UmVmbG93IChzY29wZTogU2NvcGUsIGludGVyYWN0YWJsZTogSW50ZXJhY3RhYmxlLCBlbGVtZW50OiBFbGVtZW50LCBhY3Rpb246IEFjdGlvblByb3BzLCBldmVudDogYW55KSB7XG4gIGNvbnN0IGludGVyYWN0aW9uID0gbmV3SW50ZXJhY3Rpb24oeyBwb2ludGVyVHlwZTogJ3JlZmxvdycgfSwgc2NvcGUpXG4gIGNvbnN0IHNpZ25hbEFyZyA9IHtcbiAgICBpbnRlcmFjdGlvbixcbiAgICBldmVudCxcbiAgICBwb2ludGVyOiBldmVudCxcbiAgICBldmVudFRhcmdldDogZWxlbWVudCxcbiAgICBwaGFzZTogJ3JlZmxvdycsXG4gIH1cblxuICBpbnRlcmFjdGlvbi50YXJnZXQgPSBpbnRlcmFjdGFibGVcbiAgaW50ZXJhY3Rpb24uZWxlbWVudCA9IGVsZW1lbnRcbiAgaW50ZXJhY3Rpb24ucHJlcGFyZWQgPSBleHRlbmQoe30sIGFjdGlvbilcbiAgaW50ZXJhY3Rpb24ucHJldkV2ZW50ID0gZXZlbnRcbiAgaW50ZXJhY3Rpb24udXBkYXRlUG9pbnRlcihldmVudCwgZXZlbnQsIGVsZW1lbnQsIHRydWUpXG5cbiAgaW50ZXJhY3Rpb24uX2RvUGhhc2Uoc2lnbmFsQXJnKVxuXG4gIGNvbnN0IHJlZmxvd1Byb21pc2UgPSAod2luLndpbmRvdyBhcyB1bmtub3duIGFzIGFueSkuUHJvbWlzZVxuICAgID8gbmV3ICh3aW4ud2luZG93IGFzIHVua25vd24gYXMgYW55KS5Qcm9taXNlKChyZXNvbHZlOiBhbnkpID0+IHtcbiAgICAgIGludGVyYWN0aW9uLl9yZWZsb3dSZXNvbHZlID0gcmVzb2x2ZVxuICAgIH0pXG4gICAgOiBudWxsXG5cbiAgaW50ZXJhY3Rpb24uX3JlZmxvd1Byb21pc2UgPSByZWZsb3dQcm9taXNlXG4gIGludGVyYWN0aW9uLnN0YXJ0KGFjdGlvbiwgaW50ZXJhY3RhYmxlLCBlbGVtZW50KVxuXG4gIGlmIChpbnRlcmFjdGlvbi5faW50ZXJhY3RpbmcpIHtcbiAgICBpbnRlcmFjdGlvbi5tb3ZlKHNpZ25hbEFyZylcbiAgICBpbnRlcmFjdGlvbi5lbmQoZXZlbnQpXG4gIH1cbiAgZWxzZSB7XG4gICAgaW50ZXJhY3Rpb24uc3RvcCgpXG4gIH1cblxuICBpbnRlcmFjdGlvbi5yZW1vdmVQb2ludGVyKGV2ZW50LCBldmVudClcbiAgaW50ZXJhY3Rpb24ucG9pbnRlcklzRG93biA9IGZhbHNlXG5cbiAgcmV0dXJuIHJlZmxvd1Byb21pc2Vcbn1cblxuZXhwb3J0IGRlZmF1bHQgeyBpbnN0YWxsIH1cbiJdfQ==