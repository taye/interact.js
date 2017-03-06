const pointerEvents = require('./base');
const Interaction   = require('../Interaction');

pointerEvents.signals.on('new', onNew);
pointerEvents.signals.on('fired', onFired);

for (const signal of ['move', 'up', 'cancel', 'endall']) {
  Interaction.signals.on(signal, endHoldRepeat);
}

function onNew ({ pointerEvent }) {
  if (pointerEvent.type !== 'hold') { return; }

  pointerEvent.count = (pointerEvent.count || 0) + 1;
}

function onFired ({ interaction, pointerEvent, eventTarget, targets }) {
  if (pointerEvent.type !== 'hold' || !targets.length) { return; }

  // get the repeat interval from the first eventable
  const interval = targets[0].eventable.options.holdRepeatInterval;

  // don't repeat if the interval is 0 or less
  if (interval <= 0) { return; }

  // set a timeout to fire the holdrepeat event
  interaction.holdIntervalHandle = setTimeout(function () {
    pointerEvents.fire({
      interaction,
      eventTarget,
      type: 'hold',
      pointer: pointerEvent,
      event: pointerEvent,
    });
  }, interval);
}

function endHoldRepeat ({ interaction }) {
  // set the interaction's holdStopTime property
  // to stop further holdRepeat events
  if (interaction.holdIntervalHandle) {
    clearInterval(interaction.holdIntervalHandle);
    interaction.holdIntervalHandle = null;
  }
}

// don't repeat by default
pointerEvents.defaults.holdRepeatInterval = 0;
pointerEvents.types.push('holdrepeat');

module.exports = {
  onNew,
  onFired,
  endHoldRepeat,
};
