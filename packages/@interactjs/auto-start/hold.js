"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _base = _interopRequireDefault(require("./base"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable import/no-duplicates -- for typescript module augmentations */

/* eslint-enable */

function install(scope) {
  const {
    defaults
  } = scope;
  scope.usePlugin(_base.default);
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
    'interactions:new': ({
      interaction
    }) => {
      interaction.autoStartHoldTimer = null;
    },
    'autoStart:prepared': ({
      interaction
    }) => {
      const hold = getHoldDuration(interaction);
      if (hold > 0) {
        interaction.autoStartHoldTimer = setTimeout(() => {
          interaction.start(interaction.prepared, interaction.interactable, interaction.element);
        }, hold);
      }
    },
    'interactions:move': ({
      interaction,
      duplicate
    }) => {
      if (interaction.autoStartHoldTimer && interaction.pointerWasMoved && !duplicate) {
        clearTimeout(interaction.autoStartHoldTimer);
        interaction.autoStartHoldTimer = null;
      }
    },
    // prevent regular down->move autoStart
    'autoStart:before-start': ({
      interaction
    }) => {
      const holdDuration = getHoldDuration(interaction);
      if (holdDuration > 0) {
        interaction.prepared.name = null;
      }
    }
  },
  getHoldDuration
};
var _default = exports.default = hold;
//# sourceMappingURL=hold.js.map