/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import * as domUtils from "../utils/domUtils.js";
import extend from "../utils/extend.js";
import is from "../utils/is.js";
import { copyAction } from "../utils/misc.js";
import InteractableMethods from './InteractableMethods.js';

/* eslint-enable import/no-duplicates */

function install(scope) {
  const {
    interactStatic: interact,
    defaults
  } = scope;
  scope.usePlugin(InteractableMethods);
  defaults.base.actionChecker = null;
  defaults.base.styleCursor = true;
  extend(defaults.perAction, {
    manualStart: false,
    max: Infinity,
    maxPerElement: 1,
    allowFrom: null,
    ignoreFrom: null,
    // only allow left button by default
    // see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons#Return_value
    mouseButtons: 1
  });
  interact.maxInteractions = newValue => maxInteractions(newValue, scope);
  scope.autoStart = {
    // Allow this many interactions to happen simultaneously
    maxInteractions: Infinity,
    withinInteractionLimit,
    cursorElement: null
  };
}
function prepareOnDown(_ref, scope) {
  let {
    interaction,
    pointer,
    event,
    eventTarget
  } = _ref;
  if (interaction.interacting()) return;
  const actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
  prepare(interaction, actionInfo, scope);
}
function prepareOnMove(_ref2, scope) {
  let {
    interaction,
    pointer,
    event,
    eventTarget
  } = _ref2;
  if (interaction.pointerType !== 'mouse' || interaction.pointerIsDown || interaction.interacting()) return;
  const actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
  prepare(interaction, actionInfo, scope);
}
function startOnMove(arg, scope) {
  const {
    interaction
  } = arg;
  if (!interaction.pointerIsDown || interaction.interacting() || !interaction.pointerWasMoved || !interaction.prepared.name) {
    return;
  }
  scope.fire('autoStart:before-start', arg);
  const {
    interactable
  } = interaction;
  const actionName = interaction.prepared.name;
  if (actionName && interactable) {
    // check manualStart and interaction limit
    if (interactable.options[actionName].manualStart || !withinInteractionLimit(interactable, interaction.element, interaction.prepared, scope)) {
      interaction.stop();
    } else {
      interaction.start(interaction.prepared, interactable, interaction.element);
      setInteractionCursor(interaction, scope);
    }
  }
}
function clearCursorOnStop(_ref3, scope) {
  let {
    interaction
  } = _ref3;
  const {
    interactable
  } = interaction;
  if (interactable && interactable.options.styleCursor) {
    setCursor(interaction.element, '', scope);
  }
}

// Check if the current interactable supports the action.
// If so, return the validated action. Otherwise, return null
function validateAction(action, interactable, element, eventTarget, scope) {
  if (interactable.testIgnoreAllow(interactable.options[action.name], element, eventTarget) && interactable.options[action.name].enabled && withinInteractionLimit(interactable, element, action, scope)) {
    return action;
  }
  return null;
}
function validateMatches(interaction, pointer, event, matches, matchElements, eventTarget, scope) {
  for (let i = 0, len = matches.length; i < len; i++) {
    const match = matches[i];
    const matchElement = matchElements[i];
    const matchAction = match.getAction(pointer, event, interaction, matchElement);
    if (!matchAction) {
      continue;
    }
    const action = validateAction(matchAction, match, matchElement, eventTarget, scope);
    if (action) {
      return {
        action,
        interactable: match,
        element: matchElement
      };
    }
  }
  return {
    action: null,
    interactable: null,
    element: null
  };
}
function getActionInfo(interaction, pointer, event, eventTarget, scope) {
  let matches = [];
  let matchElements = [];
  let element = eventTarget;
  function pushMatches(interactable) {
    matches.push(interactable);
    matchElements.push(element);
  }
  while (is.element(element)) {
    matches = [];
    matchElements = [];
    scope.interactables.forEachMatch(element, pushMatches);
    const actionInfo = validateMatches(interaction, pointer, event, matches, matchElements, eventTarget, scope);
    if (actionInfo.action && !actionInfo.interactable.options[actionInfo.action.name].manualStart) {
      return actionInfo;
    }
    element = domUtils.parentNode(element);
  }
  return {
    action: null,
    interactable: null,
    element: null
  };
}
function prepare(interaction, _ref4, scope) {
  let {
    action,
    interactable,
    element
  } = _ref4;
  action = action || {
    name: null
  };
  interaction.interactable = interactable;
  interaction.element = element;
  copyAction(interaction.prepared, action);
  interaction.rect = interactable && action.name ? interactable.getRect(element) : null;
  setInteractionCursor(interaction, scope);
  scope.fire('autoStart:prepared', {
    interaction
  });
}
function withinInteractionLimit(interactable, element, action, scope) {
  const options = interactable.options;
  const maxActions = options[action.name].max;
  const maxPerElement = options[action.name].maxPerElement;
  const autoStartMax = scope.autoStart.maxInteractions;
  let activeInteractions = 0;
  let interactableCount = 0;
  let elementCount = 0;

  // no actions if any of these values == 0
  if (!(maxActions && maxPerElement && autoStartMax)) {
    return false;
  }
  for (const interaction of scope.interactions.list) {
    const otherAction = interaction.prepared.name;
    if (!interaction.interacting()) {
      continue;
    }
    activeInteractions++;
    if (activeInteractions >= autoStartMax) {
      return false;
    }
    if (interaction.interactable !== interactable) {
      continue;
    }
    interactableCount += otherAction === action.name ? 1 : 0;
    if (interactableCount >= maxActions) {
      return false;
    }
    if (interaction.element === element) {
      elementCount++;
      if (otherAction === action.name && elementCount >= maxPerElement) {
        return false;
      }
    }
  }
  return autoStartMax > 0;
}
function maxInteractions(newValue, scope) {
  if (is.number(newValue)) {
    scope.autoStart.maxInteractions = newValue;
    return this;
  }
  return scope.autoStart.maxInteractions;
}
function setCursor(element, cursor, scope) {
  const {
    cursorElement: prevCursorElement
  } = scope.autoStart;
  if (prevCursorElement && prevCursorElement !== element) {
    prevCursorElement.style.cursor = '';
  }
  element.ownerDocument.documentElement.style.cursor = cursor;
  element.style.cursor = cursor;
  scope.autoStart.cursorElement = cursor ? element : null;
}
function setInteractionCursor(interaction, scope) {
  const {
    interactable,
    element,
    prepared
  } = interaction;
  if (!(interaction.pointerType === 'mouse' && interactable && interactable.options.styleCursor)) {
    // clear previous target element cursor
    if (scope.autoStart.cursorElement) {
      setCursor(scope.autoStart.cursorElement, '', scope);
    }
    return;
  }
  let cursor = '';
  if (prepared.name) {
    const cursorChecker = interactable.options[prepared.name].cursorChecker;
    if (is.func(cursorChecker)) {
      cursor = cursorChecker(prepared, interactable, element, interaction._interacting);
    } else {
      cursor = scope.actions.map[prepared.name].getCursor(prepared);
    }
  }
  setCursor(interaction.element, cursor || '', scope);
}
const autoStart = {
  id: 'auto-start/base',
  before: ['actions'],
  install,
  listeners: {
    'interactions:down': prepareOnDown,
    'interactions:move': (arg, scope) => {
      prepareOnMove(arg, scope);
      startOnMove(arg, scope);
    },
    'interactions:stop': clearCursorOnStop
  },
  maxInteractions,
  withinInteractionLimit,
  validateAction
};
export { autoStart as default };
//# sourceMappingURL=base.js.map
