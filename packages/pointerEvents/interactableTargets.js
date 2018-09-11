import * as is       from '@interactjs/utils/is';
import extend        from '@interactjs/utils/extend';
import { merge }     from '@interactjs/utils/arr';

function install (scope) {
  const {
    pointerEvents,
    actions,
    Interactable,
    interactables,
  } = scope;

  pointerEvents.signals.on('collect-targets', function ({ targets, element, type, eventTarget }) {
    scope.interactables.forEachMatch(element, interactable => {
      const eventable = interactable.events;
      const options = eventable.options;

      if (
        eventable.types[type] &&
        eventable.types[type].length &&
        is.element(element) &&
        interactable.testIgnoreAllow(options, element, eventTarget)) {

        targets.push({
          element,
          eventable,
          props: { interactable },
        });
      }
    });
  });

  interactables.signals.on('new', function ({ interactable }) {
    interactable.events.getRect = function (element) {
      return interactable.getRect(element);
    };
  });

  interactables.signals.on('set', function ({ interactable, options }) {
    extend(interactable.events.options, pointerEvents.defaults);
    extend(interactable.events.options, options.pointerEvents || {});
  });

  merge(actions.eventTypes, pointerEvents.types);

  Interactable.prototype.pointerEvents = function (options) {
    extend(this.events.options, options);

    return this;
  };

  const __backCompatOption = Interactable.prototype._backCompatOption;

  Interactable.prototype._backCompatOption = function (optionName, newValue) {
    const ret = __backCompatOption.call(this, optionName, newValue);

    if (ret === this) {
      this.events.options[optionName] = newValue;
    }

    return ret;
  };
}

export default {
  install,
};
