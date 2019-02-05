import { ActionName } from '@interactjs/core/scope';
import * as utils from '@interactjs/utils';
ActionName.Resize = 'resize';
function install(scope) {
    const { actions, browser, 
    /** @lends Interactable */
    Interactable, // tslint:disable-line no-shadowed-variable
    interactions, defaults, } = scope;
    // Less Precision with touch input
    interactions.signals.on('new', (interaction) => {
        interaction.resizeAxes = 'xy';
    });
    interactions.signals.on('action-start', start);
    interactions.signals.on('action-move', move);
    interactions.signals.on('action-start', updateEventAxes);
    interactions.signals.on('action-move', updateEventAxes);
    resize.cursors = initCursors(browser);
    resize.defaultMargin = browser.supportsTouch || browser.supportsPointerEvent ? 20 : 10;
    /**
     * ```js
     * interact(element).resizable({
     *   onstart: function (event) {},
     *   onmove : function (event) {},
     *   onend  : function (event) {},
     *
     *   edges: {
     *     top   : true,       // Use pointer coords to check for resize.
     *     left  : false,      // Disable resizing from left edge.
     *     bottom: '.resize-s',// Resize if pointer target matches selector
     *     right : handleEl    // Resize if pointer target is the given Element
     *   },
     *
     *     // Width and height can be adjusted independently. When `true`, width and
     *     // height are adjusted at a 1:1 ratio.
     *     square: false,
     *
     *     // Width and height can be adjusted independently. When `true`, width and
     *     // height maintain the aspect ratio they had when resizing started.
     *     preserveAspectRatio: false,
     *
     *   // a value of 'none' will limit the resize rect to a minimum of 0x0
     *   // 'negate' will allow the rect to have negative width/height
     *   // 'reposition' will keep the width/height positive by swapping
     *   // the top and bottom edges and/or swapping the left and right edges
     *   invert: 'none' || 'negate' || 'reposition'
     *
     *   // limit multiple resizes.
     *   // See the explanation in the {@link Interactable.draggable} example
     *   max: Infinity,
     *   maxPerElement: 1,
     * });
     *
     * var isResizeable = interact(element).resizable();
     * ```
     *
     * Gets or sets whether resize actions can be performed on the target
     *
     * @param {boolean | object} [options] true/false or An object with event
     * listeners to be fired on resize events (object makes the Interactable
     * resizable)
     * @return {boolean | Interactable} A boolean indicating if this can be the
     * target of resize elements, or this Interactable
     */
    Interactable.prototype.resizable = function (options) {
        return resizable(this, options, scope);
    };
    actions[ActionName.Resize] = resize;
    actions.names.push(ActionName.Resize);
    utils.arr.merge(actions.eventTypes, [
        'resizestart',
        'resizemove',
        'resizeinertiastart',
        'resizeresume',
        'resizeend',
    ]);
    actions.methodDict.resize = 'resizable';
    defaults.actions.resize = resize.defaults;
}
const resize = {
    install,
    defaults: {
        square: false,
        preserveAspectRatio: false,
        axis: 'xy',
        // use default margin
        margin: NaN,
        // object with props left, right, top, bottom which are
        // true/false values to resize when the pointer is over that edge,
        // CSS selectors to match the handles for each direction
        // or the Elements for each handle
        edges: null,
        // a value of 'none' will limit the resize rect to a minimum of 0x0
        // 'negate' will alow the rect to have negative width/height
        // 'reposition' will keep the width/height positive by swapping
        // the top and bottom edges and/or swapping the left and right edges
        invert: 'none',
    },
    checker(_pointer, _event, interactable, element, interaction, rect) {
        if (!rect) {
            return null;
        }
        const page = utils.extend({}, interaction.coords.cur.page);
        const options = interactable.options;
        if (options.resize.enabled) {
            const resizeOptions = options.resize;
            const resizeEdges = { left: false, right: false, top: false, bottom: false };
            // if using resize.edges
            if (utils.is.object(resizeOptions.edges)) {
                for (const edge in resizeEdges) {
                    resizeEdges[edge] = checkResizeEdge(edge, resizeOptions.edges[edge], page, interaction._latestPointer.eventTarget, element, rect, resizeOptions.margin || this.defaultMargin);
                }
                resizeEdges.left = resizeEdges.left && !resizeEdges.right;
                resizeEdges.top = resizeEdges.top && !resizeEdges.bottom;
                if (resizeEdges.left || resizeEdges.right || resizeEdges.top || resizeEdges.bottom) {
                    return {
                        name: 'resize',
                        edges: resizeEdges,
                    };
                }
            }
            else {
                const right = options.resize.axis !== 'y' && page.x > (rect.right - this.defaultMargin);
                const bottom = options.resize.axis !== 'x' && page.y > (rect.bottom - this.defaultMargin);
                if (right || bottom) {
                    return {
                        name: 'resize',
                        axes: (right ? 'x' : '') + (bottom ? 'y' : ''),
                    };
                }
            }
        }
        return null;
    },
    cursors: null,
    getCursor(action) {
        const cursors = resize.cursors;
        if (action.axis) {
            return cursors[action.name + action.axis];
        }
        else if (action.edges) {
            let cursorKey = '';
            const edgeNames = ['top', 'bottom', 'left', 'right'];
            for (let i = 0; i < 4; i++) {
                if (action.edges[edgeNames[i]]) {
                    cursorKey += edgeNames[i];
                }
            }
            return cursors[cursorKey];
        }
        return null;
    },
    defaultMargin: null,
};
function resizable(interactable, options, scope) {
    if (utils.is.object(options)) {
        interactable.options.resize.enabled = options.enabled !== false;
        interactable.setPerAction('resize', options);
        interactable.setOnEvents('resize', options);
        if (/^x$|^y$|^xy$/.test(options.axis)) {
            interactable.options.resize.axis = options.axis;
        }
        else if (options.axis === null) {
            interactable.options.resize.axis = scope.defaults.actions.resize.axis;
        }
        if (utils.is.bool(options.preserveAspectRatio)) {
            interactable.options.resize.preserveAspectRatio = options.preserveAspectRatio;
        }
        else if (utils.is.bool(options.square)) {
            interactable.options.resize.square = options.square;
        }
        return interactable;
    }
    if (utils.is.bool(options)) {
        interactable.options.resize.enabled = options;
        return interactable;
    }
    return interactable.options.resize;
}
function checkResizeEdge(name, value, page, element, interactableElement, rect, margin) {
    // false, '', undefined, null
    if (!value) {
        return false;
    }
    // true value, use pointer coords and element rect
    if (value === true) {
        // if dimensions are negative, "switch" edges
        const width = utils.is.number(rect.width) ? rect.width : rect.right - rect.left;
        const height = utils.is.number(rect.height) ? rect.height : rect.bottom - rect.top;
        // don't use margin greater than half the relevent dimension
        margin = Math.min(margin, (name === 'left' || name === 'right' ? width : height) / 2);
        if (width < 0) {
            if (name === 'left') {
                name = 'right';
            }
            else if (name === 'right') {
                name = 'left';
            }
        }
        if (height < 0) {
            if (name === 'top') {
                name = 'bottom';
            }
            else if (name === 'bottom') {
                name = 'top';
            }
        }
        if (name === 'left') {
            return page.x < ((width >= 0 ? rect.left : rect.right) + margin);
        }
        if (name === 'top') {
            return page.y < ((height >= 0 ? rect.top : rect.bottom) + margin);
        }
        if (name === 'right') {
            return page.x > ((width >= 0 ? rect.right : rect.left) - margin);
        }
        if (name === 'bottom') {
            return page.y > ((height >= 0 ? rect.bottom : rect.top) - margin);
        }
    }
    // the remaining checks require an element
    if (!utils.is.element(element)) {
        return false;
    }
    return utils.is.element(value)
        // the value is an element to use as a resize handle
        ? value === element
        // otherwise check if element matches value as selector
        : utils.dom.matchesUpTo(element, value, interactableElement);
}
function initCursors(browser) {
    return (browser.isIe9 ? {
        x: 'e-resize',
        y: 's-resize',
        xy: 'se-resize',
        top: 'n-resize',
        left: 'w-resize',
        bottom: 's-resize',
        right: 'e-resize',
        topleft: 'se-resize',
        bottomright: 'se-resize',
        topright: 'ne-resize',
        bottomleft: 'ne-resize',
    } : {
        x: 'ew-resize',
        y: 'ns-resize',
        xy: 'nwse-resize',
        top: 'ns-resize',
        left: 'ew-resize',
        bottom: 'ns-resize',
        right: 'ew-resize',
        topleft: 'nwse-resize',
        bottomright: 'nwse-resize',
        topright: 'nesw-resize',
        bottomleft: 'nesw-resize',
    });
}
function start({ iEvent, interaction }) {
    if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) {
        return;
    }
    const startRect = interaction.target.getRect(interaction.element);
    const resizeOptions = interaction.target.options.resize;
    /*
     * When using the `resizable.square` or `resizable.preserveAspectRatio` options, resizing from one edge
     * will affect another. E.g. with `resizable.square`, resizing to make the right edge larger will make
     * the bottom edge larger by the same amount. We call these 'linked' edges. Any linked edges will depend
     * on the active edges and the edge being interacted with.
     */
    if (resizeOptions.square || resizeOptions.preserveAspectRatio) {
        const linkedEdges = utils.extend({}, interaction.prepared.edges);
        linkedEdges.top = linkedEdges.top || (linkedEdges.left && !linkedEdges.bottom);
        linkedEdges.left = linkedEdges.left || (linkedEdges.top && !linkedEdges.right);
        linkedEdges.bottom = linkedEdges.bottom || (linkedEdges.right && !linkedEdges.top);
        linkedEdges.right = linkedEdges.right || (linkedEdges.bottom && !linkedEdges.left);
        interaction.prepared._linkedEdges = linkedEdges;
    }
    else {
        interaction.prepared._linkedEdges = null;
    }
    // if using `resizable.preserveAspectRatio` option, record aspect ratio at the start of the resize
    if (resizeOptions.preserveAspectRatio) {
        interaction.resizeStartAspectRatio = startRect.width / startRect.height;
    }
    interaction.resizeRects = {
        start: startRect,
        current: utils.extend({}, startRect),
        inverted: utils.extend({}, startRect),
        previous: utils.extend({}, startRect),
        delta: {
            left: 0,
            right: 0,
            width: 0,
            top: 0,
            bottom: 0,
            height: 0,
        },
    };
    iEvent.rect = interaction.resizeRects.inverted;
    iEvent.deltaRect = interaction.resizeRects.delta;
}
function move({ iEvent, interaction }) {
    if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) {
        return;
    }
    const resizeOptions = interaction.target.options.resize;
    const invert = resizeOptions.invert;
    const invertible = invert === 'reposition' || invert === 'negate';
    let edges = interaction.prepared.edges;
    // eslint-disable-next-line no-shadow
    const start = interaction.resizeRects.start;
    const current = interaction.resizeRects.current;
    const inverted = interaction.resizeRects.inverted;
    const deltaRect = interaction.resizeRects.delta;
    const previous = utils.extend(interaction.resizeRects.previous, inverted);
    const originalEdges = edges;
    const eventDelta = utils.extend({}, iEvent.delta);
    if (resizeOptions.preserveAspectRatio || resizeOptions.square) {
        // `resize.preserveAspectRatio` takes precedence over `resize.square`
        const startAspectRatio = resizeOptions.preserveAspectRatio
            ? interaction.resizeStartAspectRatio
            : 1;
        edges = interaction.prepared._linkedEdges;
        if ((originalEdges.left && originalEdges.bottom) ||
            (originalEdges.right && originalEdges.top)) {
            eventDelta.y = -eventDelta.x / startAspectRatio;
        }
        else if (originalEdges.left || originalEdges.right) {
            eventDelta.y = eventDelta.x / startAspectRatio;
        }
        else if (originalEdges.top || originalEdges.bottom) {
            eventDelta.x = eventDelta.y * startAspectRatio;
        }
    }
    // update the 'current' rect without modifications
    if (edges.top) {
        current.top += eventDelta.y;
    }
    if (edges.bottom) {
        current.bottom += eventDelta.y;
    }
    if (edges.left) {
        current.left += eventDelta.x;
    }
    if (edges.right) {
        current.right += eventDelta.x;
    }
    if (invertible) {
        // if invertible, copy the current rect
        utils.extend(inverted, current);
        if (invert === 'reposition') {
            // swap edge values if necessary to keep width/height positive
            let swap;
            if (inverted.top > inverted.bottom) {
                swap = inverted.top;
                inverted.top = inverted.bottom;
                inverted.bottom = swap;
            }
            if (inverted.left > inverted.right) {
                swap = inverted.left;
                inverted.left = inverted.right;
                inverted.right = swap;
            }
        }
    }
    else {
        // if not invertible, restrict to minimum of 0x0 rect
        inverted.top = Math.min(current.top, start.bottom);
        inverted.bottom = Math.max(current.bottom, start.top);
        inverted.left = Math.min(current.left, start.right);
        inverted.right = Math.max(current.right, start.left);
    }
    inverted.width = inverted.right - inverted.left;
    inverted.height = inverted.bottom - inverted.top;
    for (const edge in inverted) {
        deltaRect[edge] = inverted[edge] - previous[edge];
    }
    iEvent.edges = interaction.prepared.edges;
    iEvent.rect = inverted;
    iEvent.deltaRect = deltaRect;
}
function updateEventAxes({ interaction, iEvent, action }) {
    if (action !== 'resize' || !interaction.resizeAxes) {
        return;
    }
    const options = interaction.target.options;
    if (options.resize.square) {
        if (interaction.resizeAxes === 'y') {
            iEvent.delta.x = iEvent.delta.y;
        }
        else {
            iEvent.delta.y = iEvent.delta.x;
        }
        iEvent.axes = 'xy';
    }
    else {
        iEvent.axes = interaction.resizeAxes;
        if (interaction.resizeAxes === 'x') {
            iEvent.delta.y = 0;
        }
        else if (interaction.resizeAxes === 'y') {
            iEvent.delta.x = 0;
        }
    }
}
export default resize;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmVzaXplLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxVQUFVLEVBQVMsTUFBTSx3QkFBd0IsQ0FBQTtBQUMxRCxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBa0N6QyxVQUFrQixDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUE7QUFPckMsU0FBUyxPQUFPLENBQUUsS0FBWTtJQUM1QixNQUFNLEVBQ0osT0FBTyxFQUNQLE9BQU87SUFDUCwwQkFBMEI7SUFDMUIsWUFBWSxFQUFFLDJDQUEyQztJQUN6RCxZQUFZLEVBQ1osUUFBUSxHQUNULEdBQUcsS0FBSyxDQUFBO0lBRVQsa0NBQWtDO0lBRWxDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFO1FBQzdDLFdBQVcsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFBO0lBQy9CLENBQUMsQ0FBQyxDQUFBO0lBRUYsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQzlDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUU1QyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUE7SUFDeEQsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFBO0lBRXZELE1BQU0sQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3JDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWEsSUFBSSxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO0lBRXRGOzs7Ozs7Ozs7Ozs7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QUFJLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQTtRQUVwQyxJQUFJLFdBQVcsQ0FBQyxVQUFVLEtBQUssR0FBRyxFQUFFO1lBQ2xDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtTQUNuQjthQUNJLElBQUksV0FBVyxDQUFDLFVBQVUsS0FBSyxHQUFHLEVBQUU7WUFDdkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ25CO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsZUFBZSxNQUFNLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBY3Rpb24sIEludGVyYWN0aW9uIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbidcbmltcG9ydCB7IEFjdGlvbk5hbWUsIFNjb3BlIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9zY29wZSdcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzJ1xuXG5leHBvcnQgdHlwZSBFZGdlTmFtZSA9ICd0b3AnIHwgJ2xlZnQnIHwgJ2JvdHRvbScgfCAncmlnaHQnXG5leHBvcnQgdHlwZSBSZXNpemFibGVNZXRob2QgPSAob3B0aW9ucz86IEludGVyYWN0Lk9yQm9vbGVhbjxJbnRlcmFjdC5SZXNpemFibGVPcHRpb25zPiB8IGJvb2xlYW4pID0+IEludGVyYWN0LkludGVyYWN0YWJsZSB8IEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnNcblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3RhYmxlJyB7XG4gIGludGVyZmFjZSBJbnRlcmFjdGFibGUge1xuICAgIHJlc2l6YWJsZTogUmVzaXphYmxlTWV0aG9kXG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3Rpb24nIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0aW9uIHtcbiAgICByZXNpemVBeGVzOiAneCcgfCAneScgfCAneHknXG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvZGVmYXVsdE9wdGlvbnMnIHtcbiAgaW50ZXJmYWNlIEFjdGlvbkRlZmF1bHRzIHtcbiAgICByZXNpemU6IEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnNcbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9zY29wZScge1xuICBpbnRlcmZhY2UgQWN0aW9ucyB7XG4gICAgW0FjdGlvbk5hbWUuUmVzaXplXT86IHR5cGVvZiByZXNpemVcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcbiAgZW51bSBBY3Rpb25OYW1lIHtcbiAgICBSZXNpemUgPSAncmVzaXplJ1xuICB9XG59XG5cbihBY3Rpb25OYW1lIGFzIGFueSkuUmVzaXplID0gJ3Jlc2l6ZSdcblxuZXhwb3J0IGludGVyZmFjZSBSZXNpemVFdmVudCBleHRlbmRzIEludGVyYWN0LkludGVyYWN0RXZlbnQ8QWN0aW9uTmFtZS5SZXNpemU+IHtcbiAgZGVsdGFSZWN0PzogSW50ZXJhY3QuUmVjdFxuICByZWN0PzogSW50ZXJhY3QuUmVjdFxufVxuXG5mdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qge1xuICAgIGFjdGlvbnMsXG4gICAgYnJvd3NlcixcbiAgICAvKiogQGxlbmRzIEludGVyYWN0YWJsZSAqL1xuICAgIEludGVyYWN0YWJsZSwgLy8gdHNsaW50OmRpc2FibGUtbGluZSBuby1zaGFkb3dlZC12YXJpYWJsZVxuICAgIGludGVyYWN0aW9ucyxcbiAgICBkZWZhdWx0cyxcbiAgfSA9IHNjb3BlXG5cbiAgLy8gTGVzcyBQcmVjaXNpb24gd2l0aCB0b3VjaCBpbnB1dFxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCduZXcnLCAoaW50ZXJhY3Rpb24pID0+IHtcbiAgICBpbnRlcmFjdGlvbi5yZXNpemVBeGVzID0gJ3h5J1xuICB9KVxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tc3RhcnQnLCBzdGFydClcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FjdGlvbi1tb3ZlJywgbW92ZSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLXN0YXJ0JywgdXBkYXRlRXZlbnRBeGVzKVxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLW1vdmUnLCB1cGRhdGVFdmVudEF4ZXMpXG5cbiAgcmVzaXplLmN1cnNvcnMgPSBpbml0Q3Vyc29ycyhicm93c2VyKVxuICByZXNpemUuZGVmYXVsdE1hcmdpbiA9IGJyb3dzZXIuc3VwcG9ydHNUb3VjaCB8fCBicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50ID8gMjAgOiAxMFxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdChlbGVtZW50KS5yZXNpemFibGUoe1xuICAgKiAgIG9uc3RhcnQ6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAqICAgb25tb3ZlIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICogICBvbmVuZCAgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgKlxuICAgKiAgIGVkZ2VzOiB7XG4gICAqICAgICB0b3AgICA6IHRydWUsICAgICAgIC8vIFVzZSBwb2ludGVyIGNvb3JkcyB0byBjaGVjayBmb3IgcmVzaXplLlxuICAgKiAgICAgbGVmdCAgOiBmYWxzZSwgICAgICAvLyBEaXNhYmxlIHJlc2l6aW5nIGZyb20gbGVmdCBlZGdlLlxuICAgKiAgICAgYm90dG9tOiAnLnJlc2l6ZS1zJywvLyBSZXNpemUgaWYgcG9pbnRlciB0YXJnZXQgbWF0Y2hlcyBzZWxlY3RvclxuICAgKiAgICAgcmlnaHQgOiBoYW5kbGVFbCAgICAvLyBSZXNpemUgaWYgcG9pbnRlciB0YXJnZXQgaXMgdGhlIGdpdmVuIEVsZW1lbnRcbiAgICogICB9LFxuICAgKlxuICAgKiAgICAgLy8gV2lkdGggYW5kIGhlaWdodCBjYW4gYmUgYWRqdXN0ZWQgaW5kZXBlbmRlbnRseS4gV2hlbiBgdHJ1ZWAsIHdpZHRoIGFuZFxuICAgKiAgICAgLy8gaGVpZ2h0IGFyZSBhZGp1c3RlZCBhdCBhIDE6MSByYXRpby5cbiAgICogICAgIHNxdWFyZTogZmFsc2UsXG4gICAqXG4gICAqICAgICAvLyBXaWR0aCBhbmQgaGVpZ2h0IGNhbiBiZSBhZGp1c3RlZCBpbmRlcGVuZGVudGx5LiBXaGVuIGB0cnVlYCwgd2lkdGggYW5kXG4gICAqICAgICAvLyBoZWlnaHQgbWFpbnRhaW4gdGhlIGFzcGVjdCByYXRpbyB0aGV5IGhhZCB3aGVuIHJlc2l6aW5nIHN0YXJ0ZWQuXG4gICAqICAgICBwcmVzZXJ2ZUFzcGVjdFJhdGlvOiBmYWxzZSxcbiAgICpcbiAgICogICAvLyBhIHZhbHVlIG9mICdub25lJyB3aWxsIGxpbWl0IHRoZSByZXNpemUgcmVjdCB0byBhIG1pbmltdW0gb2YgMHgwXG4gICAqICAgLy8gJ25lZ2F0ZScgd2lsbCBhbGxvdyB0aGUgcmVjdCB0byBoYXZlIG5lZ2F0aXZlIHdpZHRoL2hlaWdodFxuICAgKiAgIC8vICdyZXBvc2l0aW9uJyB3aWxsIGtlZXAgdGhlIHdpZHRoL2hlaWdodCBwb3NpdGl2ZSBieSBzd2FwcGluZ1xuICAgKiAgIC8vIHRoZSB0b3AgYW5kIGJvdHRvbSBlZGdlcyBhbmQvb3Igc3dhcHBpbmcgdGhlIGxlZnQgYW5kIHJpZ2h0IGVkZ2VzXG4gICAqICAgaW52ZXJ0OiAnbm9uZScgfHwgJ25lZ2F0ZScgfHwgJ3JlcG9zaXRpb24nXG4gICAqXG4gICAqICAgLy8gbGltaXQgbXVsdGlwbGUgcmVzaXplcy5cbiAgICogICAvLyBTZWUgdGhlIGV4cGxhbmF0aW9uIGluIHRoZSB7QGxpbmsgSW50ZXJhY3RhYmxlLmRyYWdnYWJsZX0gZXhhbXBsZVxuICAgKiAgIG1heDogSW5maW5pdHksXG4gICAqICAgbWF4UGVyRWxlbWVudDogMSxcbiAgICogfSk7XG4gICAqXG4gICAqIHZhciBpc1Jlc2l6ZWFibGUgPSBpbnRlcmFjdChlbGVtZW50KS5yZXNpemFibGUoKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEdldHMgb3Igc2V0cyB3aGV0aGVyIHJlc2l6ZSBhY3Rpb25zIGNhbiBiZSBwZXJmb3JtZWQgb24gdGhlIHRhcmdldFxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW4gfCBvYmplY3R9IFtvcHRpb25zXSB0cnVlL2ZhbHNlIG9yIEFuIG9iamVjdCB3aXRoIGV2ZW50XG4gICAqIGxpc3RlbmVycyB0byBiZSBmaXJlZCBvbiByZXNpemUgZXZlbnRzIChvYmplY3QgbWFrZXMgdGhlIEludGVyYWN0YWJsZVxuICAgKiByZXNpemFibGUpXG4gICAqIEByZXR1cm4ge2Jvb2xlYW4gfCBJbnRlcmFjdGFibGV9IEEgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIHRoaXMgY2FuIGJlIHRoZVxuICAgKiB0YXJnZXQgb2YgcmVzaXplIGVsZW1lbnRzLCBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5yZXNpemFibGUgPSBmdW5jdGlvbiAodGhpczogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBvcHRpb25zOiBJbnRlcmFjdC5SZXN0cmljdE9wdGlvbiB8IGJvb2xlYW4pIHtcbiAgICByZXR1cm4gcmVzaXphYmxlKHRoaXMsIG9wdGlvbnMsIHNjb3BlKVxuICB9XG5cbiAgYWN0aW9uc1tBY3Rpb25OYW1lLlJlc2l6ZV0gPSByZXNpemVcbiAgYWN0aW9ucy5uYW1lcy5wdXNoKEFjdGlvbk5hbWUuUmVzaXplKVxuICB1dGlscy5hcnIubWVyZ2UoYWN0aW9ucy5ldmVudFR5cGVzLCBbXG4gICAgJ3Jlc2l6ZXN0YXJ0JyxcbiAgICAncmVzaXplbW92ZScsXG4gICAgJ3Jlc2l6ZWluZXJ0aWFzdGFydCcsXG4gICAgJ3Jlc2l6ZXJlc3VtZScsXG4gICAgJ3Jlc2l6ZWVuZCcsXG4gIF0pXG4gIGFjdGlvbnMubWV0aG9kRGljdC5yZXNpemUgPSAncmVzaXphYmxlJ1xuXG4gIGRlZmF1bHRzLmFjdGlvbnMucmVzaXplID0gcmVzaXplLmRlZmF1bHRzXG59XG5cbmNvbnN0IHJlc2l6ZSA9IHtcbiAgaW5zdGFsbCxcbiAgZGVmYXVsdHM6IHtcbiAgICBzcXVhcmU6IGZhbHNlLFxuICAgIHByZXNlcnZlQXNwZWN0UmF0aW86IGZhbHNlLFxuICAgIGF4aXM6ICd4eScsXG5cbiAgICAvLyB1c2UgZGVmYXVsdCBtYXJnaW5cbiAgICBtYXJnaW46IE5hTixcblxuICAgIC8vIG9iamVjdCB3aXRoIHByb3BzIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbSB3aGljaCBhcmVcbiAgICAvLyB0cnVlL2ZhbHNlIHZhbHVlcyB0byByZXNpemUgd2hlbiB0aGUgcG9pbnRlciBpcyBvdmVyIHRoYXQgZWRnZSxcbiAgICAvLyBDU1Mgc2VsZWN0b3JzIHRvIG1hdGNoIHRoZSBoYW5kbGVzIGZvciBlYWNoIGRpcmVjdGlvblxuICAgIC8vIG9yIHRoZSBFbGVtZW50cyBmb3IgZWFjaCBoYW5kbGVcbiAgICBlZGdlczogbnVsbCxcblxuICAgIC8vIGEgdmFsdWUgb2YgJ25vbmUnIHdpbGwgbGltaXQgdGhlIHJlc2l6ZSByZWN0IHRvIGEgbWluaW11bSBvZiAweDBcbiAgICAvLyAnbmVnYXRlJyB3aWxsIGFsb3cgdGhlIHJlY3QgdG8gaGF2ZSBuZWdhdGl2ZSB3aWR0aC9oZWlnaHRcbiAgICAvLyAncmVwb3NpdGlvbicgd2lsbCBrZWVwIHRoZSB3aWR0aC9oZWlnaHQgcG9zaXRpdmUgYnkgc3dhcHBpbmdcbiAgICAvLyB0aGUgdG9wIGFuZCBib3R0b20gZWRnZXMgYW5kL29yIHN3YXBwaW5nIHRoZSBsZWZ0IGFuZCByaWdodCBlZGdlc1xuICAgIGludmVydDogJ25vbmUnLFxuICB9IGFzIEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnMsXG5cbiAgY2hlY2tlciAoXG4gICAgX3BvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLFxuICAgIF9ldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSxcbiAgICBpbnRlcmFjdGFibGU6IEludGVyYWN0LkludGVyYWN0YWJsZSxcbiAgICBlbGVtZW50OiBFbGVtZW50LFxuICAgIGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbixcbiAgICByZWN0OiBJbnRlcmFjdC5SZWN0XG4gICkge1xuICAgIGlmICghcmVjdCkgeyByZXR1cm4gbnVsbCB9XG5cbiAgICBjb25zdCBwYWdlID0gdXRpbHMuZXh0ZW5kKHt9LCBpbnRlcmFjdGlvbi5jb29yZHMuY3VyLnBhZ2UpXG4gICAgY29uc3Qgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zXG5cbiAgICBpZiAob3B0aW9ucy5yZXNpemUuZW5hYmxlZCkge1xuICAgICAgY29uc3QgcmVzaXplT3B0aW9ucyA9IG9wdGlvbnMucmVzaXplXG4gICAgICBjb25zdCByZXNpemVFZGdlczogeyBbZWRnZTogc3RyaW5nXTogYm9vbGVhbiB9ID0geyBsZWZ0OiBmYWxzZSwgcmlnaHQ6IGZhbHNlLCB0b3A6IGZhbHNlLCBib3R0b206IGZhbHNlIH1cblxuICAgICAgLy8gaWYgdXNpbmcgcmVzaXplLmVkZ2VzXG4gICAgICBpZiAodXRpbHMuaXMub2JqZWN0KHJlc2l6ZU9wdGlvbnMuZWRnZXMpKSB7XG4gICAgICAgIGZvciAoY29uc3QgZWRnZSBpbiByZXNpemVFZGdlcykge1xuICAgICAgICAgIHJlc2l6ZUVkZ2VzW2VkZ2VdID0gY2hlY2tSZXNpemVFZGdlKGVkZ2UsXG4gICAgICAgICAgICByZXNpemVPcHRpb25zLmVkZ2VzW2VkZ2VdLFxuICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgIGludGVyYWN0aW9uLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgZWxlbWVudCxcbiAgICAgICAgICAgIHJlY3QsXG4gICAgICAgICAgICByZXNpemVPcHRpb25zLm1hcmdpbiB8fCB0aGlzLmRlZmF1bHRNYXJnaW4pXG4gICAgICAgIH1cblxuICAgICAgICByZXNpemVFZGdlcy5sZWZ0ID0gcmVzaXplRWRnZXMubGVmdCAmJiAhcmVzaXplRWRnZXMucmlnaHRcbiAgICAgICAgcmVzaXplRWRnZXMudG9wICA9IHJlc2l6ZUVkZ2VzLnRvcCAgJiYgIXJlc2l6ZUVkZ2VzLmJvdHRvbVxuXG4gICAgICAgIGlmIChyZXNpemVFZGdlcy5sZWZ0IHx8IHJlc2l6ZUVkZ2VzLnJpZ2h0IHx8IHJlc2l6ZUVkZ2VzLnRvcCB8fCByZXNpemVFZGdlcy5ib3R0b20pIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogJ3Jlc2l6ZScsXG4gICAgICAgICAgICBlZGdlczogcmVzaXplRWRnZXMsXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgcmlnaHQgID0gb3B0aW9ucy5yZXNpemUuYXhpcyAhPT0gJ3knICYmIHBhZ2UueCA+IChyZWN0LnJpZ2h0ICAtIHRoaXMuZGVmYXVsdE1hcmdpbilcbiAgICAgICAgY29uc3QgYm90dG9tID0gb3B0aW9ucy5yZXNpemUuYXhpcyAhPT0gJ3gnICYmIHBhZ2UueSA+IChyZWN0LmJvdHRvbSAtIHRoaXMuZGVmYXVsdE1hcmdpbilcblxuICAgICAgICBpZiAocmlnaHQgfHwgYm90dG9tKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6ICdyZXNpemUnLFxuICAgICAgICAgICAgYXhlczogKHJpZ2h0ID8gJ3gnIDogJycpICsgKGJvdHRvbSA/ICd5JyA6ICcnKSxcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbFxuICB9LFxuXG4gIGN1cnNvcnM6IG51bGwgYXMgdW5rbm93biBhcyBSZXR1cm5UeXBlPHR5cGVvZiBpbml0Q3Vyc29ycz4sXG5cbiAgZ2V0Q3Vyc29yIChhY3Rpb246IEFjdGlvbikge1xuICAgIGNvbnN0IGN1cnNvcnMgPSByZXNpemUuY3Vyc29ycyBhcyB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9XG4gICAgaWYgKGFjdGlvbi5heGlzKSB7XG4gICAgICByZXR1cm4gY3Vyc29yc1thY3Rpb24ubmFtZSArIGFjdGlvbi5heGlzXVxuICAgIH1cbiAgICBlbHNlIGlmIChhY3Rpb24uZWRnZXMpIHtcbiAgICAgIGxldCBjdXJzb3JLZXkgPSAnJ1xuICAgICAgY29uc3QgZWRnZU5hbWVzID0gWyd0b3AnLCAnYm90dG9tJywgJ2xlZnQnLCAncmlnaHQnXVxuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICBpZiAoYWN0aW9uLmVkZ2VzW2VkZ2VOYW1lc1tpXV0pIHtcbiAgICAgICAgICBjdXJzb3JLZXkgKz0gZWRnZU5hbWVzW2ldXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGN1cnNvcnNbY3Vyc29yS2V5XVxuICAgIH1cblxuICAgIHJldHVybiBudWxsXG4gIH0sXG5cbiAgZGVmYXVsdE1hcmdpbjogbnVsbCBhcyB1bmtub3duIGFzIG51bWJlcixcbn1cblxuZnVuY3Rpb24gcmVzaXphYmxlIChpbnRlcmFjdGFibGU6IEludGVyYWN0LkludGVyYWN0YWJsZSwgb3B0aW9uczogSW50ZXJhY3QuT3JCb29sZWFuPEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnM+IHwgYm9vbGVhbiwgc2NvcGU6IFNjb3BlKSB7XG4gIGlmICh1dGlscy5pcy5vYmplY3Qob3B0aW9ucykpIHtcbiAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUuZW5hYmxlZCA9IG9wdGlvbnMuZW5hYmxlZCAhPT0gZmFsc2VcbiAgICBpbnRlcmFjdGFibGUuc2V0UGVyQWN0aW9uKCdyZXNpemUnLCBvcHRpb25zKVxuICAgIGludGVyYWN0YWJsZS5zZXRPbkV2ZW50cygncmVzaXplJywgb3B0aW9ucylcblxuICAgIGlmICgvXngkfF55JHxeeHkkLy50ZXN0KG9wdGlvbnMuYXhpcyBhcyBzdHJpbmcpKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUuYXhpcyA9IG9wdGlvbnMuYXhpc1xuICAgIH1cbiAgICBlbHNlIGlmIChvcHRpb25zLmF4aXMgPT09IG51bGwpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5heGlzID0gc2NvcGUuZGVmYXVsdHMuYWN0aW9ucy5yZXNpemUuYXhpc1xuICAgIH1cblxuICAgIGlmICh1dGlscy5pcy5ib29sKG9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpbykpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5wcmVzZXJ2ZUFzcGVjdFJhdGlvID0gb3B0aW9ucy5wcmVzZXJ2ZUFzcGVjdFJhdGlvXG4gICAgfVxuICAgIGVsc2UgaWYgKHV0aWxzLmlzLmJvb2wob3B0aW9ucy5zcXVhcmUpKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUuc3F1YXJlID0gb3B0aW9ucy5zcXVhcmVcbiAgICB9XG5cbiAgICByZXR1cm4gaW50ZXJhY3RhYmxlXG4gIH1cbiAgaWYgKHV0aWxzLmlzLmJvb2wob3B0aW9ucykpIHtcbiAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUuZW5hYmxlZCA9IG9wdGlvbnNcblxuICAgIHJldHVybiBpbnRlcmFjdGFibGVcbiAgfVxuICByZXR1cm4gaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplXG59XG5cbmZ1bmN0aW9uIGNoZWNrUmVzaXplRWRnZSAobmFtZTogc3RyaW5nLCB2YWx1ZTogYW55LCBwYWdlOiBJbnRlcmFjdC5Qb2ludCwgZWxlbWVudDogTm9kZSwgaW50ZXJhY3RhYmxlRWxlbWVudDogRWxlbWVudCwgcmVjdDogSW50ZXJhY3QuUmVjdCwgbWFyZ2luOiBudW1iZXIpIHtcbiAgLy8gZmFsc2UsICcnLCB1bmRlZmluZWQsIG51bGxcbiAgaWYgKCF2YWx1ZSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIC8vIHRydWUgdmFsdWUsIHVzZSBwb2ludGVyIGNvb3JkcyBhbmQgZWxlbWVudCByZWN0XG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSkge1xuICAgIC8vIGlmIGRpbWVuc2lvbnMgYXJlIG5lZ2F0aXZlLCBcInN3aXRjaFwiIGVkZ2VzXG4gICAgY29uc3Qgd2lkdGggID0gdXRpbHMuaXMubnVtYmVyKHJlY3Qud2lkdGgpID8gcmVjdC53aWR0aCAgOiByZWN0LnJpZ2h0ICAtIHJlY3QubGVmdFxuICAgIGNvbnN0IGhlaWdodCA9IHV0aWxzLmlzLm51bWJlcihyZWN0LmhlaWdodCkgPyByZWN0LmhlaWdodCA6IHJlY3QuYm90dG9tIC0gcmVjdC50b3BcblxuICAgIC8vIGRvbid0IHVzZSBtYXJnaW4gZ3JlYXRlciB0aGFuIGhhbGYgdGhlIHJlbGV2ZW50IGRpbWVuc2lvblxuICAgIG1hcmdpbiA9IE1hdGgubWluKG1hcmdpbiwgKG5hbWUgPT09ICdsZWZ0JyB8fCBuYW1lID09PSAncmlnaHQnID8gd2lkdGggOiBoZWlnaHQpIC8gMilcblxuICAgIGlmICh3aWR0aCA8IDApIHtcbiAgICAgIGlmICAgICAgKG5hbWUgPT09ICdsZWZ0JykgIHsgbmFtZSA9ICdyaWdodCcgfVxuICAgICAgZWxzZSBpZiAobmFtZSA9PT0gJ3JpZ2h0JykgeyBuYW1lID0gJ2xlZnQnICB9XG4gICAgfVxuICAgIGlmIChoZWlnaHQgPCAwKSB7XG4gICAgICBpZiAgICAgIChuYW1lID09PSAndG9wJykgICAgeyBuYW1lID0gJ2JvdHRvbScgfVxuICAgICAgZWxzZSBpZiAobmFtZSA9PT0gJ2JvdHRvbScpIHsgbmFtZSA9ICd0b3AnICAgIH1cbiAgICB9XG5cbiAgICBpZiAobmFtZSA9PT0gJ2xlZnQnKSB7IHJldHVybiBwYWdlLnggPCAoKHdpZHRoICA+PSAwID8gcmVjdC5sZWZ0IDogcmVjdC5yaWdodCkgKyBtYXJnaW4pIH1cbiAgICBpZiAobmFtZSA9PT0gJ3RvcCcpIHsgcmV0dXJuIHBhZ2UueSA8ICgoaGVpZ2h0ID49IDAgPyByZWN0LnRvcCA6IHJlY3QuYm90dG9tKSArIG1hcmdpbikgfVxuXG4gICAgaWYgKG5hbWUgPT09ICdyaWdodCcpIHsgcmV0dXJuIHBhZ2UueCA+ICgod2lkdGggID49IDAgPyByZWN0LnJpZ2h0IDogcmVjdC5sZWZ0KSAtIG1hcmdpbikgfVxuICAgIGlmIChuYW1lID09PSAnYm90dG9tJykgeyByZXR1cm4gcGFnZS55ID4gKChoZWlnaHQgPj0gMCA/IHJlY3QuYm90dG9tIDogcmVjdC50b3ApIC0gbWFyZ2luKSB9XG4gIH1cblxuICAvLyB0aGUgcmVtYWluaW5nIGNoZWNrcyByZXF1aXJlIGFuIGVsZW1lbnRcbiAgaWYgKCF1dGlscy5pcy5lbGVtZW50KGVsZW1lbnQpKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgcmV0dXJuIHV0aWxzLmlzLmVsZW1lbnQodmFsdWUpXG4gIC8vIHRoZSB2YWx1ZSBpcyBhbiBlbGVtZW50IHRvIHVzZSBhcyBhIHJlc2l6ZSBoYW5kbGVcbiAgICA/IHZhbHVlID09PSBlbGVtZW50XG4gICAgLy8gb3RoZXJ3aXNlIGNoZWNrIGlmIGVsZW1lbnQgbWF0Y2hlcyB2YWx1ZSBhcyBzZWxlY3RvclxuICAgIDogdXRpbHMuZG9tLm1hdGNoZXNVcFRvKGVsZW1lbnQsIHZhbHVlLCBpbnRlcmFjdGFibGVFbGVtZW50KVxufVxuXG5mdW5jdGlvbiBpbml0Q3Vyc29ycyAoYnJvd3NlcjogdHlwZW9mIGltcG9ydCAoJ0BpbnRlcmFjdGpzL3V0aWxzL2Jyb3dzZXInKS5kZWZhdWx0KSB7XG4gIHJldHVybiAoYnJvd3Nlci5pc0llOSA/IHtcbiAgICB4IDogJ2UtcmVzaXplJyxcbiAgICB5IDogJ3MtcmVzaXplJyxcbiAgICB4eTogJ3NlLXJlc2l6ZScsXG5cbiAgICB0b3AgICAgICAgIDogJ24tcmVzaXplJyxcbiAgICBsZWZ0ICAgICAgIDogJ3ctcmVzaXplJyxcbiAgICBib3R0b20gICAgIDogJ3MtcmVzaXplJyxcbiAgICByaWdodCAgICAgIDogJ2UtcmVzaXplJyxcbiAgICB0b3BsZWZ0ICAgIDogJ3NlLXJlc2l6ZScsXG4gICAgYm90dG9tcmlnaHQ6ICdzZS1yZXNpemUnLFxuICAgIHRvcHJpZ2h0ICAgOiAnbmUtcmVzaXplJyxcbiAgICBib3R0b21sZWZ0IDogJ25lLXJlc2l6ZScsXG4gIH0gOiB7XG4gICAgeCA6ICdldy1yZXNpemUnLFxuICAgIHkgOiAnbnMtcmVzaXplJyxcbiAgICB4eTogJ253c2UtcmVzaXplJyxcblxuICAgIHRvcCAgICAgICAgOiAnbnMtcmVzaXplJyxcbiAgICBsZWZ0ICAgICAgIDogJ2V3LXJlc2l6ZScsXG4gICAgYm90dG9tICAgICA6ICducy1yZXNpemUnLFxuICAgIHJpZ2h0ICAgICAgOiAnZXctcmVzaXplJyxcbiAgICB0b3BsZWZ0ICAgIDogJ253c2UtcmVzaXplJyxcbiAgICBib3R0b21yaWdodDogJ253c2UtcmVzaXplJyxcbiAgICB0b3ByaWdodCAgIDogJ25lc3ctcmVzaXplJyxcbiAgICBib3R0b21sZWZ0IDogJ25lc3ctcmVzaXplJyxcbiAgfSlcbn1cblxuZnVuY3Rpb24gc3RhcnQgKHsgaUV2ZW50LCBpbnRlcmFjdGlvbiB9KSB7XG4gIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAncmVzaXplJyB8fCAhaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXMpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGNvbnN0IHN0YXJ0UmVjdCA9IGludGVyYWN0aW9uLnRhcmdldC5nZXRSZWN0KGludGVyYWN0aW9uLmVsZW1lbnQpXG4gIGNvbnN0IHJlc2l6ZU9wdGlvbnMgPSBpbnRlcmFjdGlvbi50YXJnZXQub3B0aW9ucy5yZXNpemVcblxuICAvKlxuICAgKiBXaGVuIHVzaW5nIHRoZSBgcmVzaXphYmxlLnNxdWFyZWAgb3IgYHJlc2l6YWJsZS5wcmVzZXJ2ZUFzcGVjdFJhdGlvYCBvcHRpb25zLCByZXNpemluZyBmcm9tIG9uZSBlZGdlXG4gICAqIHdpbGwgYWZmZWN0IGFub3RoZXIuIEUuZy4gd2l0aCBgcmVzaXphYmxlLnNxdWFyZWAsIHJlc2l6aW5nIHRvIG1ha2UgdGhlIHJpZ2h0IGVkZ2UgbGFyZ2VyIHdpbGwgbWFrZVxuICAgKiB0aGUgYm90dG9tIGVkZ2UgbGFyZ2VyIGJ5IHRoZSBzYW1lIGFtb3VudC4gV2UgY2FsbCB0aGVzZSAnbGlua2VkJyBlZGdlcy4gQW55IGxpbmtlZCBlZGdlcyB3aWxsIGRlcGVuZFxuICAgKiBvbiB0aGUgYWN0aXZlIGVkZ2VzIGFuZCB0aGUgZWRnZSBiZWluZyBpbnRlcmFjdGVkIHdpdGguXG4gICAqL1xuICBpZiAocmVzaXplT3B0aW9ucy5zcXVhcmUgfHwgcmVzaXplT3B0aW9ucy5wcmVzZXJ2ZUFzcGVjdFJhdGlvKSB7XG4gICAgY29uc3QgbGlua2VkRWRnZXMgPSB1dGlscy5leHRlbmQoe30sIGludGVyYWN0aW9uLnByZXBhcmVkLmVkZ2VzKVxuXG4gICAgbGlua2VkRWRnZXMudG9wICAgID0gbGlua2VkRWRnZXMudG9wICAgIHx8IChsaW5rZWRFZGdlcy5sZWZ0ICAgJiYgIWxpbmtlZEVkZ2VzLmJvdHRvbSlcbiAgICBsaW5rZWRFZGdlcy5sZWZ0ICAgPSBsaW5rZWRFZGdlcy5sZWZ0ICAgfHwgKGxpbmtlZEVkZ2VzLnRvcCAgICAmJiAhbGlua2VkRWRnZXMucmlnaHQpXG4gICAgbGlua2VkRWRnZXMuYm90dG9tID0gbGlua2VkRWRnZXMuYm90dG9tIHx8IChsaW5rZWRFZGdlcy5yaWdodCAgJiYgIWxpbmtlZEVkZ2VzLnRvcClcbiAgICBsaW5rZWRFZGdlcy5yaWdodCAgPSBsaW5rZWRFZGdlcy5yaWdodCAgfHwgKGxpbmtlZEVkZ2VzLmJvdHRvbSAmJiAhbGlua2VkRWRnZXMubGVmdClcblxuICAgIGludGVyYWN0aW9uLnByZXBhcmVkLl9saW5rZWRFZGdlcyA9IGxpbmtlZEVkZ2VzXG4gIH1cbiAgZWxzZSB7XG4gICAgaW50ZXJhY3Rpb24ucHJlcGFyZWQuX2xpbmtlZEVkZ2VzID0gbnVsbFxuICB9XG5cbiAgLy8gaWYgdXNpbmcgYHJlc2l6YWJsZS5wcmVzZXJ2ZUFzcGVjdFJhdGlvYCBvcHRpb24sIHJlY29yZCBhc3BlY3QgcmF0aW8gYXQgdGhlIHN0YXJ0IG9mIHRoZSByZXNpemVcbiAgaWYgKHJlc2l6ZU9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpbykge1xuICAgIGludGVyYWN0aW9uLnJlc2l6ZVN0YXJ0QXNwZWN0UmF0aW8gPSBzdGFydFJlY3Qud2lkdGggLyBzdGFydFJlY3QuaGVpZ2h0XG4gIH1cblxuICBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cyA9IHtcbiAgICBzdGFydCAgICAgOiBzdGFydFJlY3QsXG4gICAgY3VycmVudCAgIDogdXRpbHMuZXh0ZW5kKHt9LCBzdGFydFJlY3QpLFxuICAgIGludmVydGVkICA6IHV0aWxzLmV4dGVuZCh7fSwgc3RhcnRSZWN0KSxcbiAgICBwcmV2aW91cyAgOiB1dGlscy5leHRlbmQoe30sIHN0YXJ0UmVjdCksXG4gICAgZGVsdGEgICAgIDoge1xuICAgICAgbGVmdDogMCxcbiAgICAgIHJpZ2h0IDogMCxcbiAgICAgIHdpZHRoIDogMCxcbiAgICAgIHRvcCA6IDAsXG4gICAgICBib3R0b206IDAsXG4gICAgICBoZWlnaHQ6IDAsXG4gICAgfSxcbiAgfVxuXG4gIGlFdmVudC5yZWN0ID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuaW52ZXJ0ZWRcbiAgaUV2ZW50LmRlbHRhUmVjdCA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLmRlbHRhXG59XG5cbmZ1bmN0aW9uIG1vdmUgKHsgaUV2ZW50LCBpbnRlcmFjdGlvbiB9KSB7XG4gIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAncmVzaXplJyB8fCAhaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXMpIHsgcmV0dXJuIH1cblxuICBjb25zdCByZXNpemVPcHRpb25zID0gaW50ZXJhY3Rpb24udGFyZ2V0Lm9wdGlvbnMucmVzaXplXG4gIGNvbnN0IGludmVydCA9IHJlc2l6ZU9wdGlvbnMuaW52ZXJ0XG4gIGNvbnN0IGludmVydGlibGUgPSBpbnZlcnQgPT09ICdyZXBvc2l0aW9uJyB8fCBpbnZlcnQgPT09ICduZWdhdGUnXG5cbiAgbGV0IGVkZ2VzID0gaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXNcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tc2hhZG93XG4gIGNvbnN0IHN0YXJ0ICAgICAgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5zdGFydFxuICBjb25zdCBjdXJyZW50ICAgID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuY3VycmVudFxuICBjb25zdCBpbnZlcnRlZCAgID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuaW52ZXJ0ZWRcbiAgY29uc3QgZGVsdGFSZWN0ICA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLmRlbHRhXG4gIGNvbnN0IHByZXZpb3VzICAgPSB1dGlscy5leHRlbmQoaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMucHJldmlvdXMsIGludmVydGVkKVxuICBjb25zdCBvcmlnaW5hbEVkZ2VzID0gZWRnZXNcblxuICBjb25zdCBldmVudERlbHRhID0gdXRpbHMuZXh0ZW5kKHt9LCBpRXZlbnQuZGVsdGEpXG5cbiAgaWYgKHJlc2l6ZU9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpbyB8fCByZXNpemVPcHRpb25zLnNxdWFyZSkge1xuICAgIC8vIGByZXNpemUucHJlc2VydmVBc3BlY3RSYXRpb2AgdGFrZXMgcHJlY2VkZW5jZSBvdmVyIGByZXNpemUuc3F1YXJlYFxuICAgIGNvbnN0IHN0YXJ0QXNwZWN0UmF0aW8gPSByZXNpemVPcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW9cbiAgICAgID8gaW50ZXJhY3Rpb24ucmVzaXplU3RhcnRBc3BlY3RSYXRpb1xuICAgICAgOiAxXG5cbiAgICBlZGdlcyA9IGludGVyYWN0aW9uLnByZXBhcmVkLl9saW5rZWRFZGdlc1xuXG4gICAgaWYgKChvcmlnaW5hbEVkZ2VzLmxlZnQgJiYgb3JpZ2luYWxFZGdlcy5ib3R0b20pIHx8XG4gICAgICAgIChvcmlnaW5hbEVkZ2VzLnJpZ2h0ICYmIG9yaWdpbmFsRWRnZXMudG9wKSkge1xuICAgICAgZXZlbnREZWx0YS55ID0gLWV2ZW50RGVsdGEueCAvIHN0YXJ0QXNwZWN0UmF0aW9cbiAgICB9XG4gICAgZWxzZSBpZiAob3JpZ2luYWxFZGdlcy5sZWZ0IHx8IG9yaWdpbmFsRWRnZXMucmlnaHQpIHsgZXZlbnREZWx0YS55ID0gZXZlbnREZWx0YS54IC8gc3RhcnRBc3BlY3RSYXRpbyB9XG4gICAgZWxzZSBpZiAob3JpZ2luYWxFZGdlcy50b3AgIHx8IG9yaWdpbmFsRWRnZXMuYm90dG9tKSB7IGV2ZW50RGVsdGEueCA9IGV2ZW50RGVsdGEueSAqIHN0YXJ0QXNwZWN0UmF0aW8gfVxuICB9XG5cbiAgLy8gdXBkYXRlIHRoZSAnY3VycmVudCcgcmVjdCB3aXRob3V0IG1vZGlmaWNhdGlvbnNcbiAgaWYgKGVkZ2VzLnRvcCkgeyBjdXJyZW50LnRvcCAgICArPSBldmVudERlbHRhLnkgfVxuICBpZiAoZWRnZXMuYm90dG9tKSB7IGN1cnJlbnQuYm90dG9tICs9IGV2ZW50RGVsdGEueSB9XG4gIGlmIChlZGdlcy5sZWZ0KSB7IGN1cnJlbnQubGVmdCAgICs9IGV2ZW50RGVsdGEueCB9XG4gIGlmIChlZGdlcy5yaWdodCkgeyBjdXJyZW50LnJpZ2h0ICArPSBldmVudERlbHRhLnggfVxuXG4gIGlmIChpbnZlcnRpYmxlKSB7XG4gICAgLy8gaWYgaW52ZXJ0aWJsZSwgY29weSB0aGUgY3VycmVudCByZWN0XG4gICAgdXRpbHMuZXh0ZW5kKGludmVydGVkLCBjdXJyZW50KVxuXG4gICAgaWYgKGludmVydCA9PT0gJ3JlcG9zaXRpb24nKSB7XG4gICAgICAvLyBzd2FwIGVkZ2UgdmFsdWVzIGlmIG5lY2Vzc2FyeSB0byBrZWVwIHdpZHRoL2hlaWdodCBwb3NpdGl2ZVxuICAgICAgbGV0IHN3YXBcblxuICAgICAgaWYgKGludmVydGVkLnRvcCA+IGludmVydGVkLmJvdHRvbSkge1xuICAgICAgICBzd2FwID0gaW52ZXJ0ZWQudG9wXG5cbiAgICAgICAgaW52ZXJ0ZWQudG9wID0gaW52ZXJ0ZWQuYm90dG9tXG4gICAgICAgIGludmVydGVkLmJvdHRvbSA9IHN3YXBcbiAgICAgIH1cbiAgICAgIGlmIChpbnZlcnRlZC5sZWZ0ID4gaW52ZXJ0ZWQucmlnaHQpIHtcbiAgICAgICAgc3dhcCA9IGludmVydGVkLmxlZnRcblxuICAgICAgICBpbnZlcnRlZC5sZWZ0ID0gaW52ZXJ0ZWQucmlnaHRcbiAgICAgICAgaW52ZXJ0ZWQucmlnaHQgPSBzd2FwXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIC8vIGlmIG5vdCBpbnZlcnRpYmxlLCByZXN0cmljdCB0byBtaW5pbXVtIG9mIDB4MCByZWN0XG4gICAgaW52ZXJ0ZWQudG9wICAgID0gTWF0aC5taW4oY3VycmVudC50b3AsIHN0YXJ0LmJvdHRvbSlcbiAgICBpbnZlcnRlZC5ib3R0b20gPSBNYXRoLm1heChjdXJyZW50LmJvdHRvbSwgc3RhcnQudG9wKVxuICAgIGludmVydGVkLmxlZnQgICA9IE1hdGgubWluKGN1cnJlbnQubGVmdCwgc3RhcnQucmlnaHQpXG4gICAgaW52ZXJ0ZWQucmlnaHQgID0gTWF0aC5tYXgoY3VycmVudC5yaWdodCwgc3RhcnQubGVmdClcbiAgfVxuXG4gIGludmVydGVkLndpZHRoICA9IGludmVydGVkLnJpZ2h0ICAtIGludmVydGVkLmxlZnRcbiAgaW52ZXJ0ZWQuaGVpZ2h0ID0gaW52ZXJ0ZWQuYm90dG9tIC0gaW52ZXJ0ZWQudG9wXG5cbiAgZm9yIChjb25zdCBlZGdlIGluIGludmVydGVkKSB7XG4gICAgZGVsdGFSZWN0W2VkZ2VdID0gaW52ZXJ0ZWRbZWRnZV0gLSBwcmV2aW91c1tlZGdlXVxuICB9XG5cbiAgaUV2ZW50LmVkZ2VzID0gaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXNcbiAgaUV2ZW50LnJlY3QgPSBpbnZlcnRlZFxuICBpRXZlbnQuZGVsdGFSZWN0ID0gZGVsdGFSZWN0XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUV2ZW50QXhlcyAoeyBpbnRlcmFjdGlvbiwgaUV2ZW50LCBhY3Rpb24gfSkge1xuICBpZiAoYWN0aW9uICE9PSAncmVzaXplJyB8fCAhaW50ZXJhY3Rpb24ucmVzaXplQXhlcykgeyByZXR1cm4gfVxuXG4gIGNvbnN0IG9wdGlvbnMgPSBpbnRlcmFjdGlvbi50YXJnZXQub3B0aW9uc1xuXG4gIGlmIChvcHRpb25zLnJlc2l6ZS5zcXVhcmUpIHtcbiAgICBpZiAoaW50ZXJhY3Rpb24ucmVzaXplQXhlcyA9PT0gJ3knKSB7XG4gICAgICBpRXZlbnQuZGVsdGEueCA9IGlFdmVudC5kZWx0YS55XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaUV2ZW50LmRlbHRhLnkgPSBpRXZlbnQuZGVsdGEueFxuICAgIH1cbiAgICBpRXZlbnQuYXhlcyA9ICd4eSdcbiAgfVxuICBlbHNlIHtcbiAgICBpRXZlbnQuYXhlcyA9IGludGVyYWN0aW9uLnJlc2l6ZUF4ZXNcblxuICAgIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneCcpIHtcbiAgICAgIGlFdmVudC5kZWx0YS55ID0gMFxuICAgIH1cbiAgICBlbHNlIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneScpIHtcbiAgICAgIGlFdmVudC5kZWx0YS54ID0gMFxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCByZXNpemVcbiJdfQ==