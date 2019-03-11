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
    browser.supportsPointerEvent = domObjects.PointerEvent === window.MSPointerEvent
        ? (navigator.maxTouchPoints || navigator.msMaxTouchPoints) > 0
        : !!domObjects.PointerEvent;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJyb3dzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxVQUFVLE1BQU0sY0FBYyxDQUFBO0FBQ3JDLE9BQU8sS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFBO0FBQzFCLE9BQU8sR0FBRyxNQUFNLFVBQVUsQ0FBQTtBQUUxQixNQUFNLE9BQU8sR0FBRztJQUNkLElBQUk7SUFDSixhQUFhLEVBQUUsSUFBZTtJQUM5QixvQkFBb0IsRUFBRSxJQUFlO0lBQ3JDLE1BQU0sRUFBRSxJQUFlO0lBQ3ZCLEtBQUssRUFBRSxJQUFlO0lBQ3RCLEtBQUssRUFBRSxJQUFlO0lBQ3RCLGFBQWEsRUFBRSxJQUFlO0lBQzlCLHVCQUF1QixFQUFFLElBQWM7SUFDdkMsV0FBVyxFQUFFLElBT1o7SUFDRCxVQUFVLEVBQUUsSUFBYztDQUMzQixDQUFBO0FBRUQsU0FBUyxJQUFJLENBQUUsTUFBTTtJQUNuQixNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFBO0lBQ2xDLE1BQU0sU0FBUyxHQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFBO0lBRXZDLHdDQUF3QztJQUN4QyxPQUFPLENBQUMsYUFBYSxHQUFHLENBQUMsY0FBYyxJQUFJLE1BQU0sQ0FBQztRQUNoRCxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxRQUFRLFlBQVksTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0lBRXhGLHlDQUF5QztJQUN6QyxPQUFPLENBQUMsb0JBQW9CLEdBQUcsVUFBVSxDQUFDLFlBQVksS0FBSyxNQUFNLENBQUMsY0FBYztRQUM5RSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsY0FBYyxJQUFJLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUM7UUFDOUQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFBO0lBRTdCLE9BQU8sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUE7SUFFM0QsaUVBQWlFO0lBQ2pFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztRQUNsRCxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO0lBRWhELE9BQU8sQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUE7SUFFbEQsMkNBQTJDO0lBQzNDLE9BQU8sQ0FBQyxhQUFhLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxLQUFLLE9BQU87UUFDcEQsT0FBTyxDQUFDLGFBQWE7UUFDckIsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQTtJQUVyQyx5QkFBeUI7SUFDekIsT0FBTyxDQUFDLHVCQUF1QixHQUFHLFNBQVMsSUFBSSxPQUFPLENBQUMsU0FBUztRQUM5RCxDQUFDLENBQUMsU0FBUztRQUNYLENBQUMsQ0FBQyx1QkFBdUIsSUFBSSxPQUFPLENBQUMsU0FBUztZQUM1QyxDQUFDLENBQUMsdUJBQXVCO1lBQ3pCLENBQUMsQ0FBQyxvQkFBb0IsSUFBSSxPQUFPLENBQUMsU0FBUztnQkFDekMsQ0FBQyxDQUFDLG9CQUFvQjtnQkFDdEIsQ0FBQyxDQUFDLGtCQUFrQixJQUFJLE9BQU8sQ0FBQyxTQUFTO29CQUN2QyxDQUFDLENBQUMsa0JBQWtCO29CQUNwQixDQUFDLENBQUMsbUJBQW1CLENBQUE7SUFFN0IsT0FBTyxDQUFDLFdBQVcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0I7UUFDakQsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFlBQVksS0FBSyxNQUFNLENBQUMsY0FBYztZQUNsRCxDQUFDLENBQUM7Z0JBQ0EsRUFBRSxFQUFNLGFBQWE7Z0JBQ3JCLElBQUksRUFBSSxlQUFlO2dCQUN2QixJQUFJLEVBQUksV0FBVztnQkFDbkIsR0FBRyxFQUFLLFVBQVU7Z0JBQ2xCLElBQUksRUFBSSxlQUFlO2dCQUN2QixNQUFNLEVBQUUsaUJBQWlCO2FBQzFCO1lBQ0QsQ0FBQyxDQUFDO2dCQUNBLEVBQUUsRUFBTSxXQUFXO2dCQUNuQixJQUFJLEVBQUksYUFBYTtnQkFDckIsSUFBSSxFQUFJLGFBQWE7Z0JBQ3JCLEdBQUcsRUFBSyxZQUFZO2dCQUNwQixJQUFJLEVBQUksYUFBYTtnQkFDckIsTUFBTSxFQUFFLGVBQWU7YUFDeEIsQ0FBQztRQUNKLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUVULDZEQUE2RDtJQUM3RCxPQUFPLENBQUMsVUFBVSxHQUFHLGNBQWMsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQTtBQUNyRixDQUFDO0FBRUQsZUFBZSxPQUFPLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZG9tT2JqZWN0cyBmcm9tICcuL2RvbU9iamVjdHMnXG5pbXBvcnQgKiBhcyBpcyBmcm9tICcuL2lzJ1xuaW1wb3J0IHdpbiBmcm9tICcuL3dpbmRvdydcblxuY29uc3QgYnJvd3NlciA9IHtcbiAgaW5pdCxcbiAgc3VwcG9ydHNUb3VjaDogbnVsbCBhcyBib29sZWFuLFxuICBzdXBwb3J0c1BvaW50ZXJFdmVudDogbnVsbCBhcyBib29sZWFuLFxuICBpc0lPUzc6IG51bGwgYXMgYm9vbGVhbixcbiAgaXNJT1M6IG51bGwgYXMgYm9vbGVhbixcbiAgaXNJZTk6IG51bGwgYXMgYm9vbGVhbixcbiAgaXNPcGVyYU1vYmlsZTogbnVsbCBhcyBib29sZWFuLFxuICBwcmVmaXhlZE1hdGNoZXNTZWxlY3RvcjogbnVsbCBhcyBzdHJpbmcsXG4gIHBFdmVudFR5cGVzOiBudWxsIGFzIHtcbiAgICB1cDogc3RyaW5nLFxuICAgIGRvd246IHN0cmluZyxcbiAgICBvdmVyOiBzdHJpbmcsXG4gICAgb3V0OiBzdHJpbmcsXG4gICAgbW92ZTogc3RyaW5nLFxuICAgIGNhbmNlbDogc3RyaW5nLFxuICB9LFxuICB3aGVlbEV2ZW50OiBudWxsIGFzIHN0cmluZyxcbn1cblxuZnVuY3Rpb24gaW5pdCAod2luZG93KSB7XG4gIGNvbnN0IEVsZW1lbnQgPSBkb21PYmplY3RzLkVsZW1lbnRcbiAgY29uc3QgbmF2aWdhdG9yICA9IHdpbi53aW5kb3cubmF2aWdhdG9yXG5cbiAgLy8gRG9lcyB0aGUgYnJvd3NlciBzdXBwb3J0IHRvdWNoIGlucHV0P1xuICBicm93c2VyLnN1cHBvcnRzVG91Y2ggPSAoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KSB8fFxuICAgIChpcy5mdW5jKHdpbmRvdy5Eb2N1bWVudFRvdWNoKSAmJiBkb21PYmplY3RzLmRvY3VtZW50IGluc3RhbmNlb2Ygd2luZG93LkRvY3VtZW50VG91Y2gpXG5cbiAgLy8gRG9lcyB0aGUgYnJvd3NlciBzdXBwb3J0IFBvaW50ZXJFdmVudHNcbiAgYnJvd3Nlci5zdXBwb3J0c1BvaW50ZXJFdmVudCA9IGRvbU9iamVjdHMuUG9pbnRlckV2ZW50ID09PSB3aW5kb3cuTVNQb2ludGVyRXZlbnRcbiAgICA/IChuYXZpZ2F0b3IubWF4VG91Y2hQb2ludHMgfHwgbmF2aWdhdG9yLm1zTWF4VG91Y2hQb2ludHMpID4gMFxuICAgIDogISFkb21PYmplY3RzLlBvaW50ZXJFdmVudFxuXG4gIGJyb3dzZXIuaXNJT1MgPSAoL2lQKGhvbmV8b2R8YWQpLy50ZXN0KG5hdmlnYXRvci5wbGF0Zm9ybSkpXG5cbiAgLy8gc2Nyb2xsaW5nIGRvZXNuJ3QgY2hhbmdlIHRoZSByZXN1bHQgb2YgZ2V0Q2xpZW50UmVjdHMgb24gaU9TIDdcbiAgYnJvd3Nlci5pc0lPUzcgPSAoL2lQKGhvbmV8b2R8YWQpLy50ZXN0KG5hdmlnYXRvci5wbGF0Zm9ybSkgJiZcbiAgICAgICAgICAgL09TIDdbXlxcZF0vLnRlc3QobmF2aWdhdG9yLmFwcFZlcnNpb24pKVxuXG4gIGJyb3dzZXIuaXNJZTkgPSAvTVNJRSA5Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpXG5cbiAgLy8gT3BlcmEgTW9iaWxlIG11c3QgYmUgaGFuZGxlZCBkaWZmZXJlbnRseVxuICBicm93c2VyLmlzT3BlcmFNb2JpbGUgPSAobmF2aWdhdG9yLmFwcE5hbWUgPT09ICdPcGVyYScgJiZcbiAgICBicm93c2VyLnN1cHBvcnRzVG91Y2ggJiZcbiAgICAvUHJlc3RvLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKVxuXG4gIC8vIHByZWZpeCBtYXRjaGVzU2VsZWN0b3JcbiAgYnJvd3Nlci5wcmVmaXhlZE1hdGNoZXNTZWxlY3RvciA9ICdtYXRjaGVzJyBpbiBFbGVtZW50LnByb3RvdHlwZVxuICAgID8gJ21hdGNoZXMnXG4gICAgOiAnd2Via2l0TWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZVxuICAgICAgPyAnd2Via2l0TWF0Y2hlc1NlbGVjdG9yJ1xuICAgICAgOiAnbW96TWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZVxuICAgICAgICA/ICdtb3pNYXRjaGVzU2VsZWN0b3InXG4gICAgICAgIDogJ29NYXRjaGVzU2VsZWN0b3InIGluIEVsZW1lbnQucHJvdG90eXBlXG4gICAgICAgICAgPyAnb01hdGNoZXNTZWxlY3RvcidcbiAgICAgICAgICA6ICdtc01hdGNoZXNTZWxlY3RvcidcblxuICBicm93c2VyLnBFdmVudFR5cGVzID0gKGJyb3dzZXIuc3VwcG9ydHNQb2ludGVyRXZlbnRcbiAgICA/IChkb21PYmplY3RzLlBvaW50ZXJFdmVudCA9PT0gd2luZG93Lk1TUG9pbnRlckV2ZW50XG4gICAgICA/IHtcbiAgICAgICAgdXA6ICAgICAnTVNQb2ludGVyVXAnLFxuICAgICAgICBkb3duOiAgICdNU1BvaW50ZXJEb3duJyxcbiAgICAgICAgb3ZlcjogICAnbW91c2VvdmVyJyxcbiAgICAgICAgb3V0OiAgICAnbW91c2VvdXQnLFxuICAgICAgICBtb3ZlOiAgICdNU1BvaW50ZXJNb3ZlJyxcbiAgICAgICAgY2FuY2VsOiAnTVNQb2ludGVyQ2FuY2VsJyxcbiAgICAgIH1cbiAgICAgIDoge1xuICAgICAgICB1cDogICAgICdwb2ludGVydXAnLFxuICAgICAgICBkb3duOiAgICdwb2ludGVyZG93bicsXG4gICAgICAgIG92ZXI6ICAgJ3BvaW50ZXJvdmVyJyxcbiAgICAgICAgb3V0OiAgICAncG9pbnRlcm91dCcsXG4gICAgICAgIG1vdmU6ICAgJ3BvaW50ZXJtb3ZlJyxcbiAgICAgICAgY2FuY2VsOiAncG9pbnRlcmNhbmNlbCcsXG4gICAgICB9KVxuICAgIDogbnVsbClcblxuICAvLyBiZWNhdXNlIFdlYmtpdCBhbmQgT3BlcmEgc3RpbGwgdXNlICdtb3VzZXdoZWVsJyBldmVudCB0eXBlXG4gIGJyb3dzZXIud2hlZWxFdmVudCA9ICdvbm1vdXNld2hlZWwnIGluIGRvbU9iamVjdHMuZG9jdW1lbnQgPyAnbW91c2V3aGVlbCcgOiAnd2hlZWwnXG59XG5cbmV4cG9ydCBkZWZhdWx0IGJyb3dzZXJcbiJdfQ==