"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _extend = _interopRequireDefault(require("../utils/extend.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function install(scope) {
  const {
    Interactable
  } = scope;
  Interactable.prototype.pointerEvents = function (options) {
    (0, _extend.default)(this.events.options, options);
    return this;
  };
  const __backCompatOption = Interactable.prototype._backCompatOption;
  Interactable.prototype._backCompatOption = function (optionName, newValue) {
    const ret = __backCompatOption.call(this, optionName, newValue);
    if (ret === this) {
      this.events.options[optionName] = newValue;
    }
    return ret;
  };
}
const plugin = {
  id: 'pointer-events/interactableTargets',
  install,
  listeners: {
    'pointerEvents:collect-targets': ({
      targets,
      node,
      type,
      eventTarget
    }, scope) => {
      scope.interactables.forEachMatch(node, interactable => {
        const eventable = interactable.events;
        const options = eventable.options;
        if (eventable.types[type] && eventable.types[type].length && interactable.testIgnoreAllow(options, node, eventTarget)) {
          targets.push({
            node,
            eventable,
            props: {
              interactable
            }
          });
        }
      });
    },
    'interactable:new': ({
      interactable
    }) => {
      interactable.events.getRect = function (element) {
        return interactable.getRect(element);
      };
    },
    'interactable:set': ({
      interactable,
      options
    }, scope) => {
      (0, _extend.default)(interactable.events.options, scope.pointerEvents.defaults);
      (0, _extend.default)(interactable.events.options, options.pointerEvents || {});
    }
  }
};
var _default = exports.default = plugin;
//# sourceMappingURL=interactableTargets.js.map