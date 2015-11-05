const Interaction    = require('./Interaction');
const actions        = require('./actions/base');
const defaultOptions = require('./defaultOptions');
const browser        = require('./utils/browser');
const scope          = require('./scope');
const utils          = require('./utils');

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

      Interaction.signals.fire('before-start-' + interaction.prepared.name, arg);
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

  Interaction.signals.fire('prepared', { interaction: interaction });
}

defaultOptions.perAction.manualStart = false;
