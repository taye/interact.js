const pointerEvents = require('./index');
const Interactable  = require('../Interactable');
const browser       = require('../utils/browser');
const isType        = require('../utils/isType');
const domUtils      = require('../utils/domUtils');
const scope         = require('../scope');
const extend        = require('../utils/extend');
const { merge }     = require('../utils/arr');

pointerEvents.signals.on('collect-targets', function ({ targets, element, eventType, eventTarget }) {
  function collectSelectors (interactable, selector, context) {
    const els = browser.useMatchesSelectorPolyfill
        ? context.querySelectorAll(selector)
        : undefined;

    const eventable = interactable.events;
    const options = eventable.options;

    if (eventable[eventType]
        && isType.isElement(element)
        && interactable.inContext(element)
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

    if (eventable[eventType]
        && interactable.testIgnoreAllow(options, element, eventTarget)) {
      targets.push({
        element,
        eventable,
        props: { interactable },
      });
    }
  }

  scope.interactables.forEachSelector(collectSelectors);
});

Interactable.signals.on('new', function ({ interactable }) {
  interactable.events.getRect = function (element) {
    return interactable.getRect(element);
  }
});

merge(Interactable.eventTypes, pointerEvents.types);

Interactable.prototype.pointerEvents = function (options) {
  extend(this.events.options, options);

  return this;
};

const _origin = Interactable.prototype.origin;

Interactable.prototype.origin = function (newValue) {
  var ret = _origin.call(this, newValue);

  if (ret === this) {
    this.events.options.origin = newValue;
  }

  return ret;
};

Interactable.settingsMethods.push('pointerEvents');
