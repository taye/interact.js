/* browser entry point */

import { default as interact, scope } from './interact';
import interactablePreventDefault from '@interactjs/core/interactablePreventDefault';
import inertia from '@interactjs/inertia';
import * as pointerEvents from '@interactjs/pointer-events';
import * as autoStart from '@interactjs/auto-start';
import * as actions from '@interactjs/actions';
import modifiersBase from '@interactjs/modifiers/base';
import * as modifiers from '@interactjs/modifiers';
import autoScroll from '@interactjs/auto-scroll';
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

// eslint-disable-next-line no-undef
interact.version = init.version = process.env.npm_package_version;

export default interact;
export { interact };
