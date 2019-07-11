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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmVzaXplLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxVQUFVLEVBQVMsTUFBTSx3QkFBd0IsQ0FBQTtBQUMxRCxPQUFPLEtBQUssR0FBRyxNQUFNLHVCQUF1QixDQUFBO0FBQzVDLE9BQU8sS0FBSyxHQUFHLE1BQU0sNEJBQTRCLENBQUE7QUFDakQsT0FBTyxNQUFNLE1BQU0sMEJBQTBCLENBQUE7QUFDN0MsT0FBTyxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQStDekMsVUFBa0IsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFBO0FBTXJDLFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsTUFBTSxFQUNKLE9BQU8sRUFDUCxPQUFPO0lBQ1AsMEJBQTBCO0lBQzFCLFlBQVksRUFBRSwyQ0FBMkM7SUFDekQsWUFBWSxFQUNaLFFBQVEsR0FDVCxHQUFHLEtBQUssQ0FBQTtJQUVULGtDQUFrQztJQUVsQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRTtRQUM3QyxXQUFXLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQTtJQUMvQixDQUFDLENBQUMsQ0FBQTtJQUVGLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUM5QyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFFNUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQyxDQUFBO0lBQ3hELFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxlQUFlLENBQUMsQ0FBQTtJQUV2RCxNQUFNLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUNyQyxNQUFNLENBQUMs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Q0FBQyxVQUFVLEtBQUssR0FBRyxFQUFFO1lBQ2xDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtTQUNuQjthQUNJLElBQUksV0FBVyxDQUFDLFVBQVUsS0FBSyxHQUFHLEVBQUU7WUFDdkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ25CO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsZUFBZSxNQUFNLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBY3Rpb25Qcm9wcywgSW50ZXJhY3Rpb24gfSBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0aW9uJ1xuaW1wb3J0IHsgQWN0aW9uTmFtZSwgU2NvcGUgfSBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJ1xuaW1wb3J0ICogYXMgYXJyIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2FycidcbmltcG9ydCAqIGFzIGRvbSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9kb21VdGlscydcbmltcG9ydCBleHRlbmQgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZXh0ZW5kJ1xuaW1wb3J0ICogYXMgaXMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvaXMnXG5cbmV4cG9ydCB0eXBlIEVkZ2VOYW1lID0gJ3RvcCcgfCAnbGVmdCcgfCAnYm90dG9tJyB8ICdyaWdodCdcblxuZXhwb3J0IHR5cGUgUmVzaXphYmxlTWV0aG9kID0gSW50ZXJhY3QuQWN0aW9uTWV0aG9kPEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnM+XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0YWJsZScge1xuICBpbnRlcmZhY2UgSW50ZXJhY3RhYmxlIHtcbiAgICByZXNpemFibGU6IFJlc2l6YWJsZU1ldGhvZFxuICB9XG59XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0aW9uJyB7XG4gIGludGVyZmFjZSBJbnRlcmFjdGlvbiB7XG4gICAgcmVzaXplQXhlczogJ3gnIHwgJ3knIHwgJ3h5J1xuICAgIHJlc2l6ZVJlY3RzOiB7XG4gICAgICBzdGFydDogSW50ZXJhY3QuRnVsbFJlY3RcbiAgICAgIGN1cnJlbnQ6IEludGVyYWN0LlJlY3RcbiAgICAgIGludmVydGVkOiBJbnRlcmFjdC5GdWxsUmVjdFxuICAgICAgcHJldmlvdXM6IEludGVyYWN0LkZ1bGxSZWN0XG4gICAgICBkZWx0YTogSW50ZXJhY3QuRnVsbFJlY3RcbiAgICB9XG4gICAgcmVzaXplU3RhcnRBc3BlY3RSYXRpbzogbnVtYmVyXG4gIH1cblxuICBpbnRlcmZhY2UgQWN0aW9uUHJvcHMge1xuICAgIF9saW5rZWRFZGdlcz86IHsgW2tleTogc3RyaW5nXTogYm9vbGVhbiB9XG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvZGVmYXVsdE9wdGlvbnMnIHtcbiAgaW50ZXJmYWNlIEFjdGlvbkRlZmF1bHRzIHtcbiAgICByZXNpemU6IEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnNcbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9zY29wZScge1xuICBpbnRlcmZhY2UgQWN0aW9ucyB7XG4gICAgW0FjdGlvbk5hbWUuUmVzaXplXT86IHR5cGVvZiByZXNpemVcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcbiAgZW51bSBBY3Rpb25OYW1lIHtcbiAgICBSZXNpemUgPSAncmVzaXplJ1xuICB9XG59XG5cbihBY3Rpb25OYW1lIGFzIGFueSkuUmVzaXplID0gJ3Jlc2l6ZSdcblxuZXhwb3J0IGludGVyZmFjZSBSZXNpemVFdmVudCBleHRlbmRzIEludGVyYWN0LkludGVyYWN0RXZlbnQ8QWN0aW9uTmFtZS5SZXNpemU+IHtcbiAgZGVsdGFSZWN0PzogSW50ZXJhY3QuRnVsbFJlY3Rcbn1cblxuZnVuY3Rpb24gaW5zdGFsbCAoc2NvcGU6IFNjb3BlKSB7XG4gIGNvbnN0IHtcbiAgICBhY3Rpb25zLFxuICAgIGJyb3dzZXIsXG4gICAgLyoqIEBsZW5kcyBJbnRlcmFjdGFibGUgKi9cbiAgICBJbnRlcmFjdGFibGUsIC8vIHRzbGludDpkaXNhYmxlLWxpbmUgbm8tc2hhZG93ZWQtdmFyaWFibGVcbiAgICBpbnRlcmFjdGlvbnMsXG4gICAgZGVmYXVsdHMsXG4gIH0gPSBzY29wZVxuXG4gIC8vIExlc3MgUHJlY2lzaW9uIHdpdGggdG91Y2ggaW5wdXRcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignbmV3JywgKGludGVyYWN0aW9uKSA9PiB7XG4gICAgaW50ZXJhY3Rpb24ucmVzaXplQXhlcyA9ICd4eSdcbiAgfSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLXN0YXJ0Jywgc3RhcnQpXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tbW92ZScsIG1vdmUpXG5cbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FjdGlvbi1zdGFydCcsIHVwZGF0ZUV2ZW50QXhlcylcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FjdGlvbi1tb3ZlJywgdXBkYXRlRXZlbnRBeGVzKVxuXG4gIHJlc2l6ZS5jdXJzb3JzID0gaW5pdEN1cnNvcnMoYnJvd3NlcilcbiAgcmVzaXplLmRlZmF1bHRNYXJnaW4gPSBicm93c2VyLnN1cHBvcnRzVG91Y2ggfHwgYnJvd3Nlci5zdXBwb3J0c1BvaW50ZXJFdmVudCA/IDIwIDogMTBcblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QoZWxlbWVudCkucmVzaXphYmxlKHtcbiAgICogICBvbnN0YXJ0OiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgKiAgIG9ubW92ZSA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAqICAgb25lbmQgIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICpcbiAgICogICBlZGdlczoge1xuICAgKiAgICAgdG9wICAgOiB0cnVlLCAgICAgICAvLyBVc2UgcG9pbnRlciBjb29yZHMgdG8gY2hlY2sgZm9yIHJlc2l6ZS5cbiAgICogICAgIGxlZnQgIDogZmFsc2UsICAgICAgLy8gRGlzYWJsZSByZXNpemluZyBmcm9tIGxlZnQgZWRnZS5cbiAgICogICAgIGJvdHRvbTogJy5yZXNpemUtcycsLy8gUmVzaXplIGlmIHBvaW50ZXIgdGFyZ2V0IG1hdGNoZXMgc2VsZWN0b3JcbiAgICogICAgIHJpZ2h0IDogaGFuZGxlRWwgICAgLy8gUmVzaXplIGlmIHBvaW50ZXIgdGFyZ2V0IGlzIHRoZSBnaXZlbiBFbGVtZW50XG4gICAqICAgfSxcbiAgICpcbiAgICogICAgIC8vIFdpZHRoIGFuZCBoZWlnaHQgY2FuIGJlIGFkanVzdGVkIGluZGVwZW5kZW50bHkuIFdoZW4gYHRydWVgLCB3aWR0aCBhbmRcbiAgICogICAgIC8vIGhlaWdodCBhcmUgYWRqdXN0ZWQgYXQgYSAxOjEgcmF0aW8uXG4gICAqICAgICBzcXVhcmU6IGZhbHNlLFxuICAgKlxuICAgKiAgICAgLy8gV2lkdGggYW5kIGhlaWdodCBjYW4gYmUgYWRqdXN0ZWQgaW5kZXBlbmRlbnRseS4gV2hlbiBgdHJ1ZWAsIHdpZHRoIGFuZFxuICAgKiAgICAgLy8gaGVpZ2h0IG1haW50YWluIHRoZSBhc3BlY3QgcmF0aW8gdGhleSBoYWQgd2hlbiByZXNpemluZyBzdGFydGVkLlxuICAgKiAgICAgcHJlc2VydmVBc3BlY3RSYXRpbzogZmFsc2UsXG4gICAqXG4gICAqICAgLy8gYSB2YWx1ZSBvZiAnbm9uZScgd2lsbCBsaW1pdCB0aGUgcmVzaXplIHJlY3QgdG8gYSBtaW5pbXVtIG9mIDB4MFxuICAgKiAgIC8vICduZWdhdGUnIHdpbGwgYWxsb3cgdGhlIHJlY3QgdG8gaGF2ZSBuZWdhdGl2ZSB3aWR0aC9oZWlnaHRcbiAgICogICAvLyAncmVwb3NpdGlvbicgd2lsbCBrZWVwIHRoZSB3aWR0aC9oZWlnaHQgcG9zaXRpdmUgYnkgc3dhcHBpbmdcbiAgICogICAvLyB0aGUgdG9wIGFuZCBib3R0b20gZWRnZXMgYW5kL29yIHN3YXBwaW5nIHRoZSBsZWZ0IGFuZCByaWdodCBlZGdlc1xuICAgKiAgIGludmVydDogJ25vbmUnIHx8ICduZWdhdGUnIHx8ICdyZXBvc2l0aW9uJ1xuICAgKlxuICAgKiAgIC8vIGxpbWl0IG11bHRpcGxlIHJlc2l6ZXMuXG4gICAqICAgLy8gU2VlIHRoZSBleHBsYW5hdGlvbiBpbiB0aGUge0BsaW5rIEludGVyYWN0YWJsZS5kcmFnZ2FibGV9IGV4YW1wbGVcbiAgICogICBtYXg6IEluZmluaXR5LFxuICAgKiAgIG1heFBlckVsZW1lbnQ6IDEsXG4gICAqIH0pXG4gICAqXG4gICAqIHZhciBpc1Jlc2l6ZWFibGUgPSBpbnRlcmFjdChlbGVtZW50KS5yZXNpemFibGUoKVxuICAgKiBgYGBcbiAgICpcbiAgICogR2V0cyBvciBzZXRzIHdoZXRoZXIgcmVzaXplIGFjdGlvbnMgY2FuIGJlIHBlcmZvcm1lZCBvbiB0aGUgdGFyZ2V0XG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbiB8IG9iamVjdH0gW29wdGlvbnNdIHRydWUvZmFsc2Ugb3IgQW4gb2JqZWN0IHdpdGggZXZlbnRcbiAgICogbGlzdGVuZXJzIHRvIGJlIGZpcmVkIG9uIHJlc2l6ZSBldmVudHMgKG9iamVjdCBtYWtlcyB0aGUgSW50ZXJhY3RhYmxlXG4gICAqIHJlc2l6YWJsZSlcbiAgICogQHJldHVybiB7Ym9vbGVhbiB8IEludGVyYWN0YWJsZX0gQSBib29sZWFuIGluZGljYXRpbmcgaWYgdGhpcyBjYW4gYmUgdGhlXG4gICAqIHRhcmdldCBvZiByZXNpemUgZWxlbWVudHMsIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLnJlc2l6YWJsZSA9IGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsIG9wdGlvbnM6IEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnMgfCBib29sZWFuKSB7XG4gICAgcmV0dXJuIHJlc2l6YWJsZSh0aGlzLCBvcHRpb25zLCBzY29wZSlcbiAgfSBhcyBSZXNpemFibGVNZXRob2RcblxuICBhY3Rpb25zW0FjdGlvbk5hbWUuUmVzaXplXSA9IHJlc2l6ZVxuICBhY3Rpb25zLm5hbWVzLnB1c2goQWN0aW9uTmFtZS5SZXNpemUpXG4gIGFyci5tZXJnZShhY3Rpb25zLmV2ZW50VHlwZXMsIFtcbiAgICAncmVzaXplc3RhcnQnLFxuICAgICdyZXNpemVtb3ZlJyxcbiAgICAncmVzaXplaW5lcnRpYXN0YXJ0JyxcbiAgICAncmVzaXplcmVzdW1lJyxcbiAgICAncmVzaXplZW5kJyxcbiAgXSlcbiAgYWN0aW9ucy5tZXRob2REaWN0LnJlc2l6ZSA9ICdyZXNpemFibGUnXG5cbiAgZGVmYXVsdHMuYWN0aW9ucy5yZXNpemUgPSByZXNpemUuZGVmYXVsdHNcbn1cblxuY29uc3QgcmVzaXplID0ge1xuICBpZDogJ2FjdGlvbnMvcmVzaXplJyxcbiAgaW5zdGFsbCxcbiAgZGVmYXVsdHM6IHtcbiAgICBzcXVhcmU6IGZhbHNlLFxuICAgIHByZXNlcnZlQXNwZWN0UmF0aW86IGZhbHNlLFxuICAgIGF4aXM6ICd4eScsXG5cbiAgICAvLyB1c2UgZGVmYXVsdCBtYXJnaW5cbiAgICBtYXJnaW46IE5hTixcblxuICAgIC8vIG9iamVjdCB3aXRoIHByb3BzIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbSB3aGljaCBhcmVcbiAgICAvLyB0cnVlL2ZhbHNlIHZhbHVlcyB0byByZXNpemUgd2hlbiB0aGUgcG9pbnRlciBpcyBvdmVyIHRoYXQgZWRnZSxcbiAgICAvLyBDU1Mgc2VsZWN0b3JzIHRvIG1hdGNoIHRoZSBoYW5kbGVzIGZvciBlYWNoIGRpcmVjdGlvblxuICAgIC8vIG9yIHRoZSBFbGVtZW50cyBmb3IgZWFjaCBoYW5kbGVcbiAgICBlZGdlczogbnVsbCxcblxuICAgIC8vIGEgdmFsdWUgb2YgJ25vbmUnIHdpbGwgbGltaXQgdGhlIHJlc2l6ZSByZWN0IHRvIGEgbWluaW11bSBvZiAweDBcbiAgICAvLyAnbmVnYXRlJyB3aWxsIGFsb3cgdGhlIHJlY3QgdG8gaGF2ZSBuZWdhdGl2ZSB3aWR0aC9oZWlnaHRcbiAgICAvLyAncmVwb3NpdGlvbicgd2lsbCBrZWVwIHRoZSB3aWR0aC9oZWlnaHQgcG9zaXRpdmUgYnkgc3dhcHBpbmdcbiAgICAvLyB0aGUgdG9wIGFuZCBib3R0b20gZWRnZXMgYW5kL29yIHN3YXBwaW5nIHRoZSBsZWZ0IGFuZCByaWdodCBlZGdlc1xuICAgIGludmVydDogJ25vbmUnLFxuICB9IGFzIEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnMsXG5cbiAgY2hlY2tlciAoXG4gICAgX3BvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLFxuICAgIF9ldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSxcbiAgICBpbnRlcmFjdGFibGU6IEludGVyYWN0LkludGVyYWN0YWJsZSxcbiAgICBlbGVtZW50OiBFbGVtZW50LFxuICAgIGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbixcbiAgICByZWN0OiBJbnRlcmFjdC5SZWN0XG4gICkge1xuICAgIGlmICghcmVjdCkgeyByZXR1cm4gbnVsbCB9XG5cbiAgICBjb25zdCBwYWdlID0gZXh0ZW5kKHt9LCBpbnRlcmFjdGlvbi5jb29yZHMuY3VyLnBhZ2UpXG4gICAgY29uc3Qgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zXG5cbiAgICBpZiAob3B0aW9ucy5yZXNpemUuZW5hYmxlZCkge1xuICAgICAgY29uc3QgcmVzaXplT3B0aW9ucyA9IG9wdGlvbnMucmVzaXplXG4gICAgICBjb25zdCByZXNpemVFZGdlczogeyBbZWRnZTogc3RyaW5nXTogYm9vbGVhbiB9ID0geyBsZWZ0OiBmYWxzZSwgcmlnaHQ6IGZhbHNlLCB0b3A6IGZhbHNlLCBib3R0b206IGZhbHNlIH1cblxuICAgICAgLy8gaWYgdXNpbmcgcmVzaXplLmVkZ2VzXG4gICAgICBpZiAoaXMub2JqZWN0KHJlc2l6ZU9wdGlvbnMuZWRnZXMpKSB7XG4gICAgICAgIGZvciAoY29uc3QgZWRnZSBpbiByZXNpemVFZGdlcykge1xuICAgICAgICAgIHJlc2l6ZUVkZ2VzW2VkZ2VdID0gY2hlY2tSZXNpemVFZGdlKGVkZ2UsXG4gICAgICAgICAgICByZXNpemVPcHRpb25zLmVkZ2VzW2VkZ2VdLFxuICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgIGludGVyYWN0aW9uLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgZWxlbWVudCxcbiAgICAgICAgICAgIHJlY3QsXG4gICAgICAgICAgICByZXNpemVPcHRpb25zLm1hcmdpbiB8fCB0aGlzLmRlZmF1bHRNYXJnaW4pXG4gICAgICAgIH1cblxuICAgICAgICByZXNpemVFZGdlcy5sZWZ0ID0gcmVzaXplRWRnZXMubGVmdCAmJiAhcmVzaXplRWRnZXMucmlnaHRcbiAgICAgICAgcmVzaXplRWRnZXMudG9wICA9IHJlc2l6ZUVkZ2VzLnRvcCAgJiYgIXJlc2l6ZUVkZ2VzLmJvdHRvbVxuXG4gICAgICAgIGlmIChyZXNpemVFZGdlcy5sZWZ0IHx8IHJlc2l6ZUVkZ2VzLnJpZ2h0IHx8IHJlc2l6ZUVkZ2VzLnRvcCB8fCByZXNpemVFZGdlcy5ib3R0b20pIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogJ3Jlc2l6ZScsXG4gICAgICAgICAgICBlZGdlczogcmVzaXplRWRnZXMsXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgcmlnaHQgID0gb3B0aW9ucy5yZXNpemUuYXhpcyAhPT0gJ3knICYmIHBhZ2UueCA+IChyZWN0LnJpZ2h0ICAtIHRoaXMuZGVmYXVsdE1hcmdpbilcbiAgICAgICAgY29uc3QgYm90dG9tID0gb3B0aW9ucy5yZXNpemUuYXhpcyAhPT0gJ3gnICYmIHBhZ2UueSA+IChyZWN0LmJvdHRvbSAtIHRoaXMuZGVmYXVsdE1hcmdpbilcblxuICAgICAgICBpZiAocmlnaHQgfHwgYm90dG9tKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6ICdyZXNpemUnLFxuICAgICAgICAgICAgYXhlczogKHJpZ2h0ID8gJ3gnIDogJycpICsgKGJvdHRvbSA/ICd5JyA6ICcnKSxcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbFxuICB9LFxuXG4gIGN1cnNvcnM6IG51bGwgYXMgUmV0dXJuVHlwZTx0eXBlb2YgaW5pdEN1cnNvcnM+LFxuXG4gIGdldEN1cnNvciAoYWN0aW9uOiBBY3Rpb25Qcm9wcykge1xuICAgIGNvbnN0IGN1cnNvcnMgPSByZXNpemUuY3Vyc29yc1xuXG4gICAgaWYgKGFjdGlvbi5heGlzKSB7XG4gICAgICByZXR1cm4gY3Vyc29yc1thY3Rpb24ubmFtZSArIGFjdGlvbi5heGlzXVxuICAgIH1cbiAgICBlbHNlIGlmIChhY3Rpb24uZWRnZXMpIHtcbiAgICAgIGxldCBjdXJzb3JLZXkgPSAnJ1xuICAgICAgY29uc3QgZWRnZU5hbWVzID0gWyd0b3AnLCAnYm90dG9tJywgJ2xlZnQnLCAncmlnaHQnXVxuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICBpZiAoYWN0aW9uLmVkZ2VzW2VkZ2VOYW1lc1tpXV0pIHtcbiAgICAgICAgICBjdXJzb3JLZXkgKz0gZWRnZU5hbWVzW2ldXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGN1cnNvcnNbY3Vyc29yS2V5XVxuICAgIH1cblxuICAgIHJldHVybiBudWxsXG4gIH0sXG5cbiAgZGVmYXVsdE1hcmdpbjogbnVsbCBhcyBudW1iZXIsXG59XG5cbmZ1bmN0aW9uIHJlc2l6YWJsZSAoaW50ZXJhY3RhYmxlOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsIG9wdGlvbnM6IEludGVyYWN0Lk9yQm9vbGVhbjxJbnRlcmFjdC5SZXNpemFibGVPcHRpb25zPiB8IGJvb2xlYW4sIHNjb3BlOiBTY29wZSkge1xuICBpZiAoaXMub2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplLmVuYWJsZWQgPSBvcHRpb25zLmVuYWJsZWQgIT09IGZhbHNlXG4gICAgaW50ZXJhY3RhYmxlLnNldFBlckFjdGlvbigncmVzaXplJywgb3B0aW9ucylcbiAgICBpbnRlcmFjdGFibGUuc2V0T25FdmVudHMoJ3Jlc2l6ZScsIG9wdGlvbnMpXG5cbiAgICBpZiAoaXMuc3RyaW5nKG9wdGlvbnMuYXhpcykgJiYgL154JHxeeSR8Xnh5JC8udGVzdChvcHRpb25zLmF4aXMpKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUuYXhpcyA9IG9wdGlvbnMuYXhpc1xuICAgIH1cbiAgICBlbHNlIGlmIChvcHRpb25zLmF4aXMgPT09IG51bGwpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5heGlzID0gc2NvcGUuZGVmYXVsdHMuYWN0aW9ucy5yZXNpemUuYXhpc1xuICAgIH1cblxuICAgIGlmIChpcy5ib29sKG9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpbykpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5wcmVzZXJ2ZUFzcGVjdFJhdGlvID0gb3B0aW9ucy5wcmVzZXJ2ZUFzcGVjdFJhdGlvXG4gICAgfVxuICAgIGVsc2UgaWYgKGlzLmJvb2wob3B0aW9ucy5zcXVhcmUpKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUuc3F1YXJlID0gb3B0aW9ucy5zcXVhcmVcbiAgICB9XG5cbiAgICByZXR1cm4gaW50ZXJhY3RhYmxlXG4gIH1cbiAgaWYgKGlzLmJvb2wob3B0aW9ucykpIHtcbiAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUuZW5hYmxlZCA9IG9wdGlvbnNcblxuICAgIHJldHVybiBpbnRlcmFjdGFibGVcbiAgfVxuICByZXR1cm4gaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplXG59XG5cbmZ1bmN0aW9uIGNoZWNrUmVzaXplRWRnZSAobmFtZTogc3RyaW5nLCB2YWx1ZTogYW55LCBwYWdlOiBJbnRlcmFjdC5Qb2ludCwgZWxlbWVudDogTm9kZSwgaW50ZXJhY3RhYmxlRWxlbWVudDogRWxlbWVudCwgcmVjdDogSW50ZXJhY3QuUmVjdCwgbWFyZ2luOiBudW1iZXIpIHtcbiAgLy8gZmFsc2UsICcnLCB1bmRlZmluZWQsIG51bGxcbiAgaWYgKCF2YWx1ZSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIC8vIHRydWUgdmFsdWUsIHVzZSBwb2ludGVyIGNvb3JkcyBhbmQgZWxlbWVudCByZWN0XG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSkge1xuICAgIC8vIGlmIGRpbWVuc2lvbnMgYXJlIG5lZ2F0aXZlLCBcInN3aXRjaFwiIGVkZ2VzXG4gICAgY29uc3Qgd2lkdGggID0gaXMubnVtYmVyKHJlY3Qud2lkdGgpID8gcmVjdC53aWR0aCAgOiByZWN0LnJpZ2h0ICAtIHJlY3QubGVmdFxuICAgIGNvbnN0IGhlaWdodCA9IGlzLm51bWJlcihyZWN0LmhlaWdodCkgPyByZWN0LmhlaWdodCA6IHJlY3QuYm90dG9tIC0gcmVjdC50b3BcblxuICAgIC8vIGRvbid0IHVzZSBtYXJnaW4gZ3JlYXRlciB0aGFuIGhhbGYgdGhlIHJlbGV2ZW50IGRpbWVuc2lvblxuICAgIG1hcmdpbiA9IE1hdGgubWluKG1hcmdpbiwgKG5hbWUgPT09ICdsZWZ0JyB8fCBuYW1lID09PSAncmlnaHQnID8gd2lkdGggOiBoZWlnaHQpIC8gMilcblxuICAgIGlmICh3aWR0aCA8IDApIHtcbiAgICAgIGlmICAgICAgKG5hbWUgPT09ICdsZWZ0JykgIHsgbmFtZSA9ICdyaWdodCcgfVxuICAgICAgZWxzZSBpZiAobmFtZSA9PT0gJ3JpZ2h0JykgeyBuYW1lID0gJ2xlZnQnICB9XG4gICAgfVxuICAgIGlmIChoZWlnaHQgPCAwKSB7XG4gICAgICBpZiAgICAgIChuYW1lID09PSAndG9wJykgICAgeyBuYW1lID0gJ2JvdHRvbScgfVxuICAgICAgZWxzZSBpZiAobmFtZSA9PT0gJ2JvdHRvbScpIHsgbmFtZSA9ICd0b3AnICAgIH1cbiAgICB9XG5cbiAgICBpZiAobmFtZSA9PT0gJ2xlZnQnKSB7IHJldHVybiBwYWdlLnggPCAoKHdpZHRoICA+PSAwID8gcmVjdC5sZWZ0IDogcmVjdC5yaWdodCkgKyBtYXJnaW4pIH1cbiAgICBpZiAobmFtZSA9PT0gJ3RvcCcpIHsgcmV0dXJuIHBhZ2UueSA8ICgoaGVpZ2h0ID49IDAgPyByZWN0LnRvcCA6IHJlY3QuYm90dG9tKSArIG1hcmdpbikgfVxuXG4gICAgaWYgKG5hbWUgPT09ICdyaWdodCcpIHsgcmV0dXJuIHBhZ2UueCA+ICgod2lkdGggID49IDAgPyByZWN0LnJpZ2h0IDogcmVjdC5sZWZ0KSAtIG1hcmdpbikgfVxuICAgIGlmIChuYW1lID09PSAnYm90dG9tJykgeyByZXR1cm4gcGFnZS55ID4gKChoZWlnaHQgPj0gMCA/IHJlY3QuYm90dG9tIDogcmVjdC50b3ApIC0gbWFyZ2luKSB9XG4gIH1cblxuICAvLyB0aGUgcmVtYWluaW5nIGNoZWNrcyByZXF1aXJlIGFuIGVsZW1lbnRcbiAgaWYgKCFpcy5lbGVtZW50KGVsZW1lbnQpKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgcmV0dXJuIGlzLmVsZW1lbnQodmFsdWUpXG4gIC8vIHRoZSB2YWx1ZSBpcyBhbiBlbGVtZW50IHRvIHVzZSBhcyBhIHJlc2l6ZSBoYW5kbGVcbiAgICA/IHZhbHVlID09PSBlbGVtZW50XG4gICAgLy8gb3RoZXJ3aXNlIGNoZWNrIGlmIGVsZW1lbnQgbWF0Y2hlcyB2YWx1ZSBhcyBzZWxlY3RvclxuICAgIDogZG9tLm1hdGNoZXNVcFRvKGVsZW1lbnQsIHZhbHVlLCBpbnRlcmFjdGFibGVFbGVtZW50KVxufVxuXG5mdW5jdGlvbiBpbml0Q3Vyc29ycyAoYnJvd3NlcjogdHlwZW9mIGltcG9ydCAoJ0BpbnRlcmFjdGpzL3V0aWxzL2Jyb3dzZXInKS5kZWZhdWx0KSB7XG4gIHJldHVybiAoYnJvd3Nlci5pc0llOSA/IHtcbiAgICB4IDogJ2UtcmVzaXplJyxcbiAgICB5IDogJ3MtcmVzaXplJyxcbiAgICB4eTogJ3NlLXJlc2l6ZScsXG5cbiAgICB0b3AgICAgICAgIDogJ24tcmVzaXplJyxcbiAgICBsZWZ0ICAgICAgIDogJ3ctcmVzaXplJyxcbiAgICBib3R0b20gICAgIDogJ3MtcmVzaXplJyxcbiAgICByaWdodCAgICAgIDogJ2UtcmVzaXplJyxcbiAgICB0b3BsZWZ0ICAgIDogJ3NlLXJlc2l6ZScsXG4gICAgYm90dG9tcmlnaHQ6ICdzZS1yZXNpemUnLFxuICAgIHRvcHJpZ2h0ICAgOiAnbmUtcmVzaXplJyxcbiAgICBib3R0b21sZWZ0IDogJ25lLXJlc2l6ZScsXG4gIH0gOiB7XG4gICAgeCA6ICdldy1yZXNpemUnLFxuICAgIHkgOiAnbnMtcmVzaXplJyxcbiAgICB4eTogJ253c2UtcmVzaXplJyxcblxuICAgIHRvcCAgICAgICAgOiAnbnMtcmVzaXplJyxcbiAgICBsZWZ0ICAgICAgIDogJ2V3LXJlc2l6ZScsXG4gICAgYm90dG9tICAgICA6ICducy1yZXNpemUnLFxuICAgIHJpZ2h0ICAgICAgOiAnZXctcmVzaXplJyxcbiAgICB0b3BsZWZ0ICAgIDogJ253c2UtcmVzaXplJyxcbiAgICBib3R0b21yaWdodDogJ253c2UtcmVzaXplJyxcbiAgICB0b3ByaWdodCAgIDogJ25lc3ctcmVzaXplJyxcbiAgICBib3R0b21sZWZ0IDogJ25lc3ctcmVzaXplJyxcbiAgfSlcbn1cblxuZnVuY3Rpb24gc3RhcnQgKHsgaUV2ZW50LCBpbnRlcmFjdGlvbiB9OiBJbnRlcmFjdC5TaWduYWxBcmcpIHtcbiAgaWYgKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgIT09ICdyZXNpemUnIHx8ICFpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlcykge1xuICAgIHJldHVyblxuICB9XG5cbiAgY29uc3Qgc3RhcnRSZWN0ID0gaW50ZXJhY3Rpb24ucmVjdFxuICBjb25zdCByZXNpemVPcHRpb25zID0gaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplXG5cbiAgLypcbiAgICogV2hlbiB1c2luZyB0aGUgYHJlc2l6YWJsZS5zcXVhcmVgIG9yIGByZXNpemFibGUucHJlc2VydmVBc3BlY3RSYXRpb2Agb3B0aW9ucywgcmVzaXppbmcgZnJvbSBvbmUgZWRnZVxuICAgKiB3aWxsIGFmZmVjdCBhbm90aGVyLiBFLmcuIHdpdGggYHJlc2l6YWJsZS5zcXVhcmVgLCByZXNpemluZyB0byBtYWtlIHRoZSByaWdodCBlZGdlIGxhcmdlciB3aWxsIG1ha2VcbiAgICogdGhlIGJvdHRvbSBlZGdlIGxhcmdlciBieSB0aGUgc2FtZSBhbW91bnQuIFdlIGNhbGwgdGhlc2UgJ2xpbmtlZCcgZWRnZXMuIEFueSBsaW5rZWQgZWRnZXMgd2lsbCBkZXBlbmRcbiAgICogb24gdGhlIGFjdGl2ZSBlZGdlcyBhbmQgdGhlIGVkZ2UgYmVpbmcgaW50ZXJhY3RlZCB3aXRoLlxuICAgKi9cbiAgaWYgKHJlc2l6ZU9wdGlvbnMuc3F1YXJlIHx8IHJlc2l6ZU9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpbykge1xuICAgIGNvbnN0IGxpbmtlZEVkZ2VzID0gZXh0ZW5kKHt9LCBpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlcylcblxuICAgIGxpbmtlZEVkZ2VzLnRvcCAgICA9IGxpbmtlZEVkZ2VzLnRvcCAgICB8fCAobGlua2VkRWRnZXMubGVmdCAgICYmICFsaW5rZWRFZGdlcy5ib3R0b20pXG4gICAgbGlua2VkRWRnZXMubGVmdCAgID0gbGlua2VkRWRnZXMubGVmdCAgIHx8IChsaW5rZWRFZGdlcy50b3AgICAgJiYgIWxpbmtlZEVkZ2VzLnJpZ2h0KVxuICAgIGxpbmtlZEVkZ2VzLmJvdHRvbSA9IGxpbmtlZEVkZ2VzLmJvdHRvbSB8fCAobGlua2VkRWRnZXMucmlnaHQgICYmICFsaW5rZWRFZGdlcy50b3ApXG4gICAgbGlua2VkRWRnZXMucmlnaHQgID0gbGlua2VkRWRnZXMucmlnaHQgIHx8IChsaW5rZWRFZGdlcy5ib3R0b20gJiYgIWxpbmtlZEVkZ2VzLmxlZnQpXG5cbiAgICBpbnRlcmFjdGlvbi5wcmVwYXJlZC5fbGlua2VkRWRnZXMgPSBsaW5rZWRFZGdlc1xuICB9XG4gIGVsc2Uge1xuICAgIGludGVyYWN0aW9uLnByZXBhcmVkLl9saW5rZWRFZGdlcyA9IG51bGxcbiAgfVxuXG4gIC8vIGlmIHVzaW5nIGByZXNpemFibGUucHJlc2VydmVBc3BlY3RSYXRpb2Agb3B0aW9uLCByZWNvcmQgYXNwZWN0IHJhdGlvIGF0IHRoZSBzdGFydCBvZiB0aGUgcmVzaXplXG4gIGlmIChyZXNpemVPcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW8pIHtcbiAgICBpbnRlcmFjdGlvbi5yZXNpemVTdGFydEFzcGVjdFJhdGlvID0gc3RhcnRSZWN0LndpZHRoIC8gc3RhcnRSZWN0LmhlaWdodFxuICB9XG5cbiAgaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMgPSB7XG4gICAgc3RhcnQgICAgIDogc3RhcnRSZWN0LFxuICAgIGN1cnJlbnQgICA6IGV4dGVuZCh7fSwgc3RhcnRSZWN0KSxcbiAgICBpbnZlcnRlZCAgOiBleHRlbmQoe30sIHN0YXJ0UmVjdCksXG4gICAgcHJldmlvdXMgIDogZXh0ZW5kKHt9LCBzdGFydFJlY3QpLFxuICAgIGRlbHRhICAgICA6IHtcbiAgICAgIGxlZnQ6IDAsXG4gICAgICByaWdodCA6IDAsXG4gICAgICB3aWR0aCA6IDAsXG4gICAgICB0b3AgOiAwLFxuICAgICAgYm90dG9tOiAwLFxuICAgICAgaGVpZ2h0OiAwLFxuICAgIH0sXG4gIH1cblxuICBpRXZlbnQucmVjdCA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLmludmVydGVkXG4gIDsgKGlFdmVudCBhcyBSZXNpemVFdmVudCkuZGVsdGFSZWN0ID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuZGVsdGFcbn1cblxuZnVuY3Rpb24gbW92ZSAoeyBpRXZlbnQsIGludGVyYWN0aW9uIH0pIHtcbiAgaWYgKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgIT09ICdyZXNpemUnIHx8ICFpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlcykgeyByZXR1cm4gfVxuXG4gIGNvbnN0IHJlc2l6ZU9wdGlvbnMgPSBpbnRlcmFjdGlvbi5pbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemVcbiAgY29uc3QgaW52ZXJ0ID0gcmVzaXplT3B0aW9ucy5pbnZlcnRcbiAgY29uc3QgaW52ZXJ0aWJsZSA9IGludmVydCA9PT0gJ3JlcG9zaXRpb24nIHx8IGludmVydCA9PT0gJ25lZ2F0ZSdcblxuICBsZXQgZWRnZXMgPSBpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlc1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcbiAgY29uc3Qgc3RhcnQgICAgICA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLnN0YXJ0XG4gIGNvbnN0IGN1cnJlbnQgICAgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5jdXJyZW50XG4gIGNvbnN0IGludmVydGVkICAgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5pbnZlcnRlZFxuICBjb25zdCBkZWx0YVJlY3QgID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuZGVsdGFcbiAgY29uc3QgcHJldmlvdXMgICA9IGV4dGVuZChpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5wcmV2aW91cywgaW52ZXJ0ZWQpXG4gIGNvbnN0IG9yaWdpbmFsRWRnZXMgPSBlZGdlc1xuXG4gIGNvbnN0IGV2ZW50RGVsdGEgPSBleHRlbmQoe30sIGlFdmVudC5kZWx0YSlcblxuICBpZiAocmVzaXplT3B0aW9ucy5wcmVzZXJ2ZUFzcGVjdFJhdGlvIHx8IHJlc2l6ZU9wdGlvbnMuc3F1YXJlKSB7XG4gICAgLy8gYHJlc2l6ZS5wcmVzZXJ2ZUFzcGVjdFJhdGlvYCB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgYHJlc2l6ZS5zcXVhcmVgXG4gICAgY29uc3Qgc3RhcnRBc3BlY3RSYXRpbyA9IHJlc2l6ZU9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpb1xuICAgICAgPyBpbnRlcmFjdGlvbi5yZXNpemVTdGFydEFzcGVjdFJhdGlvXG4gICAgICA6IDFcblxuICAgIGVkZ2VzID0gaW50ZXJhY3Rpb24ucHJlcGFyZWQuX2xpbmtlZEVkZ2VzXG5cbiAgICBpZiAoKG9yaWdpbmFsRWRnZXMubGVmdCAmJiBvcmlnaW5hbEVkZ2VzLmJvdHRvbSkgfHxcbiAgICAgICAgKG9yaWdpbmFsRWRnZXMucmlnaHQgJiYgb3JpZ2luYWxFZGdlcy50b3ApKSB7XG4gICAgICBldmVudERlbHRhLnkgPSAtZXZlbnREZWx0YS54IC8gc3RhcnRBc3BlY3RSYXRpb1xuICAgIH1cbiAgICBlbHNlIGlmIChvcmlnaW5hbEVkZ2VzLmxlZnQgfHwgb3JpZ2luYWxFZGdlcy5yaWdodCkgeyBldmVudERlbHRhLnkgPSBldmVudERlbHRhLnggLyBzdGFydEFzcGVjdFJhdGlvIH1cbiAgICBlbHNlIGlmIChvcmlnaW5hbEVkZ2VzLnRvcCAgfHwgb3JpZ2luYWxFZGdlcy5ib3R0b20pIHsgZXZlbnREZWx0YS54ID0gZXZlbnREZWx0YS55ICogc3RhcnRBc3BlY3RSYXRpbyB9XG4gIH1cblxuICAvLyB1cGRhdGUgdGhlICdjdXJyZW50JyByZWN0IHdpdGhvdXQgbW9kaWZpY2F0aW9uc1xuICBpZiAoZWRnZXMudG9wKSB7IGN1cnJlbnQudG9wICAgICs9IGV2ZW50RGVsdGEueSB9XG4gIGlmIChlZGdlcy5ib3R0b20pIHsgY3VycmVudC5ib3R0b20gKz0gZXZlbnREZWx0YS55IH1cbiAgaWYgKGVkZ2VzLmxlZnQpIHsgY3VycmVudC5sZWZ0ICAgKz0gZXZlbnREZWx0YS54IH1cbiAgaWYgKGVkZ2VzLnJpZ2h0KSB7IGN1cnJlbnQucmlnaHQgICs9IGV2ZW50RGVsdGEueCB9XG5cbiAgaWYgKGludmVydGlibGUpIHtcbiAgICAvLyBpZiBpbnZlcnRpYmxlLCBjb3B5IHRoZSBjdXJyZW50IHJlY3RcbiAgICBleHRlbmQoaW52ZXJ0ZWQsIGN1cnJlbnQpXG5cbiAgICBpZiAoaW52ZXJ0ID09PSAncmVwb3NpdGlvbicpIHtcbiAgICAgIC8vIHN3YXAgZWRnZSB2YWx1ZXMgaWYgbmVjZXNzYXJ5IHRvIGtlZXAgd2lkdGgvaGVpZ2h0IHBvc2l0aXZlXG4gICAgICBsZXQgc3dhcFxuXG4gICAgICBpZiAoaW52ZXJ0ZWQudG9wID4gaW52ZXJ0ZWQuYm90dG9tKSB7XG4gICAgICAgIHN3YXAgPSBpbnZlcnRlZC50b3BcblxuICAgICAgICBpbnZlcnRlZC50b3AgPSBpbnZlcnRlZC5ib3R0b21cbiAgICAgICAgaW52ZXJ0ZWQuYm90dG9tID0gc3dhcFxuICAgICAgfVxuICAgICAgaWYgKGludmVydGVkLmxlZnQgPiBpbnZlcnRlZC5yaWdodCkge1xuICAgICAgICBzd2FwID0gaW52ZXJ0ZWQubGVmdFxuXG4gICAgICAgIGludmVydGVkLmxlZnQgPSBpbnZlcnRlZC5yaWdodFxuICAgICAgICBpbnZlcnRlZC5yaWdodCA9IHN3YXBcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gaWYgbm90IGludmVydGlibGUsIHJlc3RyaWN0IHRvIG1pbmltdW0gb2YgMHgwIHJlY3RcbiAgICBpbnZlcnRlZC50b3AgICAgPSBNYXRoLm1pbihjdXJyZW50LnRvcCwgc3RhcnQuYm90dG9tKVxuICAgIGludmVydGVkLmJvdHRvbSA9IE1hdGgubWF4KGN1cnJlbnQuYm90dG9tLCBzdGFydC50b3ApXG4gICAgaW52ZXJ0ZWQubGVmdCAgID0gTWF0aC5taW4oY3VycmVudC5sZWZ0LCBzdGFydC5yaWdodClcbiAgICBpbnZlcnRlZC5yaWdodCAgPSBNYXRoLm1heChjdXJyZW50LnJpZ2h0LCBzdGFydC5sZWZ0KVxuICB9XG5cbiAgaW52ZXJ0ZWQud2lkdGggID0gaW52ZXJ0ZWQucmlnaHQgIC0gaW52ZXJ0ZWQubGVmdFxuICBpbnZlcnRlZC5oZWlnaHQgPSBpbnZlcnRlZC5ib3R0b20gLSBpbnZlcnRlZC50b3BcblxuICBmb3IgKGNvbnN0IGVkZ2UgaW4gaW52ZXJ0ZWQpIHtcbiAgICBkZWx0YVJlY3RbZWRnZV0gPSBpbnZlcnRlZFtlZGdlXSAtIHByZXZpb3VzW2VkZ2VdXG4gIH1cblxuICBpRXZlbnQuZWRnZXMgPSBpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlc1xuICBpRXZlbnQucmVjdCA9IGludmVydGVkXG4gIGlFdmVudC5kZWx0YVJlY3QgPSBkZWx0YVJlY3Rcbn1cblxuZnVuY3Rpb24gdXBkYXRlRXZlbnRBeGVzICh7IGludGVyYWN0aW9uLCBpRXZlbnQsIGFjdGlvbiB9KSB7XG4gIGlmIChhY3Rpb24gIT09ICdyZXNpemUnIHx8ICFpbnRlcmFjdGlvbi5yZXNpemVBeGVzKSB7IHJldHVybiB9XG5cbiAgY29uc3Qgb3B0aW9ucyA9IGludGVyYWN0aW9uLmludGVyYWN0YWJsZS5vcHRpb25zXG5cbiAgaWYgKG9wdGlvbnMucmVzaXplLnNxdWFyZSkge1xuICAgIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneScpIHtcbiAgICAgIGlFdmVudC5kZWx0YS54ID0gaUV2ZW50LmRlbHRhLnlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBpRXZlbnQuZGVsdGEueSA9IGlFdmVudC5kZWx0YS54XG4gICAgfVxuICAgIGlFdmVudC5heGVzID0gJ3h5J1xuICB9XG4gIGVsc2Uge1xuICAgIGlFdmVudC5heGVzID0gaW50ZXJhY3Rpb24ucmVzaXplQXhlc1xuXG4gICAgaWYgKGludGVyYWN0aW9uLnJlc2l6ZUF4ZXMgPT09ICd4Jykge1xuICAgICAgaUV2ZW50LmRlbHRhLnkgPSAwXG4gICAgfVxuICAgIGVsc2UgaWYgKGludGVyYWN0aW9uLnJlc2l6ZUF4ZXMgPT09ICd5Jykge1xuICAgICAgaUV2ZW50LmRlbHRhLnggPSAwXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHJlc2l6ZVxuIl19