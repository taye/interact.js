/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import { nodeContains, matchesSelector } from "../utils/domUtils.js";
import is from "../utils/is.js";
import { getWindow } from "../utils/window.js";
const preventDefault = function preventDefault(newValue) {
  if (/^(always|never|auto)$/.test(newValue)) {
    this.options.preventDefault = newValue;
    return this;
  }
  if (is.bool(newValue)) {
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
    const doc = getWindow(event.target).document;
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
  if (is.element(event.target) && matchesSelector(event.target, 'input,select,textarea,[contenteditable=true],[contenteditable=true] *')) {
    return;
  }
  event.preventDefault();
}
function onInteractionEvent(_ref) {
  let {
    interaction,
    event
  } = _ref;
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
        if (interaction.element && (interaction.element === event.target || nodeContains(interaction.element, event.target))) {
          interaction.interactable.checkAndPreventDefault(event);
          return;
        }
      }
    }
  });
}
var interactablePreventDefault = {
  id: 'core/interactablePreventDefault',
  install,
  listeners: ['down', 'move', 'up', 'cancel'].reduce((acc, eventType) => {
    acc[`interactions:${eventType}`] = onInteractionEvent;
    return acc;
  }, {})
};
export { interactablePreventDefault as default, install };
//# sourceMappingURL=interactablePreventDefault.js.map
