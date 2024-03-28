/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import autoStart from './base.js';
import "../utils/domUtils.js";
import "../utils/extend.js";
import "../utils/is.js";
import "../utils/misc.js";
import './InteractableMethods.js';

/* eslint-disable import/no-duplicates -- for typescript module augmentations */
/* eslint-enable */

function install(scope) {
  const {
    defaults
  } = scope;
  scope.usePlugin(autoStart);
  defaults.perAction.hold = 0;
  defaults.perAction.delay = 0;
}
function getHoldDuration(interaction) {
  const actionName = interaction.prepared && interaction.prepared.name;
  if (!actionName) {
    return null;
  }
  const options = interaction.interactable.options;
  return options[actionName].hold || options[actionName].delay;
}
const hold = {
  id: 'auto-start/hold',
  install,
  listeners: {
    'interactions:new': _ref => {
      let {
        interaction
      } = _ref;
      interaction.autoStartHoldTimer = null;
    },
    'autoStart:prepared': _ref2 => {
      let {
        interaction
      } = _ref2;
      const hold = getHoldDuration(interaction);
      if (hold > 0) {
        interaction.autoStartHoldTimer = setTimeout(() => {
          interaction.start(interaction.prepared, interaction.interactable, interaction.element);
        }, hold);
      }
    },
    'interactions:move': _ref3 => {
      let {
        interaction,
        duplicate
      } = _ref3;
      if (interaction.autoStartHoldTimer && interaction.pointerWasMoved && !duplicate) {
        clearTimeout(interaction.autoStartHoldTimer);
        interaction.autoStartHoldTimer = null;
      }
    },
    // prevent regular down->move autoStart
    'autoStart:before-start': _ref4 => {
      let {
        interaction
      } = _ref4;
      const holdDuration = getHoldDuration(interaction);
      if (holdDuration > 0) {
        interaction.prepared.name = null;
      }
    }
  },
  getHoldDuration
};
export { hold as default };
//# sourceMappingURL=hold.js.map
