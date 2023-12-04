"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _domObjects = _interopRequireDefault(require("../utils/domObjects.js"));
var _domUtils = require("../utils/domUtils.js");
var _extend = _interopRequireDefault(require("../utils/extend.js"));
var _is = _interopRequireDefault(require("../utils/is.js"));
var _isNonNativeEvent = _interopRequireDefault(require("../utils/isNonNativeEvent.js"));
var _normalizeListeners = _interopRequireDefault(require("../utils/normalizeListeners.js"));
var win = _interopRequireWildcard(require("../utils/window.js"));
var _plugin = _interopRequireDefault(require("./visualizer/plugin"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable import/no-duplicates -- for typescript module augmentations */
/* eslint-enable import/no-duplicates */
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

// eslint-disable-next-line no-undef
const isProduction = "development" === 'production';
function install(scope, {
  logger
} = {}) {
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
      (0, _extend.default)(this.options.devTools, options);
      return this;
    }
    return this.options.devTools;
  };

  // can't set native events on non string targets without `addEventListener` prop
  const {
    _onOff
  } = Interactable.prototype;
  Interactable.prototype._onOff = function (method, typeArg, listenerArg, options, filter) {
    if (_is.default.string(this.target) || this.target.addEventListener) {
      return _onOff.call(this, method, typeArg, listenerArg, options, filter);
    }
    if (_is.default.object(typeArg) && !_is.default.array(typeArg)) {
      options = listenerArg;
      listenerArg = null;
    }
    const normalizedListeners = (0, _normalizeListeners.default)(typeArg, listenerArg, filter);
    for (const type in normalizedListeners) {
      if ((0, _isNonNativeEvent.default)(type, scope.actions)) continue;
      scope.logger.warn(prefix + `Can't add native "${type}" event listener to target without \`addEventListener(type, listener, options)\` prop.`);
    }
    return _onOff.call(this, method, normalizedListeners, options);
  };
  scope.usePlugin(_plugin.default);
}
const checks = [{
  name: CheckName.touchAction,
  perform({
    element
  }) {
    return !!element && !parentHasStyle(element, 'touchAction', /pan-|pinch|none/);
  },
  getInfo({
    element
  }) {
    return [element, links.touchAction];
  },
  text: 'Consider adding CSS "touch-action: none" to this element\n'
}, {
  name: CheckName.boxSizing,
  perform(interaction) {
    const {
      element
    } = interaction;
    return interaction.prepared.name === 'resize' && element instanceof _domObjects.default.HTMLElement && !hasStyle(element, 'boxSizing', /border-box/);
  },
  text: 'Consider adding CSS "box-sizing: border-box" to this resizable element',
  getInfo({
    element
  }) {
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
  while (_is.default.element(parent)) {
    if (hasStyle(parent, prop, styleRe)) {
      return true;
    }
    parent = (0, _domUtils.parentNode)(parent);
  }
  return false;
}
const id = 'dev-tools';
const defaultExport = isProduction ? {
  id,
  install: () => {}
} : {
  id,
  install,
  listeners: {
    'interactions:action-start': ({
      interaction
    }, scope) => {
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
var _default = exports.default = defaultExport;
//# sourceMappingURL=plugin.js.map