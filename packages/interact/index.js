/* browser entry point */

import { default as interact, scope } from './interact';
import interactablePreventDefault from '@interactjs/core/interactablePreventDefault';
import inertia from '@interactjs/inertia';
import * as pointerEvents from '@interactjs/pointerEvents';
import * as autoStart from '@interactjs/autoStart';
import * as actions from '@interactjs/actions';
import modifiersBase from '@interactjs/modifiers/base';
import * as modifiers from '@interactjs/modifiers';
import * as snappers from '@interactjs/utils/snappers';
import autoScroll from '@interactjs/autoScroll';
import reflow from '@interactjs/reflow';

export function init (window) {
  scope.init(window);

  interact.use(interactablePreventDefault);

  // inertia
  interact.use(inertia);

  // pointerEvents
  interact.use(pointerEvents);

  // autoStart, hold
  interact.use(autoStart);

  // drag and drop, resize, gesture
  interact.use(actions);

  // snap, resize, etc.
  interact.use(modifiersBase);
  interact.modifiers = modifiers;
  interact.snappers = snappers;
  interact.createSnapGrid = interact.snappers.grid;

  // for backwrads compatibility
  for (const type in modifiers) {
    const { _defaults, _methods } = modifiers[type];

    _defaults._methods = _methods;
    scope.defaults.perAction[type] = _defaults;
  }

  // autoScroll
  interact.use(autoScroll);

  // reflow
  interact.use(reflow);

  return interact;
}

if (typeof window === 'object') {
  init(window);
}

export default interact;
export { interact };
