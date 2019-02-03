import * as utils from '@interactjs/utils';
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
    actions.resize = resize;
    actions.names.push('resize');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmVzaXplLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sS0FBSyxLQUFLLE1BQU0sbUJBQW1CLENBQUE7QUFLMUMsU0FBUyxPQUFPLENBQUUsS0FBWTtJQUM1QixNQUFNLEVBQ0osT0FBTyxFQUNQLE9BQU87SUFDUCwwQkFBMEI7SUFDMUIsWUFBWSxFQUFFLDJDQUEyQztJQUN6RCxZQUFZLEVBQ1osUUFBUSxHQUNULEdBQUcsS0FBSyxDQUFBO0lBRVQsa0NBQWtDO0lBRWxDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLFdBQXdCLEVBQUUsRUFBRTtRQUMxRCxXQUFXLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQTtJQUMvQixDQUFDLENBQUMsQ0FBQTtJQUVGLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUM5QyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFFNUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQyxDQUFBO0lBQ3hELFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxlQUFlLENBQUMsQ0FBQTtJQUV2RCxNQUFNLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUNyQyxNQUFNLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxhQUFhLElBQUksT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtJQUV0Rjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0E0Q0c7SUFDSCxZQUFZLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUF1QyxP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LENBQUMsQ0FBQTtTQUNuQjthQUNJLElBQUksV0FBVyxDQUFDLFVBQVUsS0FBSyxHQUFHLEVBQUU7WUFDdkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ25CO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsZUFBZSxNQUFNLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBY3Rpb24sIEludGVyYWN0aW9uIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbidcbmltcG9ydCB7IFNjb3BlIH0gZnJvbSAnQGludGVyYWN0anMvY29yZS9zY29wZSdcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzJ1xuXG5leHBvcnQgdHlwZSBFZGdlTmFtZSA9ICd0b3AnIHwgJ2xlZnQnIHwgJ2JvdHRvbScgfCAncmlnaHQnXG5leHBvcnQgdHlwZSBSZXNpemFibGVNZXRob2QgPSAob3B0aW9ucz86IEludGVyYWN0Lk9yQm9vbGVhbjxJbnRlcmFjdC5SZXNpemFibGVPcHRpb25zPiB8IGJvb2xlYW4pID0+IEludGVyYWN0LkludGVyYWN0YWJsZSB8IEludGVyYWN0LlJlc2l6YWJsZU9wdGlvbnNcblxuZnVuY3Rpb24gaW5zdGFsbCAoc2NvcGU6IFNjb3BlKSB7XG4gIGNvbnN0IHtcbiAgICBhY3Rpb25zLFxuICAgIGJyb3dzZXIsXG4gICAgLyoqIEBsZW5kcyBJbnRlcmFjdGFibGUgKi9cbiAgICBJbnRlcmFjdGFibGUsIC8vIHRzbGludDpkaXNhYmxlLWxpbmUgbm8tc2hhZG93ZWQtdmFyaWFibGVcbiAgICBpbnRlcmFjdGlvbnMsXG4gICAgZGVmYXVsdHMsXG4gIH0gPSBzY29wZVxuXG4gIC8vIExlc3MgUHJlY2lzaW9uIHdpdGggdG91Y2ggaW5wdXRcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignbmV3JywgKGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbikgPT4ge1xuICAgIGludGVyYWN0aW9uLnJlc2l6ZUF4ZXMgPSAneHknXG4gIH0pXG5cbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FjdGlvbi1zdGFydCcsIHN0YXJ0KVxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLW1vdmUnLCBtb3ZlKVxuXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tc3RhcnQnLCB1cGRhdGVFdmVudEF4ZXMpXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tbW92ZScsIHVwZGF0ZUV2ZW50QXhlcylcblxuICByZXNpemUuY3Vyc29ycyA9IGluaXRDdXJzb3JzKGJyb3dzZXIpXG4gIHJlc2l6ZS5kZWZhdWx0TWFyZ2luID0gYnJvd3Nlci5zdXBwb3J0c1RvdWNoIHx8IGJyb3dzZXIuc3VwcG9ydHNQb2ludGVyRXZlbnQgPyAyMCA6IDEwXG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KGVsZW1lbnQpLnJlc2l6YWJsZSh7XG4gICAqICAgb25zdGFydDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAgICogICBvbm1vdmUgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICAgKiAgIG9uZW5kICA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gICAqXG4gICAqICAgZWRnZXM6IHtcbiAgICogICAgIHRvcCAgIDogdHJ1ZSwgICAgICAgLy8gVXNlIHBvaW50ZXIgY29vcmRzIHRvIGNoZWNrIGZvciByZXNpemUuXG4gICAqICAgICBsZWZ0ICA6IGZhbHNlLCAgICAgIC8vIERpc2FibGUgcmVzaXppbmcgZnJvbSBsZWZ0IGVkZ2UuXG4gICAqICAgICBib3R0b206ICcucmVzaXplLXMnLC8vIFJlc2l6ZSBpZiBwb2ludGVyIHRhcmdldCBtYXRjaGVzIHNlbGVjdG9yXG4gICAqICAgICByaWdodCA6IGhhbmRsZUVsICAgIC8vIFJlc2l6ZSBpZiBwb2ludGVyIHRhcmdldCBpcyB0aGUgZ2l2ZW4gRWxlbWVudFxuICAgKiAgIH0sXG4gICAqXG4gICAqICAgICAvLyBXaWR0aCBhbmQgaGVpZ2h0IGNhbiBiZSBhZGp1c3RlZCBpbmRlcGVuZGVudGx5LiBXaGVuIGB0cnVlYCwgd2lkdGggYW5kXG4gICAqICAgICAvLyBoZWlnaHQgYXJlIGFkanVzdGVkIGF0IGEgMToxIHJhdGlvLlxuICAgKiAgICAgc3F1YXJlOiBmYWxzZSxcbiAgICpcbiAgICogICAgIC8vIFdpZHRoIGFuZCBoZWlnaHQgY2FuIGJlIGFkanVzdGVkIGluZGVwZW5kZW50bHkuIFdoZW4gYHRydWVgLCB3aWR0aCBhbmRcbiAgICogICAgIC8vIGhlaWdodCBtYWludGFpbiB0aGUgYXNwZWN0IHJhdGlvIHRoZXkgaGFkIHdoZW4gcmVzaXppbmcgc3RhcnRlZC5cbiAgICogICAgIHByZXNlcnZlQXNwZWN0UmF0aW86IGZhbHNlLFxuICAgKlxuICAgKiAgIC8vIGEgdmFsdWUgb2YgJ25vbmUnIHdpbGwgbGltaXQgdGhlIHJlc2l6ZSByZWN0IHRvIGEgbWluaW11bSBvZiAweDBcbiAgICogICAvLyAnbmVnYXRlJyB3aWxsIGFsbG93IHRoZSByZWN0IHRvIGhhdmUgbmVnYXRpdmUgd2lkdGgvaGVpZ2h0XG4gICAqICAgLy8gJ3JlcG9zaXRpb24nIHdpbGwga2VlcCB0aGUgd2lkdGgvaGVpZ2h0IHBvc2l0aXZlIGJ5IHN3YXBwaW5nXG4gICAqICAgLy8gdGhlIHRvcCBhbmQgYm90dG9tIGVkZ2VzIGFuZC9vciBzd2FwcGluZyB0aGUgbGVmdCBhbmQgcmlnaHQgZWRnZXNcbiAgICogICBpbnZlcnQ6ICdub25lJyB8fCAnbmVnYXRlJyB8fCAncmVwb3NpdGlvbidcbiAgICpcbiAgICogICAvLyBsaW1pdCBtdWx0aXBsZSByZXNpemVzLlxuICAgKiAgIC8vIFNlZSB0aGUgZXhwbGFuYXRpb24gaW4gdGhlIHtAbGluayBJbnRlcmFjdGFibGUuZHJhZ2dhYmxlfSBleGFtcGxlXG4gICAqICAgbWF4OiBJbmZpbml0eSxcbiAgICogICBtYXhQZXJFbGVtZW50OiAxLFxuICAgKiB9KTtcbiAgICpcbiAgICogdmFyIGlzUmVzaXplYWJsZSA9IGludGVyYWN0KGVsZW1lbnQpLnJlc2l6YWJsZSgpO1xuICAgKiBgYGBcbiAgICpcbiAgICogR2V0cyBvciBzZXRzIHdoZXRoZXIgcmVzaXplIGFjdGlvbnMgY2FuIGJlIHBlcmZvcm1lZCBvbiB0aGUgdGFyZ2V0XG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbiB8IG9iamVjdH0gW29wdGlvbnNdIHRydWUvZmFsc2Ugb3IgQW4gb2JqZWN0IHdpdGggZXZlbnRcbiAgICogbGlzdGVuZXJzIHRvIGJlIGZpcmVkIG9uIHJlc2l6ZSBldmVudHMgKG9iamVjdCBtYWtlcyB0aGUgSW50ZXJhY3RhYmxlXG4gICAqIHJlc2l6YWJsZSlcbiAgICogQHJldHVybiB7Ym9vbGVhbiB8IEludGVyYWN0YWJsZX0gQSBib29sZWFuIGluZGljYXRpbmcgaWYgdGhpcyBjYW4gYmUgdGhlXG4gICAqIHRhcmdldCBvZiByZXNpemUgZWxlbWVudHMsIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLnJlc2l6YWJsZSA9IGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdC5JbnRlcmFjdGFibGUsIG9wdGlvbnM6IEludGVyYWN0LlJlc3RyaWN0T3B0aW9uIHwgYm9vbGVhbikge1xuICAgIHJldHVybiByZXNpemFibGUodGhpcywgb3B0aW9ucywgc2NvcGUpXG4gIH1cblxuICBhY3Rpb25zLnJlc2l6ZSA9IHJlc2l6ZVxuICBhY3Rpb25zLm5hbWVzLnB1c2goJ3Jlc2l6ZScpXG4gIHV0aWxzLmFyci5tZXJnZShhY3Rpb25zLmV2ZW50VHlwZXMsIFtcbiAgICAncmVzaXplc3RhcnQnLFxuICAgICdyZXNpemVtb3ZlJyxcbiAgICAncmVzaXplaW5lcnRpYXN0YXJ0JyxcbiAgICAncmVzaXplcmVzdW1lJyxcbiAgICAncmVzaXplZW5kJyxcbiAgXSlcbiAgYWN0aW9ucy5tZXRob2REaWN0LnJlc2l6ZSA9ICdyZXNpemFibGUnXG5cbiAgZGVmYXVsdHMuYWN0aW9ucy5yZXNpemUgPSByZXNpemUuZGVmYXVsdHNcbn1cblxuY29uc3QgcmVzaXplID0ge1xuICBpbnN0YWxsLFxuICBkZWZhdWx0czoge1xuICAgIHNxdWFyZTogZmFsc2UsXG4gICAgcHJlc2VydmVBc3BlY3RSYXRpbzogZmFsc2UsXG4gICAgYXhpczogJ3h5JyxcblxuICAgIC8vIHVzZSBkZWZhdWx0IG1hcmdpblxuICAgIG1hcmdpbjogTmFOLFxuXG4gICAgLy8gb2JqZWN0IHdpdGggcHJvcHMgbGVmdCwgcmlnaHQsIHRvcCwgYm90dG9tIHdoaWNoIGFyZVxuICAgIC8vIHRydWUvZmFsc2UgdmFsdWVzIHRvIHJlc2l6ZSB3aGVuIHRoZSBwb2ludGVyIGlzIG92ZXIgdGhhdCBlZGdlLFxuICAgIC8vIENTUyBzZWxlY3RvcnMgdG8gbWF0Y2ggdGhlIGhhbmRsZXMgZm9yIGVhY2ggZGlyZWN0aW9uXG4gICAgLy8gb3IgdGhlIEVsZW1lbnRzIGZvciBlYWNoIGhhbmRsZVxuICAgIGVkZ2VzOiBudWxsLFxuXG4gICAgLy8gYSB2YWx1ZSBvZiAnbm9uZScgd2lsbCBsaW1pdCB0aGUgcmVzaXplIHJlY3QgdG8gYSBtaW5pbXVtIG9mIDB4MFxuICAgIC8vICduZWdhdGUnIHdpbGwgYWxvdyB0aGUgcmVjdCB0byBoYXZlIG5lZ2F0aXZlIHdpZHRoL2hlaWdodFxuICAgIC8vICdyZXBvc2l0aW9uJyB3aWxsIGtlZXAgdGhlIHdpZHRoL2hlaWdodCBwb3NpdGl2ZSBieSBzd2FwcGluZ1xuICAgIC8vIHRoZSB0b3AgYW5kIGJvdHRvbSBlZGdlcyBhbmQvb3Igc3dhcHBpbmcgdGhlIGxlZnQgYW5kIHJpZ2h0IGVkZ2VzXG4gICAgaW52ZXJ0OiAnbm9uZScsXG4gIH0gYXMgSW50ZXJhY3QuUmVzaXphYmxlT3B0aW9ucyxcblxuICBjaGVja2VyIChcbiAgICBfcG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsXG4gICAgX2V2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLFxuICAgIGludGVyYWN0YWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLFxuICAgIGVsZW1lbnQ6IEVsZW1lbnQsXG4gICAgaW50ZXJhY3Rpb246IEludGVyYWN0aW9uLFxuICAgIHJlY3Q6IEludGVyYWN0LlJlY3RcbiAgKSB7XG4gICAgaWYgKCFyZWN0KSB7IHJldHVybiBudWxsIH1cblxuICAgIGNvbnN0IHBhZ2UgPSB1dGlscy5leHRlbmQoe30sIGludGVyYWN0aW9uLmNvb3Jkcy5jdXIucGFnZSlcbiAgICBjb25zdCBvcHRpb25zID0gaW50ZXJhY3RhYmxlLm9wdGlvbnNcblxuICAgIGlmIChvcHRpb25zLnJlc2l6ZS5lbmFibGVkKSB7XG4gICAgICBjb25zdCByZXNpemVPcHRpb25zID0gb3B0aW9ucy5yZXNpemVcbiAgICAgIGNvbnN0IHJlc2l6ZUVkZ2VzOiB7IFtlZGdlOiBzdHJpbmddOiBib29sZWFuIH0gPSB7IGxlZnQ6IGZhbHNlLCByaWdodDogZmFsc2UsIHRvcDogZmFsc2UsIGJvdHRvbTogZmFsc2UgfVxuXG4gICAgICAvLyBpZiB1c2luZyByZXNpemUuZWRnZXNcbiAgICAgIGlmICh1dGlscy5pcy5vYmplY3QocmVzaXplT3B0aW9ucy5lZGdlcykpIHtcbiAgICAgICAgZm9yIChjb25zdCBlZGdlIGluIHJlc2l6ZUVkZ2VzKSB7XG4gICAgICAgICAgcmVzaXplRWRnZXNbZWRnZV0gPSBjaGVja1Jlc2l6ZUVkZ2UoZWRnZSxcbiAgICAgICAgICAgIHJlc2l6ZU9wdGlvbnMuZWRnZXNbZWRnZV0sXG4gICAgICAgICAgICBwYWdlLFxuICAgICAgICAgICAgaW50ZXJhY3Rpb24uX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQsXG4gICAgICAgICAgICBlbGVtZW50LFxuICAgICAgICAgICAgcmVjdCxcbiAgICAgICAgICAgIHJlc2l6ZU9wdGlvbnMubWFyZ2luIHx8IHRoaXMuZGVmYXVsdE1hcmdpbilcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc2l6ZUVkZ2VzLmxlZnQgPSByZXNpemVFZGdlcy5sZWZ0ICYmICFyZXNpemVFZGdlcy5yaWdodFxuICAgICAgICByZXNpemVFZGdlcy50b3AgID0gcmVzaXplRWRnZXMudG9wICAmJiAhcmVzaXplRWRnZXMuYm90dG9tXG5cbiAgICAgICAgaWYgKHJlc2l6ZUVkZ2VzLmxlZnQgfHwgcmVzaXplRWRnZXMucmlnaHQgfHwgcmVzaXplRWRnZXMudG9wIHx8IHJlc2l6ZUVkZ2VzLmJvdHRvbSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiAncmVzaXplJyxcbiAgICAgICAgICAgIGVkZ2VzOiByZXNpemVFZGdlcyxcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb25zdCByaWdodCAgPSBvcHRpb25zLnJlc2l6ZS5heGlzICE9PSAneScgJiYgcGFnZS54ID4gKHJlY3QucmlnaHQgIC0gdGhpcy5kZWZhdWx0TWFyZ2luKVxuICAgICAgICBjb25zdCBib3R0b20gPSBvcHRpb25zLnJlc2l6ZS5heGlzICE9PSAneCcgJiYgcGFnZS55ID4gKHJlY3QuYm90dG9tIC0gdGhpcy5kZWZhdWx0TWFyZ2luKVxuXG4gICAgICAgIGlmIChyaWdodCB8fCBib3R0b20pIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogJ3Jlc2l6ZScsXG4gICAgICAgICAgICBheGVzOiAocmlnaHQgPyAneCcgOiAnJykgKyAoYm90dG9tID8gJ3knIDogJycpLFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsXG4gIH0sXG5cbiAgY3Vyc29yczogbnVsbCBhcyB1bmtub3duIGFzIFJldHVyblR5cGU8dHlwZW9mIGluaXRDdXJzb3JzPixcblxuICBnZXRDdXJzb3IgKGFjdGlvbjogQWN0aW9uKSB7XG4gICAgY29uc3QgY3Vyc29ycyA9IHJlc2l6ZS5jdXJzb3JzIGFzIHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH1cbiAgICBpZiAoYWN0aW9uLmF4aXMpIHtcbiAgICAgIHJldHVybiBjdXJzb3JzW2FjdGlvbi5uYW1lICsgYWN0aW9uLmF4aXNdXG4gICAgfVxuICAgIGVsc2UgaWYgKGFjdGlvbi5lZGdlcykge1xuICAgICAgbGV0IGN1cnNvcktleSA9ICcnXG4gICAgICBjb25zdCBlZGdlTmFtZXMgPSBbJ3RvcCcsICdib3R0b20nLCAnbGVmdCcsICdyaWdodCddXG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgIGlmIChhY3Rpb24uZWRnZXNbZWRnZU5hbWVzW2ldXSkge1xuICAgICAgICAgIGN1cnNvcktleSArPSBlZGdlTmFtZXNbaV1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gY3Vyc29yc1tjdXJzb3JLZXldXG4gICAgfVxuXG4gICAgcmV0dXJuIG51bGxcbiAgfSxcblxuICBkZWZhdWx0TWFyZ2luOiBudWxsIGFzIHVua25vd24gYXMgbnVtYmVyLFxufVxuXG5mdW5jdGlvbiByZXNpemFibGUgKGludGVyYWN0YWJsZTogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBvcHRpb25zOiBJbnRlcmFjdC5PckJvb2xlYW48SW50ZXJhY3QuUmVzaXphYmxlT3B0aW9ucz4gfCBib29sZWFuLCBzY29wZTogU2NvcGUpIHtcbiAgaWYgKHV0aWxzLmlzLm9iamVjdChvcHRpb25zKSkge1xuICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5lbmFibGVkID0gb3B0aW9ucy5lbmFibGVkICE9PSBmYWxzZVxuICAgIGludGVyYWN0YWJsZS5zZXRQZXJBY3Rpb24oJ3Jlc2l6ZScsIG9wdGlvbnMpXG4gICAgaW50ZXJhY3RhYmxlLnNldE9uRXZlbnRzKCdyZXNpemUnLCBvcHRpb25zKVxuXG4gICAgaWYgKC9eeCR8XnkkfF54eSQvLnRlc3Qob3B0aW9ucy5heGlzIGFzIHN0cmluZykpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5heGlzID0gb3B0aW9ucy5heGlzXG4gICAgfVxuICAgIGVsc2UgaWYgKG9wdGlvbnMuYXhpcyA9PT0gbnVsbCkge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplLmF4aXMgPSBzY29wZS5kZWZhdWx0cy5hY3Rpb25zLnJlc2l6ZS5heGlzXG4gICAgfVxuXG4gICAgaWYgKHV0aWxzLmlzLmJvb2wob3B0aW9ucy5wcmVzZXJ2ZUFzcGVjdFJhdGlvKSkge1xuICAgICAgaW50ZXJhY3RhYmxlLm9wdGlvbnMucmVzaXplLnByZXNlcnZlQXNwZWN0UmF0aW8gPSBvcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW9cbiAgICB9XG4gICAgZWxzZSBpZiAodXRpbHMuaXMuYm9vbChvcHRpb25zLnNxdWFyZSkpIHtcbiAgICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5zcXVhcmUgPSBvcHRpb25zLnNxdWFyZVxuICAgIH1cblxuICAgIHJldHVybiBpbnRlcmFjdGFibGVcbiAgfVxuICBpZiAodXRpbHMuaXMuYm9vbChvcHRpb25zKSkge1xuICAgIGludGVyYWN0YWJsZS5vcHRpb25zLnJlc2l6ZS5lbmFibGVkID0gb3B0aW9uc1xuXG4gICAgcmV0dXJuIGludGVyYWN0YWJsZVxuICB9XG4gIHJldHVybiBpbnRlcmFjdGFibGUub3B0aW9ucy5yZXNpemVcbn1cblxuZnVuY3Rpb24gY2hlY2tSZXNpemVFZGdlIChuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnksIHBhZ2U6IEludGVyYWN0LlBvaW50LCBlbGVtZW50OiBOb2RlLCBpbnRlcmFjdGFibGVFbGVtZW50OiBFbGVtZW50LCByZWN0OiBJbnRlcmFjdC5SZWN0LCBtYXJnaW46IG51bWJlcikge1xuICAvLyBmYWxzZSwgJycsIHVuZGVmaW5lZCwgbnVsbFxuICBpZiAoIXZhbHVlKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgLy8gdHJ1ZSB2YWx1ZSwgdXNlIHBvaW50ZXIgY29vcmRzIGFuZCBlbGVtZW50IHJlY3RcbiAgaWYgKHZhbHVlID09PSB0cnVlKSB7XG4gICAgLy8gaWYgZGltZW5zaW9ucyBhcmUgbmVnYXRpdmUsIFwic3dpdGNoXCIgZWRnZXNcbiAgICBjb25zdCB3aWR0aCAgPSB1dGlscy5pcy5udW1iZXIocmVjdC53aWR0aCkgPyByZWN0LndpZHRoICA6IHJlY3QucmlnaHQgIC0gcmVjdC5sZWZ0XG4gICAgY29uc3QgaGVpZ2h0ID0gdXRpbHMuaXMubnVtYmVyKHJlY3QuaGVpZ2h0KSA/IHJlY3QuaGVpZ2h0IDogcmVjdC5ib3R0b20gLSByZWN0LnRvcFxuXG4gICAgLy8gZG9uJ3QgdXNlIG1hcmdpbiBncmVhdGVyIHRoYW4gaGFsZiB0aGUgcmVsZXZlbnQgZGltZW5zaW9uXG4gICAgbWFyZ2luID0gTWF0aC5taW4obWFyZ2luLCAobmFtZSA9PT0gJ2xlZnQnIHx8IG5hbWUgPT09ICdyaWdodCcgPyB3aWR0aCA6IGhlaWdodCkgLyAyKVxuXG4gICAgaWYgKHdpZHRoIDwgMCkge1xuICAgICAgaWYgICAgICAobmFtZSA9PT0gJ2xlZnQnKSAgeyBuYW1lID0gJ3JpZ2h0JyB9XG4gICAgICBlbHNlIGlmIChuYW1lID09PSAncmlnaHQnKSB7IG5hbWUgPSAnbGVmdCcgIH1cbiAgICB9XG4gICAgaWYgKGhlaWdodCA8IDApIHtcbiAgICAgIGlmICAgICAgKG5hbWUgPT09ICd0b3AnKSAgICB7IG5hbWUgPSAnYm90dG9tJyB9XG4gICAgICBlbHNlIGlmIChuYW1lID09PSAnYm90dG9tJykgeyBuYW1lID0gJ3RvcCcgICAgfVxuICAgIH1cblxuICAgIGlmIChuYW1lID09PSAnbGVmdCcpIHsgcmV0dXJuIHBhZ2UueCA8ICgod2lkdGggID49IDAgPyByZWN0LmxlZnQgOiByZWN0LnJpZ2h0KSArIG1hcmdpbikgfVxuICAgIGlmIChuYW1lID09PSAndG9wJykgeyByZXR1cm4gcGFnZS55IDwgKChoZWlnaHQgPj0gMCA/IHJlY3QudG9wIDogcmVjdC5ib3R0b20pICsgbWFyZ2luKSB9XG5cbiAgICBpZiAobmFtZSA9PT0gJ3JpZ2h0JykgeyByZXR1cm4gcGFnZS54ID4gKCh3aWR0aCAgPj0gMCA/IHJlY3QucmlnaHQgOiByZWN0LmxlZnQpIC0gbWFyZ2luKSB9XG4gICAgaWYgKG5hbWUgPT09ICdib3R0b20nKSB7IHJldHVybiBwYWdlLnkgPiAoKGhlaWdodCA+PSAwID8gcmVjdC5ib3R0b20gOiByZWN0LnRvcCkgLSBtYXJnaW4pIH1cbiAgfVxuXG4gIC8vIHRoZSByZW1haW5pbmcgY2hlY2tzIHJlcXVpcmUgYW4gZWxlbWVudFxuICBpZiAoIXV0aWxzLmlzLmVsZW1lbnQoZWxlbWVudCkpIHsgcmV0dXJuIGZhbHNlIH1cblxuICByZXR1cm4gdXRpbHMuaXMuZWxlbWVudCh2YWx1ZSlcbiAgLy8gdGhlIHZhbHVlIGlzIGFuIGVsZW1lbnQgdG8gdXNlIGFzIGEgcmVzaXplIGhhbmRsZVxuICAgID8gdmFsdWUgPT09IGVsZW1lbnRcbiAgICAvLyBvdGhlcndpc2UgY2hlY2sgaWYgZWxlbWVudCBtYXRjaGVzIHZhbHVlIGFzIHNlbGVjdG9yXG4gICAgOiB1dGlscy5kb20ubWF0Y2hlc1VwVG8oZWxlbWVudCwgdmFsdWUsIGludGVyYWN0YWJsZUVsZW1lbnQpXG59XG5cbmZ1bmN0aW9uIGluaXRDdXJzb3JzIChicm93c2VyOiB0eXBlb2YgaW1wb3J0KCdAaW50ZXJhY3Rqcy91dGlscy9icm93c2VyJykuZGVmYXVsdCkge1xuICByZXR1cm4gKGJyb3dzZXIuaXNJZTkgPyB7XG4gICAgeCA6ICdlLXJlc2l6ZScsXG4gICAgeSA6ICdzLXJlc2l6ZScsXG4gICAgeHk6ICdzZS1yZXNpemUnLFxuXG4gICAgdG9wICAgICAgICA6ICduLXJlc2l6ZScsXG4gICAgbGVmdCAgICAgICA6ICd3LXJlc2l6ZScsXG4gICAgYm90dG9tICAgICA6ICdzLXJlc2l6ZScsXG4gICAgcmlnaHQgICAgICA6ICdlLXJlc2l6ZScsXG4gICAgdG9wbGVmdCAgICA6ICdzZS1yZXNpemUnLFxuICAgIGJvdHRvbXJpZ2h0OiAnc2UtcmVzaXplJyxcbiAgICB0b3ByaWdodCAgIDogJ25lLXJlc2l6ZScsXG4gICAgYm90dG9tbGVmdCA6ICduZS1yZXNpemUnLFxuICB9IDoge1xuICAgIHggOiAnZXctcmVzaXplJyxcbiAgICB5IDogJ25zLXJlc2l6ZScsXG4gICAgeHk6ICdud3NlLXJlc2l6ZScsXG5cbiAgICB0b3AgICAgICAgIDogJ25zLXJlc2l6ZScsXG4gICAgbGVmdCAgICAgICA6ICdldy1yZXNpemUnLFxuICAgIGJvdHRvbSAgICAgOiAnbnMtcmVzaXplJyxcbiAgICByaWdodCAgICAgIDogJ2V3LXJlc2l6ZScsXG4gICAgdG9wbGVmdCAgICA6ICdud3NlLXJlc2l6ZScsXG4gICAgYm90dG9tcmlnaHQ6ICdud3NlLXJlc2l6ZScsXG4gICAgdG9wcmlnaHQgICA6ICduZXN3LXJlc2l6ZScsXG4gICAgYm90dG9tbGVmdCA6ICduZXN3LXJlc2l6ZScsXG4gIH0pXG59XG5cbmZ1bmN0aW9uIHN0YXJ0ICh7IGlFdmVudCwgaW50ZXJhY3Rpb24gfSkge1xuICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ3Jlc2l6ZScgfHwgIWludGVyYWN0aW9uLnByZXBhcmVkLmVkZ2VzKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICBjb25zdCBzdGFydFJlY3QgPSBpbnRlcmFjdGlvbi50YXJnZXQuZ2V0UmVjdChpbnRlcmFjdGlvbi5lbGVtZW50KVxuICBjb25zdCByZXNpemVPcHRpb25zID0gaW50ZXJhY3Rpb24udGFyZ2V0Lm9wdGlvbnMucmVzaXplXG5cbiAgLypcbiAgICogV2hlbiB1c2luZyB0aGUgYHJlc2l6YWJsZS5zcXVhcmVgIG9yIGByZXNpemFibGUucHJlc2VydmVBc3BlY3RSYXRpb2Agb3B0aW9ucywgcmVzaXppbmcgZnJvbSBvbmUgZWRnZVxuICAgKiB3aWxsIGFmZmVjdCBhbm90aGVyLiBFLmcuIHdpdGggYHJlc2l6YWJsZS5zcXVhcmVgLCByZXNpemluZyB0byBtYWtlIHRoZSByaWdodCBlZGdlIGxhcmdlciB3aWxsIG1ha2VcbiAgICogdGhlIGJvdHRvbSBlZGdlIGxhcmdlciBieSB0aGUgc2FtZSBhbW91bnQuIFdlIGNhbGwgdGhlc2UgJ2xpbmtlZCcgZWRnZXMuIEFueSBsaW5rZWQgZWRnZXMgd2lsbCBkZXBlbmRcbiAgICogb24gdGhlIGFjdGl2ZSBlZGdlcyBhbmQgdGhlIGVkZ2UgYmVpbmcgaW50ZXJhY3RlZCB3aXRoLlxuICAgKi9cbiAgaWYgKHJlc2l6ZU9wdGlvbnMuc3F1YXJlIHx8IHJlc2l6ZU9wdGlvbnMucHJlc2VydmVBc3BlY3RSYXRpbykge1xuICAgIGNvbnN0IGxpbmtlZEVkZ2VzID0gdXRpbHMuZXh0ZW5kKHt9LCBpbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlcylcblxuICAgIGxpbmtlZEVkZ2VzLnRvcCAgICA9IGxpbmtlZEVkZ2VzLnRvcCAgICB8fCAobGlua2VkRWRnZXMubGVmdCAgICYmICFsaW5rZWRFZGdlcy5ib3R0b20pXG4gICAgbGlua2VkRWRnZXMubGVmdCAgID0gbGlua2VkRWRnZXMubGVmdCAgIHx8IChsaW5rZWRFZGdlcy50b3AgICAgJiYgIWxpbmtlZEVkZ2VzLnJpZ2h0KVxuICAgIGxpbmtlZEVkZ2VzLmJvdHRvbSA9IGxpbmtlZEVkZ2VzLmJvdHRvbSB8fCAobGlua2VkRWRnZXMucmlnaHQgICYmICFsaW5rZWRFZGdlcy50b3ApXG4gICAgbGlua2VkRWRnZXMucmlnaHQgID0gbGlua2VkRWRnZXMucmlnaHQgIHx8IChsaW5rZWRFZGdlcy5ib3R0b20gJiYgIWxpbmtlZEVkZ2VzLmxlZnQpXG5cbiAgICBpbnRlcmFjdGlvbi5wcmVwYXJlZC5fbGlua2VkRWRnZXMgPSBsaW5rZWRFZGdlc1xuICB9XG4gIGVsc2Uge1xuICAgIGludGVyYWN0aW9uLnByZXBhcmVkLl9saW5rZWRFZGdlcyA9IG51bGxcbiAgfVxuXG4gIC8vIGlmIHVzaW5nIGByZXNpemFibGUucHJlc2VydmVBc3BlY3RSYXRpb2Agb3B0aW9uLCByZWNvcmQgYXNwZWN0IHJhdGlvIGF0IHRoZSBzdGFydCBvZiB0aGUgcmVzaXplXG4gIGlmIChyZXNpemVPcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW8pIHtcbiAgICBpbnRlcmFjdGlvbi5yZXNpemVTdGFydEFzcGVjdFJhdGlvID0gc3RhcnRSZWN0LndpZHRoIC8gc3RhcnRSZWN0LmhlaWdodFxuICB9XG5cbiAgaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMgPSB7XG4gICAgc3RhcnQgICAgIDogc3RhcnRSZWN0LFxuICAgIGN1cnJlbnQgICA6IHV0aWxzLmV4dGVuZCh7fSwgc3RhcnRSZWN0KSxcbiAgICBpbnZlcnRlZCAgOiB1dGlscy5leHRlbmQoe30sIHN0YXJ0UmVjdCksXG4gICAgcHJldmlvdXMgIDogdXRpbHMuZXh0ZW5kKHt9LCBzdGFydFJlY3QpLFxuICAgIGRlbHRhICAgICA6IHtcbiAgICAgIGxlZnQ6IDAsXG4gICAgICByaWdodCA6IDAsXG4gICAgICB3aWR0aCA6IDAsXG4gICAgICB0b3AgOiAwLFxuICAgICAgYm90dG9tOiAwLFxuICAgICAgaGVpZ2h0OiAwLFxuICAgIH0sXG4gIH1cblxuICBpRXZlbnQucmVjdCA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLmludmVydGVkXG4gIGlFdmVudC5kZWx0YVJlY3QgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5kZWx0YVxufVxuXG5mdW5jdGlvbiBtb3ZlICh7IGlFdmVudCwgaW50ZXJhY3Rpb24gfSkge1xuICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ3Jlc2l6ZScgfHwgIWludGVyYWN0aW9uLnByZXBhcmVkLmVkZ2VzKSB7IHJldHVybiB9XG5cbiAgY29uc3QgcmVzaXplT3B0aW9ucyA9IGludGVyYWN0aW9uLnRhcmdldC5vcHRpb25zLnJlc2l6ZVxuICBjb25zdCBpbnZlcnQgPSByZXNpemVPcHRpb25zLmludmVydFxuICBjb25zdCBpbnZlcnRpYmxlID0gaW52ZXJ0ID09PSAncmVwb3NpdGlvbicgfHwgaW52ZXJ0ID09PSAnbmVnYXRlJ1xuXG4gIGxldCBlZGdlcyA9IGludGVyYWN0aW9uLnByZXBhcmVkLmVkZ2VzXG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNoYWRvd1xuICBjb25zdCBzdGFydCAgICAgID0gaW50ZXJhY3Rpb24ucmVzaXplUmVjdHMuc3RhcnRcbiAgY29uc3QgY3VycmVudCAgICA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLmN1cnJlbnRcbiAgY29uc3QgaW52ZXJ0ZWQgICA9IGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLmludmVydGVkXG4gIGNvbnN0IGRlbHRhUmVjdCAgPSBpbnRlcmFjdGlvbi5yZXNpemVSZWN0cy5kZWx0YVxuICBjb25zdCBwcmV2aW91cyAgID0gdXRpbHMuZXh0ZW5kKGludGVyYWN0aW9uLnJlc2l6ZVJlY3RzLnByZXZpb3VzLCBpbnZlcnRlZClcbiAgY29uc3Qgb3JpZ2luYWxFZGdlcyA9IGVkZ2VzXG5cbiAgY29uc3QgZXZlbnREZWx0YSA9IHV0aWxzLmV4dGVuZCh7fSwgaUV2ZW50LmRlbHRhKVxuXG4gIGlmIChyZXNpemVPcHRpb25zLnByZXNlcnZlQXNwZWN0UmF0aW8gfHwgcmVzaXplT3B0aW9ucy5zcXVhcmUpIHtcbiAgICAvLyBgcmVzaXplLnByZXNlcnZlQXNwZWN0UmF0aW9gIHRha2VzIHByZWNlZGVuY2Ugb3ZlciBgcmVzaXplLnNxdWFyZWBcbiAgICBjb25zdCBzdGFydEFzcGVjdFJhdGlvID0gcmVzaXplT3B0aW9ucy5wcmVzZXJ2ZUFzcGVjdFJhdGlvXG4gICAgICA/IGludGVyYWN0aW9uLnJlc2l6ZVN0YXJ0QXNwZWN0UmF0aW9cbiAgICAgIDogMVxuXG4gICAgZWRnZXMgPSBpbnRlcmFjdGlvbi5wcmVwYXJlZC5fbGlua2VkRWRnZXNcblxuICAgIGlmICgob3JpZ2luYWxFZGdlcy5sZWZ0ICYmIG9yaWdpbmFsRWRnZXMuYm90dG9tKSB8fFxuICAgICAgICAob3JpZ2luYWxFZGdlcy5yaWdodCAmJiBvcmlnaW5hbEVkZ2VzLnRvcCkpIHtcbiAgICAgIGV2ZW50RGVsdGEueSA9IC1ldmVudERlbHRhLnggLyBzdGFydEFzcGVjdFJhdGlvXG4gICAgfVxuICAgIGVsc2UgaWYgKG9yaWdpbmFsRWRnZXMubGVmdCB8fCBvcmlnaW5hbEVkZ2VzLnJpZ2h0KSB7IGV2ZW50RGVsdGEueSA9IGV2ZW50RGVsdGEueCAvIHN0YXJ0QXNwZWN0UmF0aW8gfVxuICAgIGVsc2UgaWYgKG9yaWdpbmFsRWRnZXMudG9wICB8fCBvcmlnaW5hbEVkZ2VzLmJvdHRvbSkgeyBldmVudERlbHRhLnggPSBldmVudERlbHRhLnkgKiBzdGFydEFzcGVjdFJhdGlvIH1cbiAgfVxuXG4gIC8vIHVwZGF0ZSB0aGUgJ2N1cnJlbnQnIHJlY3Qgd2l0aG91dCBtb2RpZmljYXRpb25zXG4gIGlmIChlZGdlcy50b3ApIHsgY3VycmVudC50b3AgICAgKz0gZXZlbnREZWx0YS55IH1cbiAgaWYgKGVkZ2VzLmJvdHRvbSkgeyBjdXJyZW50LmJvdHRvbSArPSBldmVudERlbHRhLnkgfVxuICBpZiAoZWRnZXMubGVmdCkgeyBjdXJyZW50LmxlZnQgICArPSBldmVudERlbHRhLnggfVxuICBpZiAoZWRnZXMucmlnaHQpIHsgY3VycmVudC5yaWdodCAgKz0gZXZlbnREZWx0YS54IH1cblxuICBpZiAoaW52ZXJ0aWJsZSkge1xuICAgIC8vIGlmIGludmVydGlibGUsIGNvcHkgdGhlIGN1cnJlbnQgcmVjdFxuICAgIHV0aWxzLmV4dGVuZChpbnZlcnRlZCwgY3VycmVudClcblxuICAgIGlmIChpbnZlcnQgPT09ICdyZXBvc2l0aW9uJykge1xuICAgICAgLy8gc3dhcCBlZGdlIHZhbHVlcyBpZiBuZWNlc3NhcnkgdG8ga2VlcCB3aWR0aC9oZWlnaHQgcG9zaXRpdmVcbiAgICAgIGxldCBzd2FwXG5cbiAgICAgIGlmIChpbnZlcnRlZC50b3AgPiBpbnZlcnRlZC5ib3R0b20pIHtcbiAgICAgICAgc3dhcCA9IGludmVydGVkLnRvcFxuXG4gICAgICAgIGludmVydGVkLnRvcCA9IGludmVydGVkLmJvdHRvbVxuICAgICAgICBpbnZlcnRlZC5ib3R0b20gPSBzd2FwXG4gICAgICB9XG4gICAgICBpZiAoaW52ZXJ0ZWQubGVmdCA+IGludmVydGVkLnJpZ2h0KSB7XG4gICAgICAgIHN3YXAgPSBpbnZlcnRlZC5sZWZ0XG5cbiAgICAgICAgaW52ZXJ0ZWQubGVmdCA9IGludmVydGVkLnJpZ2h0XG4gICAgICAgIGludmVydGVkLnJpZ2h0ID0gc3dhcFxuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICAvLyBpZiBub3QgaW52ZXJ0aWJsZSwgcmVzdHJpY3QgdG8gbWluaW11bSBvZiAweDAgcmVjdFxuICAgIGludmVydGVkLnRvcCAgICA9IE1hdGgubWluKGN1cnJlbnQudG9wLCBzdGFydC5ib3R0b20pXG4gICAgaW52ZXJ0ZWQuYm90dG9tID0gTWF0aC5tYXgoY3VycmVudC5ib3R0b20sIHN0YXJ0LnRvcClcbiAgICBpbnZlcnRlZC5sZWZ0ICAgPSBNYXRoLm1pbihjdXJyZW50LmxlZnQsIHN0YXJ0LnJpZ2h0KVxuICAgIGludmVydGVkLnJpZ2h0ICA9IE1hdGgubWF4KGN1cnJlbnQucmlnaHQsIHN0YXJ0LmxlZnQpXG4gIH1cblxuICBpbnZlcnRlZC53aWR0aCAgPSBpbnZlcnRlZC5yaWdodCAgLSBpbnZlcnRlZC5sZWZ0XG4gIGludmVydGVkLmhlaWdodCA9IGludmVydGVkLmJvdHRvbSAtIGludmVydGVkLnRvcFxuXG4gIGZvciAoY29uc3QgZWRnZSBpbiBpbnZlcnRlZCkge1xuICAgIGRlbHRhUmVjdFtlZGdlXSA9IGludmVydGVkW2VkZ2VdIC0gcHJldmlvdXNbZWRnZV1cbiAgfVxuXG4gIGlFdmVudC5lZGdlcyA9IGludGVyYWN0aW9uLnByZXBhcmVkLmVkZ2VzXG4gIGlFdmVudC5yZWN0ID0gaW52ZXJ0ZWRcbiAgaUV2ZW50LmRlbHRhUmVjdCA9IGRlbHRhUmVjdFxufVxuXG5mdW5jdGlvbiB1cGRhdGVFdmVudEF4ZXMgKHsgaW50ZXJhY3Rpb24sIGlFdmVudCwgYWN0aW9uIH0pIHtcbiAgaWYgKGFjdGlvbiAhPT0gJ3Jlc2l6ZScgfHwgIWludGVyYWN0aW9uLnJlc2l6ZUF4ZXMpIHsgcmV0dXJuIH1cblxuICBjb25zdCBvcHRpb25zID0gaW50ZXJhY3Rpb24udGFyZ2V0Lm9wdGlvbnNcblxuICBpZiAob3B0aW9ucy5yZXNpemUuc3F1YXJlKSB7XG4gICAgaWYgKGludGVyYWN0aW9uLnJlc2l6ZUF4ZXMgPT09ICd5Jykge1xuICAgICAgaUV2ZW50LmRlbHRhLnggPSBpRXZlbnQuZGVsdGEueVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGlFdmVudC5kZWx0YS55ID0gaUV2ZW50LmRlbHRhLnhcbiAgICB9XG4gICAgaUV2ZW50LmF4ZXMgPSAneHknXG4gIH1cbiAgZWxzZSB7XG4gICAgaUV2ZW50LmF4ZXMgPSBpbnRlcmFjdGlvbi5yZXNpemVBeGVzXG5cbiAgICBpZiAoaW50ZXJhY3Rpb24ucmVzaXplQXhlcyA9PT0gJ3gnKSB7XG4gICAgICBpRXZlbnQuZGVsdGEueSA9IDBcbiAgICB9XG4gICAgZWxzZSBpZiAoaW50ZXJhY3Rpb24ucmVzaXplQXhlcyA9PT0gJ3knKSB7XG4gICAgICBpRXZlbnQuZGVsdGEueCA9IDBcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgcmVzaXplXG4iXX0=