function install(scope) {
    const { pointerEvents, interactions, } = scope;
    pointerEvents.signals.on('new', onNew);
    pointerEvents.signals.on('fired', (arg) => onFired(arg, pointerEvents));
    for (const signal of ['move', 'up', 'cancel', 'endall']) {
        interactions.signals.on(signal, endHoldRepeat);
    }
    // don't repeat by default
    pointerEvents.defaults.holdRepeatInterval = 0;
    pointerEvents.types.push('holdrepeat');
}
function onNew({ pointerEvent }) {
    if (pointerEvent.type !== 'hold') {
        return;
    }
    pointerEvent.count = (pointerEvent.count || 0) + 1;
}
function onFired({ interaction, pointerEvent, eventTarget, targets }, pointerEvents) {
    if (pointerEvent.type !== 'hold' || !targets.length) {
        return;
    }
    // get the repeat interval from the first eventable
    const interval = targets[0].eventable.options.holdRepeatInterval;
    // don't repeat if the interval is 0 or less
    if (interval <= 0) {
        return;
    }
    // set a timeout to fire the holdrepeat event
    interaction.holdIntervalHandle = setTimeout(() => {
        pointerEvents.fire({
            interaction,
            eventTarget,
            type: 'hold',
            pointer: pointerEvent,
            event: pointerEvent,
        });
    }, interval);
}
function endHoldRepeat({ interaction }) {
    // set the interaction's holdStopTime property
    // to stop further holdRepeat events
    if (interaction.holdIntervalHandle) {
        clearInterval(interaction.holdIntervalHandle);
        interaction.holdIntervalHandle = null;
    }
}
export default {
    install,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9sZFJlcGVhdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhvbGRSZXBlYXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxPQUFPLENBQUUsS0FBSztJQUNyQixNQUFNLEVBQ0osYUFBYSxFQUNiLFlBQVksR0FDYixHQUFHLEtBQUssQ0FBQTtJQUVULGFBQWEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUN0QyxhQUFhLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQTtJQUV2RSxLQUFLLE1BQU0sTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLEVBQUU7UUFDdkQsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFBO0tBQy9DO0lBRUQsMEJBQTBCO0lBQzFCLGFBQWEsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFBO0lBQzdDLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO0FBQ3hDLENBQUM7QUFFRCxTQUFTLEtBQUssQ0FBRSxFQUFFLFlBQVksRUFBRTtJQUM5QixJQUFJLFlBQVksQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO1FBQUUsT0FBTTtLQUFFO0lBRTVDLFlBQVksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNwRCxDQUFDO0FBRUQsU0FBUyxPQUFPLENBQUUsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsRUFBRSxhQUFhO0lBQ2xGLElBQUksWUFBWSxDQUFDLElBQUksS0FBSyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFO1FBQUUsT0FBTTtLQUFFO0lBRS9ELG1EQUFtRDtJQUNuRCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQTtJQUVoRSw0Q0FBNEM7SUFDNUMsSUFBSSxRQUFRLElBQUksQ0FBQyxFQUFFO1FBQUUsT0FBTTtLQUFFO0lBRTdCLDZDQUE2QztJQUM3QyxXQUFXLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUMvQyxhQUFhLENBQUMsSUFBSSxDQUFDO1lBQ2pCLFdBQVc7WUFDWCxXQUFXO1lBQ1gsSUFBSSxFQUFFLE1BQU07WUFDWixPQUFPLEVBQUUsWUFBWTtZQUNyQixLQUFLLEVBQUUsWUFBWTtTQUNwQixDQUFDLENBQUE7SUFDSixDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUE7QUFDZCxDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUUsRUFBRSxXQUFXLEVBQUU7SUFDckMsOENBQThDO0lBQzlDLG9DQUFvQztJQUNwQyxJQUFJLFdBQVcsQ0FBQyxrQkFBa0IsRUFBRTtRQUNsQyxhQUFhLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLENBQUE7UUFDN0MsV0FBVyxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQTtLQUN0QztBQUNILENBQUM7QUFFRCxlQUFlO0lBQ2IsT0FBTztDQUNSLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBpbnN0YWxsIChzY29wZSkge1xuICBjb25zdCB7XG4gICAgcG9pbnRlckV2ZW50cyxcbiAgICBpbnRlcmFjdGlvbnMsXG4gIH0gPSBzY29wZVxuXG4gIHBvaW50ZXJFdmVudHMuc2lnbmFscy5vbignbmV3Jywgb25OZXcpXG4gIHBvaW50ZXJFdmVudHMuc2lnbmFscy5vbignZmlyZWQnLCAoYXJnKSA9PiBvbkZpcmVkKGFyZywgcG9pbnRlckV2ZW50cykpXG5cbiAgZm9yIChjb25zdCBzaWduYWwgb2YgWydtb3ZlJywgJ3VwJywgJ2NhbmNlbCcsICdlbmRhbGwnXSkge1xuICAgIGludGVyYWN0aW9ucy5zaWduYWxzLm9uKHNpZ25hbCwgZW5kSG9sZFJlcGVhdClcbiAgfVxuXG4gIC8vIGRvbid0IHJlcGVhdCBieSBkZWZhdWx0XG4gIHBvaW50ZXJFdmVudHMuZGVmYXVsdHMuaG9sZFJlcGVhdEludGVydmFsID0gMFxuICBwb2ludGVyRXZlbnRzLnR5cGVzLnB1c2goJ2hvbGRyZXBlYXQnKVxufVxuXG5mdW5jdGlvbiBvbk5ldyAoeyBwb2ludGVyRXZlbnQgfSkge1xuICBpZiAocG9pbnRlckV2ZW50LnR5cGUgIT09ICdob2xkJykgeyByZXR1cm4gfVxuXG4gIHBvaW50ZXJFdmVudC5jb3VudCA9IChwb2ludGVyRXZlbnQuY291bnQgfHwgMCkgKyAxXG59XG5cbmZ1bmN0aW9uIG9uRmlyZWQgKHsgaW50ZXJhY3Rpb24sIHBvaW50ZXJFdmVudCwgZXZlbnRUYXJnZXQsIHRhcmdldHMgfSwgcG9pbnRlckV2ZW50cykge1xuICBpZiAocG9pbnRlckV2ZW50LnR5cGUgIT09ICdob2xkJyB8fCAhdGFyZ2V0cy5sZW5ndGgpIHsgcmV0dXJuIH1cblxuICAvLyBnZXQgdGhlIHJlcGVhdCBpbnRlcnZhbCBmcm9tIHRoZSBmaXJzdCBldmVudGFibGVcbiAgY29uc3QgaW50ZXJ2YWwgPSB0YXJnZXRzWzBdLmV2ZW50YWJsZS5vcHRpb25zLmhvbGRSZXBlYXRJbnRlcnZhbFxuXG4gIC8vIGRvbid0IHJlcGVhdCBpZiB0aGUgaW50ZXJ2YWwgaXMgMCBvciBsZXNzXG4gIGlmIChpbnRlcnZhbCA8PSAwKSB7IHJldHVybiB9XG5cbiAgLy8gc2V0IGEgdGltZW91dCB0byBmaXJlIHRoZSBob2xkcmVwZWF0IGV2ZW50XG4gIGludGVyYWN0aW9uLmhvbGRJbnRlcnZhbEhhbmRsZSA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHBvaW50ZXJFdmVudHMuZmlyZSh7XG4gICAgICBpbnRlcmFjdGlvbixcbiAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgdHlwZTogJ2hvbGQnLFxuICAgICAgcG9pbnRlcjogcG9pbnRlckV2ZW50LFxuICAgICAgZXZlbnQ6IHBvaW50ZXJFdmVudCxcbiAgICB9KVxuICB9LCBpbnRlcnZhbClcbn1cblxuZnVuY3Rpb24gZW5kSG9sZFJlcGVhdCAoeyBpbnRlcmFjdGlvbiB9KSB7XG4gIC8vIHNldCB0aGUgaW50ZXJhY3Rpb24ncyBob2xkU3RvcFRpbWUgcHJvcGVydHlcbiAgLy8gdG8gc3RvcCBmdXJ0aGVyIGhvbGRSZXBlYXQgZXZlbnRzXG4gIGlmIChpbnRlcmFjdGlvbi5ob2xkSW50ZXJ2YWxIYW5kbGUpIHtcbiAgICBjbGVhckludGVydmFsKGludGVyYWN0aW9uLmhvbGRJbnRlcnZhbEhhbmRsZSlcbiAgICBpbnRlcmFjdGlvbi5ob2xkSW50ZXJ2YWxIYW5kbGUgPSBudWxsXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBpbnN0YWxsLFxufVxuIl19