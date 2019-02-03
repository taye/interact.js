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
    browser.supportsTouch = !!(('ontouchstart' in window) || is.func(window.DocumentTouch)) &&
        domObjects.document instanceof window.DocumentTouch;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJyb3dzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxVQUFVLE1BQU0sY0FBYyxDQUFBO0FBQ3JDLE9BQU8sS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFBO0FBQzFCLE9BQU8sR0FBRyxNQUFNLFVBQVUsQ0FBQTtBQUUxQixNQUFNLE9BQU8sR0FBRztJQUNkLElBQUk7SUFDSixhQUFhLEVBQUUsSUFBZTtJQUM5QixvQkFBb0IsRUFBRSxJQUFlO0lBQ3JDLE1BQU0sRUFBRSxJQUFlO0lBQ3ZCLEtBQUssRUFBRSxJQUFlO0lBQ3RCLEtBQUssRUFBRSxJQUFlO0lBQ3RCLGFBQWEsRUFBRSxJQUFlO0lBQzlCLHVCQUF1QixFQUFFLElBQWM7SUFDdkMsV0FBVyxFQUFFLElBT1o7SUFDRCxVQUFVLEVBQUUsSUFBYztDQUMzQixDQUFBO0FBRUQsU0FBUyxJQUFJLENBQUUsTUFBTTtJQUNuQixNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBYyxDQUFBO0lBQ3pDLE1BQU0sU0FBUyxHQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFBO0lBRXZDLHdDQUF3QztJQUN4QyxPQUFPLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3JGLFVBQVUsQ0FBQyxRQUFRLFlBQVksTUFBTSxDQUFDLGFBQWEsQ0FBQTtJQUVyRCx5Q0FBeUM7SUFDekMsT0FBTyxDQUFDLG9CQUFvQixHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFBO0lBRXhELE9BQU8sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUE7SUFFM0QsaUVBQWlFO0lBQ2pFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztRQUNsRCxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO0lBRWhELE9BQU8sQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUE7SUFFbEQsMkNBQTJDO0lBQzNDLE9BQU8sQ0FBQyxhQUFhLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxLQUFLLE9BQU87UUFDcEQsT0FBTyxDQUFDLGFBQWE7UUFDckIsU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQTtJQUV0Qyx5QkFBeUI7SUFDekIsT0FBTyxDQUFDLHVCQUF1QixHQUFHLFNBQVMsSUFBSSxPQUFPLENBQUMsU0FBUztRQUM5RCxDQUFDLENBQUMsU0FBUztRQUNYLENBQUMsQ0FBQyx1QkFBdUIsSUFBSSxPQUFPLENBQUMsU0FBUztZQUM1QyxDQUFDLENBQUMsdUJBQXVCO1lBQ3pCLENBQUMsQ0FBQyxvQkFBb0IsSUFBSSxPQUFPLENBQUMsU0FBUztnQkFDekMsQ0FBQyxDQUFDLG9CQUFvQjtnQkFDdEIsQ0FBQyxDQUFDLGtCQUFrQixJQUFJLE9BQU8sQ0FBQyxTQUFTO29CQUN2QyxDQUFDLENBQUMsa0JBQWtCO29CQUNwQixDQUFDLENBQUMsbUJBQW1CLENBQUE7SUFFN0IsT0FBTyxDQUFDLFdBQVcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxZQUFZO1FBQzVDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxZQUFZLEtBQUssTUFBTSxDQUFDLGNBQWM7WUFDbEQsQ0FBQyxDQUFDO2dCQUNBLEVBQUUsRUFBTSxhQUFhO2dCQUNyQixJQUFJLEVBQUksZUFBZTtnQkFDdkIsSUFBSSxFQUFJLFdBQVc7Z0JBQ25CLEdBQUcsRUFBSyxVQUFVO2dCQUNsQixJQUFJLEVBQUksZUFBZTtnQkFDdkIsTUFBTSxFQUFFLGlCQUFpQjthQUMxQjtZQUNELENBQUMsQ0FBQztnQkFDQSxFQUFFLEVBQU0sV0FBVztnQkFDbkIsSUFBSSxFQUFJLGFBQWE7Z0JBQ3JCLElBQUksRUFBSSxhQUFhO2dCQUNyQixHQUFHLEVBQUssWUFBWTtnQkFDcEIsSUFBSSxFQUFJLGFBQWE7Z0JBQ3JCLE1BQU0sRUFBRSxlQUFlO2FBQ3hCLENBQUM7UUFDSixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUE7SUFFVCw2REFBNkQ7SUFDN0QsT0FBTyxDQUFDLFVBQVUsR0FBRyxjQUFjLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUE7QUFDckYsQ0FBQztBQUVELGVBQWUsT0FBTyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGRvbU9iamVjdHMgZnJvbSAnLi9kb21PYmplY3RzJ1xuaW1wb3J0ICogYXMgaXMgZnJvbSAnLi9pcydcbmltcG9ydCB3aW4gZnJvbSAnLi93aW5kb3cnXG5cbmNvbnN0IGJyb3dzZXIgPSB7XG4gIGluaXQsXG4gIHN1cHBvcnRzVG91Y2g6IG51bGwgYXMgYm9vbGVhbixcbiAgc3VwcG9ydHNQb2ludGVyRXZlbnQ6IG51bGwgYXMgYm9vbGVhbixcbiAgaXNJT1M3OiBudWxsIGFzIGJvb2xlYW4sXG4gIGlzSU9TOiBudWxsIGFzIGJvb2xlYW4sXG4gIGlzSWU5OiBudWxsIGFzIGJvb2xlYW4sXG4gIGlzT3BlcmFNb2JpbGU6IG51bGwgYXMgYm9vbGVhbixcbiAgcHJlZml4ZWRNYXRjaGVzU2VsZWN0b3I6IG51bGwgYXMgc3RyaW5nLFxuICBwRXZlbnRUeXBlczogbnVsbCBhcyB7XG4gICAgdXA6IHN0cmluZyxcbiAgICBkb3duOiBzdHJpbmcsXG4gICAgb3Zlcjogc3RyaW5nLFxuICAgIG91dDogc3RyaW5nLFxuICAgIG1vdmU6IHN0cmluZyxcbiAgICBjYW5jZWw6IHN0cmluZyxcbiAgfSxcbiAgd2hlZWxFdmVudDogbnVsbCBhcyBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIGluaXQgKHdpbmRvdykge1xuICBjb25zdCBFbGVtZW50ID0gZG9tT2JqZWN0cy5FbGVtZW50IGFzIGFueVxuICBjb25zdCBuYXZpZ2F0b3IgID0gd2luLndpbmRvdy5uYXZpZ2F0b3JcblxuICAvLyBEb2VzIHRoZSBicm93c2VyIHN1cHBvcnQgdG91Y2ggaW5wdXQ/XG4gIGJyb3dzZXIuc3VwcG9ydHNUb3VjaCA9ICEhKCgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpIHx8IGlzLmZ1bmMod2luZG93LkRvY3VtZW50VG91Y2gpKSAmJlxuICAgIGRvbU9iamVjdHMuZG9jdW1lbnQgaW5zdGFuY2VvZiB3aW5kb3cuRG9jdW1lbnRUb3VjaFxuXG4gIC8vIERvZXMgdGhlIGJyb3dzZXIgc3VwcG9ydCBQb2ludGVyRXZlbnRzXG4gIGJyb3dzZXIuc3VwcG9ydHNQb2ludGVyRXZlbnQgPSAhIWRvbU9iamVjdHMuUG9pbnRlckV2ZW50XG5cbiAgYnJvd3Nlci5pc0lPUyA9ICgvaVAoaG9uZXxvZHxhZCkvLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKSlcblxuICAvLyBzY3JvbGxpbmcgZG9lc24ndCBjaGFuZ2UgdGhlIHJlc3VsdCBvZiBnZXRDbGllbnRSZWN0cyBvbiBpT1MgN1xuICBicm93c2VyLmlzSU9TNyA9ICgvaVAoaG9uZXxvZHxhZCkvLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKSAmJlxuICAgICAgICAgICAvT1MgN1teXFxkXS8udGVzdChuYXZpZ2F0b3IuYXBwVmVyc2lvbikpXG5cbiAgYnJvd3Nlci5pc0llOSA9IC9NU0lFIDkvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudClcblxuICAvLyBPcGVyYSBNb2JpbGUgbXVzdCBiZSBoYW5kbGVkIGRpZmZlcmVudGx5XG4gIGJyb3dzZXIuaXNPcGVyYU1vYmlsZSA9IChuYXZpZ2F0b3IuYXBwTmFtZSA9PT0gJ09wZXJhJyAmJlxuICAgIGJyb3dzZXIuc3VwcG9ydHNUb3VjaCAmJlxuICAgIG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goJ1ByZXN0bycpKVxuXG4gIC8vIHByZWZpeCBtYXRjaGVzU2VsZWN0b3JcbiAgYnJvd3Nlci5wcmVmaXhlZE1hdGNoZXNTZWxlY3RvciA9ICdtYXRjaGVzJyBpbiBFbGVtZW50LnByb3RvdHlwZVxuICAgID8gJ21hdGNoZXMnXG4gICAgOiAnd2Via2l0TWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZVxuICAgICAgPyAnd2Via2l0TWF0Y2hlc1NlbGVjdG9yJ1xuICAgICAgOiAnbW96TWF0Y2hlc1NlbGVjdG9yJyBpbiBFbGVtZW50LnByb3RvdHlwZVxuICAgICAgICA/ICdtb3pNYXRjaGVzU2VsZWN0b3InXG4gICAgICAgIDogJ29NYXRjaGVzU2VsZWN0b3InIGluIEVsZW1lbnQucHJvdG90eXBlXG4gICAgICAgICAgPyAnb01hdGNoZXNTZWxlY3RvcidcbiAgICAgICAgICA6ICdtc01hdGNoZXNTZWxlY3RvcidcblxuICBicm93c2VyLnBFdmVudFR5cGVzID0gKGRvbU9iamVjdHMuUG9pbnRlckV2ZW50XG4gICAgPyAoZG9tT2JqZWN0cy5Qb2ludGVyRXZlbnQgPT09IHdpbmRvdy5NU1BvaW50ZXJFdmVudFxuICAgICAgPyB7XG4gICAgICAgIHVwOiAgICAgJ01TUG9pbnRlclVwJyxcbiAgICAgICAgZG93bjogICAnTVNQb2ludGVyRG93bicsXG4gICAgICAgIG92ZXI6ICAgJ21vdXNlb3ZlcicsXG4gICAgICAgIG91dDogICAgJ21vdXNlb3V0JyxcbiAgICAgICAgbW92ZTogICAnTVNQb2ludGVyTW92ZScsXG4gICAgICAgIGNhbmNlbDogJ01TUG9pbnRlckNhbmNlbCcsXG4gICAgICB9XG4gICAgICA6IHtcbiAgICAgICAgdXA6ICAgICAncG9pbnRlcnVwJyxcbiAgICAgICAgZG93bjogICAncG9pbnRlcmRvd24nLFxuICAgICAgICBvdmVyOiAgICdwb2ludGVyb3ZlcicsXG4gICAgICAgIG91dDogICAgJ3BvaW50ZXJvdXQnLFxuICAgICAgICBtb3ZlOiAgICdwb2ludGVybW92ZScsXG4gICAgICAgIGNhbmNlbDogJ3BvaW50ZXJjYW5jZWwnLFxuICAgICAgfSlcbiAgICA6IG51bGwpXG5cbiAgLy8gYmVjYXVzZSBXZWJraXQgYW5kIE9wZXJhIHN0aWxsIHVzZSAnbW91c2V3aGVlbCcgZXZlbnQgdHlwZVxuICBicm93c2VyLndoZWVsRXZlbnQgPSAnb25tb3VzZXdoZWVsJyBpbiBkb21PYmplY3RzLmRvY3VtZW50ID8gJ21vdXNld2hlZWwnIDogJ3doZWVsJ1xufVxuXG5leHBvcnQgZGVmYXVsdCBicm93c2VyXG4iXX0=