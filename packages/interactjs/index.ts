import interact, { init as initInteract } from '@interactjs/interact';
import * as modifiers from '@interactjs/modifiers';
import extend from '@interactjs/utils/extend';
import * as snappers from '@interactjs/utils/snappers';

declare module '@interactjs/interact/interact' {
    interface InteractStatic {
        modifiers?: any;
        snappers?: typeof snappers;
        createSnapGrid?: typeof snappers.grid;
    }
}

if (typeof window === 'object' && !!window) {
  init(window);
}

export function init (win: Window) {
  initInteract(win);

  return interact.use({
    install (scope) {
      interact.modifiers = extend(scope.modifiers, modifiers);
      interact.snappers = snappers;
      interact.createSnapGrid = interact.snappers.grid;
    },
  });
}

export default interact;

if (typeof module === 'object' && !!module) {
  module.exports = interact;
}
