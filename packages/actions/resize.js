import { ActionName } from '@interactjs/core/scope';
import * as arr from '@interactjs/utils/arr';
import * as dom from '@interactjs/utils/domUtils';
import extend from '@interactjs/utils/extend';
import * as is from '@interactjs/utils/is';
ActionName.Resize = 'resize';
function install(scope) {
    const { actions, browser, 
    /** @lends Interactable */
    Interactable, // tslint:disable-line no-shadowed-variable
    interactions, defaults, } = scope;
    // Less Precision with touch input
    interactions.signals.on('new', interaction => {
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
     * })
     *
     * var isResizeable = interact(element).resizable()
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
    arr.merge(actions.eventTypes, [
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
    id: 'actions/resize',
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
        const page = extend({}, interaction.coords.cur.page);
        const options = interactable.options;
        if (options.resize.enabled) {
            const resizeOptions = options.resize;
            const resizeEdges = { left: false, right: false, top: false, bottom: false };
            // if using resize.edges
            if (is.object(resizeOptions.edges)) {
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
    getCursor({ edges, axis, name }) {
        const cursors = resize.cursors;
        let result = null;
        if (axis) {
            result = cursors[name + axis];
        }
        else if (edges) {
            let cursorKey = '';
            for (const edge of ['top', 'bottom', 'left', 'right']) {
                if (edges[edge]) {
                    cursorKey += edge;
                }
            }
            result = cursors[cursorKey];
        }
        return result;
    },
    defaultMargin: null,
};
function resizable(interactable, options, scope) {
    if (is.object(options)) {
        interactable.options.resize.enabled = options.enabled !== false;
        interactable.setPerAction('resize', options);
        interactable.setOnEvents('resize', options);
        if (is.string(options.axis) && /^x$|^y$|^xy$/.test(options.axis)) {
            interactable.options.resize.axis = options.axis;
        }
        else if (options.axis === null) {
            interactable.options.resize.axis = scope.defaults.actions.resize.axis;
        }
        if (is.bool(options.preserveAspectRatio)) {
            interactable.options.resize.preserveAspectRatio = options.preserveAspectRatio;
        }
        else if (is.bool(options.square)) {
            interactable.options.resize.square = options.square;
        }
        return interactable;
    }
    if (is.bool(options)) {
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
        const width = is.number(rect.width) ? rect.width : rect.right - rect.left;
        const height = is.number(rect.height) ? rect.height : rect.bottom - rect.top;
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
    if (!is.element(element)) {
        return false;
    }
    return is.element(value)
        // the value is an element to use as a resize handle
        ? value === element
        // otherwise check if element matches value as selector
        : dom.matchesUpTo(element, value, interactableElement);
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
    const startRect = interaction.rect;
    const resizeOptions = interaction.interactable.options.resize;
    /*
     * When using the `resizable.square` or `resizable.preserveAspectRatio` options, resizing from one edge
     * will affect another. E.g. with `resizable.square`, resizing to make the right edge larger will make
     * the bottom edge larger by the same amount. We call these 'linked' edges. Any linked edges will depend
     * on the active edges and the edge being interacted with.
     */
    if (resizeOptions.square || resizeOptions.preserveAspectRatio) {
        const linkedEdges = extend({}, interaction.prepared.edges);
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
        current: extend({}, startRect),
        inverted: extend({}, startRect),
        previous: extend({}, startRect),
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
    const previous = extend(interaction.resizeRects.previous, inverted);
    const originalEdges = edges;
    const eventDelta = extend({}, iEvent.delta);
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
        extend(inverted, current);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmVzaXplLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxVQUFVLEVBQVMsTUFBTSx3QkFBd0IsQ0FBQTtBQUMxRCxPQUFPLEtBQUssR0FBRyxNQUFNLHVCQUF1QixDQUFBO0FBQzVDLE9BQU8sS0FBSyxHQUFHLE1BQU0sNEJBQTRCLENBQUE7QUFDakQsT0FBTyxNQUFNLE1BQU0sMEJBQTBCLENBQUE7QUFDN0MsT0FBTyxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQWdEekMsVUFBa0IsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFBO0FBTXJDLFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsTUFBTSxFQUNKLE9BQU8sRUFDUCxPQUFPO0lBQ1AsMEJBQTBCO0lBQzFCLFlBQVksRUFBRSwyQ0FBMkM7SUFDekQsWUFBWSxFQUNaLFFBQVEsR0FDVCxHQUFHLEtBQUssQ0FBQTtJQUVULGtDQUFrQztJQUVsQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLEVBQUU7UUFDM0MsV0FBVyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUE7SUFDL0IsQ0FBQyxDQUFDLENBQUE7SUFFRixZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDOUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFBO0lBRTVDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxlQUFlLENBQUMsQ0FBQTtJQUN4RCxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsZUFBZSxDQUFDLENBQUE7SUFFdkQsTUFBTSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDckMsTUFBTSxDQUFDLGFBQWEs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QUFJLFdBQVcsQ0FBQyxVQUFVLEtBQUssR0FBRyxFQUFFO1lBQ3ZDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtTQUNuQjtLQUNGO0FBQ0gsQ0FBQztBQUVELGVBQWUsTUFBTSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWN0aW9uUHJvcHMsIEludGVyYWN0aW9uIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbidcbmltcG9ydCB7IEFjdGlvbk5hbWUsIFNjb3BlIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9zY29wZSdcbmltcG9ydCAqIGFzIGFyciBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9hcnInXG5pbXBvcnQgKiBhcyBkb20gZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZG9tVXRpbHMnXG5pbXBvcnQgZXh0ZW5kIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2V4dGVuZCdcbmltcG9ydCAqIGFzIGlzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2lzJ1xuXG5leHBvcnQgdHlwZSBFZGdlTmFtZSA9ICd0b3AnIHwgJ2xlZnQnIHwgJ2JvdHRvbScgfCAncmlnaHQnXG5cbmV4cG9ydCB0eXBlIFJlc2l6YWJsZU1ldGhvZCA9IEludGVyYWN0LkFjdGlvbk1ldGhvZDxJbnRlcmFjdC5SZXNpemFibGVPcHRpb25zPlxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGFibGUnIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0YWJsZSB7XG4gICAgcmVzaXphYmxlOiBSZXNpemFibGVNZXRob2RcbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbicge1xuICBpbnRlcmZhY2UgSW50ZXJhY3Rpb24ge1xuICAgIHJlc2l6ZUF4ZXM6ICd4JyB8ICd5JyB8ICd4eSdcbiAgICByZXNpemVSZWN0czoge1xuICAgICAgc3RhcnQ6IEludGVyYWN0LkZ1bGxSZWN0XG4gICAgICBjdXJyZW50OiBJbnRlcmFjdC5SZWN0XG4gICAgICBpbnZlcnRlZDogSW50ZXJhY3QuRnVsbFJlY3RcbiAgICAgIHByZXZpb3VzOiBJbnRlcmFjdC5GdWxsUmVjdFxuICAgICAgZGVsdGE6IEludGVyYWN0LkZ1bGxSZWN0XG4gICAgfVxuICAgIHJlc2l6ZVN0YXJ0QXNwZWN0UmF0aW86IG51bWJlclxuICB9XG5cbiAgaW50ZXJmYWNlIEFjdGlvblByb3BzIHtcbiAgICBlZGdlcz86IHsgW2VkZ2UgaW4gJ3RvcCcgfCAnbGVmdCcgfCAnYm90dG9tJyB8ICdyaWdodCddPzogYm9vbGVhbiB9XG4gICAgX2xpbmtlZEVkZ2VzPzogeyBbZWRnZSBpbiAndG9wJyB8ICdsZWZ0JyB8ICdib3R0b20nIHwgJ3JpZ2h0J10/OiBib29sZWFuIH1cbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9kZWZhdWx0T3B0aW9ucycge1xuICBpbnRlcmZhY2UgQWN0aW9uRGVmYXVsdHMge1xuICAgIHJlc2l6ZTogSW50ZXJhY3QuUmVzaXphYmxlT3B0aW9uc1xuICB9XG59XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJyB7XG4gIGludGVyZmFjZSBBY3Rpb25zIHtcbiAgICBbQWN0aW9uTmFtZS5SZXNpemVdPzogdHlwZW9mIHJlc2l6ZVxuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNoYWRvd1xuICBlbnVtIEFjdGlvbk5hbWUge1xuICAgIFJlc2l6ZSA9ICdyZXNpemUnXG4gIH1cbn1cblxuKEFjdGlvbk5hbWUgYXMgYW55KS5SZXNpemUgPSAncmVzaXplJ1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlc2l6ZUV2ZW50IGV4dGVuZHMgSW50ZXJhY3QuSW50ZXJhY3RFdmVudDxBY3Rpb25OYW1lLlJlc2l6ZT4ge1xuICBkZWx0YVJlY3Q/OiBJbnRlcmFjdC5GdWxsUmVjdFxufVxuXG5mdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qge1xuICAgIGFjdGlvbnMsXG4gICAgYnJvd3NlcixcbiAgICAvKiogQGxlbmRzIEludGVyYWN0YWJsZSAqL1xuICAgIEludGVyYWN0YWJsZSwgLy8gdHNsaW50OmRpc2FibGUtbGluZSBuby1zaGFkb3dlZC12YXJpYWJsZVxuICAgIGludGVyYWN0aW9ucyxcbiAgICBkZWZhdWx0cyxcbiAgfSA9IHNjb3BlXG5cbiAgLy8gTGVzcyBQcmVjaXNpb24gd2l0aCB0b3VjaCBpbnB1dFxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCduZXcnLCBpbnRlcmFjdGlvbiA9PiB7XG4gICAgaW50ZXJhY3Rpb24ucmVzaXplQXhlcyA9ICd4eSdcbiAgfSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLXN0YXJ0Jywgc3RhcnQpXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tbW92ZScsIG1vdmUpXG5cbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FjdGlvbi1zdGFydCcsIHVwZGF0ZUV2ZW50QXhlcylcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FjdGlvbi1tb3ZlJywgdXBkYXRlRXZlbnRBeGVzKVxuXG4gIHJlc2l6ZS5jdXJzb3JzID0gaW5pdEN1cnNvcnMoYnJvd3NlcilcbiAgcmVzaXplLmRlZmF1bHRNYXJnaW4gPSBicm93c2VyLnN1cHBvcnRzVG91Y2ggfHwgYnJvd3Nlci5zdXBwb3J0c1BvaW50ZXJFdmVudCA/IDIwIDogMTBcblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QoZWxlbWVudCkucmVzaXphYmxlKHtcbiAgICogICBvbnN0YXJ0OiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgKiAgIG9ubW92ZSA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAqICAgb25lbmQgIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICpcbiAgICogICBlZGdlczoge1xuICAgKiAgICAgdG9wICAgOiB0cnVlLCAgICAgICAvLyBVc2UgcG9pbnRlciBjb29yZHMgdG8gY2hlY2sgZm9yIHJlc2l6ZS5cbiAgICogICAgIGxlZnQgIDogZmFsc2UsICAgICAgLy8gRGlzYWJsZSByZXNpemluZyBmcm9tIGxlZnQgZWRnZS5cbiAgICogICAgIGJvdHRvbTogJy5yZXNpemUtcycsLy8gUmVzaXplIGlmIHBvaW50ZXIgdGFyZ2V0IG1hdGNoZXMgc2VsZWN0b3JcbiAgICogICAgIHJpZ2h0IDogaGFuZGxlRWwgICAgLy8gUmVzaXplIGlmIHBvaW50ZXIgdGFyZ2V0IGlzIHRoZSBnaXZlbiBFbGVtZW50XG4gICAqICAgfSxcbiAgICpcbiAgICogICAgIC8vIFdpZHRoIGFuZCBoZWlnaHQgY2FuIGJlIGFkanVzdGVkIGluZGVwZW5kZW50bHkuIFdoZW4gYHRydWVgLCB3aWR0aCBhbmRcbiAgICogICAgIC8vIGhlaWdodCBhcmUgYWRqdXN0ZWQgYXQgYSAxOjEgcmF0aW8uXG4gICAqICAgICBzcXVhcmU6IGZhbHNlLFxuICAgKlxuICAgKiAgICAgLy8gV2lkdGggYW5kIGhlaWdodCBjYW4gYmUgYWRqdXN0ZWQgaW5kZXBlbmRlbnRseS4gV2hlbiBgdHJ1ZWAsIHdpZHRoIGFuZFxuICAgKiAgICAgLy8gaGVpZ2h0IG1haW50YWluIHRoZSBhc3BlY3QgcmF0aW8gdGhleSBoYWQgd2hlbiByZXNpemluZyBzdGFydGVkLlxuICAgKiAgICAgcHJlc2VydmVBc3BlY3RSYXRpbzogZmFsc2UsXG4gICAqXG4gICAqICAgLy8gYSB2YWx1ZSBvZiAnbm9uZScgd2lsbCBsaW1pdCB0aGUgcmVzaXplIHJlY3QgdG8gYSBtaW5pbXVtIG9mIDB4MFxuICAgKiAgIC8vICduZWdhdGUnIHdpbGwgYWxsb3cgdGhlIHJlY3QgdG8gaGF2ZSBuZWdhdGl2ZSB3aWR0aC9oZWlnaHRcbiAgICogICAvLyAncmVwb3NpdGlvbicgd2lsbCBrZWVwIHRoZSB3aWR0aC9oZWlnaHQgcG9zaXRpdmUgYnkgc3dhcHBpbmdcbiAgICogICAvLyB0aGUgdG9wIGFuZCBib3R0b20gZWRnZXMgYW5kL29yIHN3YXBwaW5nIHRoZSBsZWZ0IGFuZCByaWdodCBlZGdlc1xuICAgKiAgIGludmVydDogJ25vbmUnIHx8ICduZWdhdGUnIHx8ICdyZXBvc2l0aW9uJ1xuICAgKlxuICAgKiAgIC8vIGxpbWl0IG11bHRpcGxlIHJlc2l6ZXMuXG4gICAqICAgLy8gU2VlIHRoZSBleHBsYW5hdGlvbiBpbiB0aGUge0BsaW5rIEludGVyYWN0YWJsZS5kcmFnZ2FibGV9IGV4YW1wbGVcbiAgICogICBtYXg6IEluZmluaXR5LFxuICAgKiAgIG1heFBlckVsZW1lbnQ6IDEsXG4gICAqIH0pXG4gICAqXG4gICAqIHZhciBpc1Jlc2l6ZWFibGUgPSBpbnRlcmFjdChlbGVtZW50KS5yZXNpemFibGUoKVxuICAgKiBgYGBcbiAgICpcbiAgICogR2V0cyBvciBzZXRzIHdoZXRoZXIgcmVzaXplIGFjdGlvbnMgY2FuIGJlIHBlcmZvcm1lZCBvbiB0aGUgdGFyZ2V0XG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbiB8IG9iamVjdH0gW29wdGlvbnNdIHRydWUvZmFsc2Ugb3IgQW4gb2JqZWN0IHdpdGggZXZlbnRcbiAgICogbGlzdGVuZXJzIHRvIGJlIGZpcmVkIG9uIHJlc2l6ZSBldmVudHMgKG9iamVjdCBtYWtlcyB0aGUgSW50ZXJhY3RhYmxlXG4gICAqIHJlc2l6YWJsZSlcbiAgICogQHJldHVybiB7Ym9vbGVhbiB8IEludGVyYWN0YWJsZX0gQSBib29sZWFuIGluZGljYXRpbmcgaWYgdGhpcyBjYW4gYmUgdGhlXG4gICAqIHRhcmdldCBvZiByZXNpemUgZWxlbWVudHMsIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLnJlc2l6YWJsZSA9IGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsIG9wdGlvbnM6IEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnMgfCBib29sZWFuKSB7XG4gICAgcmV0dXJuIHJlc2l6YWJsZSh0aGlzLCBvcHRpb25zLCBzY29wZSlcbiAgfSBhcyBSZXNpemFibGVNZXRob2RcblxuICBhY3Rpb25zW0FjdGlvbk5hbWUuUmVzaXplXSA9IHJlc2l6ZVxuICBhY3Rpb25zLm5hbWVzLnB1c2goQWN0aW9uTmFtZS5SZXNpemUpXG4gIGFyci5tZXJnZShhY3Rpb25zLmV2ZW50VHlwZXMsIFtcbiAgICAncmVzaXplc3RhcnQnLFxuICAgICdyZXNpemVtb3ZlJyxcbiAgICAncmVzaXplaW5lcnRpYXN0YXJ0JyxcbiAgICAncmVzaXplcmVzdW1lJyxcbiAgICAncmVzaXplZW5kJyxcbiAgXSlcbiAgYWN0aW9ucy5tZXRob2REaWN0LnJlc2l6ZSA9ICdyZXNpemFibGUnXG5cbiAgZGVmYXVsdHMuYWN0aW9ucy5yZXNpemUgPSByZXNpemUuZGVmYXVsdHNcbn1cblxuY29uc3QgcmVzaXplID0ge1xuICBpZDogJ2FjdGlvbnMvcmVzaXplJyxcbiAgaW5zdGFsbCxcbiAgZGVmYXVsdHM6IHtcbiAgICBzcXVhcmU6IGZhbHNlLFxuICAgIHByZXNlcnZlQXNwZWN0UmF0aW86IGZhbHNlLFxuICAgIGF4aXM6ICd4eScsXG5cbiAgICAvLyB1c2UgZGVmYXVsdCBtYXJnaW5cbiAgICBtYXJnaW46IE5hTixcblxuICAgIC8vIG9iamVjdCB3aXRoIHByb3BzIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbSB3aGljaCBhcmVcbiAgICAvLyB0cnVlL2ZhbHNlIHZhbHVlcyB0byByZXNpemUgd2hlbiB0aGUgcG9pbnRlciBpcyBvdmVyIHRoYXQgZWRnZSxcbiAgICAvLyBDU1Mgc2VsZWN0b3JzIHRvIG1hdGNoIHRoZSBoYW5kbGVzIGZvciBlYWNoIGRpcmVjdGlvblxuICAgIC8vIG9yIHRoZSBFbGVtZW50cyBmb3IgZWFjaCBoYW5kbGVcbiAgICBlZGdlczogbnVsbCxcblxuICAgIC8vIGEgdmFsdWUgb2YgJ25vbmUnIHdpbGwgbGltaXQgdGhlIHJlc2l6ZSByZWN0IHRvIGEgbWluaW11bSBvZiAweDBcbiAgICAvLyAnbmVnYXRlJyB3aWxsIGFsb3cgdGhlIHJlY3QgdG8gaGF2ZSBuZWdhdGl2ZSB3aWR0aC9oZWlnaHRcbiAgICAvLyAncmVwb3NpdGlvbicgd2lsbCBrZWVwIHRoZSB3aWR0aC9oZWlnaHQgcG9zaXRpdmUgYnkgc3dhcHBpbmdcbiAgICAvLyB0aGUgdG9wIGFuZCBib3R0b20gZWRnZXMgYW5kL29yIHN3YXBwaW5nIHRoZSBsZWZ0IGFuZCByaWdodCBlZGdlc1xuICAgIGludmVydDogJ25vbmUnLFxuICB9IGFzIEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnMsXG5cbiAgY2hlY2tlciAoXG4gICAgX3BvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLFxuICAgIF9ldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSxcbiAgICBpbnRlcmFjdGFibGU6IEludGVyYWN0LkludGVyYWN0YWJsZSxcbiAgICBlbGVtZW50OiBFbGVtZW50LFxuICAgIGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbixcbiAgICByZWN0OiBJbnRlcmFjdC5SZWN0XG4gICkge1xuICAgIGlmICghcmVjdCkgeyByZXR1cm4gbnVsbCB9XG5cbiAgICBjb25zdCBwYWdlID0gZXh0ZW5kKHt9LCBpbnRlcmFjdGlvbi5jb29yZHMuY3VyLnBhZ2UpXG4gICAgY29uc3Qgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zXG5cbiAgICBpZiAob3B0aW9ucy5yZXNpemUuZW5hYmxlZCkge1xuICAgICAgY29uc3QgcmVzaXplT3B0aW9ucyA9IG9wdGlvbnMucmVzaXplXG4gICAgICBjb25zdCByZXNpemVFZGdlczogeyBbZWRnZTogc3RyaW5nXTogYm9vbGVhbiB9ID0geyBsZWZ0OiBmYWxzZSwgcmlnaHQ6IGZhbHNlLCB0b3A6IGZhbHNlLCBib3R0b206IGZhbHNlIH1cblxuICAgICAgLy8gaWYgdXNpbmcgcmVzaXplLmVkZ2VzXG4gICAgICBpZiAoaXMub2JqZWN0KHJlc2l6ZU9wdGlvbnMuZWRnZXMpKSB7XG4gICAgICAgIGZvciAoY29uc3QgZWRnZSBpbiByZXNpemVFZGdlcykge1xuICAgICAgICAgIHJlc2l6ZUVkZ2VzW2VkZ2VdID0gY2hlY2tSZXNpemVFZGdlKGVkZ2UsXG4gICAgICAgICAgICByZXNpemVPcHRpb25zLmVkZ2VzW2VkZ2VdLFxuICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgIGludGVyYWN0aW9uLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgZWxlbWVudCxcbiAgICAgICAgICAgIHJlY3QsXG4gICAgICAgICAgICByZXNpemVPcHRpb25zLm1hcmdpbiB8fCB0aGlzLmRlZmF1bHRNYXJnaW4pXG4gICAgICAgIH1cblxuICAgICAgICByZXNpemVFZGdlcy5sZWZ0ID0gcmVzaXplRWRnZXMubGVmdCAmJiAhcmVzaXplRWRnZXMucmlnaHRcbiAgICAgICAgcmVzaXplRWRnZXMudG9wICA9IHJlc2l6ZUVkZ2VzLnRvcCAgJiYgIXJlc2l6ZUVkZ2VzLmJvdHRvbVxuXG4gICAgICAgIGlmIChyZXNpemVFZGdlcy5sZWZ0IHx8IHJlc2l6ZUVkZ2VzLnJpZ2h0IHx8IHJlc2l6ZUVkZ2VzLnRvcCB8fCByZXNpemVFZGdlcy5ib3R0b20pIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogJ3Jlc2l6ZScsXG4gICAgICAgICAgICBlZGdlczogcmVzaXplRWRnZXMsXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgcmlnaHQgID0gb3B0aW9ucy5yZXNpemUuYXhpcyAhPT0gJ3knICYmIHBhZ2UueCA+IChyZWN0LnJpZ2h0ICAtIHRoaXMuZGVmYXVsdE1hcmdpbilcbiAgICAgICAgY29uc3QgYm90dG9tID0gb3B0aW9ucy5yZXNpemUuYXhpcyAhPT0gJ3gnICYmIHBhZ2UueSA+IChyZWN0LmJvdHRvbSAtIHRoaXMuZGVmYXVsdE1hcmdpbilcblxuICAgICAgICBpZiAocmlnaHQgfHwgYm90dG9tKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6ICdyZXNpemUnLFxuICAgICAgICAgICAgYXhlczogKHJpZ2h0ID8gJ3gnIDogJycpICsgKGJvdHRvbSA/ICd5JyA6ICcnKSxcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbFxuICB9LFxuXG4gIGN1cnNvcnM6IG51bGwgYXMgUmV0dXJuVHlwZTx0eXBlb2YgaW5pdEN1cnNvcnM+LFxuXG4gIGdldEN1cnNvciAoeyBlZGdlcywgYXhpcywgbmFtZSB9OiBBY3Rpb25Qcm9wcykge1xuICAgIGNvbnN0IGN1cnNvcnMgPSByZXNpemUuY3Vyc29yc1xuICAgIGxldCByZXN1bHQ6IHN0cmluZyA9IG51bGxcblxuICAgIGlmIChheGlzKSB7XG4gICAgICByZXN1bHQgPSBjdXJzb3JzW25hbWUgKyBheGlzXVxuICAgIH1cbiAgICBlbHNlIGlmIChlZGdlcykge1xuICAgICAgbGV0IGN1cnNvcktleSA9ICcnXG5cbiAgICAgIGZvciAoY29uc3QgZWRnZSBvZiBbJ3RvcCcsICdib3R0b20nLCAnbGVmdCcsICdyaWdodCddKSB7XG4gICAgICAgIGlmIChlZGdlc1tlZGdlXSkge1xuICAgICAgICAgIGN1cnNvcktleSArPSBlZGdlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmVzdWx0ID0gY3Vyc29yc1tjdXJzb3JLZXldXG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9LFxuXG4gIGRlZmF1bHRNYXJnaW46IG51bGwgYXMgbnVtYmVyLFxufVxuXG5mdW5jdGlvbiByZXNpemFibGUgKGludGVyYWN0YWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBvcHRpb25zOiBJbnRlcmFjdC5PckJvb2xlYW48SW50ZXJhY3QuUmVzaXphYmxlT3B0aW9ucz4gfCBib29sZWFuLCBzY29wZTogU2NvcGUpIHtcbiAgaWYgKGlzLm9iamVjdChvcHRpb25zKSkge1xuICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkICE9PSBmYWxzZVxuICAgIGludGVyYWN0YWJsZS5zZXRQZXJBY3Rpb24oJ3Jlc2l6ZScsIG9wdGlvbnMpXG4gICAgaW50ZXJhY3RhYmxlLnNldE9uRXZlbnRzKCdyZXNpemUnLCBvcHRpb25zKVxuXG4gICAgaWYgKGlzLnN0cmluZyhvcHRpb25zLmF4aXMpICYmIC9eeCR8XnkkfF54eSQvLnRlc3Qob3B0aW9ucy5heGlzKSkge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplLmF4aXMgPSBvcHRpb25zLmF4aXNcbiAgICB9XG4gICAgZWxzZSBpZiAob3B0aW9ucy5heGlzID09PSBudWxsKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUuYXhpcyA9IHNjb3BlLmRlZmF1bHRzLmFjdGlvbnMucmVzaXplLmF4aXNcbiAgICB9XG5cbiAgICBpZiAoaXMuYm9vbChvcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW8pKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUucHJlc2VydmVBc3BlY3RSYXRpbyA9IG9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpb1xuICAgIH1cbiAgICBlbHNlIGlmIChpcy5ib29sKG9wdGlvbnMuc3F1YXJlKSkge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplLnNxdWFyZSA9IG9wdGlvbnMuc3F1YXJlXG4gICAgfVxuXG4gICAgcmV0dXJuIGludGVyYWN0YWJsZVxuICB9XG4gIGlmIChpcy5ib29sKG9wdGlvbnMpKSB7XG4gICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplLmVuYWJsZWQgPSBvcHRpb25zXG5cbiAgICByZXR1cm4gaW50ZXJhY3RhYmxlXG4gIH1cbiAgcmV0dXJuIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZVxufVxuXG5mdW5jdGlvbiBjaGVja1Jlc2l6ZUVkZ2UgKG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgcGFnZTogSW50ZXJhY3QuUG9pbnQsIGVsZW1lbnQ6IE5vZGUsIGludGVyYWN0YWJsZUVsZW1lbnQ6IEVsZW1lbnQsIHJlY3Q6IEludGVyYWN0LlJlY3QsIG1hcmdpbjogbnVtYmVyKSB7XG4gIC8vIGZhbHNlLCAnJywgdW5kZWZpbmVkLCBudWxsXG4gIGlmICghdmFsdWUpIHsgcmV0dXJuIGZhbHNlIH1cblxuICAvLyB0cnVlIHZhbHVlLCB1c2UgcG9pbnRlciBjb29yZHMgYW5kIGVsZW1lbnQgcmVjdFxuICBpZiAodmFsdWUgPT09IHRydWUpIHtcbiAgICAvLyBpZiBkaW1lbnNpb25zIGFyZSBuZWdhdGl2ZSwgXCJzd2l0Y2hcIiBlZGdlc1xuICAgIGNvbnN0IHdpZHRoICA9IGlzLm51bWJlcihyZWN0LndpZHRoKSA/IHJlY3Qud2lkdGggIDogcmVjdC5yaWdodCAgLSByZWN0LmxlZnRcbiAgICBjb25zdCBoZWlnaHQgPSBpcy5udW1iZXIocmVjdC5oZWlnaHQpID8gcmVjdC5oZWlnaHQgOiByZWN0LmJvdHRvbSAtIHJlY3QudG9wXG5cbiAgICAvLyBkb24ndCB1c2UgbWFyZ2luIGdyZWF0ZXIgdGhhbiBoYWxmIHRoZSByZWxldmVudCBkaW1lbnNpb25cbiAgICBtYXJnaW4gPSBNYXRoLm1pbihtYXJnaW4sIChuYW1lID09PSAnbGVmdCcgfHwgbmFtZSA9PT0gJ3JpZ2h0JyA/IHdpZHRoIDogaGVpZ2h0KSAvIDIpXG5cbiAgICBpZiAod2lkdGggPCAwKSB7XG4gICAgICBpZiAgICAgIChuYW1lID09PSAnbGVmdCcpICB7IG5hbWUgPSAncmlnaHQnIH1cbiAgICAgIGVsc2UgaWYgKG5hbWUgPT09ICdyaWdodCcpIHsgbmFtZSA9ICdsZWZ0JyAgfVxuICAgIH1cbiAgICBpZiAoaGVpZ2h0IDwgMCkge1xuICAgICAgaWYgICAgICAobmFtZSA9PT0gJ3RvcCcpICAgIHsgbmFtZSA9ICdib3R0b20nIH1cbiAgICAgIGVsc2UgaWYgKG5hbWUgPT09ICdib3R0b20nKSB7IG5hbWUgPSAndG9wJyAgICB9XG4gICAgfVxuXG4gICAgaWYgKG5hbWUgPT09ICdsZWZ0JykgeyByZXR1cm4gcGFnZS54IDwgKCh3aWR0aCAgPj0gMCA/IHJlY3QubGVmdCA6IHJlY3QucmlnaHQpICsgbWFyZ2luKSB9XG4gICAgaWYgKG5hbWUgPT09ICd0b3AnKSB7IHJldHVybiBwYWdlLnkgPCAoKGhlaWdodCA+PSAwID8gcmVjdC50b3AgOiByZWN0LmJvdHRvbSkgKyBtYXJnaW4pIH1cblxuICAgIGlmIChuYW1lID09PSAncmlnaHQnKSB7IHJldHVybiBwYWdlLnggPiAoKHdpZHRoICA+PSAwID8gcmVjdC5yaWdodCA6IHJlY3QubGVmdCkgLSBtYXJnaW4pIH1cbiAgICBpZiAobmFtZSA9PT0gJ2JvdHRvbScpIHsgcmV0dXJuIHBhZ2UueSA+ICgoaGVpZ2h0ID49IDAgPyByZWN0LmJvdHRvbSA6IHJlY3QudG9wKSAtIG1hcmdpbikgfVxuICB9XG5cbiAgLy8gdGhlIHJlbWFpbmluZyBjaGVja3MgcmVxdWlyZSBhbiBlbGVtZW50XG4gIGlmICghaXMuZWxlbWVudChlbGVtZW50KSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIHJldHVybiBpcy5lbGVtZW50KHZhbHVlKVxuICAvLyB0aGUgdmFsdWUgaXMgYW4gZWxlbWVudCB0byB1c2UgYXMgYSByZXNpemUgaGFuZGxlXG4gICAgPyB2YWx1ZSA9PT0gZWxlbWVudFxuICAgIC8vIG90aGVyd2lzZSBjaGVjayBpZiBlbGVtZW50IG1hdGNoZXMgdmFsdWUgYXMgc2VsZWN0b3JcbiAgICA6IGRvbS5tYXRjaGVzVXBUbyhlbGVtZW50LCB2YWx1ZSwgaW50ZXJhY3RhYmxlRWxlbWVudClcbn1cblxuZnVuY3Rpb24gaW5pdEN1cnNvcnMgKGJyb3dzZXI6IHR5cGVvZiBpbXBvcnQgKCdAaW50ZXJhY3Rqcy91dGlscy9icm93c2VyJykuZGVmYXVsdCkge1xuICByZXR1cm4gKGJyb3dzZXIuaXNJZTkgPyB7XG4gICAgeCA6ICdlLXJlc2l6ZScsXG4gICAgeSA6ICdzLXJlc2l6ZScsXG4gICAgeHk6ICdzZS1yZXNpemUnLFxuXG4gICAgdG9wICAgICAgICA6ICduLXJlc2l6ZScsXG4gICAgbGVmdCAgICAgICA6ICd3LXJlc2l6ZScsXG4gICAgYm90dG9tICAgICA6ICdzLXJlc2l6ZScsXG4gICAgcmlnaHQgICAgICA6ICdlLXJlc2l6ZScsXG4gICAgdG9wbGVmdCAgICA6ICdzZS1yZXNpemUnLFxuICAgIGJvdHRvbXJpZ2h0OiAnc2UtcmVzaXplJyxcbiAgICB0b3ByaWdodCAgIDogJ25lLXJlc2l6ZScsXG4gICAgYm90dG9tbGVmdCA6ICduZS1yZXNpemUnLFxuICB9IDoge1xuICAgIHggOiAnZXctcmVzaXplJyxcbiAgICB5IDogJ25zLXJlc2l6ZScsXG4gICAgeHk6ICdud3NlLXJlc2l6ZScsXG5cbiAgICB0b3AgICAgICAgIDogJ25zLXJlc2l6ZScsXG4gICAgbGVmdCAgICAgICA6ICdldy1yZXNpemUnLFxuICAgIGJvdHRvbSAgICAgOiAnbnMtcmVzaXplJyxcbiAgICByaWdodCAgICAgIDogJ2V3LXJlc2l6ZScsXG4gICAgdG9wbGVmdCAgICA6ICdud3NlLXJlc2l6ZScsXG4gICAgYm90dG9tcmlnaHQ6ICdud3NlLXJlc2l6ZScsXG4gICAgdG9wcmlnaHQgICA6ICduZXN3LXJlc2l6ZScsXG4gICAgYm90dG9tbGVmdCA6ICduZXN3LXJlc2l6ZScsXG4gIH0pXG59XG5cbmZ1bmN0aW9uIHN0YXJ0ICh7IGlFdmVudCwgaW50ZXJhY3Rpb24gfTogSW50ZXJhY3QuU2lnbmFsQXJnKSB7XG4gIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAncmVzaXplJyB8fCAhaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXMpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGNvbnN0IHN0YXJ0UmVjdCA9IGludGVyYWN0aW9uLnJlY3RcbiAgY29uc3QgcmVzaXplT3B0aW9ucyA9IGludGVyYWN0aW9uLmludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZVxuXG4gIC8qXG4gICAqIFdoZW4gdXNpbmcgdGhlIGByZXNpemFibGUuc3F1YXJlYCBvciBgcmVzaXphYmxlLnByZXNlcnZlQXNwZWN0UmF0aW9gIG9wdGlvbnMsIHJlc2l6aW5nIGZyb20gb25lIGVkZ2VcbiAgICogd2lsbCBhZmZlY3QgYW5vdGhlci4gRS5nLiB3aXRoIGByZXNpemFibGUuc3F1YXJlYCwgcmVzaXppbmcgdG8gbWFrZSB0aGUgcmlnaHQgZWRnZSBsYXJnZXIgd2lsbCBtYWtlXG4gICAqIHRoZSBib3R0b20gZWRnZSBsYXJnZXIgYnkgdGhlIHNhbWUgYW1vdW50LiBXZSBjYWxsIHRoZXNlICdsaW5rZWQnIGVkZ2VzLiBBbnkgbGlua2VkIGVkZ2VzIHdpbGwgZGVwZW5kXG4gICAqIG9uIHRoZSBhY3RpdmUgZWRnZXMgYW5kIHRoZSBlZGdlIGJlaW5nIGludGVyYWN0ZWQgd2l0aC5cbiAgICovXG4gIGlmIChyZXNpemVPcHRpb25zLnNxdWFyZSB8fCByZXNpemVPcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW8pIHtcbiAgICBjb25zdCBsaW5rZWRFZGdlcyA9IGV4dGVuZCh7fSwgaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXMpXG5cbiAgICBsaW5rZWRFZGdlcy50b3AgICAgPSBsaW5rZWRFZGdlcy50b3AgICAgfHwgKGxpbmtlZEVkZ2VzLmxlZnQgICAmJiAhbGlua2VkRWRnZXMuYm90dG9tKVxuICAgIGxpbmtlZEVkZ2VzLmxlZnQgICA9IGxpbmtlZEVkZ2VzLmxlZnQgICB8fCAobGlua2VkRWRnZXMudG9wICAgICYmICFsaW5rZWRFZGdlcy5yaWdodClcbiAgICBsaW5rZWRFZGdlcy5ib3R0b20gPSBsaW5rZWRFZGdlcy5ib3R0b20gfHwgKGxpbmtlZEVkZ2VzLnJpZ2h0ICAmJiAhbGlua2VkRWRnZXMudG9wKVxuICAgIGxpbmtlZEVkZ2VzLnJpZ2h0ICA9IGxpbmtlZEVkZ2VzLnJpZ2h0ICB8fCAobGlua2VkRWRnZXMuYm90dG9tICYmICFsaW5rZWRFZGdlcy5sZWZ0KVxuXG4gICAgaW50ZXJhY3Rpb24ucHJlcGFyZWQuX2xpbmtlZEVkZ2VzID0gbGlua2VkRWRnZXNcbiAgfVxuICBlbHNlIHtcbiAgICBpbnRlcmFjdGlvbi5wcmVwYXJlZC5fbGlua2VkRWRnZXMgPSBudWxsXG4gIH1cblxuICAvLyBpZiB1c2luZyBgcmVzaXphYmxlLnByZXNlcnZlQXNwZWN0UmF0aW9gIG9wdGlvbiwgcmVjb3JkIGFzcGVjdCByYXRpbyBhdCB0aGUgc3RhcnQgb2YgdGhlIHJlc2l6ZVxuICBpZiAocmVzaXplT3B0aW9ucy5wcmVzZXJ2ZUFzcGVjdFJhdGlvKSB7XG4gICAgaW50ZXJhY3Rpb24ucmVzaXplU3RhcnRBc3BlY3RSYXRpbyA9IHN0YXJ0UmVjdC53aWR0aCAvIHN0YXJ0UmVjdC5oZWlnaHRcbiAgfVxuXG4gIGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzID0ge1xuICAgIHN0YXJ0ICAgICA6IHN0YXJ0UmVjdCxcbiAgICBjdXJyZW50ICAgOiBleHRlbmQoe30sIHN0YXJ0UmVjdCksXG4gICAgaW52ZXJ0ZWQgIDogZXh0ZW5kKHt9LCBzdGFydFJlY3QpLFxuICAgIHByZXZpb3VzICA6IGV4dGVuZCh7fSwgc3RhcnRSZWN0KSxcbiAgICBkZWx0YSAgICAgOiB7XG4gICAgICBsZWZ0OiAwLFxuICAgICAgcmlnaHQgOiAwLFxuICAgICAgd2lkdGggOiAwLFxuICAgICAgdG9wIDogMCxcbiAgICAgIGJvdHRvbTogMCxcbiAgICAgIGhlaWdodDogMCxcbiAgICB9LFxuICB9XG5cbiAgaUV2ZW50LnJlY3QgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5pbnZlcnRlZFxuICA7KGlFdmVudCBhcyBSZXNpemVFdmVudCkuZGVsdGFSZWN0ID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuZGVsdGFcbn1cblxuZnVuY3Rpb24gbW92ZSAoeyBpRXZlbnQsIGludGVyYWN0aW9uIH0pIHtcbiAgaWYgKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgIT09ICdyZXNpemUnIHx8ICFpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlcykgeyByZXR1cm4gfVxuXG4gIGNvbnN0IHJlc2l6ZU9wdGlvbnMgPSBpbnRlcmFjdGlvbi5pbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemVcbiAgY29uc3QgaW52ZXJ0ID0gcmVzaXplT3B0aW9ucy5pbnZlcnRcbiAgY29uc3QgaW52ZXJ0aWJsZSA9IGludmVydCA9PT0gJ3JlcG9zaXRpb24nIHx8IGludmVydCA9PT0gJ25lZ2F0ZSdcblxuICBsZXQgZWRnZXMgPSBpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlc1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcbiAgY29uc3Qgc3RhcnQgICAgICA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLnN0YXJ0XG4gIGNvbnN0IGN1cnJlbnQgICAgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5jdXJyZW50XG4gIGNvbnN0IGludmVydGVkICAgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5pbnZlcnRlZFxuICBjb25zdCBkZWx0YVJlY3QgID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuZGVsdGFcbiAgY29uc3QgcHJldmlvdXMgICA9IGV4dGVuZChpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5wcmV2aW91cywgaW52ZXJ0ZWQpXG4gIGNvbnN0IG9yaWdpbmFsRWRnZXMgPSBlZGdlc1xuXG4gIGNvbnN0IGV2ZW50RGVsdGEgPSBleHRlbmQoe30sIGlFdmVudC5kZWx0YSlcblxuICBpZiAocmVzaXplT3B0aW9ucy5wcmVzZXJ2ZUFzcGVjdFJhdGlvIHx8IHJlc2l6ZU9wdGlvbnMuc3F1YXJlKSB7XG4gICAgLy8gYHJlc2l6ZS5wcmVzZXJ2ZUFzcGVjdFJhdGlvYCB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgYHJlc2l6ZS5zcXVhcmVgXG4gICAgY29uc3Qgc3RhcnRBc3BlY3RSYXRpbyA9IHJlc2l6ZU9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpb1xuICAgICAgPyBpbnRlcmFjdGlvbi5yZXNpemVTdGFydEFzcGVjdFJhdGlvXG4gICAgICA6IDFcblxuICAgIGVkZ2VzID0gaW50ZXJhY3Rpb24ucHJlcGFyZWQuX2xpbmtlZEVkZ2VzXG5cbiAgICBpZiAoKG9yaWdpbmFsRWRnZXMubGVmdCAmJiBvcmlnaW5hbEVkZ2VzLmJvdHRvbSkgfHxcbiAgICAgICAgKG9yaWdpbmFsRWRnZXMucmlnaHQgJiYgb3JpZ2luYWxFZGdlcy50b3ApKSB7XG4gICAgICBldmVudERlbHRhLnkgPSAtZXZlbnREZWx0YS54IC8gc3RhcnRBc3BlY3RSYXRpb1xuICAgIH1cbiAgICBlbHNlIGlmIChvcmlnaW5hbEVkZ2VzLmxlZnQgfHwgb3JpZ2luYWxFZGdlcy5yaWdodCkgeyBldmVudERlbHRhLnkgPSBldmVudERlbHRhLnggLyBzdGFydEFzcGVjdFJhdGlvIH1cbiAgICBlbHNlIGlmIChvcmlnaW5hbEVkZ2VzLnRvcCAgfHwgb3JpZ2luYWxFZGdlcy5ib3R0b20pIHsgZXZlbnREZWx0YS54ID0gZXZlbnREZWx0YS55ICogc3RhcnRBc3BlY3RSYXRpbyB9XG4gIH1cblxuICAvLyB1cGRhdGUgdGhlICdjdXJyZW50JyByZWN0IHdpdGhvdXQgbW9kaWZpY2F0aW9uc1xuICBpZiAoZWRnZXMudG9wKSB7IGN1cnJlbnQudG9wICAgICs9IGV2ZW50RGVsdGEueSB9XG4gIGlmIChlZGdlcy5ib3R0b20pIHsgY3VycmVudC5ib3R0b20gKz0gZXZlbnREZWx0YS55IH1cbiAgaWYgKGVkZ2VzLmxlZnQpIHsgY3VycmVudC5sZWZ0ICAgKz0gZXZlbnREZWx0YS54IH1cbiAgaWYgKGVkZ2VzLnJpZ2h0KSB7IGN1cnJlbnQucmlnaHQgICs9IGV2ZW50RGVsdGEueCB9XG5cbiAgaWYgKGludmVydGlibGUpIHtcbiAgICAvLyBpZiBpbnZlcnRpYmxlLCBjb3B5IHRoZSBjdXJyZW50IHJlY3RcbiAgICBleHRlbmQoaW52ZXJ0ZWQsIGN1cnJlbnQpXG5cbiAgICBpZiAoaW52ZXJ0ID09PSAncmVwb3NpdGlvbicpIHtcbiAgICAgIC8vIHN3YXAgZWRnZSB2YWx1ZXMgaWYgbmVjZXNzYXJ5IHRvIGtlZXAgd2lkdGgvaGVpZ2h0IHBvc2l0aXZlXG4gICAgICBsZXQgc3dhcFxuXG4gICAgICBpZiAoaW52ZXJ0ZWQudG9wID4gaW52ZXJ0ZWQuYm90dG9tKSB7XG4gICAgICAgIHN3YXAgPSBpbnZlcnRlZC50b3BcblxuICAgICAgICBpbnZlcnRlZC50b3AgPSBpbnZlcnRlZC5ib3R0b21cbiAgICAgICAgaW52ZXJ0ZWQuYm90dG9tID0gc3dhcFxuICAgICAgfVxuICAgICAgaWYgKGludmVydGVkLmxlZnQgPiBpbnZlcnRlZC5yaWdodCkge1xuICAgICAgICBzd2FwID0gaW52ZXJ0ZWQubGVmdFxuXG4gICAgICAgIGludmVydGVkLmxlZnQgPSBpbnZlcnRlZC5yaWdodFxuICAgICAgICBpbnZlcnRlZC5yaWdodCA9IHN3YXBcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gaWYgbm90IGludmVydGlibGUsIHJlc3RyaWN0IHRvIG1pbmltdW0gb2YgMHgwIHJlY3RcbiAgICBpbnZlcnRlZC50b3AgICAgPSBNYXRoLm1pbihjdXJyZW50LnRvcCwgc3RhcnQuYm90dG9tKVxuICAgIGludmVydGVkLmJvdHRvbSA9IE1hdGgubWF4KGN1cnJlbnQuYm90dG9tLCBzdGFydC50b3ApXG4gICAgaW52ZXJ0ZWQubGVmdCAgID0gTWF0aC5taW4oY3VycmVudC5sZWZ0LCBzdGFydC5yaWdodClcbiAgICBpbnZlcnRlZC5yaWdodCAgPSBNYXRoLm1heChjdXJyZW50LnJpZ2h0LCBzdGFydC5sZWZ0KVxuICB9XG5cbiAgaW52ZXJ0ZWQud2lkdGggID0gaW52ZXJ0ZWQucmlnaHQgIC0gaW52ZXJ0ZWQubGVmdFxuICBpbnZlcnRlZC5oZWlnaHQgPSBpbnZlcnRlZC5ib3R0b20gLSBpbnZlcnRlZC50b3BcblxuICBmb3IgKGNvbnN0IGVkZ2UgaW4gaW52ZXJ0ZWQpIHtcbiAgICBkZWx0YVJlY3RbZWRnZV0gPSBpbnZlcnRlZFtlZGdlXSAtIHByZXZpb3VzW2VkZ2VdXG4gIH1cblxuICBpRXZlbnQuZWRnZXMgPSBpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlc1xuICBpRXZlbnQucmVjdCA9IGludmVydGVkXG4gIGlFdmVudC5kZWx0YVJlY3QgPSBkZWx0YVJlY3Rcbn1cblxuZnVuY3Rpb24gdXBkYXRlRXZlbnRBeGVzICh7IGludGVyYWN0aW9uLCBpRXZlbnQsIGFjdGlvbiB9KSB7XG4gIGlmIChhY3Rpb24gIT09ICdyZXNpemUnIHx8ICFpbnRlcmFjdGlvbi5yZXNpemVBeGVzKSB7IHJldHVybiB9XG5cbiAgY29uc3Qgb3B0aW9ucyA9IGludGVyYWN0aW9uLmludGVyYWN0YWJsZS5vcHRpb25zXG5cbiAgaWYgKG9wdGlvbnMucmVzaXplLnNxdWFyZSkge1xuICAgIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneScpIHtcbiAgICAgIGlFdmVudC5kZWx0YS54ID0gaUV2ZW50LmRlbHRhLnlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBpRXZlbnQuZGVsdGEueSA9IGlFdmVudC5kZWx0YS54XG4gICAgfVxuICAgIGlFdmVudC5heGVzID0gJ3h5J1xuICB9XG4gIGVsc2Uge1xuICAgIGlFdmVudC5heGVzID0gaW50ZXJhY3Rpb24ucmVzaXplQXhlc1xuXG4gICAgaWYgKGludGVyYWN0aW9uLnJlc2l6ZUF4ZXMgPT09ICd4Jykge1xuICAgICAgaUV2ZW50LmRlbHRhLnkgPSAwXG4gICAgfVxuICAgIGVsc2UgaWYgKGludGVyYWN0aW9uLnJlc2l6ZUF4ZXMgPT09ICd5Jykge1xuICAgICAgaUV2ZW50LmRlbHRhLnggPSAwXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHJlc2l6ZVxuIl19