import * as utils from '@interactjs/utils';
import DropEvent from './DropEvent';
function install(scope) {
    const { actions, 
    /** @lends module:interact */
    interact, 
    /** @lends Interactable */
    Interactable, interactions, defaults, } = scope;
    interactions.signals.on('after-action-start', ({ interaction, event, iEvent: dragEvent }) => {
        if (interaction.prepared.name !== 'drag') {
            return;
        }
        const { dropStatus } = interaction;
        // reset active dropzones
        dropStatus.activeDrops = null;
        dropStatus.events = null;
        // TODO: maybe Interaction<T: Window | Document | Element> { element: T }
        if (!scope.dynamicDrop) {
            dropStatus.activeDrops = getActiveDrops(scope, interaction.element);
        }
        dropStatus.events = getDropEvents(interaction, event, dragEvent);
        if (dropStatus.events.activate) {
            fireActivationEvents(dropStatus.activeDrops, dropStatus.events.activate);
        }
    });
    // FIXME proper signal types
    interactions.signals.on('action-move', (arg) => onEventCreated(arg, scope));
    interactions.signals.on('action-end', (arg) => onEventCreated(arg, scope));
    interactions.signals.on('after-action-move', ({ interaction }) => {
        if (interaction.prepared.name !== 'drag') {
            return;
        }
        fireDropEvents(interaction, interaction.dropStatus.events);
        interaction.dropStatus.events = {};
    });
    interactions.signals.on('after-action-end', ({ interaction }) => {
        if (interaction.prepared.name === 'drag') {
            fireDropEvents(interaction, interaction.dropStatus.events);
        }
    });
    interactions.signals.on('stop', ({ interaction }) => {
        interaction.dropStatus.activeDrops = null;
        interaction.dropStatus.events = null;
    });
    interactions.signals.on('new', (interaction) => {
        interaction.dropStatus = {
            cur: {
                dropzone: null,
                element: null,
            },
            prev: {
                dropzone: null,
                element: null,
            },
            rejected: false,
            events: null,
            activeDrops: null,
        };
    });
    interactions.signals.on('stop', ({ interaction: { dropStatus } }) => {
        dropStatus.cur.dropzone = dropStatus.cur.element =
            dropStatus.prev.dropzone = dropStatus.prev.element = null;
        dropStatus.rejected = false;
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
function getDrop({ dropStatus, target: draggable, element: dragElement }, dragEvent, pointerEvent) {
    const validDrops = [];
    // collect all dropzones and their elements which qualify for a drop
    for (const { dropzone, element: dropzoneElement, rect } of dropStatus.activeDrops) {
        validDrops.push(dropzone.dropCheck(dragEvent, pointerEvent, draggable, dragElement, dropzoneElement, rect)
            ? dropzoneElement
            : null);
    }
    // get the most appropriate dropzone based on DOM depth and order
    const dropIndex = utils.dom.indexOfDeepestElement(validDrops);
    return dropStatus.activeDrops[dropIndex] || null;
}
function getDropEvents(interaction, _pointerEvent, dragEvent) {
    const { dropStatus } = interaction;
    const dropEvents = {
        enter: null,
        leave: null,
        activate: null,
        deactivate: null,
        move: null,
        drop: null,
    };
    if (dragEvent.type === 'dragstart') {
        dropEvents.activate = new DropEvent(dropStatus, dragEvent, 'dropactivate');
        dropEvents.activate.target = null;
        dropEvents.activate.dropzone = null;
    }
    if (dragEvent.type === 'dragend') {
        dropEvents.deactivate = new DropEvent(dropStatus, dragEvent, 'dropdeactivate');
        dropEvents.deactivate.target = null;
        dropEvents.deactivate.dropzone = null;
    }
    if (dropStatus.rejected) {
        return dropEvents;
    }
    if (dropStatus.cur.element !== dropStatus.prev.element) {
        // if there was a previous dropzone, create a dragleave event
        if (dropStatus.prev.dropzone) {
            dropEvents.leave = new DropEvent(dropStatus, dragEvent, 'dragleave');
            dragEvent.dragLeave = dropEvents.leave.target = dropStatus.prev.element;
            dragEvent.prevDropzone = dropEvents.leave.dropzone = dropStatus.prev.dropzone;
        }
        // if dropzone is not null, create a dragenter event
        if (dropStatus.cur.dropzone) {
            dropEvents.enter = new DropEvent(dropStatus, dragEvent, 'dragenter');
            dragEvent.dragEnter = dropStatus.cur.element;
            dragEvent.dropzone = dropStatus.cur.dropzone;
        }
    }
    if (dragEvent.type === 'dragend' && dropStatus.cur.dropzone) {
        dropEvents.drop = new DropEvent(dropStatus, dragEvent, 'drop');
        dragEvent.dropzone = dropStatus.cur.dropzone;
        dragEvent.relatedTarget = dropStatus.cur.element;
    }
    if (dragEvent.type === 'dragmove' && dropStatus.cur.dropzone) {
        dropEvents.move = new DropEvent(dropStatus, dragEvent, 'dropmove');
        dropEvents.move.dragmove = dragEvent;
        dragEvent.dropzone = dropStatus.cur.dropzone;
    }
    return dropEvents;
}
function fireDropEvents(interaction, events) {
    const { dropStatus } = interaction;
    const { activeDrops, cur, prev, } = dropStatus;
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
    dropStatus.prev.dropzone = cur.dropzone;
    dropStatus.prev.element = cur.element;
}
function onEventCreated({ interaction, iEvent, event }, scope) {
    if (iEvent.type !== 'dragmove' && iEvent.type !== 'dragend') {
        return;
    }
    const { dropStatus } = interaction;
    if (scope.dynamicDrop) {
        dropStatus.activeDrops = getActiveDrops(scope, interaction.element);
    }
    const dragEvent = iEvent;
    const dropResult = getDrop(interaction, dragEvent, event);
    // update rejected status
    dropStatus.rejected = dropStatus.rejected &&
        !!dropResult &&
        dropResult.dropzone === dropStatus.cur.dropzone &&
        dropResult.element === dropStatus.cur.element;
    dropStatus.cur.dropzone = dropResult && dropResult.dropzone;
    dropStatus.cur.element = dropResult && dropResult.element;
    dropStatus.events = getDropEvents(interaction, event, dragEvent);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBQzFDLE9BQU8sU0FBUyxNQUFNLGFBQWEsQ0FBQTtBQTBDbkMsU0FBUyxPQUFPLENBQUUsS0FBWTtJQUM1QixNQUFNLEVBQ0osT0FBTztJQUNQLDZCQUE2QjtJQUM3QixRQUFRO0lBQ1IsMEJBQTBCO0lBQzFCLFlBQVksRUFDWixZQUFZLEVBQ1osUUFBUSxHQUNULEdBQUcsS0FBSyxDQUFBO0lBRVQsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7UUFDMUYsSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUU7WUFBRSxPQUFNO1NBQUU7UUFFcEQsTUFBTSxFQUFFLFVBQVUsRUFBRSxHQUFHLFdBQVcsQ0FBQTtRQUVsQyx5QkFBeUI7UUFDekIsVUFBVSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUE7UUFDN0IsVUFBVSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUE7UUFFeEIseUVBQXlFO1FBQ3pFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFO1lBQ3RCLFVBQVUsQ0FBQyxXQUFXLEdBQUcsY0FBYyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUE7U0FDcEU7UUFFRCxVQUFVLENBQUMsTUFBTSxHQUFHLGFBQWEsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBRWhFLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsb0JBQW9CLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxD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TUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsS0FBSyxHQUFJLENBQUMsQ0FBQTtRQUM5QyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsR0FBRyxHQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFBO1FBRTlDLE9BQU8sR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQTtLQUNyRjtJQUVELElBQUksUUFBUSxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1FBQzVDLE1BQU0sV0FBVyxHQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3RGLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFN0csTUFBTSxZQUFZLEdBQUcsV0FBVyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUE7UUFFckUsT0FBTyxHQUFHLFlBQVksSUFBSSxXQUFXLENBQUE7S0FDdEM7SUFFRCxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNyQyxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUE7S0FDL0g7SUFFRCxPQUFPLE9BQU8sQ0FBQTtBQUNoQixDQUFDO0FBRUQsTUFBTSxJQUFJLEdBQUc7SUFDWCxPQUFPO0lBQ1AsY0FBYztJQUNkLE9BQU87SUFDUCxhQUFhO0lBQ2IsY0FBYztJQUNkLFFBQVEsRUFBRTtRQUNSLE9BQU8sRUFBRSxLQUFLO1FBQ2QsTUFBTSxFQUFHLElBQUk7UUFDYixPQUFPLEVBQUUsU0FBUztLQUNTO0NBQzlCLENBQUE7QUFFRCxlQUFlLElBQUksQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBJbnRlcmFjdEV2ZW50IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3RFdmVudCdcbmltcG9ydCB7IFNjb3BlIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9zY29wZSdcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzJ1xuaW1wb3J0IERyb3BFdmVudCBmcm9tICcuL0Ryb3BFdmVudCdcblxuZXhwb3J0IHR5cGUgRHJvcHpvbmVNZXRob2QgPSAob3B0aW9ucz86IEludGVyYWN0LkRyb3B6b25lT3B0aW9ucyB8IGJvb2xlYW4pID0+IEludGVyYWN0LkludGVyYWN0YWJsZSB8IEludGVyYWN0LkRyb3B6b25lT3B0aW9uc1xuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGFibGUnIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0YWJsZSB7XG4gICAgZHJvcHpvbmU6IERyb3B6b25lTWV0aG9kXG4gICAgZHJvcENoZWNrOiAoXG4gICAgICBkcmFnRXZlbnQ6IEludGVyYWN0RXZlbnQsXG4gICAgICBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSxcbiAgICAgIGRyYWdnYWJsZTogSW50ZXJhY3RhYmxlLFxuICAgICAgZHJhZ2dhYmxlRWxlbWVudDogRWxlbWVudCxcbiAgICAgIGRyb3BFbGVtZW46IEVsZW1lbnQsXG4gICAgICByZWN0OiBhbnlcbiAgICApID0+IGJvb2xlYW5cbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbicge1xuICBpbnRlcmZhY2UgSW50ZXJhY3Rpb24ge1xuICAgIGRyb3BTdGF0dXM/OiB7IFtrZXk6IHN0cmluZ106IGFueSB9XG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvZGVmYXVsdE9wdGlvbnMnIHtcbiAgaW50ZXJmYWNlIEFjdGlvbkRlZmF1bHRzIHtcbiAgICBkcm9wPzogSW50ZXJhY3QuRHJvcHpvbmVPcHRpb25zXG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnIHtcbiAgaW50ZXJmYWNlIFNjb3BlIHtcbiAgICBkeW5hbWljRHJvcD86IGJvb2xlYW5cbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvaW50ZXJhY3QvaW50ZXJhY3QnIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0U3RhdGljIHtcbiAgICBkeW5hbWljRHJvcDogKG5ld1ZhbHVlPzogYm9vbGVhbikgPT4gYm9vbGVhbiB8IEludGVyYWN0LmludGVyYWN0XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5zdGFsbCAoc2NvcGU6IFNjb3BlKSB7XG4gIGNvbnN0IHtcbiAgICBhY3Rpb25zLFxuICAgIC8qKiBAbGVuZHMgbW9kdWxlOmludGVyYWN0ICovXG4gICAgaW50ZXJhY3QsXG4gICAgLyoqIEBsZW5kcyBJbnRlcmFjdGFibGUgKi9cbiAgICBJbnRlcmFjdGFibGUsXG4gICAgaW50ZXJhY3Rpb25zLFxuICAgIGRlZmF1bHRzLFxuICB9ID0gc2NvcGVcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWZ0ZXItYWN0aW9uLXN0YXJ0JywgKHsgaW50ZXJhY3Rpb24sIGV2ZW50LCBpRXZlbnQ6IGRyYWdFdmVudCB9KSA9PiB7XG4gICAgaWYgKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgIT09ICdkcmFnJykgeyByZXR1cm4gfVxuXG4gICAgY29uc3QgeyBkcm9wU3RhdHVzIH0gPSBpbnRlcmFjdGlvblxuXG4gICAgLy8gcmVzZXQgYWN0aXZlIGRyb3B6b25lc1xuICAgIGRyb3BTdGF0dXMuYWN0aXZlRHJvcHMgPSBudWxsXG4gICAgZHJvcFN0YXR1cy5ldmVudHMgPSBudWxsXG5cbiAgICAvLyBUT0RPOiBtYXliZSBJbnRlcmFjdGlvbjxUOiBXaW5kb3cgfCBEb2N1bWVudCB8IEVsZW1lbnQ+IHsgZWxlbWVudDogVCB9XG4gICAgaWYgKCFzY29wZS5keW5hbWljRHJvcCkge1xuICAgICAgZHJvcFN0YXR1cy5hY3RpdmVEcm9wcyA9IGdldEFjdGl2ZURyb3BzKHNjb3BlLCBpbnRlcmFjdGlvbi5lbGVtZW50KVxuICAgIH1cblxuICAgIGRyb3BTdGF0dXMuZXZlbnRzID0gZ2V0RHJvcEV2ZW50cyhpbnRlcmFjdGlvbiwgZXZlbnQsIGRyYWdFdmVudClcblxuICAgIGlmIChkcm9wU3RhdHVzLmV2ZW50cy5hY3RpdmF0ZSkge1xuICAgICAgZmlyZUFjdGl2YXRpb25FdmVudHMoZHJvcFN0YXR1cy5hY3RpdmVEcm9wcywgZHJvcFN0YXR1cy5ldmVudHMuYWN0aXZhdGUpXG4gICAgfVxuICB9KVxuXG4gIC8vIEZJWE1FIHByb3BlciBzaWduYWwgdHlwZXNcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FjdGlvbi1tb3ZlJywgKGFyZykgPT4gb25FdmVudENyZWF0ZWQoYXJnIGFzIGFueSwgc2NvcGUpKVxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLWVuZCcsIChhcmcpID0+IG9uRXZlbnRDcmVhdGVkKGFyZyBhcyBhbnksIHNjb3BlKSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWZ0ZXItYWN0aW9uLW1vdmUnLCAoeyBpbnRlcmFjdGlvbiB9KSA9PiB7XG4gICAgaWYgKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgIT09ICdkcmFnJykgeyByZXR1cm4gfVxuXG4gICAgZmlyZURyb3BFdmVudHMoaW50ZXJhY3Rpb24sIGludGVyYWN0aW9uLmRyb3BTdGF0dXMuZXZlbnRzKVxuICAgIGludGVyYWN0aW9uLmRyb3BTdGF0dXMuZXZlbnRzID0ge31cbiAgfSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWZ0ZXItYWN0aW9uLWVuZCcsICh7IGludGVyYWN0aW9uIH0pID0+IHtcbiAgICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSA9PT0gJ2RyYWcnKSB7XG4gICAgICBmaXJlRHJvcEV2ZW50cyhpbnRlcmFjdGlvbiwgaW50ZXJhY3Rpb24uZHJvcFN0YXR1cy5ldmVudHMpXG4gICAgfVxuICB9KVxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdzdG9wJywgKHsgaW50ZXJhY3Rpb24gfSkgPT4ge1xuICAgIGludGVyYWN0aW9uLmRyb3BTdGF0dXMuYWN0aXZlRHJvcHMgPSBudWxsXG4gICAgaW50ZXJhY3Rpb24uZHJvcFN0YXR1cy5ldmVudHMgPSBudWxsXG4gIH0pXG5cbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ25ldycsIChpbnRlcmFjdGlvbikgPT4ge1xuICAgIGludGVyYWN0aW9uLmRyb3BTdGF0dXMgPSB7XG4gICAgICBjdXI6IHtcbiAgICAgICAgZHJvcHpvbmUgOiBudWxsLCAgLy8gdGhlIGRyb3B6b25lIGEgZHJhZyB0YXJnZXQgbWlnaHQgYmUgZHJvcHBlZCBpbnRvXG4gICAgICAgIGVsZW1lbnQgIDogbnVsbCwgIC8vIHRoZSBlbGVtZW50IGF0IHRoZSB0aW1lIG9mIGNoZWNraW5nXG4gICAgICB9LFxuICAgICAgcHJldjoge1xuICAgICAgICBkcm9wem9uZSA6IG51bGwsICAvLyB0aGUgZHJvcHpvbmUgdGhhdCB3YXMgcmVjZW50bHkgZHJhZ2dlZCBhd2F5IGZyb21cbiAgICAgICAgZWxlbWVudCAgOiBudWxsLCAgLy8gdGhlIGVsZW1lbnQgYXQgdGhlIHRpbWUgb2YgY2hlY2tpbmdcbiAgICAgIH0sXG4gICAgICByZWplY3RlZCAgIDogZmFsc2UsIC8vIHdoZWF0aGVyIHRoZSBwb3RlbnRpYWwgZHJvcCB3YXMgcmVqZWN0ZWQgZnJvbSBhIGxpc3RlbmVyXG4gICAgICBldmVudHMgICAgIDogbnVsbCwgIC8vIHRoZSBkcm9wIGV2ZW50cyByZWxhdGVkIHRvIHRoZSBjdXJyZW50IGRyYWcgZXZlbnRcbiAgICAgIGFjdGl2ZURyb3BzOiBudWxsLCAgLy8gYW4gYXJyYXkgb2YgeyBkcm9wem9uZSwgZWxlbWVudCwgcmVjdCB9XG4gICAgfVxuICB9KVxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdzdG9wJywgKHsgaW50ZXJhY3Rpb246IHsgZHJvcFN0YXR1cyB9IH0pID0+IHtcbiAgICBkcm9wU3RhdHVzLmN1ci5kcm9wem9uZSA9IGRyb3BTdGF0dXMuY3VyLmVsZW1lbnQgPVxuICAgICAgZHJvcFN0YXR1cy5wcmV2LmRyb3B6b25lID0gZHJvcFN0YXR1cy5wcmV2LmVsZW1lbnQgPSBudWxsXG4gICAgZHJvcFN0YXR1cy5yZWplY3RlZCA9IGZhbHNlXG4gIH0pXG5cbiAgLyoqXG4gICAqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KCcuZHJvcCcpLmRyb3B6b25lKHtcbiAgICogICBhY2NlcHQ6ICcuY2FuLWRyb3AnIHx8IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaW5nbGUtZHJvcCcpLFxuICAgKiAgIG92ZXJsYXA6ICdwb2ludGVyJyB8fCAnY2VudGVyJyB8fCB6ZXJvVG9PbmVcbiAgICogfVxuICAgKiBgYGBcbiAgICpcbiAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgZHJhZ2dhYmxlcyBjYW4gYmUgZHJvcHBlZCBvbnRvIHRoaXMgdGFyZ2V0IHRvXG4gICAqIHRyaWdnZXIgZHJvcCBldmVudHNcbiAgICpcbiAgICogRHJvcHpvbmVzIGNhbiByZWNlaXZlIHRoZSBmb2xsb3dpbmcgZXZlbnRzOlxuICAgKiAgLSBgZHJvcGFjdGl2YXRlYCBhbmQgYGRyb3BkZWFjdGl2YXRlYCB3aGVuIGFuIGFjY2VwdGFibGUgZHJhZyBzdGFydHMgYW5kIGVuZHNcbiAgICogIC0gYGRyYWdlbnRlcmAgYW5kIGBkcmFnbGVhdmVgIHdoZW4gYSBkcmFnZ2FibGUgZW50ZXJzIGFuZCBsZWF2ZXMgdGhlIGRyb3B6b25lXG4gICAqICAtIGBkcmFnbW92ZWAgd2hlbiBhIGRyYWdnYWJsZSB0aGF0IGhhcyBlbnRlcmVkIHRoZSBkcm9wem9uZSBpcyBtb3ZlZFxuICAgKiAgLSBgZHJvcGAgd2hlbiBhIGRyYWdnYWJsZSBpcyBkcm9wcGVkIGludG8gdGhpcyBkcm9wem9uZVxuICAgKlxuICAgKiBVc2UgdGhlIGBhY2NlcHRgIG9wdGlvbiB0byBhbGxvdyBvbmx5IGVsZW1lbnRzIHRoYXQgbWF0Y2ggdGhlIGdpdmVuIENTU1xuICAgKiBzZWxlY3RvciBvciBlbGVtZW50LiBUaGUgdmFsdWUgY2FuIGJlOlxuICAgKlxuICAgKiAgLSAqKmFuIEVsZW1lbnQqKiAtIG9ubHkgdGhhdCBlbGVtZW50IGNhbiBiZSBkcm9wcGVkIGludG8gdGhpcyBkcm9wem9uZS5cbiAgICogIC0gKiphIHN0cmluZyoqLCAtIHRoZSBlbGVtZW50IGJlaW5nIGRyYWdnZWQgbXVzdCBtYXRjaCBpdCBhcyBhIENTUyBzZWxlY3Rvci5cbiAgICogIC0gKipgbnVsbGAqKiAtIGFjY2VwdCBvcHRpb25zIGlzIGNsZWFyZWQgLSBpdCBhY2NlcHRzIGFueSBlbGVtZW50LlxuICAgKlxuICAgKiBVc2UgdGhlIGBvdmVybGFwYCBvcHRpb24gdG8gc2V0IGhvdyBkcm9wcyBhcmUgY2hlY2tlZCBmb3IuIFRoZSBhbGxvd2VkXG4gICAqIHZhbHVlcyBhcmU6XG4gICAqXG4gICAqICAgLSBgJ3BvaW50ZXInYCwgdGhlIHBvaW50ZXIgbXVzdCBiZSBvdmVyIHRoZSBkcm9wem9uZSAoZGVmYXVsdClcbiAgICogICAtIGAnY2VudGVyJ2AsIHRoZSBkcmFnZ2FibGUgZWxlbWVudCdzIGNlbnRlciBtdXN0IGJlIG92ZXIgdGhlIGRyb3B6b25lXG4gICAqICAgLSBhIG51bWJlciBmcm9tIDAtMSB3aGljaCBpcyB0aGUgYChpbnRlcnNlY3Rpb24gYXJlYSkgLyAoZHJhZ2dhYmxlIGFyZWEpYC5cbiAgICogICBlLmcuIGAwLjVgIGZvciBkcm9wIHRvIGhhcHBlbiB3aGVuIGhhbGYgb2YgdGhlIGFyZWEgb2YgdGhlIGRyYWdnYWJsZSBpc1xuICAgKiAgIG92ZXIgdGhlIGRyb3B6b25lXG4gICAqXG4gICAqIFVzZSB0aGUgYGNoZWNrZXJgIG9wdGlvbiB0byBzcGVjaWZ5IGEgZnVuY3Rpb24gdG8gY2hlY2sgaWYgYSBkcmFnZ2VkIGVsZW1lbnRcbiAgICogaXMgb3ZlciB0aGlzIEludGVyYWN0YWJsZS5cbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFuIHwgb2JqZWN0IHwgbnVsbH0gW29wdGlvbnNdIFRoZSBuZXcgb3B0aW9ucyB0byBiZSBzZXQuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW4gfCBJbnRlcmFjdGFibGV9IFRoZSBjdXJyZW50IHNldHRpbmcgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUuZHJvcHpvbmUgPSBmdW5jdGlvbiAodGhpczogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBvcHRpb25zKSB7XG4gICAgcmV0dXJuIGRyb3B6b25lTWV0aG9kKHRoaXMsIG9wdGlvbnMpXG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QodGFyZ2V0KVxuICAgKiAuZHJvcENoZWNrZXIoZnVuY3Rpb24oZHJhZ0V2ZW50LCAgICAgICAgIC8vIHJlbGF0ZWQgZHJhZ21vdmUgb3IgZHJhZ2VuZCBldmVudFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQsICAgICAgICAgICAgIC8vIFRvdWNoRXZlbnQvUG9pbnRlckV2ZW50L01vdXNlRXZlbnRcbiAgICogICAgICAgICAgICAgICAgICAgICAgIGRyb3BwZWQsICAgICAgICAgICAvLyBib29sIHJlc3VsdCBvZiB0aGUgZGVmYXVsdCBjaGVja2VyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICBkcm9wem9uZSwgICAgICAgICAgLy8gZHJvcHpvbmUgSW50ZXJhY3RhYmxlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICBkcm9wRWxlbWVudCwgICAgICAgLy8gZHJvcHpvbmUgZWxlbW50XG4gICAqICAgICAgICAgICAgICAgICAgICAgICBkcmFnZ2FibGUsICAgICAgICAgLy8gZHJhZ2dhYmxlIEludGVyYWN0YWJsZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgZHJhZ2dhYmxlRWxlbWVudCkgey8vIGRyYWdnYWJsZSBlbGVtZW50XG4gICAqXG4gICAqICAgcmV0dXJuIGRyb3BwZWQgJiYgZXZlbnQudGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnYWxsb3ctZHJvcCcpO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5kcm9wQ2hlY2sgPSBmdW5jdGlvbiAodGhpczogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBkcmFnRXZlbnQsIGV2ZW50LCBkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQsIGRyb3BFbGVtZW50LCByZWN0KSB7XG4gICAgcmV0dXJuIGRyb3BDaGVja01ldGhvZCh0aGlzLCBkcmFnRXZlbnQsIGV2ZW50LCBkcmFnZ2FibGUsIGRyYWdnYWJsZUVsZW1lbnQsIGRyb3BFbGVtZW50LCByZWN0KVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIHRoZSBkaW1lbnNpb25zIG9mIGRyb3B6b25lIGVsZW1lbnRzIGFyZSBjYWxjdWxhdGVkXG4gICAqIG9uIGV2ZXJ5IGRyYWdtb3ZlIG9yIG9ubHkgb24gZHJhZ3N0YXJ0IGZvciB0aGUgZGVmYXVsdCBkcm9wQ2hlY2tlclxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtuZXdWYWx1ZV0gVHJ1ZSB0byBjaGVjayBvbiBlYWNoIG1vdmUuIEZhbHNlIHRvIGNoZWNrIG9ubHlcbiAgICogYmVmb3JlIHN0YXJ0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW4gfCBpbnRlcmFjdH0gVGhlIGN1cnJlbnQgc2V0dGluZyBvciBpbnRlcmFjdFxuICAgKi9cbiAgaW50ZXJhY3QuZHluYW1pY0Ryb3AgPSBmdW5jdGlvbiAobmV3VmFsdWU/OiBib29sZWFuKSB7XG4gICAgaWYgKHV0aWxzLmlzLmJvb2wobmV3VmFsdWUpKSB7XG4gICAgICAvLyBpZiAoZHJhZ2dpbmcgJiYgc2NvcGUuZHluYW1pY0Ryb3AgIT09IG5ld1ZhbHVlICYmICFuZXdWYWx1ZSkge1xuICAgICAgLy8gIGNhbGNSZWN0cyhkcm9wem9uZXMpO1xuICAgICAgLy8gfVxuXG4gICAgICBzY29wZS5keW5hbWljRHJvcCA9IG5ld1ZhbHVlXG5cbiAgICAgIHJldHVybiBpbnRlcmFjdFxuICAgIH1cbiAgICByZXR1cm4gc2NvcGUuZHluYW1pY0Ryb3BcbiAgfVxuXG4gIHV0aWxzLmFyci5tZXJnZShhY3Rpb25zLmV2ZW50VHlwZXMsIFtcbiAgICAnZHJhZ2VudGVyJyxcbiAgICAnZHJhZ2xlYXZlJyxcbiAgICAnZHJvcGFjdGl2YXRlJyxcbiAgICAnZHJvcGRlYWN0aXZhdGUnLFxuICAgICdkcm9wbW92ZScsXG4gICAgJ2Ryb3AnLFxuICBdKVxuICBhY3Rpb25zLm1ldGhvZERpY3QuZHJvcCA9ICdkcm9wem9uZSdcblxuICBzY29wZS5keW5hbWljRHJvcCA9IGZhbHNlXG5cbiAgZGVmYXVsdHMuYWN0aW9ucy5kcm9wID0gZHJvcC5kZWZhdWx0c1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0RHJvcHMgKHsgaW50ZXJhY3RhYmxlcyB9LCBkcmFnZ2FibGVFbGVtZW50KSB7XG4gIGNvbnN0IGRyb3BzID0gW11cblxuICAvLyBjb2xsZWN0IGFsbCBkcm9wem9uZXMgYW5kIHRoZWlyIGVsZW1lbnRzIHdoaWNoIHF1YWxpZnkgZm9yIGEgZHJvcFxuICBmb3IgKGNvbnN0IGRyb3B6b25lIG9mIGludGVyYWN0YWJsZXMubGlzdCkge1xuICAgIGlmICghZHJvcHpvbmUub3B0aW9ucy5kcm9wLmVuYWJsZWQpIHsgY29udGludWUgfVxuXG4gICAgY29uc3QgYWNjZXB0ID0gZHJvcHpvbmUub3B0aW9ucy5kcm9wLmFjY2VwdFxuXG4gICAgLy8gdGVzdCB0aGUgZHJhZ2dhYmxlIGRyYWdnYWJsZUVsZW1lbnQgYWdhaW5zdCB0aGUgZHJvcHpvbmUncyBhY2NlcHQgc2V0dGluZ1xuICAgIGlmICgodXRpbHMuaXMuZWxlbWVudChhY2NlcHQpICYmIGFjY2VwdCAhPT0gZHJhZ2dhYmxlRWxlbWVudCkgfHxcbiAgICAgICAgKHV0aWxzLmlzLnN0cmluZyhhY2NlcHQpICYmXG4gICAgICAgICF1dGlscy5kb20ubWF0Y2hlc1NlbGVjdG9yKGRyYWdnYWJsZUVsZW1lbnQsIGFjY2VwdCkpIHx8XG4gICAgICAgICh1dGlscy5pcy5mdW5jKGFjY2VwdCkgJiYgIWFjY2VwdCh7IGRyb3B6b25lLCBkcmFnZ2FibGVFbGVtZW50IH0pKSkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICAvLyBxdWVyeSBmb3IgbmV3IGVsZW1lbnRzIGlmIG5lY2Vzc2FyeVxuICAgIGNvbnN0IGRyb3BFbGVtZW50cyA9IHV0aWxzLmlzLnN0cmluZyhkcm9wem9uZS50YXJnZXQpXG4gICAgICA/IGRyb3B6b25lLl9jb250ZXh0LnF1ZXJ5U2VsZWN0b3JBbGwoZHJvcHpvbmUudGFyZ2V0KVxuICAgICAgOiB1dGlscy5pcy5hcnJheShkcm9wem9uZS50YXJnZXQpID8gZHJvcHpvbmUudGFyZ2V0IDogW2Ryb3B6b25lLnRhcmdldF1cblxuICAgIGZvciAoY29uc3QgZHJvcHpvbmVFbGVtZW50IG9mIGRyb3BFbGVtZW50cykge1xuICAgICAgaWYgKGRyb3B6b25lRWxlbWVudCAhPT0gZHJhZ2dhYmxlRWxlbWVudCkge1xuICAgICAgICBkcm9wcy5wdXNoKHtcbiAgICAgICAgICBkcm9wem9uZSxcbiAgICAgICAgICBlbGVtZW50OiBkcm9wem9uZUVsZW1lbnQsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGRyb3BzXG59XG5cbmZ1bmN0aW9uIGZpcmVBY3RpdmF0aW9uRXZlbnRzIChhY3RpdmVEcm9wcywgZXZlbnQpIHtcbiAgLy8gbG9vcCB0aHJvdWdoIGFsbCBhY3RpdmUgZHJvcHpvbmVzIGFuZCB0cmlnZ2VyIGV2ZW50XG4gIGZvciAoY29uc3QgeyBkcm9wem9uZSwgZWxlbWVudCB9IG9mIGFjdGl2ZURyb3BzKSB7XG4gICAgZXZlbnQuZHJvcHpvbmUgPSBkcm9wem9uZVxuXG4gICAgLy8gc2V0IGN1cnJlbnQgZWxlbWVudCBhcyBldmVudCB0YXJnZXRcbiAgICBldmVudC50YXJnZXQgPSBlbGVtZW50XG4gICAgZHJvcHpvbmUuZmlyZShldmVudClcbiAgICBldmVudC5wcm9wYWdhdGlvblN0b3BwZWQgPSBldmVudC5pbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQgPSBmYWxzZVxuICB9XG59XG5cbi8vIHJldHVybiBhIG5ldyBhcnJheSBvZiBwb3NzaWJsZSBkcm9wcy4gZ2V0QWN0aXZlRHJvcHMgc2hvdWxkIGFsd2F5cyBiZVxuLy8gY2FsbGVkIHdoZW4gYSBkcmFnIGhhcyBqdXN0IHN0YXJ0ZWQgb3IgYSBkcmFnIGV2ZW50IGhhcHBlbnMgd2hpbGVcbi8vIGR5bmFtaWNEcm9wIGlzIHRydWVcbmZ1bmN0aW9uIGdldEFjdGl2ZURyb3BzIChzY29wZTogU2NvcGUsIGRyYWdFbGVtZW50OiBFbGVtZW50KSB7XG4gIC8vIGdldCBkcm9wem9uZXMgYW5kIHRoZWlyIGVsZW1lbnRzIHRoYXQgY291bGQgcmVjZWl2ZSB0aGUgZHJhZ2dhYmxlXG4gIGNvbnN0IGFjdGl2ZURyb3BzID0gY29sbGVjdERyb3BzKHNjb3BlLCBkcmFnRWxlbWVudClcblxuICBmb3IgKGNvbnN0IGFjdGl2ZURyb3Agb2YgYWN0aXZlRHJvcHMpIHtcbiAgICBhY3RpdmVEcm9wLnJlY3QgPSBhY3RpdmVEcm9wLmRyb3B6b25lLmdldFJlY3QoYWN0aXZlRHJvcC5lbGVtZW50KVxuICB9XG5cbiAgcmV0dXJuIGFjdGl2ZURyb3BzXG59XG5cbmZ1bmN0aW9uIGdldERyb3AgKHsgZHJvcFN0YXR1cywgdGFyZ2V0OiBkcmFnZ2FibGUsIGVsZW1lbnQ6IGRyYWdFbGVtZW50IH0sIGRyYWdFdmVudCwgcG9pbnRlckV2ZW50KSB7XG4gIGNvbnN0IHZhbGlkRHJvcHMgPSBbXVxuXG4gIC8vIGNvbGxlY3QgYWxsIGRyb3B6b25lcyBhbmQgdGhlaXIgZWxlbWVudHMgd2hpY2ggcXVhbGlmeSBmb3IgYSBkcm9wXG4gIGZvciAoY29uc3QgeyBkcm9wem9uZSwgZWxlbWVudDogZHJvcHpvbmVFbGVtZW50LCByZWN0IH0gb2YgZHJvcFN0YXR1cy5hY3RpdmVEcm9wcykge1xuICAgIHZhbGlkRHJvcHMucHVzaChkcm9wem9uZS5kcm9wQ2hlY2soZHJhZ0V2ZW50LCBwb2ludGVyRXZlbnQsIGRyYWdnYWJsZSwgZHJhZ0VsZW1lbnQsIGRyb3B6b25lRWxlbWVudCwgcmVjdClcbiAgICAgID8gZHJvcHpvbmVFbGVtZW50XG4gICAgICA6IG51bGwpXG4gIH1cblxuICAvLyBnZXQgdGhlIG1vc3QgYXBwcm9wcmlhdGUgZHJvcHpvbmUgYmFzZWQgb24gRE9NIGRlcHRoIGFuZCBvcmRlclxuICBjb25zdCBkcm9wSW5kZXggPSB1dGlscy5kb20uaW5kZXhPZkRlZXBlc3RFbGVtZW50KHZhbGlkRHJvcHMpXG5cbiAgcmV0dXJuIGRyb3BTdGF0dXMuYWN0aXZlRHJvcHNbZHJvcEluZGV4XSB8fCBudWxsXG59XG5cbmZ1bmN0aW9uIGdldERyb3BFdmVudHMgKGludGVyYWN0aW9uLCBfcG9pbnRlckV2ZW50LCBkcmFnRXZlbnQpIHtcbiAgY29uc3QgeyBkcm9wU3RhdHVzIH0gPSBpbnRlcmFjdGlvblxuICBjb25zdCBkcm9wRXZlbnRzID0ge1xuICAgIGVudGVyICAgICA6IG51bGwsXG4gICAgbGVhdmUgICAgIDogbnVsbCxcbiAgICBhY3RpdmF0ZSAgOiBudWxsLFxuICAgIGRlYWN0aXZhdGU6IG51bGwsXG4gICAgbW92ZSAgICAgIDogbnVsbCxcbiAgICBkcm9wICAgICAgOiBudWxsLFxuICB9XG5cbiAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ3N0YXJ0Jykge1xuICAgIGRyb3BFdmVudHMuYWN0aXZhdGUgPSBuZXcgRHJvcEV2ZW50KGRyb3BTdGF0dXMsIGRyYWdFdmVudCwgJ2Ryb3BhY3RpdmF0ZScpXG5cbiAgICBkcm9wRXZlbnRzLmFjdGl2YXRlLnRhcmdldCAgID0gbnVsbFxuICAgIGRyb3BFdmVudHMuYWN0aXZhdGUuZHJvcHpvbmUgPSBudWxsXG4gIH1cbiAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ2VuZCcpIHtcbiAgICBkcm9wRXZlbnRzLmRlYWN0aXZhdGUgPSBuZXcgRHJvcEV2ZW50KGRyb3BTdGF0dXMsIGRyYWdFdmVudCwgJ2Ryb3BkZWFjdGl2YXRlJylcblxuICAgIGRyb3BFdmVudHMuZGVhY3RpdmF0ZS50YXJnZXQgICA9IG51bGxcbiAgICBkcm9wRXZlbnRzLmRlYWN0aXZhdGUuZHJvcHpvbmUgPSBudWxsXG4gIH1cblxuICBpZiAoZHJvcFN0YXR1cy5yZWplY3RlZCkge1xuICAgIHJldHVybiBkcm9wRXZlbnRzXG4gIH1cblxuICBpZiAoZHJvcFN0YXR1cy5jdXIuZWxlbWVudCAhPT0gZHJvcFN0YXR1cy5wcmV2LmVsZW1lbnQpIHtcbiAgICAvLyBpZiB0aGVyZSB3YXMgYSBwcmV2aW91cyBkcm9wem9uZSwgY3JlYXRlIGEgZHJhZ2xlYXZlIGV2ZW50XG4gICAgaWYgKGRyb3BTdGF0dXMucHJldi5kcm9wem9uZSkge1xuICAgICAgZHJvcEV2ZW50cy5sZWF2ZSA9IG5ldyBEcm9wRXZlbnQoZHJvcFN0YXR1cywgZHJhZ0V2ZW50LCAnZHJhZ2xlYXZlJylcblxuICAgICAgZHJhZ0V2ZW50LmRyYWdMZWF2ZSAgICA9IGRyb3BFdmVudHMubGVhdmUudGFyZ2V0ICAgPSBkcm9wU3RhdHVzLnByZXYuZWxlbWVudFxuICAgICAgZHJhZ0V2ZW50LnByZXZEcm9wem9uZSA9IGRyb3BFdmVudHMubGVhdmUuZHJvcHpvbmUgPSBkcm9wU3RhdHVzLnByZXYuZHJvcHpvbmVcbiAgICB9XG4gICAgLy8gaWYgZHJvcHpvbmUgaXMgbm90IG51bGwsIGNyZWF0ZSBhIGRyYWdlbnRlciBldmVudFxuICAgIGlmIChkcm9wU3RhdHVzLmN1ci5kcm9wem9uZSkge1xuICAgICAgZHJvcEV2ZW50cy5lbnRlciA9IG5ldyBEcm9wRXZlbnQoZHJvcFN0YXR1cywgZHJhZ0V2ZW50LCAnZHJhZ2VudGVyJylcblxuICAgICAgZHJhZ0V2ZW50LmRyYWdFbnRlciA9IGRyb3BTdGF0dXMuY3VyLmVsZW1lbnRcbiAgICAgIGRyYWdFdmVudC5kcm9wem9uZSA9IGRyb3BTdGF0dXMuY3VyLmRyb3B6b25lXG4gICAgfVxuICB9XG5cbiAgaWYgKGRyYWdFdmVudC50eXBlID09PSAnZHJhZ2VuZCcgJiYgZHJvcFN0YXR1cy5jdXIuZHJvcHpvbmUpIHtcbiAgICBkcm9wRXZlbnRzLmRyb3AgPSBuZXcgRHJvcEV2ZW50KGRyb3BTdGF0dXMsIGRyYWdFdmVudCwgJ2Ryb3AnKVxuXG4gICAgZHJhZ0V2ZW50LmRyb3B6b25lID0gZHJvcFN0YXR1cy5jdXIuZHJvcHpvbmVcbiAgICBkcmFnRXZlbnQucmVsYXRlZFRhcmdldCA9IGRyb3BTdGF0dXMuY3VyLmVsZW1lbnRcbiAgfVxuICBpZiAoZHJhZ0V2ZW50LnR5cGUgPT09ICdkcmFnbW92ZScgJiYgZHJvcFN0YXR1cy5jdXIuZHJvcHpvbmUpIHtcbiAgICBkcm9wRXZlbnRzLm1vdmUgPSBuZXcgRHJvcEV2ZW50KGRyb3BTdGF0dXMsIGRyYWdFdmVudCwgJ2Ryb3Btb3ZlJylcblxuICAgIGRyb3BFdmVudHMubW92ZS5kcmFnbW92ZSA9IGRyYWdFdmVudFxuICAgIGRyYWdFdmVudC5kcm9wem9uZSA9IGRyb3BTdGF0dXMuY3VyLmRyb3B6b25lXG4gIH1cblxuICByZXR1cm4gZHJvcEV2ZW50c1xufVxuXG5mdW5jdGlvbiBmaXJlRHJvcEV2ZW50cyAoaW50ZXJhY3Rpb24sIGV2ZW50cykge1xuICBjb25zdCB7IGRyb3BTdGF0dXMgfSA9IGludGVyYWN0aW9uXG4gIGNvbnN0IHtcbiAgICBhY3RpdmVEcm9wcyxcbiAgICBjdXIsXG4gICAgcHJldixcbiAgfSA9IGRyb3BTdGF0dXNcblxuICBpZiAoZXZlbnRzLmxlYXZlKSB7IHByZXYuZHJvcHpvbmUuZmlyZShldmVudHMubGVhdmUpIH1cbiAgaWYgKGV2ZW50cy5tb3ZlKSB7IGN1ci5kcm9wem9uZS5maXJlKGV2ZW50cy5tb3ZlKSB9XG4gIGlmIChldmVudHMuZW50ZXIpIHsgY3VyLmRyb3B6b25lLmZpcmUoZXZlbnRzLmVudGVyKSB9XG4gIGlmIChldmVudHMuZHJvcCkgeyBjdXIuZHJvcHpvbmUuZmlyZShldmVudHMuZHJvcCkgfVxuXG4gIGlmIChldmVudHMuZGVhY3RpdmF0ZSkge1xuICAgIGZpcmVBY3RpdmF0aW9uRXZlbnRzKGFjdGl2ZURyb3BzLCBldmVudHMuZGVhY3RpdmF0ZSlcbiAgfVxuXG4gIGRyb3BTdGF0dXMucHJldi5kcm9wem9uZSAgPSBjdXIuZHJvcHpvbmVcbiAgZHJvcFN0YXR1cy5wcmV2LmVsZW1lbnQgPSBjdXIuZWxlbWVudFxufVxuXG5mdW5jdGlvbiBvbkV2ZW50Q3JlYXRlZCAoeyBpbnRlcmFjdGlvbiwgaUV2ZW50LCBldmVudCB9LCBzY29wZSkge1xuICBpZiAoaUV2ZW50LnR5cGUgIT09ICdkcmFnbW92ZScgJiYgaUV2ZW50LnR5cGUgIT09ICdkcmFnZW5kJykgeyByZXR1cm4gfVxuXG4gIGNvbnN0IHsgZHJvcFN0YXR1cyB9ID0gaW50ZXJhY3Rpb25cblxuICBpZiAoc2NvcGUuZHluYW1pY0Ryb3ApIHtcbiAgICBkcm9wU3RhdHVzLmFjdGl2ZURyb3BzID0gZ2V0QWN0aXZlRHJvcHMoc2NvcGUsIGludGVyYWN0aW9uLmVsZW1lbnQpXG4gIH1cblxuICBjb25zdCBkcmFnRXZlbnQgPSBpRXZlbnRcbiAgY29uc3QgZHJvcFJlc3VsdCA9IGdldERyb3AoaW50ZXJhY3Rpb24sIGRyYWdFdmVudCwgZXZlbnQpXG5cbiAgLy8gdXBkYXRlIHJlamVjdGVkIHN0YXR1c1xuICBkcm9wU3RhdHVzLnJlamVjdGVkID0gZHJvcFN0YXR1cy5yZWplY3RlZCAmJlxuICAgICEhZHJvcFJlc3VsdCAmJlxuICAgIGRyb3BSZXN1bHQuZHJvcHpvbmUgPT09IGRyb3BTdGF0dXMuY3VyLmRyb3B6b25lICYmXG4gICAgZHJvcFJlc3VsdC5lbGVtZW50ID09PSBkcm9wU3RhdHVzLmN1ci5lbGVtZW50XG5cbiAgZHJvcFN0YXR1cy5jdXIuZHJvcHpvbmUgID0gZHJvcFJlc3VsdCAmJiBkcm9wUmVzdWx0LmRyb3B6b25lXG4gIGRyb3BTdGF0dXMuY3VyLmVsZW1lbnQgPSBkcm9wUmVzdWx0ICYmIGRyb3BSZXN1bHQuZWxlbWVudFxuXG4gIGRyb3BTdGF0dXMuZXZlbnRzID0gZ2V0RHJvcEV2ZW50cyhpbnRlcmFjdGlvbiwgZXZlbnQsIGRyYWdFdmVudClcbn1cblxuZnVuY3Rpb24gZHJvcHpvbmVNZXRob2QgKGludGVyYWN0YWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBvcHRpb25zOiBJbnRlcmFjdC5Ecm9wem9uZU9wdGlvbnMgfCBib29sZWFuKSB7XG4gIGlmICh1dGlscy5pcy5vYmplY3Qob3B0aW9ucykpIHtcbiAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmVuYWJsZWQgPSBvcHRpb25zLmVuYWJsZWQgIT09IGZhbHNlXG5cbiAgICBpZiAob3B0aW9ucy5saXN0ZW5lcnMpIHtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSB1dGlscy5ub3JtYWxpemVMaXN0ZW5lcnMob3B0aW9ucy5saXN0ZW5lcnMpXG4gICAgICAvLyByZW5hbWUgJ2Ryb3AnIHRvICcnIGFzIGl0IHdpbGwgYmUgcHJlZml4ZWQgd2l0aCAnZHJvcCdcbiAgICAgIGNvbnN0IGNvcnJlY3RlZCA9IE9iamVjdC5rZXlzKG5vcm1hbGl6ZWQpLnJlZHVjZSgoYWNjLCB0eXBlKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvcnJlY3RlZFR5cGUgPSAvXihlbnRlcnxsZWF2ZSkvLnRlc3QodHlwZSlcbiAgICAgICAgICA/IGBkcmFnJHt0eXBlfWBcbiAgICAgICAgICA6IC9eKGFjdGl2YXRlfGRlYWN0aXZhdGV8bW92ZSkvLnRlc3QodHlwZSlcbiAgICAgICAgICAgID8gYGRyb3Ake3R5cGV9YFxuICAgICAgICAgICAgOiB0eXBlXG5cbiAgICAgICAgYWNjW2NvcnJlY3RlZFR5cGVdID0gbm9ybWFsaXplZFt0eXBlXVxuXG4gICAgICAgIHJldHVybiBhY2NcbiAgICAgIH0sIHt9KVxuXG4gICAgICBpbnRlcmFjdGFibGUub2ZmKGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AubGlzdGVuZXJzKVxuICAgICAgaW50ZXJhY3RhYmxlLm9uKGNvcnJlY3RlZClcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AubGlzdGVuZXJzID0gY29ycmVjdGVkXG4gICAgfVxuXG4gICAgaWYgKHV0aWxzLmlzLmZ1bmMob3B0aW9ucy5vbmRyb3ApKSB7IGludGVyYWN0YWJsZS5vbignZHJvcCcsIG9wdGlvbnMub25kcm9wKSB9XG4gICAgaWYgKHV0aWxzLmlzLmZ1bmMob3B0aW9ucy5vbmRyb3BhY3RpdmF0ZSkpIHsgaW50ZXJhY3RhYmxlLm9uKCdkcm9wYWN0aXZhdGUnLCBvcHRpb25zLm9uZHJvcGFjdGl2YXRlKSB9XG4gICAgaWYgKHV0aWxzLmlzLmZ1bmMob3B0aW9ucy5vbmRyb3BkZWFjdGl2YXRlKSkgeyBpbnRlcmFjdGFibGUub24oJ2Ryb3BkZWFjdGl2YXRlJywgb3B0aW9ucy5vbmRyb3BkZWFjdGl2YXRlKSB9XG4gICAgaWYgKHV0aWxzLmlzLmZ1bmMob3B0aW9ucy5vbmRyYWdlbnRlcikpIHsgaW50ZXJhY3RhYmxlLm9uKCdkcmFnZW50ZXInLCBvcHRpb25zLm9uZHJhZ2VudGVyKSB9XG4gICAgaWYgKHV0aWxzLmlzLmZ1bmMob3B0aW9ucy5vbmRyYWdsZWF2ZSkpIHsgaW50ZXJhY3RhYmxlLm9uKCdkcmFnbGVhdmUnLCBvcHRpb25zLm9uZHJhZ2xlYXZlKSB9XG4gICAgaWYgKHV0aWxzLmlzLmZ1bmMob3B0aW9ucy5vbmRyb3Btb3ZlKSkgeyBpbnRlcmFjdGFibGUub24oJ2Ryb3Btb3ZlJywgb3B0aW9ucy5vbmRyb3Btb3ZlKSB9XG5cbiAgICBpZiAoL14ocG9pbnRlcnxjZW50ZXIpJC8udGVzdChvcHRpb25zLm92ZXJsYXAgYXMgc3RyaW5nKSkge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5vdmVybGFwID0gb3B0aW9ucy5vdmVybGFwXG4gICAgfVxuICAgIGVsc2UgaWYgKHV0aWxzLmlzLm51bWJlcihvcHRpb25zLm92ZXJsYXApKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLm92ZXJsYXAgPSBNYXRoLm1heChNYXRoLm1pbigxLCBvcHRpb25zLm92ZXJsYXApLCAwKVxuICAgIH1cbiAgICBpZiAoJ2FjY2VwdCcgaW4gb3B0aW9ucykge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5hY2NlcHQgPSBvcHRpb25zLmFjY2VwdFxuICAgIH1cbiAgICBpZiAoJ2NoZWNrZXInIGluIG9wdGlvbnMpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3AuY2hlY2tlciA9IG9wdGlvbnMuY2hlY2tlclxuICAgIH1cblxuICAgIHJldHVybiBpbnRlcmFjdGFibGVcbiAgfVxuXG4gIGlmICh1dGlscy5pcy5ib29sKG9wdGlvbnMpKSB7XG4gICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5lbmFibGVkID0gb3B0aW9uc1xuXG4gICAgcmV0dXJuIGludGVyYWN0YWJsZVxuICB9XG5cbiAgcmV0dXJuIGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3Bcbn1cblxuZnVuY3Rpb24gZHJvcENoZWNrTWV0aG9kIChcbiAgaW50ZXJhY3RhYmxlOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsXG4gIGRyYWdFdmVudDogSW50ZXJhY3RFdmVudCxcbiAgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsXG4gIGRyYWdnYWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLFxuICBkcmFnZ2FibGVFbGVtZW50OiBFbGVtZW50LFxuICBkcm9wRWxlbWVudDogRWxlbWVudCxcbiAgcmVjdDogYW55XG4pIHtcbiAgbGV0IGRyb3BwZWQgPSBmYWxzZVxuXG4gIC8vIGlmIHRoZSBkcm9wem9uZSBoYXMgbm8gcmVjdCAoZWcuIGRpc3BsYXk6IG5vbmUpXG4gIC8vIGNhbGwgdGhlIGN1c3RvbSBkcm9wQ2hlY2tlciBvciBqdXN0IHJldHVybiBmYWxzZVxuICBpZiAoIShyZWN0ID0gcmVjdCB8fCBpbnRlcmFjdGFibGUuZ2V0UmVjdChkcm9wRWxlbWVudCkpKSB7XG4gICAgcmV0dXJuIChpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmNoZWNrZXJcbiAgICAgID8gaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5jaGVja2VyKGRyYWdFdmVudCwgZXZlbnQsIGRyb3BwZWQsIGludGVyYWN0YWJsZSwgZHJvcEVsZW1lbnQsIGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudClcbiAgICAgIDogZmFsc2UpXG4gIH1cblxuICBjb25zdCBkcm9wT3ZlcmxhcCA9IGludGVyYWN0YWJsZS5vcHRpb25zLmRyb3Aub3ZlcmxhcFxuXG4gIGlmIChkcm9wT3ZlcmxhcCA9PT0gJ3BvaW50ZXInKSB7XG4gICAgY29uc3Qgb3JpZ2luID0gdXRpbHMuZ2V0T3JpZ2luWFkoZHJhZ2dhYmxlLCBkcmFnZ2FibGVFbGVtZW50LCAnZHJhZycpXG4gICAgY29uc3QgcGFnZSA9IHV0aWxzLnBvaW50ZXIuZ2V0UGFnZVhZKGRyYWdFdmVudClcblxuICAgIHBhZ2UueCArPSBvcmlnaW4ueFxuICAgIHBhZ2UueSArPSBvcmlnaW4ueVxuXG4gICAgY29uc3QgaG9yaXpvbnRhbCA9IChwYWdlLnggPiByZWN0LmxlZnQpICYmIChwYWdlLnggPCByZWN0LnJpZ2h0KVxuICAgIGNvbnN0IHZlcnRpY2FsICAgPSAocGFnZS55ID4gcmVjdC50b3ApICYmIChwYWdlLnkgPCByZWN0LmJvdHRvbSlcblxuICAgIGRyb3BwZWQgPSBob3Jpem9udGFsICYmIHZlcnRpY2FsXG4gIH1cblxuICBjb25zdCBkcmFnUmVjdCA9IGRyYWdnYWJsZS5nZXRSZWN0KGRyYWdnYWJsZUVsZW1lbnQpXG5cbiAgaWYgKGRyYWdSZWN0ICYmIGRyb3BPdmVybGFwID09PSAnY2VudGVyJykge1xuICAgIGNvbnN0IGN4ID0gZHJhZ1JlY3QubGVmdCArIGRyYWdSZWN0LndpZHRoICAvIDJcbiAgICBjb25zdCBjeSA9IGRyYWdSZWN0LnRvcCAgKyBkcmFnUmVjdC5oZWlnaHQgLyAyXG5cbiAgICBkcm9wcGVkID0gY3ggPj0gcmVjdC5sZWZ0ICYmIGN4IDw9IHJlY3QucmlnaHQgJiYgY3kgPj0gcmVjdC50b3AgJiYgY3kgPD0gcmVjdC5ib3R0b21cbiAgfVxuXG4gIGlmIChkcmFnUmVjdCAmJiB1dGlscy5pcy5udW1iZXIoZHJvcE92ZXJsYXApKSB7XG4gICAgY29uc3Qgb3ZlcmxhcEFyZWEgID0gKE1hdGgubWF4KDAsIE1hdGgubWluKHJlY3QucmlnaHQsIGRyYWdSZWN0LnJpZ2h0KSAtIE1hdGgubWF4KHJlY3QubGVmdCwgZHJhZ1JlY3QubGVmdCkpICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5tYXgoMCwgTWF0aC5taW4ocmVjdC5ib3R0b20sIGRyYWdSZWN0LmJvdHRvbSkgLSBNYXRoLm1heChyZWN0LnRvcCwgZHJhZ1JlY3QudG9wKSkpXG5cbiAgICBjb25zdCBvdmVybGFwUmF0aW8gPSBvdmVybGFwQXJlYSAvIChkcmFnUmVjdC53aWR0aCAqIGRyYWdSZWN0LmhlaWdodClcblxuICAgIGRyb3BwZWQgPSBvdmVybGFwUmF0aW8gPj0gZHJvcE92ZXJsYXBcbiAgfVxuXG4gIGlmIChpbnRlcmFjdGFibGUub3B0aW9ucy5kcm9wLmNoZWNrZXIpIHtcbiAgICBkcm9wcGVkID0gaW50ZXJhY3RhYmxlLm9wdGlvbnMuZHJvcC5jaGVja2VyKGRyYWdFdmVudCwgZXZlbnQsIGRyb3BwZWQsIGludGVyYWN0YWJsZSwgZHJvcEVsZW1lbnQsIGRyYWdnYWJsZSwgZHJhZ2dhYmxlRWxlbWVudClcbiAgfVxuXG4gIHJldHVybiBkcm9wcGVkXG59XG5cbmNvbnN0IGRyb3AgPSB7XG4gIGluc3RhbGwsXG4gIGdldEFjdGl2ZURyb3BzLFxuICBnZXREcm9wLFxuICBnZXREcm9wRXZlbnRzLFxuICBmaXJlRHJvcEV2ZW50cyxcbiAgZGVmYXVsdHM6IHtcbiAgICBlbmFibGVkOiBmYWxzZSxcbiAgICBhY2NlcHQgOiBudWxsLFxuICAgIG92ZXJsYXA6ICdwb2ludGVyJyxcbiAgfSBhcyBJbnRlcmFjdC5Ecm9wem9uZU9wdGlvbnMsXG59XG5cbmV4cG9ydCBkZWZhdWx0IGRyb3BcbiJdfQ==