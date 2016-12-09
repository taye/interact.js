const pointerEvents = require('./index.js');
const Interaction   = require('../Interaction');

pointerEvents.signals.on('new', function ({ pointerEvent }) {
  pointerEvent.count = (pointerEvent.count || 0) + 1;
});

pointerEvents.signals.on('fired', function ({ interaction, pointerEvent, eventTarget, targets }) {
  if (pointerEvent.type !== 'hold') { return; }

  // get the repeat interval from the first eventable
  const interval = targets[0].eventable.options.holdRepeatInterval;

  // don't repeat if the interval is 0 or less
  if (interval <= 0) { return; }

  // set a timeout to fire the holdrepeat event
  interaction.holdIntervalHandle = setTimeout(function () {
    pointerEvents.collectEventTargets(interaction, pointerEvent, pointerEvent, eventTarget, 'hold');
  }, interval);
});

function endHoldRepeat ({ interaction }) {
  // set the interaction's holdStopTime property
  // to stop further holdRepeat events
  if (interaction.holdIntervalHandle) {
    clearInterval(interaction.holdIntervalHandle);
    interaction.holdIntervalHandle = null;
  }
}

for (const signal of ['move', 'up', 'cancel', 'endall']) {
  Interaction.signals.on(signal, endHoldRepeat);
}

// don't repeat by default
pointerEvents.defaults.holdRepeatInterval = 0;
pointerEvents.types.push('holdrepeat');
