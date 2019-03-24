import * as utils from '@interactjs/utils';
import drag from '../drag';
import DropEvent from './DropEvent';
function install(scope) {
    const { actions, 
    /** @lends module:interact */
    interact, 
    /** @lends Interactable */
    Interactable, // eslint-disable-line no-shadow
    interactions, defaults, } = scope;
    scope.usePlugin(drag);
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
    id: 'actions/drop',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBQzFDLE9BQU8sSUFBSSxNQUFNLFNBQVMsQ0FBQTtBQUMxQixPQUFPLFNBQVMsTUFBTSxhQUFhLENBQUE7QUE2RG5DLFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsTUFBTSxFQUNKLE9BQU87SUFDUCw2QkFBNkI7SUFDN0IsUUFBUTtJQUNSLDBCQUEwQjtJQUMxQixZQUFZLEVBQUUsZ0NBQWdDO0lBQzlDLFlBQVksRUFDWixRQUFRLEdBQ1QsR0FBRyxLQUFLLENBQUE7SUFFVCxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBRXJCLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFO1FBQ2pFLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO1lBQUUsT0FBTTtTQUFFO1FBRXBELFdBQVcsQ0FBQyxTQUFTLEdBQUc7WUFDdEIsR0FBRyxFQUFFO2dCQUNILFFBQVEsRUFBRSxJQUFJO2dCQUNkLE9BQU8sRUFBRSxJQUFJO2FBQ2Q7WUFDRCxJQUFJLEVBQUU7Z0JBQ0osUUFBUSxFQUFFLElBQUk7Z0JBQ2QsT0FBTyxFQUFFLElBQUk7YUFDZDtZQUNELFFBQVEsRUFBRSxJQUFJO1lBQ2QsTUFBTSxFQUFFLElBQUk7WUFDWixXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFBO0lBQ0gsQ0FBQyxDQUFDLENBQUE7SUFFRixZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRTtRQUMxRixJQUFJLFdBQVcsQ0FBQyxRQUFRLENB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QUFRLENBQUMsTUFBTSxDQUFDLENBQUE7UUFFckUsT0FBTyxHQUFHLFlBQVksSUFBSSxXQUFXLENBQUE7S0FDdEM7SUFFRCxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNyQyxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUE7S0FDL0g7SUFFRCxPQUFPLE9BQU8sQ0FBQTtBQUNoQixDQUFDO0FBRUQsTUFBTSxJQUFJLEdBQUc7SUFDWCxFQUFFLEVBQUUsY0FBYztJQUNsQixPQUFPO0lBQ1AsY0FBYztJQUNkLE9BQU87SUFDUCxhQUFhO0lBQ2IsY0FBYztJQUNkLFFBQVEsRUFBRTtRQUNSLE9BQU8sRUFBRSxLQUFLO1FBQ2QsTUFBTSxFQUFHLElBQUk7UUFDYixPQUFPLEVBQUUsU0FBUztLQUNTO0NBQzlCLENBQUE7QUFFRCxlQUFlLElBQUksQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBJbnRlcmFjdGFibGUgZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGFibGUnXG5pbXBvcnQgSW50ZXJhY3RFdmVudCBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0RXZlbnQnXG5pbXBvcnQgeyBTY29wZSB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscydcbmltcG9ydCBkcmFnIGZyb20gJy4uL2RyYWcnXG5pbXBvcnQgRHJvcEV2ZW50IGZyb20gJy4vRHJvcEV2ZW50J1xuXG5leHBvcnQgaW50ZXJmYWNlIERyb3B6b25lTWV0aG9kIHtcbiAgKG9wdGlvbnM6IEludGVyYWN0LkRyb3B6b25lT3B0aW9ucyB8IGJvb2xlYW4pOiBJbnRlcmFjdC5JbnRlcmFjdGFibGVcbiAgKCk6IEludGVyYWN0LkRyb3B6b25lT3B0aW9uc1xufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGFibGUnIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0YWJsZSB7XG4gICAgZHJvcHpvbmU6IERyb3B6b25lTWV0aG9kXG4gICAgZHJvcENoZWNrOiAoXG4gICAgICBkcmFnRXZlbnQ6IEludGVyYWN0RXZlbnQsXG4gICAgICBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSxcbiAgICAgIGRyYWdnYWJsZTogSW50ZXJhY3RhYmxlLFxuICAgICAgZHJhZ2dhYmxlRWxlbWVudDogRWxlbWVudCxcbiAgICAgIGRyb3BFbGVtZW46IEVsZW1lbnQsXG4gICAgICByZWN0OiBhbnlcbiAgICApID0+IGJvb2xlYW5cbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbicge1xuICBpbnRlcmZhY2UgSW50ZXJhY3Rpb24ge1xuICAgIGRyb3BTdGF0ZT86IHtcbiAgICAgIGN1cjoge1xuICAgICAgICBkcm9wem9uZTogSW50ZXJhY3RhYmxlLCAgIC8vIHRoZSBkcm9wem9uZSBhIGRyYWcgdGFyZ2V0IG1pZ2h0IGJlIGRyb3BwZWQgaW50b1xuICAgICAgICBlbGVtZW50OiBFbGVtZW50LCAgICAgICAgIC8vIHRoZSBlbGVtZW50IGF0IHRoZSB0aW1lIG9mIGNoZWNraW5nXG4gICAgICB9LFxuICAgICAgcHJldjoge1xuICAgICAgICBkcm9wem9uZTogSW50ZXJhY3RhYmxlLCAgIC8vIHRoZSBkcm9wem9uZSB0aGF0IHdhcyByZWNlbnRseSBkcmFnZ2VkIGF3YXkgZnJvbVxuICAgICAgICBlbGVtZW50OiBFbGVtZW50LCAgICAgICAgIC8vIHRoZSBlbGVtZW50IGF0IHRoZSB0aW1lIG9mIGNoZWNraW5nXG4gICAgICB9LFxuICAgICAgcmVqZWN0ZWQ6IGJvb2xlYW4sICAgICAgICAgIC8vIHdoZWF0aGVyIHRoZSBwb3RlbnRpYWwgZHJvcCB3YXMgcmVqZWN0ZWQgZnJvbSBhIGxpc3RlbmVyXG4gICAgICBldmVudHM6IGFueSwgICAgICAgICAgICAgICAgLy8gdGhlIGRyb3AgZXZlbnRzIHJlbGF0ZWQgdG8gdGhlIGN1cnJlbnQgZHJhZyBldmVudFxuICAgICAgYWN0aXZlRHJvcHM6IEFycmF5PHtcbiAgICAgICAgZHJvcHpvbmU6IEludGVyYWN0YWJsZVxuICAgICAgICBlbGVtZW50OiBFbGVtZW50XG4gICAgICAgIHJlY3Q6IEludGVyYWN0LlJlY3RcbiAgICAgIH0+LFxuICAgIH1cbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9kZWZhdWx0T3B0aW9ucycge1xuICBpbnRlcmZhY2UgQWN0aW9uRGVmYXVsdHMge1xuICAgIGRyb3A6IEludGVyYWN0LkRyb3B6b25lT3B0aW9uc1xuICB9XG59XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJyB7XG4gIGludGVyZmFjZSBTY29wZSB7XG4gICAgZHluYW1pY0Ryb3A/OiBib29sZWFuXG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2ludGVyYWN0L2ludGVyYWN0JyB7XG4gIGludGVyZmFjZSBJbnRlcmFjdFN0YXRpYyB7XG4gICAgZHluYW1pY0Ryb3A6IChuZXdWYWx1ZT86IGJvb2xlYW4pID0+IGJvb2xlYW4gfCBJbnRlcmFjdC5pbnRlcmFjdFxuICB9XG59XG5cbmZ1bmN0aW9uIGluc3RhbGwgKHNjb3BlOiBTY29wZSkge1xuICBjb25zdCB7XG4gICAgYWN0aW9ucyxcbiAgICAvKiogQGxlbmRzIG1vZHVsZTppbnRlcmFjdCAqL1xuICAgIGludGVyYWN0LFxuICAgIC8qKiBAbGVuZHMgSW50ZXJhY3RhYmxlICovXG4gICAgSW50ZXJhY3RhYmxlLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNoYWRvd1xuICAgIGludGVyYWN0aW9ucyxcbiAgICBkZWZhdWx0cyxcbiAgfSA9IHNjb3BlXG5cbiAgc2NvcGUudXNlUGx1Z2luKGRyYWcpXG5cbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2JlZm9yZS1hY3Rpb24tc3RhcnQnLCAoeyBpbnRlcmFjdGlvbiB9KSA9PiB7XG4gICAgaWYgKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgIT09ICdkcmFnJykgeyByZXR1cm4gfVxuXG4gICAgaW50ZXJhY3Rpb24uZHJvcFN0YXRlID0ge1xuICAgICAgY3VyOiB7XG4gICAgICAgIGRyb3B6b25lOiBudWxsLFxuICAgICAgICBlbGVtZW50OiBudWxsLFxuICAgICAgfSxcbiAgICAgIHByZXY6IHtcbiAgICAgICAgZHJvcHpvbmU6IG51bGwsXG4gICAgICAgIGVsZW1lbnQ6IG51bGwsXG4gICAgICB9LFxuICAgICAgcmVqZWN0ZWQ6IG51bGwsXG4gICAgICBldmVudHM6IG51bGwsXG4gICAgICBhY3RpdmVEcm9wczogbnVsbCxcbiAgICB9XG4gIH0pXG5cbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FmdGVyLWFjdGlvbi1zdGFydCcsICh7IGludGVyYWN0aW9uLCBldmVudCwgaUV2ZW50OiBkcmFnRXZlbnQgfSkgPT4ge1xuICAgIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAnZHJhZycpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IHsgZHJvcFN0YXRlIH0gPSBpbnRlcmFjdGlvblxuXG4gICAgLy8gcmVzZXQgYWN0aXZlIGRyb3B6b25lc1xuICAgIGRyb3BTdGF0ZS5hY3RpdmVEcm9wcyA9IG51bGxcbiAgICBkcm9wU3RhdGUuZXZlbnRzID0gbnVsbFxuICAgIGRyb3BTdGF0ZS5hY3RpdmVEcm9wcyA9IGdldEFjdGl2ZURyb3BzKHNjb3BlLCBpbnRlcmFjdGlvbi5lbGVtZW50KVxuICAgIGRyb3BTdGF0ZS5ldmVudHMgPSBnZXREcm9wRXZlbnRzKGludGVyYWN0aW9uLCBldmVudCwgZHJhZ0V2ZW50KVxuXG4gICAgaWYgKGRyb3BTdGF0ZS5ldmVudHMuYWN0aXZhdGUpIHtcbiAgICAgIGZpcmVBY3RpdmF0aW9uRXZlbnRzKGRyb3BTdGF0ZS5hY3RpdmVEcm9wcywgZHJvcFN0YXRlLmV2ZW50cy5hY3RpdmF0ZSlcbiAgICB9XG4gIH0pXG5cbiAgLy8gRklYTUUgcHJvcGVyIHNpZ25hbCB0eXBlc1xuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLW1vdmUnLCAoYXJnKSA9PiBvbkV2ZW50Q3JlYXRlZChhcmcgYXMgYW55LCBzY29wZSkpXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tZW5kJywgKGFyZykgPT4gb25FdmVudENyZWF0ZWQoYXJnIGFzIGFueSwgc2NvcGUpKVxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhZnRlci1hY3Rpb24tbW92ZScsICh7IGludGVyYWN0aW9uIH0pID0+IHtcbiAgICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ2RyYWcnKSB7IHJldHVybiB9XG5cbiAgICBmaXJlRHJvcEV2ZW50cyhpbnRlcmFjdGlvbiwgaW50ZXJhY3Rpb24uZHJvcFN0YXRlLmV2ZW50cylcbiAgICBpbnRlcmFjdGlvbi5kcm9wU3RhdGUuZXZlbnRzID0ge31cbiAgfSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWZ0ZXItYWN0aW9uLWVuZCcsICh7IGludGVyYWN0aW9uIH0pID0+IHtcbiAgICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ2RyYWcnKSB7IHJldHVybiB9XG5cbiAgICBmaXJlRHJvcEV2ZW50cyhpbnRlcmFjdGlvbiwgaW50ZXJhY3Rpb24uZHJvcFN0YXRlLmV2ZW50cylcbiAgfSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignc3RvcCcsICh7IGludGVyYWN0aW9uIH0pID0+IHtcbiAgICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ2RyYWcnKSB7IHJldHVybiB9XG5cbiAgICBjb25zdCB7IGRyb3BTdGF0ZSB9ID0gaW50ZXJhY3Rpb25cblxuICAgIGRyb3BTdGF0ZS5hY3RpdmVEcm9wcyA9IG51bGxcbiAgICBkcm9wU3RhdGUuZXZlbnRzID0gbnVsbFxuICAgIGRyb3BTdGF0ZS5jdXIuZHJvcHpvbmUgPSBudWxsXG4gICAgZHJvcFN0YXRlLmN1ci5lbGVtZW50ID0gbnVsbFxuICAgIGRyb3BTdGF0ZS5wcmV2LmRyb3B6b25lID0gbnVsbFxuICAgIGRyb3BTdGF0ZS5wcmV2LmVsZW1lbnQgPSBudWxsXG4gICAgZHJvcFN0YXRlLnJlamVjdGVkID0gZmFsc2VcbiAgfSlcblxuICAvKipcbiAgICpcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QoJy5kcm9wJykuZHJvcHpvbmUoe1xuICAgKiAgIGFjY2VwdDogJy5jYW4tZHJvcCcgfHwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NpbmdsZS1kcm9wJyksXG4gICAqICAgb3ZlcmxhcDogJ3BvaW50ZXInIHx8ICdjZW50ZXInIHx8IHplcm9Ub09uZVxuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciBkcmFnZ2FibGVzIGNhbiBiZSBkcm9wcGVkIG9udG8gdGhpcyB0YXJnZXQgdG9cbiAgICogdHJpZ2dlciBkcm9wIGV2ZW50c1xuICAgKlxuICAgKiBEcm9wem9uZXMgY2FuIHJlY2VpdmUgdGhlIGZvbGxvd2luZyBldmVudHM6XG4gICAqICAtIGBkcm9wYWN0aXZhdGVgIGFuZCBgZHJvcGRlYWN0aXZhdGVgIHdoZW4gYW4gYWNjZXB0YWJsZSBkcmFnIHN0YXJ0cyBhbmQgZW5kc1xuICAgKiAgLSBgZHJhZ2VudGVyYCBhbmQgYGRyYWdsZWF2ZWAgd2hlbiBhIGRyYWdnYWJsZSBlbnRlcnMgYW5kIGxlYXZlcyB0aGUgZHJvcHpvbmVcbiAgICogIC0gYGRyYWdtb3ZlYCB3aGVuIGEgZHJhZ2dhYmxlIHRoYXQgaGFzIGVudGVyZWQgdGhlIGRyb3B6b25lIGlzIG1vdmVkXG4gICAqICAtIGBkcm9wYCB3aGVuIGEgZHJhZ2dhYmxlIGlzIGRyb3BwZWQgaW50byB0aGlzIGRyb3B6b25lXG4gICAqXG4gICAqIFVzZSB0aGUgYGFjY2VwdGAgb3B0aW9uIHRvIGFsbG93IG9ubHkgZWxlbWVudHMgdGhhdCBtYXRjaCB0aGUgZ2l2ZW4gQ1NTXG4gICAqIHNlbGVjdG9yIG9yIGVsZW1lbnQuIFRoZSB2YWx1ZSBjYW4gYmU6XG4gICAqXG4gICAqICAtICoqYW4gRWxlbWVudCoqIC0gb25seSB0aGF0IGVsZW1lbnQgY2FuIGJlIGRyb3BwZWQgaW50byB0aGlzIGRyb3B6b25lLlxuICAgKiAgLSAqKmEgc3RyaW5nKiosIC0gdGhlIGVsZW1lbnQgYmVpbmcgZHJhZ2dlZCBtdXN0IG1hdGNoIGl0IGFzIGEgQ1NTIHNlbGVjdG9yLlxuICAgKiAgLSAqKmBudWxsYCoqIC0gYWNjZXB0IG9wdGlvbnMgaXMgY2xlYXJlZCAtIGl0IGFjY2VwdHMgYW55IGVsZW1lbnQuXG4gICAqXG4gICAqIFVzZSB0aGUgYG92ZXJsYXBgIG9wdGlvbiB0byBzZXQgaG93IGRyb3BzIGFyZSBjaGVja2VkIGZvci4gVGhlIGFsbG93ZWRcbiAgICogdmFsdWVzIGFyZTpcbiAgICpcbiAgICogICAtIGAncG9pbnRlcidgLCB0aGUgcG9pbnRlciBtdXN0IGJlIG92ZXIgdGhlIGRyb3B6b25lIChkZWZhdWx0KVxuICAgKiAgIC0gYCdjZW50ZXInYCwgdGhlIGRyYWdnYWJsZSBlbGVtZW50J3MgY2VudGVyIG11c3QgYmUgb3ZlciB0aGUgZHJvcHpvbmVcbiAgICogICAtIGEgbnVtYmVyIGZyb20gMC0xIHdoaWNoIGlzIHRoZSBgKGludGVyc2VjdGlvbiBhcmVhKSAvIChkcmFnZ2FibGUgYXJlYSlgLlxuICAgKiAgIGUuZy4gYDAuNWAgZm9yIGRyb3AgdG8gaGFwcGVuIHdoZW4gaGFsZiBvZiB0aGUgYXJlYSBvZiB0aGUgZHJhZ2dhYmxlIGlzXG4gICAqICAgb3ZlciB0aGUgZHJvcHpvbmVcbiAgICpcbiAgICogVXNlIHRoZSBgY2hlY2tlcmAgb3B0aW9uIHRvIHNwZWNpZnkgYSBmdW5jdGlvbiB0byBjaGVjayBpZiBhIGRyYWdnZWQgZWxlbWVudFxuICAgKiBpcyBvdmVyIHRoaXMgSW50ZXJhY3RhYmxlLlxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW4gfCBvYmplY3QgfCBudWxsfSBbb3B0aW9uc10gVGhlIG5ldyBvcHRpb25zIHRvIGJlIHNldC5cbiAgICogQHJldHVybiB7Ym9vbGVhbiB8IEludGVyYWN0YWJsZX0gVGhlIGN1cnJlbnQgc2V0dGluZyBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5kcm9wem9uZSA9IGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsIG9wdGlvbnM/OiBJbnRlcmFjdC5Ecm9wem9uZU9wdGlvbnMgfCBib29sZWFuKSB7XG4gICAgcmV0dXJuIGRyb3B6b25lTWV0aG9kKHRoaXMsIG9wdGlvbnMpXG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QodGFyZ2V0KVxuICAgKiAuZHJvcENoZWNrZXIoZnVuY3Rpb24oZHJhZ0V2ZW50LCAgICAgICAgIC8vIHJlbGF0ZWQgZHJhZ21vdmUgb3IgZHJhZ2VuZCBldmVudFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQsICAgICAgICAgICAgIC8vIFRvdWNoRXZlbnQvUG9pbnRlckV2ZW50L01vdXNlRXZlbnRcbiAgICogICAgICAgICAgICAgICAgICAgICAgIGRyb3BwZWQsICAgICAgICAgICAvLyBib29sIHJlc3VsdCBvZiB0aGUgZGVmYXVsdCBjaGVja2VyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSwgICAgICAgICAgLy8gZHJvcHpvbmUgSW50ZXJhY3RhYmxlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICBkcm9wRWxlbWVudCwgICAgICAgLy8gZHJvcHpvbmUgZWxlbW50XG4gICAqICAgICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGUsICAgICAgICAgLy8gZHJhZ2dhYmxlIEludGVyYWN0YWJsZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgZHJhZ2dhYmxlRWxlbWVudCkgey8vIGRyYWdnYWJsZSBlbGVtZW50XG4gICAqXG4gICAqICAgcmV0dXJuIGRyb3BwZWQgJiYgZXZlbnQudGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnYWxsb3ctZHJvcCcpO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5kcm9wQ2hlY2sgPSBmdW5jdGlvbiAodGhpczogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBkcmFnRXZlbnQsIGV2ZW50LCBkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQsIGRyb3BFbGVtZW50LCByZWN0KSB7XG4gICAgcmV0dXJuIGRyb3BDaGVja01ldGhvZCh0aGlzLCBkcmFnRXZlbnQsIGV2ZW50LCBkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQsIGRyb3BFbGVtZW50LCByZWN0KVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIHRoZSBkaW1lbnNpb25zIG9mIGRyb3B6b25lIGVsZW1lbnRzIGFyZSBjYWxjdWxhdGVkXG4gICAqIG9uIGV2ZXJ5IGRyYWdtb3ZlIG9yIG9ubHkgb24gZHJhZ3N0YXJ0IGZvciB0aGUgZGVmYXVsdCBkcm9wQ2hlY2tlclxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtuZXdWYWx1ZV0gVHJ1ZSB0byBjaGVjayBvbiBlYWNoIG1vdmUuIEZhbHNlIHRvIGNoZWNrIG9ubHlcbiAgICogYmVmb3JlIHN0YXJ0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW4gfCBpbnRlcmFjdH0gVGhlIGN1cnJlbnQgc2V0dGluZyBvciBpbnRlcmFjdFxuICAgKi9cbiAgaW50ZXJhY3QuZHluYW1pY0Ryb3AgPSBmdW5jdGlvbiAobmV3VmFsdWU/OiBib29sZWFuKSB7XG4gICAgaWYgKHV0aWxzLmlzLmJvb2wobmV3VmFsdWUpKSB7XG4gICAgICAvLyBpZiAoZHJhZ2dpbmcgJiYgc2NvcGUuZHluYW1pY0Ryb3AgIT09IG5ld1ZhbHVlICYmICFuZXdWYWx1ZSkge1xuICAgICAgLy8gIGNhbGNSZWN0cyhkcm9wem9uZXMpO1xuICAgICAgLy8gfVxuXG4gICAgICBzY29wZS5keW5hbWljRHJvcCA9IG5ld1ZhbHVlXG5cbiAgICAgIHJldHVybiBpbnRlcmFjdFxuICAgIH1cbiAgICByZXR1cm4gc2NvcGUuZHluYW1pY0Ryb3BcbiAgfVxuXG4gIHV0aWxzLmFyci5tZXJnZShhY3Rpb25zLmV2ZW50VHlwZXMsIFtcbiAgICAnZHJhZ2VudGVyJyxcbiAgICAnZHJhZ2xlYXZlJyxcbiAgICAnZHJvcGFjdGl2YXRlJyxcbiAgICAnZHJvcGRlYWN0aXZhdGUnLFxuICAgICdkcm9wbW92ZScsXG4gICAgJ2Ryb3AnLFxuICBdKVxuICBhY3Rpb25zLm1ldGhvZERpY3QuZHJvcCA9ICdkcm9wem9uZSdcblxuICBzY29wZS5keW5hbWljRHJvcCA9IGZhbHNlXG5cbiAgZGVmYXVsdHMuYWN0aW9ucy5kcm9wID0gZHJvcC5kZWZhdWx0c1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0RHJvcHMgKHsgaW50ZXJhY3RhYmxlcyB9LCBkcmFnZ2FibGVFbGVtZW50KSB7XG4gIGNvbnN0IGRyb3BzID0gW11cblxuICAvLyBjb2xsZWN0IGFsbCBkcm9wem9uZXMgYW5kIHRoZWlyIGVsZW1lbnRzIHdoaWNoIHF1YWxpZnkgZm9yIGEgZHJvcFxuICBmb3IgKGNvbnN0IGRyb3B6b25lIG9mIGludGVyYWN0YWJsZXMubGlzdCkge1xuICAgIGlmICghZHJvcHpvbmUub3B0aW9ucy5kcm9wLmVuYWJsZWQpIHsgY29udGludWUgfVxuXG4gICAgY29uc3QgYWNjZXB0ID0gZHJvcHpvbmUub3B0aW9ucy5kcm9wLmFjY2VwdFxuXG4gICAgLy8gdGVzdCB0aGUgZHJhZ2dhYmxlIGRyYWdnYWJsZUVsZW1lbnQgYWdhaW5zdCB0aGUgZHJvcHpvbmUncyBhY2NlcHQgc2V0dGluZ1xuICAgIGlmICgodXRpbHMuaXMuZWxlbWVudChhY2NlcHQpICYmIGFjY2VwdCAhPT0gZHJhZ2dhYmxlRWxlbWVudCkgfHxcbiAgICAgICAgKHV0aWxzLmlzLnN0cmluZyhhY2NlcHQpICYmXG4gICAgICAgICF1dGlscy5kb20ubWF0Y2hlc1NlbGVjdG9yKGRyYWdnYWJsZUVsZW1lbnQsIGFjY2VwdCkpIHx8XG4gICAgICAgICh1dGlscy5pcy5mdW5jKGFjY2VwdCkgJiYgIWFjY2VwdCh7IGRyb3B6b25lLCBkcmFnZ2FibGVFbGVtZW50IH0pKSkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICAvLyBxdWVyeSBmb3IgbmV3IGVsZW1lbnRzIGlmIG5lY2Vzc2FyeVxuICAgIGNvbnN0IGRyb3BFbGVtZW50cyA9IHV0aWxzLmlzLnN0cmluZyhkcm9wem9uZS50YXJnZXQpXG4gICAgICA/IGRyb3B6b25lLl9jb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoZHJvcHpvbmUudGFyZ2V0KVxuICAgICAgOiB1dGlscy5pcy5hcnJheShkcm9wem9uZS50YXJnZXQpID8gZHJvcHpvbmUudGFyZ2V0IDogW2Ryb3B6b25lLnRhcmdldF1cblxuICAgIGZvciAoY29uc3QgZHJvcHpvbmVFbGVtZW50IG9mIGRyb3BFbGVtZW50cykge1xuICAgICAgaWYgKGRyb3B6b25lRWxlbWVudCAhPT0gZHJhZ2dhYmxlRWxlbWVudCkge1xuICAgICAgICBkcm9wcy5wdXNoKHtcbiAgICAgICAgICBkcm9wem9uZSxcbiAgICAgICAgICBlbGVtZW50OiBkcm9wem9uZUVsZW1lbnQsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRyb3BzXG59XG5cbmZ1bmN0aW9uIGZpcmVBY3RpdmF0aW9uRXZlbnRzIChhY3RpdmVEcm9wcywgZXZlbnQpIHtcbiAgLy8gbG9vcCB0aHJvdWdoIGFsbCBhY3RpdmUgZHJvcHpvbmVzIGFuZCB0cmlnZ2VyIGV2ZW50XG4gIGZvciAoY29uc3QgeyBkcm9wem9uZSwgZWxlbWVudCB9IG9mIGFjdGl2ZURyb3BzKSB7XG4gICAgZXZlbnQuZHJvcHpvbmUgPSBkcm9wem9uZVxuXG4gICAgLy8gc2V0IGN1cnJlbnQgZWxlbWVudCBhcyBldmVudCB0YXJnZXRcbiAgICBldmVudC50YXJnZXQgPSBlbGVtZW50XG4gICAgZHJvcHpvbmUuZmlyZShldmVudClcbiAgICBldmVudC5wcm9wYWdhdGlvblN0b3BwZWQgPSBldmVudC5pbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQgPSBmYWxzZVxuICB9XG59XG5cbi8vIHJldHVybiBhIG5ldyBhcnJheSBvZiBwb3NzaWJsZSBkcm9wcy4gZ2V0QWN0aXZlRHJvcHMgc2hvdWxkIGFsd2F5cyBiZVxuLy8gY2FsbGVkIHdoZW4gYSBkcmFnIGhhcyBqdXN0IHN0YXJ0ZWQgb3IgYSBkcmFnIGV2ZW50IGhhcHBlbnMgd2hpbGVcbi8vIGR5bmFtaWNEcm9wIGlzIHRydWVcbmZ1bmN0aW9uIGdldEFjdGl2ZURyb3BzIChzY29wZTogU2NvcGUsIGRyYWdFbGVtZW50OiBFbGVtZW50KSB7XG4gIC8vIGdldCBkcm9wem9uZXMgYW5kIHRoZWlyIGVsZW1lbnRzIHRoYXQgY291bGQgcmVjZWl2ZSB0aGUgZHJhZ2dhYmxlXG4gIGNvbnN0IGFjdGl2ZURyb3BzID0gY29sbGVjdERyb3BzKHNjb3BlLCBkcmFnRWxlbWVudClcblxuICBmb3IgKGNvbnN0IGFjdGl2ZURyb3Agb2YgYWN0aXZlRHJvcHMpIHtcbiAgICBhY3RpdmVEcm9wLnJlY3QgPSBhY3RpdmVEcm9wLmRyb3B6b25lLmdldFJlY3QoYWN0aXZlRHJvcC5lbGVtZW50KVxuICB9XG5cbiAgcmV0dXJuIGFjdGl2ZURyb3BzXG59XG5cbmZ1bmN0aW9uIGdldERyb3AgKHsgZHJvcFN0YXRlLCBpbnRlcmFjdGFibGU6IGRyYWdnYWJsZSwgZWxlbWVudDogZHJhZ0VsZW1lbnQgfTogUGFydGlhbDxJbnRlcmFjdC5JbnRlcmFjdGlvbj4sIGRyYWdFdmVudCwgcG9pbnRlckV2ZW50KSB7XG4gIGNvbnN0IHZhbGlkRHJvcHMgPSBbXVxuXG4gIC8vIGNvbGxlY3QgYWxsIGRyb3B6b25lcyBhbmQgdGhlaXIgZWxlbWVudHMgd2hpY2ggcXVhbGlmeSBmb3IgYSBkcm9wXG4gIGZvciAoY29uc3QgeyBkcm9wem9uZSwgZWxlbWVudDogZHJvcHpvbmVFbGVtZW50LCByZWN0IH0gb2YgZHJvcFN0YXRlLmFjdGl2ZURyb3BzKSB7XG4gICAgdmFsaWREcm9wcy5wdXNoKGRyb3B6b25lLmRyb3BDaGVjayhkcmFnRXZlbnQsIHBvaW50ZXJFdmVudCwgZHJhZ2dhYmxlLCBkcmFnRWxlbWVudCwgZHJvcHpvbmVFbGVtZW50LCByZWN0KVxuICAgICAgPyBkcm9wem9uZUVsZW1lbnRcbiAgICAgIDogbnVsbClcbiAgfVxuXG4gIC8vIGdldCB0aGUgbW9zdCBhcHByb3ByaWF0ZSBkcm9wem9uZSBiYXNlZCBvbiBET00gZGVwdGggYW5kIG9yZGVyXG4gIGNvbnN0IGRyb3BJbmRleCA9IHV0aWxzLmRvbS5pbmRleE9mRGVlcGVzdEVsZW1lbnQodmFsaWREcm9wcylcblxuICByZXR1cm4gZHJvcFN0YXRlLmFjdGl2ZURyb3BzW2Ryb3BJbmRleF0gfHwgbnVsbFxufVxuXG5mdW5jdGlvbiBnZXREcm9wRXZlbnRzIChpbnRlcmFjdGlvbjogSW50ZXJhY3QuSW50ZXJhY3Rpb24sIF9wb2ludGVyRXZlbnQsIGRyYWdFdmVudCkge1xuICBjb25zdCB7IGRyb3BTdGF0ZSB9ID0gaW50ZXJhY3Rpb25cbiAgY29uc3QgZHJvcEV2ZW50cyA9IHtcbiAgICBlbnRlciAgICAgOiBudWxsLFxuICAgIGxlYXZlICAgICA6IG51bGwsXG4gICAgYWN0aXZhdGUgIDogbnVsbCxcbiAgICBkZWFjdGl2YXRlOiBudWxsLFxuICAgIG1vdmUgICAgICA6IG51bGwsXG4gICAgZHJvcCAgICAgIDogbnVsbCxcbiAgfVxuXG4gIGlmIChkcmFnRXZlbnQudHlwZSA9PT0gJ2RyYWdzdGFydCcpIHtcbiAgICBkcm9wRXZlbnRzLmFjdGl2YXRlID0gbmV3IERyb3BFdmVudChkcm9wU3RhdGUsIGRyYWdFdmVudCwgJ2Ryb3BhY3RpdmF0ZScpXG5cbiAgICBkcm9wRXZlbnRzLmFjdGl2YXRlLnRhcmdldCAgID0gbnVsbFxuICAgIGRyb3BFdmVudHMuYWN0aXZhdGUuZHJvcHpvbmUgPSBudWxsXG4gIH1cbiAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ2VuZCcpIHtcbiAgICBkcm9wRXZlbnRzLmRlYWN0aXZhdGUgPSBuZXcgRHJvcEV2ZW50KGRyb3BTdGF0ZSwgZHJhZ0V2ZW50LCAnZHJvcGRlYWN0aXZhdGUnKVxuXG4gICAgZHJvcEV2ZW50cy5kZWFjdGl2YXRlLnRhcmdldCAgID0gbnVsbFxuICAgIGRyb3BFdmVudHMuZGVhY3RpdmF0ZS5kcm9wem9uZSA9IG51bGxcbiAgfVxuXG4gIGlmIChkcm9wU3RhdGUucmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gZHJvcEV2ZW50c1xuICB9XG5cbiAgaWYgKGRyb3BTdGF0ZS5jdXIuZWxlbWVudCAhPT0gZHJvcFN0YXRlLnByZXYuZWxlbWVudCkge1xuICAgIC8vIGlmIHRoZXJlIHdhcyBhIHByZXZpb3VzIGRyb3B6b25lLCBjcmVhdGUgYSBkcmFnbGVhdmUgZXZlbnRcbiAgICBpZiAoZHJvcFN0YXRlLnByZXYuZHJvcHpvbmUpIHtcbiAgICAgIGRyb3BFdmVudHMubGVhdmUgPSBuZXcgRHJvcEV2ZW50KGRyb3BTdGF0ZSwgZHJhZ0V2ZW50LCAnZHJhZ2xlYXZlJylcblxuICAgICAgZHJhZ0V2ZW50LmRyYWdMZWF2ZSAgICA9IGRyb3BFdmVudHMubGVhdmUudGFyZ2V0ICAgPSBkcm9wU3RhdGUucHJldi5lbGVtZW50XG4gICAgICBkcmFnRXZlbnQucHJldkRyb3B6b25lID0gZHJvcEV2ZW50cy5sZWF2ZS5kcm9wem9uZSA9IGRyb3BTdGF0ZS5wcmV2LmRyb3B6b25lXG4gICAgfVxuICAgIC8vIGlmIGRyb3B6b25lIGlzIG5vdCBudWxsLCBjcmVhdGUgYSBkcmFnZW50ZXIgZXZlbnRcbiAgICBpZiAoZHJvcFN0YXRlLmN1ci5kcm9wem9uZSkge1xuICAgICAgZHJvcEV2ZW50cy5lbnRlciA9IG5ldyBEcm9wRXZlbnQoZHJvcFN0YXRlLCBkcmFnRXZlbnQsICdkcmFnZW50ZXInKVxuXG4gICAgICBkcmFnRXZlbnQuZHJhZ0VudGVyID0gZHJvcFN0YXRlLmN1ci5lbGVtZW50XG4gICAgICBkcmFnRXZlbnQuZHJvcHpvbmUgPSBkcm9wU3RhdGUuY3VyLmRyb3B6b25lXG4gICAgfVxuICB9XG5cbiAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ2VuZCcgJiYgZHJvcFN0YXRlLmN1ci5kcm9wem9uZSkge1xuICAgIGRyb3BFdmVudHMuZHJvcCA9IG5ldyBEcm9wRXZlbnQoZHJvcFN0YXRlLCBkcmFnRXZlbnQsICdkcm9wJylcblxuICAgIGRyYWdFdmVudC5kcm9wem9uZSA9IGRyb3BTdGF0ZS5jdXIuZHJvcHpvbmVcbiAgICBkcmFnRXZlbnQucmVsYXRlZFRhcmdldCA9IGRyb3BTdGF0ZS5jdXIuZWxlbWVudFxuICB9XG4gIGlmIChkcmFnRXZlbnQudHlwZSA9PT0gJ2RyYWdtb3ZlJyAmJiBkcm9wU3RhdGUuY3VyLmRyb3B6b25lKSB7XG4gICAgZHJvcEV2ZW50cy5tb3ZlID0gbmV3IERyb3BFdmVudChkcm9wU3RhdGUsIGRyYWdFdmVudCwgJ2Ryb3Btb3ZlJylcblxuICAgIGRyb3BFdmVudHMubW92ZS5kcmFnbW92ZSA9IGRyYWdFdmVudFxuICAgIGRyYWdFdmVudC5kcm9wem9uZSA9IGRyb3BTdGF0ZS5jdXIuZHJvcHpvbmVcbiAgfVxuXG4gIHJldHVybiBkcm9wRXZlbnRzXG59XG5cbmZ1bmN0aW9uIGZpcmVEcm9wRXZlbnRzIChpbnRlcmFjdGlvbjogSW50ZXJhY3QuSW50ZXJhY3Rpb24sIGV2ZW50cykge1xuICBjb25zdCB7IGRyb3BTdGF0ZSB9ID0gaW50ZXJhY3Rpb25cbiAgY29uc3Qge1xuICAgIGFjdGl2ZURyb3BzLFxuICAgIGN1cixcbiAgICBwcmV2LFxuICB9ID0gZHJvcFN0YXRlXG5cbiAgaWYgKGV2ZW50cy5sZWF2ZSkgeyBwcmV2LmRyb3B6b25lLmZpcmUoZXZlbnRzLmxlYXZlKSB9XG4gIGlmIChldmVudHMubW92ZSkgeyBjdXIuZHJvcHpvbmUuZmlyZShldmVudHMubW92ZSkgfVxuICBpZiAoZXZlbnRzLmVudGVyKSB7IGN1ci5kcm9wem9uZS5maXJlKGV2ZW50cy5lbnRlcikgfVxuICBpZiAoZXZlbnRzLmRyb3ApIHsgY3VyLmRyb3B6b25lLmZpcmUoZXZlbnRzLmRyb3ApIH1cblxuICBpZiAoZXZlbnRzLmRlYWN0aXZhdGUpIHtcbiAgICBmaXJlQWN0aXZhdGlvbkV2ZW50cyhhY3RpdmVEcm9wcywgZXZlbnRzLmRlYWN0aXZhdGUpXG4gIH1cblxuICBkcm9wU3RhdGUucHJldi5kcm9wem9uZSAgPSBjdXIuZHJvcHpvbmVcbiAgZHJvcFN0YXRlLnByZXYuZWxlbWVudCA9IGN1ci5lbGVtZW50XG59XG5cbmZ1bmN0aW9uIG9uRXZlbnRDcmVhdGVkICh7IGludGVyYWN0aW9uLCBpRXZlbnQsIGV2ZW50IH06IEludGVyYWN0LlNpZ25hbEFyZywgc2NvcGUpIHtcbiAgaWYgKGlFdmVudC50eXBlICE9PSAnZHJhZ21vdmUnICYmIGlFdmVudC50eXBlICE9PSAnZHJhZ2VuZCcpIHsgcmV0dXJuIH1cblxuICBjb25zdCB7IGRyb3BTdGF0ZSB9ID0gaW50ZXJhY3Rpb25cblxuICBpZiAoc2NvcGUuZHluYW1pY0Ryb3ApIHtcbiAgICBkcm9wU3RhdGUuYWN0aXZlRHJvcHMgPSBnZXRBY3RpdmVEcm9wcyhzY29wZSwgaW50ZXJhY3Rpb24uZWxlbWVudClcbiAgfVxuXG4gIGNvbnN0IGRyYWdFdmVudCA9IGlFdmVudFxuICBjb25zdCBkcm9wUmVzdWx0ID0gZ2V0RHJvcChpbnRlcmFjdGlvbiwgZHJhZ0V2ZW50LCBldmVudClcblxuICAvLyB1cGRhdGUgcmVqZWN0ZWQgc3RhdHVzXG4gIGRyb3BTdGF0ZS5yZWplY3RlZCA9IGRyb3BTdGF0ZS5yZWplY3RlZCAmJlxuICAgICEhZHJvcFJlc3VsdCAmJlxuICAgIGRyb3BSZXN1bHQuZHJvcHpvbmUgPT09IGRyb3BTdGF0ZS5jdXIuZHJvcHpvbmUgJiZcbiAgICBkcm9wUmVzdWx0LmVsZW1lbnQgPT09IGRyb3BTdGF0ZS5jdXIuZWxlbWVudFxuXG4gIGRyb3BTdGF0ZS5jdXIuZHJvcHpvbmUgID0gZHJvcFJlc3VsdCAmJiBkcm9wUmVzdWx0LmRyb3B6b25lXG4gIGRyb3BTdGF0ZS5jdXIuZWxlbWVudCA9IGRyb3BSZXN1bHQgJiYgZHJvcFJlc3VsdC5lbGVtZW50XG5cbiAgZHJvcFN0YXRlLmV2ZW50cyA9IGdldERyb3BFdmVudHMoaW50ZXJhY3Rpb24sIGV2ZW50LCBkcmFnRXZlbnQpXG59XG5cbmZ1bmN0aW9uIGRyb3B6b25lTWV0aG9kIChpbnRlcmFjdGFibGU6IEludGVyYWN0LkludGVyYWN0YWJsZSk6IEludGVyYWN0LkRyb3B6b25lT3B0aW9uc1xuZnVuY3Rpb24gZHJvcHpvbmVNZXRob2QgKGludGVyYWN0YWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBvcHRpb25zOiBJbnRlcmFjdC5Ecm9wem9uZU9wdGlvbnMgfCBib29sZWFuKVxuZnVuY3Rpb24gZHJvcHpvbmVNZXRob2QgKGludGVyYWN0YWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBvcHRpb25zPzogSW50ZXJhY3QuRHJvcHpvbmVPcHRpb25zIHwgYm9vbGVhbikge1xuICBpZiAodXRpbHMuaXMub2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkICE9PSBmYWxzZVxuXG4gICAgaWYgKG9wdGlvbnMubGlzdGVuZXJzKSB7XG4gICAgICBjb25zdCBub3JtYWxpemVkID0gdXRpbHMubm9ybWFsaXplTGlzdGVuZXJzKG9wdGlvbnMubGlzdGVuZXJzKVxuICAgICAgLy8gcmVuYW1lICdkcm9wJyB0byAnJyBhcyBpdCB3aWxsIGJlIHByZWZpeGVkIHdpdGggJ2Ryb3AnXG4gICAgICBjb25zdCBjb3JyZWN0ZWQgPSBPYmplY3Qua2V5cyhub3JtYWxpemVkKS5yZWR1Y2UoKGFjYywgdHlwZSkgPT4ge1xuICAgICAgICBjb25zdCBjb3JyZWN0ZWRUeXBlID0gL14oZW50ZXJ8bGVhdmUpLy50ZXN0KHR5cGUpXG4gICAgICAgICAgPyBgZHJhZyR7dHlwZX1gXG4gICAgICAgICAgOiAvXihhY3RpdmF0ZXxkZWFjdGl2YXRlfG1vdmUpLy50ZXN0KHR5cGUpXG4gICAgICAgICAgICA/IGBkcm9wJHt0eXBlfWBcbiAgICAgICAgICAgIDogdHlwZVxuXG4gICAgICAgIGFjY1tjb3JyZWN0ZWRUeXBlXSA9IG5vcm1hbGl6ZWRbdHlwZV1cblxuICAgICAgICByZXR1cm4gYWNjXG4gICAgICB9LCB7fSlcblxuICAgICAgaW50ZXJhY3RhYmxlLm9mZihpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmxpc3RlbmVycylcbiAgICAgIGludGVyYWN0YWJsZS5vbihjb3JyZWN0ZWQpXG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmxpc3RlbmVycyA9IGNvcnJlY3RlZFxuICAgIH1cblxuICAgIGlmICh1dGlscy5pcy5mdW5jKG9wdGlvbnMub25kcm9wKSkgeyBpbnRlcmFjdGFibGUub24oJ2Ryb3AnLCBvcHRpb25zLm9uZHJvcCkgfVxuICAgIGlmICh1dGlscy5pcy5mdW5jKG9wdGlvbnMub25kcm9wYWN0aXZhdGUpKSB7IGludGVyYWN0YWJsZS5vbignZHJvcGFjdGl2YXRlJywgb3B0aW9ucy5vbmRyb3BhY3RpdmF0ZSkgfVxuICAgIGlmICh1dGlscy5pcy5mdW5jKG9wdGlvbnMub25kcm9wZGVhY3RpdmF0ZSkpIHsgaW50ZXJhY3RhYmxlLm9uKCdkcm9wZGVhY3RpdmF0ZScsIG9wdGlvbnMub25kcm9wZGVhY3RpdmF0ZSkgfVxuICAgIGlmICh1dGlscy5pcy5mdW5jKG9wdGlvbnMub25kcmFnZW50ZXIpKSB7IGludGVyYWN0YWJsZS5vbignZHJhZ2VudGVyJywgb3B0aW9ucy5vbmRyYWdlbnRlcikgfVxuICAgIGlmICh1dGlscy5pcy5mdW5jKG9wdGlvbnMub25kcmFnbGVhdmUpKSB7IGludGVyYWN0YWJsZS5vbignZHJhZ2xlYXZlJywgb3B0aW9ucy5vbmRyYWdsZWF2ZSkgfVxuICAgIGlmICh1dGlscy5pcy5mdW5jKG9wdGlvbnMub25kcm9wbW92ZSkpIHsgaW50ZXJhY3RhYmxlLm9uKCdkcm9wbW92ZScsIG9wdGlvbnMub25kcm9wbW92ZSkgfVxuXG4gICAgaWYgKC9eKHBvaW50ZXJ8Y2VudGVyKSQvLnRlc3Qob3B0aW9ucy5vdmVybGFwIGFzIHN0cmluZykpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3Aub3ZlcmxhcCA9IG9wdGlvbnMub3ZlcmxhcFxuICAgIH1cbiAgICBlbHNlIGlmICh1dGlscy5pcy5udW1iZXIob3B0aW9ucy5vdmVybGFwKSkge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5vdmVybGFwID0gTWF0aC5tYXgoTWF0aC5taW4oMSwgb3B0aW9ucy5vdmVybGFwKSwgMClcbiAgICB9XG4gICAgaWYgKCdhY2NlcHQnIGluIG9wdGlvbnMpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AuYWNjZXB0ID0gb3B0aW9ucy5hY2NlcHRcbiAgICB9XG4gICAgaWYgKCdjaGVja2VyJyBpbiBvcHRpb25zKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmNoZWNrZXIgPSBvcHRpb25zLmNoZWNrZXJcbiAgICB9XG5cbiAgICByZXR1cm4gaW50ZXJhY3RhYmxlXG4gIH1cblxuICBpZiAodXRpbHMuaXMuYm9vbChvcHRpb25zKSkge1xuICAgIGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AuZW5hYmxlZCA9IG9wdGlvbnNcblxuICAgIHJldHVybiBpbnRlcmFjdGFibGVcbiAgfVxuXG4gIHJldHVybiBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wXG59XG5cbmZ1bmN0aW9uIGRyb3BDaGVja01ldGhvZCAoXG4gIGludGVyYWN0YWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLFxuICBkcmFnRXZlbnQ6IEludGVyYWN0RXZlbnQsXG4gIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLFxuICBkcmFnZ2FibGU6IEludGVyYWN0LkludGVyYWN0YWJsZSxcbiAgZHJhZ2dhYmxlRWxlbWVudDogRWxlbWVudCxcbiAgZHJvcEVsZW1lbnQ6IEVsZW1lbnQsXG4gIHJlY3Q6IGFueVxuKSB7XG4gIGxldCBkcm9wcGVkID0gZmFsc2VcblxuICAvLyBpZiB0aGUgZHJvcHpvbmUgaGFzIG5vIHJlY3QgKGVnLiBkaXNwbGF5OiBub25lKVxuICAvLyBjYWxsIHRoZSBjdXN0b20gZHJvcENoZWNrZXIgb3IganVzdCByZXR1cm4gZmFsc2VcbiAgaWYgKCEocmVjdCA9IHJlY3QgfHwgaW50ZXJhY3RhYmxlLmdldFJlY3QoZHJvcEVsZW1lbnQpKSkge1xuICAgIHJldHVybiAoaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5jaGVja2VyXG4gICAgICA/IGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AuY2hlY2tlcihkcmFnRXZlbnQsIGV2ZW50LCBkcm9wcGVkLCBpbnRlcmFjdGFibGUsIGRyb3BFbGVtZW50LCBkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQpXG4gICAgICA6IGZhbHNlKVxuICB9XG5cbiAgY29uc3QgZHJvcE92ZXJsYXAgPSBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLm92ZXJsYXBcblxuICBpZiAoZHJvcE92ZXJsYXAgPT09ICdwb2ludGVyJykge1xuICAgIGNvbnN0IG9yaWdpbiA9IHV0aWxzLmdldE9yaWdpblhZKGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudCwgJ2RyYWcnKVxuICAgIGNvbnN0IHBhZ2UgPSB1dGlscy5wb2ludGVyLmdldFBhZ2VYWShkcmFnRXZlbnQpXG5cbiAgICBwYWdlLnggKz0gb3JpZ2luLnhcbiAgICBwYWdlLnkgKz0gb3JpZ2luLnlcblxuICAgIGNvbnN0IGhvcml6b250YWwgPSAocGFnZS54ID4gcmVjdC5sZWZ0KSAmJiAocGFnZS54IDwgcmVjdC5yaWdodClcbiAgICBjb25zdCB2ZXJ0aWNhbCAgID0gKHBhZ2UueSA+IHJlY3QudG9wKSAmJiAocGFnZS55IDwgcmVjdC5ib3R0b20pXG5cbiAgICBkcm9wcGVkID0gaG9yaXpvbnRhbCAmJiB2ZXJ0aWNhbFxuICB9XG5cbiAgY29uc3QgZHJhZ1JlY3QgPSBkcmFnZ2FibGUuZ2V0UmVjdChkcmFnZ2FibGVFbGVtZW50KVxuXG4gIGlmIChkcmFnUmVjdCAmJiBkcm9wT3ZlcmxhcCA9PT0gJ2NlbnRlcicpIHtcbiAgICBjb25zdCBjeCA9IGRyYWdSZWN0LmxlZnQgKyBkcmFnUmVjdC53aWR0aCAgLyAyXG4gICAgY29uc3QgY3kgPSBkcmFnUmVjdC50b3AgICsgZHJhZ1JlY3QuaGVpZ2h0IC8gMlxuXG4gICAgZHJvcHBlZCA9IGN4ID49IHJlY3QubGVmdCAmJiBjeCA8PSByZWN0LnJpZ2h0ICYmIGN5ID49IHJlY3QudG9wICYmIGN5IDw9IHJlY3QuYm90dG9tXG4gIH1cblxuICBpZiAoZHJhZ1JlY3QgJiYgdXRpbHMuaXMubnVtYmVyKGRyb3BPdmVybGFwKSkge1xuICAgIGNvbnN0IG92ZXJsYXBBcmVhICA9IChNYXRoLm1heCgwLCBNYXRoLm1pbihyZWN0LnJpZ2h0LCBkcmFnUmVjdC5yaWdodCkgLSBNYXRoLm1heChyZWN0LmxlZnQsIGRyYWdSZWN0LmxlZnQpKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KDAsIE1hdGgubWluKHJlY3QuYm90dG9tLCBkcmFnUmVjdC5ib3R0b20pIC0gTWF0aC5tYXgocmVjdC50b3AsIGRyYWdSZWN0LnRvcCkpKVxuXG4gICAgY29uc3Qgb3ZlcmxhcFJhdGlvID0gb3ZlcmxhcEFyZWEgLyAoZHJhZ1JlY3Qud2lkdGggKiBkcmFnUmVjdC5oZWlnaHQpXG5cbiAgICBkcm9wcGVkID0gb3ZlcmxhcFJhdGlvID49IGRyb3BPdmVybGFwXG4gIH1cblxuICBpZiAoaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5jaGVja2VyKSB7XG4gICAgZHJvcHBlZCA9IGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AuY2hlY2tlcihkcmFnRXZlbnQsIGV2ZW50LCBkcm9wcGVkLCBpbnRlcmFjdGFibGUsIGRyb3BFbGVtZW50LCBkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQpXG4gIH1cblxuICByZXR1cm4gZHJvcHBlZFxufVxuXG5jb25zdCBkcm9wID0ge1xuICBpZDogJ2FjdGlvbnMvZHJvcCcsXG4gIGluc3RhbGwsXG4gIGdldEFjdGl2ZURyb3BzLFxuICBnZXREcm9wLFxuICBnZXREcm9wRXZlbnRzLFxuICBmaXJlRHJvcEV2ZW50cyxcbiAgZGVmYXVsdHM6IHtcbiAgICBlbmFibGVkOiBmYWxzZSxcbiAgICBhY2NlcHQgOiBudWxsLFxuICAgIG92ZXJsYXA6ICdwb2ludGVyJyxcbiAgfSBhcyBJbnRlcmFjdC5Ecm9wem9uZU9wdGlvbnMsXG59XG5cbmV4cG9ydCBkZWZhdWx0IGRyb3BcbiJdfQ==