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
        if (dropState) {
            dropState.activeDrops = null;
            dropState.events = null;
            dropState.cur.dropzone = null;
            dropState.cur.element = null;
            dropState.prev.dropzone = null;
            dropState.prev.element = null;
            dropState.rejected = false;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBQzFDLE9BQU8sSUFBSSxNQUFNLFNBQVMsQ0FBQTtBQUMxQixPQUFPLFNBQVMsTUFBTSxhQUFhLENBQUE7QUE2RG5DLFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsTUFBTSxFQUNKLE9BQU87SUFDUCw2QkFBNkI7SUFDN0IsUUFBUTtJQUNSLDBCQUEwQjtJQUMxQixZQUFZLEVBQUUsZ0NBQWdDO0lBQzlDLFlBQVksRUFDWixRQUFRLEdBQ1QsR0FBRyxLQUFLLENBQUE7SUFFVCxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBRXJCLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLENBQUMsRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFO1FBQ2pFLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO1lBQUUsT0FBTTtTQUFFO1FBRXBELFdBQVcsQ0FBQyxTQUFTLEdBQUc7WUFDdEIsR0FBRyxFQUFFO2dCQUNILFFBQVEsRUFBRSxJQUFJO2dCQUNkLE9BQU8sRUFBRSxJQUFJO2FBQ2Q7WUFDRCxJQUFJLEVBQUU7Z0JBQ0osUUFBUSxFQUFFLElBQUk7Z0JBQ2QsT0FBTyxFQUFFLElBQUk7YUFDZDtZQUNELFFBQVEsRUFBRSxJQUFJO1lBQ2QsTUFBTSxFQUFFLElBQUk7WUFDWixXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFBO0lBQ0gsQ0FBQyxDQUFDLENBQUE7SUFFRixZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRTtRQUMxRixJQUFJLFdBQVcsQ0FBQyxRQUFRLENB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QUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBRXJFLE9BQU8sR0FBRyxZQUFZLElBQUksV0FBVyxDQUFBO0tBQ3RDO0lBRUQsSUFBSSxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDckMsT0FBTyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFBO0tBQy9IO0lBRUQsT0FBTyxPQUFPLENBQUE7QUFDaEIsQ0FBQztBQUVELE1BQU0sSUFBSSxHQUFHO0lBQ1gsRUFBRSxFQUFFLGNBQWM7SUFDbEIsT0FBTztJQUNQLGNBQWM7SUFDZCxPQUFPO0lBQ1AsYUFBYTtJQUNiLGNBQWM7SUFDZCxRQUFRLEVBQUU7UUFDUixPQUFPLEVBQUUsS0FBSztRQUNkLE1BQU0sRUFBRyxJQUFJO1FBQ2IsT0FBTyxFQUFFLFNBQVM7S0FDUztDQUM5QixDQUFBO0FBRUQsZUFBZSxJQUFJLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgSW50ZXJhY3RhYmxlIGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3RhYmxlJ1xuaW1wb3J0IEludGVyYWN0RXZlbnQgZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdEV2ZW50J1xuaW1wb3J0IHsgU2NvcGUgfSBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMnXG5pbXBvcnQgZHJhZyBmcm9tICcuLi9kcmFnJ1xuaW1wb3J0IERyb3BFdmVudCBmcm9tICcuL0Ryb3BFdmVudCdcblxuZXhwb3J0IGludGVyZmFjZSBEcm9wem9uZU1ldGhvZCB7XG4gIChvcHRpb25zOiBJbnRlcmFjdC5Ecm9wem9uZU9wdGlvbnMgfCBib29sZWFuKTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlXG4gICgpOiBJbnRlcmFjdC5Ecm9wem9uZU9wdGlvbnNcbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3RhYmxlJyB7XG4gIGludGVyZmFjZSBJbnRlcmFjdGFibGUge1xuICAgIGRyb3B6b25lOiBEcm9wem9uZU1ldGhvZFxuICAgIGRyb3BDaGVjazogKFxuICAgICAgZHJhZ0V2ZW50OiBJbnRlcmFjdEV2ZW50LFxuICAgICAgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsXG4gICAgICBkcmFnZ2FibGU6IEludGVyYWN0YWJsZSxcbiAgICAgIGRyYWdnYWJsZUVsZW1lbnQ6IEVsZW1lbnQsXG4gICAgICBkcm9wRWxlbWVuOiBFbGVtZW50LFxuICAgICAgcmVjdDogYW55XG4gICAgKSA9PiBib29sZWFuXG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3Rpb24nIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0aW9uIHtcbiAgICBkcm9wU3RhdGU/OiB7XG4gICAgICBjdXI6IHtcbiAgICAgICAgZHJvcHpvbmU6IEludGVyYWN0YWJsZSwgICAvLyB0aGUgZHJvcHpvbmUgYSBkcmFnIHRhcmdldCBtaWdodCBiZSBkcm9wcGVkIGludG9cbiAgICAgICAgZWxlbWVudDogRWxlbWVudCwgICAgICAgICAvLyB0aGUgZWxlbWVudCBhdCB0aGUgdGltZSBvZiBjaGVja2luZ1xuICAgICAgfSxcbiAgICAgIHByZXY6IHtcbiAgICAgICAgZHJvcHpvbmU6IEludGVyYWN0YWJsZSwgICAvLyB0aGUgZHJvcHpvbmUgdGhhdCB3YXMgcmVjZW50bHkgZHJhZ2dlZCBhd2F5IGZyb21cbiAgICAgICAgZWxlbWVudDogRWxlbWVudCwgICAgICAgICAvLyB0aGUgZWxlbWVudCBhdCB0aGUgdGltZSBvZiBjaGVja2luZ1xuICAgICAgfSxcbiAgICAgIHJlamVjdGVkOiBib29sZWFuLCAgICAgICAgICAvLyB3aGVhdGhlciB0aGUgcG90ZW50aWFsIGRyb3Agd2FzIHJlamVjdGVkIGZyb20gYSBsaXN0ZW5lclxuICAgICAgZXZlbnRzOiBhbnksICAgICAgICAgICAgICAgIC8vIHRoZSBkcm9wIGV2ZW50cyByZWxhdGVkIHRvIHRoZSBjdXJyZW50IGRyYWcgZXZlbnRcbiAgICAgIGFjdGl2ZURyb3BzOiBBcnJheTx7XG4gICAgICAgIGRyb3B6b25lOiBJbnRlcmFjdGFibGVcbiAgICAgICAgZWxlbWVudDogRWxlbWVudFxuICAgICAgICByZWN0OiBJbnRlcmFjdC5SZWN0XG4gICAgICB9PixcbiAgICB9XG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvZGVmYXVsdE9wdGlvbnMnIHtcbiAgaW50ZXJmYWNlIEFjdGlvbkRlZmF1bHRzIHtcbiAgICBkcm9wOiBJbnRlcmFjdC5Ecm9wem9uZU9wdGlvbnNcbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9zY29wZScge1xuICBpbnRlcmZhY2UgU2NvcGUge1xuICAgIGR5bmFtaWNEcm9wPzogYm9vbGVhblxuICB9XG59XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9pbnRlcmFjdC9pbnRlcmFjdCcge1xuICBpbnRlcmZhY2UgSW50ZXJhY3RTdGF0aWMge1xuICAgIGR5bmFtaWNEcm9wOiAobmV3VmFsdWU/OiBib29sZWFuKSA9PiBib29sZWFuIHwgSW50ZXJhY3QuaW50ZXJhY3RcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qge1xuICAgIGFjdGlvbnMsXG4gICAgLyoqIEBsZW5kcyBtb2R1bGU6aW50ZXJhY3QgKi9cbiAgICBpbnRlcmFjdCxcbiAgICAvKiogQGxlbmRzIEludGVyYWN0YWJsZSAqL1xuICAgIEludGVyYWN0YWJsZSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zaGFkb3dcbiAgICBpbnRlcmFjdGlvbnMsXG4gICAgZGVmYXVsdHMsXG4gIH0gPSBzY29wZVxuXG4gIHNjb3BlLnVzZVBsdWdpbihkcmFnKVxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdiZWZvcmUtYWN0aW9uLXN0YXJ0JywgKHsgaW50ZXJhY3Rpb24gfSkgPT4ge1xuICAgIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAnZHJhZycpIHsgcmV0dXJuIH1cblxuICAgIGludGVyYWN0aW9uLmRyb3BTdGF0ZSA9IHtcbiAgICAgIGN1cjoge1xuICAgICAgICBkcm9wem9uZTogbnVsbCxcbiAgICAgICAgZWxlbWVudDogbnVsbCxcbiAgICAgIH0sXG4gICAgICBwcmV2OiB7XG4gICAgICAgIGRyb3B6b25lOiBudWxsLFxuICAgICAgICBlbGVtZW50OiBudWxsLFxuICAgICAgfSxcbiAgICAgIHJlamVjdGVkOiBudWxsLFxuICAgICAgZXZlbnRzOiBudWxsLFxuICAgICAgYWN0aXZlRHJvcHM6IG51bGwsXG4gICAgfVxuICB9KVxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhZnRlci1hY3Rpb24tc3RhcnQnLCAoeyBpbnRlcmFjdGlvbiwgZXZlbnQsIGlFdmVudDogZHJhZ0V2ZW50IH0pID0+IHtcbiAgICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ2RyYWcnKSB7IHJldHVybiB9XG5cbiAgICBjb25zdCB7IGRyb3BTdGF0ZSB9ID0gaW50ZXJhY3Rpb25cblxuICAgIC8vIHJlc2V0IGFjdGl2ZSBkcm9wem9uZXNcbiAgICBkcm9wU3RhdGUuYWN0aXZlRHJvcHMgPSBudWxsXG4gICAgZHJvcFN0YXRlLmV2ZW50cyA9IG51bGxcbiAgICBkcm9wU3RhdGUuYWN0aXZlRHJvcHMgPSBnZXRBY3RpdmVEcm9wcyhzY29wZSwgaW50ZXJhY3Rpb24uZWxlbWVudClcbiAgICBkcm9wU3RhdGUuZXZlbnRzID0gZ2V0RHJvcEV2ZW50cyhpbnRlcmFjdGlvbiwgZXZlbnQsIGRyYWdFdmVudClcblxuICAgIGlmIChkcm9wU3RhdGUuZXZlbnRzLmFjdGl2YXRlKSB7XG4gICAgICBmaXJlQWN0aXZhdGlvbkV2ZW50cyhkcm9wU3RhdGUuYWN0aXZlRHJvcHMsIGRyb3BTdGF0ZS5ldmVudHMuYWN0aXZhdGUpXG4gICAgfVxuICB9KVxuXG4gIC8vIEZJWE1FIHByb3BlciBzaWduYWwgdHlwZXNcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FjdGlvbi1tb3ZlJywgKGFyZykgPT4gb25FdmVudENyZWF0ZWQoYXJnIGFzIGFueSwgc2NvcGUpKVxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLWVuZCcsIChhcmcpID0+IG9uRXZlbnRDcmVhdGVkKGFyZyBhcyBhbnksIHNjb3BlKSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWZ0ZXItYWN0aW9uLW1vdmUnLCAoeyBpbnRlcmFjdGlvbiB9KSA9PiB7XG4gICAgaWYgKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgIT09ICdkcmFnJykgeyByZXR1cm4gfVxuXG4gICAgZmlyZURyb3BFdmVudHMoaW50ZXJhY3Rpb24sIGludGVyYWN0aW9uLmRyb3BTdGF0ZS5ldmVudHMpXG4gICAgaW50ZXJhY3Rpb24uZHJvcFN0YXRlLmV2ZW50cyA9IHt9XG4gIH0pXG5cbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FmdGVyLWFjdGlvbi1lbmQnLCAoeyBpbnRlcmFjdGlvbiB9KSA9PiB7XG4gICAgaWYgKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgIT09ICdkcmFnJykgeyByZXR1cm4gfVxuXG4gICAgZmlyZURyb3BFdmVudHMoaW50ZXJhY3Rpb24sIGludGVyYWN0aW9uLmRyb3BTdGF0ZS5ldmVudHMpXG4gIH0pXG5cbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ3N0b3AnLCAoeyBpbnRlcmFjdGlvbiB9KSA9PiB7XG4gICAgaWYgKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgIT09ICdkcmFnJykgeyByZXR1cm4gfVxuXG4gICAgY29uc3QgeyBkcm9wU3RhdGUgfSA9IGludGVyYWN0aW9uXG5cbiAgICBpZiAoZHJvcFN0YXRlKSB7XG4gICAgICBkcm9wU3RhdGUuYWN0aXZlRHJvcHMgPSBudWxsXG4gICAgICBkcm9wU3RhdGUuZXZlbnRzID0gbnVsbFxuICAgICAgZHJvcFN0YXRlLmN1ci5kcm9wem9uZSA9IG51bGxcbiAgICAgIGRyb3BTdGF0ZS5jdXIuZWxlbWVudCA9IG51bGxcbiAgICAgIGRyb3BTdGF0ZS5wcmV2LmRyb3B6b25lID0gbnVsbFxuICAgICAgZHJvcFN0YXRlLnByZXYuZWxlbWVudCA9IG51bGxcbiAgICAgIGRyb3BTdGF0ZS5yZWplY3RlZCA9IGZhbHNlXG4gICAgfVxuICB9KVxuXG4gIC8qKlxuICAgKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCgnLmRyb3AnKS5kcm9wem9uZSh7XG4gICAqICAgYWNjZXB0OiAnLmNhbi1kcm9wJyB8fCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2luZ2xlLWRyb3AnKSxcbiAgICogICBvdmVybGFwOiAncG9pbnRlcicgfHwgJ2NlbnRlcicgfHwgemVyb1RvT25lXG4gICAqIH1cbiAgICogYGBgXG4gICAqXG4gICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIGRyYWdnYWJsZXMgY2FuIGJlIGRyb3BwZWQgb250byB0aGlzIHRhcmdldCB0b1xuICAgKiB0cmlnZ2VyIGRyb3AgZXZlbnRzXG4gICAqXG4gICAqIERyb3B6b25lcyBjYW4gcmVjZWl2ZSB0aGUgZm9sbG93aW5nIGV2ZW50czpcbiAgICogIC0gYGRyb3BhY3RpdmF0ZWAgYW5kIGBkcm9wZGVhY3RpdmF0ZWAgd2hlbiBhbiBhY2NlcHRhYmxlIGRyYWcgc3RhcnRzIGFuZCBlbmRzXG4gICAqICAtIGBkcmFnZW50ZXJgIGFuZCBgZHJhZ2xlYXZlYCB3aGVuIGEgZHJhZ2dhYmxlIGVudGVycyBhbmQgbGVhdmVzIHRoZSBkcm9wem9uZVxuICAgKiAgLSBgZHJhZ21vdmVgIHdoZW4gYSBkcmFnZ2FibGUgdGhhdCBoYXMgZW50ZXJlZCB0aGUgZHJvcHpvbmUgaXMgbW92ZWRcbiAgICogIC0gYGRyb3BgIHdoZW4gYSBkcmFnZ2FibGUgaXMgZHJvcHBlZCBpbnRvIHRoaXMgZHJvcHpvbmVcbiAgICpcbiAgICogVXNlIHRoZSBgYWNjZXB0YCBvcHRpb24gdG8gYWxsb3cgb25seSBlbGVtZW50cyB0aGF0IG1hdGNoIHRoZSBnaXZlbiBDU1NcbiAgICogc2VsZWN0b3Igb3IgZWxlbWVudC4gVGhlIHZhbHVlIGNhbiBiZTpcbiAgICpcbiAgICogIC0gKiphbiBFbGVtZW50KiogLSBvbmx5IHRoYXQgZWxlbWVudCBjYW4gYmUgZHJvcHBlZCBpbnRvIHRoaXMgZHJvcHpvbmUuXG4gICAqICAtICoqYSBzdHJpbmcqKiwgLSB0aGUgZWxlbWVudCBiZWluZyBkcmFnZ2VkIG11c3QgbWF0Y2ggaXQgYXMgYSBDU1Mgc2VsZWN0b3IuXG4gICAqICAtICoqYG51bGxgKiogLSBhY2NlcHQgb3B0aW9ucyBpcyBjbGVhcmVkIC0gaXQgYWNjZXB0cyBhbnkgZWxlbWVudC5cbiAgICpcbiAgICogVXNlIHRoZSBgb3ZlcmxhcGAgb3B0aW9uIHRvIHNldCBob3cgZHJvcHMgYXJlIGNoZWNrZWQgZm9yLiBUaGUgYWxsb3dlZFxuICAgKiB2YWx1ZXMgYXJlOlxuICAgKlxuICAgKiAgIC0gYCdwb2ludGVyJ2AsIHRoZSBwb2ludGVyIG11c3QgYmUgb3ZlciB0aGUgZHJvcHpvbmUgKGRlZmF1bHQpXG4gICAqICAgLSBgJ2NlbnRlcidgLCB0aGUgZHJhZ2dhYmxlIGVsZW1lbnQncyBjZW50ZXIgbXVzdCBiZSBvdmVyIHRoZSBkcm9wem9uZVxuICAgKiAgIC0gYSBudW1iZXIgZnJvbSAwLTEgd2hpY2ggaXMgdGhlIGAoaW50ZXJzZWN0aW9uIGFyZWEpIC8gKGRyYWdnYWJsZSBhcmVhKWAuXG4gICAqICAgZS5nLiBgMC41YCBmb3IgZHJvcCB0byBoYXBwZW4gd2hlbiBoYWxmIG9mIHRoZSBhcmVhIG9mIHRoZSBkcmFnZ2FibGUgaXNcbiAgICogICBvdmVyIHRoZSBkcm9wem9uZVxuICAgKlxuICAgKiBVc2UgdGhlIGBjaGVja2VyYCBvcHRpb24gdG8gc3BlY2lmeSBhIGZ1bmN0aW9uIHRvIGNoZWNrIGlmIGEgZHJhZ2dlZCBlbGVtZW50XG4gICAqIGlzIG92ZXIgdGhpcyBJbnRlcmFjdGFibGUuXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbiB8IG9iamVjdCB8IG51bGx9IFtvcHRpb25zXSBUaGUgbmV3IG9wdGlvbnMgdG8gYmUgc2V0LlxuICAgKiBAcmV0dXJuIHtib29sZWFuIHwgSW50ZXJhY3RhYmxlfSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLmRyb3B6b25lID0gZnVuY3Rpb24gKHRoaXM6IEludGVyYWN0LkludGVyYWN0YWJsZSwgb3B0aW9ucz86IEludGVyYWN0LkRyb3B6b25lT3B0aW9ucyB8IGJvb2xlYW4pIHtcbiAgICByZXR1cm4gZHJvcHpvbmVNZXRob2QodGhpcywgb3B0aW9ucylcbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCh0YXJnZXQpXG4gICAqIC5kcm9wQ2hlY2tlcihmdW5jdGlvbihkcmFnRXZlbnQsICAgICAgICAgLy8gcmVsYXRlZCBkcmFnbW92ZSBvciBkcmFnZW5kIGV2ZW50XG4gICAqICAgICAgICAgICAgICAgICAgICAgICBldmVudCwgICAgICAgICAgICAgLy8gVG91Y2hFdmVudC9Qb2ludGVyRXZlbnQvTW91c2VFdmVudFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgZHJvcHBlZCwgICAgICAgICAgIC8vIGJvb2wgcmVzdWx0IG9mIHRoZSBkZWZhdWx0IGNoZWNrZXJcbiAgICogICAgICAgICAgICAgICAgICAgICAgIGRyb3B6b25lLCAgICAgICAgICAvLyBkcm9wem9uZSBJbnRlcmFjdGFibGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgIGRyb3BFbGVtZW50LCAgICAgICAvLyBkcm9wem9uZSBlbGVtbnRcbiAgICogICAgICAgICAgICAgICAgICAgICAgIGRyYWdnYWJsZSwgICAgICAgICAvLyBkcmFnZ2FibGUgSW50ZXJhY3RhYmxlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGVFbGVtZW50KSB7Ly8gZHJhZ2dhYmxlIGVsZW1lbnRcbiAgICpcbiAgICogICByZXR1cm4gZHJvcHBlZCAmJiBldmVudC50YXJnZXQuaGFzQXR0cmlidXRlKCdhbGxvdy1kcm9wJylcbiAgICogfVxuICAgKiBgYGBcbiAgICovXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUuZHJvcENoZWNrID0gZnVuY3Rpb24gKHRoaXM6IEludGVyYWN0LkludGVyYWN0YWJsZSwgZHJhZ0V2ZW50LCBldmVudCwgZHJhZ2dhYmxlLCBkcmFnZ2FibGVFbGVtZW50LCBkcm9wRWxlbWVudCwgcmVjdCkge1xuICAgIHJldHVybiBkcm9wQ2hlY2tNZXRob2QodGhpcywgZHJhZ0V2ZW50LCBldmVudCwgZHJhZ2dhYmxlLCBkcmFnZ2FibGVFbGVtZW50LCBkcm9wRWxlbWVudCwgcmVjdClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciB0aGUgZGltZW5zaW9ucyBvZiBkcm9wem9uZSBlbGVtZW50cyBhcmUgY2FsY3VsYXRlZFxuICAgKiBvbiBldmVyeSBkcmFnbW92ZSBvciBvbmx5IG9uIGRyYWdzdGFydCBmb3IgdGhlIGRlZmF1bHQgZHJvcENoZWNrZXJcbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFufSBbbmV3VmFsdWVdIFRydWUgdG8gY2hlY2sgb24gZWFjaCBtb3ZlLiBGYWxzZSB0byBjaGVjayBvbmx5XG4gICAqIGJlZm9yZSBzdGFydFxuICAgKiBAcmV0dXJuIHtib29sZWFuIHwgaW50ZXJhY3R9IFRoZSBjdXJyZW50IHNldHRpbmcgb3IgaW50ZXJhY3RcbiAgICovXG4gIGludGVyYWN0LmR5bmFtaWNEcm9wID0gZnVuY3Rpb24gKG5ld1ZhbHVlPzogYm9vbGVhbikge1xuICAgIGlmICh1dGlscy5pcy5ib29sKG5ld1ZhbHVlKSkge1xuICAgICAgLy8gaWYgKGRyYWdnaW5nICYmIHNjb3BlLmR5bmFtaWNEcm9wICE9PSBuZXdWYWx1ZSAmJiAhbmV3VmFsdWUpIHtcbiAgICAgIC8vICBjYWxjUmVjdHMoZHJvcHpvbmVzKVxuICAgICAgLy8gfVxuXG4gICAgICBzY29wZS5keW5hbWljRHJvcCA9IG5ld1ZhbHVlXG5cbiAgICAgIHJldHVybiBpbnRlcmFjdFxuICAgIH1cbiAgICByZXR1cm4gc2NvcGUuZHluYW1pY0Ryb3BcbiAgfVxuXG4gIHV0aWxzLmFyci5tZXJnZShhY3Rpb25zLmV2ZW50VHlwZXMsIFtcbiAgICAnZHJhZ2VudGVyJyxcbiAgICAnZHJhZ2xlYXZlJyxcbiAgICAnZHJvcGFjdGl2YXRlJyxcbiAgICAnZHJvcGRlYWN0aXZhdGUnLFxuICAgICdkcm9wbW92ZScsXG4gICAgJ2Ryb3AnLFxuICBdKVxuICBhY3Rpb25zLm1ldGhvZERpY3QuZHJvcCA9ICdkcm9wem9uZSdcblxuICBzY29wZS5keW5hbWljRHJvcCA9IGZhbHNlXG5cbiAgZGVmYXVsdHMuYWN0aW9ucy5kcm9wID0gZHJvcC5kZWZhdWx0c1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0RHJvcHMgKHsgaW50ZXJhY3RhYmxlcyB9LCBkcmFnZ2FibGVFbGVtZW50KSB7XG4gIGNvbnN0IGRyb3BzID0gW11cblxuICAvLyBjb2xsZWN0IGFsbCBkcm9wem9uZXMgYW5kIHRoZWlyIGVsZW1lbnRzIHdoaWNoIHF1YWxpZnkgZm9yIGEgZHJvcFxuICBmb3IgKGNvbnN0IGRyb3B6b25lIG9mIGludGVyYWN0YWJsZXMubGlzdCkge1xuICAgIGlmICghZHJvcHpvbmUub3B0aW9ucy5kcm9wLmVuYWJsZWQpIHsgY29udGludWUgfVxuXG4gICAgY29uc3QgYWNjZXB0ID0gZHJvcHpvbmUub3B0aW9ucy5kcm9wLmFjY2VwdFxuXG4gICAgLy8gdGVzdCB0aGUgZHJhZ2dhYmxlIGRyYWdnYWJsZUVsZW1lbnQgYWdhaW5zdCB0aGUgZHJvcHpvbmUncyBhY2NlcHQgc2V0dGluZ1xuICAgIGlmICgodXRpbHMuaXMuZWxlbWVudChhY2NlcHQpICYmIGFjY2VwdCAhPT0gZHJhZ2dhYmxlRWxlbWVudCkgfHxcbiAgICAgICAgKHV0aWxzLmlzLnN0cmluZyhhY2NlcHQpICYmXG4gICAgICAgICF1dGlscy5kb20ubWF0Y2hlc1NlbGVjdG9yKGRyYWdnYWJsZUVsZW1lbnQsIGFjY2VwdCkpIHx8XG4gICAgICAgICh1dGlscy5pcy5mdW5jKGFjY2VwdCkgJiYgIWFjY2VwdCh7IGRyb3B6b25lLCBkcmFnZ2FibGVFbGVtZW50IH0pKSkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICAvLyBxdWVyeSBmb3IgbmV3IGVsZW1lbnRzIGlmIG5lY2Vzc2FyeVxuICAgIGNvbnN0IGRyb3BFbGVtZW50cyA9IHV0aWxzLmlzLnN0cmluZyhkcm9wem9uZS50YXJnZXQpXG4gICAgICA/IGRyb3B6b25lLl9jb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoZHJvcHpvbmUudGFyZ2V0KVxuICAgICAgOiB1dGlscy5pcy5hcnJheShkcm9wem9uZS50YXJnZXQpID8gZHJvcHpvbmUudGFyZ2V0IDogW2Ryb3B6b25lLnRhcmdldF1cblxuICAgIGZvciAoY29uc3QgZHJvcHpvbmVFbGVtZW50IG9mIGRyb3BFbGVtZW50cykge1xuICAgICAgaWYgKGRyb3B6b25lRWxlbWVudCAhPT0gZHJhZ2dhYmxlRWxlbWVudCkge1xuICAgICAgICBkcm9wcy5wdXNoKHtcbiAgICAgICAgICBkcm9wem9uZSxcbiAgICAgICAgICBlbGVtZW50OiBkcm9wem9uZUVsZW1lbnQsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRyb3BzXG59XG5cbmZ1bmN0aW9uIGZpcmVBY3RpdmF0aW9uRXZlbnRzIChhY3RpdmVEcm9wcywgZXZlbnQpIHtcbiAgLy8gbG9vcCB0aHJvdWdoIGFsbCBhY3RpdmUgZHJvcHpvbmVzIGFuZCB0cmlnZ2VyIGV2ZW50XG4gIGZvciAoY29uc3QgeyBkcm9wem9uZSwgZWxlbWVudCB9IG9mIGFjdGl2ZURyb3BzKSB7XG4gICAgZXZlbnQuZHJvcHpvbmUgPSBkcm9wem9uZVxuXG4gICAgLy8gc2V0IGN1cnJlbnQgZWxlbWVudCBhcyBldmVudCB0YXJnZXRcbiAgICBldmVudC50YXJnZXQgPSBlbGVtZW50XG4gICAgZHJvcHpvbmUuZmlyZShldmVudClcbiAgICBldmVudC5wcm9wYWdhdGlvblN0b3BwZWQgPSBldmVudC5pbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQgPSBmYWxzZVxuICB9XG59XG5cbi8vIHJldHVybiBhIG5ldyBhcnJheSBvZiBwb3NzaWJsZSBkcm9wcy4gZ2V0QWN0aXZlRHJvcHMgc2hvdWxkIGFsd2F5cyBiZVxuLy8gY2FsbGVkIHdoZW4gYSBkcmFnIGhhcyBqdXN0IHN0YXJ0ZWQgb3IgYSBkcmFnIGV2ZW50IGhhcHBlbnMgd2hpbGVcbi8vIGR5bmFtaWNEcm9wIGlzIHRydWVcbmZ1bmN0aW9uIGdldEFjdGl2ZURyb3BzIChzY29wZTogU2NvcGUsIGRyYWdFbGVtZW50OiBFbGVtZW50KSB7XG4gIC8vIGdldCBkcm9wem9uZXMgYW5kIHRoZWlyIGVsZW1lbnRzIHRoYXQgY291bGQgcmVjZWl2ZSB0aGUgZHJhZ2dhYmxlXG4gIGNvbnN0IGFjdGl2ZURyb3BzID0gY29sbGVjdERyb3BzKHNjb3BlLCBkcmFnRWxlbWVudClcblxuICBmb3IgKGNvbnN0IGFjdGl2ZURyb3Agb2YgYWN0aXZlRHJvcHMpIHtcbiAgICBhY3RpdmVEcm9wLnJlY3QgPSBhY3RpdmVEcm9wLmRyb3B6b25lLmdldFJlY3QoYWN0aXZlRHJvcC5lbGVtZW50KVxuICB9XG5cbiAgcmV0dXJuIGFjdGl2ZURyb3BzXG59XG5cbmZ1bmN0aW9uIGdldERyb3AgKHsgZHJvcFN0YXRlLCBpbnRlcmFjdGFibGU6IGRyYWdnYWJsZSwgZWxlbWVudDogZHJhZ0VsZW1lbnQgfTogUGFydGlhbDxJbnRlcmFjdC5JbnRlcmFjdGlvbj4sIGRyYWdFdmVudCwgcG9pbnRlckV2ZW50KSB7XG4gIGNvbnN0IHZhbGlkRHJvcHMgPSBbXVxuXG4gIC8vIGNvbGxlY3QgYWxsIGRyb3B6b25lcyBhbmQgdGhlaXIgZWxlbWVudHMgd2hpY2ggcXVhbGlmeSBmb3IgYSBkcm9wXG4gIGZvciAoY29uc3QgeyBkcm9wem9uZSwgZWxlbWVudDogZHJvcHpvbmVFbGVtZW50LCByZWN0IH0gb2YgZHJvcFN0YXRlLmFjdGl2ZURyb3BzKSB7XG4gICAgdmFsaWREcm9wcy5wdXNoKGRyb3B6b25lLmRyb3BDaGVjayhkcmFnRXZlbnQsIHBvaW50ZXJFdmVudCwgZHJhZ2dhYmxlLCBkcmFnRWxlbWVudCwgZHJvcHpvbmVFbGVtZW50LCByZWN0KVxuICAgICAgPyBkcm9wem9uZUVsZW1lbnRcbiAgICAgIDogbnVsbClcbiAgfVxuXG4gIC8vIGdldCB0aGUgbW9zdCBhcHByb3ByaWF0ZSBkcm9wem9uZSBiYXNlZCBvbiBET00gZGVwdGggYW5kIG9yZGVyXG4gIGNvbnN0IGRyb3BJbmRleCA9IHV0aWxzLmRvbS5pbmRleE9mRGVlcGVzdEVsZW1lbnQodmFsaWREcm9wcylcblxuICByZXR1cm4gZHJvcFN0YXRlLmFjdGl2ZURyb3BzW2Ryb3BJbmRleF0gfHwgbnVsbFxufVxuXG5mdW5jdGlvbiBnZXREcm9wRXZlbnRzIChpbnRlcmFjdGlvbjogSW50ZXJhY3QuSW50ZXJhY3Rpb24sIF9wb2ludGVyRXZlbnQsIGRyYWdFdmVudCkge1xuICBjb25zdCB7IGRyb3BTdGF0ZSB9ID0gaW50ZXJhY3Rpb25cbiAgY29uc3QgZHJvcEV2ZW50cyA9IHtcbiAgICBlbnRlciAgICAgOiBudWxsLFxuICAgIGxlYXZlICAgICA6IG51bGwsXG4gICAgYWN0aXZhdGUgIDogbnVsbCxcbiAgICBkZWFjdGl2YXRlOiBudWxsLFxuICAgIG1vdmUgICAgICA6IG51bGwsXG4gICAgZHJvcCAgICAgIDogbnVsbCxcbiAgfVxuXG4gIGlmIChkcmFnRXZlbnQudHlwZSA9PT0gJ2RyYWdzdGFydCcpIHtcbiAgICBkcm9wRXZlbnRzLmFjdGl2YXRlID0gbmV3IERyb3BFdmVudChkcm9wU3RhdGUsIGRyYWdFdmVudCwgJ2Ryb3BhY3RpdmF0ZScpXG5cbiAgICBkcm9wRXZlbnRzLmFjdGl2YXRlLnRhcmdldCAgID0gbnVsbFxuICAgIGRyb3BFdmVudHMuYWN0aXZhdGUuZHJvcHpvbmUgPSBudWxsXG4gIH1cbiAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ2VuZCcpIHtcbiAgICBkcm9wRXZlbnRzLmRlYWN0aXZhdGUgPSBuZXcgRHJvcEV2ZW50KGRyb3BTdGF0ZSwgZHJhZ0V2ZW50LCAnZHJvcGRlYWN0aXZhdGUnKVxuXG4gICAgZHJvcEV2ZW50cy5kZWFjdGl2YXRlLnRhcmdldCAgID0gbnVsbFxuICAgIGRyb3BFdmVudHMuZGVhY3RpdmF0ZS5kcm9wem9uZSA9IG51bGxcbiAgfVxuXG4gIGlmIChkcm9wU3RhdGUucmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gZHJvcEV2ZW50c1xuICB9XG5cbiAgaWYgKGRyb3BTdGF0ZS5jdXIuZWxlbWVudCAhPT0gZHJvcFN0YXRlLnByZXYuZWxlbWVudCkge1xuICAgIC8vIGlmIHRoZXJlIHdhcyBhIHByZXZpb3VzIGRyb3B6b25lLCBjcmVhdGUgYSBkcmFnbGVhdmUgZXZlbnRcbiAgICBpZiAoZHJvcFN0YXRlLnByZXYuZHJvcHpvbmUpIHtcbiAgICAgIGRyb3BFdmVudHMubGVhdmUgPSBuZXcgRHJvcEV2ZW50KGRyb3BTdGF0ZSwgZHJhZ0V2ZW50LCAnZHJhZ2xlYXZlJylcblxuICAgICAgZHJhZ0V2ZW50LmRyYWdMZWF2ZSAgICA9IGRyb3BFdmVudHMubGVhdmUudGFyZ2V0ICAgPSBkcm9wU3RhdGUucHJldi5lbGVtZW50XG4gICAgICBkcmFnRXZlbnQucHJldkRyb3B6b25lID0gZHJvcEV2ZW50cy5sZWF2ZS5kcm9wem9uZSA9IGRyb3BTdGF0ZS5wcmV2LmRyb3B6b25lXG4gICAgfVxuICAgIC8vIGlmIGRyb3B6b25lIGlzIG5vdCBudWxsLCBjcmVhdGUgYSBkcmFnZW50ZXIgZXZlbnRcbiAgICBpZiAoZHJvcFN0YXRlLmN1ci5kcm9wem9uZSkge1xuICAgICAgZHJvcEV2ZW50cy5lbnRlciA9IG5ldyBEcm9wRXZlbnQoZHJvcFN0YXRlLCBkcmFnRXZlbnQsICdkcmFnZW50ZXInKVxuXG4gICAgICBkcmFnRXZlbnQuZHJhZ0VudGVyID0gZHJvcFN0YXRlLmN1ci5lbGVtZW50XG4gICAgICBkcmFnRXZlbnQuZHJvcHpvbmUgPSBkcm9wU3RhdGUuY3VyLmRyb3B6b25lXG4gICAgfVxuICB9XG5cbiAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ2VuZCcgJiYgZHJvcFN0YXRlLmN1ci5kcm9wem9uZSkge1xuICAgIGRyb3BFdmVudHMuZHJvcCA9IG5ldyBEcm9wRXZlbnQoZHJvcFN0YXRlLCBkcmFnRXZlbnQsICdkcm9wJylcblxuICAgIGRyYWdFdmVudC5kcm9wem9uZSA9IGRyb3BTdGF0ZS5jdXIuZHJvcHpvbmVcbiAgICBkcmFnRXZlbnQucmVsYXRlZFRhcmdldCA9IGRyb3BTdGF0ZS5jdXIuZWxlbWVudFxuICB9XG4gIGlmIChkcmFnRXZlbnQudHlwZSA9PT0gJ2RyYWdtb3ZlJyAmJiBkcm9wU3RhdGUuY3VyLmRyb3B6b25lKSB7XG4gICAgZHJvcEV2ZW50cy5tb3ZlID0gbmV3IERyb3BFdmVudChkcm9wU3RhdGUsIGRyYWdFdmVudCwgJ2Ryb3Btb3ZlJylcblxuICAgIGRyb3BFdmVudHMubW92ZS5kcmFnbW92ZSA9IGRyYWdFdmVudFxuICAgIGRyYWdFdmVudC5kcm9wem9uZSA9IGRyb3BTdGF0ZS5jdXIuZHJvcHpvbmVcbiAgfVxuXG4gIHJldHVybiBkcm9wRXZlbnRzXG59XG5cbmZ1bmN0aW9uIGZpcmVEcm9wRXZlbnRzIChpbnRlcmFjdGlvbjogSW50ZXJhY3QuSW50ZXJhY3Rpb24sIGV2ZW50cykge1xuICBjb25zdCB7IGRyb3BTdGF0ZSB9ID0gaW50ZXJhY3Rpb25cbiAgY29uc3Qge1xuICAgIGFjdGl2ZURyb3BzLFxuICAgIGN1cixcbiAgICBwcmV2LFxuICB9ID0gZHJvcFN0YXRlXG5cbiAgaWYgKGV2ZW50cy5sZWF2ZSkgeyBwcmV2LmRyb3B6b25lLmZpcmUoZXZlbnRzLmxlYXZlKSB9XG4gIGlmIChldmVudHMubW92ZSkgeyBjdXIuZHJvcHpvbmUuZmlyZShldmVudHMubW92ZSkgfVxuICBpZiAoZXZlbnRzLmVudGVyKSB7IGN1ci5kcm9wem9uZS5maXJlKGV2ZW50cy5lbnRlcikgfVxuICBpZiAoZXZlbnRzLmRyb3ApIHsgY3VyLmRyb3B6b25lLmZpcmUoZXZlbnRzLmRyb3ApIH1cblxuICBpZiAoZXZlbnRzLmRlYWN0aXZhdGUpIHtcbiAgICBmaXJlQWN0aXZhdGlvbkV2ZW50cyhhY3RpdmVEcm9wcywgZXZlbnRzLmRlYWN0aXZhdGUpXG4gIH1cblxuICBkcm9wU3RhdGUucHJldi5kcm9wem9uZSAgPSBjdXIuZHJvcHpvbmVcbiAgZHJvcFN0YXRlLnByZXYuZWxlbWVudCA9IGN1ci5lbGVtZW50XG59XG5cbmZ1bmN0aW9uIG9uRXZlbnRDcmVhdGVkICh7IGludGVyYWN0aW9uLCBpRXZlbnQsIGV2ZW50IH06IEludGVyYWN0LlNpZ25hbEFyZywgc2NvcGUpIHtcbiAgaWYgKGlFdmVudC50eXBlICE9PSAnZHJhZ21vdmUnICYmIGlFdmVudC50eXBlICE9PSAnZHJhZ2VuZCcpIHsgcmV0dXJuIH1cblxuICBjb25zdCB7IGRyb3BTdGF0ZSB9ID0gaW50ZXJhY3Rpb25cblxuICBpZiAoc2NvcGUuZHluYW1pY0Ryb3ApIHtcbiAgICBkcm9wU3RhdGUuYWN0aXZlRHJvcHMgPSBnZXRBY3RpdmVEcm9wcyhzY29wZSwgaW50ZXJhY3Rpb24uZWxlbWVudClcbiAgfVxuXG4gIGNvbnN0IGRyYWdFdmVudCA9IGlFdmVudFxuICBjb25zdCBkcm9wUmVzdWx0ID0gZ2V0RHJvcChpbnRlcmFjdGlvbiwgZHJhZ0V2ZW50LCBldmVudClcblxuICAvLyB1cGRhdGUgcmVqZWN0ZWQgc3RhdHVzXG4gIGRyb3BTdGF0ZS5yZWplY3RlZCA9IGRyb3BTdGF0ZS5yZWplY3RlZCAmJlxuICAgICEhZHJvcFJlc3VsdCAmJlxuICAgIGRyb3BSZXN1bHQuZHJvcHpvbmUgPT09IGRyb3BTdGF0ZS5jdXIuZHJvcHpvbmUgJiZcbiAgICBkcm9wUmVzdWx0LmVsZW1lbnQgPT09IGRyb3BTdGF0ZS5jdXIuZWxlbWVudFxuXG4gIGRyb3BTdGF0ZS5jdXIuZHJvcHpvbmUgID0gZHJvcFJlc3VsdCAmJiBkcm9wUmVzdWx0LmRyb3B6b25lXG4gIGRyb3BTdGF0ZS5jdXIuZWxlbWVudCA9IGRyb3BSZXN1bHQgJiYgZHJvcFJlc3VsdC5lbGVtZW50XG5cbiAgZHJvcFN0YXRlLmV2ZW50cyA9IGdldERyb3BFdmVudHMoaW50ZXJhY3Rpb24sIGV2ZW50LCBkcmFnRXZlbnQpXG59XG5cbmZ1bmN0aW9uIGRyb3B6b25lTWV0aG9kIChpbnRlcmFjdGFibGU6IEludGVyYWN0LkludGVyYWN0YWJsZSk6IEludGVyYWN0LkRyb3B6b25lT3B0aW9uc1xuZnVuY3Rpb24gZHJvcHpvbmVNZXRob2QgKGludGVyYWN0YWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBvcHRpb25zOiBJbnRlcmFjdC5Ecm9wem9uZU9wdGlvbnMgfCBib29sZWFuKVxuZnVuY3Rpb24gZHJvcHpvbmVNZXRob2QgKGludGVyYWN0YWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBvcHRpb25zPzogSW50ZXJhY3QuRHJvcHpvbmVPcHRpb25zIHwgYm9vbGVhbikge1xuICBpZiAodXRpbHMuaXMub2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkICE9PSBmYWxzZVxuXG4gICAgaWYgKG9wdGlvbnMubGlzdGVuZXJzKSB7XG4gICAgICBjb25zdCBub3JtYWxpemVkID0gdXRpbHMubm9ybWFsaXplTGlzdGVuZXJzKG9wdGlvbnMubGlzdGVuZXJzKVxuICAgICAgLy8gcmVuYW1lICdkcm9wJyB0byAnJyBhcyBpdCB3aWxsIGJlIHByZWZpeGVkIHdpdGggJ2Ryb3AnXG4gICAgICBjb25zdCBjb3JyZWN0ZWQgPSBPYmplY3Qua2V5cyhub3JtYWxpemVkKS5yZWR1Y2UoKGFjYywgdHlwZSkgPT4ge1xuICAgICAgICBjb25zdCBjb3JyZWN0ZWRUeXBlID0gL14oZW50ZXJ8bGVhdmUpLy50ZXN0KHR5cGUpXG4gICAgICAgICAgPyBgZHJhZyR7dHlwZX1gXG4gICAgICAgICAgOiAvXihhY3RpdmF0ZXxkZWFjdGl2YXRlfG1vdmUpLy50ZXN0KHR5cGUpXG4gICAgICAgICAgICA/IGBkcm9wJHt0eXBlfWBcbiAgICAgICAgICAgIDogdHlwZVxuXG4gICAgICAgIGFjY1tjb3JyZWN0ZWRUeXBlXSA9IG5vcm1hbGl6ZWRbdHlwZV1cblxuICAgICAgICByZXR1cm4gYWNjXG4gICAgICB9LCB7fSlcblxuICAgICAgaW50ZXJhY3RhYmxlLm9mZihpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmxpc3RlbmVycylcbiAgICAgIGludGVyYWN0YWJsZS5vbihjb3JyZWN0ZWQpXG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmxpc3RlbmVycyA9IGNvcnJlY3RlZFxuICAgIH1cblxuICAgIGlmICh1dGlscy5pcy5mdW5jKG9wdGlvbnMub25kcm9wKSkgeyBpbnRlcmFjdGFibGUub24oJ2Ryb3AnLCBvcHRpb25zLm9uZHJvcCkgfVxuICAgIGlmICh1dGlscy5pcy5mdW5jKG9wdGlvbnMub25kcm9wYWN0aXZhdGUpKSB7IGludGVyYWN0YWJsZS5vbignZHJvcGFjdGl2YXRlJywgb3B0aW9ucy5vbmRyb3BhY3RpdmF0ZSkgfVxuICAgIGlmICh1dGlscy5pcy5mdW5jKG9wdGlvbnMub25kcm9wZGVhY3RpdmF0ZSkpIHsgaW50ZXJhY3RhYmxlLm9uKCdkcm9wZGVhY3RpdmF0ZScsIG9wdGlvbnMub25kcm9wZGVhY3RpdmF0ZSkgfVxuICAgIGlmICh1dGlscy5pcy5mdW5jKG9wdGlvbnMub25kcmFnZW50ZXIpKSB7IGludGVyYWN0YWJsZS5vbignZHJhZ2VudGVyJywgb3B0aW9ucy5vbmRyYWdlbnRlcikgfVxuICAgIGlmICh1dGlscy5pcy5mdW5jKG9wdGlvbnMub25kcmFnbGVhdmUpKSB7IGludGVyYWN0YWJsZS5vbignZHJhZ2xlYXZlJywgb3B0aW9ucy5vbmRyYWdsZWF2ZSkgfVxuICAgIGlmICh1dGlscy5pcy5mdW5jKG9wdGlvbnMub25kcm9wbW92ZSkpIHsgaW50ZXJhY3RhYmxlLm9uKCdkcm9wbW92ZScsIG9wdGlvbnMub25kcm9wbW92ZSkgfVxuXG4gICAgaWYgKC9eKHBvaW50ZXJ8Y2VudGVyKSQvLnRlc3Qob3B0aW9ucy5vdmVybGFwIGFzIHN0cmluZykpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3Aub3ZlcmxhcCA9IG9wdGlvbnMub3ZlcmxhcFxuICAgIH1cbiAgICBlbHNlIGlmICh1dGlscy5pcy5udW1iZXIob3B0aW9ucy5vdmVybGFwKSkge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5vdmVybGFwID0gTWF0aC5tYXgoTWF0aC5taW4oMSwgb3B0aW9ucy5vdmVybGFwKSwgMClcbiAgICB9XG4gICAgaWYgKCdhY2NlcHQnIGluIG9wdGlvbnMpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AuYWNjZXB0ID0gb3B0aW9ucy5hY2NlcHRcbiAgICB9XG4gICAgaWYgKCdjaGVja2VyJyBpbiBvcHRpb25zKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmNoZWNrZXIgPSBvcHRpb25zLmNoZWNrZXJcbiAgICB9XG5cbiAgICByZXR1cm4gaW50ZXJhY3RhYmxlXG4gIH1cblxuICBpZiAodXRpbHMuaXMuYm9vbChvcHRpb25zKSkge1xuICAgIGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AuZW5hYmxlZCA9IG9wdGlvbnNcblxuICAgIHJldHVybiBpbnRlcmFjdGFibGVcbiAgfVxuXG4gIHJldHVybiBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wXG59XG5cbmZ1bmN0aW9uIGRyb3BDaGVja01ldGhvZCAoXG4gIGludGVyYWN0YWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLFxuICBkcmFnRXZlbnQ6IEludGVyYWN0RXZlbnQsXG4gIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLFxuICBkcmFnZ2FibGU6IEludGVyYWN0LkludGVyYWN0YWJsZSxcbiAgZHJhZ2dhYmxlRWxlbWVudDogRWxlbWVudCxcbiAgZHJvcEVsZW1lbnQ6IEVsZW1lbnQsXG4gIHJlY3Q6IGFueVxuKSB7XG4gIGxldCBkcm9wcGVkID0gZmFsc2VcblxuICAvLyBpZiB0aGUgZHJvcHpvbmUgaGFzIG5vIHJlY3QgKGVnLiBkaXNwbGF5OiBub25lKVxuICAvLyBjYWxsIHRoZSBjdXN0b20gZHJvcENoZWNrZXIgb3IganVzdCByZXR1cm4gZmFsc2VcbiAgaWYgKCEocmVjdCA9IHJlY3QgfHwgaW50ZXJhY3RhYmxlLmdldFJlY3QoZHJvcEVsZW1lbnQpKSkge1xuICAgIHJldHVybiAoaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5jaGVja2VyXG4gICAgICA/IGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AuY2hlY2tlcihkcmFnRXZlbnQsIGV2ZW50LCBkcm9wcGVkLCBpbnRlcmFjdGFibGUsIGRyb3BFbGVtZW50LCBkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQpXG4gICAgICA6IGZhbHNlKVxuICB9XG5cbiAgY29uc3QgZHJvcE92ZXJsYXAgPSBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLm92ZXJsYXBcblxuICBpZiAoZHJvcE92ZXJsYXAgPT09ICdwb2ludGVyJykge1xuICAgIGNvbnN0IG9yaWdpbiA9IHV0aWxzLmdldE9yaWdpblhZKGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudCwgJ2RyYWcnKVxuICAgIGNvbnN0IHBhZ2UgPSB1dGlscy5wb2ludGVyLmdldFBhZ2VYWShkcmFnRXZlbnQpXG5cbiAgICBwYWdlLnggKz0gb3JpZ2luLnhcbiAgICBwYWdlLnkgKz0gb3JpZ2luLnlcblxuICAgIGNvbnN0IGhvcml6b250YWwgPSAocGFnZS54ID4gcmVjdC5sZWZ0KSAmJiAocGFnZS54IDwgcmVjdC5yaWdodClcbiAgICBjb25zdCB2ZXJ0aWNhbCAgID0gKHBhZ2UueSA+IHJlY3QudG9wKSAmJiAocGFnZS55IDwgcmVjdC5ib3R0b20pXG5cbiAgICBkcm9wcGVkID0gaG9yaXpvbnRhbCAmJiB2ZXJ0aWNhbFxuICB9XG5cbiAgY29uc3QgZHJhZ1JlY3QgPSBkcmFnZ2FibGUuZ2V0UmVjdChkcmFnZ2FibGVFbGVtZW50KVxuXG4gIGlmIChkcmFnUmVjdCAmJiBkcm9wT3ZlcmxhcCA9PT0gJ2NlbnRlcicpIHtcbiAgICBjb25zdCBjeCA9IGRyYWdSZWN0LmxlZnQgKyBkcmFnUmVjdC53aWR0aCAgLyAyXG4gICAgY29uc3QgY3kgPSBkcmFnUmVjdC50b3AgICsgZHJhZ1JlY3QuaGVpZ2h0IC8gMlxuXG4gICAgZHJvcHBlZCA9IGN4ID49IHJlY3QubGVmdCAmJiBjeCA8PSByZWN0LnJpZ2h0ICYmIGN5ID49IHJlY3QudG9wICYmIGN5IDw9IHJlY3QuYm90dG9tXG4gIH1cblxuICBpZiAoZHJhZ1JlY3QgJiYgdXRpbHMuaXMubnVtYmVyKGRyb3BPdmVybGFwKSkge1xuICAgIGNvbnN0IG92ZXJsYXBBcmVhICA9IChNYXRoLm1heCgwLCBNYXRoLm1pbihyZWN0LnJpZ2h0LCBkcmFnUmVjdC5yaWdodCkgLSBNYXRoLm1heChyZWN0LmxlZnQsIGRyYWdSZWN0LmxlZnQpKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KDAsIE1hdGgubWluKHJlY3QuYm90dG9tLCBkcmFnUmVjdC5ib3R0b20pIC0gTWF0aC5tYXgocmVjdC50b3AsIGRyYWdSZWN0LnRvcCkpKVxuXG4gICAgY29uc3Qgb3ZlcmxhcFJhdGlvID0gb3ZlcmxhcEFyZWEgLyAoZHJhZ1JlY3Qud2lkdGggKiBkcmFnUmVjdC5oZWlnaHQpXG5cbiAgICBkcm9wcGVkID0gb3ZlcmxhcFJhdGlvID49IGRyb3BPdmVybGFwXG4gIH1cblxuICBpZiAoaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5jaGVja2VyKSB7XG4gICAgZHJvcHBlZCA9IGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AuY2hlY2tlcihkcmFnRXZlbnQsIGV2ZW50LCBkcm9wcGVkLCBpbnRlcmFjdGFibGUsIGRyb3BFbGVtZW50LCBkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQpXG4gIH1cblxuICByZXR1cm4gZHJvcHBlZFxufVxuXG5jb25zdCBkcm9wID0ge1xuICBpZDogJ2FjdGlvbnMvZHJvcCcsXG4gIGluc3RhbGwsXG4gIGdldEFjdGl2ZURyb3BzLFxuICBnZXREcm9wLFxuICBnZXREcm9wRXZlbnRzLFxuICBmaXJlRHJvcEV2ZW50cyxcbiAgZGVmYXVsdHM6IHtcbiAgICBlbmFibGVkOiBmYWxzZSxcbiAgICBhY2NlcHQgOiBudWxsLFxuICAgIG92ZXJsYXA6ICdwb2ludGVyJyxcbiAgfSBhcyBJbnRlcmFjdC5Ecm9wem9uZU9wdGlvbnMsXG59XG5cbmV4cG9ydCBkZWZhdWx0IGRyb3BcbiJdfQ==