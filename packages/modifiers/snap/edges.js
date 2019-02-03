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
 * });
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
 * });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlZGdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EwQkc7QUFFSCxPQUFPLEtBQUssTUFBTSx5QkFBeUIsQ0FBQTtBQUMzQyxPQUFPLE1BQU0sTUFBTSwwQkFBMEIsQ0FBQTtBQUM3QyxPQUFPLFFBQVEsTUFBTSxRQUFRLENBQUE7QUFFN0IsU0FBUyxLQUFLLENBQUUsR0FBRztJQUNqQixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUE7SUFFNUMsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUFFLE9BQU8sSUFBSSxDQUFBO0tBQUU7SUFFM0IsR0FBRyxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxZQUFZLElBQUk7UUFDakQsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztLQUM5RCxDQUFBO0lBRUQsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQzVCLENBQUM7QUFFRCxTQUFTLEdBQUcsQ0FBRSxHQUFHO0lBQ2YsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQzFCLENBQUM7QUFFRCxNQUFNLFNBQVMsR0FBRztJQUNoQixLQUFLO0lBQ0wsR0FBRztJQUNILFFBQVEsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUN6QyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7S0FDdkIsQ0FBQztDQUNILENBQUE7QUFFRCxlQUFlLFNBQVMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG1vZHVsZSBtb2RpZmllcnMvc25hcEVkZ2VzXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBUaGlzIG1vZHVsZSBhbGxvd3Mgc25hcHBpbmcgb2YgdGhlIGVkZ2VzIG9mIHRhcmdldHMgZHVyaW5nIHJlc2l6ZVxuICogaW50ZXJhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlXG4gKiBpbnRlcmFjdCh0YXJnZXQpLnJlc2l6YWJsZSh7XG4gKiAgIHNuYXBFZGdlczoge1xuICogICAgIHRhcmdldHM6IFtpbnRlcmFjdC5zbmFwcGVycy5ncmlkKHsgeDogMTAwLCB5OiA1MCB9KV0sXG4gKiAgIH0sXG4gKiB9KTtcbiAqXG4gKiBpbnRlcmFjdCh0YXJnZXQpLnJlc2l6YWJsZSh7XG4gKiAgIHNuYXBFZGdlczoge1xuICogICAgIHRhcmdldHM6IFtcbiAqICAgICAgIGludGVyYWN0LnNuYXBwZXJzLmdyaWQoe1xuICogICAgICAgIHRvcDogNTAsXG4gKiAgICAgICAgbGVmdDogNTAsXG4gKiAgICAgICAgYm90dG9tOiAxMDAsXG4gKiAgICAgICAgcmlnaHQ6IDEwMCxcbiAqICAgICAgIH0pLFxuICogICAgIF0sXG4gKiAgIH0sXG4gKiB9KTtcbiAqL1xuXG5pbXBvcnQgY2xvbmUgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvY2xvbmUnXG5pbXBvcnQgZXh0ZW5kIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2V4dGVuZCdcbmltcG9ydCBzbmFwU2l6ZSBmcm9tICcuL3NpemUnXG5cbmZ1bmN0aW9uIHN0YXJ0IChhcmcpIHtcbiAgY29uc3QgZWRnZXMgPSBhcmcuaW50ZXJhY3Rpb24ucHJlcGFyZWQuZWRnZXNcblxuICBpZiAoIWVkZ2VzKSB7IHJldHVybiBudWxsIH1cblxuICBhcmcuc3RhdGUudGFyZ2V0RmllbGRzID0gYXJnLnN0YXRlLnRhcmdldEZpZWxkcyB8fCBbXG4gICAgW2VkZ2VzLmxlZnQgPyAnbGVmdCcgOiAncmlnaHQnLCBlZGdlcy50b3AgPyAndG9wJyA6ICdib3R0b20nXSxcbiAgXVxuXG4gIHJldHVybiBzbmFwU2l6ZS5zdGFydChhcmcpXG59XG5cbmZ1bmN0aW9uIHNldCAoYXJnKSB7XG4gIHJldHVybiBzbmFwU2l6ZS5zZXQoYXJnKVxufVxuXG5jb25zdCBzbmFwRWRnZXMgPSB7XG4gIHN0YXJ0LFxuICBzZXQsXG4gIGRlZmF1bHRzOiBleHRlbmQoY2xvbmUoc25hcFNpemUuZGVmYXVsdHMpLCB7XG4gICAgb2Zmc2V0OiB7IHg6IDAsIHk6IDAgfSxcbiAgfSksXG59XG5cbmV4cG9ydCBkZWZhdWx0IHNuYXBFZGdlc1xuIl19