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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRnZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlZGdlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EwQkc7QUFFSCxPQUFPLEtBQUssTUFBTSx5QkFBeUIsQ0FBQTtBQUMzQyxPQUFPLE1BQU0sTUFBTSwwQkFBMEIsQ0FBQTtBQUM3QyxPQUFPLFFBQVEsTUFBTSxRQUFRLENBQUE7QUFFN0IsU0FBUyxLQUFLLENBQUUsR0FBRztJQUNqQixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUE7SUFFNUMsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUFFLE9BQU8sSUFBSSxDQUFBO0tBQUU7SUFFM0IsR0FBRyxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxZQUFZLElBQUk7UUFDakQsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztLQUM5RCxDQUFBO0lBRUQsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQzVCLENBQUM7QUFFRCxTQUFTLEdBQUcsQ0FBRSxHQUFHO0lBQ2YsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQzFCLENBQUM7QUFFRCxNQUFNLFNBQVMsR0FBRztJQUNoQixLQUFLO0lBQ0wsR0FBRztJQUNILFFBQVEsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUN6QyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7S0FDdkIsQ0FBQztDQUNILENBQUE7QUFFRCxlQUFlLFNBQVMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG1vZHVsZSBtb2RpZmllcnMvc25hcEVkZ2VzXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBUaGlzIG1vZHVsZSBhbGxvd3Mgc25hcHBpbmcgb2YgdGhlIGVkZ2VzIG9mIHRhcmdldHMgZHVyaW5nIHJlc2l6ZVxuICogaW50ZXJhY3Rpb25zLlxuICpcbiAqIEBleGFtcGxlXG4gKiBpbnRlcmFjdCh0YXJnZXQpLnJlc2l6YWJsZSh7XG4gKiAgIHNuYXBFZGdlczoge1xuICogICAgIHRhcmdldHM6IFtpbnRlcmFjdC5zbmFwcGVycy5ncmlkKHsgeDogMTAwLCB5OiA1MCB9KV0sXG4gKiAgIH0sXG4gKiB9KVxuICpcbiAqIGludGVyYWN0KHRhcmdldCkucmVzaXphYmxlKHtcbiAqICAgc25hcEVkZ2VzOiB7XG4gKiAgICAgdGFyZ2V0czogW1xuICogICAgICAgaW50ZXJhY3Quc25hcHBlcnMuZ3JpZCh7XG4gKiAgICAgICAgdG9wOiA1MCxcbiAqICAgICAgICBsZWZ0OiA1MCxcbiAqICAgICAgICBib3R0b206IDEwMCxcbiAqICAgICAgICByaWdodDogMTAwLFxuICogICAgICAgfSksXG4gKiAgICAgXSxcbiAqICAgfSxcbiAqIH0pXG4gKi9cblxuaW1wb3J0IGNsb25lIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2Nsb25lJ1xuaW1wb3J0IGV4dGVuZCBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9leHRlbmQnXG5pbXBvcnQgc25hcFNpemUgZnJvbSAnLi9zaXplJ1xuXG5mdW5jdGlvbiBzdGFydCAoYXJnKSB7XG4gIGNvbnN0IGVkZ2VzID0gYXJnLmludGVyYWN0aW9uLnByZXBhcmVkLmVkZ2VzXG5cbiAgaWYgKCFlZGdlcykgeyByZXR1cm4gbnVsbCB9XG5cbiAgYXJnLnN0YXRlLnRhcmdldEZpZWxkcyA9IGFyZy5zdGF0ZS50YXJnZXRGaWVsZHMgfHwgW1xuICAgIFtlZGdlcy5sZWZ0ID8gJ2xlZnQnIDogJ3JpZ2h0JywgZWRnZXMudG9wID8gJ3RvcCcgOiAnYm90dG9tJ10sXG4gIF1cblxuICByZXR1cm4gc25hcFNpemUuc3RhcnQoYXJnKVxufVxuXG5mdW5jdGlvbiBzZXQgKGFyZykge1xuICByZXR1cm4gc25hcFNpemUuc2V0KGFyZylcbn1cblxuY29uc3Qgc25hcEVkZ2VzID0ge1xuICBzdGFydCxcbiAgc2V0LFxuICBkZWZhdWx0czogZXh0ZW5kKGNsb25lKHNuYXBTaXplLmRlZmF1bHRzKSwge1xuICAgIG9mZnNldDogeyB4OiAwLCB5OiAwIH0sXG4gIH0pLFxufVxuXG5leHBvcnQgZGVmYXVsdCBzbmFwRWRnZXNcbiJdfQ==