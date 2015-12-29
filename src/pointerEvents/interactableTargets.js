const pointerEvents = require('./index');
const browser       = require('../utils/browser');
const isType        = require('../utils/isType');
const domUtils      = require('../utils/domUtils');
const scope         = require('../scope');

pointerEvents.signals.on('collect-targets', function ({ targets, path, eventType }) {
  let element;

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

  for (element of path) {
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
  }
});
