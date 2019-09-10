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
    interactions.signals.on('action-end', end);
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
    const startRect = extend({}, interaction.rect);
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
        current: {
            left: startRect.left,
            right: startRect.right,
            top: startRect.top,
            bottom: startRect.bottom,
        },
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
    iEvent.edges = interaction.prepared.edges;
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
function end({ iEvent, interaction }) {
    if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) {
        return;
    }
    iEvent.edges = interaction.prepared.edges;
    iEvent.rect = interaction.resizeRects.inverted;
    iEvent.deltaRect = interaction.resizeRects.delta;
}
function updateEventAxes({ iEvent, interaction, action }) {
    if (action !== ActionName.Resize || !interaction.resizeAxes) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmVzaXplLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxVQUFVLEVBQVMsTUFBTSx3QkFBd0IsQ0FBQTtBQUMxRCxPQUFPLEtBQUssR0FBRyxNQUFNLHVCQUF1QixDQUFBO0FBQzVDLE9BQU8sS0FBSyxHQUFHLE1BQU0sNEJBQTRCLENBQUE7QUFDakQsT0FBTyxNQUFNLE1BQU0sMEJBQTBCLENBQUE7QUFDN0MsT0FBTyxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQWdEekMsVUFBa0IsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFBO0FBT3JDLFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsTUFBTSxFQUNKLE9BQU8sRUFDUCxPQUFPO0lBQ1AsMEJBQTBCO0lBQzFCLFlBQVksRUFBRSwyQ0FBMkM7SUFDekQsWUFBWSxFQUNaLFFBQVEsR0FDVCxHQUFHLEtBQUssQ0FBQTtJQUVULGtDQUFrQztJQUVsQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLEVBQUU7UUFDM0MsV0FBVyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUE7SUFDL0IsQ0FBQyxDQUFDLENBQUE7SUFFRixZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDOUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQzVDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQTtJQUUxQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUE7SUFDeEQsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFBO0lBRXZELE1BQU0sQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3JDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWEsSUFBSSxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO0lBRXRGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQTRDRztJQUNILFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFVBQXVDLE9BQTRDO1FBQ3BILE9BQU8sU0FBUyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDeEMsQ0FBb0IsQ0FBQTtJQUVwQixPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQTtJQUNuQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDckMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO1FBQzVCLGFBQWE7UUFDYixZQUFZO1FBQ1osb0JBQW9CO1FBQ3BCLGNBQWM7UUFDZCxXQUFXO0tBQ1osQ0FBQyxDQUFBO0lBQ0YsT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFBO0lBRXZDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUE7QUFDM0MsQ0FBQztBQUVELE1BQU0sTUFBTSxHQUFHO0lBQ2IsRUFBRSxFQUFFLGdCQUFnQjtJQUNwQixPQUFPO0lBQ1AsUUFBUSxFQUFFO1FBQ1IsTUFBTSxFQUFFLEtBQUs7UUFDYixtQkFBbUIsRUFBRSxLQUFLO1FBQzFCLElBQUksRUFBRSxJQUFJO1FBRVYscUJBQXFCO1FBQ3JCLE1BQU0sRUFBRSxHQUFHO1FBRVgsdURBQXVEO1FBQ3ZELGtFQUFrRTtRQUNsRSx3REFBd0Q7UUFDeEQsa0NBQWtDO1FBQ2xDLEtBQUssRUFBRSxJQUFJO1FBRVgsbUVBQW1FO1FBQ25FLDREQUE0RDtRQUM1RCwrREFBK0Q7UUFDL0Qsb0VBQW9FO1FBQ3BFLE1BQU0sRUFBRSxNQUFNO0tBQ2M7SUFFOUIsT0FBTyxDQUNMLFFBQThCLEVBQzlCLE1BQWlDLEVBQ2pDLFlBQW1DLEVBQ25DLE9BQXlCLEVBQ3pCLFdBQXdCLEVBQ3hCLElBQW1CO1FBRW5CLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFBRSxPQUFPLElBQUksQ0FBQTtTQUFFO1FBRTFCLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxFQUFFLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDcEQsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQTtRQUVwQyxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1lBQzFCLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUE7WUFDcEMsTUFBTSxXQUFXLEdBQWdDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFBO1lBRXpHLHdCQUF3QjtZQUN4QixJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNsQyxLQUFLLE1BQU0sSUFBSSxJQUFJLFdBQVcsRUFBRTtvQkFDOUIsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLGVBQWUsQ0FBQyxJQUFJLEVBQ3RDLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQ3pCLElBQUksRUFDSixXQUFXLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFDdEMsT0FBTyxFQUNQLElBQUksRUFDSixhQUFhLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtpQkFDOUM7Z0JBRUQsV0FBVyxDQUFDLElBQUksR0FBRyxXQUFXLENBQUMsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQTtnQkFDekQsV0FBVyxDQUFDLEdBQUcsR0FBSSxXQUFXLENBQUMsR0FBRyxJQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQTtnQkFFMUQsSUFBSSxXQUFXLENBQUMsSUFBSSxJQUFJLFdBQVcsQ0FBQyxLQUFLLElBQUksV0FBVyxDQUFDLEdBQUcsSUFBSSxXQUFXLENBQUMsTUFBTSxFQUFFO29CQUNsRixPQUFPO3dCQUNMLElBQUksRUFBRSxRQUFRO3dCQUNkLEtBQUssRUFBRSxXQUFXO3FCQUNuQixDQUFBO2lCQUNGO2FBQ0Y7aUJBQ0k7Z0JBQ0gsTUFBTSxLQUFLLEdBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtnQkFDekYsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtnQkFFekYsSUFBSSxLQUFLLElBQUksTUFBTSxFQUFFO29CQUNuQixPQUFPO3dCQUNMLElBQUksRUFBRSxRQUFRO3dCQUNkLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7cUJBQy9DLENBQUE7aUJBQ0Y7YUFDRjtTQUNGO1FBRUQsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsT0FBTyxFQUFFLElBQXNDO0lBRS9DLFNBQVMsQ0FBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFlO1FBQzNDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUE7UUFDOUIsSUFBSSxNQUFNLEdBQVcsSUFBSSxDQUFBO1FBRXpCLElBQUksSUFBSSxFQUFFO1lBQ1IsTUFBTSxHQUFHLE9BQU8sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUE7U0FDOUI7YUFDSSxJQUFJLEtBQUssRUFBRTtZQUNkLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQTtZQUVsQixLQUFLLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLEVBQUU7Z0JBQ3JELElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNmLFNBQVMsSUFBSSxJQUFJLENBQUE7aUJBQ2xCO2FBQ0Y7WUFFRCxNQUFNLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1NBQzVCO1FBRUQsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0lBRUQsYUFBYSxFQUFFLElBQWM7Q0FDOUIsQ0FBQTtBQUVELFNBQVMsU0FBUyxDQUFFLFlBQW1DLEVBQUUsT0FBZ0UsRUFBRSxLQUFZO0lBQ3JJLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUN0QixZQUFZLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sS0FBSyxLQUFLLENBQUE7UUFDL0QsWUFBWSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFDNUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFFM0MsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNoRSxZQUFZLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQTtTQUNoRDthQUNJLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7WUFDOUIsWUFBWSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUE7U0FDdEU7UUFFRCxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLEVBQUU7WUFDeEMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsbUJBQW1CLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFBO1NBQzlFO2FBQ0ksSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUNoQyxZQUFZLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQTtTQUNwRDtRQUVELE9BQU8sWUFBWSxDQUFBO0tBQ3BCO0lBQ0QsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ3BCLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7UUFFN0MsT0FBTyxZQUFZLENBQUE7S0FDcEI7SUFDRCxPQUFPLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO0FBQ3BDLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FDdEIsSUFBWSxFQUNaLEtBQVUsRUFDVixJQUFvQixFQUNwQixPQUFhLEVBQ2IsbUJBQXFDLEVBQ3JDLElBQW1CLEVBQ25CLE1BQWM7SUFFZCw2QkFBNkI7SUFDN0IsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUFFLE9BQU8sS0FBSyxDQUFBO0tBQUU7SUFFNUIsa0RBQWtEO0lBQ2xELElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtRQUNsQiw2Q0FBNkM7UUFDN0MsTUFBTSxLQUFLLEdBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUksSUFBSSxDQUFDLElBQUksQ0FBQTtRQUM1RSxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFBO1FBRTVFLDREQUE0RDtRQUM1RCxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFFckYsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFO1lBQ2IsSUFBUyxJQUFJLEtBQUssTUFBTSxFQUFHO2dCQUFFLElBQUksR0FBRyxPQUFPLENBQUE7YUFBRTtpQkFDeEMsSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFO2dCQUFFLElBQUksR0FBRyxNQUFNLENBQUE7YUFBRztTQUM5QztRQUNELElBQUksTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNkLElBQVMsSUFBSSxLQUFLLEtBQUssRUFBSztnQkFBRSxJQUFJLEdBQUcsUUFBUSxDQUFBO2FBQUU7aUJBQzFDLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTtnQkFBRSxJQUFJLEdBQUcsS0FBSyxDQUFBO2FBQUs7U0FDaEQ7UUFFRCxJQUFJLElBQUksS0FBSyxNQUFNLEVBQUU7WUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssSUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQTtTQUFFO1FBQzFGLElBQUksSUFBSSxLQUFLLEtBQUssRUFBRTtZQUFFLE9BQU8sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFBO1NBQUU7UUFFekYsSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFO1lBQUUsT0FBTyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLElBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUE7U0FBRTtRQUMzRixJQUFJLElBQUksS0FBSyxRQUFRLEVBQUU7WUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQTtTQUFFO0tBQzdGO0lBRUQsMENBQTBDO0lBQzFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQUUsT0FBTyxLQUFLLENBQUE7S0FBRTtJQUUxQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ3hCLG9EQUFvRDtRQUNsRCxDQUFDLENBQUMsS0FBSyxLQUFLLE9BQU87UUFDbkIsdURBQXVEO1FBQ3ZELENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsbUJBQW1CLENBQUMsQ0FBQTtBQUMxRCxDQUFDO0FBRUQsU0FBUyxXQUFXLENBQUUsT0FBNEQ7SUFDaEYsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLENBQUMsRUFBRyxVQUFVO1FBQ2QsQ0FBQyxFQUFHLFVBQVU7UUFDZCxFQUFFLEVBQUUsV0FBVztRQUVmLEdBQUcsRUFBVSxVQUFVO1FBQ3ZCLElBQUksRUFBUyxVQUFVO1FBQ3ZCLE1BQU0sRUFBTyxVQUFVO1FBQ3ZCLEtBQUssRUFBUSxVQUFVO1FBQ3ZCLE9BQU8sRUFBTSxXQUFXO1FBQ3hCLFdBQVcsRUFBRSxXQUFXO1FBQ3hCLFFBQVEsRUFBSyxXQUFXO1FBQ3hCLFVBQVUsRUFBRyxXQUFXO0tBQ3pCLENBQUMsQ0FBQyxDQUFDO1FBQ0YsQ0FBQyxFQUFHLFdBQVc7UUFDZixDQUFDLEVBQUcsV0FBVztRQUNmLEVBQUUsRUFBRSxhQUFhO1FBRWpCLEdBQUcsRUFBVSxXQUFXO1FBQ3hCLElBQUksRUFBUyxXQUFXO1FBQ3hCLE1BQU0sRUFBTyxXQUFXO1FBQ3hCLEtBQUssRUFBUSxXQUFXO1FBQ3hCLE9BQU8sRUFBTSxhQUFhO1FBQzFCLFdBQVcsRUFBRSxhQUFhO1FBQzFCLFFBQVEsRUFBSyxhQUFhO1FBQzFCLFVBQVUsRUFBRyxhQUFhO0tBQzNCLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFFRCxTQUFTLEtBQUssQ0FBRSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQXFEO0lBQ3hGLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUU7UUFDekUsT0FBTTtLQUNQO0lBRUQsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLEVBQUUsRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDOUMsTUFBTSxhQUFhLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO0lBRTdEOzs7OztPQUtHO0lBQ0gsSUFBSSxhQUFhLENBQUMsTUFBTSxJQUFJLGFBQWEsQ0FBQyxtQkFBbUIsRUFBRTtRQUM3RCxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFMUQsV0FBVyxDQUFDLEdBQUcsR0FBTSxXQUFXLENBQUMsR0FBRyxJQUFPLENBQUMsV0FBVyxDQUFDLElBQUksSUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN0RixXQUFXLENBQUMsSUFBSSxHQUFLLFdBQVcsQ0FBQyxJQUFJLElBQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxJQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3JGLFdBQVcsQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDbkYsV0FBVyxDQUFDLEtBQUssR0FBSSxXQUFXLENBQUMsS0FBSyxJQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUVwRixXQUFXLENBQUMsUUFBUSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUE7S0FDaEQ7U0FDSTtRQUNILFdBQVcsQ0FBQyxRQUFRLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQTtLQUN6QztJQUVELGtHQUFrRztJQUNsRyxJQUFJLGFBQWEsQ0FBQyxtQkFBbUIsRUFBRTtRQUNyQyxXQUFXLENBQUMsc0JBQXNCLEdBQUcsU0FBUyxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFBO0tBQ3hFO0lBRUQsV0FBVyxDQUFDLFdBQVcsR0FBRztRQUN4QixLQUFLLEVBQU8sU0FBUztRQUNyQixPQUFPLEVBQUs7WUFDVixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7WUFDcEIsS0FBSyxFQUFFLFNBQVMsQ0FBQyxLQUFLO1lBQ3RCLEdBQUcsRUFBRSxTQUFTLENBQUMsR0FBRztZQUNsQixNQUFNLEVBQUUsU0FBUyxDQUFDLE1BQU07U0FDekI7UUFDRCxRQUFRLEVBQUksTUFBTSxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUM7UUFDakMsUUFBUSxFQUFJLE1BQU0sQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDO1FBQ2pDLEtBQUssRUFBTztZQUNWLElBQUksRUFBRSxDQUFDO1lBQ1AsS0FBSyxFQUFHLENBQUM7WUFDVCxLQUFLLEVBQUcsQ0FBQztZQUNULEdBQUcsRUFBRyxDQUFDO1lBQ1AsTUFBTSxFQUFFLENBQUM7WUFDVCxNQUFNLEVBQUUsQ0FBQztTQUNWO0tBQ0YsQ0FBQTtJQUVELE1BQU0sQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUE7SUFDekMsTUFBTSxDQUFDLElBQUksR0FBRyxXQUFXLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQTtJQUM5QyxNQUFNLENBQUMsU0FBUyxHQUFHLFdBQVcsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFBO0FBQ2xELENBQUM7QUFFRCxTQUFTLElBQUksQ0FBRSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQXFEO0lBQ3ZGLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUU7UUFBRSxPQUFNO0tBQUU7SUFFckYsTUFBTSxhQUFhLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO0lBQzdELE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUE7SUFDbkMsTUFBTSxVQUFVLEdBQUcsTUFBTSxLQUFLLFlBQVksSUFBSSxNQUFNLEtBQUssUUFBUSxDQUFBO0lBRWpFLElBQUksS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFBO0lBRXRDLHFDQUFxQztJQUNyQyxNQUFNLEtBQUssR0FBUSxXQUFXLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQTtJQUNoRCxNQUFNLE9BQU8sR0FBTSxXQUFXLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQTtJQUNsRCxNQUFNLFFBQVEsR0FBSyxXQUFXLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQTtJQUNuRCxNQUFNLFNBQVMsR0FBSSxXQUFXLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQTtJQUNoRCxNQUFNLFFBQVEsR0FBSyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDckUsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFBO0lBRTNCLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBRTNDLElBQUksYUFBYSxDQUFDLG1CQUFtQixJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUU7UUFDN0QscUVBQXFFO1FBQ3JFLE1BQU0sZ0JBQWdCLEdBQUcsYUFBYSxDQUFDLG1CQUFtQjtZQUN4RCxDQUFDLENBQUMsV0FBVyxDQUFDLHNCQUFzQjtZQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRUwsS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFBO1FBRXpDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxJQUFJLGFBQWEsQ0FBQyxNQUFNLENBQUM7WUFDNUMsQ0FBQyxhQUFhLENBQUMsS0FBSyxJQUFJLGFBQWEsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUM5QyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQTtTQUNoRDthQUNJLElBQUksYUFBYSxDQUFDLElBQUksSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFO1lBQUUsVUFBVSxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxHQUFHLGdCQUFnQixDQUFBO1NBQUU7YUFDakcsSUFBSSxhQUFhLENBQUMsR0FBRyxJQUFLLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFBRSxVQUFVLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLEdBQUcsZ0JBQWdCLENBQUE7U0FBRTtLQUN4RztJQUVELGtEQUFrRDtJQUNsRCxJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUU7UUFBRSxPQUFPLENBQUMsR0FBRyxJQUFPLFVBQVUsQ0FBQyxDQUFDLENBQUE7S0FBRTtJQUNqRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7UUFBRSxPQUFPLENBQUMsTUFBTSxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUE7S0FBRTtJQUNwRCxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUU7UUFBRSxPQUFPLENBQUMsSUFBSSxJQUFNLFVBQVUsQ0FBQyxDQUFDLENBQUE7S0FBRTtJQUNsRCxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7UUFBRSxPQUFPLENBQUMsS0FBSyxJQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUE7S0FBRTtJQUVuRCxJQUFJLFVBQVUsRUFBRTtRQUNkLHVDQUF1QztRQUN2QyxNQUFNLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBRXpCLElBQUksTUFBTSxLQUFLLFlBQVksRUFBRTtZQUMzQiw4REFBOEQ7WUFDOUQsSUFBSSxJQUFJLENBQUE7WUFFUixJQUFJLFFBQVEsQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRTtnQkFDbEMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUE7Z0JBRW5CLFFBQVEsQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQTtnQkFDOUIsUUFBUSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUE7YUFDdkI7WUFDRCxJQUFJLFFBQVEsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRTtnQkFDbEMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUE7Z0JBRXBCLFFBQVEsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQTtnQkFDOUIsUUFBUSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7YUFDdEI7U0FDRjtLQUNGO1NBQ0k7UUFDSCxxREFBcUQ7UUFDckQsUUFBUSxDQUFDLEdBQUcsR0FBTSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3JELFFBQVEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNyRCxRQUFRLENBQUMsSUFBSSxHQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDckQsUUFBUSxDQUFDLEtBQUssR0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO0tBQ3REO0lBRUQsUUFBUSxDQUFDLEtBQUssR0FBSSxRQUFRLENBQUMsS0FBSyxHQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUE7SUFDakQsUUFBUSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUE7SUFFaEQsS0FBSyxNQUFNLElBQUksSUFBSSxRQUFRLEVBQUU7UUFDM0IsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUE7S0FDbEQ7SUFFRCxNQUFNLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFBO0lBQ3pDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFBO0lBQ3RCLE1BQU0sQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFBO0FBQzlCLENBQUM7QUFFRCxTQUFTLEdBQUcsQ0FBRSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQXFEO0lBQ3RGLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUU7UUFBRSxPQUFNO0tBQUU7SUFFckYsTUFBTSxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQTtJQUN6QyxNQUFNLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFBO0lBQzlDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUE7QUFDbEQsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFFLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQXlFO0lBQzlILElBQUksTUFBTSxLQUFLLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFO1FBQUUsT0FBTTtLQUFFO0lBRXZFLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFBO0lBRWhELElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7UUFDekIsSUFBSSxXQUFXLENBQUMsVUFBVSxLQUFLLEdBQUcsRUFBRTtZQUNsQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQTtTQUNoQzthQUNJO1lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7U0FDaEM7UUFDRCxNQUFNLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtLQUNuQjtTQUNJO1FBQ0gsTUFBTSxDQUFDLElBQUksR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFBO1FBRXBDLElBQUksV0FBVyxDQUFDLFVBQVUsS0FBSyxHQUFHLEVBQUU7WUFDbEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ25CO2FBQ0ksSUFBSSxXQUFXLENBQUMsVUFBVSxLQUFLLEdBQUcsRUFBRTtZQUN2QyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7U0FDbkI7S0FDRjtBQUNILENBQUM7QUFFRCxlQUFlLE1BQU0sQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFjdGlvblByb3BzLCBJbnRlcmFjdGlvbiB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3Rpb24nXG5pbXBvcnQgeyBBY3Rpb25OYW1lLCBTY29wZSB9IGZyb20gJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnXG5pbXBvcnQgKiBhcyBhcnIgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvYXJyJ1xuaW1wb3J0ICogYXMgZG9tIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2RvbVV0aWxzJ1xuaW1wb3J0IGV4dGVuZCBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9leHRlbmQnXG5pbXBvcnQgKiBhcyBpcyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9pcydcblxuZXhwb3J0IHR5cGUgRWRnZU5hbWUgPSAndG9wJyB8ICdsZWZ0JyB8ICdib3R0b20nIHwgJ3JpZ2h0J1xuXG5leHBvcnQgdHlwZSBSZXNpemFibGVNZXRob2QgPSBJbnRlcmFjdC5BY3Rpb25NZXRob2Q8SW50ZXJhY3QuUmVzaXphYmxlT3B0aW9ucz5cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3RhYmxlJyB7XG4gIGludGVyZmFjZSBJbnRlcmFjdGFibGUge1xuICAgIHJlc2l6YWJsZTogUmVzaXphYmxlTWV0aG9kXG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3Rpb24nIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0aW9uIHtcbiAgICByZXNpemVBeGVzOiAneCcgfCAneScgfCAneHknXG4gICAgcmVzaXplUmVjdHM6IHtcbiAgICAgIHN0YXJ0OiBJbnRlcmFjdC5GdWxsUmVjdFxuICAgICAgY3VycmVudDogSW50ZXJhY3QuUmVjdFxuICAgICAgaW52ZXJ0ZWQ6IEludGVyYWN0LkZ1bGxSZWN0XG4gICAgICBwcmV2aW91czogSW50ZXJhY3QuRnVsbFJlY3RcbiAgICAgIGRlbHRhOiBJbnRlcmFjdC5GdWxsUmVjdFxuICAgIH1cbiAgICByZXNpemVTdGFydEFzcGVjdFJhdGlvOiBudW1iZXJcbiAgfVxuXG4gIGludGVyZmFjZSBBY3Rpb25Qcm9wcyB7XG4gICAgZWRnZXM/OiB7IFtlZGdlIGluICd0b3AnIHwgJ2xlZnQnIHwgJ2JvdHRvbScgfCAncmlnaHQnXT86IGJvb2xlYW4gfVxuICAgIF9saW5rZWRFZGdlcz86IHsgW2VkZ2UgaW4gJ3RvcCcgfCAnbGVmdCcgfCAnYm90dG9tJyB8ICdyaWdodCddPzogYm9vbGVhbiB9XG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvZGVmYXVsdE9wdGlvbnMnIHtcbiAgaW50ZXJmYWNlIEFjdGlvbkRlZmF1bHRzIHtcbiAgICByZXNpemU6IEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnNcbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9zY29wZScge1xuICBpbnRlcmZhY2UgQWN0aW9ucyB7XG4gICAgW0FjdGlvbk5hbWUuUmVzaXplXT86IHR5cGVvZiByZXNpemVcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcbiAgZW51bSBBY3Rpb25OYW1lIHtcbiAgICBSZXNpemUgPSAncmVzaXplJ1xuICB9XG59XG5cbihBY3Rpb25OYW1lIGFzIGFueSkuUmVzaXplID0gJ3Jlc2l6ZSdcblxuZXhwb3J0IGludGVyZmFjZSBSZXNpemVFdmVudCBleHRlbmRzIEludGVyYWN0LkludGVyYWN0RXZlbnQ8QWN0aW9uTmFtZS5SZXNpemU+IHtcbiAgZGVsdGFSZWN0PzogSW50ZXJhY3QuRnVsbFJlY3RcbiAgZWRnZXM/OiBJbnRlcmFjdC5BY3Rpb25Qcm9wc1snZWRnZXMnXVxufVxuXG5mdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qge1xuICAgIGFjdGlvbnMsXG4gICAgYnJvd3NlcixcbiAgICAvKiogQGxlbmRzIEludGVyYWN0YWJsZSAqL1xuICAgIEludGVyYWN0YWJsZSwgLy8gdHNsaW50OmRpc2FibGUtbGluZSBuby1zaGFkb3dlZC12YXJpYWJsZVxuICAgIGludGVyYWN0aW9ucyxcbiAgICBkZWZhdWx0cyxcbiAgfSA9IHNjb3BlXG5cbiAgLy8gTGVzcyBQcmVjaXNpb24gd2l0aCB0b3VjaCBpbnB1dFxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCduZXcnLCBpbnRlcmFjdGlvbiA9PiB7XG4gICAgaW50ZXJhY3Rpb24ucmVzaXplQXhlcyA9ICd4eSdcbiAgfSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLXN0YXJ0Jywgc3RhcnQpXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tbW92ZScsIG1vdmUpXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tZW5kJywgZW5kKVxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tc3RhcnQnLCB1cGRhdGVFdmVudEF4ZXMpXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tbW92ZScsIHVwZGF0ZUV2ZW50QXhlcylcblxuICByZXNpemUuY3Vyc29ycyA9IGluaXRDdXJzb3JzKGJyb3dzZXIpXG4gIHJlc2l6ZS5kZWZhdWx0TWFyZ2luID0gYnJvd3Nlci5zdXBwb3J0c1RvdWNoIHx8IGJyb3dzZXIuc3VwcG9ydHNQb2ludGVyRXZlbnQgPyAyMCA6IDEwXG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KGVsZW1lbnQpLnJlc2l6YWJsZSh7XG4gICAqICAgb25zdGFydDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICogICBvbm1vdmUgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgKiAgIG9uZW5kICA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAqXG4gICAqICAgZWRnZXM6IHtcbiAgICogICAgIHRvcCAgIDogdHJ1ZSwgICAgICAgLy8gVXNlIHBvaW50ZXIgY29vcmRzIHRvIGNoZWNrIGZvciByZXNpemUuXG4gICAqICAgICBsZWZ0ICA6IGZhbHNlLCAgICAgIC8vIERpc2FibGUgcmVzaXppbmcgZnJvbSBsZWZ0IGVkZ2UuXG4gICAqICAgICBib3R0b206ICcucmVzaXplLXMnLC8vIFJlc2l6ZSBpZiBwb2ludGVyIHRhcmdldCBtYXRjaGVzIHNlbGVjdG9yXG4gICAqICAgICByaWdodCA6IGhhbmRsZUVsICAgIC8vIFJlc2l6ZSBpZiBwb2ludGVyIHRhcmdldCBpcyB0aGUgZ2l2ZW4gRWxlbWVudFxuICAgKiAgIH0sXG4gICAqXG4gICAqICAgICAvLyBXaWR0aCBhbmQgaGVpZ2h0IGNhbiBiZSBhZGp1c3RlZCBpbmRlcGVuZGVudGx5LiBXaGVuIGB0cnVlYCwgd2lkdGggYW5kXG4gICAqICAgICAvLyBoZWlnaHQgYXJlIGFkanVzdGVkIGF0IGEgMToxIHJhdGlvLlxuICAgKiAgICAgc3F1YXJlOiBmYWxzZSxcbiAgICpcbiAgICogICAgIC8vIFdpZHRoIGFuZCBoZWlnaHQgY2FuIGJlIGFkanVzdGVkIGluZGVwZW5kZW50bHkuIFdoZW4gYHRydWVgLCB3aWR0aCBhbmRcbiAgICogICAgIC8vIGhlaWdodCBtYWludGFpbiB0aGUgYXNwZWN0IHJhdGlvIHRoZXkgaGFkIHdoZW4gcmVzaXppbmcgc3RhcnRlZC5cbiAgICogICAgIHByZXNlcnZlQXNwZWN0UmF0aW86IGZhbHNlLFxuICAgKlxuICAgKiAgIC8vIGEgdmFsdWUgb2YgJ25vbmUnIHdpbGwgbGltaXQgdGhlIHJlc2l6ZSByZWN0IHRvIGEgbWluaW11bSBvZiAweDBcbiAgICogICAvLyAnbmVnYXRlJyB3aWxsIGFsbG93IHRoZSByZWN0IHRvIGhhdmUgbmVnYXRpdmUgd2lkdGgvaGVpZ2h0XG4gICAqICAgLy8gJ3JlcG9zaXRpb24nIHdpbGwga2VlcCB0aGUgd2lkdGgvaGVpZ2h0IHBvc2l0aXZlIGJ5IHN3YXBwaW5nXG4gICAqICAgLy8gdGhlIHRvcCBhbmQgYm90dG9tIGVkZ2VzIGFuZC9vciBzd2FwcGluZyB0aGUgbGVmdCBhbmQgcmlnaHQgZWRnZXNcbiAgICogICBpbnZlcnQ6ICdub25lJyB8fCAnbmVnYXRlJyB8fCAncmVwb3NpdGlvbidcbiAgICpcbiAgICogICAvLyBsaW1pdCBtdWx0aXBsZSByZXNpemVzLlxuICAgKiAgIC8vIFNlZSB0aGUgZXhwbGFuYXRpb24gaW4gdGhlIHtAbGluayBJbnRlcmFjdGFibGUuZHJhZ2dhYmxlfSBleGFtcGxlXG4gICAqICAgbWF4OiBJbmZpbml0eSxcbiAgICogICBtYXhQZXJFbGVtZW50OiAxLFxuICAgKiB9KVxuICAgKlxuICAgKiB2YXIgaXNSZXNpemVhYmxlID0gaW50ZXJhY3QoZWxlbWVudCkucmVzaXphYmxlKClcbiAgICogYGBgXG4gICAqXG4gICAqIEdldHMgb3Igc2V0cyB3aGV0aGVyIHJlc2l6ZSBhY3Rpb25zIGNhbiBiZSBwZXJmb3JtZWQgb24gdGhlIHRhcmdldFxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW4gfCBvYmplY3R9IFtvcHRpb25zXSB0cnVlL2ZhbHNlIG9yIEFuIG9iamVjdCB3aXRoIGV2ZW50XG4gICAqIGxpc3RlbmVycyB0byBiZSBmaXJlZCBvbiByZXNpemUgZXZlbnRzIChvYmplY3QgbWFrZXMgdGhlIEludGVyYWN0YWJsZVxuICAgKiByZXNpemFibGUpXG4gICAqIEByZXR1cm4ge2Jvb2xlYW4gfCBJbnRlcmFjdGFibGV9IEEgYm9vbGVhbiBpbmRpY2F0aW5nIGlmIHRoaXMgY2FuIGJlIHRoZVxuICAgKiB0YXJnZXQgb2YgcmVzaXplIGVsZW1lbnRzLCBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5yZXNpemFibGUgPSBmdW5jdGlvbiAodGhpczogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBvcHRpb25zOiBJbnRlcmFjdC5SZXNpemFibGVPcHRpb25zIHwgYm9vbGVhbikge1xuICAgIHJldHVybiByZXNpemFibGUodGhpcywgb3B0aW9ucywgc2NvcGUpXG4gIH0gYXMgUmVzaXphYmxlTWV0aG9kXG5cbiAgYWN0aW9uc1tBY3Rpb25OYW1lLlJlc2l6ZV0gPSByZXNpemVcbiAgYWN0aW9ucy5uYW1lcy5wdXNoKEFjdGlvbk5hbWUuUmVzaXplKVxuICBhcnIubWVyZ2UoYWN0aW9ucy5ldmVudFR5cGVzLCBbXG4gICAgJ3Jlc2l6ZXN0YXJ0JyxcbiAgICAncmVzaXplbW92ZScsXG4gICAgJ3Jlc2l6ZWluZXJ0aWFzdGFydCcsXG4gICAgJ3Jlc2l6ZXJlc3VtZScsXG4gICAgJ3Jlc2l6ZWVuZCcsXG4gIF0pXG4gIGFjdGlvbnMubWV0aG9kRGljdC5yZXNpemUgPSAncmVzaXphYmxlJ1xuXG4gIGRlZmF1bHRzLmFjdGlvbnMucmVzaXplID0gcmVzaXplLmRlZmF1bHRzXG59XG5cbmNvbnN0IHJlc2l6ZSA9IHtcbiAgaWQ6ICdhY3Rpb25zL3Jlc2l6ZScsXG4gIGluc3RhbGwsXG4gIGRlZmF1bHRzOiB7XG4gICAgc3F1YXJlOiBmYWxzZSxcbiAgICBwcmVzZXJ2ZUFzcGVjdFJhdGlvOiBmYWxzZSxcbiAgICBheGlzOiAneHknLFxuXG4gICAgLy8gdXNlIGRlZmF1bHQgbWFyZ2luXG4gICAgbWFyZ2luOiBOYU4sXG5cbiAgICAvLyBvYmplY3Qgd2l0aCBwcm9wcyBsZWZ0LCByaWdodCwgdG9wLCBib3R0b20gd2hpY2ggYXJlXG4gICAgLy8gdHJ1ZS9mYWxzZSB2YWx1ZXMgdG8gcmVzaXplIHdoZW4gdGhlIHBvaW50ZXIgaXMgb3ZlciB0aGF0IGVkZ2UsXG4gICAgLy8gQ1NTIHNlbGVjdG9ycyB0byBtYXRjaCB0aGUgaGFuZGxlcyBmb3IgZWFjaCBkaXJlY3Rpb25cbiAgICAvLyBvciB0aGUgRWxlbWVudHMgZm9yIGVhY2ggaGFuZGxlXG4gICAgZWRnZXM6IG51bGwsXG5cbiAgICAvLyBhIHZhbHVlIG9mICdub25lJyB3aWxsIGxpbWl0IHRoZSByZXNpemUgcmVjdCB0byBhIG1pbmltdW0gb2YgMHgwXG4gICAgLy8gJ25lZ2F0ZScgd2lsbCBhbG93IHRoZSByZWN0IHRvIGhhdmUgbmVnYXRpdmUgd2lkdGgvaGVpZ2h0XG4gICAgLy8gJ3JlcG9zaXRpb24nIHdpbGwga2VlcCB0aGUgd2lkdGgvaGVpZ2h0IHBvc2l0aXZlIGJ5IHN3YXBwaW5nXG4gICAgLy8gdGhlIHRvcCBhbmQgYm90dG9tIGVkZ2VzIGFuZC9vciBzd2FwcGluZyB0aGUgbGVmdCBhbmQgcmlnaHQgZWRnZXNcbiAgICBpbnZlcnQ6ICdub25lJyxcbiAgfSBhcyBJbnRlcmFjdC5SZXNpemFibGVPcHRpb25zLFxuXG4gIGNoZWNrZXIgKFxuICAgIF9wb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSxcbiAgICBfZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsXG4gICAgaW50ZXJhY3RhYmxlOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsXG4gICAgZWxlbWVudDogSW50ZXJhY3QuRWxlbWVudCxcbiAgICBpbnRlcmFjdGlvbjogSW50ZXJhY3Rpb24sXG4gICAgcmVjdDogSW50ZXJhY3QuUmVjdFxuICApIHtcbiAgICBpZiAoIXJlY3QpIHsgcmV0dXJuIG51bGwgfVxuXG4gICAgY29uc3QgcGFnZSA9IGV4dGVuZCh7fSwgaW50ZXJhY3Rpb24uY29vcmRzLmN1ci5wYWdlKVxuICAgIGNvbnN0IG9wdGlvbnMgPSBpbnRlcmFjdGFibGUub3B0aW9uc1xuXG4gICAgaWYgKG9wdGlvbnMucmVzaXplLmVuYWJsZWQpIHtcbiAgICAgIGNvbnN0IHJlc2l6ZU9wdGlvbnMgPSBvcHRpb25zLnJlc2l6ZVxuICAgICAgY29uc3QgcmVzaXplRWRnZXM6IHsgW2VkZ2U6IHN0cmluZ106IGJvb2xlYW4gfSA9IHsgbGVmdDogZmFsc2UsIHJpZ2h0OiBmYWxzZSwgdG9wOiBmYWxzZSwgYm90dG9tOiBmYWxzZSB9XG5cbiAgICAgIC8vIGlmIHVzaW5nIHJlc2l6ZS5lZGdlc1xuICAgICAgaWYgKGlzLm9iamVjdChyZXNpemVPcHRpb25zLmVkZ2VzKSkge1xuICAgICAgICBmb3IgKGNvbnN0IGVkZ2UgaW4gcmVzaXplRWRnZXMpIHtcbiAgICAgICAgICByZXNpemVFZGdlc1tlZGdlXSA9IGNoZWNrUmVzaXplRWRnZShlZGdlLFxuICAgICAgICAgICAgcmVzaXplT3B0aW9ucy5lZGdlc1tlZGdlXSxcbiAgICAgICAgICAgIHBhZ2UsXG4gICAgICAgICAgICBpbnRlcmFjdGlvbi5fbGF0ZXN0UG9pbnRlci5ldmVudFRhcmdldCxcbiAgICAgICAgICAgIGVsZW1lbnQsXG4gICAgICAgICAgICByZWN0LFxuICAgICAgICAgICAgcmVzaXplT3B0aW9ucy5tYXJnaW4gfHwgdGhpcy5kZWZhdWx0TWFyZ2luKVxuICAgICAgICB9XG5cbiAgICAgICAgcmVzaXplRWRnZXMubGVmdCA9IHJlc2l6ZUVkZ2VzLmxlZnQgJiYgIXJlc2l6ZUVkZ2VzLnJpZ2h0XG4gICAgICAgIHJlc2l6ZUVkZ2VzLnRvcCAgPSByZXNpemVFZGdlcy50b3AgICYmICFyZXNpemVFZGdlcy5ib3R0b21cblxuICAgICAgICBpZiAocmVzaXplRWRnZXMubGVmdCB8fCByZXNpemVFZGdlcy5yaWdodCB8fCByZXNpemVFZGdlcy50b3AgfHwgcmVzaXplRWRnZXMuYm90dG9tKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6ICdyZXNpemUnLFxuICAgICAgICAgICAgZWRnZXM6IHJlc2l6ZUVkZ2VzLFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNvbnN0IHJpZ2h0ICA9IG9wdGlvbnMucmVzaXplLmF4aXMgIT09ICd5JyAmJiBwYWdlLnggPiAocmVjdC5yaWdodCAgLSB0aGlzLmRlZmF1bHRNYXJnaW4pXG4gICAgICAgIGNvbnN0IGJvdHRvbSA9IG9wdGlvbnMucmVzaXplLmF4aXMgIT09ICd4JyAmJiBwYWdlLnkgPiAocmVjdC5ib3R0b20gLSB0aGlzLmRlZmF1bHRNYXJnaW4pXG5cbiAgICAgICAgaWYgKHJpZ2h0IHx8IGJvdHRvbSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiAncmVzaXplJyxcbiAgICAgICAgICAgIGF4ZXM6IChyaWdodCA/ICd4JyA6ICcnKSArIChib3R0b20gPyAneScgOiAnJyksXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGxcbiAgfSxcblxuICBjdXJzb3JzOiBudWxsIGFzIFJldHVyblR5cGU8dHlwZW9mIGluaXRDdXJzb3JzPixcblxuICBnZXRDdXJzb3IgKHsgZWRnZXMsIGF4aXMsIG5hbWUgfTogQWN0aW9uUHJvcHMpIHtcbiAgICBjb25zdCBjdXJzb3JzID0gcmVzaXplLmN1cnNvcnNcbiAgICBsZXQgcmVzdWx0OiBzdHJpbmcgPSBudWxsXG5cbiAgICBpZiAoYXhpcykge1xuICAgICAgcmVzdWx0ID0gY3Vyc29yc1tuYW1lICsgYXhpc11cbiAgICB9XG4gICAgZWxzZSBpZiAoZWRnZXMpIHtcbiAgICAgIGxldCBjdXJzb3JLZXkgPSAnJ1xuXG4gICAgICBmb3IgKGNvbnN0IGVkZ2Ugb2YgWyd0b3AnLCAnYm90dG9tJywgJ2xlZnQnLCAncmlnaHQnXSkge1xuICAgICAgICBpZiAoZWRnZXNbZWRnZV0pIHtcbiAgICAgICAgICBjdXJzb3JLZXkgKz0gZWRnZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJlc3VsdCA9IGN1cnNvcnNbY3Vyc29yS2V5XVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRcbiAgfSxcblxuICBkZWZhdWx0TWFyZ2luOiBudWxsIGFzIG51bWJlcixcbn1cblxuZnVuY3Rpb24gcmVzaXphYmxlIChpbnRlcmFjdGFibGU6IEludGVyYWN0LkludGVyYWN0YWJsZSwgb3B0aW9uczogSW50ZXJhY3QuT3JCb29sZWFuPEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnM+IHwgYm9vbGVhbiwgc2NvcGU6IFNjb3BlKSB7XG4gIGlmIChpcy5vYmplY3Qob3B0aW9ucykpIHtcbiAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUuZW5hYmxlZCA9IG9wdGlvbnMuZW5hYmxlZCAhPT0gZmFsc2VcbiAgICBpbnRlcmFjdGFibGUuc2V0UGVyQWN0aW9uKCdyZXNpemUnLCBvcHRpb25zKVxuICAgIGludGVyYWN0YWJsZS5zZXRPbkV2ZW50cygncmVzaXplJywgb3B0aW9ucylcblxuICAgIGlmIChpcy5zdHJpbmcob3B0aW9ucy5heGlzKSAmJiAvXngkfF55JHxeeHkkLy50ZXN0KG9wdGlvbnMuYXhpcykpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5heGlzID0gb3B0aW9ucy5heGlzXG4gICAgfVxuICAgIGVsc2UgaWYgKG9wdGlvbnMuYXhpcyA9PT0gbnVsbCkge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplLmF4aXMgPSBzY29wZS5kZWZhdWx0cy5hY3Rpb25zLnJlc2l6ZS5heGlzXG4gICAgfVxuXG4gICAgaWYgKGlzLmJvb2wob3B0aW9ucy5wcmVzZXJ2ZUFzcGVjdFJhdGlvKSkge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplLnByZXNlcnZlQXNwZWN0UmF0aW8gPSBvcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW9cbiAgICB9XG4gICAgZWxzZSBpZiAoaXMuYm9vbChvcHRpb25zLnNxdWFyZSkpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5zcXVhcmUgPSBvcHRpb25zLnNxdWFyZVxuICAgIH1cblxuICAgIHJldHVybiBpbnRlcmFjdGFibGVcbiAgfVxuICBpZiAoaXMuYm9vbChvcHRpb25zKSkge1xuICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5lbmFibGVkID0gb3B0aW9uc1xuXG4gICAgcmV0dXJuIGludGVyYWN0YWJsZVxuICB9XG4gIHJldHVybiBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemVcbn1cblxuZnVuY3Rpb24gY2hlY2tSZXNpemVFZGdlIChcbiAgbmFtZTogc3RyaW5nLFxuICB2YWx1ZTogYW55LFxuICBwYWdlOiBJbnRlcmFjdC5Qb2ludCxcbiAgZWxlbWVudDogTm9kZSxcbiAgaW50ZXJhY3RhYmxlRWxlbWVudDogSW50ZXJhY3QuRWxlbWVudCxcbiAgcmVjdDogSW50ZXJhY3QuUmVjdCxcbiAgbWFyZ2luOiBudW1iZXIsXG4pIHtcbiAgLy8gZmFsc2UsICcnLCB1bmRlZmluZWQsIG51bGxcbiAgaWYgKCF2YWx1ZSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIC8vIHRydWUgdmFsdWUsIHVzZSBwb2ludGVyIGNvb3JkcyBhbmQgZWxlbWVudCByZWN0XG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSkge1xuICAgIC8vIGlmIGRpbWVuc2lvbnMgYXJlIG5lZ2F0aXZlLCBcInN3aXRjaFwiIGVkZ2VzXG4gICAgY29uc3Qgd2lkdGggID0gaXMubnVtYmVyKHJlY3Qud2lkdGgpID8gcmVjdC53aWR0aCAgOiByZWN0LnJpZ2h0ICAtIHJlY3QubGVmdFxuICAgIGNvbnN0IGhlaWdodCA9IGlzLm51bWJlcihyZWN0LmhlaWdodCkgPyByZWN0LmhlaWdodCA6IHJlY3QuYm90dG9tIC0gcmVjdC50b3BcblxuICAgIC8vIGRvbid0IHVzZSBtYXJnaW4gZ3JlYXRlciB0aGFuIGhhbGYgdGhlIHJlbGV2ZW50IGRpbWVuc2lvblxuICAgIG1hcmdpbiA9IE1hdGgubWluKG1hcmdpbiwgKG5hbWUgPT09ICdsZWZ0JyB8fCBuYW1lID09PSAncmlnaHQnID8gd2lkdGggOiBoZWlnaHQpIC8gMilcblxuICAgIGlmICh3aWR0aCA8IDApIHtcbiAgICAgIGlmICAgICAgKG5hbWUgPT09ICdsZWZ0JykgIHsgbmFtZSA9ICdyaWdodCcgfVxuICAgICAgZWxzZSBpZiAobmFtZSA9PT0gJ3JpZ2h0JykgeyBuYW1lID0gJ2xlZnQnICB9XG4gICAgfVxuICAgIGlmIChoZWlnaHQgPCAwKSB7XG4gICAgICBpZiAgICAgIChuYW1lID09PSAndG9wJykgICAgeyBuYW1lID0gJ2JvdHRvbScgfVxuICAgICAgZWxzZSBpZiAobmFtZSA9PT0gJ2JvdHRvbScpIHsgbmFtZSA9ICd0b3AnICAgIH1cbiAgICB9XG5cbiAgICBpZiAobmFtZSA9PT0gJ2xlZnQnKSB7IHJldHVybiBwYWdlLnggPCAoKHdpZHRoICA+PSAwID8gcmVjdC5sZWZ0IDogcmVjdC5yaWdodCkgKyBtYXJnaW4pIH1cbiAgICBpZiAobmFtZSA9PT0gJ3RvcCcpIHsgcmV0dXJuIHBhZ2UueSA8ICgoaGVpZ2h0ID49IDAgPyByZWN0LnRvcCA6IHJlY3QuYm90dG9tKSArIG1hcmdpbikgfVxuXG4gICAgaWYgKG5hbWUgPT09ICdyaWdodCcpIHsgcmV0dXJuIHBhZ2UueCA+ICgod2lkdGggID49IDAgPyByZWN0LnJpZ2h0IDogcmVjdC5sZWZ0KSAtIG1hcmdpbikgfVxuICAgIGlmIChuYW1lID09PSAnYm90dG9tJykgeyByZXR1cm4gcGFnZS55ID4gKChoZWlnaHQgPj0gMCA/IHJlY3QuYm90dG9tIDogcmVjdC50b3ApIC0gbWFyZ2luKSB9XG4gIH1cblxuICAvLyB0aGUgcmVtYWluaW5nIGNoZWNrcyByZXF1aXJlIGFuIGVsZW1lbnRcbiAgaWYgKCFpcy5lbGVtZW50KGVsZW1lbnQpKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgcmV0dXJuIGlzLmVsZW1lbnQodmFsdWUpXG4gIC8vIHRoZSB2YWx1ZSBpcyBhbiBlbGVtZW50IHRvIHVzZSBhcyBhIHJlc2l6ZSBoYW5kbGVcbiAgICA/IHZhbHVlID09PSBlbGVtZW50XG4gICAgLy8gb3RoZXJ3aXNlIGNoZWNrIGlmIGVsZW1lbnQgbWF0Y2hlcyB2YWx1ZSBhcyBzZWxlY3RvclxuICAgIDogZG9tLm1hdGNoZXNVcFRvKGVsZW1lbnQsIHZhbHVlLCBpbnRlcmFjdGFibGVFbGVtZW50KVxufVxuXG5mdW5jdGlvbiBpbml0Q3Vyc29ycyAoYnJvd3NlcjogdHlwZW9mIGltcG9ydCAoJ0BpbnRlcmFjdGpzL3V0aWxzL2Jyb3dzZXInKS5kZWZhdWx0KSB7XG4gIHJldHVybiAoYnJvd3Nlci5pc0llOSA/IHtcbiAgICB4IDogJ2UtcmVzaXplJyxcbiAgICB5IDogJ3MtcmVzaXplJyxcbiAgICB4eTogJ3NlLXJlc2l6ZScsXG5cbiAgICB0b3AgICAgICAgIDogJ24tcmVzaXplJyxcbiAgICBsZWZ0ICAgICAgIDogJ3ctcmVzaXplJyxcbiAgICBib3R0b20gICAgIDogJ3MtcmVzaXplJyxcbiAgICByaWdodCAgICAgIDogJ2UtcmVzaXplJyxcbiAgICB0b3BsZWZ0ICAgIDogJ3NlLXJlc2l6ZScsXG4gICAgYm90dG9tcmlnaHQ6ICdzZS1yZXNpemUnLFxuICAgIHRvcHJpZ2h0ICAgOiAnbmUtcmVzaXplJyxcbiAgICBib3R0b21sZWZ0IDogJ25lLXJlc2l6ZScsXG4gIH0gOiB7XG4gICAgeCA6ICdldy1yZXNpemUnLFxuICAgIHkgOiAnbnMtcmVzaXplJyxcbiAgICB4eTogJ253c2UtcmVzaXplJyxcblxuICAgIHRvcCAgICAgICAgOiAnbnMtcmVzaXplJyxcbiAgICBsZWZ0ICAgICAgIDogJ2V3LXJlc2l6ZScsXG4gICAgYm90dG9tICAgICA6ICducy1yZXNpemUnLFxuICAgIHJpZ2h0ICAgICAgOiAnZXctcmVzaXplJyxcbiAgICB0b3BsZWZ0ICAgIDogJ253c2UtcmVzaXplJyxcbiAgICBib3R0b21yaWdodDogJ253c2UtcmVzaXplJyxcbiAgICB0b3ByaWdodCAgIDogJ25lc3ctcmVzaXplJyxcbiAgICBib3R0b21sZWZ0IDogJ25lc3ctcmVzaXplJyxcbiAgfSlcbn1cblxuZnVuY3Rpb24gc3RhcnQgKHsgaUV2ZW50LCBpbnRlcmFjdGlvbiB9OiB7IGlFdmVudDogUmVzaXplRXZlbnQsIGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbiB9KSB7XG4gIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAncmVzaXplJyB8fCAhaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXMpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGNvbnN0IHN0YXJ0UmVjdCA9IGV4dGVuZCh7fSwgaW50ZXJhY3Rpb24ucmVjdClcbiAgY29uc3QgcmVzaXplT3B0aW9ucyA9IGludGVyYWN0aW9uLmludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZVxuXG4gIC8qXG4gICAqIFdoZW4gdXNpbmcgdGhlIGByZXNpemFibGUuc3F1YXJlYCBvciBgcmVzaXphYmxlLnByZXNlcnZlQXNwZWN0UmF0aW9gIG9wdGlvbnMsIHJlc2l6aW5nIGZyb20gb25lIGVkZ2VcbiAgICogd2lsbCBhZmZlY3QgYW5vdGhlci4gRS5nLiB3aXRoIGByZXNpemFibGUuc3F1YXJlYCwgcmVzaXppbmcgdG8gbWFrZSB0aGUgcmlnaHQgZWRnZSBsYXJnZXIgd2lsbCBtYWtlXG4gICAqIHRoZSBib3R0b20gZWRnZSBsYXJnZXIgYnkgdGhlIHNhbWUgYW1vdW50LiBXZSBjYWxsIHRoZXNlICdsaW5rZWQnIGVkZ2VzLiBBbnkgbGlua2VkIGVkZ2VzIHdpbGwgZGVwZW5kXG4gICAqIG9uIHRoZSBhY3RpdmUgZWRnZXMgYW5kIHRoZSBlZGdlIGJlaW5nIGludGVyYWN0ZWQgd2l0aC5cbiAgICovXG4gIGlmIChyZXNpemVPcHRpb25zLnNxdWFyZSB8fCByZXNpemVPcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW8pIHtcbiAgICBjb25zdCBsaW5rZWRFZGdlcyA9IGV4dGVuZCh7fSwgaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXMpXG5cbiAgICBsaW5rZWRFZGdlcy50b3AgICAgPSBsaW5rZWRFZGdlcy50b3AgICAgfHwgKGxpbmtlZEVkZ2VzLmxlZnQgICAmJiAhbGlua2VkRWRnZXMuYm90dG9tKVxuICAgIGxpbmtlZEVkZ2VzLmxlZnQgICA9IGxpbmtlZEVkZ2VzLmxlZnQgICB8fCAobGlua2VkRWRnZXMudG9wICAgICYmICFsaW5rZWRFZGdlcy5yaWdodClcbiAgICBsaW5rZWRFZGdlcy5ib3R0b20gPSBsaW5rZWRFZGdlcy5ib3R0b20gfHwgKGxpbmtlZEVkZ2VzLnJpZ2h0ICAmJiAhbGlua2VkRWRnZXMudG9wKVxuICAgIGxpbmtlZEVkZ2VzLnJpZ2h0ICA9IGxpbmtlZEVkZ2VzLnJpZ2h0ICB8fCAobGlua2VkRWRnZXMuYm90dG9tICYmICFsaW5rZWRFZGdlcy5sZWZ0KVxuXG4gICAgaW50ZXJhY3Rpb24ucHJlcGFyZWQuX2xpbmtlZEVkZ2VzID0gbGlua2VkRWRnZXNcbiAgfVxuICBlbHNlIHtcbiAgICBpbnRlcmFjdGlvbi5wcmVwYXJlZC5fbGlua2VkRWRnZXMgPSBudWxsXG4gIH1cblxuICAvLyBpZiB1c2luZyBgcmVzaXphYmxlLnByZXNlcnZlQXNwZWN0UmF0aW9gIG9wdGlvbiwgcmVjb3JkIGFzcGVjdCByYXRpbyBhdCB0aGUgc3RhcnQgb2YgdGhlIHJlc2l6ZVxuICBpZiAocmVzaXplT3B0aW9ucy5wcmVzZXJ2ZUFzcGVjdFJhdGlvKSB7XG4gICAgaW50ZXJhY3Rpb24ucmVzaXplU3RhcnRBc3BlY3RSYXRpbyA9IHN0YXJ0UmVjdC53aWR0aCAvIHN0YXJ0UmVjdC5oZWlnaHRcbiAgfVxuXG4gIGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzID0ge1xuICAgIHN0YXJ0ICAgICA6IHN0YXJ0UmVjdCxcbiAgICBjdXJyZW50ICAgOiB7XG4gICAgICBsZWZ0OiBzdGFydFJlY3QubGVmdCxcbiAgICAgIHJpZ2h0OiBzdGFydFJlY3QucmlnaHQsXG4gICAgICB0b3A6IHN0YXJ0UmVjdC50b3AsXG4gICAgICBib3R0b206IHN0YXJ0UmVjdC5ib3R0b20sXG4gICAgfSxcbiAgICBpbnZlcnRlZCAgOiBleHRlbmQoe30sIHN0YXJ0UmVjdCksXG4gICAgcHJldmlvdXMgIDogZXh0ZW5kKHt9LCBzdGFydFJlY3QpLFxuICAgIGRlbHRhICAgICA6IHtcbiAgICAgIGxlZnQ6IDAsXG4gICAgICByaWdodCA6IDAsXG4gICAgICB3aWR0aCA6IDAsXG4gICAgICB0b3AgOiAwLFxuICAgICAgYm90dG9tOiAwLFxuICAgICAgaGVpZ2h0OiAwLFxuICAgIH0sXG4gIH1cblxuICBpRXZlbnQuZWRnZXMgPSBpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlc1xuICBpRXZlbnQucmVjdCA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLmludmVydGVkXG4gIGlFdmVudC5kZWx0YVJlY3QgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5kZWx0YVxufVxuXG5mdW5jdGlvbiBtb3ZlICh7IGlFdmVudCwgaW50ZXJhY3Rpb24gfTogeyBpRXZlbnQ6IFJlc2l6ZUV2ZW50LCBpbnRlcmFjdGlvbjogSW50ZXJhY3Rpb24gfSkge1xuICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ3Jlc2l6ZScgfHwgIWludGVyYWN0aW9uLnByZXBhcmVkLmVkZ2VzKSB7IHJldHVybiB9XG5cbiAgY29uc3QgcmVzaXplT3B0aW9ucyA9IGludGVyYWN0aW9uLmludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZVxuICBjb25zdCBpbnZlcnQgPSByZXNpemVPcHRpb25zLmludmVydFxuICBjb25zdCBpbnZlcnRpYmxlID0gaW52ZXJ0ID09PSAncmVwb3NpdGlvbicgfHwgaW52ZXJ0ID09PSAnbmVnYXRlJ1xuXG4gIGxldCBlZGdlcyA9IGludGVyYWN0aW9uLnByZXBhcmVkLmVkZ2VzXG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNoYWRvd1xuICBjb25zdCBzdGFydCAgICAgID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuc3RhcnRcbiAgY29uc3QgY3VycmVudCAgICA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLmN1cnJlbnRcbiAgY29uc3QgaW52ZXJ0ZWQgICA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLmludmVydGVkXG4gIGNvbnN0IGRlbHRhUmVjdCAgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5kZWx0YVxuICBjb25zdCBwcmV2aW91cyAgID0gZXh0ZW5kKGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLnByZXZpb3VzLCBpbnZlcnRlZClcbiAgY29uc3Qgb3JpZ2luYWxFZGdlcyA9IGVkZ2VzXG5cbiAgY29uc3QgZXZlbnREZWx0YSA9IGV4dGVuZCh7fSwgaUV2ZW50LmRlbHRhKVxuXG4gIGlmIChyZXNpemVPcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW8gfHwgcmVzaXplT3B0aW9ucy5zcXVhcmUpIHtcbiAgICAvLyBgcmVzaXplLnByZXNlcnZlQXNwZWN0UmF0aW9gIHRha2VzIHByZWNlZGVuY2Ugb3ZlciBgcmVzaXplLnNxdWFyZWBcbiAgICBjb25zdCBzdGFydEFzcGVjdFJhdGlvID0gcmVzaXplT3B0aW9ucy5wcmVzZXJ2ZUFzcGVjdFJhdGlvXG4gICAgICA/IGludGVyYWN0aW9uLnJlc2l6ZVN0YXJ0QXNwZWN0UmF0aW9cbiAgICAgIDogMVxuXG4gICAgZWRnZXMgPSBpbnRlcmFjdGlvbi5wcmVwYXJlZC5fbGlua2VkRWRnZXNcblxuICAgIGlmICgob3JpZ2luYWxFZGdlcy5sZWZ0ICYmIG9yaWdpbmFsRWRnZXMuYm90dG9tKSB8fFxuICAgICAgICAob3JpZ2luYWxFZGdlcy5yaWdodCAmJiBvcmlnaW5hbEVkZ2VzLnRvcCkpIHtcbiAgICAgIGV2ZW50RGVsdGEueSA9IC1ldmVudERlbHRhLnggLyBzdGFydEFzcGVjdFJhdGlvXG4gICAgfVxuICAgIGVsc2UgaWYgKG9yaWdpbmFsRWRnZXMubGVmdCB8fCBvcmlnaW5hbEVkZ2VzLnJpZ2h0KSB7IGV2ZW50RGVsdGEueSA9IGV2ZW50RGVsdGEueCAvIHN0YXJ0QXNwZWN0UmF0aW8gfVxuICAgIGVsc2UgaWYgKG9yaWdpbmFsRWRnZXMudG9wICB8fCBvcmlnaW5hbEVkZ2VzLmJvdHRvbSkgeyBldmVudERlbHRhLnggPSBldmVudERlbHRhLnkgKiBzdGFydEFzcGVjdFJhdGlvIH1cbiAgfVxuXG4gIC8vIHVwZGF0ZSB0aGUgJ2N1cnJlbnQnIHJlY3Qgd2l0aG91dCBtb2RpZmljYXRpb25zXG4gIGlmIChlZGdlcy50b3ApIHsgY3VycmVudC50b3AgICAgKz0gZXZlbnREZWx0YS55IH1cbiAgaWYgKGVkZ2VzLmJvdHRvbSkgeyBjdXJyZW50LmJvdHRvbSArPSBldmVudERlbHRhLnkgfVxuICBpZiAoZWRnZXMubGVmdCkgeyBjdXJyZW50LmxlZnQgICArPSBldmVudERlbHRhLnggfVxuICBpZiAoZWRnZXMucmlnaHQpIHsgY3VycmVudC5yaWdodCAgKz0gZXZlbnREZWx0YS54IH1cblxuICBpZiAoaW52ZXJ0aWJsZSkge1xuICAgIC8vIGlmIGludmVydGlibGUsIGNvcHkgdGhlIGN1cnJlbnQgcmVjdFxuICAgIGV4dGVuZChpbnZlcnRlZCwgY3VycmVudClcblxuICAgIGlmIChpbnZlcnQgPT09ICdyZXBvc2l0aW9uJykge1xuICAgICAgLy8gc3dhcCBlZGdlIHZhbHVlcyBpZiBuZWNlc3NhcnkgdG8ga2VlcCB3aWR0aC9oZWlnaHQgcG9zaXRpdmVcbiAgICAgIGxldCBzd2FwXG5cbiAgICAgIGlmIChpbnZlcnRlZC50b3AgPiBpbnZlcnRlZC5ib3R0b20pIHtcbiAgICAgICAgc3dhcCA9IGludmVydGVkLnRvcFxuXG4gICAgICAgIGludmVydGVkLnRvcCA9IGludmVydGVkLmJvdHRvbVxuICAgICAgICBpbnZlcnRlZC5ib3R0b20gPSBzd2FwXG4gICAgICB9XG4gICAgICBpZiAoaW52ZXJ0ZWQubGVmdCA+IGludmVydGVkLnJpZ2h0KSB7XG4gICAgICAgIHN3YXAgPSBpbnZlcnRlZC5sZWZ0XG5cbiAgICAgICAgaW52ZXJ0ZWQubGVmdCA9IGludmVydGVkLnJpZ2h0XG4gICAgICAgIGludmVydGVkLnJpZ2h0ID0gc3dhcFxuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICAvLyBpZiBub3QgaW52ZXJ0aWJsZSwgcmVzdHJpY3QgdG8gbWluaW11bSBvZiAweDAgcmVjdFxuICAgIGludmVydGVkLnRvcCAgICA9IE1hdGgubWluKGN1cnJlbnQudG9wLCBzdGFydC5ib3R0b20pXG4gICAgaW52ZXJ0ZWQuYm90dG9tID0gTWF0aC5tYXgoY3VycmVudC5ib3R0b20sIHN0YXJ0LnRvcClcbiAgICBpbnZlcnRlZC5sZWZ0ICAgPSBNYXRoLm1pbihjdXJyZW50LmxlZnQsIHN0YXJ0LnJpZ2h0KVxuICAgIGludmVydGVkLnJpZ2h0ICA9IE1hdGgubWF4KGN1cnJlbnQucmlnaHQsIHN0YXJ0LmxlZnQpXG4gIH1cblxuICBpbnZlcnRlZC53aWR0aCAgPSBpbnZlcnRlZC5yaWdodCAgLSBpbnZlcnRlZC5sZWZ0XG4gIGludmVydGVkLmhlaWdodCA9IGludmVydGVkLmJvdHRvbSAtIGludmVydGVkLnRvcFxuXG4gIGZvciAoY29uc3QgZWRnZSBpbiBpbnZlcnRlZCkge1xuICAgIGRlbHRhUmVjdFtlZGdlXSA9IGludmVydGVkW2VkZ2VdIC0gcHJldmlvdXNbZWRnZV1cbiAgfVxuXG4gIGlFdmVudC5lZGdlcyA9IGludGVyYWN0aW9uLnByZXBhcmVkLmVkZ2VzXG4gIGlFdmVudC5yZWN0ID0gaW52ZXJ0ZWRcbiAgaUV2ZW50LmRlbHRhUmVjdCA9IGRlbHRhUmVjdFxufVxuXG5mdW5jdGlvbiBlbmQgKHsgaUV2ZW50LCBpbnRlcmFjdGlvbiB9OiB7IGlFdmVudDogUmVzaXplRXZlbnQsIGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbiB9KSB7XG4gIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAncmVzaXplJyB8fCAhaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXMpIHsgcmV0dXJuIH1cblxuICBpRXZlbnQuZWRnZXMgPSBpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlc1xuICBpRXZlbnQucmVjdCA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLmludmVydGVkXG4gIGlFdmVudC5kZWx0YVJlY3QgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5kZWx0YVxufVxuXG5mdW5jdGlvbiB1cGRhdGVFdmVudEF4ZXMgKHsgaUV2ZW50LCBpbnRlcmFjdGlvbiwgYWN0aW9uIH06IHsgaUV2ZW50OiBSZXNpemVFdmVudCwgaW50ZXJhY3Rpb246IEludGVyYWN0aW9uLCBhY3Rpb246IEFjdGlvbk5hbWUgfSkge1xuICBpZiAoYWN0aW9uICE9PSBBY3Rpb25OYW1lLlJlc2l6ZSB8fCAhaW50ZXJhY3Rpb24ucmVzaXplQXhlcykgeyByZXR1cm4gfVxuXG4gIGNvbnN0IG9wdGlvbnMgPSBpbnRlcmFjdGlvbi5pbnRlcmFjdGFibGUub3B0aW9uc1xuXG4gIGlmIChvcHRpb25zLnJlc2l6ZS5zcXVhcmUpIHtcbiAgICBpZiAoaW50ZXJhY3Rpb24ucmVzaXplQXhlcyA9PT0gJ3knKSB7XG4gICAgICBpRXZlbnQuZGVsdGEueCA9IGlFdmVudC5kZWx0YS55XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaUV2ZW50LmRlbHRhLnkgPSBpRXZlbnQuZGVsdGEueFxuICAgIH1cbiAgICBpRXZlbnQuYXhlcyA9ICd4eSdcbiAgfVxuICBlbHNlIHtcbiAgICBpRXZlbnQuYXhlcyA9IGludGVyYWN0aW9uLnJlc2l6ZUF4ZXNcblxuICAgIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneCcpIHtcbiAgICAgIGlFdmVudC5kZWx0YS55ID0gMFxuICAgIH1cbiAgICBlbHNlIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneScpIHtcbiAgICAgIGlFdmVudC5kZWx0YS54ID0gMFxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCByZXNpemVcbiJdfQ==