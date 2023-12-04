"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.install = install;
var _domUtils = require("../utils/domUtils.js");
var _is = _interopRequireDefault(require("../utils/is.js"));
var _window = require("../utils/window.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const preventDefault = function preventDefault(newValue) {
  if (/^(always|never|auto)$/.test(newValue)) {
    this.options.preventDefault = newValue;
    return this;
  }
  if (_is.default.bool(newValue)) {
    this.options.preventDefault = newValue ? 'always' : 'never';
    return this;
  }
  return this.options.preventDefault;
};
function checkAndPreventDefault(interactable, scope, event) {
  const setting = interactable.options.preventDefault;
  if (setting === 'never') return;
  if (setting === 'always') {
    event.preventDefault();
    return;
  }

  // setting === 'auto'

  // if the browser supports passive event listeners and isn't running on iOS,
  // don't preventDefault of touch{start,move} events. CSS touch-action and
  // user-select should be used instead of calling event.preventDefault().
  if (scope.events.supportsPassive && /^touch(start|move)$/.test(event.type)) {
    const doc = (0, _window.getWindow)(event.target).document;
    const docOptions = scope.getDocOptions(doc);
    if (!(docOptions && docOptions.events) || docOptions.events.passive !== false) {
      return;
    }
  }

  // don't preventDefault of pointerdown events
  if (/^(mouse|pointer|touch)*(down|start)/i.test(event.type)) {
    return;
  }

  // don't preventDefault on editable elements
  if (_is.default.element(event.target) && (0, _domUtils.matchesSelector)(event.target, 'input,select,textarea,[contenteditable=true],[contenteditable=true] *')) {
    return;
  }
  event.preventDefault();
}
function onInteractionEvent({
  interaction,
  event
}) {
  if (interaction.interactable) {
    interaction.interactable.checkAndPreventDefault(event);
  }
}
function install(scope) {
  const {
    Interactable
  } = scope;
  Interactable.prototype.preventDefault = preventDefault;
  Interactable.prototype.checkAndPreventDefault = function (event) {
    return checkAndPreventDefault(this, scope, event);
  };

  // prevent native HTML5 drag on interact.js target elements
  scope.interactions.docEvents.push({
    type: 'dragstart',
    listener(event) {
      for (const interaction of scope.interactions.list) {
        if (interaction.element && (interaction.element === event.target || (0, _domUtils.nodeContains)(interaction.element, event.target))) {
          interaction.interactable.checkAndPreventDefault(event);
          return;
        }
      }
    }
  });
}
var _default = exports.default = {
  id: 'core/interactablePreventDefault',
  install,
  listeners: ['down', 'move', 'up', 'cancel'].reduce((acc, eventType) => {
    acc[`interactions:${eventType}`] = onInteractionEvent;
    return acc;
  }, {})
};
//# sourceMappingURL=interactablePreventDefault.js.map