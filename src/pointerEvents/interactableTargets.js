const pointerEvents = require('./index');
const Interactable  = require('../Interactable');
const browser       = require('../utils/browser');
const isType        = require('../utils/isType');
const domUtils      = require('../utils/domUtils');
const scope         = require('../scope');
const { merge }     = require('../utils/arr');

pointerEvents.signals.on('collect-targets', function ({ targets, element, eventType }) {
  function collectSelectors (interactable, selector, context) {
    const els = browser.useMatchesSelectorPolyfill
        ? context.querySelectorAll(selector)
        : undefined;

    const eventable = interactable._iEvents;

    if (eventable[eventType]
        && isType.isElement(element)
        && interactable.inContext(element)
        && domUtils.matchesSelector(element, selector, els)) {

      targets.push({
        element,
        eventable,
        props: { interactable },
      });
    }
  }

  const interactable = scope.interactables.get(element);

  if (interactable) {
    const eventable = interactable._iEvents;

    if (eventable[eventType]) {
      targets.push({
        element,
        eventable,
        props: { interactable },
      });
    }
  }

  scope.interactables.forEachSelector(collectSelectors);
});

merge(Interactable.eventTypes, pointerEvents.types);
