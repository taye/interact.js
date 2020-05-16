import extend from "../utils/extend.js";

function install(scope) {
  const {
    Interactable
  } = scope;
  Interactable.prototype.pointerEvents = pointerEventsMethod;
  const __backCompatOption = Interactable.prototype._backCompatOption;

  Interactable.prototype._backCompatOption = function (optionName, newValue) {
    const ret = __backCompatOption.call(this, optionName, newValue);

    if (ret === this) {
      this.events.options[optionName] = newValue;
    }

    return ret;
  };
}

function pointerEventsMethod(options) {
  extend(this.events.options, options);
  return this;
}

const plugin = {
  id: 'pointer-events/interactableTargets',
  install,
  listeners: {
    'pointerEvents:collect-targets': ({
      targets,
      node,
      type,
      eventTarget
    }, scope) => {
      scope.interactables.forEachMatch(node, interactable => {
        const eventable = interactable.events;
        const options = eventable.options;

        if (eventable.types[type] && eventable.types[type].length && interactable.testIgnoreAllow(options, node, eventTarget)) {
          targets.push({
            node,
            eventable,
            props: {
              interactable
            }
          });
        }
      });
    },
    'interactable:new': ({
      interactable
    }) => {
      interactable.events.getRect = function (element) {
        return interactable.getRect(element);
      };
    },
    'interactable:set': ({
      interactable,
      options
    }, scope) => {
      extend(interactable.events.options, scope.pointerEvents.defaults);
      extend(interactable.events.options, options.pointerEvents || {});
    }
  }
};
export default plugin;
//# sourceMappingURL=interactableTargets.js.map