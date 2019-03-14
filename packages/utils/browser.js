import domObjects from './domObjects';
import * as is from './is';
import win from './window';
const browser = {
    init,
    supportsTouch: null,
    supportsPointerEvent: null,
    isIOS7: null,
    isIOS: null,
    isIe9: null,
    isOperaMobile: null,
    prefixedMatchesSelector: null,
    pEventTypes: null,
    wheelEvent: null,
};
function init(window) {
    const Element = domObjects.Element;
    const navigator = win.window.navigator;
    // Does the browser support touch input?
    browser.supportsTouch = ('ontouchstart' in window) ||
        (is.func(window.DocumentTouch) && domObjects.document instanceof window.DocumentTouch);
    // Does the browser support PointerEvents
    browser.supportsPointerEvent = navigator.pointerEnabled !== false && !!domObjects.PointerEvent;
    browser.isIOS = (/iP(hone|od|ad)/.test(navigator.platform));
    // scrolling doesn't change the result of getClientRects on iOS 7
    browser.isIOS7 = (/iP(hone|od|ad)/.test(navigator.platform) &&
        /OS 7[^\d]/.test(navigator.appVersion));
    browser.isIe9 = /MSIE 9/.test(navigator.userAgent);
    // Opera Mobile must be handled differently
    browser.isOperaMobile = (navigator.appName === 'Opera' &&
        browser.supportsTouch &&
        /Presto/.test(navigator.userAgent));
    // prefix matchesSelector
    browser.prefixedMatchesSelector = 'matches' in Element.prototype
        ? 'matches'
        : 'webkitMatchesSelector' in Element.prototype
            ? 'webkitMatchesSelector'
            : 'mozMatchesSelector' in Element.prototype
                ? 'mozMatchesSelector'
                : 'oMatchesSelector' in Element.prototype
                    ? 'oMatchesSelector'
                    : 'msMatchesSelector';
    browser.pEventTypes = (browser.supportsPointerEvent
        ? (domObjects.PointerEvent === window.MSPointerEvent
            ? {
                up: 'MSPointerUp',
                down: 'MSPointerDown',
                over: 'mouseover',
                out: 'mouseout',
                move: 'MSPointerMove',
                cancel: 'MSPointerCancel',
            }
            : {
                up: 'pointerup',
                down: 'pointerdown',
                over: 'pointerover',
                out: 'pointerout',
                move: 'pointermove',
                cancel: 'pointercancel',
            })
        : null);
    // because Webkit and Opera still use 'mousewheel' event type
    browser.wheelEvent = 'onmousewheel' in domObjects.document ? 'mousewheel' : 'wheel';
}
export default browser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJyb3dzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxVQUFVLE1BQU0sY0FBYyxDQUFBO0FBQ3JDLE9BQU8sS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFBO0FBQzFCLE9BQU8sR0FBRyxNQUFNLFVBQVUsQ0FBQTtBQUUxQixNQUFNLE9BQU8sR0FBRztJQUNkLElBQUk7SUFDSixhQUFhLEVBQUUsSUFBZTtJQUM5QixvQkFBb0IsRUFBRSxJQUFlO0lBQ3JDLE1BQU0sRUFBRSxJQUFlO0lBQ3ZCLEtBQUssRUFBRSxJQUFlO0lBQ3RCLEtBQUssRUFBRSxJQUFlO0lBQ3RCLGFBQWEsRUFBRSxJQUFlO0lBQzlCLHVCQUF1QixFQUFFLElBQWM7SUFDdkMsV0FBVyxFQUFFLElBT1o7SUFDRCxVQUFVLEVBQUUsSUFBYztDQUMzQixDQUFBO0FBRUQsU0FBUyxJQUFJLENBQUUsTUFBTTtJQUNuQixNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFBO0lBQ2xDLE1BQU0sU0FBUyxHQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFBO0lBRXZDLHdDQUF3QztJQUN4QyxPQUFPLENBQUMsYUFBYSxHQUFHLENBQUMsY0FBYyxJQUFJLE1BQU0sQ0FBQztRQUNoRCxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxRQUFRLFlBQVksTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0lBRXhGLHlDQUF5QztJQUN6QyxPQUFPLENBQUMsb0JBQW9CLEdBQUcsU0FBUyxDQUFDLGNBQWMsS0FBSyxLQUFLLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUE7SUFFOUYsT0FBTyxDQUFDLEtBQUssR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQTtJQUUzRCxpRUFBaUU7SUFDakUsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1FBQ2xELFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUE7SUFFaEQsT0FBTyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUVsRCwyQ0FBMkM7SUFDM0MsT0FBTyxDQUFDLGFBQWEsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEtBQUssT0FBTztRQUNwRCxPQUFPLENBQUMsYUFBYTtRQUNyQixRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFBO0lBRXJDLHlCQUF5QjtJQUN6QixPQUFPLENBQUMsdUJBQXVCLEdBQUcsU0FBUyxJQUFJLE9BQU8sQ0FBQyxTQUFTO1FBQzlELENBQUMsQ0FBQyxTQUFTO1FBQ1gsQ0FBQyxDQUFDLHVCQUF1QixJQUFJLE9BQU8sQ0FBQyxTQUFTO1lBQzVDLENBQUMsQ0FBQyx1QkFBdUI7WUFDekIsQ0FBQyxDQUFDLG9CQUFvQixJQUFJLE9BQU8sQ0FBQyxTQUFTO2dCQUN6QyxDQUFDLENBQUMsb0JBQW9CO2dCQUN0QixDQUFDLENBQUMsa0JBQWtCLElBQUksT0FBTyxDQUFDLFNBQVM7b0JBQ3ZDLENBQUMsQ0FBQyxrQkFBa0I7b0JBQ3BCLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQTtJQUU3QixPQUFPLENBQUMsV0FBVyxHQUFHLENBQUMsT0FBTyxDQUFDLG9CQUFvQjtRQUNqRCxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsWUFBWSxLQUFLLE1BQU0sQ0FBQyxjQUFjO1lBQ2xELENBQUMsQ0FBQztnQkFDQSxFQUFFLEVBQU0sYUFBYTtnQkFDckIsSUFBSSxFQUFJLGVBQWU7Z0JBQ3ZCLElBQUksRUFBSSxXQUFXO2dCQUNuQixHQUFHLEVBQUssVUFBVTtnQkFDbEIsSUFBSSxFQUFJLGVBQWU7Z0JBQ3ZCLE1BQU0sRUFBRSxpQkFBaUI7YUFDMUI7WUFDRCxDQUFDLENBQUM7Z0JBQ0EsRUFBRSxFQUFNLFdBQVc7Z0JBQ25CLElBQUksRUFBSSxhQUFhO2dCQUNyQixJQUFJLEVBQUksYUFBYTtnQkFDckIsR0FBRyxFQUFLLFlBQVk7Z0JBQ3BCLElBQUksRUFBSSxhQUFhO2dCQUNyQixNQUFNLEVBQUUsZUFBZTthQUN4QixDQUFDO1FBQ0osQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBRVQsNkRBQTZEO0lBQzdELE9BQU8sQ0FBQyxVQUFVLEdBQUcsY0FBYyxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFBO0FBQ3JGLENBQUM7QUFFRCxlQUFlLE9BQU8sQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBkb21PYmplY3RzIGZyb20gJy4vZG9tT2JqZWN0cydcbmltcG9ydCAqIGFzIGlzIGZyb20gJy4vaXMnXG5pbXBvcnQgd2luIGZyb20gJy4vd2luZG93J1xuXG5jb25zdCBicm93c2VyID0ge1xuICBpbml0LFxuICBzdXBwb3J0c1RvdWNoOiBudWxsIGFzIGJvb2xlYW4sXG4gIHN1cHBvcnRzUG9pbnRlckV2ZW50OiBudWxsIGFzIGJvb2xlYW4sXG4gIGlzSU9TNzogbnVsbCBhcyBib29sZWFuLFxuICBpc0lPUzogbnVsbCBhcyBib29sZWFuLFxuICBpc0llOTogbnVsbCBhcyBib29sZWFuLFxuICBpc09wZXJhTW9iaWxlOiBudWxsIGFzIGJvb2xlYW4sXG4gIHByZWZpeGVkTWF0Y2hlc1NlbGVjdG9yOiBudWxsIGFzIHN0cmluZyxcbiAgcEV2ZW50VHlwZXM6IG51bGwgYXMge1xuICAgIHVwOiBzdHJpbmcsXG4gICAgZG93bjogc3RyaW5nLFxuICAgIG92ZXI6IHN0cmluZyxcbiAgICBvdXQ6IHN0cmluZyxcbiAgICBtb3ZlOiBzdHJpbmcsXG4gICAgY2FuY2VsOiBzdHJpbmcsXG4gIH0sXG4gIHdoZWVsRXZlbnQ6IG51bGwgYXMgc3RyaW5nLFxufVxuXG5mdW5jdGlvbiBpbml0ICh3aW5kb3cpIHtcbiAgY29uc3QgRWxlbWVudCA9IGRvbU9iamVjdHMuRWxlbWVudFxuICBjb25zdCBuYXZpZ2F0b3IgID0gd2luLndpbmRvdy5uYXZpZ2F0b3JcblxuICAvLyBEb2VzIHRoZSBicm93c2VyIHN1cHBvcnQgdG91Y2ggaW5wdXQ/XG4gIGJyb3dzZXIuc3VwcG9ydHNUb3VjaCA9ICgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpIHx8XG4gICAgKGlzLmZ1bmMod2luZG93LkRvY3VtZW50VG91Y2gpICYmIGRvbU9iamVjdHMuZG9jdW1lbnQgaW5zdGFuY2VvZiB3aW5kb3cuRG9jdW1lbnRUb3VjaClcblxuICAvLyBEb2VzIHRoZSBicm93c2VyIHN1cHBvcnQgUG9pbnRlckV2ZW50c1xuICBicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50ID0gbmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkICE9PSBmYWxzZSAmJiAhIWRvbU9iamVjdHMuUG9pbnRlckV2ZW50XG5cbiAgYnJvd3Nlci5pc0lPUyA9ICgvaVAoaG9uZXxvZHxhZCkvLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKSlcblxuICAvLyBzY3JvbGxpbmcgZG9lc24ndCBjaGFuZ2UgdGhlIHJlc3VsdCBvZiBnZXRDbGllbnRSZWN0cyBvbiBpT1MgN1xuICBicm93c2VyLmlzSU9TNyA9ICgvaVAoaG9uZXxvZHxhZCkvLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKSAmJlxuICAgICAgICAgICAvT1MgN1teXFxkXS8udGVzdChuYXZpZ2F0b3IuYXBwVmVyc2lvbikpXG5cbiAgYnJvd3Nlci5pc0llOSA9IC9NU0lFIDkvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudClcblxuICAvLyBPcGVyYSBNb2JpbGUgbXVzdCBiZSBoYW5kbGVkIGRpZmZlcmVudGx5XG4gIGJyb3dzZXIuaXNPcGVyYU1vYmlsZSA9IChuYXZpZ2F0b3IuYXBwTmFtZSA9PT0gJ09wZXJhJyAmJlxuICAgIGJyb3dzZXIuc3VwcG9ydHNUb3VjaCAmJlxuICAgIC9QcmVzdG8vLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpXG5cbiAgLy8gcHJlZml4IG1hdGNoZXNTZWxlY3RvclxuICBicm93c2VyLnByZWZpeGVkTWF0Y2hlc1NlbGVjdG9yID0gJ21hdGNoZXMnIGluIEVsZW1lbnQucHJvdG90eXBlXG4gICAgPyAnbWF0Y2hlcydcbiAgICA6ICd3ZWJraXRNYXRjaGVzU2VsZWN0b3InIGluIEVsZW1lbnQucHJvdG90eXBlXG4gICAgICA/ICd3ZWJraXRNYXRjaGVzU2VsZWN0b3InXG4gICAgICA6ICdtb3pNYXRjaGVzU2VsZWN0b3InIGluIEVsZW1lbnQucHJvdG90eXBlXG4gICAgICAgID8gJ21vek1hdGNoZXNTZWxlY3RvcidcbiAgICAgICAgOiAnb01hdGNoZXNTZWxlY3RvcicgaW4gRWxlbWVudC5wcm90b3R5cGVcbiAgICAgICAgICA/ICdvTWF0Y2hlc1NlbGVjdG9yJ1xuICAgICAgICAgIDogJ21zTWF0Y2hlc1NlbGVjdG9yJ1xuXG4gIGJyb3dzZXIucEV2ZW50VHlwZXMgPSAoYnJvd3Nlci5zdXBwb3J0c1BvaW50ZXJFdmVudFxuICAgID8gKGRvbU9iamVjdHMuUG9pbnRlckV2ZW50ID09PSB3aW5kb3cuTVNQb2ludGVyRXZlbnRcbiAgICAgID8ge1xuICAgICAgICB1cDogICAgICdNU1BvaW50ZXJVcCcsXG4gICAgICAgIGRvd246ICAgJ01TUG9pbnRlckRvd24nLFxuICAgICAgICBvdmVyOiAgICdtb3VzZW92ZXInLFxuICAgICAgICBvdXQ6ICAgICdtb3VzZW91dCcsXG4gICAgICAgIG1vdmU6ICAgJ01TUG9pbnRlck1vdmUnLFxuICAgICAgICBjYW5jZWw6ICdNU1BvaW50ZXJDYW5jZWwnLFxuICAgICAgfVxuICAgICAgOiB7XG4gICAgICAgIHVwOiAgICAgJ3BvaW50ZXJ1cCcsXG4gICAgICAgIGRvd246ICAgJ3BvaW50ZXJkb3duJyxcbiAgICAgICAgb3ZlcjogICAncG9pbnRlcm92ZXInLFxuICAgICAgICBvdXQ6ICAgICdwb2ludGVyb3V0JyxcbiAgICAgICAgbW92ZTogICAncG9pbnRlcm1vdmUnLFxuICAgICAgICBjYW5jZWw6ICdwb2ludGVyY2FuY2VsJyxcbiAgICAgIH0pXG4gICAgOiBudWxsKVxuXG4gIC8vIGJlY2F1c2UgV2Via2l0IGFuZCBPcGVyYSBzdGlsbCB1c2UgJ21vdXNld2hlZWwnIGV2ZW50IHR5cGVcbiAgYnJvd3Nlci53aGVlbEV2ZW50ID0gJ29ubW91c2V3aGVlbCcgaW4gZG9tT2JqZWN0cy5kb2N1bWVudCA/ICdtb3VzZXdoZWVsJyA6ICd3aGVlbCdcbn1cblxuZXhwb3J0IGRlZmF1bHQgYnJvd3NlclxuIl19