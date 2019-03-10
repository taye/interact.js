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
    browser.supportsPointerEvent = !!domObjects.PointerEvent;
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
    browser.pEventTypes = (domObjects.PointerEvent && (navigator.maxTouchPoints || navigator.msMaxTouchPoints)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJyb3dzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxVQUFVLE1BQU0sY0FBYyxDQUFBO0FBQ3JDLE9BQU8sS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFBO0FBQzFCLE9BQU8sR0FBRyxNQUFNLFVBQVUsQ0FBQTtBQUUxQixNQUFNLE9BQU8sR0FBRztJQUNkLElBQUk7SUFDSixhQUFhLEVBQUUsSUFBZTtJQUM5QixvQkFBb0IsRUFBRSxJQUFlO0lBQ3JDLE1BQU0sRUFBRSxJQUFlO0lBQ3ZCLEtBQUssRUFBRSxJQUFlO0lBQ3RCLEtBQUssRUFBRSxJQUFlO0lBQ3RCLGFBQWEsRUFBRSxJQUFlO0lBQzlCLHVCQUF1QixFQUFFLElBQWM7SUFDdkMsV0FBVyxFQUFFLElBT1o7SUFDRCxVQUFVLEVBQUUsSUFBYztDQUMzQixDQUFBO0FBRUQsU0FBUyxJQUFJLENBQUUsTUFBTTtJQUNuQixNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFBO0lBQ2xDLE1BQU0sU0FBUyxHQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFBO0lBRXZDLHdDQUF3QztJQUN4QyxPQUFPLENBQUMsYUFBYSxHQUFHLENBQUMsY0FBYyxJQUFJLE1BQU0sQ0FBQztRQUNoRCxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxRQUFRLFlBQVksTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0lBRXhGLHlDQUF5QztJQUN6QyxPQUFPLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUE7SUFFeEQsT0FBTyxDQUFDLEtBQUssR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQTtJQUUzRCxpRUFBaUU7SUFDakUsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1FBQ2xELFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUE7SUFFaEQsT0FBTyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUVsRCwyQ0FBMkM7SUFDM0MsT0FBTyxDQUFDLGFBQWEsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEtBQUssT0FBTztRQUNwRCxPQUFPLENBQUMsYUFBYTtRQUNyQixRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFBO0lBRXJDLHlCQUF5QjtJQUN6QixPQUFPLENBQUMsdUJBQXVCLEdBQUcsU0FBUyxJQUFJLE9BQU8sQ0FBQyxTQUFTO1FBQzlELENBQUMsQ0FBQyxTQUFTO1FBQ1gsQ0FBQyxDQUFDLHVCQUF1QixJQUFJLE9BQU8sQ0FBQyxTQUFTO1lBQzVDLENBQUMsQ0FBQyx1QkFBdUI7WUFDekIsQ0FBQyxDQUFDLG9CQUFvQixJQUFJLE9BQU8sQ0FBQyxTQUFTO2dCQUN6QyxDQUFDLENBQUMsb0JBQW9CO2dCQUN0QixDQUFDLENBQUMsa0JBQWtCLElBQUksT0FBTyxDQUFDLFNBQVM7b0JBQ3ZDLENBQUMsQ0FBQyxrQkFBa0I7b0JBQ3BCLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQTtJQUU3QixPQUFPLENBQUMsV0FBVyxHQUFHLENBQUMsVUFBVSxDQUFDLFlBQVksSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLElBQUksU0FBUyxDQUFDLGdCQUFnQixDQUFDO1FBQ3hHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxZQUFZLEtBQUssTUFBTSxDQUFDLGNBQWM7WUFDbEQsQ0FBQyxDQUFDO2dCQUNBLEVBQUUsRUFBTSxhQUFhO2dCQUNyQixJQUFJLEVBQUksZUFBZTtnQkFDdkIsSUFBSSxFQUFJLFdBQVc7Z0JBQ25CLEdBQUcsRUFBSyxVQUFVO2dCQUNsQixJQUFJLEVBQUksZUFBZTtnQkFDdkIsTUFBTSxFQUFFLGlCQUFpQjthQUMxQjtZQUNELENBQUMsQ0FBQztnQkFDQSxFQUFFLEVBQU0sV0FBVztnQkFDbkIsSUFBSSxFQUFJLGFBQWE7Z0JBQ3JCLElBQUksRUFBSSxhQUFhO2dCQUNyQixHQUFHLEVBQUssWUFBWTtnQkFDcEIsSUFBSSxFQUFJLGFBQWE7Z0JBQ3JCLE1BQU0sRUFBRSxlQUFlO2FBQ3hCLENBQUM7UUFDSixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUE7SUFFVCw2REFBNkQ7SUFDN0QsT0FBTyxDQUFDLFVBQVUsR0FBRyxjQUFjLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUE7QUFDckYsQ0FBQztBQUVELGVBQWUsT0FBTyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGRvbU9iamVjdHMgZnJvbSAnLi9kb21PYmplY3RzJ1xuaW1wb3J0ICogYXMgaXMgZnJvbSAnLi9pcydcbmltcG9ydCB3aW4gZnJvbSAnLi93aW5kb3cnXG5cbmNvbnN0IGJyb3dzZXIgPSB7XG4gIGluaXQsXG4gIHN1cHBvcnRzVG91Y2g6IG51bGwgYXMgYm9vbGVhbixcbiAgc3VwcG9ydHNQb2ludGVyRXZlbnQ6IG51bGwgYXMgYm9vbGVhbixcbiAgaXNJT1M3OiBudWxsIGFzIGJvb2xlYW4sXG4gIGlzSU9TOiBudWxsIGFzIGJvb2xlYW4sXG4gIGlzSWU5OiBudWxsIGFzIGJvb2xlYW4sXG4gIGlzT3BlcmFNb2JpbGU6IG51bGwgYXMgYm9vbGVhbixcbiAgcHJlZml4ZWRNYXRjaGVzU2VsZWN0b3I6IG51bGwgYXMgc3RyaW5nLFxuICBwRXZlbnRUeXBlczogbnVsbCBhcyB7XG4gICAgdXA6IHN0cmluZyxcbiAgICBkb3duOiBzdHJpbmcsXG4gICAgb3Zlcjogc3RyaW5nLFxuICAgIG91dDogc3RyaW5nLFxuICAgIG1vdmU6IHN0cmluZyxcbiAgICBjYW5jZWw6IHN0cmluZyxcbiAgfSxcbiAgd2hlZWxFdmVudDogbnVsbCBhcyBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIGluaXQgKHdpbmRvdykge1xuICBjb25zdCBFbGVtZW50ID0gZG9tT2JqZWN0cy5FbGVtZW50XG4gIGNvbnN0IG5hdmlnYXRvciAgPSB3aW4ud2luZG93Lm5hdmlnYXRvclxuXG4gIC8vIERvZXMgdGhlIGJyb3dzZXIgc3VwcG9ydCB0b3VjaCBpbnB1dD9cbiAgYnJvd3Nlci5zdXBwb3J0c1RvdWNoID0gKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykgfHxcbiAgICAoaXMuZnVuYyh3aW5kb3cuRG9jdW1lbnRUb3VjaCkgJiYgZG9tT2JqZWN0cy5kb2N1bWVudCBpbnN0YW5jZW9mIHdpbmRvdy5Eb2N1bWVudFRvdWNoKVxuXG4gIC8vIERvZXMgdGhlIGJyb3dzZXIgc3VwcG9ydCBQb2ludGVyRXZlbnRzXG4gIGJyb3dzZXIuc3VwcG9ydHNQb2ludGVyRXZlbnQgPSAhIWRvbU9iamVjdHMuUG9pbnRlckV2ZW50XG5cbiAgYnJvd3Nlci5pc0lPUyA9ICgvaVAoaG9uZXxvZHxhZCkvLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKSlcblxuICAvLyBzY3JvbGxpbmcgZG9lc24ndCBjaGFuZ2UgdGhlIHJlc3VsdCBvZiBnZXRDbGllbnRSZWN0cyBvbiBpT1MgN1xuICBicm93c2VyLmlzSU9TNyA9ICgvaVAoaG9uZXxvZHxhZCkvLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKSAmJlxuICAgICAgICAgICAvT1MgN1teXFxkXS8udGVzdChuYXZpZ2F0b3IuYXBwVmVyc2lvbikpXG5cbiAgYnJvd3Nlci5pc0llOSA9IC9NU0lFIDkvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudClcblxuICAvLyBPcGVyYSBNb2JpbGUgbXVzdCBiZSBoYW5kbGVkIGRpZmZlcmVudGx5XG4gIGJyb3dzZXIuaXNPcGVyYU1vYmlsZSA9IChuYXZpZ2F0b3IuYXBwTmFtZSA9PT0gJ09wZXJhJyAmJlxuICAgIGJyb3dzZXIuc3VwcG9ydHNUb3VjaCAmJlxuICAgIC9QcmVzdG8vLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpXG5cbiAgLy8gcHJlZml4IG1hdGNoZXNTZWxlY3RvclxuICBicm93c2VyLnByZWZpeGVkTWF0Y2hlc1NlbGVjdG9yID0gJ21hdGNoZXMnIGluIEVsZW1lbnQucHJvdG90eXBlXG4gICAgPyAnbWF0Y2hlcydcbiAgICA6ICd3ZWJraXRNYXRjaGVzU2VsZWN0b3InIGluIEVsZW1lbnQucHJvdG90eXBlXG4gICAgICA/ICd3ZWJraXRNYXRjaGVzU2VsZWN0b3InXG4gICAgICA6ICdtb3pNYXRjaGVzU2VsZWN0b3InIGluIEVsZW1lbnQucHJvdG90eXBlXG4gICAgICAgID8gJ21vek1hdGNoZXNTZWxlY3RvcidcbiAgICAgICAgOiAnb01hdGNoZXNTZWxlY3RvcicgaW4gRWxlbWVudC5wcm90b3R5cGVcbiAgICAgICAgICA/ICdvTWF0Y2hlc1NlbGVjdG9yJ1xuICAgICAgICAgIDogJ21zTWF0Y2hlc1NlbGVjdG9yJ1xuXG4gIGJyb3dzZXIucEV2ZW50VHlwZXMgPSAoZG9tT2JqZWN0cy5Qb2ludGVyRXZlbnQgJiYgKG5hdmlnYXRvci5tYXhUb3VjaFBvaW50cyB8fCBuYXZpZ2F0b3IubXNNYXhUb3VjaFBvaW50cylcbiAgICA/IChkb21PYmplY3RzLlBvaW50ZXJFdmVudCA9PT0gd2luZG93Lk1TUG9pbnRlckV2ZW50XG4gICAgICA/IHtcbiAgICAgICAgdXA6ICAgICAnTVNQb2ludGVyVXAnLFxuICAgICAgICBkb3duOiAgICdNU1BvaW50ZXJEb3duJyxcbiAgICAgICAgb3ZlcjogICAnbW91c2VvdmVyJyxcbiAgICAgICAgb3V0OiAgICAnbW91c2VvdXQnLFxuICAgICAgICBtb3ZlOiAgICdNU1BvaW50ZXJNb3ZlJyxcbiAgICAgICAgY2FuY2VsOiAnTVNQb2ludGVyQ2FuY2VsJyxcbiAgICAgIH1cbiAgICAgIDoge1xuICAgICAgICB1cDogICAgICdwb2ludGVydXAnLFxuICAgICAgICBkb3duOiAgICdwb2ludGVyZG93bicsXG4gICAgICAgIG92ZXI6ICAgJ3BvaW50ZXJvdmVyJyxcbiAgICAgICAgb3V0OiAgICAncG9pbnRlcm91dCcsXG4gICAgICAgIG1vdmU6ICAgJ3BvaW50ZXJtb3ZlJyxcbiAgICAgICAgY2FuY2VsOiAncG9pbnRlcmNhbmNlbCcsXG4gICAgICB9KVxuICAgIDogbnVsbClcblxuICAvLyBiZWNhdXNlIFdlYmtpdCBhbmQgT3BlcmEgc3RpbGwgdXNlICdtb3VzZXdoZWVsJyBldmVudCB0eXBlXG4gIGJyb3dzZXIud2hlZWxFdmVudCA9ICdvbm1vdXNld2hlZWwnIGluIGRvbU9iamVjdHMuZG9jdW1lbnQgPyAnbW91c2V3aGVlbCcgOiAnd2hlZWwnXG59XG5cbmV4cG9ydCBkZWZhdWx0IGJyb3dzZXJcbiJdfQ==