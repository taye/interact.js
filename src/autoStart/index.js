const Interactable   = require('../Interactable');
const Interaction    = require('../Interaction');
const actions        = require('../actions/base');
const defaultOptions = require('../defaultOptions');
const browser        = require('../utils/browser');
const scope          = require('../scope');
const utils          = require('../utils');

const signals = new (require('../utils/Signals'))();

// mouse move cursor style
Interaction.signals.on('move', function ({ interaction, pointer, event, eventTarget }) {
  if (!interaction.mouse || interaction.pointerIsDown) { return; }

  const actionInfo = getActionInfo(interaction, pointer, event, eventTarget);
  prepare(interaction, actionInfo);
});

Interaction.signals.on('down', function ({ interaction, pointer, event, eventTarget }) {
  if (interaction.interacting()) { return; }

  const actionInfo = getActionInfo(interaction, pointer, event, eventTarget);
  prepare(interaction, actionInfo);
});

Interaction.signals.on('move', function (arg) {
  const { interaction, pointer, event } = arg;

  if (!(interaction.pointerIsDown && interaction.pointerWasMoved && interaction.prepared.name)) {
    return;
  }

  // ignore movement while inertia is active
  if (!interaction.inertiaStatus.active || /inertiastart/.test(pointer.type)) {

    // if just starting an action, calculate the pointer speed now
    if (!interaction.interacting()) {
      utils.setEventDeltas(interaction.pointerDelta, interaction.prevCoords, interaction.curCoords);

      signals.fire('before-start-' + interaction.prepared.name, arg);
    }

    const starting = !!interaction.prepared.name && !interaction.interacting();

    if (starting
        && (interaction.target.options[interaction.prepared.name].manualStart
        || !scope.withinInteractionLimit(interaction.target, interaction.element, interaction.prepared))) {
      interaction.stop(event);
      return;
    }

    if (interaction.prepared.name && interaction.target) {
      if (starting) {
        interaction.start(interaction.prepared, interaction.target, interaction.element);
      }
    }
  }
});

function validateSelector (interaction, pointer, event, matches, matchElements) {
  for (let i = 0, len = matches.length; i < len; i++) {
    const match = matches[i];
    const matchElement = matchElements[i];
    const action = Interaction.validateAction(match.getAction(pointer, event, interaction, matchElement), match);

    if (action && scope.withinInteractionLimit(match, matchElement, action)) {
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

    if (scope.inContext(interactable, element)
        && !scope.testIgnore(interactable, element, eventTarget)
      && scope.testAllow(interactable, element, eventTarget)
      && utils.matchesSelector(element, selector, elements)) {

      matches.push(interactable);
      matchElements.push(element);
    }
  }

  while (utils.isElement(element)) {
    matches = [];
    matchElements = [];

    const elementInteractable = scope.interactables.get(element);

    if (elementInteractable
        && (action = Interaction.validateAction(elementInteractable.getAction(pointer, event, interaction, element), elementInteractable))) {
      return {
        element,
        action,
        target: elementInteractable,
      };
    }
    else {
      scope.interactables.forEachSelector(pushMatches);

      const actionInfo = validateSelector(interaction, pointer, event, matches, matchElements);

      if (actionInfo.action) {
        return actionInfo;
      }
    }

    element = utils.parentElement(element);
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

  interaction.setEventXY(interaction.startCoords, interaction.pointers);

  signals.fire('prepared', { interaction: interaction });
}

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
  if (utils.isFunction(checker)) {
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
  if (utils.isBool(newValue)) {
    this.options.styleCursor = newValue;

    return this;
  }

  if (newValue === null) {
    delete this.options.styleCursor;

    return this;
  }

  return this.options.styleCursor;
};

/*\
 * Interactable.ignoreFrom
 [ method ]
 *
 * If the target of the `mousedown`, `pointerdown` or `touchstart`
 * event or any of it's parents match the given CSS selector or
 * Element, no drag/resize/gesture is started.
 *
 - newValue (string | Element | null) #optional a CSS selector string, an Element or `null` to not ignore any elements
 = (string | Element | object) The current ignoreFrom value or this Interactable
 **
 | interact(element, { ignoreFrom: document.getElementById('no-action') });
 | // or
 | interact(element).ignoreFrom('input, textarea, a');
\*/
Interactable.prototype.ignoreFrom = function (newValue) {
  if (utils.trySelector(newValue)) {            // CSS selector to match event.target
    this.options.ignoreFrom = newValue;
    return this;
  }

  if (utils.isElement(newValue)) {              // specific element
    this.options.ignoreFrom = newValue;
    return this;
  }

  return this.options.ignoreFrom;
};

/*\
 * Interactable.allowFrom
 [ method ]
 *
 * A drag/resize/gesture is started only If the target of the
 * `mousedown`, `pointerdown` or `touchstart` event or any of it's
 * parents match the given CSS selector or Element.
 *
 - newValue (string | Element | null) #optional a CSS selector string, an Element or `null` to allow from any element
 = (string | Element | object) The current allowFrom value or this Interactable
 **
 | interact(element, { allowFrom: document.getElementById('drag-handle') });
 | // or
 | interact(element).allowFrom('.handle');
\*/
Interactable.prototype.allowFrom = function (newValue) {
  if (utils.trySelector(newValue)) {            // CSS selector to match event.target
    this.options.allowFrom = newValue;
    return this;
  }

  if (utils.isElement(newValue)) {              // specific element
    this.options.allowFrom = newValue;
    return this;
  }

  return this.options.allowFrom;
};

Interaction.signals.on('stop-active', function ({ interaction }) {
  const target = interaction.target;

  if (target.options.styleCursor) {
    target._doc.documentElement.style.cursor = '';
  }
});

Interactable.prototype.defaultActionChecker = function (pointer, event, interaction, element) {
  const rect = this.getRect(element);
  let action = null;

  for (const actionName of actions.names) {
    action = actions[actionName].checker(pointer, event, this, element, interaction, rect);

    if (action) {
      return action;
    }
  }
};

Interactable.settingsMethods.push('styleCursor');
Interactable.settingsMethods.push('actionChecker');
Interactable.settingsMethods.push('ignoreFrom');
Interactable.settingsMethods.push('allowFrom');

defaultOptions.base.actionChecker = null;
defaultOptions.base.ignoreFrom = null;
defaultOptions.base.allowFrom = null;
defaultOptions.base.styleCursor = true;
defaultOptions.perAction.manualStart = false;

module.exports = { signals };
