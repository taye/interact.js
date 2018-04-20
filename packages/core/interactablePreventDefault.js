import * as is      from '@interactjs/utils/is';
import events       from '@interactjs/utils/events';
import browser      from '@interactjs/utils/browser';

import { nodeContains, matchesSelector } from '@interactjs/utils/domUtils';
import { getWindow } from '@interactjs/utils/window';

function preventDefault (interactable, newValue) {
  if (/^(always|never|auto)$/.test(newValue)) {
    interactable.options.preventDefault = newValue;
    return interactable;
  }

  if (is.bool(newValue)) {
    interactable.options.preventDefault = newValue? 'always' : 'never';
    return interactable;
  }

  return interactable.options.preventDefault;
}

function checkAndPreventDefault (interactable, scope, event) {
  const setting = interactable.options.preventDefault;

  if (setting === 'never') { return; }

  if (setting === 'always') {
    event.preventDefault();
    return;
  }

  // setting === 'auto'

  // don't preventDefault of touch{start,move} events if the browser supports passive
  // events listeners. CSS touch-action and user-selecct should be used instead
  if (events.supportsPassive
    && /^touch(start|move)$/.test(event.type)
    && !browser.isIOS) {
    const docOptions = scope.getDocIndex(getWindow(event.target).document);

    if (!(docOptions && docOptions.events) || docOptions.events.passive !== false) {
      return;
    }
  }

  // don't preventDefault of pointerdown events
  if (/^(mouse|pointer|touch)*(down|start)/i.test(event.type)) {
    return;
  }

  // don't preventDefault on editable elements
  if (is.element(event.target)
      && matchesSelector(event.target, 'input,select,textarea,[contenteditable=true],[contenteditable=true] *')) {
    return;
  }

  event.preventDefault();
}

function onInteractionEvent ({ interaction, event }) {
  if (interaction.target) {
    interaction.target.checkAndPreventDefault(event);
  }
}

export function init (scope) {
  /** @lends Interactable */
  const Interactable = scope.Interactable;
  /**
   * Returns or sets whether to prevent the browser's default behaviour in
   * response to pointer events. Can be set to:
   *  - `'always'` to always prevent
   *  - `'never'` to never prevent
   *  - `'auto'` to let interact.js try to determine what would be best
   *
   * @param {string} [newValue] `true`, `false` or `'auto'`
   * @return {string | Interactable} The current setting or this Interactable
   */
  Interactable.prototype.preventDefault = function (newValue) {
    return preventDefault(this, newValue);
  };

  Interactable.prototype.checkAndPreventDefault = function (event) {
    return checkAndPreventDefault(this, scope, event);
  };

  for (const eventSignal of ['down', 'move', 'up', 'cancel']) {
    scope.interactions.signals.on(eventSignal, onInteractionEvent);
  }

  // prevent native HTML5 drag on interact.js target elements
  scope.interactions.eventMap.dragstart = function preventNativeDrag (event) {
    for (const interaction of scope.interactions.list) {

      if (interaction.element
        && (interaction.element === event.target
          || nodeContains(interaction.element, event.target))) {

        interaction.target.checkAndPreventDefault(event);
        return;
      }
    }
  };
}

export default { init };
