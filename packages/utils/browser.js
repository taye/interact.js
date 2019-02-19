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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJyb3dzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxVQUFVLE1BQU0sY0FBYyxDQUFBO0FBQ3JDLE9BQU8sS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFBO0FBQzFCLE9BQU8sR0FBRyxNQUFNLFVBQVUsQ0FBQTtBQUUxQixNQUFNLE9BQU8sR0FBRztJQUNkLElBQUk7SUFDSixhQUFhLEVBQUUsSUFBZTtJQUM5QixvQkFBb0IsRUFBRSxJQUFlO0lBQ3JDLE1BQU0sRUFBRSxJQUFlO0lBQ3ZCLEtBQUssRUFBRSxJQUFlO0lBQ3RCLEtBQUssRUFBRSxJQUFlO0lBQ3RCLGFBQWEsRUFBRSxJQUFlO0lBQzlCLHVCQUF1QixFQUFFLElBQWM7SUFDdkMsV0FBVyxFQUFFLElBT1o7SUFDRCxVQUFVLEVBQUUsSUFBYztDQUMzQixDQUFBO0FBRUQsU0FBUyxJQUFJLENBQUUsTUFBTTtJQUNuQixNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFBO0lBQ2xDLE1BQU0sU0FBUyxHQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFBO0lBRXZDLHdDQUF3QztJQUN4QyxPQUFPLENBQUMsYUFBYSxHQUFHLENBQUMsY0FBYyxJQUFJLE1BQU0sQ0FBQztRQUNoRCxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxRQUFRLFlBQVksTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0lBRXhGLHlDQUF5QztJQUN6QyxPQUFPLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUE7SUFFeEQsT0FBTyxDQUFDLEtBQUssR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQTtJQUUzRCxpRUFBaUU7SUFDakUsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1FBQ2xELFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUE7SUFFaEQsT0FBTyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUVsRCwyQ0FBMkM7SUFDM0MsT0FBTyxDQUFDLGFBQWEsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEtBQUssT0FBTztRQUNwRCxPQUFPLENBQUMsYUFBYTtRQUNyQixRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFBO0lBRXJDLHlCQUF5QjtJQUN6QixPQUFPLENBQUMsdUJBQXVCLEdBQUcsU0FBUyxJQUFJLE9BQU8sQ0FBQyxTQUFTO1FBQzlELENBQUMsQ0FBQyxTQUFTO1FBQ1gsQ0FBQyxDQUFDLHVCQUF1QixJQUFJLE9BQU8sQ0FBQyxTQUFTO1lBQzVDLENBQUMsQ0FBQyx1QkFBdUI7WUFDekIsQ0FBQyxDQUFDLG9CQUFvQixJQUFJLE9BQU8sQ0FBQyxTQUFTO2dCQUN6QyxDQUFDLENBQUMsb0JBQW9CO2dCQUN0QixDQUFDLENBQUMsa0JBQWtCLElBQUksT0FBTyxDQUFDLFNBQVM7b0JBQ3ZDLENBQUMsQ0FBQyxrQkFBa0I7b0JBQ3BCLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQTtJQUU3QixPQUFPLENBQUMsV0FBVyxHQUFHLENBQUMsVUFBVSxDQUFDLFlBQVk7UUFDNUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFlBQVksS0FBSyxNQUFNLENBQUMsY0FBYztZQUNsRCxDQUFDLENBQUM7Z0JBQ0EsRUFBRSxFQUFNLGFBQWE7Z0JBQ3JCLElBQUksRUFBSSxlQUFlO2dCQUN2QixJQUFJLEVBQUksV0FBVztnQkFDbkIsR0FBRyxFQUFLLFVBQVU7Z0JBQ2xCLElBQUksRUFBSSxlQUFlO2dCQUN2QixNQUFNLEVBQUUsaUJBQWlCO2FBQzFCO1lBQ0QsQ0FBQyxDQUFDO2dCQUNBLEVBQUUsRUFBTSxXQUFXO2dCQUNuQixJQUFJLEVBQUksYUFBYTtnQkFDckIsSUFBSSxFQUFJLGFBQWE7Z0JBQ3JCLEdBQUcsRUFBSyxZQUFZO2dCQUNwQixJQUFJLEVBQUksYUFBYTtnQkFDckIsTUFBTSxFQUFFLGVBQWU7YUFDeEIsQ0FBQztRQUNKLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUVULDZEQUE2RDtJQUM3RCxPQUFPLENBQUMsVUFBVSxHQUFHLGNBQWMsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQTtBQUNyRixDQUFDO0FBRUQsZUFBZSxPQUFPLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZG9tT2JqZWN0cyBmcm9tICcuL2RvbU9iamVjdHMnXG5pbXBvcnQgKiBhcyBpcyBmcm9tICcuL2lzJ1xuaW1wb3J0IHdpbiBmcm9tICcuL3dpbmRvdydcblxuY29uc3QgYnJvd3NlciA9IHtcbiAgaW5pdCxcbiAgc3VwcG9ydHNUb3VjaDogbnVsbCBhcyBib29sZWFuLFxuICBzdXBwb3J0c1BvaW50ZXJFdmVudDogbnVsbCBhcyBib29sZWFuLFxuICBpc0lPUzc6IG51bGwgYXMgYm9vbGVhbixcbiAgaXNJT1M6IG51bGwgYXMgYm9vbGVhbixcbiAgaXNJZTk6IG51bGwgYXMgYm9vbGVhbixcbiAgaXNPcGVyYU1vYmlsZTogbnVsbCBhcyBib29sZWFuLFxuICBwcmVmaXhlZE1hdGNoZXNTZWxlY3RvcjogbnVsbCBhcyBzdHJpbmcsXG4gIHBFdmVudFR5cGVzOiBudWxsIGFzIHtcbiAgICB1cDogc3RyaW5nLFxuICAgIGRvd246IHN0cmluZyxcbiAgICBvdmVyOiBzdHJpbmcsXG4gICAgb3V0OiBzdHJpbmcsXG4gICAgbW92ZTogc3RyaW5nLFxuICAgIGNhbmNlbDogc3RyaW5nLFxuICB9LFxuICB3aGVlbEV2ZW50OiBudWxsIGFzIHN0cmluZyxcbn1cblxuZnVuY3Rpb24gaW5pdCAod2luZG93KSB7XG4gIGNvbnN0IEVsZW1lbnQgPSBkb21PYmplY3RzLkVsZW1lbnRcbiAgY29uc3QgbmF2aWdhdG9yICA9IHdpbi53aW5kb3cubmF2aWdhdG9yXG5cbiAgLy8gRG9lcyB0aGUgYnJvd3NlciBzdXBwb3J0IHRvdWNoIGlucHV0P1xuICBicm93c2VyLnN1cHBvcnRzVG91Y2ggPSAoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KSB8fFxuICAgIChpcy5mdW5jKHdpbmRvdy5Eb2N1bWVudFRvdWNoKSAmJiBkb21PYmplY3RzLmRvY3VtZW50IGluc3RhbmNlb2Ygd2luZG93LkRvY3VtZW50VG91Y2gpXG5cbiAgLy8gRG9lcyB0aGUgYnJvd3NlciBzdXBwb3J0IFBvaW50ZXJFdmVudHNcbiAgYnJvd3Nlci5zdXBwb3J0c1BvaW50ZXJFdmVudCA9ICEhZG9tT2JqZWN0cy5Qb2ludGVyRXZlbnRcblxuICBicm93c2VyLmlzSU9TID0gKC9pUChob25lfG9kfGFkKS8udGVzdChuYXZpZ2F0b3IucGxhdGZvcm0pKVxuXG4gIC8vIHNjcm9sbGluZyBkb2Vzbid0IGNoYW5nZSB0aGUgcmVzdWx0IG9mIGdldENsaWVudFJlY3RzIG9uIGlPUyA3XG4gIGJyb3dzZXIuaXNJT1M3ID0gKC9pUChob25lfG9kfGFkKS8udGVzdChuYXZpZ2F0b3IucGxhdGZvcm0pICYmXG4gICAgICAgICAgIC9PUyA3W15cXGRdLy50ZXN0KG5hdmlnYXRvci5hcHBWZXJzaW9uKSlcblxuICBicm93c2VyLmlzSWU5ID0gL01TSUUgOS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KVxuXG4gIC8vIE9wZXJhIE1vYmlsZSBtdXN0IGJlIGhhbmRsZWQgZGlmZmVyZW50bHlcbiAgYnJvd3Nlci5pc09wZXJhTW9iaWxlID0gKG5hdmlnYXRvci5hcHBOYW1lID09PSAnT3BlcmEnICYmXG4gICAgYnJvd3Nlci5zdXBwb3J0c1RvdWNoICYmXG4gICAgL1ByZXN0by8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSlcblxuICAvLyBwcmVmaXggbWF0Y2hlc1NlbGVjdG9yXG4gIGJyb3dzZXIucHJlZml4ZWRNYXRjaGVzU2VsZWN0b3IgPSAnbWF0Y2hlcycgaW4gRWxlbWVudC5wcm90b3R5cGVcbiAgICA/ICdtYXRjaGVzJ1xuICAgIDogJ3dlYmtpdE1hdGNoZXNTZWxlY3RvcicgaW4gRWxlbWVudC5wcm90b3R5cGVcbiAgICAgID8gJ3dlYmtpdE1hdGNoZXNTZWxlY3RvcidcbiAgICAgIDogJ21vek1hdGNoZXNTZWxlY3RvcicgaW4gRWxlbWVudC5wcm90b3R5cGVcbiAgICAgICAgPyAnbW96TWF0Y2hlc1NlbGVjdG9yJ1xuICAgICAgICA6ICdvTWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZVxuICAgICAgICAgID8gJ29NYXRjaGVzU2VsZWN0b3InXG4gICAgICAgICAgOiAnbXNNYXRjaGVzU2VsZWN0b3InXG5cbiAgYnJvd3Nlci5wRXZlbnRUeXBlcyA9IChkb21PYmplY3RzLlBvaW50ZXJFdmVudFxuICAgID8gKGRvbU9iamVjdHMuUG9pbnRlckV2ZW50ID09PSB3aW5kb3cuTVNQb2ludGVyRXZlbnRcbiAgICAgID8ge1xuICAgICAgICB1cDogICAgICdNU1BvaW50ZXJVcCcsXG4gICAgICAgIGRvd246ICAgJ01TUG9pbnRlckRvd24nLFxuICAgICAgICBvdmVyOiAgICdtb3VzZW92ZXInLFxuICAgICAgICBvdXQ6ICAgICdtb3VzZW91dCcsXG4gICAgICAgIG1vdmU6ICAgJ01TUG9pbnRlck1vdmUnLFxuICAgICAgICBjYW5jZWw6ICdNU1BvaW50ZXJDYW5jZWwnLFxuICAgICAgfVxuICAgICAgOiB7XG4gICAgICAgIHVwOiAgICAgJ3BvaW50ZXJ1cCcsXG4gICAgICAgIGRvd246ICAgJ3BvaW50ZXJkb3duJyxcbiAgICAgICAgb3ZlcjogICAncG9pbnRlcm92ZXInLFxuICAgICAgICBvdXQ6ICAgICdwb2ludGVyb3V0JyxcbiAgICAgICAgbW92ZTogICAncG9pbnRlcm1vdmUnLFxuICAgICAgICBjYW5jZWw6ICdwb2ludGVyY2FuY2VsJyxcbiAgICAgIH0pXG4gICAgOiBudWxsKVxuXG4gIC8vIGJlY2F1c2UgV2Via2l0IGFuZCBPcGVyYSBzdGlsbCB1c2UgJ21vdXNld2hlZWwnIGV2ZW50IHR5cGVcbiAgYnJvd3Nlci53aGVlbEV2ZW50ID0gJ29ubW91c2V3aGVlbCcgaW4gZG9tT2JqZWN0cy5kb2N1bWVudCA/ICdtb3VzZXdoZWVsJyA6ICd3aGVlbCdcbn1cblxuZXhwb3J0IGRlZmF1bHQgYnJvd3NlclxuIl19