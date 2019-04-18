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
     *   return dropped && event.target.hasAttribute('allow-drop')
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
            //  calcRects(dropzones)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBQzFDLE9BQU8sSUFBSSxNQUFNLFNBQVMsQ0FBQTtBQUMxQixPQUFPLFNBQVMsTUFBTSxhQUFhLENBQUE7QUE2RG5DLFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsTUFBTSxFQUNKLE9BQU87SUFDUCw2QkFBNkI7SUFDN0IsUUFBUTtJQUNSLDBCQUEwQjtJQUMxQixZQUFZLEVBQUUsZ0NBQWdDO0lBQzlDLFlBQVksRUFDWixRQUFRLEdBQ1QsR0FBRyxLQUFLLENBQUE7SUFFVCxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBRXJCLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFO1FBQ2pFLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO1lBQUUsT0FBTTtTQUFFO1FBRXBELFdBQVcsQ0FBQyxTQUFTLEdBQUc7WUFDdEIsR0FBRyxFQUFFO2dCQUNILFFBQVEsRUFBRSxJQUFJO2dCQUNkLE9BQU8sRUFBRSxJQUFJO2FBQ2Q7WUFDRCxJQUFJLEVBQUU7Z0JBQ0osUUFBUSxFQUFFLElBQUk7Z0JBQ2QsT0FBTyxFQUFFLElBQUk7YUFDZDtZQUNELFFBQVEsRUFBRSxJQUFJO1lBQ2QsTUFBTSxFQUFFLElBQUk7WUFDWixXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFBO0lBQ0gsQ0FBQyxDQUFDLENBQUE7SUFFRixZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRTtRQUMxRixJQUFJLFdBQVcsQ0FBQyxRQUFRLENB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QUFRLENBQUMsTUFBTSxDQUFDLENBQUE7UUFFckUsT0FBTyxHQUFHLFlBQVksSUFBSSxXQUFXLENBQUE7S0FDdEM7SUFFRCxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNyQyxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUE7S0FDL0g7SUFFRCxPQUFPLE9BQU8sQ0FBQTtBQUNoQixDQUFDO0FBRUQsTUFBTSxJQUFJLEdBQUc7SUFDWCxFQUFFLEVBQUUsY0FBYztJQUNsQixPQUFPO0lBQ1AsY0FBYztJQUNkLE9BQU87SUFDUCxhQUFhO0lBQ2IsY0FBYztJQUNkLFFBQVEsRUFBRTtRQUNSLE9BQU8sRUFBRSxLQUFLO1FBQ2QsTUFBTSxFQUFHLElBQUk7UUFDYixPQUFPLEVBQUUsU0FBUztLQUNTO0NBQzlCLENBQUE7QUFFRCxlQUFlLElBQUksQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBJbnRlcmFjdGFibGUgZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGFibGUnXG5pbXBvcnQgSW50ZXJhY3RFdmVudCBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0RXZlbnQnXG5pbXBvcnQgeyBTY29wZSB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscydcbmltcG9ydCBkcmFnIGZyb20gJy4uL2RyYWcnXG5pbXBvcnQgRHJvcEV2ZW50IGZyb20gJy4vRHJvcEV2ZW50J1xuXG5leHBvcnQgaW50ZXJmYWNlIERyb3B6b25lTWV0aG9kIHtcbiAgKG9wdGlvbnM6IEludGVyYWN0LkRyb3B6b25lT3B0aW9ucyB8IGJvb2xlYW4pOiBJbnRlcmFjdC5JbnRlcmFjdGFibGVcbiAgKCk6IEludGVyYWN0LkRyb3B6b25lT3B0aW9uc1xufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGFibGUnIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0YWJsZSB7XG4gICAgZHJvcHpvbmU6IERyb3B6b25lTWV0aG9kXG4gICAgZHJvcENoZWNrOiAoXG4gICAgICBkcmFnRXZlbnQ6IEludGVyYWN0RXZlbnQsXG4gICAgICBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSxcbiAgICAgIGRyYWdnYWJsZTogSW50ZXJhY3RhYmxlLFxuICAgICAgZHJhZ2dhYmxlRWxlbWVudDogRWxlbWVudCxcbiAgICAgIGRyb3BFbGVtZW46IEVsZW1lbnQsXG4gICAgICByZWN0OiBhbnlcbiAgICApID0+IGJvb2xlYW5cbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbicge1xuICBpbnRlcmZhY2UgSW50ZXJhY3Rpb24ge1xuICAgIGRyb3BTdGF0ZT86IHtcbiAgICAgIGN1cjoge1xuICAgICAgICBkcm9wem9uZTogSW50ZXJhY3RhYmxlLCAgIC8vIHRoZSBkcm9wem9uZSBhIGRyYWcgdGFyZ2V0IG1pZ2h0IGJlIGRyb3BwZWQgaW50b1xuICAgICAgICBlbGVtZW50OiBFbGVtZW50LCAgICAgICAgIC8vIHRoZSBlbGVtZW50IGF0IHRoZSB0aW1lIG9mIGNoZWNraW5nXG4gICAgICB9LFxuICAgICAgcHJldjoge1xuICAgICAgICBkcm9wem9uZTogSW50ZXJhY3RhYmxlLCAgIC8vIHRoZSBkcm9wem9uZSB0aGF0IHdhcyByZWNlbnRseSBkcmFnZ2VkIGF3YXkgZnJvbVxuICAgICAgICBlbGVtZW50OiBFbGVtZW50LCAgICAgICAgIC8vIHRoZSBlbGVtZW50IGF0IHRoZSB0aW1lIG9mIGNoZWNraW5nXG4gICAgICB9LFxuICAgICAgcmVqZWN0ZWQ6IGJvb2xlYW4sICAgICAgICAgIC8vIHdoZWF0aGVyIHRoZSBwb3RlbnRpYWwgZHJvcCB3YXMgcmVqZWN0ZWQgZnJvbSBhIGxpc3RlbmVyXG4gICAgICBldmVudHM6IGFueSwgICAgICAgICAgICAgICAgLy8gdGhlIGRyb3AgZXZlbnRzIHJlbGF0ZWQgdG8gdGhlIGN1cnJlbnQgZHJhZyBldmVudFxuICAgICAgYWN0aXZlRHJvcHM6IEFycmF5PHtcbiAgICAgICAgZHJvcHpvbmU6IEludGVyYWN0YWJsZVxuICAgICAgICBlbGVtZW50OiBFbGVtZW50XG4gICAgICAgIHJlY3Q6IEludGVyYWN0LlJlY3RcbiAgICAgIH0+LFxuICAgIH1cbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9kZWZhdWx0T3B0aW9ucycge1xuICBpbnRlcmZhY2UgQWN0aW9uRGVmYXVsdHMge1xuICAgIGRyb3A6IEludGVyYWN0LkRyb3B6b25lT3B0aW9uc1xuICB9XG59XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJyB7XG4gIGludGVyZmFjZSBTY29wZSB7XG4gICAgZHluYW1pY0Ryb3A/OiBib29sZWFuXG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2ludGVyYWN0L2ludGVyYWN0JyB7XG4gIGludGVyZmFjZSBJbnRlcmFjdFN0YXRpYyB7XG4gICAgZHluYW1pY0Ryb3A6IChuZXdWYWx1ZT86IGJvb2xlYW4pID0+IGJvb2xlYW4gfCBJbnRlcmFjdC5pbnRlcmFjdFxuICB9XG59XG5cbmZ1bmN0aW9uIGluc3RhbGwgKHNjb3BlOiBTY29wZSkge1xuICBjb25zdCB7XG4gICAgYWN0aW9ucyxcbiAgICAvKiogQGxlbmRzIG1vZHVsZTppbnRlcmFjdCAqL1xuICAgIGludGVyYWN0LFxuICAgIC8qKiBAbGVuZHMgSW50ZXJhY3RhYmxlICovXG4gICAgSW50ZXJhY3RhYmxlLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNoYWRvd1xuICAgIGludGVyYWN0aW9ucyxcbiAgICBkZWZhdWx0cyxcbiAgfSA9IHNjb3BlXG5cbiAgc2NvcGUudXNlUGx1Z2luKGRyYWcpXG5cbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2JlZm9yZS1hY3Rpb24tc3RhcnQnLCAoeyBpbnRlcmFjdGlvbiB9KSA9PiB7XG4gICAgaWYgKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgIT09ICdkcmFnJykgeyByZXR1cm4gfVxuXG4gICAgaW50ZXJhY3Rpb24uZHJvcFN0YXRlID0ge1xuICAgICAgY3VyOiB7XG4gICAgICAgIGRyb3B6b25lOiBudWxsLFxuICAgICAgICBlbGVtZW50OiBudWxsLFxuICAgICAgfSxcbiAgICAgIHByZXY6IHtcbiAgICAgICAgZHJvcHpvbmU6IG51bGwsXG4gICAgICAgIGVsZW1lbnQ6IG51bGwsXG4gICAgICB9LFxuICAgICAgcmVqZWN0ZWQ6IG51bGwsXG4gICAgICBldmVudHM6IG51bGwsXG4gICAgICBhY3RpdmVEcm9wczogbnVsbCxcbiAgICB9XG4gIH0pXG5cbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FmdGVyLWFjdGlvbi1zdGFydCcsICh7IGludGVyYWN0aW9uLCBldmVudCwgaUV2ZW50OiBkcmFnRXZlbnQgfSkgPT4ge1xuICAgIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAnZHJhZycpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IHsgZHJvcFN0YXRlIH0gPSBpbnRlcmFjdGlvblxuXG4gICAgLy8gcmVzZXQgYWN0aXZlIGRyb3B6b25lc1xuICAgIGRyb3BTdGF0ZS5hY3RpdmVEcm9wcyA9IG51bGxcbiAgICBkcm9wU3RhdGUuZXZlbnRzID0gbnVsbFxuICAgIGRyb3BTdGF0ZS5hY3RpdmVEcm9wcyA9IGdldEFjdGl2ZURyb3BzKHNjb3BlLCBpbnRlcmFjdGlvbi5lbGVtZW50KVxuICAgIGRyb3BTdGF0ZS5ldmVudHMgPSBnZXREcm9wRXZlbnRzKGludGVyYWN0aW9uLCBldmVudCwgZHJhZ0V2ZW50KVxuXG4gICAgaWYgKGRyb3BTdGF0ZS5ldmVudHMuYWN0aXZhdGUpIHtcbiAgICAgIGZpcmVBY3RpdmF0aW9uRXZlbnRzKGRyb3BTdGF0ZS5hY3RpdmVEcm9wcywgZHJvcFN0YXRlLmV2ZW50cy5hY3RpdmF0ZSlcbiAgICB9XG4gIH0pXG5cbiAgLy8gRklYTUUgcHJvcGVyIHNpZ25hbCB0eXBlc1xuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLW1vdmUnLCAoYXJnKSA9PiBvbkV2ZW50Q3JlYXRlZChhcmcgYXMgYW55LCBzY29wZSkpXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tZW5kJywgKGFyZykgPT4gb25FdmVudENyZWF0ZWQoYXJnIGFzIGFueSwgc2NvcGUpKVxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhZnRlci1hY3Rpb24tbW92ZScsICh7IGludGVyYWN0aW9uIH0pID0+IHtcbiAgICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ2RyYWcnKSB7IHJldHVybiB9XG5cbiAgICBmaXJlRHJvcEV2ZW50cyhpbnRlcmFjdGlvbiwgaW50ZXJhY3Rpb24uZHJvcFN0YXRlLmV2ZW50cylcbiAgICBpbnRlcmFjdGlvbi5kcm9wU3RhdGUuZXZlbnRzID0ge31cbiAgfSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWZ0ZXItYWN0aW9uLWVuZCcsICh7IGludGVyYWN0aW9uIH0pID0+IHtcbiAgICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ2RyYWcnKSB7IHJldHVybiB9XG5cbiAgICBmaXJlRHJvcEV2ZW50cyhpbnRlcmFjdGlvbiwgaW50ZXJhY3Rpb24uZHJvcFN0YXRlLmV2ZW50cylcbiAgfSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignc3RvcCcsICh7IGludGVyYWN0aW9uIH0pID0+IHtcbiAgICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ2RyYWcnKSB7IHJldHVybiB9XG5cbiAgICBjb25zdCB7IGRyb3BTdGF0ZSB9ID0gaW50ZXJhY3Rpb25cblxuICAgIGRyb3BTdGF0ZS5hY3RpdmVEcm9wcyA9IG51bGxcbiAgICBkcm9wU3RhdGUuZXZlbnRzID0gbnVsbFxuICAgIGRyb3BTdGF0ZS5jdXIuZHJvcHpvbmUgPSBudWxsXG4gICAgZHJvcFN0YXRlLmN1ci5lbGVtZW50ID0gbnVsbFxuICAgIGRyb3BTdGF0ZS5wcmV2LmRyb3B6b25lID0gbnVsbFxuICAgIGRyb3BTdGF0ZS5wcmV2LmVsZW1lbnQgPSBudWxsXG4gICAgZHJvcFN0YXRlLnJlamVjdGVkID0gZmFsc2VcbiAgfSlcblxuICAvKipcbiAgICpcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QoJy5kcm9wJykuZHJvcHpvbmUoe1xuICAgKiAgIGFjY2VwdDogJy5jYW4tZHJvcCcgfHwgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NpbmdsZS1kcm9wJyksXG4gICAqICAgb3ZlcmxhcDogJ3BvaW50ZXInIHx8ICdjZW50ZXInIHx8IHplcm9Ub09uZVxuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciBkcmFnZ2FibGVzIGNhbiBiZSBkcm9wcGVkIG9udG8gdGhpcyB0YXJnZXQgdG9cbiAgICogdHJpZ2dlciBkcm9wIGV2ZW50c1xuICAgKlxuICAgKiBEcm9wem9uZXMgY2FuIHJlY2VpdmUgdGhlIGZvbGxvd2luZyBldmVudHM6XG4gICAqICAtIGBkcm9wYWN0aXZhdGVgIGFuZCBgZHJvcGRlYWN0aXZhdGVgIHdoZW4gYW4gYWNjZXB0YWJsZSBkcmFnIHN0YXJ0cyBhbmQgZW5kc1xuICAgKiAgLSBgZHJhZ2VudGVyYCBhbmQgYGRyYWdsZWF2ZWAgd2hlbiBhIGRyYWdnYWJsZSBlbnRlcnMgYW5kIGxlYXZlcyB0aGUgZHJvcHpvbmVcbiAgICogIC0gYGRyYWdtb3ZlYCB3aGVuIGEgZHJhZ2dhYmxlIHRoYXQgaGFzIGVudGVyZWQgdGhlIGRyb3B6b25lIGlzIG1vdmVkXG4gICAqICAtIGBkcm9wYCB3aGVuIGEgZHJhZ2dhYmxlIGlzIGRyb3BwZWQgaW50byB0aGlzIGRyb3B6b25lXG4gICAqXG4gICAqIFVzZSB0aGUgYGFjY2VwdGAgb3B0aW9uIHRvIGFsbG93IG9ubHkgZWxlbWVudHMgdGhhdCBtYXRjaCB0aGUgZ2l2ZW4gQ1NTXG4gICAqIHNlbGVjdG9yIG9yIGVsZW1lbnQuIFRoZSB2YWx1ZSBjYW4gYmU6XG4gICAqXG4gICAqICAtICoqYW4gRWxlbWVudCoqIC0gb25seSB0aGF0IGVsZW1lbnQgY2FuIGJlIGRyb3BwZWQgaW50byB0aGlzIGRyb3B6b25lLlxuICAgKiAgLSAqKmEgc3RyaW5nKiosIC0gdGhlIGVsZW1lbnQgYmVpbmcgZHJhZ2dlZCBtdXN0IG1hdGNoIGl0IGFzIGEgQ1NTIHNlbGVjdG9yLlxuICAgKiAgLSAqKmBudWxsYCoqIC0gYWNjZXB0IG9wdGlvbnMgaXMgY2xlYXJlZCAtIGl0IGFjY2VwdHMgYW55IGVsZW1lbnQuXG4gICAqXG4gICAqIFVzZSB0aGUgYG92ZXJsYXBgIG9wdGlvbiB0byBzZXQgaG93IGRyb3BzIGFyZSBjaGVja2VkIGZvci4gVGhlIGFsbG93ZWRcbiAgICogdmFsdWVzIGFyZTpcbiAgICpcbiAgICogICAtIGAncG9pbnRlcidgLCB0aGUgcG9pbnRlciBtdXN0IGJlIG92ZXIgdGhlIGRyb3B6b25lIChkZWZhdWx0KVxuICAgKiAgIC0gYCdjZW50ZXInYCwgdGhlIGRyYWdnYWJsZSBlbGVtZW50J3MgY2VudGVyIG11c3QgYmUgb3ZlciB0aGUgZHJvcHpvbmVcbiAgICogICAtIGEgbnVtYmVyIGZyb20gMC0xIHdoaWNoIGlzIHRoZSBgKGludGVyc2VjdGlvbiBhcmVhKSAvIChkcmFnZ2FibGUgYXJlYSlgLlxuICAgKiAgIGUuZy4gYDAuNWAgZm9yIGRyb3AgdG8gaGFwcGVuIHdoZW4gaGFsZiBvZiB0aGUgYXJlYSBvZiB0aGUgZHJhZ2dhYmxlIGlzXG4gICAqICAgb3ZlciB0aGUgZHJvcHpvbmVcbiAgICpcbiAgICogVXNlIHRoZSBgY2hlY2tlcmAgb3B0aW9uIHRvIHNwZWNpZnkgYSBmdW5jdGlvbiB0byBjaGVjayBpZiBhIGRyYWdnZWQgZWxlbWVudFxuICAgKiBpcyBvdmVyIHRoaXMgSW50ZXJhY3RhYmxlLlxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW4gfCBvYmplY3QgfCBudWxsfSBbb3B0aW9uc10gVGhlIG5ldyBvcHRpb25zIHRvIGJlIHNldC5cbiAgICogQHJldHVybiB7Ym9vbGVhbiB8IEludGVyYWN0YWJsZX0gVGhlIGN1cnJlbnQgc2V0dGluZyBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5kcm9wem9uZSA9IGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsIG9wdGlvbnM/OiBJbnRlcmFjdC5Ecm9wem9uZU9wdGlvbnMgfCBib29sZWFuKSB7XG4gICAgcmV0dXJuIGRyb3B6b25lTWV0aG9kKHRoaXMsIG9wdGlvbnMpXG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QodGFyZ2V0KVxuICAgKiAuZHJvcENoZWNrZXIoZnVuY3Rpb24oZHJhZ0V2ZW50LCAgICAgICAgIC8vIHJlbGF0ZWQgZHJhZ21vdmUgb3IgZHJhZ2VuZCBldmVudFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQsICAgICAgICAgICAgIC8vIFRvdWNoRXZlbnQvUG9pbnRlckV2ZW50L01vdXNlRXZlbnRcbiAgICogICAgICAgICAgICAgICAgICAgICAgIGRyb3BwZWQsICAgICAgICAgICAvLyBib29sIHJlc3VsdCBvZiB0aGUgZGVmYXVsdCBjaGVja2VyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSwgICAgICAgICAgLy8gZHJvcHpvbmUgSW50ZXJhY3RhYmxlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICBkcm9wRWxlbWVudCwgICAgICAgLy8gZHJvcHpvbmUgZWxlbW50XG4gICAqICAgICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGUsICAgICAgICAgLy8gZHJhZ2dhYmxlIEludGVyYWN0YWJsZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgZHJhZ2dhYmxlRWxlbWVudCkgey8vIGRyYWdnYWJsZSBlbGVtZW50XG4gICAqXG4gICAqICAgcmV0dXJuIGRyb3BwZWQgJiYgZXZlbnQudGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnYWxsb3ctZHJvcCcpXG4gICAqIH1cbiAgICogYGBgXG4gICAqL1xuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLmRyb3BDaGVjayA9IGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsIGRyYWdFdmVudCwgZXZlbnQsIGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudCwgZHJvcEVsZW1lbnQsIHJlY3QpIHtcbiAgICByZXR1cm4gZHJvcENoZWNrTWV0aG9kKHRoaXMsIGRyYWdFdmVudCwgZXZlbnQsIGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudCwgZHJvcEVsZW1lbnQsIHJlY3QpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgdGhlIGRpbWVuc2lvbnMgb2YgZHJvcHpvbmUgZWxlbWVudHMgYXJlIGNhbGN1bGF0ZWRcbiAgICogb24gZXZlcnkgZHJhZ21vdmUgb3Igb25seSBvbiBkcmFnc3RhcnQgZm9yIHRoZSBkZWZhdWx0IGRyb3BDaGVja2VyXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25ld1ZhbHVlXSBUcnVlIHRvIGNoZWNrIG9uIGVhY2ggbW92ZS4gRmFsc2UgdG8gY2hlY2sgb25seVxuICAgKiBiZWZvcmUgc3RhcnRcbiAgICogQHJldHVybiB7Ym9vbGVhbiB8IGludGVyYWN0fSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIGludGVyYWN0XG4gICAqL1xuICBpbnRlcmFjdC5keW5hbWljRHJvcCA9IGZ1bmN0aW9uIChuZXdWYWx1ZT86IGJvb2xlYW4pIHtcbiAgICBpZiAodXRpbHMuaXMuYm9vbChuZXdWYWx1ZSkpIHtcbiAgICAgIC8vIGlmIChkcmFnZ2luZyAmJiBzY29wZS5keW5hbWljRHJvcCAhPT0gbmV3VmFsdWUgJiYgIW5ld1ZhbHVlKSB7XG4gICAgICAvLyAgY2FsY1JlY3RzKGRyb3B6b25lcylcbiAgICAgIC8vIH1cblxuICAgICAgc2NvcGUuZHluYW1pY0Ryb3AgPSBuZXdWYWx1ZVxuXG4gICAgICByZXR1cm4gaW50ZXJhY3RcbiAgICB9XG4gICAgcmV0dXJuIHNjb3BlLmR5bmFtaWNEcm9wXG4gIH1cblxuICB1dGlscy5hcnIubWVyZ2UoYWN0aW9ucy5ldmVudFR5cGVzLCBbXG4gICAgJ2RyYWdlbnRlcicsXG4gICAgJ2RyYWdsZWF2ZScsXG4gICAgJ2Ryb3BhY3RpdmF0ZScsXG4gICAgJ2Ryb3BkZWFjdGl2YXRlJyxcbiAgICAnZHJvcG1vdmUnLFxuICAgICdkcm9wJyxcbiAgXSlcbiAgYWN0aW9ucy5tZXRob2REaWN0LmRyb3AgPSAnZHJvcHpvbmUnXG5cbiAgc2NvcGUuZHluYW1pY0Ryb3AgPSBmYWxzZVxuXG4gIGRlZmF1bHRzLmFjdGlvbnMuZHJvcCA9IGRyb3AuZGVmYXVsdHNcbn1cblxuZnVuY3Rpb24gY29sbGVjdERyb3BzICh7IGludGVyYWN0YWJsZXMgfSwgZHJhZ2dhYmxlRWxlbWVudCkge1xuICBjb25zdCBkcm9wcyA9IFtdXG5cbiAgLy8gY29sbGVjdCBhbGwgZHJvcHpvbmVzIGFuZCB0aGVpciBlbGVtZW50cyB3aGljaCBxdWFsaWZ5IGZvciBhIGRyb3BcbiAgZm9yIChjb25zdCBkcm9wem9uZSBvZiBpbnRlcmFjdGFibGVzLmxpc3QpIHtcbiAgICBpZiAoIWRyb3B6b25lLm9wdGlvbnMuZHJvcC5lbmFibGVkKSB7IGNvbnRpbnVlIH1cblxuICAgIGNvbnN0IGFjY2VwdCA9IGRyb3B6b25lLm9wdGlvbnMuZHJvcC5hY2NlcHRcblxuICAgIC8vIHRlc3QgdGhlIGRyYWdnYWJsZSBkcmFnZ2FibGVFbGVtZW50IGFnYWluc3QgdGhlIGRyb3B6b25lJ3MgYWNjZXB0IHNldHRpbmdcbiAgICBpZiAoKHV0aWxzLmlzLmVsZW1lbnQoYWNjZXB0KSAmJiBhY2NlcHQgIT09IGRyYWdnYWJsZUVsZW1lbnQpIHx8XG4gICAgICAgICh1dGlscy5pcy5zdHJpbmcoYWNjZXB0KSAmJlxuICAgICAgICAhdXRpbHMuZG9tLm1hdGNoZXNTZWxlY3RvcihkcmFnZ2FibGVFbGVtZW50LCBhY2NlcHQpKSB8fFxuICAgICAgICAodXRpbHMuaXMuZnVuYyhhY2NlcHQpICYmICFhY2NlcHQoeyBkcm9wem9uZSwgZHJhZ2dhYmxlRWxlbWVudCB9KSkpIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgLy8gcXVlcnkgZm9yIG5ldyBlbGVtZW50cyBpZiBuZWNlc3NhcnlcbiAgICBjb25zdCBkcm9wRWxlbWVudHMgPSB1dGlscy5pcy5zdHJpbmcoZHJvcHpvbmUudGFyZ2V0KVxuICAgICAgPyBkcm9wem9uZS5fY29udGV4dC5xdWVyeVNlbGVjdG9yQWxsKGRyb3B6b25lLnRhcmdldClcbiAgICAgIDogdXRpbHMuaXMuYXJyYXkoZHJvcHpvbmUudGFyZ2V0KSA/IGRyb3B6b25lLnRhcmdldCA6IFtkcm9wem9uZS50YXJnZXRdXG5cbiAgICBmb3IgKGNvbnN0IGRyb3B6b25lRWxlbWVudCBvZiBkcm9wRWxlbWVudHMpIHtcbiAgICAgIGlmIChkcm9wem9uZUVsZW1lbnQgIT09IGRyYWdnYWJsZUVsZW1lbnQpIHtcbiAgICAgICAgZHJvcHMucHVzaCh7XG4gICAgICAgICAgZHJvcHpvbmUsXG4gICAgICAgICAgZWxlbWVudDogZHJvcHpvbmVFbGVtZW50LFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkcm9wc1xufVxuXG5mdW5jdGlvbiBmaXJlQWN0aXZhdGlvbkV2ZW50cyAoYWN0aXZlRHJvcHMsIGV2ZW50KSB7XG4gIC8vIGxvb3AgdGhyb3VnaCBhbGwgYWN0aXZlIGRyb3B6b25lcyBhbmQgdHJpZ2dlciBldmVudFxuICBmb3IgKGNvbnN0IHsgZHJvcHpvbmUsIGVsZW1lbnQgfSBvZiBhY3RpdmVEcm9wcykge1xuICAgIGV2ZW50LmRyb3B6b25lID0gZHJvcHpvbmVcblxuICAgIC8vIHNldCBjdXJyZW50IGVsZW1lbnQgYXMgZXZlbnQgdGFyZ2V0XG4gICAgZXZlbnQudGFyZ2V0ID0gZWxlbWVudFxuICAgIGRyb3B6b25lLmZpcmUoZXZlbnQpXG4gICAgZXZlbnQucHJvcGFnYXRpb25TdG9wcGVkID0gZXZlbnQuaW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkID0gZmFsc2VcbiAgfVxufVxuXG4vLyByZXR1cm4gYSBuZXcgYXJyYXkgb2YgcG9zc2libGUgZHJvcHMuIGdldEFjdGl2ZURyb3BzIHNob3VsZCBhbHdheXMgYmVcbi8vIGNhbGxlZCB3aGVuIGEgZHJhZyBoYXMganVzdCBzdGFydGVkIG9yIGEgZHJhZyBldmVudCBoYXBwZW5zIHdoaWxlXG4vLyBkeW5hbWljRHJvcCBpcyB0cnVlXG5mdW5jdGlvbiBnZXRBY3RpdmVEcm9wcyAoc2NvcGU6IFNjb3BlLCBkcmFnRWxlbWVudDogRWxlbWVudCkge1xuICAvLyBnZXQgZHJvcHpvbmVzIGFuZCB0aGVpciBlbGVtZW50cyB0aGF0IGNvdWxkIHJlY2VpdmUgdGhlIGRyYWdnYWJsZVxuICBjb25zdCBhY3RpdmVEcm9wcyA9IGNvbGxlY3REcm9wcyhzY29wZSwgZHJhZ0VsZW1lbnQpXG5cbiAgZm9yIChjb25zdCBhY3RpdmVEcm9wIG9mIGFjdGl2ZURyb3BzKSB7XG4gICAgYWN0aXZlRHJvcC5yZWN0ID0gYWN0aXZlRHJvcC5kcm9wem9uZS5nZXRSZWN0KGFjdGl2ZURyb3AuZWxlbWVudClcbiAgfVxuXG4gIHJldHVybiBhY3RpdmVEcm9wc1xufVxuXG5mdW5jdGlvbiBnZXREcm9wICh7IGRyb3BTdGF0ZSwgaW50ZXJhY3RhYmxlOiBkcmFnZ2FibGUsIGVsZW1lbnQ6IGRyYWdFbGVtZW50IH06IFBhcnRpYWw8SW50ZXJhY3QuSW50ZXJhY3Rpb24+LCBkcmFnRXZlbnQsIHBvaW50ZXJFdmVudCkge1xuICBjb25zdCB2YWxpZERyb3BzID0gW11cblxuICAvLyBjb2xsZWN0IGFsbCBkcm9wem9uZXMgYW5kIHRoZWlyIGVsZW1lbnRzIHdoaWNoIHF1YWxpZnkgZm9yIGEgZHJvcFxuICBmb3IgKGNvbnN0IHsgZHJvcHpvbmUsIGVsZW1lbnQ6IGRyb3B6b25lRWxlbWVudCwgcmVjdCB9IG9mIGRyb3BTdGF0ZS5hY3RpdmVEcm9wcykge1xuICAgIHZhbGlkRHJvcHMucHVzaChkcm9wem9uZS5kcm9wQ2hlY2soZHJhZ0V2ZW50LCBwb2ludGVyRXZlbnQsIGRyYWdnYWJsZSwgZHJhZ0VsZW1lbnQsIGRyb3B6b25lRWxlbWVudCwgcmVjdClcbiAgICAgID8gZHJvcHpvbmVFbGVtZW50XG4gICAgICA6IG51bGwpXG4gIH1cblxuICAvLyBnZXQgdGhlIG1vc3QgYXBwcm9wcmlhdGUgZHJvcHpvbmUgYmFzZWQgb24gRE9NIGRlcHRoIGFuZCBvcmRlclxuICBjb25zdCBkcm9wSW5kZXggPSB1dGlscy5kb20uaW5kZXhPZkRlZXBlc3RFbGVtZW50KHZhbGlkRHJvcHMpXG5cbiAgcmV0dXJuIGRyb3BTdGF0ZS5hY3RpdmVEcm9wc1tkcm9wSW5kZXhdIHx8IG51bGxcbn1cblxuZnVuY3Rpb24gZ2V0RHJvcEV2ZW50cyAoaW50ZXJhY3Rpb246IEludGVyYWN0LkludGVyYWN0aW9uLCBfcG9pbnRlckV2ZW50LCBkcmFnRXZlbnQpIHtcbiAgY29uc3QgeyBkcm9wU3RhdGUgfSA9IGludGVyYWN0aW9uXG4gIGNvbnN0IGRyb3BFdmVudHMgPSB7XG4gICAgZW50ZXIgICAgIDogbnVsbCxcbiAgICBsZWF2ZSAgICAgOiBudWxsLFxuICAgIGFjdGl2YXRlICA6IG51bGwsXG4gICAgZGVhY3RpdmF0ZTogbnVsbCxcbiAgICBtb3ZlICAgICAgOiBudWxsLFxuICAgIGRyb3AgICAgICA6IG51bGwsXG4gIH1cblxuICBpZiAoZHJhZ0V2ZW50LnR5cGUgPT09ICdkcmFnc3RhcnQnKSB7XG4gICAgZHJvcEV2ZW50cy5hY3RpdmF0ZSA9IG5ldyBEcm9wRXZlbnQoZHJvcFN0YXRlLCBkcmFnRXZlbnQsICdkcm9wYWN0aXZhdGUnKVxuXG4gICAgZHJvcEV2ZW50cy5hY3RpdmF0ZS50YXJnZXQgICA9IG51bGxcbiAgICBkcm9wRXZlbnRzLmFjdGl2YXRlLmRyb3B6b25lID0gbnVsbFxuICB9XG4gIGlmIChkcmFnRXZlbnQudHlwZSA9PT0gJ2RyYWdlbmQnKSB7XG4gICAgZHJvcEV2ZW50cy5kZWFjdGl2YXRlID0gbmV3IERyb3BFdmVudChkcm9wU3RhdGUsIGRyYWdFdmVudCwgJ2Ryb3BkZWFjdGl2YXRlJylcblxuICAgIGRyb3BFdmVudHMuZGVhY3RpdmF0ZS50YXJnZXQgICA9IG51bGxcbiAgICBkcm9wRXZlbnRzLmRlYWN0aXZhdGUuZHJvcHpvbmUgPSBudWxsXG4gIH1cblxuICBpZiAoZHJvcFN0YXRlLnJlamVjdGVkKSB7XG4gICAgcmV0dXJuIGRyb3BFdmVudHNcbiAgfVxuXG4gIGlmIChkcm9wU3RhdGUuY3VyLmVsZW1lbnQgIT09IGRyb3BTdGF0ZS5wcmV2LmVsZW1lbnQpIHtcbiAgICAvLyBpZiB0aGVyZSB3YXMgYSBwcmV2aW91cyBkcm9wem9uZSwgY3JlYXRlIGEgZHJhZ2xlYXZlIGV2ZW50XG4gICAgaWYgKGRyb3BTdGF0ZS5wcmV2LmRyb3B6b25lKSB7XG4gICAgICBkcm9wRXZlbnRzLmxlYXZlID0gbmV3IERyb3BFdmVudChkcm9wU3RhdGUsIGRyYWdFdmVudCwgJ2RyYWdsZWF2ZScpXG5cbiAgICAgIGRyYWdFdmVudC5kcmFnTGVhdmUgICAgPSBkcm9wRXZlbnRzLmxlYXZlLnRhcmdldCAgID0gZHJvcFN0YXRlLnByZXYuZWxlbWVudFxuICAgICAgZHJhZ0V2ZW50LnByZXZEcm9wem9uZSA9IGRyb3BFdmVudHMubGVhdmUuZHJvcHpvbmUgPSBkcm9wU3RhdGUucHJldi5kcm9wem9uZVxuICAgIH1cbiAgICAvLyBpZiBkcm9wem9uZSBpcyBub3QgbnVsbCwgY3JlYXRlIGEgZHJhZ2VudGVyIGV2ZW50XG4gICAgaWYgKGRyb3BTdGF0ZS5jdXIuZHJvcHpvbmUpIHtcbiAgICAgIGRyb3BFdmVudHMuZW50ZXIgPSBuZXcgRHJvcEV2ZW50KGRyb3BTdGF0ZSwgZHJhZ0V2ZW50LCAnZHJhZ2VudGVyJylcblxuICAgICAgZHJhZ0V2ZW50LmRyYWdFbnRlciA9IGRyb3BTdGF0ZS5jdXIuZWxlbWVudFxuICAgICAgZHJhZ0V2ZW50LmRyb3B6b25lID0gZHJvcFN0YXRlLmN1ci5kcm9wem9uZVxuICAgIH1cbiAgfVxuXG4gIGlmIChkcmFnRXZlbnQudHlwZSA9PT0gJ2RyYWdlbmQnICYmIGRyb3BTdGF0ZS5jdXIuZHJvcHpvbmUpIHtcbiAgICBkcm9wRXZlbnRzLmRyb3AgPSBuZXcgRHJvcEV2ZW50KGRyb3BTdGF0ZSwgZHJhZ0V2ZW50LCAnZHJvcCcpXG5cbiAgICBkcmFnRXZlbnQuZHJvcHpvbmUgPSBkcm9wU3RhdGUuY3VyLmRyb3B6b25lXG4gICAgZHJhZ0V2ZW50LnJlbGF0ZWRUYXJnZXQgPSBkcm9wU3RhdGUuY3VyLmVsZW1lbnRcbiAgfVxuICBpZiAoZHJhZ0V2ZW50LnR5cGUgPT09ICdkcmFnbW92ZScgJiYgZHJvcFN0YXRlLmN1ci5kcm9wem9uZSkge1xuICAgIGRyb3BFdmVudHMubW92ZSA9IG5ldyBEcm9wRXZlbnQoZHJvcFN0YXRlLCBkcmFnRXZlbnQsICdkcm9wbW92ZScpXG5cbiAgICBkcm9wRXZlbnRzLm1vdmUuZHJhZ21vdmUgPSBkcmFnRXZlbnRcbiAgICBkcmFnRXZlbnQuZHJvcHpvbmUgPSBkcm9wU3RhdGUuY3VyLmRyb3B6b25lXG4gIH1cblxuICByZXR1cm4gZHJvcEV2ZW50c1xufVxuXG5mdW5jdGlvbiBmaXJlRHJvcEV2ZW50cyAoaW50ZXJhY3Rpb246IEludGVyYWN0LkludGVyYWN0aW9uLCBldmVudHMpIHtcbiAgY29uc3QgeyBkcm9wU3RhdGUgfSA9IGludGVyYWN0aW9uXG4gIGNvbnN0IHtcbiAgICBhY3RpdmVEcm9wcyxcbiAgICBjdXIsXG4gICAgcHJldixcbiAgfSA9IGRyb3BTdGF0ZVxuXG4gIGlmIChldmVudHMubGVhdmUpIHsgcHJldi5kcm9wem9uZS5maXJlKGV2ZW50cy5sZWF2ZSkgfVxuICBpZiAoZXZlbnRzLm1vdmUpIHsgY3VyLmRyb3B6b25lLmZpcmUoZXZlbnRzLm1vdmUpIH1cbiAgaWYgKGV2ZW50cy5lbnRlcikgeyBjdXIuZHJvcHpvbmUuZmlyZShldmVudHMuZW50ZXIpIH1cbiAgaWYgKGV2ZW50cy5kcm9wKSB7IGN1ci5kcm9wem9uZS5maXJlKGV2ZW50cy5kcm9wKSB9XG5cbiAgaWYgKGV2ZW50cy5kZWFjdGl2YXRlKSB7XG4gICAgZmlyZUFjdGl2YXRpb25FdmVudHMoYWN0aXZlRHJvcHMsIGV2ZW50cy5kZWFjdGl2YXRlKVxuICB9XG5cbiAgZHJvcFN0YXRlLnByZXYuZHJvcHpvbmUgID0gY3VyLmRyb3B6b25lXG4gIGRyb3BTdGF0ZS5wcmV2LmVsZW1lbnQgPSBjdXIuZWxlbWVudFxufVxuXG5mdW5jdGlvbiBvbkV2ZW50Q3JlYXRlZCAoeyBpbnRlcmFjdGlvbiwgaUV2ZW50LCBldmVudCB9OiBJbnRlcmFjdC5TaWduYWxBcmcsIHNjb3BlKSB7XG4gIGlmIChpRXZlbnQudHlwZSAhPT0gJ2RyYWdtb3ZlJyAmJiBpRXZlbnQudHlwZSAhPT0gJ2RyYWdlbmQnKSB7IHJldHVybiB9XG5cbiAgY29uc3QgeyBkcm9wU3RhdGUgfSA9IGludGVyYWN0aW9uXG5cbiAgaWYgKHNjb3BlLmR5bmFtaWNEcm9wKSB7XG4gICAgZHJvcFN0YXRlLmFjdGl2ZURyb3BzID0gZ2V0QWN0aXZlRHJvcHMoc2NvcGUsIGludGVyYWN0aW9uLmVsZW1lbnQpXG4gIH1cblxuICBjb25zdCBkcmFnRXZlbnQgPSBpRXZlbnRcbiAgY29uc3QgZHJvcFJlc3VsdCA9IGdldERyb3AoaW50ZXJhY3Rpb24sIGRyYWdFdmVudCwgZXZlbnQpXG5cbiAgLy8gdXBkYXRlIHJlamVjdGVkIHN0YXR1c1xuICBkcm9wU3RhdGUucmVqZWN0ZWQgPSBkcm9wU3RhdGUucmVqZWN0ZWQgJiZcbiAgICAhIWRyb3BSZXN1bHQgJiZcbiAgICBkcm9wUmVzdWx0LmRyb3B6b25lID09PSBkcm9wU3RhdGUuY3VyLmRyb3B6b25lICYmXG4gICAgZHJvcFJlc3VsdC5lbGVtZW50ID09PSBkcm9wU3RhdGUuY3VyLmVsZW1lbnRcblxuICBkcm9wU3RhdGUuY3VyLmRyb3B6b25lICA9IGRyb3BSZXN1bHQgJiYgZHJvcFJlc3VsdC5kcm9wem9uZVxuICBkcm9wU3RhdGUuY3VyLmVsZW1lbnQgPSBkcm9wUmVzdWx0ICYmIGRyb3BSZXN1bHQuZWxlbWVudFxuXG4gIGRyb3BTdGF0ZS5ldmVudHMgPSBnZXREcm9wRXZlbnRzKGludGVyYWN0aW9uLCBldmVudCwgZHJhZ0V2ZW50KVxufVxuXG5mdW5jdGlvbiBkcm9wem9uZU1ldGhvZCAoaW50ZXJhY3RhYmxlOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUpOiBJbnRlcmFjdC5Ecm9wem9uZU9wdGlvbnNcbmZ1bmN0aW9uIGRyb3B6b25lTWV0aG9kIChpbnRlcmFjdGFibGU6IEludGVyYWN0LkludGVyYWN0YWJsZSwgb3B0aW9uczogSW50ZXJhY3QuRHJvcHpvbmVPcHRpb25zIHwgYm9vbGVhbilcbmZ1bmN0aW9uIGRyb3B6b25lTWV0aG9kIChpbnRlcmFjdGFibGU6IEludGVyYWN0LkludGVyYWN0YWJsZSwgb3B0aW9ucz86IEludGVyYWN0LkRyb3B6b25lT3B0aW9ucyB8IGJvb2xlYW4pIHtcbiAgaWYgKHV0aWxzLmlzLm9iamVjdChvcHRpb25zKSkge1xuICAgIGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AuZW5hYmxlZCA9IG9wdGlvbnMuZW5hYmxlZCAhPT0gZmFsc2VcblxuICAgIGlmIChvcHRpb25zLmxpc3RlbmVycykge1xuICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IHV0aWxzLm5vcm1hbGl6ZUxpc3RlbmVycyhvcHRpb25zLmxpc3RlbmVycylcbiAgICAgIC8vIHJlbmFtZSAnZHJvcCcgdG8gJycgYXMgaXQgd2lsbCBiZSBwcmVmaXhlZCB3aXRoICdkcm9wJ1xuICAgICAgY29uc3QgY29ycmVjdGVkID0gT2JqZWN0LmtleXMobm9ybWFsaXplZCkucmVkdWNlKChhY2MsIHR5cGUpID0+IHtcbiAgICAgICAgY29uc3QgY29ycmVjdGVkVHlwZSA9IC9eKGVudGVyfGxlYXZlKS8udGVzdCh0eXBlKVxuICAgICAgICAgID8gYGRyYWcke3R5cGV9YFxuICAgICAgICAgIDogL14oYWN0aXZhdGV8ZGVhY3RpdmF0ZXxtb3ZlKS8udGVzdCh0eXBlKVxuICAgICAgICAgICAgPyBgZHJvcCR7dHlwZX1gXG4gICAgICAgICAgICA6IHR5cGVcblxuICAgICAgICBhY2NbY29ycmVjdGVkVHlwZV0gPSBub3JtYWxpemVkW3R5cGVdXG5cbiAgICAgICAgcmV0dXJuIGFjY1xuICAgICAgfSwge30pXG5cbiAgICAgIGludGVyYWN0YWJsZS5vZmYoaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5saXN0ZW5lcnMpXG4gICAgICBpbnRlcmFjdGFibGUub24oY29ycmVjdGVkKVxuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5saXN0ZW5lcnMgPSBjb3JyZWN0ZWRcbiAgICB9XG5cbiAgICBpZiAodXRpbHMuaXMuZnVuYyhvcHRpb25zLm9uZHJvcCkpIHsgaW50ZXJhY3RhYmxlLm9uKCdkcm9wJywgb3B0aW9ucy5vbmRyb3ApIH1cbiAgICBpZiAodXRpbHMuaXMuZnVuYyhvcHRpb25zLm9uZHJvcGFjdGl2YXRlKSkgeyBpbnRlcmFjdGFibGUub24oJ2Ryb3BhY3RpdmF0ZScsIG9wdGlvbnMub25kcm9wYWN0aXZhdGUpIH1cbiAgICBpZiAodXRpbHMuaXMuZnVuYyhvcHRpb25zLm9uZHJvcGRlYWN0aXZhdGUpKSB7IGludGVyYWN0YWJsZS5vbignZHJvcGRlYWN0aXZhdGUnLCBvcHRpb25zLm9uZHJvcGRlYWN0aXZhdGUpIH1cbiAgICBpZiAodXRpbHMuaXMuZnVuYyhvcHRpb25zLm9uZHJhZ2VudGVyKSkgeyBpbnRlcmFjdGFibGUub24oJ2RyYWdlbnRlcicsIG9wdGlvbnMub25kcmFnZW50ZXIpIH1cbiAgICBpZiAodXRpbHMuaXMuZnVuYyhvcHRpb25zLm9uZHJhZ2xlYXZlKSkgeyBpbnRlcmFjdGFibGUub24oJ2RyYWdsZWF2ZScsIG9wdGlvbnMub25kcmFnbGVhdmUpIH1cbiAgICBpZiAodXRpbHMuaXMuZnVuYyhvcHRpb25zLm9uZHJvcG1vdmUpKSB7IGludGVyYWN0YWJsZS5vbignZHJvcG1vdmUnLCBvcHRpb25zLm9uZHJvcG1vdmUpIH1cblxuICAgIGlmICgvXihwb2ludGVyfGNlbnRlcikkLy50ZXN0KG9wdGlvbnMub3ZlcmxhcCBhcyBzdHJpbmcpKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLm92ZXJsYXAgPSBvcHRpb25zLm92ZXJsYXBcbiAgICB9XG4gICAgZWxzZSBpZiAodXRpbHMuaXMubnVtYmVyKG9wdGlvbnMub3ZlcmxhcCkpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3Aub3ZlcmxhcCA9IE1hdGgubWF4KE1hdGgubWluKDEsIG9wdGlvbnMub3ZlcmxhcCksIDApXG4gICAgfVxuICAgIGlmICgnYWNjZXB0JyBpbiBvcHRpb25zKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmFjY2VwdCA9IG9wdGlvbnMuYWNjZXB0XG4gICAgfVxuICAgIGlmICgnY2hlY2tlcicgaW4gb3B0aW9ucykge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5jaGVja2VyID0gb3B0aW9ucy5jaGVja2VyXG4gICAgfVxuXG4gICAgcmV0dXJuIGludGVyYWN0YWJsZVxuICB9XG5cbiAgaWYgKHV0aWxzLmlzLmJvb2wob3B0aW9ucykpIHtcbiAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmVuYWJsZWQgPSBvcHRpb25zXG5cbiAgICByZXR1cm4gaW50ZXJhY3RhYmxlXG4gIH1cblxuICByZXR1cm4gaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcFxufVxuXG5mdW5jdGlvbiBkcm9wQ2hlY2tNZXRob2QgKFxuICBpbnRlcmFjdGFibGU6IEludGVyYWN0LkludGVyYWN0YWJsZSxcbiAgZHJhZ0V2ZW50OiBJbnRlcmFjdEV2ZW50LFxuICBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSxcbiAgZHJhZ2dhYmxlOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsXG4gIGRyYWdnYWJsZUVsZW1lbnQ6IEVsZW1lbnQsXG4gIGRyb3BFbGVtZW50OiBFbGVtZW50LFxuICByZWN0OiBhbnlcbikge1xuICBsZXQgZHJvcHBlZCA9IGZhbHNlXG5cbiAgLy8gaWYgdGhlIGRyb3B6b25lIGhhcyBubyByZWN0IChlZy4gZGlzcGxheTogbm9uZSlcbiAgLy8gY2FsbCB0aGUgY3VzdG9tIGRyb3BDaGVja2VyIG9yIGp1c3QgcmV0dXJuIGZhbHNlXG4gIGlmICghKHJlY3QgPSByZWN0IHx8IGludGVyYWN0YWJsZS5nZXRSZWN0KGRyb3BFbGVtZW50KSkpIHtcbiAgICByZXR1cm4gKGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AuY2hlY2tlclxuICAgICAgPyBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmNoZWNrZXIoZHJhZ0V2ZW50LCBldmVudCwgZHJvcHBlZCwgaW50ZXJhY3RhYmxlLCBkcm9wRWxlbWVudCwgZHJhZ2dhYmxlLCBkcmFnZ2FibGVFbGVtZW50KVxuICAgICAgOiBmYWxzZSlcbiAgfVxuXG4gIGNvbnN0IGRyb3BPdmVybGFwID0gaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5vdmVybGFwXG5cbiAgaWYgKGRyb3BPdmVybGFwID09PSAncG9pbnRlcicpIHtcbiAgICBjb25zdCBvcmlnaW4gPSB1dGlscy5nZXRPcmlnaW5YWShkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQsICdkcmFnJylcbiAgICBjb25zdCBwYWdlID0gdXRpbHMucG9pbnRlci5nZXRQYWdlWFkoZHJhZ0V2ZW50KVxuXG4gICAgcGFnZS54ICs9IG9yaWdpbi54XG4gICAgcGFnZS55ICs9IG9yaWdpbi55XG5cbiAgICBjb25zdCBob3Jpem9udGFsID0gKHBhZ2UueCA+IHJlY3QubGVmdCkgJiYgKHBhZ2UueCA8IHJlY3QucmlnaHQpXG4gICAgY29uc3QgdmVydGljYWwgICA9IChwYWdlLnkgPiByZWN0LnRvcCkgJiYgKHBhZ2UueSA8IHJlY3QuYm90dG9tKVxuXG4gICAgZHJvcHBlZCA9IGhvcml6b250YWwgJiYgdmVydGljYWxcbiAgfVxuXG4gIGNvbnN0IGRyYWdSZWN0ID0gZHJhZ2dhYmxlLmdldFJlY3QoZHJhZ2dhYmxlRWxlbWVudClcblxuICBpZiAoZHJhZ1JlY3QgJiYgZHJvcE92ZXJsYXAgPT09ICdjZW50ZXInKSB7XG4gICAgY29uc3QgY3ggPSBkcmFnUmVjdC5sZWZ0ICsgZHJhZ1JlY3Qud2lkdGggIC8gMlxuICAgIGNvbnN0IGN5ID0gZHJhZ1JlY3QudG9wICArIGRyYWdSZWN0LmhlaWdodCAvIDJcblxuICAgIGRyb3BwZWQgPSBjeCA+PSByZWN0LmxlZnQgJiYgY3ggPD0gcmVjdC5yaWdodCAmJiBjeSA+PSByZWN0LnRvcCAmJiBjeSA8PSByZWN0LmJvdHRvbVxuICB9XG5cbiAgaWYgKGRyYWdSZWN0ICYmIHV0aWxzLmlzLm51bWJlcihkcm9wT3ZlcmxhcCkpIHtcbiAgICBjb25zdCBvdmVybGFwQXJlYSAgPSAoTWF0aC5tYXgoMCwgTWF0aC5taW4ocmVjdC5yaWdodCwgZHJhZ1JlY3QucmlnaHQpIC0gTWF0aC5tYXgocmVjdC5sZWZ0LCBkcmFnUmVjdC5sZWZ0KSkgKlxuICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1heCgwLCBNYXRoLm1pbihyZWN0LmJvdHRvbSwgZHJhZ1JlY3QuYm90dG9tKSAtIE1hdGgubWF4KHJlY3QudG9wLCBkcmFnUmVjdC50b3ApKSlcblxuICAgIGNvbnN0IG92ZXJsYXBSYXRpbyA9IG92ZXJsYXBBcmVhIC8gKGRyYWdSZWN0LndpZHRoICogZHJhZ1JlY3QuaGVpZ2h0KVxuXG4gICAgZHJvcHBlZCA9IG92ZXJsYXBSYXRpbyA+PSBkcm9wT3ZlcmxhcFxuICB9XG5cbiAgaWYgKGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AuY2hlY2tlcikge1xuICAgIGRyb3BwZWQgPSBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmNoZWNrZXIoZHJhZ0V2ZW50LCBldmVudCwgZHJvcHBlZCwgaW50ZXJhY3RhYmxlLCBkcm9wRWxlbWVudCwgZHJhZ2dhYmxlLCBkcmFnZ2FibGVFbGVtZW50KVxuICB9XG5cbiAgcmV0dXJuIGRyb3BwZWRcbn1cblxuY29uc3QgZHJvcCA9IHtcbiAgaWQ6ICdhY3Rpb25zL2Ryb3AnLFxuICBpbnN0YWxsLFxuICBnZXRBY3RpdmVEcm9wcyxcbiAgZ2V0RHJvcCxcbiAgZ2V0RHJvcEV2ZW50cyxcbiAgZmlyZURyb3BFdmVudHMsXG4gIGRlZmF1bHRzOiB7XG4gICAgZW5hYmxlZDogZmFsc2UsXG4gICAgYWNjZXB0IDogbnVsbCxcbiAgICBvdmVybGFwOiAncG9pbnRlcicsXG4gIH0gYXMgSW50ZXJhY3QuRHJvcHpvbmVPcHRpb25zLFxufVxuXG5leHBvcnQgZGVmYXVsdCBkcm9wXG4iXX0=