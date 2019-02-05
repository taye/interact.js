import { ActionName } from '@interactjs/core/scope';
import * as arr from '@interactjs/utils/arr';
import * as is from '@interactjs/utils/is';
ActionName.Drag = 'drag';
function install(scope) {
    const { actions, Interactable, interactions, defaults, } = scope;
    interactions.signals.on('before-action-move', beforeMove);
    interactions.signals.on('action-resume', beforeMove);
    // dragmove
    interactions.signals.on('action-move', move);
    Interactable.prototype.draggable = drag.draggable;
    actions.drag = drag;
    actions.names.push(ActionName.Drag);
    arr.merge(actions.eventTypes, [
        'dragstart',
        'dragmove',
        'draginertiastart',
        'dragresume',
        'dragend',
    ]);
    actions.methodDict.drag = 'draggable';
    defaults.actions.drag = drag.defaults;
}
function beforeMove({ interaction }) {
    if (interaction.prepared.name !== 'drag') {
        return;
    }
    const axis = interaction.prepared.axis;
    if (axis === 'x') {
        interaction.coords.cur.page.y = interaction.coords.start.page.y;
        interaction.coords.cur.client.y = interaction.coords.start.client.y;
        interaction.coords.velocity.client.y = 0;
        interaction.coords.velocity.page.y = 0;
    }
    else if (axis === 'y') {
        interaction.coords.cur.page.x = interaction.coords.start.page.x;
        interaction.coords.cur.client.x = interaction.coords.start.client.x;
        interaction.coords.velocity.client.x = 0;
        interaction.coords.velocity.page.x = 0;
    }
}
function move({ iEvent, interaction }) {
    if (interaction.prepared.name !== 'drag') {
        return;
    }
    const axis = interaction.prepared.axis;
    if (axis === 'x' || axis === 'y') {
        const opposite = axis === 'x' ? 'y' : 'x';
        iEvent.page[opposite] = interaction.coords.start.page[opposite];
        iEvent.client[opposite] = interaction.coords.start.client[opposite];
        iEvent.delta[opposite] = 0;
    }
}
/**
 * ```js
 * interact(element).draggable({
 *     onstart: function (event) {},
 *     onmove : function (event) {},
 *     onend  : function (event) {},
 *
 *     // the axis in which the first movement must be
 *     // for the drag sequence to start
 *     // 'xy' by default - any direction
 *     startAxis: 'x' || 'y' || 'xy',
 *
 *     // 'xy' by default - don't restrict to one axis (move in any direction)
 *     // 'x' or 'y' to restrict movement to either axis
 *     // 'start' to restrict movement to the axis the drag started in
 *     lockAxis: 'x' || 'y' || 'xy' || 'start',
 *
 *     // max number of drags that can happen concurrently
 *     // with elements of this Interactable. Infinity by default
 *     max: Infinity,
 *
 *     // max number of drags that can target the same element+Interactable
 *     // 1 by default
 *     maxPerElement: 2
 * });
 *
 * var isDraggable = interact('element').draggable(); // true
 * ```
 *
 * Get or set whether drag actions can be performed on the target
 *
 * @alias Interactable.prototype.draggable
 *
 * @param {boolean | object} [options] true/false or An object with event
 * listeners to be fired on drag events (object makes the Interactable
 * draggable)
 * @return {boolean | Interactable} boolean indicating if this can be the
 * target of drag events, or this Interctable
 */
function draggable(options) {
    if (is.object(options)) {
        this.options.drag.enabled = options.enabled !== false;
        this.setPerAction('drag', options);
        this.setOnEvents('drag', options);
        if (/^(xy|x|y|start)$/.test(options.lockAxis)) {
            this.options.drag.lockAxis = options.lockAxis;
        }
        if (/^(xy|x|y)$/.test(options.startAxis)) {
            this.options.drag.startAxis = options.startAxis;
        }
        return this;
    }
    if (is.bool(options)) {
        this.options.drag.enabled = options;
        return this;
    }
    return this.options.drag;
}
const drag = {
    install,
    draggable,
    beforeMove,
    move,
    defaults: {
        startAxis: 'xy',
        lockAxis: 'xy',
    },
    checker(_pointer, _event, interactable) {
        const dragOptions = interactable.options.drag;
        return dragOptions.enabled
            ? {
                name: 'drag',
                axis: (dragOptions.lockAxis === 'start'
                    ? dragOptions.startAxis
                    : dragOptions.lockAxis),
            }
            : null;
    },
    getCursor() {
        return 'move';
    },
};
export default drag;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRyYWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBUyxNQUFNLHdCQUF3QixDQUFBO0FBQzFELE9BQU8sS0FBSyxHQUFHLE1BQU0sdUJBQXVCLENBQUE7QUFDNUMsT0FBTyxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQXlCekMsVUFBa0IsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFBO0FBT2pDLFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsTUFBTSxFQUNKLE9BQU8sRUFDUCxZQUFZLEVBQ1osWUFBWSxFQUNaLFFBQVEsR0FDVCxHQUFHLEtBQUssQ0FBQTtJQUVULFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLFVBQVUsQ0FBQyxDQUFBO0lBQ3pELFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxVQUFVLENBQUMsQ0FBQTtJQUVwRCxXQUFXO0lBQ1gsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFBO0lBRTVDLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUE7SUFFakQsT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7SUFDbkIsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ25DLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtRQUM1QixXQUFXO1FBQ1gsVUFBVTtRQUNWLGtCQUFrQjtRQUNsQixZQUFZO1FBQ1osU0FBUztLQUNWLENBQUMsQ0FBQTtJQUNGLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQTtJQUVyQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsUUFB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T0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0NBQ0YsQ0FBQTtBQUVELGVBQWUsSUFBSSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWN0aW9uTmFtZSwgU2NvcGUgfSBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJ1xuaW1wb3J0ICogYXMgYXJyIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2FycidcbmltcG9ydCAqIGFzIGlzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2lzJ1xuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGFibGUnIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0YWJsZSB7XG4gICAgZHJhZ2dhYmxlOiBEcmFnZ2FibGVNZXRob2RcbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9kZWZhdWx0T3B0aW9ucycge1xuICBpbnRlcmZhY2UgQWN0aW9uRGVmYXVsdHMge1xuICAgIGRyYWc6IEludGVyYWN0LkRyYWdnYWJsZU9wdGlvbnNcbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9zY29wZScge1xuICBpbnRlcmZhY2UgQWN0aW9ucyB7XG4gICAgW0FjdGlvbk5hbWUuRHJhZ10/OiB0eXBlb2YgZHJhZ1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNoYWRvd1xuICBlbnVtIEFjdGlvbk5hbWUge1xuICAgIERyYWcgPSAnZHJhZydcbiAgfVxufVxuXG4oQWN0aW9uTmFtZSBhcyBhbnkpLkRyYWcgPSAnZHJhZydcblxuZXhwb3J0IHR5cGUgRHJhZ0V2ZW50ID0gSW50ZXJhY3QuSW50ZXJhY3RFdmVudDxBY3Rpb25OYW1lLkRyYWc+XG5cbmV4cG9ydCB0eXBlIERyYWdnYWJsZU1ldGhvZCA9IChvcHRpb25zPzogSW50ZXJhY3QuT3JCb29sZWFuPEludGVyYWN0LkRyYWdnYWJsZU9wdGlvbnM+IHwgYm9vbGVhbilcbiAgPT4gSW50ZXJhY3QuSW50ZXJhY3RhYmxlIHwgSW50ZXJhY3QuRHJvcHpvbmVPcHRpb25zXG5cbmZ1bmN0aW9uIGluc3RhbGwgKHNjb3BlOiBTY29wZSkge1xuICBjb25zdCB7XG4gICAgYWN0aW9ucyxcbiAgICBJbnRlcmFjdGFibGUsXG4gICAgaW50ZXJhY3Rpb25zLFxuICAgIGRlZmF1bHRzLFxuICB9ID0gc2NvcGVcblxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYmVmb3JlLWFjdGlvbi1tb3ZlJywgYmVmb3JlTW92ZSlcbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2FjdGlvbi1yZXN1bWUnLCBiZWZvcmVNb3ZlKVxuXG4gIC8vIGRyYWdtb3ZlXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tbW92ZScsIG1vdmUpXG5cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5kcmFnZ2FibGUgPSBkcmFnLmRyYWdnYWJsZVxuXG4gIGFjdGlvbnMuZHJhZyA9IGRyYWdcbiAgYWN0aW9ucy5uYW1lcy5wdXNoKEFjdGlvbk5hbWUuRHJhZylcbiAgYXJyLm1lcmdlKGFjdGlvbnMuZXZlbnRUeXBlcywgW1xuICAgICdkcmFnc3RhcnQnLFxuICAgICdkcmFnbW92ZScsXG4gICAgJ2RyYWdpbmVydGlhc3RhcnQnLFxuICAgICdkcmFncmVzdW1lJyxcbiAgICAnZHJhZ2VuZCcsXG4gIF0pXG4gIGFjdGlvbnMubWV0aG9kRGljdC5kcmFnID0gJ2RyYWdnYWJsZSdcblxuICBkZWZhdWx0cy5hY3Rpb25zLmRyYWcgPSBkcmFnLmRlZmF1bHRzXG59XG5cbmZ1bmN0aW9uIGJlZm9yZU1vdmUgKHsgaW50ZXJhY3Rpb24gfSkge1xuICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ2RyYWcnKSB7IHJldHVybiB9XG5cbiAgY29uc3QgYXhpcyA9IGludGVyYWN0aW9uLnByZXBhcmVkLmF4aXNcblxuICBpZiAoYXhpcyA9PT0gJ3gnKSB7XG4gICAgaW50ZXJhY3Rpb24uY29vcmRzLmN1ci5wYWdlLnkgICA9IGludGVyYWN0aW9uLmNvb3Jkcy5zdGFydC5wYWdlLnlcbiAgICBpbnRlcmFjdGlvbi5jb29yZHMuY3VyLmNsaWVudC55ID0gaW50ZXJhY3Rpb24uY29vcmRzLnN0YXJ0LmNsaWVudC55XG5cbiAgICBpbnRlcmFjdGlvbi5jb29yZHMudmVsb2NpdHkuY2xpZW50LnkgPSAwXG4gICAgaW50ZXJhY3Rpb24uY29vcmRzLnZlbG9jaXR5LnBhZ2UueSAgID0gMFxuICB9XG4gIGVsc2UgaWYgKGF4aXMgPT09ICd5Jykge1xuICAgIGludGVyYWN0aW9uLmNvb3Jkcy5jdXIucGFnZS54ICAgPSBpbnRlcmFjdGlvbi5jb29yZHMuc3RhcnQucGFnZS54XG4gICAgaW50ZXJhY3Rpb24uY29vcmRzLmN1ci5jbGllbnQueCA9IGludGVyYWN0aW9uLmNvb3Jkcy5zdGFydC5jbGllbnQueFxuXG4gICAgaW50ZXJhY3Rpb24uY29vcmRzLnZlbG9jaXR5LmNsaWVudC54ID0gMFxuICAgIGludGVyYWN0aW9uLmNvb3Jkcy52ZWxvY2l0eS5wYWdlLnggICA9IDBcbiAgfVxufVxuXG5mdW5jdGlvbiBtb3ZlICh7IGlFdmVudCwgaW50ZXJhY3Rpb24gfSkge1xuICBpZiAoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSAhPT0gJ2RyYWcnKSB7IHJldHVybiB9XG5cbiAgY29uc3QgYXhpcyA9IGludGVyYWN0aW9uLnByZXBhcmVkLmF4aXNcblxuICBpZiAoYXhpcyA9PT0gJ3gnIHx8IGF4aXMgPT09ICd5Jykge1xuICAgIGNvbnN0IG9wcG9zaXRlID0gYXhpcyA9PT0gJ3gnID8gJ3knIDogJ3gnXG5cbiAgICBpRXZlbnQucGFnZVtvcHBvc2l0ZV0gICA9IGludGVyYWN0aW9uLmNvb3Jkcy5zdGFydC5wYWdlW29wcG9zaXRlXVxuICAgIGlFdmVudC5jbGllbnRbb3Bwb3NpdGVdID0gaW50ZXJhY3Rpb24uY29vcmRzLnN0YXJ0LmNsaWVudFtvcHBvc2l0ZV1cbiAgICBpRXZlbnQuZGVsdGFbb3Bwb3NpdGVdID0gMFxuICB9XG59XG5cbi8qKlxuICogYGBganNcbiAqIGludGVyYWN0KGVsZW1lbnQpLmRyYWdnYWJsZSh7XG4gKiAgICAgb25zdGFydDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAqICAgICBvbm1vdmUgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICogICAgIG9uZW5kICA6IGZ1bmN0aW9uIChldmVudCkge30sXG4gKlxuICogICAgIC8vIHRoZSBheGlzIGluIHdoaWNoIHRoZSBmaXJzdCBtb3ZlbWVudCBtdXN0IGJlXG4gKiAgICAgLy8gZm9yIHRoZSBkcmFnIHNlcXVlbmNlIHRvIHN0YXJ0XG4gKiAgICAgLy8gJ3h5JyBieSBkZWZhdWx0IC0gYW55IGRpcmVjdGlvblxuICogICAgIHN0YXJ0QXhpczogJ3gnIHx8ICd5JyB8fCAneHknLFxuICpcbiAqICAgICAvLyAneHknIGJ5IGRlZmF1bHQgLSBkb24ndCByZXN0cmljdCB0byBvbmUgYXhpcyAobW92ZSBpbiBhbnkgZGlyZWN0aW9uKVxuICogICAgIC8vICd4JyBvciAneScgdG8gcmVzdHJpY3QgbW92ZW1lbnQgdG8gZWl0aGVyIGF4aXNcbiAqICAgICAvLyAnc3RhcnQnIHRvIHJlc3RyaWN0IG1vdmVtZW50IHRvIHRoZSBheGlzIHRoZSBkcmFnIHN0YXJ0ZWQgaW5cbiAqICAgICBsb2NrQXhpczogJ3gnIHx8ICd5JyB8fCAneHknIHx8ICdzdGFydCcsXG4gKlxuICogICAgIC8vIG1heCBudW1iZXIgb2YgZHJhZ3MgdGhhdCBjYW4gaGFwcGVuIGNvbmN1cnJlbnRseVxuICogICAgIC8vIHdpdGggZWxlbWVudHMgb2YgdGhpcyBJbnRlcmFjdGFibGUuIEluZmluaXR5IGJ5IGRlZmF1bHRcbiAqICAgICBtYXg6IEluZmluaXR5LFxuICpcbiAqICAgICAvLyBtYXggbnVtYmVyIG9mIGRyYWdzIHRoYXQgY2FuIHRhcmdldCB0aGUgc2FtZSBlbGVtZW50K0ludGVyYWN0YWJsZVxuICogICAgIC8vIDEgYnkgZGVmYXVsdFxuICogICAgIG1heFBlckVsZW1lbnQ6IDJcbiAqIH0pO1xuICpcbiAqIHZhciBpc0RyYWdnYWJsZSA9IGludGVyYWN0KCdlbGVtZW50JykuZHJhZ2dhYmxlKCk7IC8vIHRydWVcbiAqIGBgYFxuICpcbiAqIEdldCBvciBzZXQgd2hldGhlciBkcmFnIGFjdGlvbnMgY2FuIGJlIHBlcmZvcm1lZCBvbiB0aGUgdGFyZ2V0XG4gKlxuICogQGFsaWFzIEludGVyYWN0YWJsZS5wcm90b3R5cGUuZHJhZ2dhYmxlXG4gKlxuICogQHBhcmFtIHtib29sZWFuIHwgb2JqZWN0fSBbb3B0aW9uc10gdHJ1ZS9mYWxzZSBvciBBbiBvYmplY3Qgd2l0aCBldmVudFxuICogbGlzdGVuZXJzIHRvIGJlIGZpcmVkIG9uIGRyYWcgZXZlbnRzIChvYmplY3QgbWFrZXMgdGhlIEludGVyYWN0YWJsZVxuICogZHJhZ2dhYmxlKVxuICogQHJldHVybiB7Ym9vbGVhbiB8IEludGVyYWN0YWJsZX0gYm9vbGVhbiBpbmRpY2F0aW5nIGlmIHRoaXMgY2FuIGJlIHRoZVxuICogdGFyZ2V0IG9mIGRyYWcgZXZlbnRzLCBvciB0aGlzIEludGVyY3RhYmxlXG4gKi9cbmZ1bmN0aW9uIGRyYWdnYWJsZSAodGhpczogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBvcHRpb25zPzogSW50ZXJhY3QuRHJhZ2dhYmxlT3B0aW9ucyB8IGJvb2xlYW4pIHtcbiAgaWYgKGlzLm9iamVjdChvcHRpb25zKSkge1xuICAgIHRoaXMub3B0aW9ucy5kcmFnLmVuYWJsZWQgPSBvcHRpb25zLmVuYWJsZWQgIT09IGZhbHNlXG4gICAgdGhpcy5zZXRQZXJBY3Rpb24oJ2RyYWcnLCBvcHRpb25zKVxuICAgIHRoaXMuc2V0T25FdmVudHMoJ2RyYWcnLCBvcHRpb25zKVxuXG4gICAgaWYgKC9eKHh5fHh8eXxzdGFydCkkLy50ZXN0KG9wdGlvbnMubG9ja0F4aXMpKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuZHJhZy5sb2NrQXhpcyA9IG9wdGlvbnMubG9ja0F4aXNcbiAgICB9XG4gICAgaWYgKC9eKHh5fHh8eSkkLy50ZXN0KG9wdGlvbnMuc3RhcnRBeGlzKSkge1xuICAgICAgdGhpcy5vcHRpb25zLmRyYWcuc3RhcnRBeGlzID0gb3B0aW9ucy5zdGFydEF4aXNcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgaWYgKGlzLmJvb2wob3B0aW9ucykpIHtcbiAgICB0aGlzLm9wdGlvbnMuZHJhZy5lbmFibGVkID0gb3B0aW9uc1xuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHJldHVybiB0aGlzLm9wdGlvbnMuZHJhZ1xufVxuXG5jb25zdCBkcmFnID0ge1xuICBpbnN0YWxsLFxuICBkcmFnZ2FibGUsXG4gIGJlZm9yZU1vdmUsXG4gIG1vdmUsXG4gIGRlZmF1bHRzOiB7XG4gICAgc3RhcnRBeGlzIDogJ3h5JyxcbiAgICBsb2NrQXhpcyAgOiAneHknLFxuICB9IGFzIEludGVyYWN0LkRyb3B6b25lT3B0aW9ucyxcblxuICBjaGVja2VyIChfcG9pbnRlciwgX2V2ZW50LCBpbnRlcmFjdGFibGUpIHtcbiAgICBjb25zdCBkcmFnT3B0aW9ucyA9IGludGVyYWN0YWJsZS5vcHRpb25zLmRyYWdcblxuICAgIHJldHVybiBkcmFnT3B0aW9ucy5lbmFibGVkXG4gICAgICA/IHtcbiAgICAgICAgbmFtZTogJ2RyYWcnLFxuICAgICAgICBheGlzOiAoZHJhZ09wdGlvbnMubG9ja0F4aXMgPT09ICdzdGFydCdcbiAgICAgICAgICA/IGRyYWdPcHRpb25zLnN0YXJ0QXhpc1xuICAgICAgICAgIDogZHJhZ09wdGlvbnMubG9ja0F4aXMpLFxuICAgICAgfVxuICAgICAgOiBudWxsXG4gIH0sXG5cbiAgZ2V0Q3Vyc29yICgpIHtcbiAgICByZXR1cm4gJ21vdmUnXG4gIH0sXG59XG5cbmV4cG9ydCBkZWZhdWx0IGRyYWdcbiJdfQ==