/**
 * @module modifiers/snapEdges
 *
 * @description
 * This module allows snapping of the edges of targets during resize
 * interactions.
 *
 * @example
 * interact(target).resizable({
 *   snapEdges: {
 *     targets: [interact.snappers.grid({ x: 100, y: 50 })],
 *   },
 * })
 *
 * interact(target).resizable({
 *   snapEdges: {
 *     targets: [
 *       interact.snappers.grid({
 *        top: 50,
 *        left: 50,
 *        bottom: 100,
 *        right: 100,
 *       }),
 *     ],
 *   },
 * })
 */
import clone from '@interactjs/utils/clone';
import extend from '@interactjs/utils/extend';
import snapSize from './size';
function start(arg) {
    const edges = arg.interaction.prepared.edges;
    if (!edges) {
        return null;
    }
    arg.state.targetFields = arg.state.targetFields || [
        [edges.left ? 'left' : 'right', edges.top ? 'top' : 'bottom'],
    ];
    return snapSize.start(arg);
}
function set(arg) {
    return snapSize.set(arg);
}
const snapEdges = {
    start,
    set,
    defaults: extend(clone(snapSize.defaults), {
        offset: { x: 0, y: 0 },
    }),
};
export default snapEdges;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlZGdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EwQkc7QUFFSCxPQUFPLEtBQUssTUFBTSx5QkFBeUIsQ0FBQTtBQUMzQyxPQUFPLE1BQU0sTUFBTSwwQkFBMEIsQ0FBQTtBQUM3QyxPQUFPLFFBQTZCLE1BQU0sUUFBUSxDQUFBO0FBRWxELFNBQVMsS0FBSyxDQUFFLEdBQUc7SUFDakIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFBO0lBRTVDLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFBRSxPQUFPLElBQUksQ0FBQTtLQUFFO0lBRTNCLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxJQUFJO1FBQ2pELENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7S0FDOUQsQ0FBQTtJQUVELE9BQU8sUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUM1QixDQUFDO0FBRUQsU0FBUyxHQUFHLENBQUUsR0FBRztJQUNmLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUMxQixDQUFDO0FBRUQsTUFBTSxTQUFTLEdBQUc7SUFDaEIsS0FBSztJQUNMLEdBQUc7SUFDSCxRQUFRLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFvQixFQUFFO1FBQzVELE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtLQUNaLENBQUM7Q0FDZCxDQUFBO0FBRUQsZUFBZSxTQUFTLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBtb2R1bGUgbW9kaWZpZXJzL3NuYXBFZGdlc1xuICpcbiAqIEBkZXNjcmlwdGlvblxuICogVGhpcyBtb2R1bGUgYWxsb3dzIHNuYXBwaW5nIG9mIHRoZSBlZGdlcyBvZiB0YXJnZXRzIGR1cmluZyByZXNpemVcbiAqIGludGVyYWN0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZVxuICogaW50ZXJhY3QodGFyZ2V0KS5yZXNpemFibGUoe1xuICogICBzbmFwRWRnZXM6IHtcbiAqICAgICB0YXJnZXRzOiBbaW50ZXJhY3Quc25hcHBlcnMuZ3JpZCh7IHg6IDEwMCwgeTogNTAgfSldLFxuICogICB9LFxuICogfSlcbiAqXG4gKiBpbnRlcmFjdCh0YXJnZXQpLnJlc2l6YWJsZSh7XG4gKiAgIHNuYXBFZGdlczoge1xuICogICAgIHRhcmdldHM6IFtcbiAqICAgICAgIGludGVyYWN0LnNuYXBwZXJzLmdyaWQoe1xuICogICAgICAgIHRvcDogNTAsXG4gKiAgICAgICAgbGVmdDogNTAsXG4gKiAgICAgICAgYm90dG9tOiAxMDAsXG4gKiAgICAgICAgcmlnaHQ6IDEwMCxcbiAqICAgICAgIH0pLFxuICogICAgIF0sXG4gKiAgIH0sXG4gKiB9KVxuICovXG5cbmltcG9ydCBjbG9uZSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9jbG9uZSdcbmltcG9ydCBleHRlbmQgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZXh0ZW5kJ1xuaW1wb3J0IHNuYXBTaXplLCB7IFNuYXBTaXplT3B0aW9ucyB9IGZyb20gJy4vc2l6ZSdcblxuZnVuY3Rpb24gc3RhcnQgKGFyZykge1xuICBjb25zdCBlZGdlcyA9IGFyZy5pbnRlcmFjdGlvbi5wcmVwYXJlZC5lZGdlc1xuXG4gIGlmICghZWRnZXMpIHsgcmV0dXJuIG51bGwgfVxuXG4gIGFyZy5zdGF0ZS50YXJnZXRGaWVsZHMgPSBhcmcuc3RhdGUudGFyZ2V0RmllbGRzIHx8IFtcbiAgICBbZWRnZXMubGVmdCA/ICdsZWZ0JyA6ICdyaWdodCcsIGVkZ2VzLnRvcCA/ICd0b3AnIDogJ2JvdHRvbSddLFxuICBdXG5cbiAgcmV0dXJuIHNuYXBTaXplLnN0YXJ0KGFyZylcbn1cblxuZnVuY3Rpb24gc2V0IChhcmcpIHtcbiAgcmV0dXJuIHNuYXBTaXplLnNldChhcmcpXG59XG5cbmNvbnN0IHNuYXBFZGdlcyA9IHtcbiAgc3RhcnQsXG4gIHNldCxcbiAgZGVmYXVsdHM6IGV4dGVuZChjbG9uZShzbmFwU2l6ZS5kZWZhdWx0cykgYXMgU25hcFNpemVPcHRpb25zLCB7XG4gICAgb2Zmc2V0OiB7IHg6IDAsIHk6IDAgfSxcbiAgfSBhcyB1bmtub3duKSxcbn1cblxuZXhwb3J0IGRlZmF1bHQgc25hcEVkZ2VzXG4iXX0=