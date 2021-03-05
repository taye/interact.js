import basePlugin from "./base.js";

function install(scope) {
  scope.usePlugin(basePlugin);
  const {
    pointerEvents
  } = scope; // don't repeat by default

  pointerEvents.defaults.holdRepeatInterval = 0;
  pointerEvents.types.holdrepeat = scope.actions.phaselessTypes.holdrepeat = true;
}

function onNew({
  pointerEvent
}) {
  if (pointerEvent.type !== 'hold') return;
  pointerEvent.count = (pointerEvent.count || 0) + 1;
}

function onFired({
  interaction,
  pointerEvent,
  eventTarget,
  targets
}, scope) {
  if (pointerEvent.type !== 'hold' || !targets.length) return; // get the repeat interval from the first eventable

  const interval = targets[0].eventable.options.holdRepeatInterval; // don't repeat if the interval is 0 or less

  if (interval <= 0) return; // set a timeout to fire the holdrepeat event

  interaction.holdIntervalHandle = setTimeout(() => {
    scope.pointerEvents.fire({
      interaction,
      eventTarget,
      type: 'hold',
      pointer: pointerEvent,
      event: pointerEvent
    }, scope);
  }, interval);
}

function endHoldRepeat({
  interaction
}) {
  // set the interaction's holdStopTime property
  // to stop further holdRepeat events
  if (interaction.holdIntervalHandle) {
    clearInterval(interaction.holdIntervalHandle);
    interaction.holdIntervalHandle = null;
  }
}

const holdRepeat = {
  id: 'pointer-events/holdRepeat',
  install,
  listeners: ['move', 'up', 'cancel', 'endall'].reduce((acc, enderTypes) => {
    ;
    acc[`pointerEvents:${enderTypes}`] = endHoldRepeat;
    return acc;
  }, {
    'pointerEvents:new': onNew,
    'pointerEvents:fired': onFired
  })
};
export default holdRepeat;
//# sourceMappingURL=holdRepeat.js.map