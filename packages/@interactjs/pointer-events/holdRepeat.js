"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _base = _interopRequireDefault(require("./base"));
require("./PointerEvent");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable import/no-duplicates -- for typescript module augmentations */

/* eslint-enable import/no-duplicates */

function install(scope) {
  scope.usePlugin(_base.default);
  const {
    pointerEvents
  } = scope;

  // don't repeat by default
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
  if (pointerEvent.type !== 'hold' || !targets.length) return;

  // get the repeat interval from the first eventable
  const interval = targets[0].eventable.options.holdRepeatInterval;

  // don't repeat if the interval is 0 or less
  if (interval <= 0) return;

  // set a timeout to fire the holdrepeat event
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
var _default = exports.default = holdRepeat;
//# sourceMappingURL=holdRepeat.js.map