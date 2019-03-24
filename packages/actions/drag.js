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
    actions[ActionName.Drag] = drag;
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
const draggable = function draggable(options) {
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
};
const drag = {
    id: 'actions/drag',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRyYWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBUyxNQUFNLHdCQUF3QixDQUFBO0FBQzFELE9BQU8sS0FBSyxHQUFHLE1BQU0sdUJBQXVCLENBQUE7QUFDNUMsT0FBTyxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQXlCekMsVUFBa0IsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFBO0FBTWpDLFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsTUFBTSxFQUNKLE9BQU8sRUFDUCxZQUFZLEVBQ1osWUFBWSxFQUNaLFFBQVEsR0FDVCxHQUFHLEtBQUssQ0FBQTtJQUVULFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLFVBQVUsQ0FBQyxDQUFBO0lBQ3pELFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxVQUFVLENBQUMsQ0FBQTtJQUVwRCxXQUFXO0lBQ1gsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFBO0lBRTVDLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUE7SUFFakQsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUE7SUFDL0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ25DLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtRQUM1QixXQUFXO1FBQ1gsVUFBVTtRQUNWLGtCQUFrQjtRQUNsQixZQUFZO1FBQ1osU0FBUztLQUNWLENBQUMsQ0FBQTtJQUNGLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQTtJQUVyQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksR0FB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O2FBQzFCO1lBQ0QsQ0FBQyxDQUFDLElBQUksQ0FBQTtJQUNWLENBQUM7SUFFRCxTQUFTO1FBQ1AsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0NBQ0YsQ0FBQTtBQUVELGVBQWUsSUFBSSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWN0aW9uTmFtZSwgU2NvcGUgfSBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJ1xuaW1wb3J0ICogYXMgYXJyIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2FycidcbmltcG9ydCAqIGFzIGlzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2lzJ1xuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGFibGUnIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0YWJsZSB7XG4gICAgZHJhZ2dhYmxlOiBEcmFnZ2FibGVNZXRob2RcbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9kZWZhdWx0T3B0aW9ucycge1xuICBpbnRlcmZhY2UgQWN0aW9uRGVmYXVsdHMge1xuICAgIGRyYWc6IEludGVyYWN0LkRyYWdnYWJsZU9wdGlvbnNcbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9zY29wZScge1xuICBpbnRlcmZhY2UgQWN0aW9ucyB7XG4gICAgW0FjdGlvbk5hbWUuRHJhZ10/OiB0eXBlb2YgZHJhZ1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXNoYWRvd1xuICBlbnVtIEFjdGlvbk5hbWUge1xuICAgIERyYWcgPSAnZHJhZydcbiAgfVxufVxuXG4oQWN0aW9uTmFtZSBhcyBhbnkpLkRyYWcgPSAnZHJhZydcblxuZXhwb3J0IHR5cGUgRHJhZ0V2ZW50ID0gSW50ZXJhY3QuSW50ZXJhY3RFdmVudDxBY3Rpb25OYW1lLkRyYWc+XG5cbmV4cG9ydCB0eXBlIERyYWdnYWJsZU1ldGhvZCA9IEludGVyYWN0LkFjdGlvbk1ldGhvZDxJbnRlcmFjdC5EcmFnZ2FibGVPcHRpb25zPlxuXG5mdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qge1xuICAgIGFjdGlvbnMsXG4gICAgSW50ZXJhY3RhYmxlLFxuICAgIGludGVyYWN0aW9ucyxcbiAgICBkZWZhdWx0cyxcbiAgfSA9IHNjb3BlXG5cbiAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oJ2JlZm9yZS1hY3Rpb24tbW92ZScsIGJlZm9yZU1vdmUpXG4gIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKCdhY3Rpb24tcmVzdW1lJywgYmVmb3JlTW92ZSlcblxuICAvLyBkcmFnbW92ZVxuICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbignYWN0aW9uLW1vdmUnLCBtb3ZlKVxuXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUuZHJhZ2dhYmxlID0gZHJhZy5kcmFnZ2FibGVcblxuICBhY3Rpb25zW0FjdGlvbk5hbWUuRHJhZ10gPSBkcmFnXG4gIGFjdGlvbnMubmFtZXMucHVzaChBY3Rpb25OYW1lLkRyYWcpXG4gIGFyci5tZXJnZShhY3Rpb25zLmV2ZW50VHlwZXMsIFtcbiAgICAnZHJhZ3N0YXJ0JyxcbiAgICAnZHJhZ21vdmUnLFxuICAgICdkcmFnaW5lcnRpYXN0YXJ0JyxcbiAgICAnZHJhZ3Jlc3VtZScsXG4gICAgJ2RyYWdlbmQnLFxuICBdKVxuICBhY3Rpb25zLm1ldGhvZERpY3QuZHJhZyA9ICdkcmFnZ2FibGUnXG5cbiAgZGVmYXVsdHMuYWN0aW9ucy5kcmFnID0gZHJhZy5kZWZhdWx0c1xufVxuXG5mdW5jdGlvbiBiZWZvcmVNb3ZlICh7IGludGVyYWN0aW9uIH0pIHtcbiAgaWYgKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgIT09ICdkcmFnJykgeyByZXR1cm4gfVxuXG4gIGNvbnN0IGF4aXMgPSBpbnRlcmFjdGlvbi5wcmVwYXJlZC5heGlzXG5cbiAgaWYgKGF4aXMgPT09ICd4Jykge1xuICAgIGludGVyYWN0aW9uLmNvb3Jkcy5jdXIucGFnZS55ICAgPSBpbnRlcmFjdGlvbi5jb29yZHMuc3RhcnQucGFnZS55XG4gICAgaW50ZXJhY3Rpb24uY29vcmRzLmN1ci5jbGllbnQueSA9IGludGVyYWN0aW9uLmNvb3Jkcy5zdGFydC5jbGllbnQueVxuXG4gICAgaW50ZXJhY3Rpb24uY29vcmRzLnZlbG9jaXR5LmNsaWVudC55ID0gMFxuICAgIGludGVyYWN0aW9uLmNvb3Jkcy52ZWxvY2l0eS5wYWdlLnkgICA9IDBcbiAgfVxuICBlbHNlIGlmIChheGlzID09PSAneScpIHtcbiAgICBpbnRlcmFjdGlvbi5jb29yZHMuY3VyLnBhZ2UueCAgID0gaW50ZXJhY3Rpb24uY29vcmRzLnN0YXJ0LnBhZ2UueFxuICAgIGludGVyYWN0aW9uLmNvb3Jkcy5jdXIuY2xpZW50LnggPSBpbnRlcmFjdGlvbi5jb29yZHMuc3RhcnQuY2xpZW50LnhcblxuICAgIGludGVyYWN0aW9uLmNvb3Jkcy52ZWxvY2l0eS5jbGllbnQueCA9IDBcbiAgICBpbnRlcmFjdGlvbi5jb29yZHMudmVsb2NpdHkucGFnZS54ICAgPSAwXG4gIH1cbn1cblxuZnVuY3Rpb24gbW92ZSAoeyBpRXZlbnQsIGludGVyYWN0aW9uIH0pIHtcbiAgaWYgKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUgIT09ICdkcmFnJykgeyByZXR1cm4gfVxuXG4gIGNvbnN0IGF4aXMgPSBpbnRlcmFjdGlvbi5wcmVwYXJlZC5heGlzXG5cbiAgaWYgKGF4aXMgPT09ICd4JyB8fCBheGlzID09PSAneScpIHtcbiAgICBjb25zdCBvcHBvc2l0ZSA9IGF4aXMgPT09ICd4JyA/ICd5JyA6ICd4J1xuXG4gICAgaUV2ZW50LnBhZ2Vbb3Bwb3NpdGVdICAgPSBpbnRlcmFjdGlvbi5jb29yZHMuc3RhcnQucGFnZVtvcHBvc2l0ZV1cbiAgICBpRXZlbnQuY2xpZW50W29wcG9zaXRlXSA9IGludGVyYWN0aW9uLmNvb3Jkcy5zdGFydC5jbGllbnRbb3Bwb3NpdGVdXG4gICAgaUV2ZW50LmRlbHRhW29wcG9zaXRlXSA9IDBcbiAgfVxufVxuXG4vKipcbiAqIGBgYGpzXG4gKiBpbnRlcmFjdChlbGVtZW50KS5kcmFnZ2FibGUoe1xuICogICAgIG9uc3RhcnQ6IGZ1bmN0aW9uIChldmVudCkge30sXG4gKiAgICAgb25tb3ZlIDogZnVuY3Rpb24gKGV2ZW50KSB7fSxcbiAqICAgICBvbmVuZCAgOiBmdW5jdGlvbiAoZXZlbnQpIHt9LFxuICpcbiAqICAgICAvLyB0aGUgYXhpcyBpbiB3aGljaCB0aGUgZmlyc3QgbW92ZW1lbnQgbXVzdCBiZVxuICogICAgIC8vIGZvciB0aGUgZHJhZyBzZXF1ZW5jZSB0byBzdGFydFxuICogICAgIC8vICd4eScgYnkgZGVmYXVsdCAtIGFueSBkaXJlY3Rpb25cbiAqICAgICBzdGFydEF4aXM6ICd4JyB8fCAneScgfHwgJ3h5JyxcbiAqXG4gKiAgICAgLy8gJ3h5JyBieSBkZWZhdWx0IC0gZG9uJ3QgcmVzdHJpY3QgdG8gb25lIGF4aXMgKG1vdmUgaW4gYW55IGRpcmVjdGlvbilcbiAqICAgICAvLyAneCcgb3IgJ3knIHRvIHJlc3RyaWN0IG1vdmVtZW50IHRvIGVpdGhlciBheGlzXG4gKiAgICAgLy8gJ3N0YXJ0JyB0byByZXN0cmljdCBtb3ZlbWVudCB0byB0aGUgYXhpcyB0aGUgZHJhZyBzdGFydGVkIGluXG4gKiAgICAgbG9ja0F4aXM6ICd4JyB8fCAneScgfHwgJ3h5JyB8fCAnc3RhcnQnLFxuICpcbiAqICAgICAvLyBtYXggbnVtYmVyIG9mIGRyYWdzIHRoYXQgY2FuIGhhcHBlbiBjb25jdXJyZW50bHlcbiAqICAgICAvLyB3aXRoIGVsZW1lbnRzIG9mIHRoaXMgSW50ZXJhY3RhYmxlLiBJbmZpbml0eSBieSBkZWZhdWx0XG4gKiAgICAgbWF4OiBJbmZpbml0eSxcbiAqXG4gKiAgICAgLy8gbWF4IG51bWJlciBvZiBkcmFncyB0aGF0IGNhbiB0YXJnZXQgdGhlIHNhbWUgZWxlbWVudCtJbnRlcmFjdGFibGVcbiAqICAgICAvLyAxIGJ5IGRlZmF1bHRcbiAqICAgICBtYXhQZXJFbGVtZW50OiAyXG4gKiB9KTtcbiAqXG4gKiB2YXIgaXNEcmFnZ2FibGUgPSBpbnRlcmFjdCgnZWxlbWVudCcpLmRyYWdnYWJsZSgpOyAvLyB0cnVlXG4gKiBgYGBcbiAqXG4gKiBHZXQgb3Igc2V0IHdoZXRoZXIgZHJhZyBhY3Rpb25zIGNhbiBiZSBwZXJmb3JtZWQgb24gdGhlIHRhcmdldFxuICpcbiAqIEBhbGlhcyBJbnRlcmFjdGFibGUucHJvdG90eXBlLmRyYWdnYWJsZVxuICpcbiAqIEBwYXJhbSB7Ym9vbGVhbiB8IG9iamVjdH0gW29wdGlvbnNdIHRydWUvZmFsc2Ugb3IgQW4gb2JqZWN0IHdpdGggZXZlbnRcbiAqIGxpc3RlbmVycyB0byBiZSBmaXJlZCBvbiBkcmFnIGV2ZW50cyAob2JqZWN0IG1ha2VzIHRoZSBJbnRlcmFjdGFibGVcbiAqIGRyYWdnYWJsZSlcbiAqIEByZXR1cm4ge2Jvb2xlYW4gfCBJbnRlcmFjdGFibGV9IGJvb2xlYW4gaW5kaWNhdGluZyBpZiB0aGlzIGNhbiBiZSB0aGVcbiAqIHRhcmdldCBvZiBkcmFnIGV2ZW50cywgb3IgdGhpcyBJbnRlcmN0YWJsZVxuICovXG5jb25zdCBkcmFnZ2FibGU6IERyYWdnYWJsZU1ldGhvZCA9IGZ1bmN0aW9uIGRyYWdnYWJsZSAodGhpczogSW50ZXJhY3QuSW50ZXJhY3RhYmxlLCBvcHRpb25zPzogSW50ZXJhY3QuRHJhZ2dhYmxlT3B0aW9ucyB8IGJvb2xlYW4pOiBhbnkge1xuICBpZiAoaXMub2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgdGhpcy5vcHRpb25zLmRyYWcuZW5hYmxlZCA9IG9wdGlvbnMuZW5hYmxlZCAhPT0gZmFsc2VcbiAgICB0aGlzLnNldFBlckFjdGlvbignZHJhZycsIG9wdGlvbnMpXG4gICAgdGhpcy5zZXRPbkV2ZW50cygnZHJhZycsIG9wdGlvbnMpXG5cbiAgICBpZiAoL14oeHl8eHx5fHN0YXJ0KSQvLnRlc3Qob3B0aW9ucy5sb2NrQXhpcykpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5kcmFnLmxvY2tBeGlzID0gb3B0aW9ucy5sb2NrQXhpc1xuICAgIH1cbiAgICBpZiAoL14oeHl8eHx5KSQvLnRlc3Qob3B0aW9ucy5zdGFydEF4aXMpKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuZHJhZy5zdGFydEF4aXMgPSBvcHRpb25zLnN0YXJ0QXhpc1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBpZiAoaXMuYm9vbChvcHRpb25zKSkge1xuICAgIHRoaXMub3B0aW9ucy5kcmFnLmVuYWJsZWQgPSBvcHRpb25zXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgcmV0dXJuIHRoaXMub3B0aW9ucy5kcmFnXG59XG5cbmNvbnN0IGRyYWcgPSB7XG4gIGlkOiAnYWN0aW9ucy9kcmFnJyxcbiAgaW5zdGFsbCxcbiAgZHJhZ2dhYmxlLFxuICBiZWZvcmVNb3ZlLFxuICBtb3ZlLFxuICBkZWZhdWx0czoge1xuICAgIHN0YXJ0QXhpcyA6ICd4eScsXG4gICAgbG9ja0F4aXMgIDogJ3h5JyxcbiAgfSBhcyBJbnRlcmFjdC5Ecm9wem9uZU9wdGlvbnMsXG5cbiAgY2hlY2tlciAoX3BvaW50ZXIsIF9ldmVudCwgaW50ZXJhY3RhYmxlKSB7XG4gICAgY29uc3QgZHJhZ09wdGlvbnMgPSBpbnRlcmFjdGFibGUub3B0aW9ucy5kcmFnXG5cbiAgICByZXR1cm4gZHJhZ09wdGlvbnMuZW5hYmxlZFxuICAgICAgPyB7XG4gICAgICAgIG5hbWU6ICdkcmFnJyxcbiAgICAgICAgYXhpczogKGRyYWdPcHRpb25zLmxvY2tBeGlzID09PSAnc3RhcnQnXG4gICAgICAgICAgPyBkcmFnT3B0aW9ucy5zdGFydEF4aXNcbiAgICAgICAgICA6IGRyYWdPcHRpb25zLmxvY2tBeGlzKSxcbiAgICAgIH1cbiAgICAgIDogbnVsbFxuICB9LFxuXG4gIGdldEN1cnNvciAoKSB7XG4gICAgcmV0dXJuICdtb3ZlJ1xuICB9LFxufVxuXG5leHBvcnQgZGVmYXVsdCBkcmFnXG4iXX0=