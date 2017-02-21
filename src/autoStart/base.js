const interact       = require('../interact');
const Interactable   = require('../Interactable');
const Interaction    = require('../Interaction');
const actions        = require('../actions/base');
const defaultOptions = require('../defaultOptions');
const browser        = require('../utils/browser');
const scope          = require('../scope');
const utils          = require('../utils');
const signals        = require('../utils/Signals').new();

require('./InteractableMethods');

const autoStart = {
  signals,
  withinInteractionLimit,
  // Allow this many interactions to happen simultaneously
  maxInteractions: Infinity,
  defaults: {
    perAction: {
      manualStart: false,
      max: Infinity,
      maxPerElement: 1,
      allowFrom:  null,
      ignoreFrom: null,
    },
  },
  setActionDefaults: function (action) {
    utils.extend(action.defaults, autoStart.defaults.perAction);
  },
};

// set cursor style on mousedown
Interaction.signals.on('down', function ({ interaction, pointer, event, eventTarget }) {
  if (interaction.interacting()) { return; }

  const actionInfo = getActionInfo(interaction, pointer, event, eventTarget);
  prepare(interaction, actionInfo);
});

// set cursor style on mousemove
Interaction.signals.on('move', function ({ interaction, pointer, event, eventTarget }) {
  if (!interaction.mouse
      || interaction.pointerIsDown
      || interaction.interacting()) { return; }

  const actionInfo = getActionInfo(interaction, pointer, event, eventTarget);
  prepare(interaction, actionInfo);
});

Interaction.signals.on('move', function (arg) {
  const { interaction, event } = arg;

  if (!interaction.pointerIsDown
      || interaction.interacting()
      || !interaction.pointerWasMoved
      || !interaction.prepared.name) {
    return;
  }

  signals.fire('before-start', arg);

  const target = interaction.target;

  if (interaction.prepared.name && target) {
    // check manualStart and interaction limit
    if (target.options[interaction.prepared.name].manualStart
        || !withinInteractionLimit(target, interaction.element, interaction.prepared)) {
      interaction.stop(event);
    }
    else {
      interaction.start(interaction.prepared, target, interaction.element);
    }
  }
});

// Check if the current target supports the action.
// If so, return the validated action. Otherwise, return null
function validateAction (action, interactable, element, eventTarget) {
  if (utils.is.object(action)
      && interactable.testIgnoreAllow(interactable.options[action.name], element, eventTarget)
      && interactable.options[action.name].enabled
      && withinInteractionLimit(interactable, element, action)) {
    return action;
  }

  return null;
}

function validateSelector (interaction, pointer, event, matches, matchElements, eventTarget) {
  for (let i = 0, len = matches.length; i < len; i++) {
    const match = matches[i];
    const matchElement = matchElements[i];
    const action = validateAction(match.getAction(pointer, event, interaction, matchElement),
                                  match,
                                  matchElement,
                                  eventTarget);

    if (action) {
      return {
        action,
        target: match,
        element: matchElement,
      };
    }
  }

  return {};
}

function getActionInfo (interaction, pointer, event, eventTarget) {
  let matches = [];
  let matchElements = [];

  let element = eventTarget;
  let action = null;

  function pushMatches (interactable, selector, context) {
    const elements = (browser.useMatchesSelectorPolyfill
      ? context.querySelectorAll(selector)
      : undefined);

    if (utils.matchesSelector(element, selector, elements)) {

      matches.push(interactable);
      matchElements.push(element);
    }
  }

  while (utils.is.element(element)) {
    matches = [];
    matchElements = [];

    const elementInteractable = scope.interactables.get(element);

    if (elementInteractable
        && (action = validateAction(elementInteractable.getAction(pointer, event, interaction, element, eventTarget),
                                    elementInteractable,
                                    element,
                                    eventTarget))
        && !elementInteractable.options[action.name].manualStart) {
      return {
        element,
        action,
        target: elementInteractable,
      };
    }
    else {
      scope.interactables.forEachSelector(pushMatches, element);

      const actionInfo = validateSelector(interaction, pointer, event, matches, matchElements, eventTarget);

      if (actionInfo.action
          && !actionInfo.target.options[actionInfo.action.name].manualStart) {
        return actionInfo;
      }
    }

    element = utils.parentNode(element);
  }

  return {};
}

function prepare (interaction, { action, target, element }) {
  action = action || {};

  if (interaction.target && interaction.target.options.styleCursor) {
    interaction.target._doc.documentElement.style.cursor = '';
  }

  interaction.target = target;
  interaction.element = element;
  utils.copyAction(interaction.prepared, action);

  if (target && target.options.styleCursor) {
    const cursor = action? actions[action.name].getCursor(action) : '';
    interaction.target._doc.documentElement.style.cursor = cursor;
  }

  signals.fire('prepared', { interaction: interaction });
}

Interaction.signals.on('stop', function ({ interaction }) {
  const target = interaction.target;

  if (target && target.options.styleCursor) {
    target._doc.documentElement.style.cursor = '';
  }
});

Interactable.prototype.getAction = function (pointer, event, interaction, element) {
  const action = this.defaultActionChecker(pointer, event, interaction, element);

  if (this.options.actionChecker) {
    return this.options.actionChecker(pointer, event, action, this, element, interaction);
  }

  return action;
};

/*\
 * Interactable.actionChecker
 [ method ]
 *
 * Gets or sets the function used to check action to be performed on
 * pointerDown
 *
 - checker (function | null) #optional A function which takes a pointer event, defaultAction string, interactable, element and interaction as parameters and returns an object with name property 'drag' 'resize' or 'gesture' and optionally an `edges` object with boolean 'top', 'left', 'bottom' and right props.
 = (Function | Interactable) The checker function or this Interactable
 *
 | interact('.resize-drag')
 |   .resizable(true)
 |   .draggable(true)
 |   .actionChecker(function (pointer, event, action, interactable, element, interaction) {
 |
 |   if (interact.matchesSelector(event.target, '.drag-handle') {
 |     // force drag with handle target
 |     action.name = drag;
 |   }
 |   else {
 |     // resize from the top and right edges
 |     action.name  = 'resize';
 |     action.edges = { top: true, right: true };
 |   }
 |
 |   return action;
 | });
\*/
Interactable.prototype.actionChecker = function (checker) {
  if (utils.is.function(checker)) {
    this.options.actionChecker = checker;

    return this;
  }

  if (checker === null) {
    delete this.options.actionChecker;

    return this;
  }

  return this.options.actionChecker;
};

/*\
 * Interactable.styleCursor
 [ method ]
 *
 * Returns or sets whether the the cursor should be changed depending on the
 * action that would be performed if the mouse were pressed and dragged.
 *
 - newValue (boolean) #optional
 = (boolean | Interactable) The current setting or this Interactable
\*/
Interactable.prototype.styleCursor = function (newValue) {
  if (utils.is.bool(newValue)) {
    this.options.styleCursor = newValue;

    return this;
  }

  if (newValue === null) {
    delete this.options.styleCursor;

    return this;
  }

  return this.options.styleCursor;
};

Interactable.prototype.defaultActionChecker = function (pointer, event, interaction, element) {
  const rect = this.getRect(element);
  const buttons = event.buttons || ({
    0: 1,
    1: 4,
    3: 8,
    4: 16,
  })[event.button];
  let action = null;

  for (const actionName of actions.names) {
    // check mouseButton setting if the pointer is down
    if (interaction.pointerIsDown
        && interaction.mouse
        && (buttons & this.options[actionName].mouseButtons) === 0) {
      continue;
    }

    action = actions[actionName].checker(pointer, event, this, element, interaction, rect);

    if (action) {
      return action;
    }
  }
};

function withinInteractionLimit (interactable, element, action) {
  const options = interactable.options;
  const maxActions = options[action.name].max;
  const maxPerElement = options[action.name].maxPerElement;
  let activeInteractions = 0;
  let targetCount = 0;
  let targetElementCount = 0;

  // no actions if any of these values == 0
  if (!(maxActions && maxPerElement && autoStart.maxInteractions)) { return; }

  for (let i = 0, len = scope.interactions.length; i < len; i++) {
    const interaction = scope.interactions[i];
    const otherAction = interaction.prepared.name;

    if (!interaction.interacting()) { continue; }

    activeInteractions++;

    if (activeInteractions >= autoStart.maxInteractions) {
      return false;
    }

    if (interaction.target !== interactable) { continue; }

    targetCount += (otherAction === action.name)|0;

    if (targetCount >= maxActions) {
      return false;
    }

    if (interaction.element === element) {
      targetElementCount++;

      if (otherAction !== action.name || targetElementCount >= maxPerElement) {
        return false;
      }
    }
  }

  return autoStart.maxInteractions > 0;
}

/*\
 * interact.maxInteractions
 [ method ]
 **
 * Returns or sets the maximum number of concurrent interactions allowed.
 * By default only 1 interaction is allowed at a time (for backwards
 * compatibility). To allow multiple interactions on the same Interactables
 * and elements, you need to enable it in the draggable, resizable and
 * gesturable `'max'` and `'maxPerElement'` options.
 **
 - newValue (number) #optional Any number. newValue <= 0 means no interactions.
\*/
interact.maxInteractions = function (newValue) {
  if (utils.is.number(newValue)) {
    autoStart.maxInteractions = newValue;

    return this;
  }

  return autoStart.maxInteractions;
};

Interactable.settingsMethods.push('styleCursor');
Interactable.settingsMethods.push('actionChecker');
Interactable.settingsMethods.push('ignoreFrom');
Interactable.settingsMethods.push('allowFrom');

defaultOptions.base.actionChecker = null;
defaultOptions.base.styleCursor = true;

utils.extend(defaultOptions.perAction, autoStart.defaults.perAction);

module.exports = autoStart;
