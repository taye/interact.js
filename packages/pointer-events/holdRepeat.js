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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9sZFJlcGVhdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhvbGRSZXBlYXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBTUEsU0FBUyxPQUFPLENBQUUsS0FBSztJQUNyQixNQUFNLEVBQ0osYUFBYSxFQUNiLFlBQVksR0FDYixHQUFHLEtBQUssQ0FBQTtJQUVULGFBQWEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUN0QyxhQUFhLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQTtJQUV2RSxLQUFLLE1BQU0sTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLEVBQUU7UUFDdkQsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFBO0tBQy9DO0lBRUQsMEJBQTBCO0lBQzFCLGFBQWEsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFBO0lBQzdDLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO0FBQ3hDLENBQUM7QUFFRCxTQUFTLEtBQUssQ0FBRSxFQUFFLFlBQVksRUFBRTtJQUM5QixJQUFJLFlBQVksQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO1FBQUUsT0FBTTtLQUFFO0lBRTVDLFlBQVksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNwRCxDQUFDO0FBRUQsU0FBUyxPQUFPLENBQUUsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsRUFBRSxhQUFhO0lBQ2xGLElBQUksWUFBWSxDQUFDLElBQUksS0FBSyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFO1FBQUUsT0FBTTtLQUFFO0lBRS9ELG1EQUFtRDtJQUNuRCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQTtJQUVoRSw0Q0FBNEM7SUFDNUMsSUFBSSxRQUFRLElBQUksQ0FBQyxFQUFFO1FBQUUsT0FBTTtLQUFFO0lBRTdCLDZDQUE2QztJQUM3QyxXQUFXLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUMvQyxhQUFhLENBQUMsSUFBSSxDQUFDO1lBQ2pCLFdBQVc7WUFDWCxXQUFXO1lBQ1gsSUFBSSxFQUFFLE1BQU07WUFDWixPQUFPLEVBQUUsWUFBWTtZQUNyQixLQUFLLEVBQUUsWUFBWTtTQUNwQixDQUFDLENBQUE7SUFDSixDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUE7QUFDZCxDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUUsRUFBRSxXQUFXLEVBQUU7SUFDckMsOENBQThDO0lBQzlDLG9DQUFvQztJQUNwQyxJQUFJLFdBQVcsQ0FBQyxrQkFBa0IsRUFBRTtRQUNsQyxhQUFhLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLENBQUE7UUFDN0MsV0FBVyxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQTtLQUN0QztBQUNILENBQUM7QUFFRCxlQUFlO0lBQ2IsT0FBTztDQUNSLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJkZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbicge1xuICBpbnRlcmZhY2UgSW50ZXJhY3Rpb24ge1xuICAgIGhvbGRJbnRlcnZhbEhhbmRsZT86IGFueVxuICB9XG59XG5cbmZ1bmN0aW9uIGluc3RhbGwgKHNjb3BlKSB7XG4gIGNvbnN0IHtcbiAgICBwb2ludGVyRXZlbnRzLFxuICAgIGludGVyYWN0aW9ucyxcbiAgfSA9IHNjb3BlXG5cbiAgcG9pbnRlckV2ZW50cy5zaWduYWxzLm9uKCduZXcnLCBvbk5ldylcbiAgcG9pbnRlckV2ZW50cy5zaWduYWxzLm9uKCdmaXJlZCcsIChhcmcpID0+IG9uRmlyZWQoYXJnLCBwb2ludGVyRXZlbnRzKSlcblxuICBmb3IgKGNvbnN0IHNpZ25hbCBvZiBbJ21vdmUnLCAndXAnLCAnY2FuY2VsJywgJ2VuZGFsbCddKSB7XG4gICAgaW50ZXJhY3Rpb25zLnNpZ25hbHMub24oc2lnbmFsLCBlbmRIb2xkUmVwZWF0KVxuICB9XG5cbiAgLy8gZG9uJ3QgcmVwZWF0IGJ5IGRlZmF1bHRcbiAgcG9pbnRlckV2ZW50cy5kZWZhdWx0cy5ob2xkUmVwZWF0SW50ZXJ2YWwgPSAwXG4gIHBvaW50ZXJFdmVudHMudHlwZXMucHVzaCgnaG9sZHJlcGVhdCcpXG59XG5cbmZ1bmN0aW9uIG9uTmV3ICh7IHBvaW50ZXJFdmVudCB9KSB7XG4gIGlmIChwb2ludGVyRXZlbnQudHlwZSAhPT0gJ2hvbGQnKSB7IHJldHVybiB9XG5cbiAgcG9pbnRlckV2ZW50LmNvdW50ID0gKHBvaW50ZXJFdmVudC5jb3VudCB8fCAwKSArIDFcbn1cblxuZnVuY3Rpb24gb25GaXJlZCAoeyBpbnRlcmFjdGlvbiwgcG9pbnRlckV2ZW50LCBldmVudFRhcmdldCwgdGFyZ2V0cyB9LCBwb2ludGVyRXZlbnRzKSB7XG4gIGlmIChwb2ludGVyRXZlbnQudHlwZSAhPT0gJ2hvbGQnIHx8ICF0YXJnZXRzLmxlbmd0aCkgeyByZXR1cm4gfVxuXG4gIC8vIGdldCB0aGUgcmVwZWF0IGludGVydmFsIGZyb20gdGhlIGZpcnN0IGV2ZW50YWJsZVxuICBjb25zdCBpbnRlcnZhbCA9IHRhcmdldHNbMF0uZXZlbnRhYmxlLm9wdGlvbnMuaG9sZFJlcGVhdEludGVydmFsXG5cbiAgLy8gZG9uJ3QgcmVwZWF0IGlmIHRoZSBpbnRlcnZhbCBpcyAwIG9yIGxlc3NcbiAgaWYgKGludGVydmFsIDw9IDApIHsgcmV0dXJuIH1cblxuICAvLyBzZXQgYSB0aW1lb3V0IHRvIGZpcmUgdGhlIGhvbGRyZXBlYXQgZXZlbnRcbiAgaW50ZXJhY3Rpb24uaG9sZEludGVydmFsSGFuZGxlID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgcG9pbnRlckV2ZW50cy5maXJlKHtcbiAgICAgIGludGVyYWN0aW9uLFxuICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICB0eXBlOiAnaG9sZCcsXG4gICAgICBwb2ludGVyOiBwb2ludGVyRXZlbnQsXG4gICAgICBldmVudDogcG9pbnRlckV2ZW50LFxuICAgIH0pXG4gIH0sIGludGVydmFsKVxufVxuXG5mdW5jdGlvbiBlbmRIb2xkUmVwZWF0ICh7IGludGVyYWN0aW9uIH0pIHtcbiAgLy8gc2V0IHRoZSBpbnRlcmFjdGlvbidzIGhvbGRTdG9wVGltZSBwcm9wZXJ0eVxuICAvLyB0byBzdG9wIGZ1cnRoZXIgaG9sZFJlcGVhdCBldmVudHNcbiAgaWYgKGludGVyYWN0aW9uLmhvbGRJbnRlcnZhbEhhbmRsZSkge1xuICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJhY3Rpb24uaG9sZEludGVydmFsSGFuZGxlKVxuICAgIGludGVyYWN0aW9uLmhvbGRJbnRlcnZhbEhhbmRsZSA9IG51bGxcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGluc3RhbGwsXG59XG4iXX0=