const pointerEvents = require('./base');
const Interactable  = require('../Interactable');
const browser       = require('../utils/browser');
const is            = require('../utils/is');
const domUtils      = require('../utils/domUtils');
const scope         = require('../scope');
const extend        = require('../utils/extend');
const { merge }     = require('../utils/arr');

pointerEvents.signals.on('collect-targets', function ({ targets, element, type, eventTarget }) {
  function collectSelectors (interactable, selector, context) {
    const els = browser.useMatchesSelectorPolyfill
        ? context.querySelectorAll(selector)
        : undefined;

    const eventable = interactable.events;
    const options = eventable.options;

    if (eventable[type]
        && is.element(element)
        && domUtils.matchesSelector(element, selector, els)
        && interactable.testIgnoreAllow(options, element, eventTarget)) {

      targets.push({
        element,
        eventable,
        props: { interactable },
      });
    }
  }

  const interactable = scope.interactables.get(element);

  if (interactable) {
    const eventable = interactable.events;
    const options = eventable.options;

    if (eventable[type]
        && interactable.testIgnoreAllow(options, element, eventTarget)) {
      targets.push({
        element,
        eventable,
        props: { interactable },
      });
    }
  }

  scope.interactables.forEachSelector(collectSelectors, element);
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
