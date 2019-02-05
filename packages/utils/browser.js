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
        navigator.userAgent.match('Presto'));
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
    browser.pEventTypes = (domObjects.PointerEvent
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJyb3dzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxVQUFVLE1BQU0sY0FBYyxDQUFBO0FBQ3JDLE9BQU8sS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFBO0FBQzFCLE9BQU8sR0FBRyxNQUFNLFVBQVUsQ0FBQTtBQUUxQixNQUFNLE9BQU8sR0FBRztJQUNkLElBQUk7SUFDSixhQUFhLEVBQUUsSUFBZTtJQUM5QixvQkFBb0IsRUFBRSxJQUFlO0lBQ3JDLE1BQU0sRUFBRSxJQUFlO0lBQ3ZCLEtBQUssRUFBRSxJQUFlO0lBQ3RCLEtBQUssRUFBRSxJQUFlO0lBQ3RCLGFBQWEsRUFBRSxJQUFlO0lBQzlCLHVCQUF1QixFQUFFLElBQWM7SUFDdkMsV0FBVyxFQUFFLElBT1o7SUFDRCxVQUFVLEVBQUUsSUFBYztDQUMzQixDQUFBO0FBRUQsU0FBUyxJQUFJLENBQUUsTUFBTTtJQUNuQixNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBYyxDQUFBO0lBQ3pDLE1BQU0sU0FBUyxHQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFBO0lBRXZDLHdDQUF3QztJQUN4QyxPQUFPLENBQUMsYUFBYSxHQUFHLENBQUMsY0FBYyxJQUFJLE1BQU0sQ0FBQztRQUNoRCxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxRQUFRLFlBQVksTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0lBRXhGLHlDQUF5QztJQUN6QyxPQUFPLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUE7SUFFeEQsT0FBTyxDQUFDLEtBQUssR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQTtJQUUzRCxpRUFBaUU7SUFDakUsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1FBQ2xELFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUE7SUFFaEQsT0FBTyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUVsRCwyQ0FBMkM7SUFDM0MsT0FBTyxDQUFDLGFBQWEsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEtBQUssT0FBTztRQUNwRCxPQUFPLENBQUMsYUFBYTtRQUNyQixTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO0lBRXRDLHlCQUF5QjtJQUN6QixPQUFPLENBQUMsdUJBQXVCLEdBQUcsU0FBUyxJQUFJLE9BQU8sQ0FBQyxTQUFTO1FBQzlELENBQUMsQ0FBQyxTQUFTO1FBQ1gsQ0FBQyxDQUFDLHVCQUF1QixJQUFJLE9BQU8sQ0FBQyxTQUFTO1lBQzVDLENBQUMsQ0FBQyx1QkFBdUI7WUFDekIsQ0FBQyxDQUFDLG9CQUFvQixJQUFJLE9BQU8sQ0FBQyxTQUFTO2dCQUN6QyxDQUFDLENBQUMsb0JBQW9CO2dCQUN0QixDQUFDLENBQUMsa0JBQWtCLElBQUksT0FBTyxDQUFDLFNBQVM7b0JBQ3ZDLENBQUMsQ0FBQyxrQkFBa0I7b0JBQ3BCLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQTtJQUU3QixPQUFPLENBQUMsV0FBVyxHQUFHLENBQUMsVUFBVSxDQUFDLFlBQVk7UUFDNUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFlBQVksS0FBSyxNQUFNLENBQUMsY0FBYztZQUNsRCxDQUFDLENBQUM7Z0JBQ0EsRUFBRSxFQUFNLGFBQWE7Z0JBQ3JCLElBQUksRUFBSSxlQUFlO2dCQUN2QixJQUFJLEVBQUksV0FBVztnQkFDbkIsR0FBRyxFQUFLLFVBQVU7Z0JBQ2xCLElBQUksRUFBSSxlQUFlO2dCQUN2QixNQUFNLEVBQUUsaUJBQWlCO2FBQzFCO1lBQ0QsQ0FBQyxDQUFDO2dCQUNBLEVBQUUsRUFBTSxXQUFXO2dCQUNuQixJQUFJLEVBQUksYUFBYTtnQkFDckIsSUFBSSxFQUFJLGFBQWE7Z0JBQ3JCLEdBQUcsRUFBSyxZQUFZO2dCQUNwQixJQUFJLEVBQUksYUFBYTtnQkFDckIsTUFBTSxFQUFFLGVBQWU7YUFDeEIsQ0FBQztRQUNKLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUVULDZEQUE2RDtJQUM3RCxPQUFPLENBQUMsVUFBVSxHQUFHLGNBQWMsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQTtBQUNyRixDQUFDO0FBRUQsZUFBZSxPQUFPLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZG9tT2JqZWN0cyBmcm9tICcuL2RvbU9iamVjdHMnXG5pbXBvcnQgKiBhcyBpcyBmcm9tICcuL2lzJ1xuaW1wb3J0IHdpbiBmcm9tICcuL3dpbmRvdydcblxuY29uc3QgYnJvd3NlciA9IHtcbiAgaW5pdCxcbiAgc3VwcG9ydHNUb3VjaDogbnVsbCBhcyBib29sZWFuLFxuICBzdXBwb3J0c1BvaW50ZXJFdmVudDogbnVsbCBhcyBib29sZWFuLFxuICBpc0lPUzc6IG51bGwgYXMgYm9vbGVhbixcbiAgaXNJT1M6IG51bGwgYXMgYm9vbGVhbixcbiAgaXNJZTk6IG51bGwgYXMgYm9vbGVhbixcbiAgaXNPcGVyYU1vYmlsZTogbnVsbCBhcyBib29sZWFuLFxuICBwcmVmaXhlZE1hdGNoZXNTZWxlY3RvcjogbnVsbCBhcyBzdHJpbmcsXG4gIHBFdmVudFR5cGVzOiBudWxsIGFzIHtcbiAgICB1cDogc3RyaW5nLFxuICAgIGRvd246IHN0cmluZyxcbiAgICBvdmVyOiBzdHJpbmcsXG4gICAgb3V0OiBzdHJpbmcsXG4gICAgbW92ZTogc3RyaW5nLFxuICAgIGNhbmNlbDogc3RyaW5nLFxuICB9LFxuICB3aGVlbEV2ZW50OiBudWxsIGFzIHN0cmluZyxcbn1cblxuZnVuY3Rpb24gaW5pdCAod2luZG93KSB7XG4gIGNvbnN0IEVsZW1lbnQgPSBkb21PYmplY3RzLkVsZW1lbnQgYXMgYW55XG4gIGNvbnN0IG5hdmlnYXRvciAgPSB3aW4ud2luZG93Lm5hdmlnYXRvclxuXG4gIC8vIERvZXMgdGhlIGJyb3dzZXIgc3VwcG9ydCB0b3VjaCBpbnB1dD9cbiAgYnJvd3Nlci5zdXBwb3J0c1RvdWNoID0gKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykgfHxcbiAgICAoaXMuZnVuYyh3aW5kb3cuRG9jdW1lbnRUb3VjaCkgJiYgZG9tT2JqZWN0cy5kb2N1bWVudCBpbnN0YW5jZW9mIHdpbmRvdy5Eb2N1bWVudFRvdWNoKVxuXG4gIC8vIERvZXMgdGhlIGJyb3dzZXIgc3VwcG9ydCBQb2ludGVyRXZlbnRzXG4gIGJyb3dzZXIuc3VwcG9ydHNQb2ludGVyRXZlbnQgPSAhIWRvbU9iamVjdHMuUG9pbnRlckV2ZW50XG5cbiAgYnJvd3Nlci5pc0lPUyA9ICgvaVAoaG9uZXxvZHxhZCkvLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKSlcblxuICAvLyBzY3JvbGxpbmcgZG9lc24ndCBjaGFuZ2UgdGhlIHJlc3VsdCBvZiBnZXRDbGllbnRSZWN0cyBvbiBpT1MgN1xuICBicm93c2VyLmlzSU9TNyA9ICgvaVAoaG9uZXxvZHxhZCkvLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKSAmJlxuICAgICAgICAgICAvT1MgN1teXFxkXS8udGVzdChuYXZpZ2F0b3IuYXBwVmVyc2lvbikpXG5cbiAgYnJvd3Nlci5pc0llOSA9IC9NU0lFIDkvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudClcblxuICAvLyBPcGVyYSBNb2JpbGUgbXVzdCBiZSBoYW5kbGVkIGRpZmZlcmVudGx5XG4gIGJyb3dzZXIuaXNPcGVyYU1vYmlsZSA9IChuYXZpZ2F0b3IuYXBwTmFtZSA9PT0gJ09wZXJhJyAmJlxuICAgIGJyb3dzZXIuc3VwcG9ydHNUb3VjaCAmJlxuICAgIG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goJ1ByZXN0bycpKVxuXG4gIC8vIHByZWZpeCBtYXRjaGVzU2VsZWN0b3JcbiAgYnJvd3Nlci5wcmVmaXhlZE1hdGNoZXNTZWxlY3RvciA9ICdtYXRjaGVzJyBpbiBFbGVtZW50LnByb3RvdHlwZVxuICAgID8gJ21hdGNoZXMnXG4gICAgOiAnd2Via2l0TWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZVxuICAgICAgPyAnd2Via2l0TWF0Y2hlc1NlbGVjdG9yJ1xuICAgICAgOiAnbW96TWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZVxuICAgICAgICA/ICdtb3pNYXRjaGVzU2VsZWN0b3InXG4gICAgICAgIDogJ29NYXRjaGVzU2VsZWN0b3InIGluIEVsZW1lbnQucHJvdG90eXBlXG4gICAgICAgICAgPyAnb01hdGNoZXNTZWxlY3RvcidcbiAgICAgICAgICA6ICdtc01hdGNoZXNTZWxlY3RvcidcblxuICBicm93c2VyLnBFdmVudFR5cGVzID0gKGRvbU9iamVjdHMuUG9pbnRlckV2ZW50XG4gICAgPyAoZG9tT2JqZWN0cy5Qb2ludGVyRXZlbnQgPT09IHdpbmRvdy5NU1BvaW50ZXJFdmVudFxuICAgICAgPyB7XG4gICAgICAgIHVwOiAgICAgJ01TUG9pbnRlclVwJyxcbiAgICAgICAgZG93bjogICAnTVNQb2ludGVyRG93bicsXG4gICAgICAgIG92ZXI6ICAgJ21vdXNlb3ZlcicsXG4gICAgICAgIG91dDogICAgJ21vdXNlb3V0JyxcbiAgICAgICAgbW92ZTogICAnTVNQb2ludGVyTW92ZScsXG4gICAgICAgIGNhbmNlbDogJ01TUG9pbnRlckNhbmNlbCcsXG4gICAgICB9XG4gICAgICA6IHtcbiAgICAgICAgdXA6ICAgICAncG9pbnRlcnVwJyxcbiAgICAgICAgZG93bjogICAncG9pbnRlcmRvd24nLFxuICAgICAgICBvdmVyOiAgICdwb2ludGVyb3ZlcicsXG4gICAgICAgIG91dDogICAgJ3BvaW50ZXJvdXQnLFxuICAgICAgICBtb3ZlOiAgICdwb2ludGVybW92ZScsXG4gICAgICAgIGNhbmNlbDogJ3BvaW50ZXJjYW5jZWwnLFxuICAgICAgfSlcbiAgICA6IG51bGwpXG5cbiAgLy8gYmVjYXVzZSBXZWJraXQgYW5kIE9wZXJhIHN0aWxsIHVzZSAnbW91c2V3aGVlbCcgZXZlbnQgdHlwZVxuICBicm93c2VyLndoZWVsRXZlbnQgPSAnb25tb3VzZXdoZWVsJyBpbiBkb21PYmplY3RzLmRvY3VtZW50ID8gJ21vdXNld2hlZWwnIDogJ3doZWVsJ1xufVxuXG5leHBvcnQgZGVmYXVsdCBicm93c2VyXG4iXX0=