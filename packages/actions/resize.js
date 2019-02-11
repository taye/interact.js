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
        if (utils.is.string(options.axis) && /^x$|^y$|^xy$/.test(options.axis)) {
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
    const startRect = interaction.interactable.getRect(interaction.element);
    const resizeOptions = interaction.interactable.options.resize;
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
    const resizeOptions = interaction.interactable.options.resize;
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
    const options = interaction.interactable.options;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmVzaXplLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxVQUFVLEVBQVMsTUFBTSx3QkFBd0IsQ0FBQTtBQUMxRCxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBK0N6QyxVQUFrQixDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUE7QUFPckMsU0FBUyxPQUFPLENBQUUsS0FBWTtJQUM1QixNQUFNLEVBQ0osT0FBTyxFQUNQLE9BQU87SUFDUCwwQkFBMEI7SUFDMUIsWUFBWSxFQUFFLDJDQUEyQztJQUN6RCxZQUFZLEVBQ1osUUFBUSxHQUNULEdBQUcsS0FBSyxDQUFBO0lBRVQsa0NBQWtDO0lBRWxDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFO1FBQzdDLFdBQVcsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFBO0lBQy9CLENBQUMsQ0FBQyxDQUFBO0lBRUYsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQzlDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUU1QyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUE7SUFDeEQsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFBO0lBRXZELE1BQU0sQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3JDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWEsSUFBSSxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO0lBRXRGOzs7Ozs7Ozs7Ozs7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QUNELE1BQU0sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO0tBQ25CO1NBQ0k7UUFDSCxNQUFNLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUE7UUFFcEMsSUFBSSxXQUFXLENBQUMsVUFBVSxLQUFLLEdBQUcsRUFBRTtZQUNsQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7U0FDbkI7YUFDSSxJQUFJLFdBQVcsQ0FBQyxVQUFVLEtBQUssR0FBRyxFQUFFO1lBQ3ZDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtTQUNuQjtLQUNGO0FBQ0gsQ0FBQztBQUVELGVBQWUsTUFBTSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWN0aW9uUHJvcHMsIEludGVyYWN0aW9uIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbidcbmltcG9ydCB7IEFjdGlvbk5hbWUsIFNjb3BlIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9zY29wZSdcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzJ1xuXG5leHBvcnQgdHlwZSBFZGdlTmFtZSA9ICd0b3AnIHwgJ2xlZnQnIHwgJ2JvdHRvbScgfCAncmlnaHQnXG5cbmV4cG9ydCB0eXBlIFJlc2l6YWJsZU1ldGhvZCA9IEludGVyYWN0LkFjdGlvbk1ldGhvZDxJbnRlcmFjdC5SZXNpemFibGVPcHRpb25zPlxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGFibGUnIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0YWJsZSB7XG4gICAgcmVzaXphYmxlOiBSZXNpemFibGVNZXRob2RcbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbicge1xuICBpbnRlcmZhY2UgSW50ZXJhY3Rpb24ge1xuICAgIHJlc2l6ZUF4ZXM6ICd4JyB8ICd5JyB8ICd4eSdcbiAgICByZXNpemVSZWN0czoge1xuICAgICAgc3RhcnQ6IEludGVyYWN0LlJlY3RcbiAgICAgIGN1cnJlbnQ6IEludGVyYWN0LlJlY3RcbiAgICAgIGludmVydGVkOiBJbnRlcmFjdC5SZWN0XG4gICAgICBwcmV2aW91czogSW50ZXJhY3QuUmVjdFxuICAgICAgZGVsdGE6IEludGVyYWN0LlJlY3RcbiAgICB9XG4gICAgcmVzaXplU3RhcnRBc3BlY3RSYXRpbzogbnVtYmVyXG4gIH1cblxuICBpbnRlcmZhY2UgQWN0aW9uUHJvcHMge1xuICAgIF9saW5rZWRFZGdlcz86IHsgW2tleTogc3RyaW5nXTogYm9vbGVhbiB9XG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvZGVmYXVsdE9wdGlvbnMnIHtcbiAgaW50ZXJmYWNlIEFjdGlvbkRlZmF1bHRzIHtcbiAgICByZXNpemU6IEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnNcbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9zY29wZScge1xuICBpbnRlcmZhY2UgQWN0aW9ucyB7XG4gICAgW0FjdGlvbk5hbWUuUmVzaXplXT86IHR5cGVvZiByZXNpemVcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcbiAgZW51bSBBY3Rpb25OYW1lIHtcbiAgICBSZXNpemUgPSAncmVzaXplJ1xuICB9XG59XG5cbihBY3Rpb25OYW1lIGFzIGFueSkuUmVzaXplID0gJ3Jlc2l6ZSdcblxuZXhwb3J0IGludGVyZmFjZSBSZXNpemVFdmVudCBleHRlbmRzIEludGVyYWN0LkludGVyYWN0RXZlbnQ8QWN0aW9uTmFtZS5SZXNpemU+IHtcbiAgZGVsdGFSZWN0PzogSW50ZXJhY3QuUmVjdFxuICByZWN0PzogSW50ZXJhY3QuUmVjdFxufVxuXG5mdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qge1xuICAgIGFjdGlvbnMsXG4gICAgYnJvd3NlcixcbiAgICAvKiogQGxlbmRzIEludGVyYWN0YWJsZSAqL1xuICAgIEludGVyYWN0YWJsZSwgLy8gdHNsaW50OmRpc2FibGUtbGluZSBuby1zaGFkb3dlZC12YXJpYWJsZVxuICAgIGludGVyYWN0aW9ucyxcbiAgICBkZWZhdWx0cyxcbiAgfSA9IHNjb3BlXG5cbiAgLy8gTGVzcyBQcmVjaXNpb24gd2l0aCB0b3VjaCBpbnB1dFxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCduZXcnLCAoaW50ZXJhY3Rpb24pID0+IHtcbiAgICBpbnRlcmFjdGlvbi5yZXNpemVBeGVzID0gJ3h5J1xuICB9KVxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tc3RhcnQnLCBzdGFydClcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FjdGlvbi1tb3ZlJywgbW92ZSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLXN0YXJ0JywgdXBkYXRlRXZlbnRBeGVzKVxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLW1vdmUnLCB1cGRhdGVFdmVudEF4ZXMpXG5cbiAgcmVzaXplLmN1cnNvcnMgPSBpbml0Q3Vyc29ycyhicm93c2VyKVxuICByZXNpemUuZGVmYXVsdE1hcmdpbiA9IGJyb3dzZXIuc3VwcG9ydHNUb3VjaCB8fCBicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50ID8gMjAgOiAxMFxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdChlbGVtZW50KS5yZXNpemFibGUoe1xuICAgKiAgIG9uc3RhcnQ6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAqICAgb25tb3ZlIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICogICBvbmVuZCAgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgKlxuICAgKiAgIGVkZ2VzOiB7XG4gICAqICAgICB0b3AgICA6IHRydWUsICAgICAgIC8vIFVzZSBwb2ludGVyIGNvb3JkcyB0byBjaGVjayBmb3IgcmVzaXplLlxuICAgKiAgICAgbGVmdCAgOiBmYWxzZSwgICAgICAvLyBEaXNhYmxlIHJlc2l6aW5nIGZyb20gbGVmdCBlZGdlLlxuICAgKiAgICAgYm90dG9tOiAnLnJlc2l6ZS1zJywvLyBSZXNpemUgaWYgcG9pbnRlciB0YXJnZXQgbWF0Y2hlcyBzZWxlY3RvclxuICAgKiAgICAgcmlnaHQgOiBoYW5kbGVFbCAgICAvLyBSZXNpemUgaWYgcG9pbnRlciB0YXJnZXQgaXMgdGhlIGdpdmVuIEVsZW1lbnRcbiAgICogICB9LFxuICAgKlxuICAgKiAgICAgLy8gV2lkdGggYW5kIGhlaWdodCBjYW4gYmUgYWRqdXN0ZWQgaW5kZXBlbmRlbnRseS4gV2hlbiBgdHJ1ZWAsIHdpZHRoIGFuZFxuICAgKiAgICAgLy8gaGVpZ2h0IGFyZSBhZGp1c3RlZCBhdCBhIDE6MSByYXRpby5cbiAgICogICAgIHNxdWFyZTogZmFsc2UsXG4gICAqXG4gICAqICAgICAvLyBXaWR0aCBhbmQgaGVpZ2h0IGNhbiBiZSBhZGp1c3RlZCBpbmRlcGVuZGVudGx5LiBXaGVuIGB0cnVlYCwgd2lkdGggYW5kXG4gICAqICAgICAvLyBoZWlnaHQgbWFpbnRhaW4gdGhlIGFzcGVjdCByYXRpbyB0aGV5IGhhZCB3aGVuIHJlc2l6aW5nIHN0YXJ0ZWQuXG4gICAqICAgICBwcmVzZXJ2ZUFzcGVjdFJhdGlvOiBmYWxzZSxcbiAgICpcbiAgICogICAvLyBhIHZhbHVlIG9mICdub25lJyB3aWxsIGxpbWl0IHRoZSByZXNpemUgcmVjdCB0byBhIG1pbmltdW0gb2YgMHgwXG4gICAqICAgLy8gJ25lZ2F0ZScgd2lsbCBhbGxvdyB0aGUgcmVjdCB0byBoYXZlIG5lZ2F0aXZlIHdpZHRoL2hlaWdodFxuICAgKiAgIC8vICdyZXBvc2l0aW9uJyB3aWxsIGtlZXAgdGhlIHdpZHRoL2hlaWdodCBwb3NpdGl2ZSBieSBzd2FwcGluZ1xuICAgKiAgIC8vIHRoZSB0b3AgYW5kIGJvdHRvbSBlZGdlcyBhbmQvb3Igc3dhcHBpbmcgdGhlIGxlZnQgYW5kIHJpZ2h0IGVkZ2VzXG4gICAqICAgaW52ZXJ0OiAnbm9uZScgfHwgJ25lZ2F0ZScgfHwgJ3JlcG9zaXRpb24nXG4gICAqXG4gICAqICAgLy8gbGltaXQgbXVsdGlwbGUgcmVzaXplcy5cbiAgICogICAvLyBTZWUgdGhlIGV4cGxhbmF0aW9uIGluIHRoZSB7QGxpbmsgSW50ZXJhY3RhYmxlLmRyYWdnYWJsZX0gZXhhbXBsZVxuICAgKiAgIG1heDogSW5maW5pdHksXG4gICAqICAgbWF4UGVyRWxlbWVudDogMSxcbiAgICogfSk7XG4gICAqXG4gICAqIHZhciBpc1Jlc2l6ZWFibGUgPSBpbnRlcmFjdChlbGVtZW50KS5yZXNpemFibGUoKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEdldHMgb3Igc2V0cyB3aGV0aGVyIHJlc2l6ZSBhY3Rpb25zIGNhbiBiZSBwZXJmb3JtZWQgb24gdGhlIHRhcmdldFxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW4gfCBvYmplY3R9IFtvcHRpb25zXSB0cnVlL2ZhbHNlIG9yIEFuIG9iamVjdCB3aXRoIGV2ZW50XG4gICAqIGxpc3RlbmVycyB0byBiZSBmaXJlZCBvbiByZXNpemUgZXZlbnRzIChvYmplY3QgbWFrZXMgdGhlIEludGVyYWN0YWJsZVxuICAgKiByZXNpemFibGUpXG4gICAqIEByZXR1cm4ge2Jvb2xlYW4gfCBJbnRlcmFjdGFibGV9IEEgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIHRoaXMgY2FuIGJlIHRoZVxuICAgKiB0YXJnZXQgb2YgcmVzaXplIGVsZW1lbnRzLCBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5yZXNpemFibGUgPSBmdW5jdGlvbiAodGhpczogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBvcHRpb25zOiBJbnRlcmFjdC5SZXNpemFibGVPcHRpb25zIHwgYm9vbGVhbikge1xuICAgIHJldHVybiByZXNpemFibGUodGhpcywgb3B0aW9ucywgc2NvcGUpXG4gIH0gYXMgUmVzaXphYmxlTWV0aG9kXG5cbiAgYWN0aW9uc1tBY3Rpb25OYW1lLlJlc2l6ZV0gPSByZXNpemVcbiAgYWN0aW9ucy5uYW1lcy5wdXNoKEFjdGlvbk5hbWUuUmVzaXplKVxuICB1dGlscy5hcnIubWVyZ2UoYWN0aW9ucy5ldmVudFR5cGVzLCBbXG4gICAgJ3Jlc2l6ZXN0YXJ0JyxcbiAgICAncmVzaXplbW92ZScsXG4gICAgJ3Jlc2l6ZWluZXJ0aWFzdGFydCcsXG4gICAgJ3Jlc2l6ZXJlc3VtZScsXG4gICAgJ3Jlc2l6ZWVuZCcsXG4gIF0pXG4gIGFjdGlvbnMubWV0aG9kRGljdC5yZXNpemUgPSAncmVzaXphYmxlJ1xuXG4gIGRlZmF1bHRzLmFjdGlvbnMucmVzaXplID0gcmVzaXplLmRlZmF1bHRzXG59XG5cbmNvbnN0IHJlc2l6ZSA9IHtcbiAgaW5zdGFsbCxcbiAgZGVmYXVsdHM6IHtcbiAgICBzcXVhcmU6IGZhbHNlLFxuICAgIHByZXNlcnZlQXNwZWN0UmF0aW86IGZhbHNlLFxuICAgIGF4aXM6ICd4eScsXG5cbiAgICAvLyB1c2UgZGVmYXVsdCBtYXJnaW5cbiAgICBtYXJnaW46IE5hTixcblxuICAgIC8vIG9iamVjdCB3aXRoIHByb3BzIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbSB3aGljaCBhcmVcbiAgICAvLyB0cnVlL2ZhbHNlIHZhbHVlcyB0byByZXNpemUgd2hlbiB0aGUgcG9pbnRlciBpcyBvdmVyIHRoYXQgZWRnZSxcbiAgICAvLyBDU1Mgc2VsZWN0b3JzIHRvIG1hdGNoIHRoZSBoYW5kbGVzIGZvciBlYWNoIGRpcmVjdGlvblxuICAgIC8vIG9yIHRoZSBFbGVtZW50cyBmb3IgZWFjaCBoYW5kbGVcbiAgICBlZGdlczogbnVsbCxcblxuICAgIC8vIGEgdmFsdWUgb2YgJ25vbmUnIHdpbGwgbGltaXQgdGhlIHJlc2l6ZSByZWN0IHRvIGEgbWluaW11bSBvZiAweDBcbiAgICAvLyAnbmVnYXRlJyB3aWxsIGFsb3cgdGhlIHJlY3QgdG8gaGF2ZSBuZWdhdGl2ZSB3aWR0aC9oZWlnaHRcbiAgICAvLyAncmVwb3NpdGlvbicgd2lsbCBrZWVwIHRoZSB3aWR0aC9oZWlnaHQgcG9zaXRpdmUgYnkgc3dhcHBpbmdcbiAgICAvLyB0aGUgdG9wIGFuZCBib3R0b20gZWRnZXMgYW5kL29yIHN3YXBwaW5nIHRoZSBsZWZ0IGFuZCByaWdodCBlZGdlc1xuICAgIGludmVydDogJ25vbmUnLFxuICB9IGFzIEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnMsXG5cbiAgY2hlY2tlciAoXG4gICAgX3BvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLFxuICAgIF9ldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSxcbiAgICBpbnRlcmFjdGFibGU6IEludGVyYWN0LkludGVyYWN0YWJsZSxcbiAgICBlbGVtZW50OiBFbGVtZW50LFxuICAgIGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbixcbiAgICByZWN0OiBJbnRlcmFjdC5SZWN0XG4gICkge1xuICAgIGlmICghcmVjdCkgeyByZXR1cm4gbnVsbCB9XG5cbiAgICBjb25zdCBwYWdlID0gdXRpbHMuZXh0ZW5kKHt9LCBpbnRlcmFjdGlvbi5jb29yZHMuY3VyLnBhZ2UpXG4gICAgY29uc3Qgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zXG5cbiAgICBpZiAob3B0aW9ucy5yZXNpemUuZW5hYmxlZCkge1xuICAgICAgY29uc3QgcmVzaXplT3B0aW9ucyA9IG9wdGlvbnMucmVzaXplXG4gICAgICBjb25zdCByZXNpemVFZGdlczogeyBbZWRnZTogc3RyaW5nXTogYm9vbGVhbiB9ID0geyBsZWZ0OiBmYWxzZSwgcmlnaHQ6IGZhbHNlLCB0b3A6IGZhbHNlLCBib3R0b206IGZhbHNlIH1cblxuICAgICAgLy8gaWYgdXNpbmcgcmVzaXplLmVkZ2VzXG4gICAgICBpZiAodXRpbHMuaXMub2JqZWN0KHJlc2l6ZU9wdGlvbnMuZWRnZXMpKSB7XG4gICAgICAgIGZvciAoY29uc3QgZWRnZSBpbiByZXNpemVFZGdlcykge1xuICAgICAgICAgIHJlc2l6ZUVkZ2VzW2VkZ2VdID0gY2hlY2tSZXNpemVFZGdlKGVkZ2UsXG4gICAgICAgICAgICByZXNpemVPcHRpb25zLmVkZ2VzW2VkZ2VdLFxuICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgIGludGVyYWN0aW9uLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgZWxlbWVudCxcbiAgICAgICAgICAgIHJlY3QsXG4gICAgICAgICAgICByZXNpemVPcHRpb25zLm1hcmdpbiB8fCB0aGlzLmRlZmF1bHRNYXJnaW4pXG4gICAgICAgIH1cblxuICAgICAgICByZXNpemVFZGdlcy5sZWZ0ID0gcmVzaXplRWRnZXMubGVmdCAmJiAhcmVzaXplRWRnZXMucmlnaHRcbiAgICAgICAgcmVzaXplRWRnZXMudG9wICA9IHJlc2l6ZUVkZ2VzLnRvcCAgJiYgIXJlc2l6ZUVkZ2VzLmJvdHRvbVxuXG4gICAgICAgIGlmIChyZXNpemVFZGdlcy5sZWZ0IHx8IHJlc2l6ZUVkZ2VzLnJpZ2h0IHx8IHJlc2l6ZUVkZ2VzLnRvcCB8fCByZXNpemVFZGdlcy5ib3R0b20pIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogJ3Jlc2l6ZScsXG4gICAgICAgICAgICBlZGdlczogcmVzaXplRWRnZXMsXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgcmlnaHQgID0gb3B0aW9ucy5yZXNpemUuYXhpcyAhPT0gJ3knICYmIHBhZ2UueCA+IChyZWN0LnJpZ2h0ICAtIHRoaXMuZGVmYXVsdE1hcmdpbilcbiAgICAgICAgY29uc3QgYm90dG9tID0gb3B0aW9ucy5yZXNpemUuYXhpcyAhPT0gJ3gnICYmIHBhZ2UueSA+IChyZWN0LmJvdHRvbSAtIHRoaXMuZGVmYXVsdE1hcmdpbilcblxuICAgICAgICBpZiAocmlnaHQgfHwgYm90dG9tKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6ICdyZXNpemUnLFxuICAgICAgICAgICAgYXhlczogKHJpZ2h0ID8gJ3gnIDogJycpICsgKGJvdHRvbSA/ICd5JyA6ICcnKSxcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbFxuICB9LFxuXG4gIGN1cnNvcnM6IG51bGwgYXMgdW5rbm93biBhcyBSZXR1cm5UeXBlPHR5cGVvZiBpbml0Q3Vyc29ycz4sXG5cbiAgZ2V0Q3Vyc29yIChhY3Rpb246IEFjdGlvblByb3BzKSB7XG4gICAgY29uc3QgY3Vyc29ycyA9IHJlc2l6ZS5jdXJzb3JzIGFzIHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH1cbiAgICBpZiAoYWN0aW9uLmF4aXMpIHtcbiAgICAgIHJldHVybiBjdXJzb3JzW2FjdGlvbi5uYW1lICsgYWN0aW9uLmF4aXNdXG4gICAgfVxuICAgIGVsc2UgaWYgKGFjdGlvbi5lZGdlcykge1xuICAgICAgbGV0IGN1cnNvcktleSA9ICcnXG4gICAgICBjb25zdCBlZGdlTmFtZXMgPSBbJ3RvcCcsICdib3R0b20nLCAnbGVmdCcsICdyaWdodCddXG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgIGlmIChhY3Rpb24uZWRnZXNbZWRnZU5hbWVzW2ldXSkge1xuICAgICAgICAgIGN1cnNvcktleSArPSBlZGdlTmFtZXNbaV1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gY3Vyc29yc1tjdXJzb3JLZXldXG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGxcbiAgfSxcblxuICBkZWZhdWx0TWFyZ2luOiBudWxsIGFzIHVua25vd24gYXMgbnVtYmVyLFxufVxuXG5mdW5jdGlvbiByZXNpemFibGUgKGludGVyYWN0YWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBvcHRpb25zOiBJbnRlcmFjdC5PckJvb2xlYW48SW50ZXJhY3QuUmVzaXphYmxlT3B0aW9ucz4gfCBib29sZWFuLCBzY29wZTogU2NvcGUpIHtcbiAgaWYgKHV0aWxzLmlzLm9iamVjdChvcHRpb25zKSkge1xuICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkICE9PSBmYWxzZVxuICAgIGludGVyYWN0YWJsZS5zZXRQZXJBY3Rpb24oJ3Jlc2l6ZScsIG9wdGlvbnMpXG4gICAgaW50ZXJhY3RhYmxlLnNldE9uRXZlbnRzKCdyZXNpemUnLCBvcHRpb25zKVxuXG4gICAgaWYgKHV0aWxzLmlzLnN0cmluZyhvcHRpb25zLmF4aXMpICYmIC9eeCR8XnkkfF54eSQvLnRlc3Qob3B0aW9ucy5heGlzKSkge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplLmF4aXMgPSBvcHRpb25zLmF4aXNcbiAgICB9XG4gICAgZWxzZSBpZiAob3B0aW9ucy5heGlzID09PSBudWxsKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUuYXhpcyA9IHNjb3BlLmRlZmF1bHRzLmFjdGlvbnMucmVzaXplLmF4aXNcbiAgICB9XG5cbiAgICBpZiAodXRpbHMuaXMuYm9vbChvcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW8pKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUucHJlc2VydmVBc3BlY3RSYXRpbyA9IG9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpb1xuICAgIH1cbiAgICBlbHNlIGlmICh1dGlscy5pcy5ib29sKG9wdGlvbnMuc3F1YXJlKSkge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplLnNxdWFyZSA9IG9wdGlvbnMuc3F1YXJlXG4gICAgfVxuXG4gICAgcmV0dXJuIGludGVyYWN0YWJsZVxuICB9XG4gIGlmICh1dGlscy5pcy5ib29sKG9wdGlvbnMpKSB7XG4gICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplLmVuYWJsZWQgPSBvcHRpb25zXG5cbiAgICByZXR1cm4gaW50ZXJhY3RhYmxlXG4gIH1cbiAgcmV0dXJuIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZVxufVxuXG5mdW5jdGlvbiBjaGVja1Jlc2l6ZUVkZ2UgKG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgcGFnZTogSW50ZXJhY3QuUG9pbnQsIGVsZW1lbnQ6IE5vZGUsIGludGVyYWN0YWJsZUVsZW1lbnQ6IEVsZW1lbnQsIHJlY3Q6IEludGVyYWN0LlJlY3QsIG1hcmdpbjogbnVtYmVyKSB7XG4gIC8vIGZhbHNlLCAnJywgdW5kZWZpbmVkLCBudWxsXG4gIGlmICghdmFsdWUpIHsgcmV0dXJuIGZhbHNlIH1cblxuICAvLyB0cnVlIHZhbHVlLCB1c2UgcG9pbnRlciBjb29yZHMgYW5kIGVsZW1lbnQgcmVjdFxuICBpZiAodmFsdWUgPT09IHRydWUpIHtcbiAgICAvLyBpZiBkaW1lbnNpb25zIGFyZSBuZWdhdGl2ZSwgXCJzd2l0Y2hcIiBlZGdlc1xuICAgIGNvbnN0IHdpZHRoICA9IHV0aWxzLmlzLm51bWJlcihyZWN0LndpZHRoKSA/IHJlY3Qud2lkdGggIDogcmVjdC5yaWdodCAgLSByZWN0LmxlZnRcbiAgICBjb25zdCBoZWlnaHQgPSB1dGlscy5pcy5udW1iZXIocmVjdC5oZWlnaHQpID8gcmVjdC5oZWlnaHQgOiByZWN0LmJvdHRvbSAtIHJlY3QudG9wXG5cbiAgICAvLyBkb24ndCB1c2UgbWFyZ2luIGdyZWF0ZXIgdGhhbiBoYWxmIHRoZSByZWxldmVudCBkaW1lbnNpb25cbiAgICBtYXJnaW4gPSBNYXRoLm1pbihtYXJnaW4sIChuYW1lID09PSAnbGVmdCcgfHwgbmFtZSA9PT0gJ3JpZ2h0JyA/IHdpZHRoIDogaGVpZ2h0KSAvIDIpXG5cbiAgICBpZiAod2lkdGggPCAwKSB7XG4gICAgICBpZiAgICAgIChuYW1lID09PSAnbGVmdCcpICB7IG5hbWUgPSAncmlnaHQnIH1cbiAgICAgIGVsc2UgaWYgKG5hbWUgPT09ICdyaWdodCcpIHsgbmFtZSA9ICdsZWZ0JyAgfVxuICAgIH1cbiAgICBpZiAoaGVpZ2h0IDwgMCkge1xuICAgICAgaWYgICAgICAobmFtZSA9PT0gJ3RvcCcpICAgIHsgbmFtZSA9ICdib3R0b20nIH1cbiAgICAgIGVsc2UgaWYgKG5hbWUgPT09ICdib3R0b20nKSB7IG5hbWUgPSAndG9wJyAgICB9XG4gICAgfVxuXG4gICAgaWYgKG5hbWUgPT09ICdsZWZ0JykgeyByZXR1cm4gcGFnZS54IDwgKCh3aWR0aCAgPj0gMCA/IHJlY3QubGVmdCA6IHJlY3QucmlnaHQpICsgbWFyZ2luKSB9XG4gICAgaWYgKG5hbWUgPT09ICd0b3AnKSB7IHJldHVybiBwYWdlLnkgPCAoKGhlaWdodCA+PSAwID8gcmVjdC50b3AgOiByZWN0LmJvdHRvbSkgKyBtYXJnaW4pIH1cblxuICAgIGlmIChuYW1lID09PSAncmlnaHQnKSB7IHJldHVybiBwYWdlLnggPiAoKHdpZHRoICA+PSAwID8gcmVjdC5yaWdodCA6IHJlY3QubGVmdCkgLSBtYXJnaW4pIH1cbiAgICBpZiAobmFtZSA9PT0gJ2JvdHRvbScpIHsgcmV0dXJuIHBhZ2UueSA+ICgoaGVpZ2h0ID49IDAgPyByZWN0LmJvdHRvbSA6IHJlY3QudG9wKSAtIG1hcmdpbikgfVxuICB9XG5cbiAgLy8gdGhlIHJlbWFpbmluZyBjaGVja3MgcmVxdWlyZSBhbiBlbGVtZW50XG4gIGlmICghdXRpbHMuaXMuZWxlbWVudChlbGVtZW50KSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIHJldHVybiB1dGlscy5pcy5lbGVtZW50KHZhbHVlKVxuICAvLyB0aGUgdmFsdWUgaXMgYW4gZWxlbWVudCB0byB1c2UgYXMgYSByZXNpemUgaGFuZGxlXG4gICAgPyB2YWx1ZSA9PT0gZWxlbWVudFxuICAgIC8vIG90aGVyd2lzZSBjaGVjayBpZiBlbGVtZW50IG1hdGNoZXMgdmFsdWUgYXMgc2VsZWN0b3JcbiAgICA6IHV0aWxzLmRvbS5tYXRjaGVzVXBUbyhlbGVtZW50LCB2YWx1ZSwgaW50ZXJhY3RhYmxlRWxlbWVudClcbn1cblxuZnVuY3Rpb24gaW5pdEN1cnNvcnMgKGJyb3dzZXI6IHR5cGVvZiBpbXBvcnQgKCdAaW50ZXJhY3Rqcy91dGlscy9icm93c2VyJykuZGVmYXVsdCkge1xuICByZXR1cm4gKGJyb3dzZXIuaXNJZTkgPyB7XG4gICAgeCA6ICdlLXJlc2l6ZScsXG4gICAgeSA6ICdzLXJlc2l6ZScsXG4gICAgeHk6ICdzZS1yZXNpemUnLFxuXG4gICAgdG9wICAgICAgICA6ICduLXJlc2l6ZScsXG4gICAgbGVmdCAgICAgICA6ICd3LXJlc2l6ZScsXG4gICAgYm90dG9tICAgICA6ICdzLXJlc2l6ZScsXG4gICAgcmlnaHQgICAgICA6ICdlLXJlc2l6ZScsXG4gICAgdG9wbGVmdCAgICA6ICdzZS1yZXNpemUnLFxuICAgIGJvdHRvbXJpZ2h0OiAnc2UtcmVzaXplJyxcbiAgICB0b3ByaWdodCAgIDogJ25lLXJlc2l6ZScsXG4gICAgYm90dG9tbGVmdCA6ICduZS1yZXNpemUnLFxuICB9IDoge1xuICAgIHggOiAnZXctcmVzaXplJyxcbiAgICB5IDogJ25zLXJlc2l6ZScsXG4gICAgeHk6ICdud3NlLXJlc2l6ZScsXG5cbiAgICB0b3AgICAgICAgIDogJ25zLXJlc2l6ZScsXG4gICAgbGVmdCAgICAgICA6ICdldy1yZXNpemUnLFxuICAgIGJvdHRvbSAgICAgOiAnbnMtcmVzaXplJyxcbiAgICByaWdodCAgICAgIDogJ2V3LXJlc2l6ZScsXG4gICAgdG9wbGVmdCAgICA6ICdud3NlLXJlc2l6ZScsXG4gICAgYm90dG9tcmlnaHQ6ICdud3NlLXJlc2l6ZScsXG4gICAgdG9wcmlnaHQgICA6ICduZXN3LXJlc2l6ZScsXG4gICAgYm90dG9tbGVmdCA6ICduZXN3LXJlc2l6ZScsXG4gIH0pXG59XG5cbmZ1bmN0aW9uIHN0YXJ0ICh7IGlFdmVudCwgaW50ZXJhY3Rpb24gfTogSW50ZXJhY3QuU2lnbmFsQXJnKSB7XG4gIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAncmVzaXplJyB8fCAhaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXMpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGNvbnN0IHN0YXJ0UmVjdCA9IGludGVyYWN0aW9uLmludGVyYWN0YWJsZS5nZXRSZWN0KGludGVyYWN0aW9uLmVsZW1lbnQpXG4gIGNvbnN0IHJlc2l6ZU9wdGlvbnMgPSBpbnRlcmFjdGlvbi5pbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemVcblxuICAvKlxuICAgKiBXaGVuIHVzaW5nIHRoZSBgcmVzaXphYmxlLnNxdWFyZWAgb3IgYHJlc2l6YWJsZS5wcmVzZXJ2ZUFzcGVjdFJhdGlvYCBvcHRpb25zLCByZXNpemluZyBmcm9tIG9uZSBlZGdlXG4gICAqIHdpbGwgYWZmZWN0IGFub3RoZXIuIEUuZy4gd2l0aCBgcmVzaXphYmxlLnNxdWFyZWAsIHJlc2l6aW5nIHRvIG1ha2UgdGhlIHJpZ2h0IGVkZ2UgbGFyZ2VyIHdpbGwgbWFrZVxuICAgKiB0aGUgYm90dG9tIGVkZ2UgbGFyZ2VyIGJ5IHRoZSBzYW1lIGFtb3VudC4gV2UgY2FsbCB0aGVzZSAnbGlua2VkJyBlZGdlcy4gQW55IGxpbmtlZCBlZGdlcyB3aWxsIGRlcGVuZFxuICAgKiBvbiB0aGUgYWN0aXZlIGVkZ2VzIGFuZCB0aGUgZWRnZSBiZWluZyBpbnRlcmFjdGVkIHdpdGguXG4gICAqL1xuICBpZiAocmVzaXplT3B0aW9ucy5zcXVhcmUgfHwgcmVzaXplT3B0aW9ucy5wcmVzZXJ2ZUFzcGVjdFJhdGlvKSB7XG4gICAgY29uc3QgbGlua2VkRWRnZXMgPSB1dGlscy5leHRlbmQoe30sIGludGVyYWN0aW9uLnByZXBhcmVkLmVkZ2VzKVxuXG4gICAgbGlua2VkRWRnZXMudG9wICAgID0gbGlua2VkRWRnZXMudG9wICAgIHx8IChsaW5rZWRFZGdlcy5sZWZ0ICAgJiYgIWxpbmtlZEVkZ2VzLmJvdHRvbSlcbiAgICBsaW5rZWRFZGdlcy5sZWZ0ICAgPSBsaW5rZWRFZGdlcy5sZWZ0ICAgfHwgKGxpbmtlZEVkZ2VzLnRvcCAgICAmJiAhbGlua2VkRWRnZXMucmlnaHQpXG4gICAgbGlua2VkRWRnZXMuYm90dG9tID0gbGlua2VkRWRnZXMuYm90dG9tIHx8IChsaW5rZWRFZGdlcy5yaWdodCAgJiYgIWxpbmtlZEVkZ2VzLnRvcClcbiAgICBsaW5rZWRFZGdlcy5yaWdodCAgPSBsaW5rZWRFZGdlcy5yaWdodCAgfHwgKGxpbmtlZEVkZ2VzLmJvdHRvbSAmJiAhbGlua2VkRWRnZXMubGVmdClcblxuICAgIGludGVyYWN0aW9uLnByZXBhcmVkLl9saW5rZWRFZGdlcyA9IGxpbmtlZEVkZ2VzXG4gIH1cbiAgZWxzZSB7XG4gICAgaW50ZXJhY3Rpb24ucHJlcGFyZWQuX2xpbmtlZEVkZ2VzID0gbnVsbFxuICB9XG5cbiAgLy8gaWYgdXNpbmcgYHJlc2l6YWJsZS5wcmVzZXJ2ZUFzcGVjdFJhdGlvYCBvcHRpb24sIHJlY29yZCBhc3BlY3QgcmF0aW8gYXQgdGhlIHN0YXJ0IG9mIHRoZSByZXNpemVcbiAgaWYgKHJlc2l6ZU9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpbykge1xuICAgIGludGVyYWN0aW9uLnJlc2l6ZVN0YXJ0QXNwZWN0UmF0aW8gPSBzdGFydFJlY3Qud2lkdGggLyBzdGFydFJlY3QuaGVpZ2h0XG4gIH1cblxuICBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cyA9IHtcbiAgICBzdGFydCAgICAgOiBzdGFydFJlY3QsXG4gICAgY3VycmVudCAgIDogdXRpbHMuZXh0ZW5kKHt9LCBzdGFydFJlY3QpLFxuICAgIGludmVydGVkICA6IHV0aWxzLmV4dGVuZCh7fSwgc3RhcnRSZWN0KSxcbiAgICBwcmV2aW91cyAgOiB1dGlscy5leHRlbmQoe30sIHN0YXJ0UmVjdCksXG4gICAgZGVsdGEgICAgIDoge1xuICAgICAgbGVmdDogMCxcbiAgICAgIHJpZ2h0IDogMCxcbiAgICAgIHdpZHRoIDogMCxcbiAgICAgIHRvcCA6IDAsXG4gICAgICBib3R0b206IDAsXG4gICAgICBoZWlnaHQ6IDAsXG4gICAgfSxcbiAgfTtcblxuICAoaUV2ZW50IGFzIFJlc2l6ZUV2ZW50KS5yZWN0ID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuaW52ZXJ0ZWQ7XG4gIChpRXZlbnQgYXMgUmVzaXplRXZlbnQpLmRlbHRhUmVjdCA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLmRlbHRhXG59XG5cbmZ1bmN0aW9uIG1vdmUgKHsgaUV2ZW50LCBpbnRlcmFjdGlvbiB9KSB7XG4gIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAncmVzaXplJyB8fCAhaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXMpIHsgcmV0dXJuIH1cblxuICBjb25zdCByZXNpemVPcHRpb25zID0gaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplXG4gIGNvbnN0IGludmVydCA9IHJlc2l6ZU9wdGlvbnMuaW52ZXJ0XG4gIGNvbnN0IGludmVydGlibGUgPSBpbnZlcnQgPT09ICdyZXBvc2l0aW9uJyB8fCBpbnZlcnQgPT09ICduZWdhdGUnXG5cbiAgbGV0IGVkZ2VzID0gaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXNcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tc2hhZG93XG4gIGNvbnN0IHN0YXJ0ICAgICAgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5zdGFydFxuICBjb25zdCBjdXJyZW50ICAgID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuY3VycmVudFxuICBjb25zdCBpbnZlcnRlZCAgID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuaW52ZXJ0ZWRcbiAgY29uc3QgZGVsdGFSZWN0ICA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLmRlbHRhXG4gIGNvbnN0IHByZXZpb3VzICAgPSB1dGlscy5leHRlbmQoaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMucHJldmlvdXMsIGludmVydGVkKVxuICBjb25zdCBvcmlnaW5hbEVkZ2VzID0gZWRnZXNcblxuICBjb25zdCBldmVudERlbHRhID0gdXRpbHMuZXh0ZW5kKHt9LCBpRXZlbnQuZGVsdGEpXG5cbiAgaWYgKHJlc2l6ZU9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpbyB8fCByZXNpemVPcHRpb25zLnNxdWFyZSkge1xuICAgIC8vIGByZXNpemUucHJlc2VydmVBc3BlY3RSYXRpb2AgdGFrZXMgcHJlY2VkZW5jZSBvdmVyIGByZXNpemUuc3F1YXJlYFxuICAgIGNvbnN0IHN0YXJ0QXNwZWN0UmF0aW8gPSByZXNpemVPcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW9cbiAgICAgID8gaW50ZXJhY3Rpb24ucmVzaXplU3RhcnRBc3BlY3RSYXRpb1xuICAgICAgOiAxXG5cbiAgICBlZGdlcyA9IGludGVyYWN0aW9uLnByZXBhcmVkLl9saW5rZWRFZGdlc1xuXG4gICAgaWYgKChvcmlnaW5hbEVkZ2VzLmxlZnQgJiYgb3JpZ2luYWxFZGdlcy5ib3R0b20pIHx8XG4gICAgICAgIChvcmlnaW5hbEVkZ2VzLnJpZ2h0ICYmIG9yaWdpbmFsRWRnZXMudG9wKSkge1xuICAgICAgZXZlbnREZWx0YS55ID0gLWV2ZW50RGVsdGEueCAvIHN0YXJ0QXNwZWN0UmF0aW9cbiAgICB9XG4gICAgZWxzZSBpZiAob3JpZ2luYWxFZGdlcy5sZWZ0IHx8IG9yaWdpbmFsRWRnZXMucmlnaHQpIHsgZXZlbnREZWx0YS55ID0gZXZlbnREZWx0YS54IC8gc3RhcnRBc3BlY3RSYXRpbyB9XG4gICAgZWxzZSBpZiAob3JpZ2luYWxFZGdlcy50b3AgIHx8IG9yaWdpbmFsRWRnZXMuYm90dG9tKSB7IGV2ZW50RGVsdGEueCA9IGV2ZW50RGVsdGEueSAqIHN0YXJ0QXNwZWN0UmF0aW8gfVxuICB9XG5cbiAgLy8gdXBkYXRlIHRoZSAnY3VycmVudCcgcmVjdCB3aXRob3V0IG1vZGlmaWNhdGlvbnNcbiAgaWYgKGVkZ2VzLnRvcCkgeyBjdXJyZW50LnRvcCAgICArPSBldmVudERlbHRhLnkgfVxuICBpZiAoZWRnZXMuYm90dG9tKSB7IGN1cnJlbnQuYm90dG9tICs9IGV2ZW50RGVsdGEueSB9XG4gIGlmIChlZGdlcy5sZWZ0KSB7IGN1cnJlbnQubGVmdCAgICs9IGV2ZW50RGVsdGEueCB9XG4gIGlmIChlZGdlcy5yaWdodCkgeyBjdXJyZW50LnJpZ2h0ICArPSBldmVudERlbHRhLnggfVxuXG4gIGlmIChpbnZlcnRpYmxlKSB7XG4gICAgLy8gaWYgaW52ZXJ0aWJsZSwgY29weSB0aGUgY3VycmVudCByZWN0XG4gICAgdXRpbHMuZXh0ZW5kKGludmVydGVkLCBjdXJyZW50KVxuXG4gICAgaWYgKGludmVydCA9PT0gJ3JlcG9zaXRpb24nKSB7XG4gICAgICAvLyBzd2FwIGVkZ2UgdmFsdWVzIGlmIG5lY2Vzc2FyeSB0byBrZWVwIHdpZHRoL2hlaWdodCBwb3NpdGl2ZVxuICAgICAgbGV0IHN3YXBcblxuICAgICAgaWYgKGludmVydGVkLnRvcCA+IGludmVydGVkLmJvdHRvbSkge1xuICAgICAgICBzd2FwID0gaW52ZXJ0ZWQudG9wXG5cbiAgICAgICAgaW52ZXJ0ZWQudG9wID0gaW52ZXJ0ZWQuYm90dG9tXG4gICAgICAgIGludmVydGVkLmJvdHRvbSA9IHN3YXBcbiAgICAgIH1cbiAgICAgIGlmIChpbnZlcnRlZC5sZWZ0ID4gaW52ZXJ0ZWQucmlnaHQpIHtcbiAgICAgICAgc3dhcCA9IGludmVydGVkLmxlZnRcblxuICAgICAgICBpbnZlcnRlZC5sZWZ0ID0gaW52ZXJ0ZWQucmlnaHRcbiAgICAgICAgaW52ZXJ0ZWQucmlnaHQgPSBzd2FwXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIC8vIGlmIG5vdCBpbnZlcnRpYmxlLCByZXN0cmljdCB0byBtaW5pbXVtIG9mIDB4MCByZWN0XG4gICAgaW52ZXJ0ZWQudG9wICAgID0gTWF0aC5taW4oY3VycmVudC50b3AsIHN0YXJ0LmJvdHRvbSlcbiAgICBpbnZlcnRlZC5ib3R0b20gPSBNYXRoLm1heChjdXJyZW50LmJvdHRvbSwgc3RhcnQudG9wKVxuICAgIGludmVydGVkLmxlZnQgICA9IE1hdGgubWluKGN1cnJlbnQubGVmdCwgc3RhcnQucmlnaHQpXG4gICAgaW52ZXJ0ZWQucmlnaHQgID0gTWF0aC5tYXgoY3VycmVudC5yaWdodCwgc3RhcnQubGVmdClcbiAgfVxuXG4gIGludmVydGVkLndpZHRoICA9IGludmVydGVkLnJpZ2h0ICAtIGludmVydGVkLmxlZnRcbiAgaW52ZXJ0ZWQuaGVpZ2h0ID0gaW52ZXJ0ZWQuYm90dG9tIC0gaW52ZXJ0ZWQudG9wXG5cbiAgZm9yIChjb25zdCBlZGdlIGluIGludmVydGVkKSB7XG4gICAgZGVsdGFSZWN0W2VkZ2VdID0gaW52ZXJ0ZWRbZWRnZV0gLSBwcmV2aW91c1tlZGdlXVxuICB9XG5cbiAgaUV2ZW50LmVkZ2VzID0gaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXNcbiAgaUV2ZW50LnJlY3QgPSBpbnZlcnRlZFxuICBpRXZlbnQuZGVsdGFSZWN0ID0gZGVsdGFSZWN0XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUV2ZW50QXhlcyAoeyBpbnRlcmFjdGlvbiwgaUV2ZW50LCBhY3Rpb24gfSkge1xuICBpZiAoYWN0aW9uICE9PSAncmVzaXplJyB8fCAhaW50ZXJhY3Rpb24ucmVzaXplQXhlcykgeyByZXR1cm4gfVxuXG4gIGNvbnN0IG9wdGlvbnMgPSBpbnRlcmFjdGlvbi5pbnRlcmFjdGFibGUub3B0aW9uc1xuXG4gIGlmIChvcHRpb25zLnJlc2l6ZS5zcXVhcmUpIHtcbiAgICBpZiAoaW50ZXJhY3Rpb24ucmVzaXplQXhlcyA9PT0gJ3knKSB7XG4gICAgICBpRXZlbnQuZGVsdGEueCA9IGlFdmVudC5kZWx0YS55XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaUV2ZW50LmRlbHRhLnkgPSBpRXZlbnQuZGVsdGEueFxuICAgIH1cbiAgICBpRXZlbnQuYXhlcyA9ICd4eSdcbiAgfVxuICBlbHNlIHtcbiAgICBpRXZlbnQuYXhlcyA9IGludGVyYWN0aW9uLnJlc2l6ZUF4ZXNcblxuICAgIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneCcpIHtcbiAgICAgIGlFdmVudC5kZWx0YS55ID0gMFxuICAgIH1cbiAgICBlbHNlIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneScpIHtcbiAgICAgIGlFdmVudC5kZWx0YS54ID0gMFxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCByZXNpemVcbiJdfQ==