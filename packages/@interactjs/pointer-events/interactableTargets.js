/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import extend from "../utils/extend.js";
function install(scope) {
  const {
    Interactable
  } = scope;
  Interactable.prototype.pointerEvents = function (options) {
    extend(this.events.options, options);
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
    'pointerEvents:collect-targets': (_ref, scope) => {
      let {
        targets,
        node,
        type,
        eventTarget
      } = _ref;
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
    'interactable:new': _ref2 => {
      let {
        interactable
      } = _ref2;
      interactable.events.getRect = function (element) {
        return interactable.getRect(element);
      };
    },
    'interactable:set': (_ref3, scope) => {
      let {
        interactable,
        options
      } = _ref3;
      extend(interactable.events.options, scope.pointerEvents.defaults);
      extend(interactable.events.options, options.pointerEvents || {});
    }
  }
};
export { plugin as default };
//# sourceMappingURL=interactableTargets.js.map
