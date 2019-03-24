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
    id: 'pointer-events/holdRepeat',
    install,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9sZFJlcGVhdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhvbGRSZXBlYXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBTUEsU0FBUyxPQUFPLENBQUUsS0FBSztJQUNyQixNQUFNLEVBQ0osYUFBYSxFQUNiLFlBQVksR0FDYixHQUFHLEtBQUssQ0FBQTtJQUVULGFBQWEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUN0QyxhQUFhLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQTtJQUV2RSxLQUFLLE1BQU0sTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLEVBQUU7UUFDdkQsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxDQUFBO0tBQy9DO0lBRUQsMEJBQTBCO0lBQzFCLGFBQWEsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFBO0lBQzdDLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO0FBQ3hDLENBQUM7QUFFRCxTQUFTLEtBQUssQ0FBRSxFQUFFLFlBQVksRUFBRTtJQUM5QixJQUFJLFlBQVksQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO1FBQUUsT0FBTTtLQUFFO0lBRTVDLFlBQVksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNwRCxDQUFDO0FBRUQsU0FBUyxPQUFPLENBQUUsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsRUFBRSxhQUFhO0lBQ2xGLElBQUksWUFBWSxDQUFDLElBQUksS0FBSyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFO1FBQUUsT0FBTTtLQUFFO0lBRS9ELG1EQUFtRDtJQUNuRCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQTtJQUVoRSw0Q0FBNEM7SUFDNUMsSUFBSSxRQUFRLElBQUksQ0FBQyxFQUFFO1FBQUUsT0FBTTtLQUFFO0lBRTdCLDZDQUE2QztJQUM3QyxXQUFXLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUMvQyxhQUFhLENBQUMsSUFBSSxDQUFDO1lBQ2pCLFdBQVc7WUFDWCxXQUFXO1lBQ1gsSUFBSSxFQUFFLE1BQU07WUFDWixPQUFPLEVBQUUsWUFBWTtZQUNyQixLQUFLLEVBQUUsWUFBWTtTQUNwQixDQUFDLENBQUE7SUFDSixDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUE7QUFDZCxDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUUsRUFBRSxXQUFXLEVBQUU7SUFDckMsOENBQThDO0lBQzlDLG9DQUFvQztJQUNwQyxJQUFJLFdBQVcsQ0FBQyxrQkFBa0IsRUFBRTtRQUNsQyxhQUFhLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLENBQUE7UUFDN0MsV0FBVyxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQTtLQUN0QztBQUNILENBQUM7QUFFRCxlQUFlO0lBQ2IsRUFBRSxFQUFFLDJCQUEyQjtJQUMvQixPQUFPO0NBQ1IsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0aW9uJyB7XG4gIGludGVyZmFjZSBJbnRlcmFjdGlvbiB7XG4gICAgaG9sZEludGVydmFsSGFuZGxlPzogYW55XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5zdGFsbCAoc2NvcGUpIHtcbiAgY29uc3Qge1xuICAgIHBvaW50ZXJFdmVudHMsXG4gICAgaW50ZXJhY3Rpb25zLFxuICB9ID0gc2NvcGVcblxuICBwb2ludGVyRXZlbnRzLnNpZ25hbHMub24oJ25ldycsIG9uTmV3KVxuICBwb2ludGVyRXZlbnRzLnNpZ25hbHMub24oJ2ZpcmVkJywgKGFyZykgPT4gb25GaXJlZChhcmcsIHBvaW50ZXJFdmVudHMpKVxuXG4gIGZvciAoY29uc3Qgc2lnbmFsIG9mIFsnbW92ZScsICd1cCcsICdjYW5jZWwnLCAnZW5kYWxsJ10pIHtcbiAgICBpbnRlcmFjdGlvbnMuc2lnbmFscy5vbihzaWduYWwsIGVuZEhvbGRSZXBlYXQpXG4gIH1cblxuICAvLyBkb24ndCByZXBlYXQgYnkgZGVmYXVsdFxuICBwb2ludGVyRXZlbnRzLmRlZmF1bHRzLmhvbGRSZXBlYXRJbnRlcnZhbCA9IDBcbiAgcG9pbnRlckV2ZW50cy50eXBlcy5wdXNoKCdob2xkcmVwZWF0Jylcbn1cblxuZnVuY3Rpb24gb25OZXcgKHsgcG9pbnRlckV2ZW50IH0pIHtcbiAgaWYgKHBvaW50ZXJFdmVudC50eXBlICE9PSAnaG9sZCcpIHsgcmV0dXJuIH1cblxuICBwb2ludGVyRXZlbnQuY291bnQgPSAocG9pbnRlckV2ZW50LmNvdW50IHx8IDApICsgMVxufVxuXG5mdW5jdGlvbiBvbkZpcmVkICh7IGludGVyYWN0aW9uLCBwb2ludGVyRXZlbnQsIGV2ZW50VGFyZ2V0LCB0YXJnZXRzIH0sIHBvaW50ZXJFdmVudHMpIHtcbiAgaWYgKHBvaW50ZXJFdmVudC50eXBlICE9PSAnaG9sZCcgfHwgIXRhcmdldHMubGVuZ3RoKSB7IHJldHVybiB9XG5cbiAgLy8gZ2V0IHRoZSByZXBlYXQgaW50ZXJ2YWwgZnJvbSB0aGUgZmlyc3QgZXZlbnRhYmxlXG4gIGNvbnN0IGludGVydmFsID0gdGFyZ2V0c1swXS5ldmVudGFibGUub3B0aW9ucy5ob2xkUmVwZWF0SW50ZXJ2YWxcblxuICAvLyBkb24ndCByZXBlYXQgaWYgdGhlIGludGVydmFsIGlzIDAgb3IgbGVzc1xuICBpZiAoaW50ZXJ2YWwgPD0gMCkgeyByZXR1cm4gfVxuXG4gIC8vIHNldCBhIHRpbWVvdXQgdG8gZmlyZSB0aGUgaG9sZHJlcGVhdCBldmVudFxuICBpbnRlcmFjdGlvbi5ob2xkSW50ZXJ2YWxIYW5kbGUgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBwb2ludGVyRXZlbnRzLmZpcmUoe1xuICAgICAgaW50ZXJhY3Rpb24sXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIHR5cGU6ICdob2xkJyxcbiAgICAgIHBvaW50ZXI6IHBvaW50ZXJFdmVudCxcbiAgICAgIGV2ZW50OiBwb2ludGVyRXZlbnQsXG4gICAgfSlcbiAgfSwgaW50ZXJ2YWwpXG59XG5cbmZ1bmN0aW9uIGVuZEhvbGRSZXBlYXQgKHsgaW50ZXJhY3Rpb24gfSkge1xuICAvLyBzZXQgdGhlIGludGVyYWN0aW9uJ3MgaG9sZFN0b3BUaW1lIHByb3BlcnR5XG4gIC8vIHRvIHN0b3AgZnVydGhlciBob2xkUmVwZWF0IGV2ZW50c1xuICBpZiAoaW50ZXJhY3Rpb24uaG9sZEludGVydmFsSGFuZGxlKSB7XG4gICAgY2xlYXJJbnRlcnZhbChpbnRlcmFjdGlvbi5ob2xkSW50ZXJ2YWxIYW5kbGUpXG4gICAgaW50ZXJhY3Rpb24uaG9sZEludGVydmFsSGFuZGxlID0gbnVsbFxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgaWQ6ICdwb2ludGVyLWV2ZW50cy9ob2xkUmVwZWF0JyxcbiAgaW5zdGFsbCxcbn1cbiJdfQ==