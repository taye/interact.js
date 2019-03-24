import * as utils from '@interactjs/utils';
import DropEvent from './DropEvent';
function install(scope) {
    const { actions, 
    /** @lends module:interact */
    interact, 
    /** @lends Interactable */
    Interactable, // eslint-disable-line no-shadow
    interactions, defaults, } = scope;
    interactions.signals.on('before-action-start', ({ interaction }) => {
        if (interaction.prepared.name !== 'drag') {
            return;
        }
        interaction.dropState = {
            cur: {
                dropzone: null,
                element: null,
            },
            prev: {
                dropzone: null,
                element: null,
            },
            rejected: null,
            events: null,
            activeDrops: null,
        };
    });
    interactions.signals.on('after-action-start', ({ interaction, event, iEvent: dragEvent }) => {
        if (interaction.prepared.name !== 'drag') {
            return;
        }
        const { dropState } = interaction;
        // reset active dropzones
        dropState.activeDrops = null;
        dropState.events = null;
        dropState.activeDrops = getActiveDrops(scope, interaction.element);
        dropState.events = getDropEvents(interaction, event, dragEvent);
        if (dropState.events.activate) {
            fireActivationEvents(dropState.activeDrops, dropState.events.activate);
        }
    });
    // FIXME proper signal types
    interactions.signals.on('action-move', (arg) => onEventCreated(arg, scope));
    interactions.signals.on('action-end', (arg) => onEventCreated(arg, scope));
    interactions.signals.on('after-action-move', ({ interaction }) => {
        if (interaction.prepared.name !== 'drag') {
            return;
        }
        fireDropEvents(interaction, interaction.dropState.events);
        interaction.dropState.events = {};
    });
    interactions.signals.on('after-action-end', ({ interaction }) => {
        if (interaction.prepared.name !== 'drag') {
            return;
        }
        fireDropEvents(interaction, interaction.dropState.events);
    });
    interactions.signals.on('stop', ({ interaction }) => {
        if (interaction.prepared.name !== 'drag') {
            return;
        }
        const { dropState } = interaction;
        dropState.activeDrops = null;
        dropState.events = null;
        dropState.cur.dropzone = null;
        dropState.cur.element = null;
        dropState.prev.dropzone = null;
        dropState.prev.element = null;
        dropState.rejected = false;
    });
    /**
     *
     * ```js
     * interact('.drop').dropzone({
     *   accept: '.can-drop' || document.getElementById('single-drop'),
     *   overlap: 'pointer' || 'center' || zeroToOne
     * }
     * ```
     *
     * Returns or sets whether draggables can be dropped onto this target to
     * trigger drop events
     *
     * Dropzones can receive the following events:
     *  - `dropactivate` and `dropdeactivate` when an acceptable drag starts and ends
     *  - `dragenter` and `dragleave` when a draggable enters and leaves the dropzone
     *  - `dragmove` when a draggable that has entered the dropzone is moved
     *  - `drop` when a draggable is dropped into this dropzone
     *
     * Use the `accept` option to allow only elements that match the given CSS
     * selector or element. The value can be:
     *
     *  - **an Element** - only that element can be dropped into this dropzone.
     *  - **a string**, - the element being dragged must match it as a CSS selector.
     *  - **`null`** - accept options is cleared - it accepts any element.
     *
     * Use the `overlap` option to set how drops are checked for. The allowed
     * values are:
     *
     *   - `'pointer'`, the pointer must be over the dropzone (default)
     *   - `'center'`, the draggable element's center must be over the dropzone
     *   - a number from 0-1 which is the `(intersection area) / (draggable area)`.
     *   e.g. `0.5` for drop to happen when half of the area of the draggable is
     *   over the dropzone
     *
     * Use the `checker` option to specify a function to check if a dragged element
     * is over this Interactable.
     *
     * @param {boolean | object | null} [options] The new options to be set.
     * @return {boolean | Interactable} The current setting or this Interactable
     */
    Interactable.prototype.dropzone = function (options) {
        return dropzoneMethod(this, options);
    };
    /**
     * ```js
     * interact(target)
     * .dropChecker(function(dragEvent,         // related dragmove or dragend event
     *                       event,             // TouchEvent/PointerEvent/MouseEvent
     *                       dropped,           // bool result of the default checker
     *                       dropzone,          // dropzone Interactable
     *                       dropElement,       // dropzone elemnt
     *                       draggable,         // draggable Interactable
     *                       draggableElement) {// draggable element
     *
     *   return dropped && event.target.hasAttribute('allow-drop');
     * }
     * ```
     */
    Interactable.prototype.dropCheck = function (dragEvent, event, draggable, draggableElement, dropElement, rect) {
        return dropCheckMethod(this, dragEvent, event, draggable, draggableElement, dropElement, rect);
    };
    /**
     * Returns or sets whether the dimensions of dropzone elements are calculated
     * on every dragmove or only on dragstart for the default dropChecker
     *
     * @param {boolean} [newValue] True to check on each move. False to check only
     * before start
     * @return {boolean | interact} The current setting or interact
     */
    interact.dynamicDrop = function (newValue) {
        if (utils.is.bool(newValue)) {
            // if (dragging && scope.dynamicDrop !== newValue && !newValue) {
            //  calcRects(dropzones);
            // }
            scope.dynamicDrop = newValue;
            return interact;
        }
        return scope.dynamicDrop;
    };
    utils.arr.merge(actions.eventTypes, [
        'dragenter',
        'dragleave',
        'dropactivate',
        'dropdeactivate',
        'dropmove',
        'drop',
    ]);
    actions.methodDict.drop = 'dropzone';
    scope.dynamicDrop = false;
    defaults.actions.drop = drop.defaults;
}
function collectDrops({ interactables }, draggableElement) {
    const drops = [];
    // collect all dropzones and their elements which qualify for a drop
    for (const dropzone of interactables.list) {
        if (!dropzone.options.drop.enabled) {
            continue;
        }
        const accept = dropzone.options.drop.accept;
        // test the draggable draggableElement against the dropzone's accept setting
        if ((utils.is.element(accept) && accept !== draggableElement) ||
            (utils.is.string(accept) &&
                !utils.dom.matchesSelector(draggableElement, accept)) ||
            (utils.is.func(accept) && !accept({ dropzone, draggableElement }))) {
            continue;
        }
        // query for new elements if necessary
        const dropElements = utils.is.string(dropzone.target)
            ? dropzone._context.querySelectorAll(dropzone.target)
            : utils.is.array(dropzone.target) ? dropzone.target : [dropzone.target];
        for (const dropzoneElement of dropElements) {
            if (dropzoneElement !== draggableElement) {
                drops.push({
                    dropzone,
                    element: dropzoneElement,
                });
            }
        }
    }
    return drops;
}
function fireActivationEvents(activeDrops, event) {
    // loop through all active dropzones and trigger event
    for (const { dropzone, element } of activeDrops) {
        event.dropzone = dropzone;
        // set current element as event target
        event.target = element;
        dropzone.fire(event);
        event.propagationStopped = event.immediatePropagationStopped = false;
    }
}
// return a new array of possible drops. getActiveDrops should always be
// called when a drag has just started or a drag event happens while
// dynamicDrop is true
function getActiveDrops(scope, dragElement) {
    // get dropzones and their elements that could receive the draggable
    const activeDrops = collectDrops(scope, dragElement);
    for (const activeDrop of activeDrops) {
        activeDrop.rect = activeDrop.dropzone.getRect(activeDrop.element);
    }
    return activeDrops;
}
function getDrop({ dropState, interactable: draggable, element: dragElement }, dragEvent, pointerEvent) {
    const validDrops = [];
    // collect all dropzones and their elements which qualify for a drop
    for (const { dropzone, element: dropzoneElement, rect } of dropState.activeDrops) {
        validDrops.push(dropzone.dropCheck(dragEvent, pointerEvent, draggable, dragElement, dropzoneElement, rect)
            ? dropzoneElement
            : null);
    }
    // get the most appropriate dropzone based on DOM depth and order
    const dropIndex = utils.dom.indexOfDeepestElement(validDrops);
    return dropState.activeDrops[dropIndex] || null;
}
function getDropEvents(interaction, _pointerEvent, dragEvent) {
    const { dropState } = interaction;
    const dropEvents = {
        enter: null,
        leave: null,
        activate: null,
        deactivate: null,
        move: null,
        drop: null,
    };
    if (dragEvent.type === 'dragstart') {
        dropEvents.activate = new DropEvent(dropState, dragEvent, 'dropactivate');
        dropEvents.activate.target = null;
        dropEvents.activate.dropzone = null;
    }
    if (dragEvent.type === 'dragend') {
        dropEvents.deactivate = new DropEvent(dropState, dragEvent, 'dropdeactivate');
        dropEvents.deactivate.target = null;
        dropEvents.deactivate.dropzone = null;
    }
    if (dropState.rejected) {
        return dropEvents;
    }
    if (dropState.cur.element !== dropState.prev.element) {
        // if there was a previous dropzone, create a dragleave event
        if (dropState.prev.dropzone) {
            dropEvents.leave = new DropEvent(dropState, dragEvent, 'dragleave');
            dragEvent.dragLeave = dropEvents.leave.target = dropState.prev.element;
            dragEvent.prevDropzone = dropEvents.leave.dropzone = dropState.prev.dropzone;
        }
        // if dropzone is not null, create a dragenter event
        if (dropState.cur.dropzone) {
            dropEvents.enter = new DropEvent(dropState, dragEvent, 'dragenter');
            dragEvent.dragEnter = dropState.cur.element;
            dragEvent.dropzone = dropState.cur.dropzone;
        }
    }
    if (dragEvent.type === 'dragend' && dropState.cur.dropzone) {
        dropEvents.drop = new DropEvent(dropState, dragEvent, 'drop');
        dragEvent.dropzone = dropState.cur.dropzone;
        dragEvent.relatedTarget = dropState.cur.element;
    }
    if (dragEvent.type === 'dragmove' && dropState.cur.dropzone) {
        dropEvents.move = new DropEvent(dropState, dragEvent, 'dropmove');
        dropEvents.move.dragmove = dragEvent;
        dragEvent.dropzone = dropState.cur.dropzone;
    }
    return dropEvents;
}
function fireDropEvents(interaction, events) {
    const { dropState } = interaction;
    const { activeDrops, cur, prev, } = dropState;
    if (events.leave) {
        prev.dropzone.fire(events.leave);
    }
    if (events.move) {
        cur.dropzone.fire(events.move);
    }
    if (events.enter) {
        cur.dropzone.fire(events.enter);
    }
    if (events.drop) {
        cur.dropzone.fire(events.drop);
    }
    if (events.deactivate) {
        fireActivationEvents(activeDrops, events.deactivate);
    }
    dropState.prev.dropzone = cur.dropzone;
    dropState.prev.element = cur.element;
}
function onEventCreated({ interaction, iEvent, event }, scope) {
    if (iEvent.type !== 'dragmove' && iEvent.type !== 'dragend') {
        return;
    }
    const { dropState } = interaction;
    if (scope.dynamicDrop) {
        dropState.activeDrops = getActiveDrops(scope, interaction.element);
    }
    const dragEvent = iEvent;
    const dropResult = getDrop(interaction, dragEvent, event);
    // update rejected status
    dropState.rejected = dropState.rejected &&
        !!dropResult &&
        dropResult.dropzone === dropState.cur.dropzone &&
        dropResult.element === dropState.cur.element;
    dropState.cur.dropzone = dropResult && dropResult.dropzone;
    dropState.cur.element = dropResult && dropResult.element;
    dropState.events = getDropEvents(interaction, event, dragEvent);
}
function dropzoneMethod(interactable, options) {
    if (utils.is.object(options)) {
        interactable.options.drop.enabled = options.enabled !== false;
        if (options.listeners) {
            const normalized = utils.normalizeListeners(options.listeners);
            // rename 'drop' to '' as it will be prefixed with 'drop'
            const corrected = Object.keys(normalized).reduce((acc, type) => {
                const correctedType = /^(enter|leave)/.test(type)
                    ? `drag${type}`
                    : /^(activate|deactivate|move)/.test(type)
                        ? `drop${type}`
                        : type;
                acc[correctedType] = normalized[type];
                return acc;
            }, {});
            interactable.off(interactable.options.drop.listeners);
            interactable.on(corrected);
            interactable.options.drop.listeners = corrected;
        }
        if (utils.is.func(options.ondrop)) {
            interactable.on('drop', options.ondrop);
        }
        if (utils.is.func(options.ondropactivate)) {
            interactable.on('dropactivate', options.ondropactivate);
        }
        if (utils.is.func(options.ondropdeactivate)) {
            interactable.on('dropdeactivate', options.ondropdeactivate);
        }
        if (utils.is.func(options.ondragenter)) {
            interactable.on('dragenter', options.ondragenter);
        }
        if (utils.is.func(options.ondragleave)) {
            interactable.on('dragleave', options.ondragleave);
        }
        if (utils.is.func(options.ondropmove)) {
            interactable.on('dropmove', options.ondropmove);
        }
        if (/^(pointer|center)$/.test(options.overlap)) {
            interactable.options.drop.overlap = options.overlap;
        }
        else if (utils.is.number(options.overlap)) {
            interactable.options.drop.overlap = Math.max(Math.min(1, options.overlap), 0);
        }
        if ('accept' in options) {
            interactable.options.drop.accept = options.accept;
        }
        if ('checker' in options) {
            interactable.options.drop.checker = options.checker;
        }
        return interactable;
    }
    if (utils.is.bool(options)) {
        interactable.options.drop.enabled = options;
        return interactable;
    }
    return interactable.options.drop;
}
function dropCheckMethod(interactable, dragEvent, event, draggable, draggableElement, dropElement, rect) {
    let dropped = false;
    // if the dropzone has no rect (eg. display: none)
    // call the custom dropChecker or just return false
    if (!(rect = rect || interactable.getRect(dropElement))) {
        return (interactable.options.drop.checker
            ? interactable.options.drop.checker(dragEvent, event, dropped, interactable, dropElement, draggable, draggableElement)
            : false);
    }
    const dropOverlap = interactable.options.drop.overlap;
    if (dropOverlap === 'pointer') {
        const origin = utils.getOriginXY(draggable, draggableElement, 'drag');
        const page = utils.pointer.getPageXY(dragEvent);
        page.x += origin.x;
        page.y += origin.y;
        const horizontal = (page.x > rect.left) && (page.x < rect.right);
        const vertical = (page.y > rect.top) && (page.y < rect.bottom);
        dropped = horizontal && vertical;
    }
    const dragRect = draggable.getRect(draggableElement);
    if (dragRect && dropOverlap === 'center') {
        const cx = dragRect.left + dragRect.width / 2;
        const cy = dragRect.top + dragRect.height / 2;
        dropped = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
    }
    if (dragRect && utils.is.number(dropOverlap)) {
        const overlapArea = (Math.max(0, Math.min(rect.right, dragRect.right) - Math.max(rect.left, dragRect.left)) *
            Math.max(0, Math.min(rect.bottom, dragRect.bottom) - Math.max(rect.top, dragRect.top)));
        const overlapRatio = overlapArea / (dragRect.width * dragRect.height);
        dropped = overlapRatio >= dropOverlap;
    }
    if (interactable.options.drop.checker) {
        dropped = interactable.options.drop.checker(dragEvent, event, dropped, interactable, dropElement, draggable, draggableElement);
    }
    return dropped;
}
const drop = {
    id: 'actions/draop',
    install,
    getActiveDrops,
    getDrop,
    getDropEvents,
    fireDropEvents,
    defaults: {
        enabled: false,
        accept: null,
        overlap: 'pointer',
    },
};
export default drop;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBQzFDLE9BQU8sU0FBUyxNQUFNLGFBQWEsQ0FBQTtBQTZEbkMsU0FBUyxPQUFPLENBQUUsS0FBWTtJQUM1QixNQUFNLEVBQ0osT0FBTztJQUNQLDZCQUE2QjtJQUM3QixRQUFRO0lBQ1IsMEJBQTBCO0lBQzFCLFlBQVksRUFBRSxnQ0FBZ0M7SUFDOUMsWUFBWSxFQUNaLFFBQVEsR0FDVCxHQUFHLEtBQUssQ0FBQTtJQUVULFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFO1FBQ2pFLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO1lBQUUsT0FBTTtTQUFFO1FBRXBELFdBQVcsQ0FBQyxTQUFTLEdBQUc7WUFDdEIsR0FBRyxFQUFFO2dCQUNILFFBQVEsRUFBRSxJQUFJO2dCQUNkLE9BQU8sRUFBRSxJQUFJO2FBQ2Q7WUFDRCxJQUFJLEVBQUU7Z0JBQ0osUUFBUSxFQUFFLElBQUk7Z0JBQ2QsT0FBTyxFQUFFLElBQUk7YUFDZDtZQUNELFFBQVEsRUFBRSxJQUFJO1lBQ2QsTUFBTSxFQUFFLElBQUk7WUFDWixXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFBO0lBQ0gsQ0FBQyxDQUFDLENBQUE7SUFFRixZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRTtRQUMxRixJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtZQUFFLE9BQU07U0FBRTtRQUVwRCxNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsV0FB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QUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNyQyxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUE7S0FDL0g7SUFFRCxPQUFPLE9BQU8sQ0FBQTtBQUNoQixDQUFDO0FBRUQsTUFBTSxJQUFJLEdBQUc7SUFDWCxFQUFFLEVBQUUsZUFBZTtJQUNuQixPQUFPO0lBQ1AsY0FBYztJQUNkLE9BQU87SUFDUCxhQUFhO0lBQ2IsY0FBYztJQUNkLFFBQVEsRUFBRTtRQUNSLE9BQU8sRUFBRSxLQUFLO1FBQ2QsTUFBTSxFQUFHLElBQUk7UUFDYixPQUFPLEVBQUUsU0FBUztLQUNTO0NBQzlCLENBQUE7QUFFRCxlQUFlLElBQUksQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBJbnRlcmFjdGFibGUgZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGFibGUnXG5pbXBvcnQgSW50ZXJhY3RFdmVudCBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0RXZlbnQnXG5pbXBvcnQgeyBTY29wZSB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscydcbmltcG9ydCBEcm9wRXZlbnQgZnJvbSAnLi9Ecm9wRXZlbnQnXG5cbmV4cG9ydCBpbnRlcmZhY2UgRHJvcHpvbmVNZXRob2Qge1xuICAob3B0aW9uczogSW50ZXJhY3QuRHJvcHpvbmVPcHRpb25zIHwgYm9vbGVhbik6IEludGVyYWN0LkludGVyYWN0YWJsZVxuICAoKTogSW50ZXJhY3QuRHJvcHpvbmVPcHRpb25zXG59XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0YWJsZScge1xuICBpbnRlcmZhY2UgSW50ZXJhY3RhYmxlIHtcbiAgICBkcm9wem9uZTogRHJvcHpvbmVNZXRob2RcbiAgICBkcm9wQ2hlY2s6IChcbiAgICAgIGRyYWdFdmVudDogSW50ZXJhY3RFdmVudCxcbiAgICAgIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLFxuICAgICAgZHJhZ2dhYmxlOiBJbnRlcmFjdGFibGUsXG4gICAgICBkcmFnZ2FibGVFbGVtZW50OiBFbGVtZW50LFxuICAgICAgZHJvcEVsZW1lbjogRWxlbWVudCxcbiAgICAgIHJlY3Q6IGFueVxuICAgICkgPT4gYm9vbGVhblxuICB9XG59XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0aW9uJyB7XG4gIGludGVyZmFjZSBJbnRlcmFjdGlvbiB7XG4gICAgZHJvcFN0YXRlPzoge1xuICAgICAgY3VyOiB7XG4gICAgICAgIGRyb3B6b25lOiBJbnRlcmFjdGFibGUsICAgLy8gdGhlIGRyb3B6b25lIGEgZHJhZyB0YXJnZXQgbWlnaHQgYmUgZHJvcHBlZCBpbnRvXG4gICAgICAgIGVsZW1lbnQ6IEVsZW1lbnQsICAgICAgICAgLy8gdGhlIGVsZW1lbnQgYXQgdGhlIHRpbWUgb2YgY2hlY2tpbmdcbiAgICAgIH0sXG4gICAgICBwcmV2OiB7XG4gICAgICAgIGRyb3B6b25lOiBJbnRlcmFjdGFibGUsICAgLy8gdGhlIGRyb3B6b25lIHRoYXQgd2FzIHJlY2VudGx5IGRyYWdnZWQgYXdheSBmcm9tXG4gICAgICAgIGVsZW1lbnQ6IEVsZW1lbnQsICAgICAgICAgLy8gdGhlIGVsZW1lbnQgYXQgdGhlIHRpbWUgb2YgY2hlY2tpbmdcbiAgICAgIH0sXG4gICAgICByZWplY3RlZDogYm9vbGVhbiwgICAgICAgICAgLy8gd2hlYXRoZXIgdGhlIHBvdGVudGlhbCBkcm9wIHdhcyByZWplY3RlZCBmcm9tIGEgbGlzdGVuZXJcbiAgICAgIGV2ZW50czogYW55LCAgICAgICAgICAgICAgICAvLyB0aGUgZHJvcCBldmVudHMgcmVsYXRlZCB0byB0aGUgY3VycmVudCBkcmFnIGV2ZW50XG4gICAgICBhY3RpdmVEcm9wczogQXJyYXk8e1xuICAgICAgICBkcm9wem9uZTogSW50ZXJhY3RhYmxlXG4gICAgICAgIGVsZW1lbnQ6IEVsZW1lbnRcbiAgICAgICAgcmVjdDogSW50ZXJhY3QuUmVjdFxuICAgICAgfT4sXG4gICAgfVxuICB9XG59XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL2RlZmF1bHRPcHRpb25zJyB7XG4gIGludGVyZmFjZSBBY3Rpb25EZWZhdWx0cyB7XG4gICAgZHJvcDogSW50ZXJhY3QuRHJvcHpvbmVPcHRpb25zXG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnIHtcbiAgaW50ZXJmYWNlIFNjb3BlIHtcbiAgICBkeW5hbWljRHJvcD86IGJvb2xlYW5cbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvaW50ZXJhY3QvaW50ZXJhY3QnIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0U3RhdGljIHtcbiAgICBkeW5hbWljRHJvcDogKG5ld1ZhbHVlPzogYm9vbGVhbikgPT4gYm9vbGVhbiB8IEludGVyYWN0LmludGVyYWN0XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5zdGFsbCAoc2NvcGU6IFNjb3BlKSB7XG4gIGNvbnN0IHtcbiAgICBhY3Rpb25zLFxuICAgIC8qKiBAbGVuZHMgbW9kdWxlOmludGVyYWN0ICovXG4gICAgaW50ZXJhY3QsXG4gICAgLyoqIEBsZW5kcyBJbnRlcmFjdGFibGUgKi9cbiAgICBJbnRlcmFjdGFibGUsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2hhZG93XG4gICAgaW50ZXJhY3Rpb25zLFxuICAgIGRlZmF1bHRzLFxuICB9ID0gc2NvcGVcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYmVmb3JlLWFjdGlvbi1zdGFydCcsICh7IGludGVyYWN0aW9uIH0pID0+IHtcbiAgICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ2RyYWcnKSB7IHJldHVybiB9XG5cbiAgICBpbnRlcmFjdGlvbi5kcm9wU3RhdGUgPSB7XG4gICAgICBjdXI6IHtcbiAgICAgICAgZHJvcHpvbmU6IG51bGwsXG4gICAgICAgIGVsZW1lbnQ6IG51bGwsXG4gICAgICB9LFxuICAgICAgcHJldjoge1xuICAgICAgICBkcm9wem9uZTogbnVsbCxcbiAgICAgICAgZWxlbWVudDogbnVsbCxcbiAgICAgIH0sXG4gICAgICByZWplY3RlZDogbnVsbCxcbiAgICAgIGV2ZW50czogbnVsbCxcbiAgICAgIGFjdGl2ZURyb3BzOiBudWxsLFxuICAgIH1cbiAgfSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWZ0ZXItYWN0aW9uLXN0YXJ0JywgKHsgaW50ZXJhY3Rpb24sIGV2ZW50LCBpRXZlbnQ6IGRyYWdFdmVudCB9KSA9PiB7XG4gICAgaWYgKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgIT09ICdkcmFnJykgeyByZXR1cm4gfVxuXG4gICAgY29uc3QgeyBkcm9wU3RhdGUgfSA9IGludGVyYWN0aW9uXG5cbiAgICAvLyByZXNldCBhY3RpdmUgZHJvcHpvbmVzXG4gICAgZHJvcFN0YXRlLmFjdGl2ZURyb3BzID0gbnVsbFxuICAgIGRyb3BTdGF0ZS5ldmVudHMgPSBudWxsXG4gICAgZHJvcFN0YXRlLmFjdGl2ZURyb3BzID0gZ2V0QWN0aXZlRHJvcHMoc2NvcGUsIGludGVyYWN0aW9uLmVsZW1lbnQpXG4gICAgZHJvcFN0YXRlLmV2ZW50cyA9IGdldERyb3BFdmVudHMoaW50ZXJhY3Rpb24sIGV2ZW50LCBkcmFnRXZlbnQpXG5cbiAgICBpZiAoZHJvcFN0YXRlLmV2ZW50cy5hY3RpdmF0ZSkge1xuICAgICAgZmlyZUFjdGl2YXRpb25FdmVudHMoZHJvcFN0YXRlLmFjdGl2ZURyb3BzLCBkcm9wU3RhdGUuZXZlbnRzLmFjdGl2YXRlKVxuICAgIH1cbiAgfSlcblxuICAvLyBGSVhNRSBwcm9wZXIgc2lnbmFsIHR5cGVzXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tbW92ZScsIChhcmcpID0+IG9uRXZlbnRDcmVhdGVkKGFyZyBhcyBhbnksIHNjb3BlKSlcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FjdGlvbi1lbmQnLCAoYXJnKSA9PiBvbkV2ZW50Q3JlYXRlZChhcmcgYXMgYW55LCBzY29wZSkpXG5cbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FmdGVyLWFjdGlvbi1tb3ZlJywgKHsgaW50ZXJhY3Rpb24gfSkgPT4ge1xuICAgIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAnZHJhZycpIHsgcmV0dXJuIH1cblxuICAgIGZpcmVEcm9wRXZlbnRzKGludGVyYWN0aW9uLCBpbnRlcmFjdGlvbi5kcm9wU3RhdGUuZXZlbnRzKVxuICAgIGludGVyYWN0aW9uLmRyb3BTdGF0ZS5ldmVudHMgPSB7fVxuICB9KVxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhZnRlci1hY3Rpb24tZW5kJywgKHsgaW50ZXJhY3Rpb24gfSkgPT4ge1xuICAgIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAnZHJhZycpIHsgcmV0dXJuIH1cblxuICAgIGZpcmVEcm9wRXZlbnRzKGludGVyYWN0aW9uLCBpbnRlcmFjdGlvbi5kcm9wU3RhdGUuZXZlbnRzKVxuICB9KVxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdzdG9wJywgKHsgaW50ZXJhY3Rpb24gfSkgPT4ge1xuICAgIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAnZHJhZycpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IHsgZHJvcFN0YXRlIH0gPSBpbnRlcmFjdGlvblxuXG4gICAgZHJvcFN0YXRlLmFjdGl2ZURyb3BzID0gbnVsbFxuICAgIGRyb3BTdGF0ZS5ldmVudHMgPSBudWxsXG4gICAgZHJvcFN0YXRlLmN1ci5kcm9wem9uZSA9IG51bGxcbiAgICBkcm9wU3RhdGUuY3VyLmVsZW1lbnQgPSBudWxsXG4gICAgZHJvcFN0YXRlLnByZXYuZHJvcHpvbmUgPSBudWxsXG4gICAgZHJvcFN0YXRlLnByZXYuZWxlbWVudCA9IG51bGxcbiAgICBkcm9wU3RhdGUucmVqZWN0ZWQgPSBmYWxzZVxuICB9KVxuXG4gIC8qKlxuICAgKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCgnLmRyb3AnKS5kcm9wem9uZSh7XG4gICAqICAgYWNjZXB0OiAnLmNhbi1kcm9wJyB8fCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2luZ2xlLWRyb3AnKSxcbiAgICogICBvdmVybGFwOiAncG9pbnRlcicgfHwgJ2NlbnRlcicgfHwgemVyb1RvT25lXG4gICAqIH1cbiAgICogYGBgXG4gICAqXG4gICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIGRyYWdnYWJsZXMgY2FuIGJlIGRyb3BwZWQgb250byB0aGlzIHRhcmdldCB0b1xuICAgKiB0cmlnZ2VyIGRyb3AgZXZlbnRzXG4gICAqXG4gICAqIERyb3B6b25lcyBjYW4gcmVjZWl2ZSB0aGUgZm9sbG93aW5nIGV2ZW50czpcbiAgICogIC0gYGRyb3BhY3RpdmF0ZWAgYW5kIGBkcm9wZGVhY3RpdmF0ZWAgd2hlbiBhbiBhY2NlcHRhYmxlIGRyYWcgc3RhcnRzIGFuZCBlbmRzXG4gICAqICAtIGBkcmFnZW50ZXJgIGFuZCBgZHJhZ2xlYXZlYCB3aGVuIGEgZHJhZ2dhYmxlIGVudGVycyBhbmQgbGVhdmVzIHRoZSBkcm9wem9uZVxuICAgKiAgLSBgZHJhZ21vdmVgIHdoZW4gYSBkcmFnZ2FibGUgdGhhdCBoYXMgZW50ZXJlZCB0aGUgZHJvcHpvbmUgaXMgbW92ZWRcbiAgICogIC0gYGRyb3BgIHdoZW4gYSBkcmFnZ2FibGUgaXMgZHJvcHBlZCBpbnRvIHRoaXMgZHJvcHpvbmVcbiAgICpcbiAgICogVXNlIHRoZSBgYWNjZXB0YCBvcHRpb24gdG8gYWxsb3cgb25seSBlbGVtZW50cyB0aGF0IG1hdGNoIHRoZSBnaXZlbiBDU1NcbiAgICogc2VsZWN0b3Igb3IgZWxlbWVudC4gVGhlIHZhbHVlIGNhbiBiZTpcbiAgICpcbiAgICogIC0gKiphbiBFbGVtZW50KiogLSBvbmx5IHRoYXQgZWxlbWVudCBjYW4gYmUgZHJvcHBlZCBpbnRvIHRoaXMgZHJvcHpvbmUuXG4gICAqICAtICoqYSBzdHJpbmcqKiwgLSB0aGUgZWxlbWVudCBiZWluZyBkcmFnZ2VkIG11c3QgbWF0Y2ggaXQgYXMgYSBDU1Mgc2VsZWN0b3IuXG4gICAqICAtICoqYG51bGxgKiogLSBhY2NlcHQgb3B0aW9ucyBpcyBjbGVhcmVkIC0gaXQgYWNjZXB0cyBhbnkgZWxlbWVudC5cbiAgICpcbiAgICogVXNlIHRoZSBgb3ZlcmxhcGAgb3B0aW9uIHRvIHNldCBob3cgZHJvcHMgYXJlIGNoZWNrZWQgZm9yLiBUaGUgYWxsb3dlZFxuICAgKiB2YWx1ZXMgYXJlOlxuICAgKlxuICAgKiAgIC0gYCdwb2ludGVyJ2AsIHRoZSBwb2ludGVyIG11c3QgYmUgb3ZlciB0aGUgZHJvcHpvbmUgKGRlZmF1bHQpXG4gICAqICAgLSBgJ2NlbnRlcidgLCB0aGUgZHJhZ2dhYmxlIGVsZW1lbnQncyBjZW50ZXIgbXVzdCBiZSBvdmVyIHRoZSBkcm9wem9uZVxuICAgKiAgIC0gYSBudW1iZXIgZnJvbSAwLTEgd2hpY2ggaXMgdGhlIGAoaW50ZXJzZWN0aW9uIGFyZWEpIC8gKGRyYWdnYWJsZSBhcmVhKWAuXG4gICAqICAgZS5nLiBgMC41YCBmb3IgZHJvcCB0byBoYXBwZW4gd2hlbiBoYWxmIG9mIHRoZSBhcmVhIG9mIHRoZSBkcmFnZ2FibGUgaXNcbiAgICogICBvdmVyIHRoZSBkcm9wem9uZVxuICAgKlxuICAgKiBVc2UgdGhlIGBjaGVja2VyYCBvcHRpb24gdG8gc3BlY2lmeSBhIGZ1bmN0aW9uIHRvIGNoZWNrIGlmIGEgZHJhZ2dlZCBlbGVtZW50XG4gICAqIGlzIG92ZXIgdGhpcyBJbnRlcmFjdGFibGUuXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbiB8IG9iamVjdCB8IG51bGx9IFtvcHRpb25zXSBUaGUgbmV3IG9wdGlvbnMgdG8gYmUgc2V0LlxuICAgKiBAcmV0dXJuIHtib29sZWFuIHwgSW50ZXJhY3RhYmxlfSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLmRyb3B6b25lID0gZnVuY3Rpb24gKHRoaXM6IEludGVyYWN0LkludGVyYWN0YWJsZSwgb3B0aW9ucz86IEludGVyYWN0LkRyb3B6b25lT3B0aW9ucyB8IGJvb2xlYW4pIHtcbiAgICByZXR1cm4gZHJvcHpvbmVNZXRob2QodGhpcywgb3B0aW9ucylcbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCh0YXJnZXQpXG4gICAqIC5kcm9wQ2hlY2tlcihmdW5jdGlvbihkcmFnRXZlbnQsICAgICAgICAgLy8gcmVsYXRlZCBkcmFnbW92ZSBvciBkcmFnZW5kIGV2ZW50XG4gICAqICAgICAgICAgICAgICAgICAgICAgICBldmVudCwgICAgICAgICAgICAgLy8gVG91Y2hFdmVudC9Qb2ludGVyRXZlbnQvTW91c2VFdmVudFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgZHJvcHBlZCwgICAgICAgICAgIC8vIGJvb2wgcmVzdWx0IG9mIHRoZSBkZWZhdWx0IGNoZWNrZXJcbiAgICogICAgICAgICAgICAgICAgICAgICAgIGRyb3B6b25lLCAgICAgICAgICAvLyBkcm9wem9uZSBJbnRlcmFjdGFibGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgIGRyb3BFbGVtZW50LCAgICAgICAvLyBkcm9wem9uZSBlbGVtbnRcbiAgICogICAgICAgICAgICAgICAgICAgICAgIGRyYWdnYWJsZSwgICAgICAgICAvLyBkcmFnZ2FibGUgSW50ZXJhY3RhYmxlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGVFbGVtZW50KSB7Ly8gZHJhZ2dhYmxlIGVsZW1lbnRcbiAgICpcbiAgICogICByZXR1cm4gZHJvcHBlZCAmJiBldmVudC50YXJnZXQuaGFzQXR0cmlidXRlKCdhbGxvdy1kcm9wJyk7XG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLmRyb3BDaGVjayA9IGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsIGRyYWdFdmVudCwgZXZlbnQsIGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudCwgZHJvcEVsZW1lbnQsIHJlY3QpIHtcbiAgICByZXR1cm4gZHJvcENoZWNrTWV0aG9kKHRoaXMsIGRyYWdFdmVudCwgZXZlbnQsIGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudCwgZHJvcEVsZW1lbnQsIHJlY3QpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgdGhlIGRpbWVuc2lvbnMgb2YgZHJvcHpvbmUgZWxlbWVudHMgYXJlIGNhbGN1bGF0ZWRcbiAgICogb24gZXZlcnkgZHJhZ21vdmUgb3Igb25seSBvbiBkcmFnc3RhcnQgZm9yIHRoZSBkZWZhdWx0IGRyb3BDaGVja2VyXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25ld1ZhbHVlXSBUcnVlIHRvIGNoZWNrIG9uIGVhY2ggbW92ZS4gRmFsc2UgdG8gY2hlY2sgb25seVxuICAgKiBiZWZvcmUgc3RhcnRcbiAgICogQHJldHVybiB7Ym9vbGVhbiB8IGludGVyYWN0fSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIGludGVyYWN0XG4gICAqL1xuICBpbnRlcmFjdC5keW5hbWljRHJvcCA9IGZ1bmN0aW9uIChuZXdWYWx1ZT86IGJvb2xlYW4pIHtcbiAgICBpZiAodXRpbHMuaXMuYm9vbChuZXdWYWx1ZSkpIHtcbiAgICAgIC8vIGlmIChkcmFnZ2luZyAmJiBzY29wZS5keW5hbWljRHJvcCAhPT0gbmV3VmFsdWUgJiYgIW5ld1ZhbHVlKSB7XG4gICAgICAvLyAgY2FsY1JlY3RzKGRyb3B6b25lcyk7XG4gICAgICAvLyB9XG5cbiAgICAgIHNjb3BlLmR5bmFtaWNEcm9wID0gbmV3VmFsdWVcblxuICAgICAgcmV0dXJuIGludGVyYWN0XG4gICAgfVxuICAgIHJldHVybiBzY29wZS5keW5hbWljRHJvcFxuICB9XG5cbiAgdXRpbHMuYXJyLm1lcmdlKGFjdGlvbnMuZXZlbnRUeXBlcywgW1xuICAgICdkcmFnZW50ZXInLFxuICAgICdkcmFnbGVhdmUnLFxuICAgICdkcm9wYWN0aXZhdGUnLFxuICAgICdkcm9wZGVhY3RpdmF0ZScsXG4gICAgJ2Ryb3Btb3ZlJyxcbiAgICAnZHJvcCcsXG4gIF0pXG4gIGFjdGlvbnMubWV0aG9kRGljdC5kcm9wID0gJ2Ryb3B6b25lJ1xuXG4gIHNjb3BlLmR5bmFtaWNEcm9wID0gZmFsc2VcblxuICBkZWZhdWx0cy5hY3Rpb25zLmRyb3AgPSBkcm9wLmRlZmF1bHRzXG59XG5cbmZ1bmN0aW9uIGNvbGxlY3REcm9wcyAoeyBpbnRlcmFjdGFibGVzIH0sIGRyYWdnYWJsZUVsZW1lbnQpIHtcbiAgY29uc3QgZHJvcHMgPSBbXVxuXG4gIC8vIGNvbGxlY3QgYWxsIGRyb3B6b25lcyBhbmQgdGhlaXIgZWxlbWVudHMgd2hpY2ggcXVhbGlmeSBmb3IgYSBkcm9wXG4gIGZvciAoY29uc3QgZHJvcHpvbmUgb2YgaW50ZXJhY3RhYmxlcy5saXN0KSB7XG4gICAgaWYgKCFkcm9wem9uZS5vcHRpb25zLmRyb3AuZW5hYmxlZCkgeyBjb250aW51ZSB9XG5cbiAgICBjb25zdCBhY2NlcHQgPSBkcm9wem9uZS5vcHRpb25zLmRyb3AuYWNjZXB0XG5cbiAgICAvLyB0ZXN0IHRoZSBkcmFnZ2FibGUgZHJhZ2dhYmxlRWxlbWVudCBhZ2FpbnN0IHRoZSBkcm9wem9uZSdzIGFjY2VwdCBzZXR0aW5nXG4gICAgaWYgKCh1dGlscy5pcy5lbGVtZW50KGFjY2VwdCkgJiYgYWNjZXB0ICE9PSBkcmFnZ2FibGVFbGVtZW50KSB8fFxuICAgICAgICAodXRpbHMuaXMuc3RyaW5nKGFjY2VwdCkgJiZcbiAgICAgICAgIXV0aWxzLmRvbS5tYXRjaGVzU2VsZWN0b3IoZHJhZ2dhYmxlRWxlbWVudCwgYWNjZXB0KSkgfHxcbiAgICAgICAgKHV0aWxzLmlzLmZ1bmMoYWNjZXB0KSAmJiAhYWNjZXB0KHsgZHJvcHpvbmUsIGRyYWdnYWJsZUVsZW1lbnQgfSkpKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIC8vIHF1ZXJ5IGZvciBuZXcgZWxlbWVudHMgaWYgbmVjZXNzYXJ5XG4gICAgY29uc3QgZHJvcEVsZW1lbnRzID0gdXRpbHMuaXMuc3RyaW5nKGRyb3B6b25lLnRhcmdldClcbiAgICAgID8gZHJvcHpvbmUuX2NvbnRleHQucXVlcnlTZWxlY3RvckFsbChkcm9wem9uZS50YXJnZXQpXG4gICAgICA6IHV0aWxzLmlzLmFycmF5KGRyb3B6b25lLnRhcmdldCkgPyBkcm9wem9uZS50YXJnZXQgOiBbZHJvcHpvbmUudGFyZ2V0XVxuXG4gICAgZm9yIChjb25zdCBkcm9wem9uZUVsZW1lbnQgb2YgZHJvcEVsZW1lbnRzKSB7XG4gICAgICBpZiAoZHJvcHpvbmVFbGVtZW50ICE9PSBkcmFnZ2FibGVFbGVtZW50KSB7XG4gICAgICAgIGRyb3BzLnB1c2goe1xuICAgICAgICAgIGRyb3B6b25lLFxuICAgICAgICAgIGVsZW1lbnQ6IGRyb3B6b25lRWxlbWVudCxcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZHJvcHNcbn1cblxuZnVuY3Rpb24gZmlyZUFjdGl2YXRpb25FdmVudHMgKGFjdGl2ZURyb3BzLCBldmVudCkge1xuICAvLyBsb29wIHRocm91Z2ggYWxsIGFjdGl2ZSBkcm9wem9uZXMgYW5kIHRyaWdnZXIgZXZlbnRcbiAgZm9yIChjb25zdCB7IGRyb3B6b25lLCBlbGVtZW50IH0gb2YgYWN0aXZlRHJvcHMpIHtcbiAgICBldmVudC5kcm9wem9uZSA9IGRyb3B6b25lXG5cbiAgICAvLyBzZXQgY3VycmVudCBlbGVtZW50IGFzIGV2ZW50IHRhcmdldFxuICAgIGV2ZW50LnRhcmdldCA9IGVsZW1lbnRcbiAgICBkcm9wem9uZS5maXJlKGV2ZW50KVxuICAgIGV2ZW50LnByb3BhZ2F0aW9uU3RvcHBlZCA9IGV2ZW50LmltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCA9IGZhbHNlXG4gIH1cbn1cblxuLy8gcmV0dXJuIGEgbmV3IGFycmF5IG9mIHBvc3NpYmxlIGRyb3BzLiBnZXRBY3RpdmVEcm9wcyBzaG91bGQgYWx3YXlzIGJlXG4vLyBjYWxsZWQgd2hlbiBhIGRyYWcgaGFzIGp1c3Qgc3RhcnRlZCBvciBhIGRyYWcgZXZlbnQgaGFwcGVucyB3aGlsZVxuLy8gZHluYW1pY0Ryb3AgaXMgdHJ1ZVxuZnVuY3Rpb24gZ2V0QWN0aXZlRHJvcHMgKHNjb3BlOiBTY29wZSwgZHJhZ0VsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgLy8gZ2V0IGRyb3B6b25lcyBhbmQgdGhlaXIgZWxlbWVudHMgdGhhdCBjb3VsZCByZWNlaXZlIHRoZSBkcmFnZ2FibGVcbiAgY29uc3QgYWN0aXZlRHJvcHMgPSBjb2xsZWN0RHJvcHMoc2NvcGUsIGRyYWdFbGVtZW50KVxuXG4gIGZvciAoY29uc3QgYWN0aXZlRHJvcCBvZiBhY3RpdmVEcm9wcykge1xuICAgIGFjdGl2ZURyb3AucmVjdCA9IGFjdGl2ZURyb3AuZHJvcHpvbmUuZ2V0UmVjdChhY3RpdmVEcm9wLmVsZW1lbnQpXG4gIH1cblxuICByZXR1cm4gYWN0aXZlRHJvcHNcbn1cblxuZnVuY3Rpb24gZ2V0RHJvcCAoeyBkcm9wU3RhdGUsIGludGVyYWN0YWJsZTogZHJhZ2dhYmxlLCBlbGVtZW50OiBkcmFnRWxlbWVudCB9OiBQYXJ0aWFsPEludGVyYWN0LkludGVyYWN0aW9uPiwgZHJhZ0V2ZW50LCBwb2ludGVyRXZlbnQpIHtcbiAgY29uc3QgdmFsaWREcm9wcyA9IFtdXG5cbiAgLy8gY29sbGVjdCBhbGwgZHJvcHpvbmVzIGFuZCB0aGVpciBlbGVtZW50cyB3aGljaCBxdWFsaWZ5IGZvciBhIGRyb3BcbiAgZm9yIChjb25zdCB7IGRyb3B6b25lLCBlbGVtZW50OiBkcm9wem9uZUVsZW1lbnQsIHJlY3QgfSBvZiBkcm9wU3RhdGUuYWN0aXZlRHJvcHMpIHtcbiAgICB2YWxpZERyb3BzLnB1c2goZHJvcHpvbmUuZHJvcENoZWNrKGRyYWdFdmVudCwgcG9pbnRlckV2ZW50LCBkcmFnZ2FibGUsIGRyYWdFbGVtZW50LCBkcm9wem9uZUVsZW1lbnQsIHJlY3QpXG4gICAgICA/IGRyb3B6b25lRWxlbWVudFxuICAgICAgOiBudWxsKVxuICB9XG5cbiAgLy8gZ2V0IHRoZSBtb3N0IGFwcHJvcHJpYXRlIGRyb3B6b25lIGJhc2VkIG9uIERPTSBkZXB0aCBhbmQgb3JkZXJcbiAgY29uc3QgZHJvcEluZGV4ID0gdXRpbHMuZG9tLmluZGV4T2ZEZWVwZXN0RWxlbWVudCh2YWxpZERyb3BzKVxuXG4gIHJldHVybiBkcm9wU3RhdGUuYWN0aXZlRHJvcHNbZHJvcEluZGV4XSB8fCBudWxsXG59XG5cbmZ1bmN0aW9uIGdldERyb3BFdmVudHMgKGludGVyYWN0aW9uOiBJbnRlcmFjdC5JbnRlcmFjdGlvbiwgX3BvaW50ZXJFdmVudCwgZHJhZ0V2ZW50KSB7XG4gIGNvbnN0IHsgZHJvcFN0YXRlIH0gPSBpbnRlcmFjdGlvblxuICBjb25zdCBkcm9wRXZlbnRzID0ge1xuICAgIGVudGVyICAgICA6IG51bGwsXG4gICAgbGVhdmUgICAgIDogbnVsbCxcbiAgICBhY3RpdmF0ZSAgOiBudWxsLFxuICAgIGRlYWN0aXZhdGU6IG51bGwsXG4gICAgbW92ZSAgICAgIDogbnVsbCxcbiAgICBkcm9wICAgICAgOiBudWxsLFxuICB9XG5cbiAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ3N0YXJ0Jykge1xuICAgIGRyb3BFdmVudHMuYWN0aXZhdGUgPSBuZXcgRHJvcEV2ZW50KGRyb3BTdGF0ZSwgZHJhZ0V2ZW50LCAnZHJvcGFjdGl2YXRlJylcblxuICAgIGRyb3BFdmVudHMuYWN0aXZhdGUudGFyZ2V0ICAgPSBudWxsXG4gICAgZHJvcEV2ZW50cy5hY3RpdmF0ZS5kcm9wem9uZSA9IG51bGxcbiAgfVxuICBpZiAoZHJhZ0V2ZW50LnR5cGUgPT09ICdkcmFnZW5kJykge1xuICAgIGRyb3BFdmVudHMuZGVhY3RpdmF0ZSA9IG5ldyBEcm9wRXZlbnQoZHJvcFN0YXRlLCBkcmFnRXZlbnQsICdkcm9wZGVhY3RpdmF0ZScpXG5cbiAgICBkcm9wRXZlbnRzLmRlYWN0aXZhdGUudGFyZ2V0ICAgPSBudWxsXG4gICAgZHJvcEV2ZW50cy5kZWFjdGl2YXRlLmRyb3B6b25lID0gbnVsbFxuICB9XG5cbiAgaWYgKGRyb3BTdGF0ZS5yZWplY3RlZCkge1xuICAgIHJldHVybiBkcm9wRXZlbnRzXG4gIH1cblxuICBpZiAoZHJvcFN0YXRlLmN1ci5lbGVtZW50ICE9PSBkcm9wU3RhdGUucHJldi5lbGVtZW50KSB7XG4gICAgLy8gaWYgdGhlcmUgd2FzIGEgcHJldmlvdXMgZHJvcHpvbmUsIGNyZWF0ZSBhIGRyYWdsZWF2ZSBldmVudFxuICAgIGlmIChkcm9wU3RhdGUucHJldi5kcm9wem9uZSkge1xuICAgICAgZHJvcEV2ZW50cy5sZWF2ZSA9IG5ldyBEcm9wRXZlbnQoZHJvcFN0YXRlLCBkcmFnRXZlbnQsICdkcmFnbGVhdmUnKVxuXG4gICAgICBkcmFnRXZlbnQuZHJhZ0xlYXZlICAgID0gZHJvcEV2ZW50cy5sZWF2ZS50YXJnZXQgICA9IGRyb3BTdGF0ZS5wcmV2LmVsZW1lbnRcbiAgICAgIGRyYWdFdmVudC5wcmV2RHJvcHpvbmUgPSBkcm9wRXZlbnRzLmxlYXZlLmRyb3B6b25lID0gZHJvcFN0YXRlLnByZXYuZHJvcHpvbmVcbiAgICB9XG4gICAgLy8gaWYgZHJvcHpvbmUgaXMgbm90IG51bGwsIGNyZWF0ZSBhIGRyYWdlbnRlciBldmVudFxuICAgIGlmIChkcm9wU3RhdGUuY3VyLmRyb3B6b25lKSB7XG4gICAgICBkcm9wRXZlbnRzLmVudGVyID0gbmV3IERyb3BFdmVudChkcm9wU3RhdGUsIGRyYWdFdmVudCwgJ2RyYWdlbnRlcicpXG5cbiAgICAgIGRyYWdFdmVudC5kcmFnRW50ZXIgPSBkcm9wU3RhdGUuY3VyLmVsZW1lbnRcbiAgICAgIGRyYWdFdmVudC5kcm9wem9uZSA9IGRyb3BTdGF0ZS5jdXIuZHJvcHpvbmVcbiAgICB9XG4gIH1cblxuICBpZiAoZHJhZ0V2ZW50LnR5cGUgPT09ICdkcmFnZW5kJyAmJiBkcm9wU3RhdGUuY3VyLmRyb3B6b25lKSB7XG4gICAgZHJvcEV2ZW50cy5kcm9wID0gbmV3IERyb3BFdmVudChkcm9wU3RhdGUsIGRyYWdFdmVudCwgJ2Ryb3AnKVxuXG4gICAgZHJhZ0V2ZW50LmRyb3B6b25lID0gZHJvcFN0YXRlLmN1ci5kcm9wem9uZVxuICAgIGRyYWdFdmVudC5yZWxhdGVkVGFyZ2V0ID0gZHJvcFN0YXRlLmN1ci5lbGVtZW50XG4gIH1cbiAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ21vdmUnICYmIGRyb3BTdGF0ZS5jdXIuZHJvcHpvbmUpIHtcbiAgICBkcm9wRXZlbnRzLm1vdmUgPSBuZXcgRHJvcEV2ZW50KGRyb3BTdGF0ZSwgZHJhZ0V2ZW50LCAnZHJvcG1vdmUnKVxuXG4gICAgZHJvcEV2ZW50cy5tb3ZlLmRyYWdtb3ZlID0gZHJhZ0V2ZW50XG4gICAgZHJhZ0V2ZW50LmRyb3B6b25lID0gZHJvcFN0YXRlLmN1ci5kcm9wem9uZVxuICB9XG5cbiAgcmV0dXJuIGRyb3BFdmVudHNcbn1cblxuZnVuY3Rpb24gZmlyZURyb3BFdmVudHMgKGludGVyYWN0aW9uOiBJbnRlcmFjdC5JbnRlcmFjdGlvbiwgZXZlbnRzKSB7XG4gIGNvbnN0IHsgZHJvcFN0YXRlIH0gPSBpbnRlcmFjdGlvblxuICBjb25zdCB7XG4gICAgYWN0aXZlRHJvcHMsXG4gICAgY3VyLFxuICAgIHByZXYsXG4gIH0gPSBkcm9wU3RhdGVcblxuICBpZiAoZXZlbnRzLmxlYXZlKSB7IHByZXYuZHJvcHpvbmUuZmlyZShldmVudHMubGVhdmUpIH1cbiAgaWYgKGV2ZW50cy5tb3ZlKSB7IGN1ci5kcm9wem9uZS5maXJlKGV2ZW50cy5tb3ZlKSB9XG4gIGlmIChldmVudHMuZW50ZXIpIHsgY3VyLmRyb3B6b25lLmZpcmUoZXZlbnRzLmVudGVyKSB9XG4gIGlmIChldmVudHMuZHJvcCkgeyBjdXIuZHJvcHpvbmUuZmlyZShldmVudHMuZHJvcCkgfVxuXG4gIGlmIChldmVudHMuZGVhY3RpdmF0ZSkge1xuICAgIGZpcmVBY3RpdmF0aW9uRXZlbnRzKGFjdGl2ZURyb3BzLCBldmVudHMuZGVhY3RpdmF0ZSlcbiAgfVxuXG4gIGRyb3BTdGF0ZS5wcmV2LmRyb3B6b25lICA9IGN1ci5kcm9wem9uZVxuICBkcm9wU3RhdGUucHJldi5lbGVtZW50ID0gY3VyLmVsZW1lbnRcbn1cblxuZnVuY3Rpb24gb25FdmVudENyZWF0ZWQgKHsgaW50ZXJhY3Rpb24sIGlFdmVudCwgZXZlbnQgfTogSW50ZXJhY3QuU2lnbmFsQXJnLCBzY29wZSkge1xuICBpZiAoaUV2ZW50LnR5cGUgIT09ICdkcmFnbW92ZScgJiYgaUV2ZW50LnR5cGUgIT09ICdkcmFnZW5kJykgeyByZXR1cm4gfVxuXG4gIGNvbnN0IHsgZHJvcFN0YXRlIH0gPSBpbnRlcmFjdGlvblxuXG4gIGlmIChzY29wZS5keW5hbWljRHJvcCkge1xuICAgIGRyb3BTdGF0ZS5hY3RpdmVEcm9wcyA9IGdldEFjdGl2ZURyb3BzKHNjb3BlLCBpbnRlcmFjdGlvbi5lbGVtZW50KVxuICB9XG5cbiAgY29uc3QgZHJhZ0V2ZW50ID0gaUV2ZW50XG4gIGNvbnN0IGRyb3BSZXN1bHQgPSBnZXREcm9wKGludGVyYWN0aW9uLCBkcmFnRXZlbnQsIGV2ZW50KVxuXG4gIC8vIHVwZGF0ZSByZWplY3RlZCBzdGF0dXNcbiAgZHJvcFN0YXRlLnJlamVjdGVkID0gZHJvcFN0YXRlLnJlamVjdGVkICYmXG4gICAgISFkcm9wUmVzdWx0ICYmXG4gICAgZHJvcFJlc3VsdC5kcm9wem9uZSA9PT0gZHJvcFN0YXRlLmN1ci5kcm9wem9uZSAmJlxuICAgIGRyb3BSZXN1bHQuZWxlbWVudCA9PT0gZHJvcFN0YXRlLmN1ci5lbGVtZW50XG5cbiAgZHJvcFN0YXRlLmN1ci5kcm9wem9uZSAgPSBkcm9wUmVzdWx0ICYmIGRyb3BSZXN1bHQuZHJvcHpvbmVcbiAgZHJvcFN0YXRlLmN1ci5lbGVtZW50ID0gZHJvcFJlc3VsdCAmJiBkcm9wUmVzdWx0LmVsZW1lbnRcblxuICBkcm9wU3RhdGUuZXZlbnRzID0gZ2V0RHJvcEV2ZW50cyhpbnRlcmFjdGlvbiwgZXZlbnQsIGRyYWdFdmVudClcbn1cblxuZnVuY3Rpb24gZHJvcHpvbmVNZXRob2QgKGludGVyYWN0YWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlKTogSW50ZXJhY3QuRHJvcHpvbmVPcHRpb25zXG5mdW5jdGlvbiBkcm9wem9uZU1ldGhvZCAoaW50ZXJhY3RhYmxlOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsIG9wdGlvbnM6IEludGVyYWN0LkRyb3B6b25lT3B0aW9ucyB8IGJvb2xlYW4pXG5mdW5jdGlvbiBkcm9wem9uZU1ldGhvZCAoaW50ZXJhY3RhYmxlOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsIG9wdGlvbnM/OiBJbnRlcmFjdC5Ecm9wem9uZU9wdGlvbnMgfCBib29sZWFuKSB7XG4gIGlmICh1dGlscy5pcy5vYmplY3Qob3B0aW9ucykpIHtcbiAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmVuYWJsZWQgPSBvcHRpb25zLmVuYWJsZWQgIT09IGZhbHNlXG5cbiAgICBpZiAob3B0aW9ucy5saXN0ZW5lcnMpIHtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSB1dGlscy5ub3JtYWxpemVMaXN0ZW5lcnMob3B0aW9ucy5saXN0ZW5lcnMpXG4gICAgICAvLyByZW5hbWUgJ2Ryb3AnIHRvICcnIGFzIGl0IHdpbGwgYmUgcHJlZml4ZWQgd2l0aCAnZHJvcCdcbiAgICAgIGNvbnN0IGNvcnJlY3RlZCA9IE9iamVjdC5rZXlzKG5vcm1hbGl6ZWQpLnJlZHVjZSgoYWNjLCB0eXBlKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvcnJlY3RlZFR5cGUgPSAvXihlbnRlcnxsZWF2ZSkvLnRlc3QodHlwZSlcbiAgICAgICAgICA/IGBkcmFnJHt0eXBlfWBcbiAgICAgICAgICA6IC9eKGFjdGl2YXRlfGRlYWN0aXZhdGV8bW92ZSkvLnRlc3QodHlwZSlcbiAgICAgICAgICAgID8gYGRyb3Ake3R5cGV9YFxuICAgICAgICAgICAgOiB0eXBlXG5cbiAgICAgICAgYWNjW2NvcnJlY3RlZFR5cGVdID0gbm9ybWFsaXplZFt0eXBlXVxuXG4gICAgICAgIHJldHVybiBhY2NcbiAgICAgIH0sIHt9KVxuXG4gICAgICBpbnRlcmFjdGFibGUub2ZmKGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AubGlzdGVuZXJzKVxuICAgICAgaW50ZXJhY3RhYmxlLm9uKGNvcnJlY3RlZClcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AubGlzdGVuZXJzID0gY29ycmVjdGVkXG4gICAgfVxuXG4gICAgaWYgKHV0aWxzLmlzLmZ1bmMob3B0aW9ucy5vbmRyb3ApKSB7IGludGVyYWN0YWJsZS5vbignZHJvcCcsIG9wdGlvbnMub25kcm9wKSB9XG4gICAgaWYgKHV0aWxzLmlzLmZ1bmMob3B0aW9ucy5vbmRyb3BhY3RpdmF0ZSkpIHsgaW50ZXJhY3RhYmxlLm9uKCdkcm9wYWN0aXZhdGUnLCBvcHRpb25zLm9uZHJvcGFjdGl2YXRlKSB9XG4gICAgaWYgKHV0aWxzLmlzLmZ1bmMob3B0aW9ucy5vbmRyb3BkZWFjdGl2YXRlKSkgeyBpbnRlcmFjdGFibGUub24oJ2Ryb3BkZWFjdGl2YXRlJywgb3B0aW9ucy5vbmRyb3BkZWFjdGl2YXRlKSB9XG4gICAgaWYgKHV0aWxzLmlzLmZ1bmMob3B0aW9ucy5vbmRyYWdlbnRlcikpIHsgaW50ZXJhY3RhYmxlLm9uKCdkcmFnZW50ZXInLCBvcHRpb25zLm9uZHJhZ2VudGVyKSB9XG4gICAgaWYgKHV0aWxzLmlzLmZ1bmMob3B0aW9ucy5vbmRyYWdsZWF2ZSkpIHsgaW50ZXJhY3RhYmxlLm9uKCdkcmFnbGVhdmUnLCBvcHRpb25zLm9uZHJhZ2xlYXZlKSB9XG4gICAgaWYgKHV0aWxzLmlzLmZ1bmMob3B0aW9ucy5vbmRyb3Btb3ZlKSkgeyBpbnRlcmFjdGFibGUub24oJ2Ryb3Btb3ZlJywgb3B0aW9ucy5vbmRyb3Btb3ZlKSB9XG5cbiAgICBpZiAoL14ocG9pbnRlcnxjZW50ZXIpJC8udGVzdChvcHRpb25zLm92ZXJsYXAgYXMgc3RyaW5nKSkge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5vdmVybGFwID0gb3B0aW9ucy5vdmVybGFwXG4gICAgfVxuICAgIGVsc2UgaWYgKHV0aWxzLmlzLm51bWJlcihvcHRpb25zLm92ZXJsYXApKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLm92ZXJsYXAgPSBNYXRoLm1heChNYXRoLm1pbigxLCBvcHRpb25zLm92ZXJsYXApLCAwKVxuICAgIH1cbiAgICBpZiAoJ2FjY2VwdCcgaW4gb3B0aW9ucykge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5hY2NlcHQgPSBvcHRpb25zLmFjY2VwdFxuICAgIH1cbiAgICBpZiAoJ2NoZWNrZXInIGluIG9wdGlvbnMpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AuY2hlY2tlciA9IG9wdGlvbnMuY2hlY2tlclxuICAgIH1cblxuICAgIHJldHVybiBpbnRlcmFjdGFibGVcbiAgfVxuXG4gIGlmICh1dGlscy5pcy5ib29sKG9wdGlvbnMpKSB7XG4gICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5lbmFibGVkID0gb3B0aW9uc1xuXG4gICAgcmV0dXJuIGludGVyYWN0YWJsZVxuICB9XG5cbiAgcmV0dXJuIGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3Bcbn1cblxuZnVuY3Rpb24gZHJvcENoZWNrTWV0aG9kIChcbiAgaW50ZXJhY3RhYmxlOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsXG4gIGRyYWdFdmVudDogSW50ZXJhY3RFdmVudCxcbiAgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsXG4gIGRyYWdnYWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLFxuICBkcmFnZ2FibGVFbGVtZW50OiBFbGVtZW50LFxuICBkcm9wRWxlbWVudDogRWxlbWVudCxcbiAgcmVjdDogYW55XG4pIHtcbiAgbGV0IGRyb3BwZWQgPSBmYWxzZVxuXG4gIC8vIGlmIHRoZSBkcm9wem9uZSBoYXMgbm8gcmVjdCAoZWcuIGRpc3BsYXk6IG5vbmUpXG4gIC8vIGNhbGwgdGhlIGN1c3RvbSBkcm9wQ2hlY2tlciBvciBqdXN0IHJldHVybiBmYWxzZVxuICBpZiAoIShyZWN0ID0gcmVjdCB8fCBpbnRlcmFjdGFibGUuZ2V0UmVjdChkcm9wRWxlbWVudCkpKSB7XG4gICAgcmV0dXJuIChpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmNoZWNrZXJcbiAgICAgID8gaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5jaGVja2VyKGRyYWdFdmVudCwgZXZlbnQsIGRyb3BwZWQsIGludGVyYWN0YWJsZSwgZHJvcEVsZW1lbnQsIGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudClcbiAgICAgIDogZmFsc2UpXG4gIH1cblxuICBjb25zdCBkcm9wT3ZlcmxhcCA9IGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3Aub3ZlcmxhcFxuXG4gIGlmIChkcm9wT3ZlcmxhcCA9PT0gJ3BvaW50ZXInKSB7XG4gICAgY29uc3Qgb3JpZ2luID0gdXRpbHMuZ2V0T3JpZ2luWFkoZHJhZ2dhYmxlLCBkcmFnZ2FibGVFbGVtZW50LCAnZHJhZycpXG4gICAgY29uc3QgcGFnZSA9IHV0aWxzLnBvaW50ZXIuZ2V0UGFnZVhZKGRyYWdFdmVudClcblxuICAgIHBhZ2UueCArPSBvcmlnaW4ueFxuICAgIHBhZ2UueSArPSBvcmlnaW4ueVxuXG4gICAgY29uc3QgaG9yaXpvbnRhbCA9IChwYWdlLnggPiByZWN0LmxlZnQpICYmIChwYWdlLnggPCByZWN0LnJpZ2h0KVxuICAgIGNvbnN0IHZlcnRpY2FsICAgPSAocGFnZS55ID4gcmVjdC50b3ApICYmIChwYWdlLnkgPCByZWN0LmJvdHRvbSlcblxuICAgIGRyb3BwZWQgPSBob3Jpem9udGFsICYmIHZlcnRpY2FsXG4gIH1cblxuICBjb25zdCBkcmFnUmVjdCA9IGRyYWdnYWJsZS5nZXRSZWN0KGRyYWdnYWJsZUVsZW1lbnQpXG5cbiAgaWYgKGRyYWdSZWN0ICYmIGRyb3BPdmVybGFwID09PSAnY2VudGVyJykge1xuICAgIGNvbnN0IGN4ID0gZHJhZ1JlY3QubGVmdCArIGRyYWdSZWN0LndpZHRoICAvIDJcbiAgICBjb25zdCBjeSA9IGRyYWdSZWN0LnRvcCAgKyBkcmFnUmVjdC5oZWlnaHQgLyAyXG5cbiAgICBkcm9wcGVkID0gY3ggPj0gcmVjdC5sZWZ0ICYmIGN4IDw9IHJlY3QucmlnaHQgJiYgY3kgPj0gcmVjdC50b3AgJiYgY3kgPD0gcmVjdC5ib3R0b21cbiAgfVxuXG4gIGlmIChkcmFnUmVjdCAmJiB1dGlscy5pcy5udW1iZXIoZHJvcE92ZXJsYXApKSB7XG4gICAgY29uc3Qgb3ZlcmxhcEFyZWEgID0gKE1hdGgubWF4KDAsIE1hdGgubWluKHJlY3QucmlnaHQsIGRyYWdSZWN0LnJpZ2h0KSAtIE1hdGgubWF4KHJlY3QubGVmdCwgZHJhZ1JlY3QubGVmdCkpICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5tYXgoMCwgTWF0aC5taW4ocmVjdC5ib3R0b20sIGRyYWdSZWN0LmJvdHRvbSkgLSBNYXRoLm1heChyZWN0LnRvcCwgZHJhZ1JlY3QudG9wKSkpXG5cbiAgICBjb25zdCBvdmVybGFwUmF0aW8gPSBvdmVybGFwQXJlYSAvIChkcmFnUmVjdC53aWR0aCAqIGRyYWdSZWN0LmhlaWdodClcblxuICAgIGRyb3BwZWQgPSBvdmVybGFwUmF0aW8gPj0gZHJvcE92ZXJsYXBcbiAgfVxuXG4gIGlmIChpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmNoZWNrZXIpIHtcbiAgICBkcm9wcGVkID0gaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5jaGVja2VyKGRyYWdFdmVudCwgZXZlbnQsIGRyb3BwZWQsIGludGVyYWN0YWJsZSwgZHJvcEVsZW1lbnQsIGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudClcbiAgfVxuXG4gIHJldHVybiBkcm9wcGVkXG59XG5cbmNvbnN0IGRyb3AgPSB7XG4gIGlkOiAnYWN0aW9ucy9kcmFvcCcsXG4gIGluc3RhbGwsXG4gIGdldEFjdGl2ZURyb3BzLFxuICBnZXREcm9wLFxuICBnZXREcm9wRXZlbnRzLFxuICBmaXJlRHJvcEV2ZW50cyxcbiAgZGVmYXVsdHM6IHtcbiAgICBlbmFibGVkOiBmYWxzZSxcbiAgICBhY2NlcHQgOiBudWxsLFxuICAgIG92ZXJsYXA6ICdwb2ludGVyJyxcbiAgfSBhcyBJbnRlcmFjdC5Ecm9wem9uZU9wdGlvbnMsXG59XG5cbmV4cG9ydCBkZWZhdWx0IGRyb3BcbiJdfQ==