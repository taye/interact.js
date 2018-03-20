/* browser entry point */

import { init as scopeInit } from './scope';
import interact from './interact';
import interactions from './interactions';
import interactablePreventDefault from './interactablePreventDefault';
import inertia from './inertia';
import * as pointerEvents from './pointerEvents';
import * as autoStart from './autoStart';
import * as actions from './actions';
import * as modifiers from './modifiers';
import * as snappers from './utils/snappers';
import autoScroll from './autoScroll';
import reflow from './reflow';

export function init (window) {
  scopeInit(window);

  interact.use(interactions);
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
  interact.use(modifiers);

  interact.snappers = snappers;
  interact.createSnapGrid = interact.snappers.grid;

  // autoScroll
  interact.use(autoScroll);

  // reflow
  interact.use(reflow);

  return interact;
}
