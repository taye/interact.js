import is from "../utils/is.js";
import { warnOnce } from "../utils/misc.js";
function install(scope) {
  const {
    Interactable // tslint:disable-line no-shadowed-variable
  } = scope;
  Interactable.prototype.getAction = function getAction(pointer, event, interaction, element) {
    const action = defaultActionChecker(this, event, interaction, element, scope);
    if (this.options.actionChecker) {
      return this.options.actionChecker(pointer, event, action, this, element, interaction);
    }
    return action;
  };
  Interactable.prototype.ignoreFrom = warnOnce(function (newValue) {
    return this._backCompatOption('ignoreFrom', newValue);
  }, 'Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue}).');
  Interactable.prototype.allowFrom = warnOnce(function (newValue) {
    return this._backCompatOption('allowFrom', newValue);
  }, 'Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue}).');
  Interactable.prototype.actionChecker = actionChecker;
  Interactable.prototype.styleCursor = styleCursor;
}
function defaultActionChecker(interactable, event, interaction, element, scope) {
  const rect = interactable.getRect(element);
  const buttons = event.buttons || {
    0: 1,
    1: 4,
    3: 8,
    4: 16
  }[event.button];
  const arg = {
    action: null,
    interactable,
    interaction,
    element,
    rect,
    buttons
  };
  scope.fire('auto-start:check', arg);
  return arg.action;
}
function styleCursor(newValue) {
  if (is.bool(newValue)) {
    this.options.styleCursor = newValue;
    return this;
  }
  if (newValue === null) {
    delete this.options.styleCursor;
    return this;
  }
  return this.options.styleCursor;
}
function actionChecker(checker) {
  if (is.func(checker)) {
    this.options.actionChecker = checker;
    return this;
  }
  if (checker === null) {
    delete this.options.actionChecker;
    return this;
  }
  return this.options.actionChecker;
}
export default {
  id: 'auto-start/interactableMethods',
  install
};
//# sourceMappingURL=InteractableMethods.js.map