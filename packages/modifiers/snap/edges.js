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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlZGdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EwQkc7QUFFSCxPQUFPLEtBQUssTUFBTSx5QkFBeUIsQ0FBQTtBQUMzQyxPQUFPLE1BQU0sTUFBTSwwQkFBMEIsQ0FBQTtBQUc3QyxPQUFPLFFBQTZCLE1BQU0sUUFBUSxDQUFBO0FBRWxELFNBQVMsS0FBSyxDQUFFLEdBQTJCO0lBQ3pDLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQTtJQUU1QyxJQUFJLENBQUMsS0FBSyxFQUFFO1FBQUUsT0FBTyxJQUFJLENBQUE7S0FBRTtJQUUzQixHQUFHLENBQUMsS0FBSyxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFlBQVksSUFBSTtRQUNqRCxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO0tBQzlELENBQUE7SUFFRCxPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDNUIsQ0FBQztBQUVELFNBQVMsR0FBRyxDQUFFLEdBQUc7SUFDZixPQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDMUIsQ0FBQztBQUVELE1BQU0sU0FBUyxHQUFHO0lBQ2hCLEtBQUs7SUFDTCxHQUFHO0lBQ0gsUUFBUSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBb0IsRUFBRTtRQUM1RCxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7S0FDWixDQUFDO0NBQ2QsQ0FBQTtBQUVELGVBQWUsU0FBUyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbW9kdWxlIG1vZGlmaWVycy9zbmFwRWRnZXNcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqIFRoaXMgbW9kdWxlIGFsbG93cyBzbmFwcGluZyBvZiB0aGUgZWRnZXMgb2YgdGFyZ2V0cyBkdXJpbmcgcmVzaXplXG4gKiBpbnRlcmFjdGlvbnMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGludGVyYWN0KHRhcmdldCkucmVzaXphYmxlKHtcbiAqICAgc25hcEVkZ2VzOiB7XG4gKiAgICAgdGFyZ2V0czogW2ludGVyYWN0LnNuYXBwZXJzLmdyaWQoeyB4OiAxMDAsIHk6IDUwIH0pXSxcbiAqICAgfSxcbiAqIH0pXG4gKlxuICogaW50ZXJhY3QodGFyZ2V0KS5yZXNpemFibGUoe1xuICogICBzbmFwRWRnZXM6IHtcbiAqICAgICB0YXJnZXRzOiBbXG4gKiAgICAgICBpbnRlcmFjdC5zbmFwcGVycy5ncmlkKHtcbiAqICAgICAgICB0b3A6IDUwLFxuICogICAgICAgIGxlZnQ6IDUwLFxuICogICAgICAgIGJvdHRvbTogMTAwLFxuICogICAgICAgIHJpZ2h0OiAxMDAsXG4gKiAgICAgICB9KSxcbiAqICAgICBdLFxuICogICB9LFxuICogfSlcbiAqL1xuXG5pbXBvcnQgY2xvbmUgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvY2xvbmUnXG5pbXBvcnQgZXh0ZW5kIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2V4dGVuZCdcbmltcG9ydCB7IE1vZGlmaWVyQXJnIH0gZnJvbSAnLi4vYmFzZSdcbmltcG9ydCB7IFNuYXBTdGF0ZSB9IGZyb20gJy4vcG9pbnRlcidcbmltcG9ydCBzbmFwU2l6ZSwgeyBTbmFwU2l6ZU9wdGlvbnMgfSBmcm9tICcuL3NpemUnXG5cbmZ1bmN0aW9uIHN0YXJ0IChhcmc6IE1vZGlmaWVyQXJnPFNuYXBTdGF0ZT4pIHtcbiAgY29uc3QgZWRnZXMgPSBhcmcuaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXNcblxuICBpZiAoIWVkZ2VzKSB7IHJldHVybiBudWxsIH1cblxuICBhcmcuc3RhdGUudGFyZ2V0RmllbGRzID0gYXJnLnN0YXRlLnRhcmdldEZpZWxkcyB8fCBbXG4gICAgW2VkZ2VzLmxlZnQgPyAnbGVmdCcgOiAncmlnaHQnLCBlZGdlcy50b3AgPyAndG9wJyA6ICdib3R0b20nXSxcbiAgXVxuXG4gIHJldHVybiBzbmFwU2l6ZS5zdGFydChhcmcpXG59XG5cbmZ1bmN0aW9uIHNldCAoYXJnKSB7XG4gIHJldHVybiBzbmFwU2l6ZS5zZXQoYXJnKVxufVxuXG5jb25zdCBzbmFwRWRnZXMgPSB7XG4gIHN0YXJ0LFxuICBzZXQsXG4gIGRlZmF1bHRzOiBleHRlbmQoY2xvbmUoc25hcFNpemUuZGVmYXVsdHMpIGFzIFNuYXBTaXplT3B0aW9ucywge1xuICAgIG9mZnNldDogeyB4OiAwLCB5OiAwIH0sXG4gIH0gYXMgdW5rbm93biksXG59XG5cbmV4cG9ydCBkZWZhdWx0IHNuYXBFZGdlc1xuIl19