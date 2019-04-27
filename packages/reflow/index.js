import { EventPhase } from '@interactjs/core/InteractEvent';
import { arr, extend, is, pointer as pointerUtils, rect as rectUtils, win } from '@interactjs/utils';
EventPhase.Reflow = 'reflow';
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
        if (interaction.pointerType === EventPhase.Reflow) {
            if (interaction._reflowResolve) {
                interaction._reflowResolve();
            }
            arr.remove(scope.interactions.list, interaction);
        }
    });
    /**
     * ```js
     * const interactable = interact(target)
     * const drag = { name: drag, axis: 'x' }
     * const resize = { name: resize, edges: { left: true, bottom: true }
     *
     * interactable.reflow(drag)
     * interactable.reflow(resize)
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
    const interaction = scope.interactions.new({ pointerType: 'reflow' });
    const signalArg = {
        interaction,
        event,
        pointer: event,
        eventTarget: element,
        phase: EventPhase.Reflow,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZ0NBQWdDLENBQUE7QUFHM0QsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE9BQU8sSUFBSSxZQUFZLEVBQUUsSUFBSSxJQUFJLFNBQVMsRUFBRSxHQUFHLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQTtBQXNCbkcsVUFBa0IsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFBO0FBRXJDLE1BQU0sVUFBVSxPQUFPLENBQUUsS0FBWTtJQUNuQyxNQUFNLEVBQ0osT0FBTyxFQUNQLFlBQVk7SUFDWiwwQkFBMEI7SUFDMUIscUNBQXFDO0lBQ3JDLFlBQVksR0FDYixHQUFHLEtBQUssQ0FBQTtJQUVULGdDQUFnQztJQUNoQyxLQUFLLE1BQU0sVUFBVSxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUU7UUFDdEMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLFFBQVEsQ0FBQyxDQUFBO0tBQy9DO0lBRUQsdUNBQXVDO0lBQ3ZDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRTtRQUNsRCxJQUFJLFdBQVcsQ0FBQyxXQUFXLEtBQUssVUFBVSxDQUFDLE1BQU0sRUFBRTtZQUNqRCxJQUFJLFdBQVcsQ0FBQyxjQUFjLEVBQUU7Z0JBQzlCLFdBQVcsQ0FBQyxjQUFjLEVBQUUsQ0FBQTthQUM3QjtZQUVELEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUE7U0FDakQ7SUFDSCxDQUFDLENBQUMsQ0FBQTtJQUVGOzs7Ozs7Ozs7Ozs7Ozs7T0FlRztJQUNILFlBQVksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFVBQVUsTUFB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LFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtLQUNuQjtJQUVELFdBQVcsQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQ3ZDLFdBQVcsQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFBO0lBRWpDLE9BQU8sYUFBYSxDQUFBO0FBQ3RCLENBQUM7QUFFRCxlQUFlO0lBQ2IsRUFBRSxFQUFFLFFBQVE7SUFDWixPQUFPO0NBQ1csQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBJbnRlcmFjdGFibGUgZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGFibGUnXG5pbXBvcnQgeyBFdmVudFBoYXNlIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdEV2ZW50J1xuaW1wb3J0IHsgQWN0aW9uUHJvcHMsIEludGVyYWN0aW9uIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbidcbmltcG9ydCB7IFNjb3BlIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9zY29wZSdcbmltcG9ydCB7IGFyciwgZXh0ZW5kLCBpcywgcG9pbnRlciBhcyBwb2ludGVyVXRpbHMsIHJlY3QgYXMgcmVjdFV0aWxzLCB3aW4gfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscydcblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3RhYmxlJyB7XG4gIGludGVyZmFjZSBJbnRlcmFjdGFibGUge1xuICAgIHJlZmxvdzogKGFjdGlvbjogQWN0aW9uUHJvcHMpID0+IFJldHVyblR5cGU8dHlwZW9mIHJlZmxvdz5cbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbicge1xuICBpbnRlcmZhY2UgSW50ZXJhY3Rpb24ge1xuICAgIF9yZWZsb3dQcm9taXNlOiBQcm9taXNlPHZvaWQ+XG4gICAgX3JlZmxvd1Jlc29sdmU6ICgpID0+IHZvaWRcbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdEV2ZW50JyB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcbiAgZW51bSBFdmVudFBoYXNlIHtcbiAgICBSZWZsb3cgPSAncmVmbG93JyxcbiAgfVxufVxuXG4oRXZlbnRQaGFzZSBhcyBhbnkpLlJlZmxvdyA9ICdyZWZsb3cnXG5cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qge1xuICAgIGFjdGlvbnMsXG4gICAgaW50ZXJhY3Rpb25zLFxuICAgIC8qKiBAbGVuZHMgSW50ZXJhY3RhYmxlICovXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNoYWRvd1xuICAgIEludGVyYWN0YWJsZSxcbiAgfSA9IHNjb3BlXG5cbiAgLy8gYWRkIGFjdGlvbiByZWZsb3cgZXZlbnQgdHlwZXNcbiAgZm9yIChjb25zdCBhY3Rpb25OYW1lIG9mIGFjdGlvbnMubmFtZXMpIHtcbiAgICBhY3Rpb25zLmV2ZW50VHlwZXMucHVzaChgJHthY3Rpb25OYW1lfXJlZmxvd2ApXG4gIH1cblxuICAvLyByZW1vdmUgY29tcGxldGVkIHJlZmxvdyBpbnRlcmFjdGlvbnNcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ3N0b3AnLCAoeyBpbnRlcmFjdGlvbiB9KSA9PiB7XG4gICAgaWYgKGludGVyYWN0aW9uLnBvaW50ZXJUeXBlID09PSBFdmVudFBoYXNlLlJlZmxvdykge1xuICAgICAgaWYgKGludGVyYWN0aW9uLl9yZWZsb3dSZXNvbHZlKSB7XG4gICAgICAgIGludGVyYWN0aW9uLl9yZWZsb3dSZXNvbHZlKClcbiAgICAgIH1cblxuICAgICAgYXJyLnJlbW92ZShzY29wZS5pbnRlcmFjdGlvbnMubGlzdCwgaW50ZXJhY3Rpb24pXG4gICAgfVxuICB9KVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBjb25zdCBpbnRlcmFjdGFibGUgPSBpbnRlcmFjdCh0YXJnZXQpXG4gICAqIGNvbnN0IGRyYWcgPSB7IG5hbWU6IGRyYWcsIGF4aXM6ICd4JyB9XG4gICAqIGNvbnN0IHJlc2l6ZSA9IHsgbmFtZTogcmVzaXplLCBlZGdlczogeyBsZWZ0OiB0cnVlLCBib3R0b206IHRydWUgfVxuICAgKlxuICAgKiBpbnRlcmFjdGFibGUucmVmbG93KGRyYWcpXG4gICAqIGludGVyYWN0YWJsZS5yZWZsb3cocmVzaXplKVxuICAgKiBgYGBcbiAgICpcbiAgICogU3RhcnQgYW4gYWN0aW9uIHNlcXVlbmNlIHRvIHJlLWFwcGx5IG1vZGlmaWVycywgY2hlY2sgZHJvcHMsIGV0Yy5cbiAgICpcbiAgICogQHBhcmFtIHsgT2JqZWN0IH0gYWN0aW9uIFRoZSBhY3Rpb24gdG8gYmVnaW5cbiAgICogQHBhcmFtIHsgc3RyaW5nIH0gYWN0aW9uLm5hbWUgVGhlIG5hbWUgb2YgdGhlIGFjdGlvblxuICAgKiBAcmV0dXJucyB7IFByb21pc2U8SW50ZXJhY3RhYmxlPiB9XG4gICAqL1xuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLnJlZmxvdyA9IGZ1bmN0aW9uIChhY3Rpb24pIHtcbiAgICByZXR1cm4gcmVmbG93KHRoaXMsIGFjdGlvbiwgc2NvcGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gcmVmbG93IChpbnRlcmFjdGFibGU6IEludGVyYWN0YWJsZSwgYWN0aW9uOiBBY3Rpb25Qcm9wcywgc2NvcGU6IFNjb3BlKTogUHJvbWlzZTxJbnRlcmFjdGFibGU+IHtcbiAgY29uc3QgZWxlbWVudHMgPSBpcy5zdHJpbmcoaW50ZXJhY3RhYmxlLnRhcmdldClcbiAgICA/IGFyci5mcm9tKGludGVyYWN0YWJsZS5fY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKGludGVyYWN0YWJsZS50YXJnZXQpKVxuICAgIDogW2ludGVyYWN0YWJsZS50YXJnZXRdXG5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lIHZhcmlhYmxlLW5hbWVcbiAgY29uc3QgUHJvbWlzZSA9ICh3aW4ud2luZG93IGFzIGFueSkuUHJvbWlzZVxuICBjb25zdCBwcm9taXNlczogQXJyYXk8UHJvbWlzZTxudWxsPj4gfCBudWxsID0gUHJvbWlzZSA/IFtdIDogbnVsbFxuXG4gIGZvciAoY29uc3QgZWxlbWVudCBvZiBlbGVtZW50cykge1xuICAgIGNvbnN0IHJlY3QgPSBpbnRlcmFjdGFibGUuZ2V0UmVjdChlbGVtZW50KVxuXG4gICAgaWYgKCFyZWN0KSB7IGJyZWFrIH1cblxuICAgIGNvbnN0IHJ1bm5pbmdJbnRlcmFjdGlvbiA9IGFyci5maW5kKFxuICAgICAgc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QsXG4gICAgICAoaW50ZXJhY3Rpb246IEludGVyYWN0aW9uKSA9PiB7XG4gICAgICAgIHJldHVybiBpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpICYmXG4gICAgICAgICAgaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlID09PSBpbnRlcmFjdGFibGUgJiZcbiAgICAgICAgICBpbnRlcmFjdGlvbi5lbGVtZW50ID09PSBlbGVtZW50ICYmXG4gICAgICAgICAgaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSA9PT0gYWN0aW9uLm5hbWVcbiAgICAgIH0pXG4gICAgbGV0IHJlZmxvd1Byb21pc2U6IFByb21pc2U8bnVsbD5cblxuICAgIGlmIChydW5uaW5nSW50ZXJhY3Rpb24pIHtcbiAgICAgIHJ1bm5pbmdJbnRlcmFjdGlvbi5tb3ZlKClcblxuICAgICAgaWYgKHByb21pc2VzKSB7XG4gICAgICAgIHJlZmxvd1Byb21pc2UgPSBydW5uaW5nSW50ZXJhY3Rpb24uX3JlZmxvd1Byb21pc2UgfHwgbmV3IFByb21pc2UoKHJlc29sdmU6IGFueSkgPT4ge1xuICAgICAgICAgIHJ1bm5pbmdJbnRlcmFjdGlvbi5fcmVmbG93UmVzb2x2ZSA9IHJlc29sdmVcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb25zdCB4eXdoID0gcmVjdFV0aWxzLnRsYnJUb1h5d2gocmVjdClcbiAgICAgIGNvbnN0IGNvb3JkcyA9IHtcbiAgICAgICAgcGFnZSAgICAgOiB7IHg6IHh5d2gueCwgeTogeHl3aC55IH0sXG4gICAgICAgIGNsaWVudCAgIDogeyB4OiB4eXdoLngsIHk6IHh5d2gueSB9LFxuICAgICAgICB0aW1lU3RhbXA6IHNjb3BlLm5vdygpLFxuICAgICAgfVxuXG4gICAgICBjb25zdCBldmVudCA9IHBvaW50ZXJVdGlscy5jb29yZHNUb0V2ZW50KGNvb3JkcylcbiAgICAgIHJlZmxvd1Byb21pc2UgPSBzdGFydFJlZmxvdyhzY29wZSwgaW50ZXJhY3RhYmxlLCBlbGVtZW50LCBhY3Rpb24sIGV2ZW50KVxuICAgIH1cblxuICAgIGlmIChwcm9taXNlcykge1xuICAgICAgcHJvbWlzZXMucHVzaChyZWZsb3dQcm9taXNlKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwcm9taXNlcyAmJiBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigoKSA9PiBpbnRlcmFjdGFibGUpXG59XG5cbmZ1bmN0aW9uIHN0YXJ0UmVmbG93IChzY29wZTogU2NvcGUsIGludGVyYWN0YWJsZTogSW50ZXJhY3RhYmxlLCBlbGVtZW50OiBFbGVtZW50LCBhY3Rpb246IEFjdGlvblByb3BzLCBldmVudDogYW55KSB7XG4gIGNvbnN0IGludGVyYWN0aW9uID0gc2NvcGUuaW50ZXJhY3Rpb25zLm5ldyh7IHBvaW50ZXJUeXBlOiAncmVmbG93JyB9KVxuICBjb25zdCBzaWduYWxBcmcgPSB7XG4gICAgaW50ZXJhY3Rpb24sXG4gICAgZXZlbnQsXG4gICAgcG9pbnRlcjogZXZlbnQsXG4gICAgZXZlbnRUYXJnZXQ6IGVsZW1lbnQsXG4gICAgcGhhc2U6IEV2ZW50UGhhc2UuUmVmbG93LFxuICB9XG5cbiAgaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlID0gaW50ZXJhY3RhYmxlXG4gIGludGVyYWN0aW9uLmVsZW1lbnQgPSBlbGVtZW50XG4gIGludGVyYWN0aW9uLnByZXBhcmVkID0gZXh0ZW5kKHt9LCBhY3Rpb24pXG4gIGludGVyYWN0aW9uLnByZXZFdmVudCA9IGV2ZW50XG4gIGludGVyYWN0aW9uLnVwZGF0ZVBvaW50ZXIoZXZlbnQsIGV2ZW50LCBlbGVtZW50LCB0cnVlKVxuXG4gIGludGVyYWN0aW9uLl9kb1BoYXNlKHNpZ25hbEFyZylcblxuICBjb25zdCByZWZsb3dQcm9taXNlID0gKHdpbi53aW5kb3cgYXMgdW5rbm93biBhcyBhbnkpLlByb21pc2VcbiAgICA/IG5ldyAod2luLndpbmRvdyBhcyB1bmtub3duIGFzIGFueSkuUHJvbWlzZSgocmVzb2x2ZTogYW55KSA9PiB7XG4gICAgICBpbnRlcmFjdGlvbi5fcmVmbG93UmVzb2x2ZSA9IHJlc29sdmVcbiAgICB9KVxuICAgIDogbnVsbFxuXG4gIGludGVyYWN0aW9uLl9yZWZsb3dQcm9taXNlID0gcmVmbG93UHJvbWlzZVxuICBpbnRlcmFjdGlvbi5zdGFydChhY3Rpb24sIGludGVyYWN0YWJsZSwgZWxlbWVudClcblxuICBpZiAoaW50ZXJhY3Rpb24uX2ludGVyYWN0aW5nKSB7XG4gICAgaW50ZXJhY3Rpb24ubW92ZShzaWduYWxBcmcpXG4gICAgaW50ZXJhY3Rpb24uZW5kKGV2ZW50KVxuICB9XG4gIGVsc2Uge1xuICAgIGludGVyYWN0aW9uLnN0b3AoKVxuICB9XG5cbiAgaW50ZXJhY3Rpb24ucmVtb3ZlUG9pbnRlcihldmVudCwgZXZlbnQpXG4gIGludGVyYWN0aW9uLnBvaW50ZXJJc0Rvd24gPSBmYWxzZVxuXG4gIHJldHVybiByZWZsb3dQcm9taXNlXG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgaWQ6ICdyZWZsb3cnLFxuICBpbnN0YWxsLFxufSBhcyBJbnRlcmFjdC5QbHVnaW5cbiJdfQ==