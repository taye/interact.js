const pointerEvents = require('./base');
const Interactable  = require('../Interactable');
const is            = require('../utils/is');
const scope         = require('../scope');
const extend        = require('../utils/extend');
const { merge }     = require('../utils/arr');

pointerEvents.signals.on('collect-targets', function ({ targets, element, type, eventTarget }) {
  scope.interactables.forEachMatch(element, interactable => {
    const eventable = interactable.events;
    const options = eventable.options;

    if (eventable[type]
      && is.element(element)
      && interactable.testIgnoreAllow(options, element, eventTarget)) {

      targets.push({
        element,
        eventable,
        props: { interactable },
      });
    }
  });
});

Interactable.signals.on('new', function ({ interactable }) {
  interactable.events.getRect = function (element) {
    return interactable.getRect(element);
  };
});

Interactable.signals.on('set', function ({ interactable, options }) {
  extend(interactable.events.options, pointerEvents.defaults);
  extend(interactable.events.options, options);
});

merge(Interactable.eventTypes, pointerEvents.types);

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

Interactable.settingsMethods.push('pointerEvents');
