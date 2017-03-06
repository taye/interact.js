const Interactable = require('../Interactable');
const actions      = require('../actions/base');
const is           = require('../utils/is');
const domUtils     = require('../utils/domUtils');

Interactable.prototype.getAction = function (pointer, event, interaction, element) {
  const action = this.defaultActionChecker(pointer, event, interaction, element);

  if (this.options.actionChecker) {
    return this.options.actionChecker(pointer, event, action, this, element, interaction);
  }

  return action;
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
  return this._backCompatOption('ignoreFrom', newValue);
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
  return this._backCompatOption('allowFrom', newValue);
};

Interactable.prototype.testIgnore = function (ignoreFrom, interactableElement, element) {
  if (!ignoreFrom || !is.element(element)) { return false; }

  if (is.string(ignoreFrom)) {
    return domUtils.matchesUpTo(element, ignoreFrom, interactableElement);
  }
  else if (is.element(ignoreFrom)) {
    return domUtils.nodeContains(ignoreFrom, element);
  }

  return false;
};

Interactable.prototype.testAllow = function (allowFrom, interactableElement, element) {
  if (!allowFrom) { return true; }

  if (!is.element(element)) { return false; }

  if (is.string(allowFrom)) {
    return domUtils.matchesUpTo(element, allowFrom, interactableElement);
  }
  else if (is.element(allowFrom)) {
    return domUtils.nodeContains(allowFrom, element);
  }

  return false;
};

Interactable.prototype.testIgnoreAllow = function (options, interactableElement, eventTarget) {
  return (!this.testIgnore(options.ignoreFrom, interactableElement, eventTarget)
    && this.testAllow(options.allowFrom, interactableElement, eventTarget));
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
  if (is.function(checker)) {
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
  if (is.bool(newValue)) {
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
  let action = null;

  for (const actionName of actions.names) {
    // check mouseButton setting if the pointer is down
    if (interaction.pointerIsDown
        && interaction.mouse
        && (event.buttons & this.options[actionName].mouseButtons) === 0) {
      continue;
    }

    action = actions[actionName].checker(pointer, event, this, element, interaction, rect);

    if (action) {
      return action;
    }
  }
};

