/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import domObjects from "../utils/domObjects.js";
import { parentNode } from "../utils/domUtils.js";
import extend from "../utils/extend.js";
import is from "../utils/is.js";
import isNonNativeEvent from "../utils/isNonNativeEvent.js";
import normalizeListeners from "../utils/normalizeListeners.js";
import * as win from "../utils/window.js";
var CheckName = /*#__PURE__*/function (CheckName) {
  CheckName["touchAction"] = "touchAction";
  CheckName["boxSizing"] = "boxSizing";
  CheckName["noListeners"] = "noListeners";
  return CheckName;
}(CheckName || {});
const prefix = '[interact.js] ';
const links = {
  touchAction: 'https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action',
  boxSizing: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing'
};
function install(scope) {
  let {
    logger
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const {
    Interactable,
    defaults
  } = scope;
  scope.logger = logger || console;
  defaults.base.devTools = {
    ignore: {}
  };
  Interactable.prototype.devTools = function (options) {
    if (options) {
      extend(this.options.devTools, options);
      return this;
    }
    return this.options.devTools;
  };

  // can't set native events on non string targets without `addEventListener` prop
  const {
    _onOff
  } = Interactable.prototype;
  Interactable.prototype._onOff = function (method, typeArg, listenerArg, options, filter) {
    if (is.string(this.target) || this.target.addEventListener) {
      return _onOff.call(this, method, typeArg, listenerArg, options, filter);
    }
    if (is.object(typeArg) && !is.array(typeArg)) {
      options = listenerArg;
      listenerArg = null;
    }
    const normalizedListeners = normalizeListeners(typeArg, listenerArg, filter);
    for (const type in normalizedListeners) {
      if (isNonNativeEvent(type, scope.actions)) continue;
      scope.logger.warn(prefix + `Can't add native "${type}" event listener to target without \`addEventListener(type, listener, options)\` prop.`);
    }
    return _onOff.call(this, method, normalizedListeners, options);
  };
}
const checks = [{
  name: CheckName.touchAction,
  perform(_ref) {
    let {
      element
    } = _ref;
    return !!element && !parentHasStyle(element, 'touchAction', /pan-|pinch|none/);
  },
  getInfo(_ref2) {
    let {
      element
    } = _ref2;
    return [element, links.touchAction];
  },
  text: 'Consider adding CSS "touch-action: none" to this element\n'
}, {
  name: CheckName.boxSizing,
  perform(interaction) {
    const {
      element
    } = interaction;
    return interaction.prepared.name === 'resize' && element instanceof domObjects.HTMLElement && !hasStyle(element, 'boxSizing', /border-box/);
  },
  text: 'Consider adding CSS "box-sizing: border-box" to this resizable element',
  getInfo(_ref3) {
    let {
      element
    } = _ref3;
    return [element, links.boxSizing];
  }
}, {
  name: CheckName.noListeners,
  perform(interaction) {
    var _interaction$interact;
    const actionName = interaction.prepared.name;
    const moveListeners = ((_interaction$interact = interaction.interactable) == null ? void 0 : _interaction$interact.events.types[`${actionName}move`]) || [];
    return !moveListeners.length;
  },
  getInfo(interaction) {
    return [interaction.prepared.name, interaction.interactable];
  },
  text: 'There are no listeners set for this action'
}];
function hasStyle(element, prop, styleRe) {
  const value = element.style[prop] || win.window.getComputedStyle(element)[prop];
  return styleRe.test((value || '').toString());
}
function parentHasStyle(element, prop, styleRe) {
  let parent = element;
  while (is.element(parent)) {
    if (hasStyle(parent, prop, styleRe)) {
      return true;
    }
    parent = parentNode(parent);
  }
  return false;
}
const id = 'dev-tools';
const defaultExport = {
  id,
  install,
  listeners: {
    'interactions:action-start': (_ref4, scope) => {
      let {
        interaction
      } = _ref4;
      for (const check of checks) {
        const options = interaction.interactable && interaction.interactable.options;
        if (!(options && options.devTools && options.devTools.ignore[check.name]) && check.perform(interaction)) {
          scope.logger.warn(prefix + check.text, ...check.getInfo(interaction));
        }
      }
    }
  },
  checks,
  CheckName,
  links,
  prefix
};
export { defaultExport as default };
//# sourceMappingURL=plugin.js.map
