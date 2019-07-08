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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmVzaXplLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxVQUFVLEVBQVMsTUFBTSx3QkFBd0IsQ0FBQTtBQUMxRCxPQUFPLEtBQUssR0FBRyxNQUFNLHVCQUF1QixDQUFBO0FBQzVDLE9BQU8sS0FBSyxHQUFHLE1BQU0sNEJBQTRCLENBQUE7QUFDakQsT0FBTyxNQUFNLE1BQU0sMEJBQTBCLENBQUE7QUFDN0MsT0FBTyxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQStDekMsVUFBa0IsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFBO0FBTXJDLFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsTUFBTSxFQUNKLE9BQU8sRUFDUCxPQUFPO0lBQ1AsMEJBQTBCO0lBQzFCLFlBQVksRUFBRSwyQ0FBMkM7SUFDekQsWUFBWSxFQUNaLFFBQVEsR0FDVCxHQUFHLEtBQUssQ0FBQTtJQUVULGtDQUFrQztJQUVsQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRTtRQUM3QyxXQUFXLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQTtJQUMvQixDQUFDLENBQUMsQ0FBQTtJQUVGLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUM5QyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFFNUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQyxDQUFBO0lBQ3hELFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxlQUFlLENBQUMsQ0FBQTtJQUV2RCxNQUFNLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUNyQyxNQUFNLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxhQUFhLElBQUksT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtJQUV0Rjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0E0Q0c7SUFDSCxZQUFZLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUF1QyxPQUE0QztRQUNwSCxPQUFPLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQ3hDLENBQW9CLENBQUE7SUFFcEIsT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUE7SUFDbkMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ3JDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtRQUM1QixhQUFhO1FBQ2IsWUFBWTtRQUNaLG9CQUFvQjtRQUNwQixjQUFjO1FBQ2QsV0FBVztLQUNaLENBQUMsQ0FBQTtJQUNGLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQTtJQUV2QyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFBO0FBQzNDLENBQUM7QUFFRCxNQUFNLE1BQU0sR0FBRztJQUNiLEVBQUUsRUFBRSxnQkFBZ0I7SUFDcEIsT0FBTztJQUNQLFFBQVEsRUFBRTtRQUNSLE1BQU0sRUFBRSxLQUFLO1FBQ2IsbUJBQW1CLEVBQUUsS0FBSztRQUMxQixJQUFJLEVBQUUsSUFBSTtRQUVWLHFCQUFxQjtRQUNyQixNQUFNLEVBQUUsR0FBRztRQUVYLHVEQUF1RDtRQUN2RCxrRUFBa0U7UUFDbEUsd0RBQXdEO1FBQ3hELGtDQUFrQztRQUNsQyxLQUFLLEVBQUUsSUFBSTtRQUVYLG1FQUFtRTtRQUNuRSw0REFBNEQ7UUFDNUQsK0RBQStEO1FBQy9ELG9FQUFvRTtRQUNwRSxNQUFNLEVBQUUsTUFBTTtLQUNjO0lBRTlCLE9BQU8sQ0FDTCxRQUE4QixFQUM5QixNQUFpQyxFQUNqQyxZQUFtQyxFQUNuQyxPQUFnQixFQUNoQixXQUF3QixFQUN4QixJQUFtQjtRQUVuQixJQUFJLENBQUMsSUFBSSxFQUFFO1lBQUUsT0FBTyxJQUFJLENBQUE7U0FBRTtRQUUxQixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3BELE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUE7UUFFcEMsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRTtZQUMxQixNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFBO1lBQ3BDLE1BQU0sV0FBVyxHQUFnQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQTtZQUV6Ryx3QkFBd0I7WUFDeEIsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDbEMsS0FBSyxNQUFNLElBQUksSUFBSSxXQUFXLEVBQUU7b0JBQzlCLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxlQUFlLENBQUMsSUFBSSxFQUN0QyxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUN6QixJQUFJLEVBQ0osV0FBVyxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQ3RDLE9BQU8sRUFDUCxJQUFJLEVBQ0osYUFBYSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7aUJBQzlDO2dCQUVELFdBQVcsQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUE7Z0JBQ3pELFdBQVcsQ0FBQyxHQUFHLEdBQUksV0FBVyxDQUFDLEdBQUcsSUFBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUE7Z0JBRTFELElBQUksV0FBVyxDQUFDLElBQUksSUFBSSxXQUFXLENBQUMsS0FBSyxJQUFJLFdBQVcsQ0FBQyxHQUFHLElBQUksV0FBVyxDQUFDLE1BQU0sRUFBRTtvQkFDbEYsT0FBTzt3QkFDTCxJQUFJLEVBQUUsUUFBUTt3QkFDZCxLQUFLLEVBQUUsV0FBVztxQkFDbkIsQ0FBQTtpQkFDRjthQUNGO2lCQUNJO2dCQUNILE1BQU0sS0FBSyxHQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBSSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7Z0JBQ3pGLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7Z0JBRXpGLElBQUksS0FBSyxJQUFJLE1BQU0sRUFBRTtvQkFDbkIsT0FBTzt3QkFDTCxJQUFJLEVBQUUsUUFBUTt3QkFDZCxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3FCQUMvQyxDQUFBO2lCQUNGO2FBQ0Y7U0FDRjtRQUVELE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVELE9BQU8sRUFBRSxJQUFpRDtJQUUxRCxTQUFTLENBQUUsTUFBbUI7UUFDNUIsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQW9DLENBQUE7UUFDM0QsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFO1lBQ2YsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDMUM7YUFDSSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUU7WUFDckIsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFBO1lBQ2xCLE1BQU0sU0FBUyxHQUFHLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUE7WUFFcEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDMUIsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUM5QixTQUFTLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFBO2lCQUMxQjthQUNGO1lBRUQsT0FBTyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7U0FDMUI7UUFFRCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxhQUFhLEVBQUUsSUFBeUI7Q0FDekMsQ0FBQTtBQUVELFNBQVMsU0FBUyxDQUFFLFlBQW1DLEVBQUUsT0FBZ0UsRUFBRSxLQUFZO0lBQ3JJLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUN0QixZQUFZLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sS0FBSyxLQUFLLENBQUE7UUFDL0QsWUFBWSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDNUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFFM0MsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNoRSxZQUFZLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQTtTQUNoRDthQUNJLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7WUFDOUIsWUFBWSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUE7U0FDdEU7UUFFRCxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLEVBQUU7WUFDeEMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsbUJBQW1CLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFBO1NBQzlFO2FBQ0ksSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUNoQyxZQUFZLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQTtTQUNwRDtRQUVELE9BQU8sWUFBWSxDQUFBO0tBQ3BCO0lBQ0QsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ3BCLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7UUFFN0MsT0FBTyxZQUFZLENBQUE7S0FDcEI7SUFDRCxPQUFPLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO0FBQ3BDLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBRSxJQUFZLEVBQUUsS0FBVSxFQUFFLElBQW9CLEVBQUUsT0FBYSxFQUFFLG1CQUE0QixFQUFFLElBQW1CLEVBQUUsTUFBYztJQUN4Siw2QkFBNkI7SUFDN0IsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUFFLE9BQU8sS0FBSyxDQUFBO0tBQUU7SUFFNUIsa0RBQWtEO0lBQ2xELElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtRQUNsQiw2Q0FBNkM7UUFDN0MsTUFBTSxLQUFLLEdBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUksSUFBSSxDQUFDLElBQUksQ0FBQTtRQUM1RSxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFBO1FBRTVFLDREQUE0RDtRQUM1RCxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFFckYsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFO1lBQ2IsSUFBUyxJQUFJLEtBQUssTUFBTSxFQUFHO2dCQUFFLElBQUksR0FBRyxPQUFPLENBQUE7YUFBRTtpQkFDeEMsSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFO2dCQUFFLElBQUksR0FBRyxNQUFNLENBQUE7YUFBRztTQUM5QztRQUNELElBQUksTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNkLElBQVMsSUFBSSxLQUFLLEtBQUssRUFBSztnQkFBRSxJQUFJLEdBQUcsUUFBUSxDQUFBO2FBQUU7aUJBQzFDLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTtnQkFBRSxJQUFJLEdBQUcsS0FBSyxDQUFBO2FBQUs7U0FDaEQ7UUFFRCxJQUFJLElBQUksS0FBSyxNQUFNLEVBQUU7WUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssSUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQTtTQUFFO1FBQzFGLElBQUksSUFBSSxLQUFLLEtBQUssRUFBRTtZQUFFLE9BQU8sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFBO1NBQUU7UUFFekYsSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFO1lBQUUsT0FBTyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLElBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUE7U0FBRTtRQUMzRixJQUFJLElBQUksS0FBSyxRQUFRLEVBQUU7WUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQTtTQUFFO0tBQzdGO0lBRUQsMENBQTBDO0lBQzFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQUUsT0FBTyxLQUFLLENBQUE7S0FBRTtJQUUxQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ3hCLG9EQUFvRDtRQUNsRCxDQUFDLENBQUMsS0FBSyxLQUFLLE9BQU87UUFDbkIsdURBQXVEO1FBQ3ZELENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsbUJBQW1CLENBQUMsQ0FBQTtBQUMxRCxDQUFDO0FBRUQsU0FBUyxXQUFXLENBQUUsT0FBNEQ7SUFDaEYsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLENBQUMsRUFBRyxVQUFVO1FBQ2QsQ0FBQyxFQUFHLFVBQVU7UUFDZCxFQUFFLEVBQUUsV0FBVztRQUVmLEdBQUcsRUFBVSxVQUFVO1FBQ3ZCLElBQUksRUFBUyxVQUFVO1FBQ3ZCLE1BQU0sRUFBTyxVQUFVO1FBQ3ZCLEtBQUssRUFBUSxVQUFVO1FBQ3ZCLE9BQU8sRUFBTSxXQUFXO1FBQ3hCLFdBQVcsRUFBRSxXQUFXO1FBQ3hCLFFBQVEsRUFBSyxXQUFXO1FBQ3hCLFVBQVUsRUFBRyxXQUFXO0tBQ3pCLENBQUMsQ0FBQyxDQUFDO1FBQ0YsQ0FBQyxFQUFHLFdBQVc7UUFDZixDQUFDLEVBQUcsV0FBVztRQUNmLEVBQUUsRUFBRSxhQUFhO1FBRWpCLEdBQUcsRUFBVSxXQUFXO1FBQ3hCLElBQUksRUFBUyxXQUFXO1FBQ3hCLE1BQU0sRUFBTyxXQUFXO1FBQ3hCLEtBQUssRUFBUSxXQUFXO1FBQ3hCLE9BQU8sRUFBTSxhQUFhO1FBQzFCLFdBQVcsRUFBRSxhQUFhO1FBQzFCLFFBQVEsRUFBSyxhQUFhO1FBQzFCLFVBQVUsRUFBRyxhQUFhO0tBQzNCLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFFRCxTQUFTLEtBQUssQ0FBRSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQXNCO0lBQ3pELElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUU7UUFDekUsT0FBTTtLQUNQO0lBRUQsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQTtJQUNsQyxNQUFNLGFBQWEsR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFFN0Q7Ozs7O09BS0c7SUFDSCxJQUFJLGFBQWEsQ0FBQyxNQUFNLElBQUksYUFBYSxDQUFDLG1CQUFtQixFQUFFO1FBQzdELE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEVBQUUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUUxRCxXQUFXLENBQUMsR0FBRyxHQUFNLFdBQVcsQ0FBQyxHQUFHLElBQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxJQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3RGLFdBQVcsQ0FBQyxJQUFJLEdBQUssV0FBVyxDQUFDLElBQUksSUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDckYsV0FBVyxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssSUFBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNuRixXQUFXLENBQUMsS0FBSyxHQUFJLFdBQVcsQ0FBQyxLQUFLLElBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRXBGLFdBQVcsQ0FBQyxRQUFRLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQTtLQUNoRDtTQUNJO1FBQ0gsV0FBVyxDQUFDLFFBQVEsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFBO0tBQ3pDO0lBRUQsa0dBQWtHO0lBQ2xHLElBQUksYUFBYSxDQUFDLG1CQUFtQixFQUFFO1FBQ3JDLFdBQVcsQ0FBQyxzQkFBc0IsR0FBRyxTQUFTLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUE7S0FDeEU7SUFFRCxXQUFXLENBQUMsV0FBVyxHQUFHO1FBQ3hCLEtBQUssRUFBTyxTQUFTO1FBQ3JCLE9BQU8sRUFBSyxNQUFNLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQztRQUNqQyxRQUFRLEVBQUksTUFBTSxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUM7UUFDakMsUUFBUSxFQUFJLE1BQU0sQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDO1FBQ2pDLEtBQUssRUFBTztZQUNWLElBQUksRUFBRSxDQUFDO1lBQ1AsS0FBSyxFQUFHLENBQUM7WUFDVCxLQUFLLEVBQUcsQ0FBQztZQUNULEdBQUcsRUFBRyxDQUFDO1lBQ1AsTUFBTSxFQUFFLENBQUM7WUFDVCxNQUFNLEVBQUUsQ0FBQztTQUNWO0tBQ0YsQ0FBQTtJQUVELE1BQU0sQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQzdDO0lBQUUsTUFBc0IsQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUE7QUFDckUsQ0FBQztBQUVELFNBQVMsSUFBSSxDQUFFLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRTtJQUNwQyxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLFFBQVEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFO1FBQUUsT0FBTTtLQUFFO0lBRXJGLE1BQU0sYUFBYSxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQTtJQUM3RCxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFBO0lBQ25DLE1BQU0sVUFBVSxHQUFHLE1BQU0sS0FBSyxZQUFZLElBQUksTUFBTSxLQUFLLFFBQVEsQ0FBQTtJQUVqRSxJQUFJLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQTtJQUV0QyxxQ0FBcUM7SUFDckMsTUFBTSxLQUFLLEdBQVEsV0FBVyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUE7SUFDaEQsTUFBTSxPQUFPLEdBQU0sV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUE7SUFDbEQsTUFBTSxRQUFRLEdBQUssV0FBVyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUE7SUFDbkQsTUFBTSxTQUFTLEdBQUksV0FBVyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUE7SUFDaEQsTUFBTSxRQUFRLEdBQUssTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ3JFLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQTtJQUUzQixNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUUzQyxJQUFJLGFBQWEsQ0FBQyxtQkFBbUIsSUFBSSxhQUFhLENBQUMsTUFBTSxFQUFFO1FBQzdELHFFQUFxRTtRQUNyRSxNQUFNLGdCQUFnQixHQUFHLGFBQWEsQ0FBQyxtQkFBbUI7WUFDeEQsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxzQkFBc0I7WUFDcEMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUVMLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQTtRQUV6QyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksSUFBSSxhQUFhLENBQUMsTUFBTSxDQUFDO1lBQzVDLENBQUMsYUFBYSxDQUFDLEtBQUssSUFBSSxhQUFhLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDOUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsZ0JBQWdCLENBQUE7U0FDaEQ7YUFDSSxJQUFJLGFBQWEsQ0FBQyxJQUFJLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRTtZQUFFLFVBQVUsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQTtTQUFFO2FBQ2pHLElBQUksYUFBYSxDQUFDLEdBQUcsSUFBSyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQUUsVUFBVSxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxHQUFHLGdCQUFnQixDQUFBO1NBQUU7S0FDeEc7SUFFRCxrREFBa0Q7SUFDbEQsSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFFO1FBQUUsT0FBTyxDQUFDLEdBQUcsSUFBTyxVQUFVLENBQUMsQ0FBQyxDQUFBO0tBQUU7SUFDakQsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFO1FBQUUsT0FBTyxDQUFDLE1BQU0sSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFBO0tBQUU7SUFDcEQsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFO1FBQUUsT0FBTyxDQUFDLElBQUksSUFBTSxVQUFVLENBQUMsQ0FBQyxDQUFBO0tBQUU7SUFDbEQsSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFO1FBQUUsT0FBTyxDQUFDLEtBQUssSUFBSyxVQUFVLENBQUMsQ0FBQyxDQUFBO0tBQUU7SUFFbkQsSUFBSSxVQUFVLEVBQUU7UUFDZCx1Q0FBdUM7UUFDdkMsTUFBTSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUV6QixJQUFJLE1BQU0sS0FBSyxZQUFZLEVBQUU7WUFDM0IsOERBQThEO1lBQzlELElBQUksSUFBSSxDQUFBO1lBRVIsSUFBSSxRQUFRLENBQUMsR0FBRyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUU7Z0JBQ2xDLElBQUksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFBO2dCQUVuQixRQUFRLENBQUMsR0FBRyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUE7Z0JBQzlCLFFBQVEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFBO2FBQ3ZCO1lBQ0QsSUFBSSxRQUFRLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUU7Z0JBQ2xDLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFBO2dCQUVwQixRQUFRLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUE7Z0JBQzlCLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFBO2FBQ3RCO1NBQ0Y7S0FDRjtTQUNJO1FBQ0gscURBQXFEO1FBQ3JELFFBQVEsQ0FBQyxHQUFHLEdBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUNyRCxRQUFRLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDckQsUUFBUSxDQUFDLElBQUksR0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3JELFFBQVEsQ0FBQyxLQUFLLEdBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtLQUN0RDtJQUVELFFBQVEsQ0FBQyxLQUFLLEdBQUksUUFBUSxDQUFDLEtBQUssR0FBSSxRQUFRLENBQUMsSUFBSSxDQUFBO0lBQ2pELFFBQVEsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFBO0lBRWhELEtBQUssTUFBTSxJQUFJLElBQUksUUFBUSxFQUFFO1FBQzNCLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQ2xEO0lBRUQsTUFBTSxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQTtJQUN6QyxNQUFNLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQTtJQUN0QixNQUFNLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtBQUM5QixDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUUsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRTtJQUN2RCxJQUFJLE1BQU0sS0FBSyxRQUFRLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFO1FBQUUsT0FBTTtLQUFFO0lBRTlELE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFBO0lBRWhELElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7UUFDekIsSUFBSSxXQUFXLENBQUMsVUFBVSxLQUFLLEdBQUcsRUFBRTtZQUNsQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQTtTQUNoQzthQUNJO1lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7U0FDaEM7UUFDRCxNQUFNLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtLQUNuQjtTQUNJO1FBQ0gsTUFBTSxDQUFDLElBQUksR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFBO1FBRXBDLElBQUksV0FBVyxDQUFDLFVBQVUsS0FBSyxHQUFHLEVBQUU7WUFDbEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ25CO2FBQ0ksSUFBSSxXQUFXLENBQUMsVUFBVSxLQUFLLEdBQUcsRUFBRTtZQUN2QyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7U0FDbkI7S0FDRjtBQUNILENBQUM7QUFFRCxlQUFlLE1BQU0sQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFjdGlvblByb3BzLCBJbnRlcmFjdGlvbiB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3Rpb24nXG5pbXBvcnQgeyBBY3Rpb25OYW1lLCBTY29wZSB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnXG5pbXBvcnQgKiBhcyBhcnIgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvYXJyJ1xuaW1wb3J0ICogYXMgZG9tIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2RvbVV0aWxzJ1xuaW1wb3J0IGV4dGVuZCBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9leHRlbmQnXG5pbXBvcnQgKiBhcyBpcyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9pcydcblxuZXhwb3J0IHR5cGUgRWRnZU5hbWUgPSAndG9wJyB8ICdsZWZ0JyB8ICdib3R0b20nIHwgJ3JpZ2h0J1xuXG5leHBvcnQgdHlwZSBSZXNpemFibGVNZXRob2QgPSBJbnRlcmFjdC5BY3Rpb25NZXRob2Q8SW50ZXJhY3QuUmVzaXphYmxlT3B0aW9ucz5cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3RhYmxlJyB7XG4gIGludGVyZmFjZSBJbnRlcmFjdGFibGUge1xuICAgIHJlc2l6YWJsZTogUmVzaXphYmxlTWV0aG9kXG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3Rpb24nIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0aW9uIHtcbiAgICByZXNpemVBeGVzOiAneCcgfCAneScgfCAneHknXG4gICAgcmVzaXplUmVjdHM6IHtcbiAgICAgIHN0YXJ0OiBJbnRlcmFjdC5GdWxsUmVjdFxuICAgICAgY3VycmVudDogSW50ZXJhY3QuUmVjdFxuICAgICAgaW52ZXJ0ZWQ6IEludGVyYWN0LkZ1bGxSZWN0XG4gICAgICBwcmV2aW91czogSW50ZXJhY3QuRnVsbFJlY3RcbiAgICAgIGRlbHRhOiBJbnRlcmFjdC5GdWxsUmVjdFxuICAgIH1cbiAgICByZXNpemVTdGFydEFzcGVjdFJhdGlvOiBudW1iZXJcbiAgfVxuXG4gIGludGVyZmFjZSBBY3Rpb25Qcm9wcyB7XG4gICAgX2xpbmtlZEVkZ2VzPzogeyBba2V5OiBzdHJpbmddOiBib29sZWFuIH1cbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9kZWZhdWx0T3B0aW9ucycge1xuICBpbnRlcmZhY2UgQWN0aW9uRGVmYXVsdHMge1xuICAgIHJlc2l6ZTogSW50ZXJhY3QuUmVzaXphYmxlT3B0aW9uc1xuICB9XG59XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJyB7XG4gIGludGVyZmFjZSBBY3Rpb25zIHtcbiAgICBbQWN0aW9uTmFtZS5SZXNpemVdPzogdHlwZW9mIHJlc2l6ZVxuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNoYWRvd1xuICBlbnVtIEFjdGlvbk5hbWUge1xuICAgIFJlc2l6ZSA9ICdyZXNpemUnXG4gIH1cbn1cblxuKEFjdGlvbk5hbWUgYXMgYW55KS5SZXNpemUgPSAncmVzaXplJ1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlc2l6ZUV2ZW50IGV4dGVuZHMgSW50ZXJhY3QuSW50ZXJhY3RFdmVudDxBY3Rpb25OYW1lLlJlc2l6ZT4ge1xuICBkZWx0YVJlY3Q/OiBJbnRlcmFjdC5GdWxsUmVjdFxufVxuXG5mdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qge1xuICAgIGFjdGlvbnMsXG4gICAgYnJvd3NlcixcbiAgICAvKiogQGxlbmRzIEludGVyYWN0YWJsZSAqL1xuICAgIEludGVyYWN0YWJsZSwgLy8gdHNsaW50OmRpc2FibGUtbGluZSBuby1zaGFkb3dlZC12YXJpYWJsZVxuICAgIGludGVyYWN0aW9ucyxcbiAgICBkZWZhdWx0cyxcbiAgfSA9IHNjb3BlXG5cbiAgLy8gTGVzcyBQcmVjaXNpb24gd2l0aCB0b3VjaCBpbnB1dFxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCduZXcnLCAoaW50ZXJhY3Rpb24pID0+IHtcbiAgICBpbnRlcmFjdGlvbi5yZXNpemVBeGVzID0gJ3h5J1xuICB9KVxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tc3RhcnQnLCBzdGFydClcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FjdGlvbi1tb3ZlJywgbW92ZSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLXN0YXJ0JywgdXBkYXRlRXZlbnRBeGVzKVxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLW1vdmUnLCB1cGRhdGVFdmVudEF4ZXMpXG5cbiAgcmVzaXplLmN1cnNvcnMgPSBpbml0Q3Vyc29ycyhicm93c2VyKVxuICByZXNpemUuZGVmYXVsdE1hcmdpbiA9IGJyb3dzZXIuc3VwcG9ydHNUb3VjaCB8fCBicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50ID8gMjAgOiAxMFxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdChlbGVtZW50KS5yZXNpemFibGUoe1xuICAgKiAgIG9uc3RhcnQ6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAqICAgb25tb3ZlIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICogICBvbmVuZCAgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgKlxuICAgKiAgIGVkZ2VzOiB7XG4gICAqICAgICB0b3AgICA6IHRydWUsICAgICAgIC8vIFVzZSBwb2ludGVyIGNvb3JkcyB0byBjaGVjayBmb3IgcmVzaXplLlxuICAgKiAgICAgbGVmdCAgOiBmYWxzZSwgICAgICAvLyBEaXNhYmxlIHJlc2l6aW5nIGZyb20gbGVmdCBlZGdlLlxuICAgKiAgICAgYm90dG9tOiAnLnJlc2l6ZS1zJywvLyBSZXNpemUgaWYgcG9pbnRlciB0YXJnZXQgbWF0Y2hlcyBzZWxlY3RvclxuICAgKiAgICAgcmlnaHQgOiBoYW5kbGVFbCAgICAvLyBSZXNpemUgaWYgcG9pbnRlciB0YXJnZXQgaXMgdGhlIGdpdmVuIEVsZW1lbnRcbiAgICogICB9LFxuICAgKlxuICAgKiAgICAgLy8gV2lkdGggYW5kIGhlaWdodCBjYW4gYmUgYWRqdXN0ZWQgaW5kZXBlbmRlbnRseS4gV2hlbiBgdHJ1ZWAsIHdpZHRoIGFuZFxuICAgKiAgICAgLy8gaGVpZ2h0IGFyZSBhZGp1c3RlZCBhdCBhIDE6MSByYXRpby5cbiAgICogICAgIHNxdWFyZTogZmFsc2UsXG4gICAqXG4gICAqICAgICAvLyBXaWR0aCBhbmQgaGVpZ2h0IGNhbiBiZSBhZGp1c3RlZCBpbmRlcGVuZGVudGx5LiBXaGVuIGB0cnVlYCwgd2lkdGggYW5kXG4gICAqICAgICAvLyBoZWlnaHQgbWFpbnRhaW4gdGhlIGFzcGVjdCByYXRpbyB0aGV5IGhhZCB3aGVuIHJlc2l6aW5nIHN0YXJ0ZWQuXG4gICAqICAgICBwcmVzZXJ2ZUFzcGVjdFJhdGlvOiBmYWxzZSxcbiAgICpcbiAgICogICAvLyBhIHZhbHVlIG9mICdub25lJyB3aWxsIGxpbWl0IHRoZSByZXNpemUgcmVjdCB0byBhIG1pbmltdW0gb2YgMHgwXG4gICAqICAgLy8gJ25lZ2F0ZScgd2lsbCBhbGxvdyB0aGUgcmVjdCB0byBoYXZlIG5lZ2F0aXZlIHdpZHRoL2hlaWdodFxuICAgKiAgIC8vICdyZXBvc2l0aW9uJyB3aWxsIGtlZXAgdGhlIHdpZHRoL2hlaWdodCBwb3NpdGl2ZSBieSBzd2FwcGluZ1xuICAgKiAgIC8vIHRoZSB0b3AgYW5kIGJvdHRvbSBlZGdlcyBhbmQvb3Igc3dhcHBpbmcgdGhlIGxlZnQgYW5kIHJpZ2h0IGVkZ2VzXG4gICAqICAgaW52ZXJ0OiAnbm9uZScgfHwgJ25lZ2F0ZScgfHwgJ3JlcG9zaXRpb24nXG4gICAqXG4gICAqICAgLy8gbGltaXQgbXVsdGlwbGUgcmVzaXplcy5cbiAgICogICAvLyBTZWUgdGhlIGV4cGxhbmF0aW9uIGluIHRoZSB7QGxpbmsgSW50ZXJhY3RhYmxlLmRyYWdnYWJsZX0gZXhhbXBsZVxuICAgKiAgIG1heDogSW5maW5pdHksXG4gICAqICAgbWF4UGVyRWxlbWVudDogMSxcbiAgICogfSlcbiAgICpcbiAgICogdmFyIGlzUmVzaXplYWJsZSA9IGludGVyYWN0KGVsZW1lbnQpLnJlc2l6YWJsZSgpXG4gICAqIGBgYFxuICAgKlxuICAgKiBHZXRzIG9yIHNldHMgd2hldGhlciByZXNpemUgYWN0aW9ucyBjYW4gYmUgcGVyZm9ybWVkIG9uIHRoZSB0YXJnZXRcbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFuIHwgb2JqZWN0fSBbb3B0aW9uc10gdHJ1ZS9mYWxzZSBvciBBbiBvYmplY3Qgd2l0aCBldmVudFxuICAgKiBsaXN0ZW5lcnMgdG8gYmUgZmlyZWQgb24gcmVzaXplIGV2ZW50cyAob2JqZWN0IG1ha2VzIHRoZSBJbnRlcmFjdGFibGVcbiAgICogcmVzaXphYmxlKVxuICAgKiBAcmV0dXJuIHtib29sZWFuIHwgSW50ZXJhY3RhYmxlfSBBIGJvb2xlYW4gaW5kaWNhdGluZyBpZiB0aGlzIGNhbiBiZSB0aGVcbiAgICogdGFyZ2V0IG9mIHJlc2l6ZSBlbGVtZW50cywgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUucmVzaXphYmxlID0gZnVuY3Rpb24gKHRoaXM6IEludGVyYWN0LkludGVyYWN0YWJsZSwgb3B0aW9uczogSW50ZXJhY3QuUmVzaXphYmxlT3B0aW9ucyB8IGJvb2xlYW4pIHtcbiAgICByZXR1cm4gcmVzaXphYmxlKHRoaXMsIG9wdGlvbnMsIHNjb3BlKVxuICB9IGFzIFJlc2l6YWJsZU1ldGhvZFxuXG4gIGFjdGlvbnNbQWN0aW9uTmFtZS5SZXNpemVdID0gcmVzaXplXG4gIGFjdGlvbnMubmFtZXMucHVzaChBY3Rpb25OYW1lLlJlc2l6ZSlcbiAgYXJyLm1lcmdlKGFjdGlvbnMuZXZlbnRUeXBlcywgW1xuICAgICdyZXNpemVzdGFydCcsXG4gICAgJ3Jlc2l6ZW1vdmUnLFxuICAgICdyZXNpemVpbmVydGlhc3RhcnQnLFxuICAgICdyZXNpemVyZXN1bWUnLFxuICAgICdyZXNpemVlbmQnLFxuICBdKVxuICBhY3Rpb25zLm1ldGhvZERpY3QucmVzaXplID0gJ3Jlc2l6YWJsZSdcblxuICBkZWZhdWx0cy5hY3Rpb25zLnJlc2l6ZSA9IHJlc2l6ZS5kZWZhdWx0c1xufVxuXG5jb25zdCByZXNpemUgPSB7XG4gIGlkOiAnYWN0aW9ucy9yZXNpemUnLFxuICBpbnN0YWxsLFxuICBkZWZhdWx0czoge1xuICAgIHNxdWFyZTogZmFsc2UsXG4gICAgcHJlc2VydmVBc3BlY3RSYXRpbzogZmFsc2UsXG4gICAgYXhpczogJ3h5JyxcblxuICAgIC8vIHVzZSBkZWZhdWx0IG1hcmdpblxuICAgIG1hcmdpbjogTmFOLFxuXG4gICAgLy8gb2JqZWN0IHdpdGggcHJvcHMgbGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tIHdoaWNoIGFyZVxuICAgIC8vIHRydWUvZmFsc2UgdmFsdWVzIHRvIHJlc2l6ZSB3aGVuIHRoZSBwb2ludGVyIGlzIG92ZXIgdGhhdCBlZGdlLFxuICAgIC8vIENTUyBzZWxlY3RvcnMgdG8gbWF0Y2ggdGhlIGhhbmRsZXMgZm9yIGVhY2ggZGlyZWN0aW9uXG4gICAgLy8gb3IgdGhlIEVsZW1lbnRzIGZvciBlYWNoIGhhbmRsZVxuICAgIGVkZ2VzOiBudWxsLFxuXG4gICAgLy8gYSB2YWx1ZSBvZiAnbm9uZScgd2lsbCBsaW1pdCB0aGUgcmVzaXplIHJlY3QgdG8gYSBtaW5pbXVtIG9mIDB4MFxuICAgIC8vICduZWdhdGUnIHdpbGwgYWxvdyB0aGUgcmVjdCB0byBoYXZlIG5lZ2F0aXZlIHdpZHRoL2hlaWdodFxuICAgIC8vICdyZXBvc2l0aW9uJyB3aWxsIGtlZXAgdGhlIHdpZHRoL2hlaWdodCBwb3NpdGl2ZSBieSBzd2FwcGluZ1xuICAgIC8vIHRoZSB0b3AgYW5kIGJvdHRvbSBlZGdlcyBhbmQvb3Igc3dhcHBpbmcgdGhlIGxlZnQgYW5kIHJpZ2h0IGVkZ2VzXG4gICAgaW52ZXJ0OiAnbm9uZScsXG4gIH0gYXMgSW50ZXJhY3QuUmVzaXphYmxlT3B0aW9ucyxcblxuICBjaGVja2VyIChcbiAgICBfcG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsXG4gICAgX2V2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLFxuICAgIGludGVyYWN0YWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLFxuICAgIGVsZW1lbnQ6IEVsZW1lbnQsXG4gICAgaW50ZXJhY3Rpb246IEludGVyYWN0aW9uLFxuICAgIHJlY3Q6IEludGVyYWN0LlJlY3RcbiAgKSB7XG4gICAgaWYgKCFyZWN0KSB7IHJldHVybiBudWxsIH1cblxuICAgIGNvbnN0IHBhZ2UgPSBleHRlbmQoe30sIGludGVyYWN0aW9uLmNvb3Jkcy5jdXIucGFnZSlcbiAgICBjb25zdCBvcHRpb25zID0gaW50ZXJhY3RhYmxlLm9wdGlvbnNcblxuICAgIGlmIChvcHRpb25zLnJlc2l6ZS5lbmFibGVkKSB7XG4gICAgICBjb25zdCByZXNpemVPcHRpb25zID0gb3B0aW9ucy5yZXNpemVcbiAgICAgIGNvbnN0IHJlc2l6ZUVkZ2VzOiB7IFtlZGdlOiBzdHJpbmddOiBib29sZWFuIH0gPSB7IGxlZnQ6IGZhbHNlLCByaWdodDogZmFsc2UsIHRvcDogZmFsc2UsIGJvdHRvbTogZmFsc2UgfVxuXG4gICAgICAvLyBpZiB1c2luZyByZXNpemUuZWRnZXNcbiAgICAgIGlmIChpcy5vYmplY3QocmVzaXplT3B0aW9ucy5lZGdlcykpIHtcbiAgICAgICAgZm9yIChjb25zdCBlZGdlIGluIHJlc2l6ZUVkZ2VzKSB7XG4gICAgICAgICAgcmVzaXplRWRnZXNbZWRnZV0gPSBjaGVja1Jlc2l6ZUVkZ2UoZWRnZSxcbiAgICAgICAgICAgIHJlc2l6ZU9wdGlvbnMuZWRnZXNbZWRnZV0sXG4gICAgICAgICAgICBwYWdlLFxuICAgICAgICAgICAgaW50ZXJhY3Rpb24uX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQsXG4gICAgICAgICAgICBlbGVtZW50LFxuICAgICAgICAgICAgcmVjdCxcbiAgICAgICAgICAgIHJlc2l6ZU9wdGlvbnMubWFyZ2luIHx8IHRoaXMuZGVmYXVsdE1hcmdpbilcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc2l6ZUVkZ2VzLmxlZnQgPSByZXNpemVFZGdlcy5sZWZ0ICYmICFyZXNpemVFZGdlcy5yaWdodFxuICAgICAgICByZXNpemVFZGdlcy50b3AgID0gcmVzaXplRWRnZXMudG9wICAmJiAhcmVzaXplRWRnZXMuYm90dG9tXG5cbiAgICAgICAgaWYgKHJlc2l6ZUVkZ2VzLmxlZnQgfHwgcmVzaXplRWRnZXMucmlnaHQgfHwgcmVzaXplRWRnZXMudG9wIHx8IHJlc2l6ZUVkZ2VzLmJvdHRvbSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiAncmVzaXplJyxcbiAgICAgICAgICAgIGVkZ2VzOiByZXNpemVFZGdlcyxcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb25zdCByaWdodCAgPSBvcHRpb25zLnJlc2l6ZS5heGlzICE9PSAneScgJiYgcGFnZS54ID4gKHJlY3QucmlnaHQgIC0gdGhpcy5kZWZhdWx0TWFyZ2luKVxuICAgICAgICBjb25zdCBib3R0b20gPSBvcHRpb25zLnJlc2l6ZS5heGlzICE9PSAneCcgJiYgcGFnZS55ID4gKHJlY3QuYm90dG9tIC0gdGhpcy5kZWZhdWx0TWFyZ2luKVxuXG4gICAgICAgIGlmIChyaWdodCB8fCBib3R0b20pIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogJ3Jlc2l6ZScsXG4gICAgICAgICAgICBheGVzOiAocmlnaHQgPyAneCcgOiAnJykgKyAoYm90dG9tID8gJ3knIDogJycpLFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsXG4gIH0sXG5cbiAgY3Vyc29yczogbnVsbCBhcyB1bmtub3duIGFzIFJldHVyblR5cGU8dHlwZW9mIGluaXRDdXJzb3JzPixcblxuICBnZXRDdXJzb3IgKGFjdGlvbjogQWN0aW9uUHJvcHMpIHtcbiAgICBjb25zdCBjdXJzb3JzID0gcmVzaXplLmN1cnNvcnMgYXMgeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfVxuICAgIGlmIChhY3Rpb24uYXhpcykge1xuICAgICAgcmV0dXJuIGN1cnNvcnNbYWN0aW9uLm5hbWUgKyBhY3Rpb24uYXhpc11cbiAgICB9XG4gICAgZWxzZSBpZiAoYWN0aW9uLmVkZ2VzKSB7XG4gICAgICBsZXQgY3Vyc29yS2V5ID0gJydcbiAgICAgIGNvbnN0IGVkZ2VOYW1lcyA9IFsndG9wJywgJ2JvdHRvbScsICdsZWZ0JywgJ3JpZ2h0J11cblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgaWYgKGFjdGlvbi5lZGdlc1tlZGdlTmFtZXNbaV1dKSB7XG4gICAgICAgICAgY3Vyc29yS2V5ICs9IGVkZ2VOYW1lc1tpXVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjdXJzb3JzW2N1cnNvcktleV1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbFxuICB9LFxuXG4gIGRlZmF1bHRNYXJnaW46IG51bGwgYXMgdW5rbm93biBhcyBudW1iZXIsXG59XG5cbmZ1bmN0aW9uIHJlc2l6YWJsZSAoaW50ZXJhY3RhYmxlOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsIG9wdGlvbnM6IEludGVyYWN0Lk9yQm9vbGVhbjxJbnRlcmFjdC5SZXNpemFibGVPcHRpb25zPiB8IGJvb2xlYW4sIHNjb3BlOiBTY29wZSkge1xuICBpZiAoaXMub2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplLmVuYWJsZWQgPSBvcHRpb25zLmVuYWJsZWQgIT09IGZhbHNlXG4gICAgaW50ZXJhY3RhYmxlLnNldFBlckFjdGlvbigncmVzaXplJywgb3B0aW9ucylcbiAgICBpbnRlcmFjdGFibGUuc2V0T25FdmVudHMoJ3Jlc2l6ZScsIG9wdGlvbnMpXG5cbiAgICBpZiAoaXMuc3RyaW5nKG9wdGlvbnMuYXhpcykgJiYgL154JHxeeSR8Xnh5JC8udGVzdChvcHRpb25zLmF4aXMpKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUuYXhpcyA9IG9wdGlvbnMuYXhpc1xuICAgIH1cbiAgICBlbHNlIGlmIChvcHRpb25zLmF4aXMgPT09IG51bGwpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5heGlzID0gc2NvcGUuZGVmYXVsdHMuYWN0aW9ucy5yZXNpemUuYXhpc1xuICAgIH1cblxuICAgIGlmIChpcy5ib29sKG9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpbykpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5wcmVzZXJ2ZUFzcGVjdFJhdGlvID0gb3B0aW9ucy5wcmVzZXJ2ZUFzcGVjdFJhdGlvXG4gICAgfVxuICAgIGVsc2UgaWYgKGlzLmJvb2wob3B0aW9ucy5zcXVhcmUpKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUuc3F1YXJlID0gb3B0aW9ucy5zcXVhcmVcbiAgICB9XG5cbiAgICByZXR1cm4gaW50ZXJhY3RhYmxlXG4gIH1cbiAgaWYgKGlzLmJvb2wob3B0aW9ucykpIHtcbiAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUuZW5hYmxlZCA9IG9wdGlvbnNcblxuICAgIHJldHVybiBpbnRlcmFjdGFibGVcbiAgfVxuICByZXR1cm4gaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplXG59XG5cbmZ1bmN0aW9uIGNoZWNrUmVzaXplRWRnZSAobmFtZTogc3RyaW5nLCB2YWx1ZTogYW55LCBwYWdlOiBJbnRlcmFjdC5Qb2ludCwgZWxlbWVudDogTm9kZSwgaW50ZXJhY3RhYmxlRWxlbWVudDogRWxlbWVudCwgcmVjdDogSW50ZXJhY3QuUmVjdCwgbWFyZ2luOiBudW1iZXIpIHtcbiAgLy8gZmFsc2UsICcnLCB1bmRlZmluZWQsIG51bGxcbiAgaWYgKCF2YWx1ZSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIC8vIHRydWUgdmFsdWUsIHVzZSBwb2ludGVyIGNvb3JkcyBhbmQgZWxlbWVudCByZWN0XG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSkge1xuICAgIC8vIGlmIGRpbWVuc2lvbnMgYXJlIG5lZ2F0aXZlLCBcInN3aXRjaFwiIGVkZ2VzXG4gICAgY29uc3Qgd2lkdGggID0gaXMubnVtYmVyKHJlY3Qud2lkdGgpID8gcmVjdC53aWR0aCAgOiByZWN0LnJpZ2h0ICAtIHJlY3QubGVmdFxuICAgIGNvbnN0IGhlaWdodCA9IGlzLm51bWJlcihyZWN0LmhlaWdodCkgPyByZWN0LmhlaWdodCA6IHJlY3QuYm90dG9tIC0gcmVjdC50b3BcblxuICAgIC8vIGRvbid0IHVzZSBtYXJnaW4gZ3JlYXRlciB0aGFuIGhhbGYgdGhlIHJlbGV2ZW50IGRpbWVuc2lvblxuICAgIG1hcmdpbiA9IE1hdGgubWluKG1hcmdpbiwgKG5hbWUgPT09ICdsZWZ0JyB8fCBuYW1lID09PSAncmlnaHQnID8gd2lkdGggOiBoZWlnaHQpIC8gMilcblxuICAgIGlmICh3aWR0aCA8IDApIHtcbiAgICAgIGlmICAgICAgKG5hbWUgPT09ICdsZWZ0JykgIHsgbmFtZSA9ICdyaWdodCcgfVxuICAgICAgZWxzZSBpZiAobmFtZSA9PT0gJ3JpZ2h0JykgeyBuYW1lID0gJ2xlZnQnICB9XG4gICAgfVxuICAgIGlmIChoZWlnaHQgPCAwKSB7XG4gICAgICBpZiAgICAgIChuYW1lID09PSAndG9wJykgICAgeyBuYW1lID0gJ2JvdHRvbScgfVxuICAgICAgZWxzZSBpZiAobmFtZSA9PT0gJ2JvdHRvbScpIHsgbmFtZSA9ICd0b3AnICAgIH1cbiAgICB9XG5cbiAgICBpZiAobmFtZSA9PT0gJ2xlZnQnKSB7IHJldHVybiBwYWdlLnggPCAoKHdpZHRoICA+PSAwID8gcmVjdC5sZWZ0IDogcmVjdC5yaWdodCkgKyBtYXJnaW4pIH1cbiAgICBpZiAobmFtZSA9PT0gJ3RvcCcpIHsgcmV0dXJuIHBhZ2UueSA8ICgoaGVpZ2h0ID49IDAgPyByZWN0LnRvcCA6IHJlY3QuYm90dG9tKSArIG1hcmdpbikgfVxuXG4gICAgaWYgKG5hbWUgPT09ICdyaWdodCcpIHsgcmV0dXJuIHBhZ2UueCA+ICgod2lkdGggID49IDAgPyByZWN0LnJpZ2h0IDogcmVjdC5sZWZ0KSAtIG1hcmdpbikgfVxuICAgIGlmIChuYW1lID09PSAnYm90dG9tJykgeyByZXR1cm4gcGFnZS55ID4gKChoZWlnaHQgPj0gMCA/IHJlY3QuYm90dG9tIDogcmVjdC50b3ApIC0gbWFyZ2luKSB9XG4gIH1cblxuICAvLyB0aGUgcmVtYWluaW5nIGNoZWNrcyByZXF1aXJlIGFuIGVsZW1lbnRcbiAgaWYgKCFpcy5lbGVtZW50KGVsZW1lbnQpKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgcmV0dXJuIGlzLmVsZW1lbnQodmFsdWUpXG4gIC8vIHRoZSB2YWx1ZSBpcyBhbiBlbGVtZW50IHRvIHVzZSBhcyBhIHJlc2l6ZSBoYW5kbGVcbiAgICA/IHZhbHVlID09PSBlbGVtZW50XG4gICAgLy8gb3RoZXJ3aXNlIGNoZWNrIGlmIGVsZW1lbnQgbWF0Y2hlcyB2YWx1ZSBhcyBzZWxlY3RvclxuICAgIDogZG9tLm1hdGNoZXNVcFRvKGVsZW1lbnQsIHZhbHVlLCBpbnRlcmFjdGFibGVFbGVtZW50KVxufVxuXG5mdW5jdGlvbiBpbml0Q3Vyc29ycyAoYnJvd3NlcjogdHlwZW9mIGltcG9ydCAoJ0BpbnRlcmFjdGpzL3V0aWxzL2Jyb3dzZXInKS5kZWZhdWx0KSB7XG4gIHJldHVybiAoYnJvd3Nlci5pc0llOSA/IHtcbiAgICB4IDogJ2UtcmVzaXplJyxcbiAgICB5IDogJ3MtcmVzaXplJyxcbiAgICB4eTogJ3NlLXJlc2l6ZScsXG5cbiAgICB0b3AgICAgICAgIDogJ24tcmVzaXplJyxcbiAgICBsZWZ0ICAgICAgIDogJ3ctcmVzaXplJyxcbiAgICBib3R0b20gICAgIDogJ3MtcmVzaXplJyxcbiAgICByaWdodCAgICAgIDogJ2UtcmVzaXplJyxcbiAgICB0b3BsZWZ0ICAgIDogJ3NlLXJlc2l6ZScsXG4gICAgYm90dG9tcmlnaHQ6ICdzZS1yZXNpemUnLFxuICAgIHRvcHJpZ2h0ICAgOiAnbmUtcmVzaXplJyxcbiAgICBib3R0b21sZWZ0IDogJ25lLXJlc2l6ZScsXG4gIH0gOiB7XG4gICAgeCA6ICdldy1yZXNpemUnLFxuICAgIHkgOiAnbnMtcmVzaXplJyxcbiAgICB4eTogJ253c2UtcmVzaXplJyxcblxuICAgIHRvcCAgICAgICAgOiAnbnMtcmVzaXplJyxcbiAgICBsZWZ0ICAgICAgIDogJ2V3LXJlc2l6ZScsXG4gICAgYm90dG9tICAgICA6ICducy1yZXNpemUnLFxuICAgIHJpZ2h0ICAgICAgOiAnZXctcmVzaXplJyxcbiAgICB0b3BsZWZ0ICAgIDogJ253c2UtcmVzaXplJyxcbiAgICBib3R0b21yaWdodDogJ253c2UtcmVzaXplJyxcbiAgICB0b3ByaWdodCAgIDogJ25lc3ctcmVzaXplJyxcbiAgICBib3R0b21sZWZ0IDogJ25lc3ctcmVzaXplJyxcbiAgfSlcbn1cblxuZnVuY3Rpb24gc3RhcnQgKHsgaUV2ZW50LCBpbnRlcmFjdGlvbiB9OiBJbnRlcmFjdC5TaWduYWxBcmcpIHtcbiAgaWYgKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgIT09ICdyZXNpemUnIHx8ICFpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlcykge1xuICAgIHJldHVyblxuICB9XG5cbiAgY29uc3Qgc3RhcnRSZWN0ID0gaW50ZXJhY3Rpb24ucmVjdFxuICBjb25zdCByZXNpemVPcHRpb25zID0gaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplXG5cbiAgLypcbiAgICogV2hlbiB1c2luZyB0aGUgYHJlc2l6YWJsZS5zcXVhcmVgIG9yIGByZXNpemFibGUucHJlc2VydmVBc3BlY3RSYXRpb2Agb3B0aW9ucywgcmVzaXppbmcgZnJvbSBvbmUgZWRnZVxuICAgKiB3aWxsIGFmZmVjdCBhbm90aGVyLiBFLmcuIHdpdGggYHJlc2l6YWJsZS5zcXVhcmVgLCByZXNpemluZyB0byBtYWtlIHRoZSByaWdodCBlZGdlIGxhcmdlciB3aWxsIG1ha2VcbiAgICogdGhlIGJvdHRvbSBlZGdlIGxhcmdlciBieSB0aGUgc2FtZSBhbW91bnQuIFdlIGNhbGwgdGhlc2UgJ2xpbmtlZCcgZWRnZXMuIEFueSBsaW5rZWQgZWRnZXMgd2lsbCBkZXBlbmRcbiAgICogb24gdGhlIGFjdGl2ZSBlZGdlcyBhbmQgdGhlIGVkZ2UgYmVpbmcgaW50ZXJhY3RlZCB3aXRoLlxuICAgKi9cbiAgaWYgKHJlc2l6ZU9wdGlvbnMuc3F1YXJlIHx8IHJlc2l6ZU9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpbykge1xuICAgIGNvbnN0IGxpbmtlZEVkZ2VzID0gZXh0ZW5kKHt9LCBpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlcylcblxuICAgIGxpbmtlZEVkZ2VzLnRvcCAgICA9IGxpbmtlZEVkZ2VzLnRvcCAgICB8fCAobGlua2VkRWRnZXMubGVmdCAgICYmICFsaW5rZWRFZGdlcy5ib3R0b20pXG4gICAgbGlua2VkRWRnZXMubGVmdCAgID0gbGlua2VkRWRnZXMubGVmdCAgIHx8IChsaW5rZWRFZGdlcy50b3AgICAgJiYgIWxpbmtlZEVkZ2VzLnJpZ2h0KVxuICAgIGxpbmtlZEVkZ2VzLmJvdHRvbSA9IGxpbmtlZEVkZ2VzLmJvdHRvbSB8fCAobGlua2VkRWRnZXMucmlnaHQgICYmICFsaW5rZWRFZGdlcy50b3ApXG4gICAgbGlua2VkRWRnZXMucmlnaHQgID0gbGlua2VkRWRnZXMucmlnaHQgIHx8IChsaW5rZWRFZGdlcy5ib3R0b20gJiYgIWxpbmtlZEVkZ2VzLmxlZnQpXG5cbiAgICBpbnRlcmFjdGlvbi5wcmVwYXJlZC5fbGlua2VkRWRnZXMgPSBsaW5rZWRFZGdlc1xuICB9XG4gIGVsc2Uge1xuICAgIGludGVyYWN0aW9uLnByZXBhcmVkLl9saW5rZWRFZGdlcyA9IG51bGxcbiAgfVxuXG4gIC8vIGlmIHVzaW5nIGByZXNpemFibGUucHJlc2VydmVBc3BlY3RSYXRpb2Agb3B0aW9uLCByZWNvcmQgYXNwZWN0IHJhdGlvIGF0IHRoZSBzdGFydCBvZiB0aGUgcmVzaXplXG4gIGlmIChyZXNpemVPcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW8pIHtcbiAgICBpbnRlcmFjdGlvbi5yZXNpemVTdGFydEFzcGVjdFJhdGlvID0gc3RhcnRSZWN0LndpZHRoIC8gc3RhcnRSZWN0LmhlaWdodFxuICB9XG5cbiAgaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMgPSB7XG4gICAgc3RhcnQgICAgIDogc3RhcnRSZWN0LFxuICAgIGN1cnJlbnQgICA6IGV4dGVuZCh7fSwgc3RhcnRSZWN0KSxcbiAgICBpbnZlcnRlZCAgOiBleHRlbmQoe30sIHN0YXJ0UmVjdCksXG4gICAgcHJldmlvdXMgIDogZXh0ZW5kKHt9LCBzdGFydFJlY3QpLFxuICAgIGRlbHRhICAgICA6IHtcbiAgICAgIGxlZnQ6IDAsXG4gICAgICByaWdodCA6IDAsXG4gICAgICB3aWR0aCA6IDAsXG4gICAgICB0b3AgOiAwLFxuICAgICAgYm90dG9tOiAwLFxuICAgICAgaGVpZ2h0OiAwLFxuICAgIH0sXG4gIH1cblxuICBpRXZlbnQucmVjdCA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLmludmVydGVkXG4gIDsgKGlFdmVudCBhcyBSZXNpemVFdmVudCkuZGVsdGFSZWN0ID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuZGVsdGFcbn1cblxuZnVuY3Rpb24gbW92ZSAoeyBpRXZlbnQsIGludGVyYWN0aW9uIH0pIHtcbiAgaWYgKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgIT09ICdyZXNpemUnIHx8ICFpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlcykgeyByZXR1cm4gfVxuXG4gIGNvbnN0IHJlc2l6ZU9wdGlvbnMgPSBpbnRlcmFjdGlvbi5pbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemVcbiAgY29uc3QgaW52ZXJ0ID0gcmVzaXplT3B0aW9ucy5pbnZlcnRcbiAgY29uc3QgaW52ZXJ0aWJsZSA9IGludmVydCA9PT0gJ3JlcG9zaXRpb24nIHx8IGludmVydCA9PT0gJ25lZ2F0ZSdcblxuICBsZXQgZWRnZXMgPSBpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlc1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcbiAgY29uc3Qgc3RhcnQgICAgICA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLnN0YXJ0XG4gIGNvbnN0IGN1cnJlbnQgICAgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5jdXJyZW50XG4gIGNvbnN0IGludmVydGVkICAgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5pbnZlcnRlZFxuICBjb25zdCBkZWx0YVJlY3QgID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuZGVsdGFcbiAgY29uc3QgcHJldmlvdXMgICA9IGV4dGVuZChpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5wcmV2aW91cywgaW52ZXJ0ZWQpXG4gIGNvbnN0IG9yaWdpbmFsRWRnZXMgPSBlZGdlc1xuXG4gIGNvbnN0IGV2ZW50RGVsdGEgPSBleHRlbmQoe30sIGlFdmVudC5kZWx0YSlcblxuICBpZiAocmVzaXplT3B0aW9ucy5wcmVzZXJ2ZUFzcGVjdFJhdGlvIHx8IHJlc2l6ZU9wdGlvbnMuc3F1YXJlKSB7XG4gICAgLy8gYHJlc2l6ZS5wcmVzZXJ2ZUFzcGVjdFJhdGlvYCB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgYHJlc2l6ZS5zcXVhcmVgXG4gICAgY29uc3Qgc3RhcnRBc3BlY3RSYXRpbyA9IHJlc2l6ZU9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpb1xuICAgICAgPyBpbnRlcmFjdGlvbi5yZXNpemVTdGFydEFzcGVjdFJhdGlvXG4gICAgICA6IDFcblxuICAgIGVkZ2VzID0gaW50ZXJhY3Rpb24ucHJlcGFyZWQuX2xpbmtlZEVkZ2VzXG5cbiAgICBpZiAoKG9yaWdpbmFsRWRnZXMubGVmdCAmJiBvcmlnaW5hbEVkZ2VzLmJvdHRvbSkgfHxcbiAgICAgICAgKG9yaWdpbmFsRWRnZXMucmlnaHQgJiYgb3JpZ2luYWxFZGdlcy50b3ApKSB7XG4gICAgICBldmVudERlbHRhLnkgPSAtZXZlbnREZWx0YS54IC8gc3RhcnRBc3BlY3RSYXRpb1xuICAgIH1cbiAgICBlbHNlIGlmIChvcmlnaW5hbEVkZ2VzLmxlZnQgfHwgb3JpZ2luYWxFZGdlcy5yaWdodCkgeyBldmVudERlbHRhLnkgPSBldmVudERlbHRhLnggLyBzdGFydEFzcGVjdFJhdGlvIH1cbiAgICBlbHNlIGlmIChvcmlnaW5hbEVkZ2VzLnRvcCAgfHwgb3JpZ2luYWxFZGdlcy5ib3R0b20pIHsgZXZlbnREZWx0YS54ID0gZXZlbnREZWx0YS55ICogc3RhcnRBc3BlY3RSYXRpbyB9XG4gIH1cblxuICAvLyB1cGRhdGUgdGhlICdjdXJyZW50JyByZWN0IHdpdGhvdXQgbW9kaWZpY2F0aW9uc1xuICBpZiAoZWRnZXMudG9wKSB7IGN1cnJlbnQudG9wICAgICs9IGV2ZW50RGVsdGEueSB9XG4gIGlmIChlZGdlcy5ib3R0b20pIHsgY3VycmVudC5ib3R0b20gKz0gZXZlbnREZWx0YS55IH1cbiAgaWYgKGVkZ2VzLmxlZnQpIHsgY3VycmVudC5sZWZ0ICAgKz0gZXZlbnREZWx0YS54IH1cbiAgaWYgKGVkZ2VzLnJpZ2h0KSB7IGN1cnJlbnQucmlnaHQgICs9IGV2ZW50RGVsdGEueCB9XG5cbiAgaWYgKGludmVydGlibGUpIHtcbiAgICAvLyBpZiBpbnZlcnRpYmxlLCBjb3B5IHRoZSBjdXJyZW50IHJlY3RcbiAgICBleHRlbmQoaW52ZXJ0ZWQsIGN1cnJlbnQpXG5cbiAgICBpZiAoaW52ZXJ0ID09PSAncmVwb3NpdGlvbicpIHtcbiAgICAgIC8vIHN3YXAgZWRnZSB2YWx1ZXMgaWYgbmVjZXNzYXJ5IHRvIGtlZXAgd2lkdGgvaGVpZ2h0IHBvc2l0aXZlXG4gICAgICBsZXQgc3dhcFxuXG4gICAgICBpZiAoaW52ZXJ0ZWQudG9wID4gaW52ZXJ0ZWQuYm90dG9tKSB7XG4gICAgICAgIHN3YXAgPSBpbnZlcnRlZC50b3BcblxuICAgICAgICBpbnZlcnRlZC50b3AgPSBpbnZlcnRlZC5ib3R0b21cbiAgICAgICAgaW52ZXJ0ZWQuYm90dG9tID0gc3dhcFxuICAgICAgfVxuICAgICAgaWYgKGludmVydGVkLmxlZnQgPiBpbnZlcnRlZC5yaWdodCkge1xuICAgICAgICBzd2FwID0gaW52ZXJ0ZWQubGVmdFxuXG4gICAgICAgIGludmVydGVkLmxlZnQgPSBpbnZlcnRlZC5yaWdodFxuICAgICAgICBpbnZlcnRlZC5yaWdodCA9IHN3YXBcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gaWYgbm90IGludmVydGlibGUsIHJlc3RyaWN0IHRvIG1pbmltdW0gb2YgMHgwIHJlY3RcbiAgICBpbnZlcnRlZC50b3AgICAgPSBNYXRoLm1pbihjdXJyZW50LnRvcCwgc3RhcnQuYm90dG9tKVxuICAgIGludmVydGVkLmJvdHRvbSA9IE1hdGgubWF4KGN1cnJlbnQuYm90dG9tLCBzdGFydC50b3ApXG4gICAgaW52ZXJ0ZWQubGVmdCAgID0gTWF0aC5taW4oY3VycmVudC5sZWZ0LCBzdGFydC5yaWdodClcbiAgICBpbnZlcnRlZC5yaWdodCAgPSBNYXRoLm1heChjdXJyZW50LnJpZ2h0LCBzdGFydC5sZWZ0KVxuICB9XG5cbiAgaW52ZXJ0ZWQud2lkdGggID0gaW52ZXJ0ZWQucmlnaHQgIC0gaW52ZXJ0ZWQubGVmdFxuICBpbnZlcnRlZC5oZWlnaHQgPSBpbnZlcnRlZC5ib3R0b20gLSBpbnZlcnRlZC50b3BcblxuICBmb3IgKGNvbnN0IGVkZ2UgaW4gaW52ZXJ0ZWQpIHtcbiAgICBkZWx0YVJlY3RbZWRnZV0gPSBpbnZlcnRlZFtlZGdlXSAtIHByZXZpb3VzW2VkZ2VdXG4gIH1cblxuICBpRXZlbnQuZWRnZXMgPSBpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlc1xuICBpRXZlbnQucmVjdCA9IGludmVydGVkXG4gIGlFdmVudC5kZWx0YVJlY3QgPSBkZWx0YVJlY3Rcbn1cblxuZnVuY3Rpb24gdXBkYXRlRXZlbnRBeGVzICh7IGludGVyYWN0aW9uLCBpRXZlbnQsIGFjdGlvbiB9KSB7XG4gIGlmIChhY3Rpb24gIT09ICdyZXNpemUnIHx8ICFpbnRlcmFjdGlvbi5yZXNpemVBeGVzKSB7IHJldHVybiB9XG5cbiAgY29uc3Qgb3B0aW9ucyA9IGludGVyYWN0aW9uLmludGVyYWN0YWJsZS5vcHRpb25zXG5cbiAgaWYgKG9wdGlvbnMucmVzaXplLnNxdWFyZSkge1xuICAgIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneScpIHtcbiAgICAgIGlFdmVudC5kZWx0YS54ID0gaUV2ZW50LmRlbHRhLnlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBpRXZlbnQuZGVsdGEueSA9IGlFdmVudC5kZWx0YS54XG4gICAgfVxuICAgIGlFdmVudC5heGVzID0gJ3h5J1xuICB9XG4gIGVsc2Uge1xuICAgIGlFdmVudC5heGVzID0gaW50ZXJhY3Rpb24ucmVzaXplQXhlc1xuXG4gICAgaWYgKGludGVyYWN0aW9uLnJlc2l6ZUF4ZXMgPT09ICd4Jykge1xuICAgICAgaUV2ZW50LmRlbHRhLnkgPSAwXG4gICAgfVxuICAgIGVsc2UgaWYgKGludGVyYWN0aW9uLnJlc2l6ZUF4ZXMgPT09ICd5Jykge1xuICAgICAgaUV2ZW50LmRlbHRhLnggPSAwXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHJlc2l6ZVxuIl19