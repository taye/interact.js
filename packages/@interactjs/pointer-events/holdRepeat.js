/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import { a as pointerEvents } from './base-45YfudGV.js';
import "../utils/domUtils.js";
import "../utils/extend.js";
import "../utils/getOriginXY.js";
import './PointerEvent.js';
import "../core/BaseEvent.js";
import "../utils/pointerUtils.js";

/* eslint-disable import/no-duplicates -- for typescript module augmentations */
function install(scope) {
  scope.usePlugin(pointerEvents);
  const {
    pointerEvents: pointerEvents$1
  } = scope;

  // don't repeat by default
  pointerEvents$1.defaults.holdRepeatInterval = 0;
  pointerEvents$1.types.holdrepeat = scope.actions.phaselessTypes.holdrepeat = true;
}
function onNew(_ref) {
  let {
    pointerEvent
  } = _ref;
  if (pointerEvent.type !== 'hold') return;
  pointerEvent.count = (pointerEvent.count || 0) + 1;
}
function onFired(_ref2, scope) {
  let {
    interaction,
    pointerEvent,
    eventTarget,
    targets
  } = _ref2;
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
function endHoldRepeat(_ref3) {
  let {
    interaction
  } = _ref3;
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
    acc[`pointerEvents:${enderTypes}`] = endHoldRepeat;
    return acc;
  }, {
    'pointerEvents:new': onNew,
    'pointerEvents:fired': onFired
  })
};
export { holdRepeat as default };
//# sourceMappingURL=holdRepeat.js.map
