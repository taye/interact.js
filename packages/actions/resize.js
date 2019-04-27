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
    const startRect = interaction.rect;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmVzaXplLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxVQUFVLEVBQVMsTUFBTSx3QkFBd0IsQ0FBQTtBQUMxRCxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBK0N6QyxVQUFrQixDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUE7QUFNckMsU0FBUyxPQUFPLENBQUUsS0FBWTtJQUM1QixNQUFNLEVBQ0osT0FBTyxFQUNQLE9BQU87SUFDUCwwQkFBMEI7SUFDMUIsWUFBWSxFQUFFLDJDQUEyQztJQUN6RCxZQUFZLEVBQ1osUUFBUSxHQUNULEdBQUcsS0FBSyxDQUFBO0lBRVQsa0NBQWtDO0lBRWxDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFO1FBQzdDLFdBQVcsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFBO0lBQy9CLENBQUMsQ0FBQyxDQUFBO0lBRUYsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQzlDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUU1QyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUE7SUFDeEQsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFBO0lBRXZELE1BQU0sQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ3JDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWEsSUFBSSxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBO0lBRXRGOzs7Ozs7Ozs7Ozs7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LElBQUksR0FBRyxJQUFJLENBQUE7S0FDbkI7U0FDSTtRQUNILE1BQU0sQ0FBQyxJQUFJLEdBQUcsV0FBVyxDQUFDLFVBQVUsQ0FBQTtRQUVwQyxJQUFJLFdBQVcsQ0FBQyxVQUFVLEtBQUssR0FBRyxFQUFFO1lBQ2xDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtTQUNuQjthQUNJLElBQUksV0FBVyxDQUFDLFVBQVUsS0FBSyxHQUFHLEVBQUU7WUFDdkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ25CO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsZUFBZSxNQUFNLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBY3Rpb25Qcm9wcywgSW50ZXJhY3Rpb24gfSBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0aW9uJ1xuaW1wb3J0IHsgQWN0aW9uTmFtZSwgU2NvcGUgfSBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJ1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMnXG5cbmV4cG9ydCB0eXBlIEVkZ2VOYW1lID0gJ3RvcCcgfCAnbGVmdCcgfCAnYm90dG9tJyB8ICdyaWdodCdcblxuZXhwb3J0IHR5cGUgUmVzaXphYmxlTWV0aG9kID0gSW50ZXJhY3QuQWN0aW9uTWV0aG9kPEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnM+XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0YWJsZScge1xuICBpbnRlcmZhY2UgSW50ZXJhY3RhYmxlIHtcbiAgICByZXNpemFibGU6IFJlc2l6YWJsZU1ldGhvZFxuICB9XG59XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0aW9uJyB7XG4gIGludGVyZmFjZSBJbnRlcmFjdGlvbiB7XG4gICAgcmVzaXplQXhlczogJ3gnIHwgJ3knIHwgJ3h5J1xuICAgIHJlc2l6ZVJlY3RzOiB7XG4gICAgICBzdGFydDogUmVxdWlyZWQ8SW50ZXJhY3QuUmVjdD5cbiAgICAgIGN1cnJlbnQ6IEludGVyYWN0LlJlY3RcbiAgICAgIGludmVydGVkOiBSZXF1aXJlZDxJbnRlcmFjdC5SZWN0PlxuICAgICAgcHJldmlvdXM6IFJlcXVpcmVkPEludGVyYWN0LlJlY3Q+XG4gICAgICBkZWx0YTogUmVxdWlyZWQ8SW50ZXJhY3QuUmVjdD5cbiAgICB9XG4gICAgcmVzaXplU3RhcnRBc3BlY3RSYXRpbzogbnVtYmVyXG4gIH1cblxuICBpbnRlcmZhY2UgQWN0aW9uUHJvcHMge1xuICAgIF9saW5rZWRFZGdlcz86IHsgW2tleTogc3RyaW5nXTogYm9vbGVhbiB9XG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvZGVmYXVsdE9wdGlvbnMnIHtcbiAgaW50ZXJmYWNlIEFjdGlvbkRlZmF1bHRzIHtcbiAgICByZXNpemU6IEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnNcbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9zY29wZScge1xuICBpbnRlcmZhY2UgQWN0aW9ucyB7XG4gICAgW0FjdGlvbk5hbWUuUmVzaXplXT86IHR5cGVvZiByZXNpemVcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcbiAgZW51bSBBY3Rpb25OYW1lIHtcbiAgICBSZXNpemUgPSAncmVzaXplJ1xuICB9XG59XG5cbihBY3Rpb25OYW1lIGFzIGFueSkuUmVzaXplID0gJ3Jlc2l6ZSdcblxuZXhwb3J0IGludGVyZmFjZSBSZXNpemVFdmVudCBleHRlbmRzIEludGVyYWN0LkludGVyYWN0RXZlbnQ8QWN0aW9uTmFtZS5SZXNpemU+IHtcbiAgZGVsdGFSZWN0PzogUmVxdWlyZWQ8SW50ZXJhY3QuUmVjdD5cbn1cblxuZnVuY3Rpb24gaW5zdGFsbCAoc2NvcGU6IFNjb3BlKSB7XG4gIGNvbnN0IHtcbiAgICBhY3Rpb25zLFxuICAgIGJyb3dzZXIsXG4gICAgLyoqIEBsZW5kcyBJbnRlcmFjdGFibGUgKi9cbiAgICBJbnRlcmFjdGFibGUsIC8vIHRzbGludDpkaXNhYmxlLWxpbmUgbm8tc2hhZG93ZWQtdmFyaWFibGVcbiAgICBpbnRlcmFjdGlvbnMsXG4gICAgZGVmYXVsdHMsXG4gIH0gPSBzY29wZVxuXG4gIC8vIExlc3MgUHJlY2lzaW9uIHdpdGggdG91Y2ggaW5wdXRcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignbmV3JywgKGludGVyYWN0aW9uKSA9PiB7XG4gICAgaW50ZXJhY3Rpb24ucmVzaXplQXhlcyA9ICd4eSdcbiAgfSlcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLXN0YXJ0Jywgc3RhcnQpXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tbW92ZScsIG1vdmUpXG5cbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FjdGlvbi1zdGFydCcsIHVwZGF0ZUV2ZW50QXhlcylcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FjdGlvbi1tb3ZlJywgdXBkYXRlRXZlbnRBeGVzKVxuXG4gIHJlc2l6ZS5jdXJzb3JzID0gaW5pdEN1cnNvcnMoYnJvd3NlcilcbiAgcmVzaXplLmRlZmF1bHRNYXJnaW4gPSBicm93c2VyLnN1cHBvcnRzVG91Y2ggfHwgYnJvd3Nlci5zdXBwb3J0c1BvaW50ZXJFdmVudCA/IDIwIDogMTBcblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QoZWxlbWVudCkucmVzaXphYmxlKHtcbiAgICogICBvbnN0YXJ0OiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgKiAgIG9ubW92ZSA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAqICAgb25lbmQgIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICpcbiAgICogICBlZGdlczoge1xuICAgKiAgICAgdG9wICAgOiB0cnVlLCAgICAgICAvLyBVc2UgcG9pbnRlciBjb29yZHMgdG8gY2hlY2sgZm9yIHJlc2l6ZS5cbiAgICogICAgIGxlZnQgIDogZmFsc2UsICAgICAgLy8gRGlzYWJsZSByZXNpemluZyBmcm9tIGxlZnQgZWRnZS5cbiAgICogICAgIGJvdHRvbTogJy5yZXNpemUtcycsLy8gUmVzaXplIGlmIHBvaW50ZXIgdGFyZ2V0IG1hdGNoZXMgc2VsZWN0b3JcbiAgICogICAgIHJpZ2h0IDogaGFuZGxlRWwgICAgLy8gUmVzaXplIGlmIHBvaW50ZXIgdGFyZ2V0IGlzIHRoZSBnaXZlbiBFbGVtZW50XG4gICAqICAgfSxcbiAgICpcbiAgICogICAgIC8vIFdpZHRoIGFuZCBoZWlnaHQgY2FuIGJlIGFkanVzdGVkIGluZGVwZW5kZW50bHkuIFdoZW4gYHRydWVgLCB3aWR0aCBhbmRcbiAgICogICAgIC8vIGhlaWdodCBhcmUgYWRqdXN0ZWQgYXQgYSAxOjEgcmF0aW8uXG4gICAqICAgICBzcXVhcmU6IGZhbHNlLFxuICAgKlxuICAgKiAgICAgLy8gV2lkdGggYW5kIGhlaWdodCBjYW4gYmUgYWRqdXN0ZWQgaW5kZXBlbmRlbnRseS4gV2hlbiBgdHJ1ZWAsIHdpZHRoIGFuZFxuICAgKiAgICAgLy8gaGVpZ2h0IG1haW50YWluIHRoZSBhc3BlY3QgcmF0aW8gdGhleSBoYWQgd2hlbiByZXNpemluZyBzdGFydGVkLlxuICAgKiAgICAgcHJlc2VydmVBc3BlY3RSYXRpbzogZmFsc2UsXG4gICAqXG4gICAqICAgLy8gYSB2YWx1ZSBvZiAnbm9uZScgd2lsbCBsaW1pdCB0aGUgcmVzaXplIHJlY3QgdG8gYSBtaW5pbXVtIG9mIDB4MFxuICAgKiAgIC8vICduZWdhdGUnIHdpbGwgYWxsb3cgdGhlIHJlY3QgdG8gaGF2ZSBuZWdhdGl2ZSB3aWR0aC9oZWlnaHRcbiAgICogICAvLyAncmVwb3NpdGlvbicgd2lsbCBrZWVwIHRoZSB3aWR0aC9oZWlnaHQgcG9zaXRpdmUgYnkgc3dhcHBpbmdcbiAgICogICAvLyB0aGUgdG9wIGFuZCBib3R0b20gZWRnZXMgYW5kL29yIHN3YXBwaW5nIHRoZSBsZWZ0IGFuZCByaWdodCBlZGdlc1xuICAgKiAgIGludmVydDogJ25vbmUnIHx8ICduZWdhdGUnIHx8ICdyZXBvc2l0aW9uJ1xuICAgKlxuICAgKiAgIC8vIGxpbWl0IG11bHRpcGxlIHJlc2l6ZXMuXG4gICAqICAgLy8gU2VlIHRoZSBleHBsYW5hdGlvbiBpbiB0aGUge0BsaW5rIEludGVyYWN0YWJsZS5kcmFnZ2FibGV9IGV4YW1wbGVcbiAgICogICBtYXg6IEluZmluaXR5LFxuICAgKiAgIG1heFBlckVsZW1lbnQ6IDEsXG4gICAqIH0pXG4gICAqXG4gICAqIHZhciBpc1Jlc2l6ZWFibGUgPSBpbnRlcmFjdChlbGVtZW50KS5yZXNpemFibGUoKVxuICAgKiBgYGBcbiAgICpcbiAgICogR2V0cyBvciBzZXRzIHdoZXRoZXIgcmVzaXplIGFjdGlvbnMgY2FuIGJlIHBlcmZvcm1lZCBvbiB0aGUgdGFyZ2V0XG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbiB8IG9iamVjdH0gW29wdGlvbnNdIHRydWUvZmFsc2Ugb3IgQW4gb2JqZWN0IHdpdGggZXZlbnRcbiAgICogbGlzdGVuZXJzIHRvIGJlIGZpcmVkIG9uIHJlc2l6ZSBldmVudHMgKG9iamVjdCBtYWtlcyB0aGUgSW50ZXJhY3RhYmxlXG4gICAqIHJlc2l6YWJsZSlcbiAgICogQHJldHVybiB7Ym9vbGVhbiB8IEludGVyYWN0YWJsZX0gQSBib29sZWFuIGluZGljYXRpbmcgaWYgdGhpcyBjYW4gYmUgdGhlXG4gICAqIHRhcmdldCBvZiByZXNpemUgZWxlbWVudHMsIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLnJlc2l6YWJsZSA9IGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsIG9wdGlvbnM6IEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnMgfCBib29sZWFuKSB7XG4gICAgcmV0dXJuIHJlc2l6YWJsZSh0aGlzLCBvcHRpb25zLCBzY29wZSlcbiAgfSBhcyBSZXNpemFibGVNZXRob2RcblxuICBhY3Rpb25zW0FjdGlvbk5hbWUuUmVzaXplXSA9IHJlc2l6ZVxuICBhY3Rpb25zLm5hbWVzLnB1c2goQWN0aW9uTmFtZS5SZXNpemUpXG4gIHV0aWxzLmFyci5tZXJnZShhY3Rpb25zLmV2ZW50VHlwZXMsIFtcbiAgICAncmVzaXplc3RhcnQnLFxuICAgICdyZXNpemVtb3ZlJyxcbiAgICAncmVzaXplaW5lcnRpYXN0YXJ0JyxcbiAgICAncmVzaXplcmVzdW1lJyxcbiAgICAncmVzaXplZW5kJyxcbiAgXSlcbiAgYWN0aW9ucy5tZXRob2REaWN0LnJlc2l6ZSA9ICdyZXNpemFibGUnXG5cbiAgZGVmYXVsdHMuYWN0aW9ucy5yZXNpemUgPSByZXNpemUuZGVmYXVsdHNcbn1cblxuY29uc3QgcmVzaXplID0ge1xuICBpZDogJ2FjdGlvbnMvcmVzaXplJyxcbiAgaW5zdGFsbCxcbiAgZGVmYXVsdHM6IHtcbiAgICBzcXVhcmU6IGZhbHNlLFxuICAgIHByZXNlcnZlQXNwZWN0UmF0aW86IGZhbHNlLFxuICAgIGF4aXM6ICd4eScsXG5cbiAgICAvLyB1c2UgZGVmYXVsdCBtYXJnaW5cbiAgICBtYXJnaW46IE5hTixcblxuICAgIC8vIG9iamVjdCB3aXRoIHByb3BzIGxlZnQsIHJpZ2h0LCB0b3AsIGJvdHRvbSB3aGljaCBhcmVcbiAgICAvLyB0cnVlL2ZhbHNlIHZhbHVlcyB0byByZXNpemUgd2hlbiB0aGUgcG9pbnRlciBpcyBvdmVyIHRoYXQgZWRnZSxcbiAgICAvLyBDU1Mgc2VsZWN0b3JzIHRvIG1hdGNoIHRoZSBoYW5kbGVzIGZvciBlYWNoIGRpcmVjdGlvblxuICAgIC8vIG9yIHRoZSBFbGVtZW50cyBmb3IgZWFjaCBoYW5kbGVcbiAgICBlZGdlczogbnVsbCxcblxuICAgIC8vIGEgdmFsdWUgb2YgJ25vbmUnIHdpbGwgbGltaXQgdGhlIHJlc2l6ZSByZWN0IHRvIGEgbWluaW11bSBvZiAweDBcbiAgICAvLyAnbmVnYXRlJyB3aWxsIGFsb3cgdGhlIHJlY3QgdG8gaGF2ZSBuZWdhdGl2ZSB3aWR0aC9oZWlnaHRcbiAgICAvLyAncmVwb3NpdGlvbicgd2lsbCBrZWVwIHRoZSB3aWR0aC9oZWlnaHQgcG9zaXRpdmUgYnkgc3dhcHBpbmdcbiAgICAvLyB0aGUgdG9wIGFuZCBib3R0b20gZWRnZXMgYW5kL29yIHN3YXBwaW5nIHRoZSBsZWZ0IGFuZCByaWdodCBlZGdlc1xuICAgIGludmVydDogJ25vbmUnLFxuICB9IGFzIEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnMsXG5cbiAgY2hlY2tlciAoXG4gICAgX3BvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLFxuICAgIF9ldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSxcbiAgICBpbnRlcmFjdGFibGU6IEludGVyYWN0LkludGVyYWN0YWJsZSxcbiAgICBlbGVtZW50OiBFbGVtZW50LFxuICAgIGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbixcbiAgICByZWN0OiBJbnRlcmFjdC5SZWN0XG4gICkge1xuICAgIGlmICghcmVjdCkgeyByZXR1cm4gbnVsbCB9XG5cbiAgICBjb25zdCBwYWdlID0gdXRpbHMuZXh0ZW5kKHt9LCBpbnRlcmFjdGlvbi5jb29yZHMuY3VyLnBhZ2UpXG4gICAgY29uc3Qgb3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zXG5cbiAgICBpZiAob3B0aW9ucy5yZXNpemUuZW5hYmxlZCkge1xuICAgICAgY29uc3QgcmVzaXplT3B0aW9ucyA9IG9wdGlvbnMucmVzaXplXG4gICAgICBjb25zdCByZXNpemVFZGdlczogeyBbZWRnZTogc3RyaW5nXTogYm9vbGVhbiB9ID0geyBsZWZ0OiBmYWxzZSwgcmlnaHQ6IGZhbHNlLCB0b3A6IGZhbHNlLCBib3R0b206IGZhbHNlIH1cblxuICAgICAgLy8gaWYgdXNpbmcgcmVzaXplLmVkZ2VzXG4gICAgICBpZiAodXRpbHMuaXMub2JqZWN0KHJlc2l6ZU9wdGlvbnMuZWRnZXMpKSB7XG4gICAgICAgIGZvciAoY29uc3QgZWRnZSBpbiByZXNpemVFZGdlcykge1xuICAgICAgICAgIHJlc2l6ZUVkZ2VzW2VkZ2VdID0gY2hlY2tSZXNpemVFZGdlKGVkZ2UsXG4gICAgICAgICAgICByZXNpemVPcHRpb25zLmVkZ2VzW2VkZ2VdLFxuICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgIGludGVyYWN0aW9uLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgZWxlbWVudCxcbiAgICAgICAgICAgIHJlY3QsXG4gICAgICAgICAgICByZXNpemVPcHRpb25zLm1hcmdpbiB8fCB0aGlzLmRlZmF1bHRNYXJnaW4pXG4gICAgICAgIH1cblxuICAgICAgICByZXNpemVFZGdlcy5sZWZ0ID0gcmVzaXplRWRnZXMubGVmdCAmJiAhcmVzaXplRWRnZXMucmlnaHRcbiAgICAgICAgcmVzaXplRWRnZXMudG9wICA9IHJlc2l6ZUVkZ2VzLnRvcCAgJiYgIXJlc2l6ZUVkZ2VzLmJvdHRvbVxuXG4gICAgICAgIGlmIChyZXNpemVFZGdlcy5sZWZ0IHx8IHJlc2l6ZUVkZ2VzLnJpZ2h0IHx8IHJlc2l6ZUVkZ2VzLnRvcCB8fCByZXNpemVFZGdlcy5ib3R0b20pIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogJ3Jlc2l6ZScsXG4gICAgICAgICAgICBlZGdlczogcmVzaXplRWRnZXMsXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgcmlnaHQgID0gb3B0aW9ucy5yZXNpemUuYXhpcyAhPT0gJ3knICYmIHBhZ2UueCA+IChyZWN0LnJpZ2h0ICAtIHRoaXMuZGVmYXVsdE1hcmdpbilcbiAgICAgICAgY29uc3QgYm90dG9tID0gb3B0aW9ucy5yZXNpemUuYXhpcyAhPT0gJ3gnICYmIHBhZ2UueSA+IChyZWN0LmJvdHRvbSAtIHRoaXMuZGVmYXVsdE1hcmdpbilcblxuICAgICAgICBpZiAocmlnaHQgfHwgYm90dG9tKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6ICdyZXNpemUnLFxuICAgICAgICAgICAgYXhlczogKHJpZ2h0ID8gJ3gnIDogJycpICsgKGJvdHRvbSA/ICd5JyA6ICcnKSxcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbFxuICB9LFxuXG4gIGN1cnNvcnM6IG51bGwgYXMgdW5rbm93biBhcyBSZXR1cm5UeXBlPHR5cGVvZiBpbml0Q3Vyc29ycz4sXG5cbiAgZ2V0Q3Vyc29yIChhY3Rpb246IEFjdGlvblByb3BzKSB7XG4gICAgY29uc3QgY3Vyc29ycyA9IHJlc2l6ZS5jdXJzb3JzIGFzIHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH1cbiAgICBpZiAoYWN0aW9uLmF4aXMpIHtcbiAgICAgIHJldHVybiBjdXJzb3JzW2FjdGlvbi5uYW1lICsgYWN0aW9uLmF4aXNdXG4gICAgfVxuICAgIGVsc2UgaWYgKGFjdGlvbi5lZGdlcykge1xuICAgICAgbGV0IGN1cnNvcktleSA9ICcnXG4gICAgICBjb25zdCBlZGdlTmFtZXMgPSBbJ3RvcCcsICdib3R0b20nLCAnbGVmdCcsICdyaWdodCddXG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgIGlmIChhY3Rpb24uZWRnZXNbZWRnZU5hbWVzW2ldXSkge1xuICAgICAgICAgIGN1cnNvcktleSArPSBlZGdlTmFtZXNbaV1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gY3Vyc29yc1tjdXJzb3JLZXldXG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGxcbiAgfSxcblxuICBkZWZhdWx0TWFyZ2luOiBudWxsIGFzIHVua25vd24gYXMgbnVtYmVyLFxufVxuXG5mdW5jdGlvbiByZXNpemFibGUgKGludGVyYWN0YWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBvcHRpb25zOiBJbnRlcmFjdC5PckJvb2xlYW48SW50ZXJhY3QuUmVzaXphYmxlT3B0aW9ucz4gfCBib29sZWFuLCBzY29wZTogU2NvcGUpIHtcbiAgaWYgKHV0aWxzLmlzLm9iamVjdChvcHRpb25zKSkge1xuICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkICE9PSBmYWxzZVxuICAgIGludGVyYWN0YWJsZS5zZXRQZXJBY3Rpb24oJ3Jlc2l6ZScsIG9wdGlvbnMpXG4gICAgaW50ZXJhY3RhYmxlLnNldE9uRXZlbnRzKCdyZXNpemUnLCBvcHRpb25zKVxuXG4gICAgaWYgKHV0aWxzLmlzLnN0cmluZyhvcHRpb25zLmF4aXMpICYmIC9eeCR8XnkkfF54eSQvLnRlc3Qob3B0aW9ucy5heGlzKSkge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplLmF4aXMgPSBvcHRpb25zLmF4aXNcbiAgICB9XG4gICAgZWxzZSBpZiAob3B0aW9ucy5heGlzID09PSBudWxsKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUuYXhpcyA9IHNjb3BlLmRlZmF1bHRzLmFjdGlvbnMucmVzaXplLmF4aXNcbiAgICB9XG5cbiAgICBpZiAodXRpbHMuaXMuYm9vbChvcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW8pKSB7XG4gICAgICBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemUucHJlc2VydmVBc3BlY3RSYXRpbyA9IG9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpb1xuICAgIH1cbiAgICBlbHNlIGlmICh1dGlscy5pcy5ib29sKG9wdGlvbnMuc3F1YXJlKSkge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplLnNxdWFyZSA9IG9wdGlvbnMuc3F1YXJlXG4gICAgfVxuXG4gICAgcmV0dXJuIGludGVyYWN0YWJsZVxuICB9XG4gIGlmICh1dGlscy5pcy5ib29sKG9wdGlvbnMpKSB7XG4gICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplLmVuYWJsZWQgPSBvcHRpb25zXG5cbiAgICByZXR1cm4gaW50ZXJhY3RhYmxlXG4gIH1cbiAgcmV0dXJuIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZVxufVxuXG5mdW5jdGlvbiBjaGVja1Jlc2l6ZUVkZ2UgKG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgcGFnZTogSW50ZXJhY3QuUG9pbnQsIGVsZW1lbnQ6IE5vZGUsIGludGVyYWN0YWJsZUVsZW1lbnQ6IEVsZW1lbnQsIHJlY3Q6IEludGVyYWN0LlJlY3QsIG1hcmdpbjogbnVtYmVyKSB7XG4gIC8vIGZhbHNlLCAnJywgdW5kZWZpbmVkLCBudWxsXG4gIGlmICghdmFsdWUpIHsgcmV0dXJuIGZhbHNlIH1cblxuICAvLyB0cnVlIHZhbHVlLCB1c2UgcG9pbnRlciBjb29yZHMgYW5kIGVsZW1lbnQgcmVjdFxuICBpZiAodmFsdWUgPT09IHRydWUpIHtcbiAgICAvLyBpZiBkaW1lbnNpb25zIGFyZSBuZWdhdGl2ZSwgXCJzd2l0Y2hcIiBlZGdlc1xuICAgIGNvbnN0IHdpZHRoICA9IHV0aWxzLmlzLm51bWJlcihyZWN0LndpZHRoKSA/IHJlY3Qud2lkdGggIDogcmVjdC5yaWdodCAgLSByZWN0LmxlZnRcbiAgICBjb25zdCBoZWlnaHQgPSB1dGlscy5pcy5udW1iZXIocmVjdC5oZWlnaHQpID8gcmVjdC5oZWlnaHQgOiByZWN0LmJvdHRvbSAtIHJlY3QudG9wXG5cbiAgICAvLyBkb24ndCB1c2UgbWFyZ2luIGdyZWF0ZXIgdGhhbiBoYWxmIHRoZSByZWxldmVudCBkaW1lbnNpb25cbiAgICBtYXJnaW4gPSBNYXRoLm1pbihtYXJnaW4sIChuYW1lID09PSAnbGVmdCcgfHwgbmFtZSA9PT0gJ3JpZ2h0JyA/IHdpZHRoIDogaGVpZ2h0KSAvIDIpXG5cbiAgICBpZiAod2lkdGggPCAwKSB7XG4gICAgICBpZiAgICAgIChuYW1lID09PSAnbGVmdCcpICB7IG5hbWUgPSAncmlnaHQnIH1cbiAgICAgIGVsc2UgaWYgKG5hbWUgPT09ICdyaWdodCcpIHsgbmFtZSA9ICdsZWZ0JyAgfVxuICAgIH1cbiAgICBpZiAoaGVpZ2h0IDwgMCkge1xuICAgICAgaWYgICAgICAobmFtZSA9PT0gJ3RvcCcpICAgIHsgbmFtZSA9ICdib3R0b20nIH1cbiAgICAgIGVsc2UgaWYgKG5hbWUgPT09ICdib3R0b20nKSB7IG5hbWUgPSAndG9wJyAgICB9XG4gICAgfVxuXG4gICAgaWYgKG5hbWUgPT09ICdsZWZ0JykgeyByZXR1cm4gcGFnZS54IDwgKCh3aWR0aCAgPj0gMCA/IHJlY3QubGVmdCA6IHJlY3QucmlnaHQpICsgbWFyZ2luKSB9XG4gICAgaWYgKG5hbWUgPT09ICd0b3AnKSB7IHJldHVybiBwYWdlLnkgPCAoKGhlaWdodCA+PSAwID8gcmVjdC50b3AgOiByZWN0LmJvdHRvbSkgKyBtYXJnaW4pIH1cblxuICAgIGlmIChuYW1lID09PSAncmlnaHQnKSB7IHJldHVybiBwYWdlLnggPiAoKHdpZHRoICA+PSAwID8gcmVjdC5yaWdodCA6IHJlY3QubGVmdCkgLSBtYXJnaW4pIH1cbiAgICBpZiAobmFtZSA9PT0gJ2JvdHRvbScpIHsgcmV0dXJuIHBhZ2UueSA+ICgoaGVpZ2h0ID49IDAgPyByZWN0LmJvdHRvbSA6IHJlY3QudG9wKSAtIG1hcmdpbikgfVxuICB9XG5cbiAgLy8gdGhlIHJlbWFpbmluZyBjaGVja3MgcmVxdWlyZSBhbiBlbGVtZW50XG4gIGlmICghdXRpbHMuaXMuZWxlbWVudChlbGVtZW50KSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIHJldHVybiB1dGlscy5pcy5lbGVtZW50KHZhbHVlKVxuICAvLyB0aGUgdmFsdWUgaXMgYW4gZWxlbWVudCB0byB1c2UgYXMgYSByZXNpemUgaGFuZGxlXG4gICAgPyB2YWx1ZSA9PT0gZWxlbWVudFxuICAgIC8vIG90aGVyd2lzZSBjaGVjayBpZiBlbGVtZW50IG1hdGNoZXMgdmFsdWUgYXMgc2VsZWN0b3JcbiAgICA6IHV0aWxzLmRvbS5tYXRjaGVzVXBUbyhlbGVtZW50LCB2YWx1ZSwgaW50ZXJhY3RhYmxlRWxlbWVudClcbn1cblxuZnVuY3Rpb24gaW5pdEN1cnNvcnMgKGJyb3dzZXI6IHR5cGVvZiBpbXBvcnQgKCdAaW50ZXJhY3Rqcy91dGlscy9icm93c2VyJykuZGVmYXVsdCkge1xuICByZXR1cm4gKGJyb3dzZXIuaXNJZTkgPyB7XG4gICAgeCA6ICdlLXJlc2l6ZScsXG4gICAgeSA6ICdzLXJlc2l6ZScsXG4gICAgeHk6ICdzZS1yZXNpemUnLFxuXG4gICAgdG9wICAgICAgICA6ICduLXJlc2l6ZScsXG4gICAgbGVmdCAgICAgICA6ICd3LXJlc2l6ZScsXG4gICAgYm90dG9tICAgICA6ICdzLXJlc2l6ZScsXG4gICAgcmlnaHQgICAgICA6ICdlLXJlc2l6ZScsXG4gICAgdG9wbGVmdCAgICA6ICdzZS1yZXNpemUnLFxuICAgIGJvdHRvbXJpZ2h0OiAnc2UtcmVzaXplJyxcbiAgICB0b3ByaWdodCAgIDogJ25lLXJlc2l6ZScsXG4gICAgYm90dG9tbGVmdCA6ICduZS1yZXNpemUnLFxuICB9IDoge1xuICAgIHggOiAnZXctcmVzaXplJyxcbiAgICB5IDogJ25zLXJlc2l6ZScsXG4gICAgeHk6ICdud3NlLXJlc2l6ZScsXG5cbiAgICB0b3AgICAgICAgIDogJ25zLXJlc2l6ZScsXG4gICAgbGVmdCAgICAgICA6ICdldy1yZXNpemUnLFxuICAgIGJvdHRvbSAgICAgOiAnbnMtcmVzaXplJyxcbiAgICByaWdodCAgICAgIDogJ2V3LXJlc2l6ZScsXG4gICAgdG9wbGVmdCAgICA6ICdud3NlLXJlc2l6ZScsXG4gICAgYm90dG9tcmlnaHQ6ICdud3NlLXJlc2l6ZScsXG4gICAgdG9wcmlnaHQgICA6ICduZXN3LXJlc2l6ZScsXG4gICAgYm90dG9tbGVmdCA6ICduZXN3LXJlc2l6ZScsXG4gIH0pXG59XG5cbmZ1bmN0aW9uIHN0YXJ0ICh7IGlFdmVudCwgaW50ZXJhY3Rpb24gfTogSW50ZXJhY3QuU2lnbmFsQXJnKSB7XG4gIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAncmVzaXplJyB8fCAhaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXMpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGNvbnN0IHN0YXJ0UmVjdCA9IGludGVyYWN0aW9uLnJlY3RcbiAgY29uc3QgcmVzaXplT3B0aW9ucyA9IGludGVyYWN0aW9uLmludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZVxuXG4gIC8qXG4gICAqIFdoZW4gdXNpbmcgdGhlIGByZXNpemFibGUuc3F1YXJlYCBvciBgcmVzaXphYmxlLnByZXNlcnZlQXNwZWN0UmF0aW9gIG9wdGlvbnMsIHJlc2l6aW5nIGZyb20gb25lIGVkZ2VcbiAgICogd2lsbCBhZmZlY3QgYW5vdGhlci4gRS5nLiB3aXRoIGByZXNpemFibGUuc3F1YXJlYCwgcmVzaXppbmcgdG8gbWFrZSB0aGUgcmlnaHQgZWRnZSBsYXJnZXIgd2lsbCBtYWtlXG4gICAqIHRoZSBib3R0b20gZWRnZSBsYXJnZXIgYnkgdGhlIHNhbWUgYW1vdW50LiBXZSBjYWxsIHRoZXNlICdsaW5rZWQnIGVkZ2VzLiBBbnkgbGlua2VkIGVkZ2VzIHdpbGwgZGVwZW5kXG4gICAqIG9uIHRoZSBhY3RpdmUgZWRnZXMgYW5kIHRoZSBlZGdlIGJlaW5nIGludGVyYWN0ZWQgd2l0aC5cbiAgICovXG4gIGlmIChyZXNpemVPcHRpb25zLnNxdWFyZSB8fCByZXNpemVPcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW8pIHtcbiAgICBjb25zdCBsaW5rZWRFZGdlcyA9IHV0aWxzLmV4dGVuZCh7fSwgaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXMpXG5cbiAgICBsaW5rZWRFZGdlcy50b3AgICAgPSBsaW5rZWRFZGdlcy50b3AgICAgfHwgKGxpbmtlZEVkZ2VzLmxlZnQgICAmJiAhbGlua2VkRWRnZXMuYm90dG9tKVxuICAgIGxpbmtlZEVkZ2VzLmxlZnQgICA9IGxpbmtlZEVkZ2VzLmxlZnQgICB8fCAobGlua2VkRWRnZXMudG9wICAgICYmICFsaW5rZWRFZGdlcy5yaWdodClcbiAgICBsaW5rZWRFZGdlcy5ib3R0b20gPSBsaW5rZWRFZGdlcy5ib3R0b20gfHwgKGxpbmtlZEVkZ2VzLnJpZ2h0ICAmJiAhbGlua2VkRWRnZXMudG9wKVxuICAgIGxpbmtlZEVkZ2VzLnJpZ2h0ICA9IGxpbmtlZEVkZ2VzLnJpZ2h0ICB8fCAobGlua2VkRWRnZXMuYm90dG9tICYmICFsaW5rZWRFZGdlcy5sZWZ0KVxuXG4gICAgaW50ZXJhY3Rpb24ucHJlcGFyZWQuX2xpbmtlZEVkZ2VzID0gbGlua2VkRWRnZXNcbiAgfVxuICBlbHNlIHtcbiAgICBpbnRlcmFjdGlvbi5wcmVwYXJlZC5fbGlua2VkRWRnZXMgPSBudWxsXG4gIH1cblxuICAvLyBpZiB1c2luZyBgcmVzaXphYmxlLnByZXNlcnZlQXNwZWN0UmF0aW9gIG9wdGlvbiwgcmVjb3JkIGFzcGVjdCByYXRpbyBhdCB0aGUgc3RhcnQgb2YgdGhlIHJlc2l6ZVxuICBpZiAocmVzaXplT3B0aW9ucy5wcmVzZXJ2ZUFzcGVjdFJhdGlvKSB7XG4gICAgaW50ZXJhY3Rpb24ucmVzaXplU3RhcnRBc3BlY3RSYXRpbyA9IHN0YXJ0UmVjdC53aWR0aCAvIHN0YXJ0UmVjdC5oZWlnaHRcbiAgfVxuXG4gIGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzID0ge1xuICAgIHN0YXJ0ICAgICA6IHN0YXJ0UmVjdCxcbiAgICBjdXJyZW50ICAgOiB1dGlscy5leHRlbmQoe30sIHN0YXJ0UmVjdCksXG4gICAgaW52ZXJ0ZWQgIDogdXRpbHMuZXh0ZW5kKHt9LCBzdGFydFJlY3QpLFxuICAgIHByZXZpb3VzICA6IHV0aWxzLmV4dGVuZCh7fSwgc3RhcnRSZWN0KSxcbiAgICBkZWx0YSAgICAgOiB7XG4gICAgICBsZWZ0OiAwLFxuICAgICAgcmlnaHQgOiAwLFxuICAgICAgd2lkdGggOiAwLFxuICAgICAgdG9wIDogMCxcbiAgICAgIGJvdHRvbTogMCxcbiAgICAgIGhlaWdodDogMCxcbiAgICB9LFxuICB9XG5cbiAgaUV2ZW50LnJlY3QgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5pbnZlcnRlZFxuICA7IChpRXZlbnQgYXMgUmVzaXplRXZlbnQpLmRlbHRhUmVjdCA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLmRlbHRhXG59XG5cbmZ1bmN0aW9uIG1vdmUgKHsgaUV2ZW50LCBpbnRlcmFjdGlvbiB9KSB7XG4gIGlmIChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lICE9PSAncmVzaXplJyB8fCAhaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXMpIHsgcmV0dXJuIH1cblxuICBjb25zdCByZXNpemVPcHRpb25zID0gaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplXG4gIGNvbnN0IGludmVydCA9IHJlc2l6ZU9wdGlvbnMuaW52ZXJ0XG4gIGNvbnN0IGludmVydGlibGUgPSBpbnZlcnQgPT09ICdyZXBvc2l0aW9uJyB8fCBpbnZlcnQgPT09ICduZWdhdGUnXG5cbiAgbGV0IGVkZ2VzID0gaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXNcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tc2hhZG93XG4gIGNvbnN0IHN0YXJ0ICAgICAgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5zdGFydFxuICBjb25zdCBjdXJyZW50ICAgID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuY3VycmVudFxuICBjb25zdCBpbnZlcnRlZCAgID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuaW52ZXJ0ZWRcbiAgY29uc3QgZGVsdGFSZWN0ICA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLmRlbHRhXG4gIGNvbnN0IHByZXZpb3VzICAgPSB1dGlscy5leHRlbmQoaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMucHJldmlvdXMsIGludmVydGVkKVxuICBjb25zdCBvcmlnaW5hbEVkZ2VzID0gZWRnZXNcblxuICBjb25zdCBldmVudERlbHRhID0gdXRpbHMuZXh0ZW5kKHt9LCBpRXZlbnQuZGVsdGEpXG5cbiAgaWYgKHJlc2l6ZU9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpbyB8fCByZXNpemVPcHRpb25zLnNxdWFyZSkge1xuICAgIC8vIGByZXNpemUucHJlc2VydmVBc3BlY3RSYXRpb2AgdGFrZXMgcHJlY2VkZW5jZSBvdmVyIGByZXNpemUuc3F1YXJlYFxuICAgIGNvbnN0IHN0YXJ0QXNwZWN0UmF0aW8gPSByZXNpemVPcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW9cbiAgICAgID8gaW50ZXJhY3Rpb24ucmVzaXplU3RhcnRBc3BlY3RSYXRpb1xuICAgICAgOiAxXG5cbiAgICBlZGdlcyA9IGludGVyYWN0aW9uLnByZXBhcmVkLl9saW5rZWRFZGdlc1xuXG4gICAgaWYgKChvcmlnaW5hbEVkZ2VzLmxlZnQgJiYgb3JpZ2luYWxFZGdlcy5ib3R0b20pIHx8XG4gICAgICAgIChvcmlnaW5hbEVkZ2VzLnJpZ2h0ICYmIG9yaWdpbmFsRWRnZXMudG9wKSkge1xuICAgICAgZXZlbnREZWx0YS55ID0gLWV2ZW50RGVsdGEueCAvIHN0YXJ0QXNwZWN0UmF0aW9cbiAgICB9XG4gICAgZWxzZSBpZiAob3JpZ2luYWxFZGdlcy5sZWZ0IHx8IG9yaWdpbmFsRWRnZXMucmlnaHQpIHsgZXZlbnREZWx0YS55ID0gZXZlbnREZWx0YS54IC8gc3RhcnRBc3BlY3RSYXRpbyB9XG4gICAgZWxzZSBpZiAob3JpZ2luYWxFZGdlcy50b3AgIHx8IG9yaWdpbmFsRWRnZXMuYm90dG9tKSB7IGV2ZW50RGVsdGEueCA9IGV2ZW50RGVsdGEueSAqIHN0YXJ0QXNwZWN0UmF0aW8gfVxuICB9XG5cbiAgLy8gdXBkYXRlIHRoZSAnY3VycmVudCcgcmVjdCB3aXRob3V0IG1vZGlmaWNhdGlvbnNcbiAgaWYgKGVkZ2VzLnRvcCkgeyBjdXJyZW50LnRvcCAgICArPSBldmVudERlbHRhLnkgfVxuICBpZiAoZWRnZXMuYm90dG9tKSB7IGN1cnJlbnQuYm90dG9tICs9IGV2ZW50RGVsdGEueSB9XG4gIGlmIChlZGdlcy5sZWZ0KSB7IGN1cnJlbnQubGVmdCAgICs9IGV2ZW50RGVsdGEueCB9XG4gIGlmIChlZGdlcy5yaWdodCkgeyBjdXJyZW50LnJpZ2h0ICArPSBldmVudERlbHRhLnggfVxuXG4gIGlmIChpbnZlcnRpYmxlKSB7XG4gICAgLy8gaWYgaW52ZXJ0aWJsZSwgY29weSB0aGUgY3VycmVudCByZWN0XG4gICAgdXRpbHMuZXh0ZW5kKGludmVydGVkLCBjdXJyZW50KVxuXG4gICAgaWYgKGludmVydCA9PT0gJ3JlcG9zaXRpb24nKSB7XG4gICAgICAvLyBzd2FwIGVkZ2UgdmFsdWVzIGlmIG5lY2Vzc2FyeSB0byBrZWVwIHdpZHRoL2hlaWdodCBwb3NpdGl2ZVxuICAgICAgbGV0IHN3YXBcblxuICAgICAgaWYgKGludmVydGVkLnRvcCA+IGludmVydGVkLmJvdHRvbSkge1xuICAgICAgICBzd2FwID0gaW52ZXJ0ZWQudG9wXG5cbiAgICAgICAgaW52ZXJ0ZWQudG9wID0gaW52ZXJ0ZWQuYm90dG9tXG4gICAgICAgIGludmVydGVkLmJvdHRvbSA9IHN3YXBcbiAgICAgIH1cbiAgICAgIGlmIChpbnZlcnRlZC5sZWZ0ID4gaW52ZXJ0ZWQucmlnaHQpIHtcbiAgICAgICAgc3dhcCA9IGludmVydGVkLmxlZnRcblxuICAgICAgICBpbnZlcnRlZC5sZWZ0ID0gaW52ZXJ0ZWQucmlnaHRcbiAgICAgICAgaW52ZXJ0ZWQucmlnaHQgPSBzd2FwXG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIC8vIGlmIG5vdCBpbnZlcnRpYmxlLCByZXN0cmljdCB0byBtaW5pbXVtIG9mIDB4MCByZWN0XG4gICAgaW52ZXJ0ZWQudG9wICAgID0gTWF0aC5taW4oY3VycmVudC50b3AsIHN0YXJ0LmJvdHRvbSlcbiAgICBpbnZlcnRlZC5ib3R0b20gPSBNYXRoLm1heChjdXJyZW50LmJvdHRvbSwgc3RhcnQudG9wKVxuICAgIGludmVydGVkLmxlZnQgICA9IE1hdGgubWluKGN1cnJlbnQubGVmdCwgc3RhcnQucmlnaHQpXG4gICAgaW52ZXJ0ZWQucmlnaHQgID0gTWF0aC5tYXgoY3VycmVudC5yaWdodCwgc3RhcnQubGVmdClcbiAgfVxuXG4gIGludmVydGVkLndpZHRoICA9IGludmVydGVkLnJpZ2h0ICAtIGludmVydGVkLmxlZnRcbiAgaW52ZXJ0ZWQuaGVpZ2h0ID0gaW52ZXJ0ZWQuYm90dG9tIC0gaW52ZXJ0ZWQudG9wXG5cbiAgZm9yIChjb25zdCBlZGdlIGluIGludmVydGVkKSB7XG4gICAgZGVsdGFSZWN0W2VkZ2VdID0gaW52ZXJ0ZWRbZWRnZV0gLSBwcmV2aW91c1tlZGdlXVxuICB9XG5cbiAgaUV2ZW50LmVkZ2VzID0gaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXNcbiAgaUV2ZW50LnJlY3QgPSBpbnZlcnRlZFxuICBpRXZlbnQuZGVsdGFSZWN0ID0gZGVsdGFSZWN0XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUV2ZW50QXhlcyAoeyBpbnRlcmFjdGlvbiwgaUV2ZW50LCBhY3Rpb24gfSkge1xuICBpZiAoYWN0aW9uICE9PSAncmVzaXplJyB8fCAhaW50ZXJhY3Rpb24ucmVzaXplQXhlcykgeyByZXR1cm4gfVxuXG4gIGNvbnN0IG9wdGlvbnMgPSBpbnRlcmFjdGlvbi5pbnRlcmFjdGFibGUub3B0aW9uc1xuXG4gIGlmIChvcHRpb25zLnJlc2l6ZS5zcXVhcmUpIHtcbiAgICBpZiAoaW50ZXJhY3Rpb24ucmVzaXplQXhlcyA9PT0gJ3knKSB7XG4gICAgICBpRXZlbnQuZGVsdGEueCA9IGlFdmVudC5kZWx0YS55XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaUV2ZW50LmRlbHRhLnkgPSBpRXZlbnQuZGVsdGEueFxuICAgIH1cbiAgICBpRXZlbnQuYXhlcyA9ICd4eSdcbiAgfVxuICBlbHNlIHtcbiAgICBpRXZlbnQuYXhlcyA9IGludGVyYWN0aW9uLnJlc2l6ZUF4ZXNcblxuICAgIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneCcpIHtcbiAgICAgIGlFdmVudC5kZWx0YS55ID0gMFxuICAgIH1cbiAgICBlbHNlIGlmIChpbnRlcmFjdGlvbi5yZXNpemVBeGVzID09PSAneScpIHtcbiAgICAgIGlFdmVudC5kZWx0YS54ID0gMFxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCByZXNpemVcbiJdfQ==