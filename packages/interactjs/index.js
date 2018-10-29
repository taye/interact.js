/*
 * In a (windowless) server environment this file exports a factory function
 * that takes the window to use.
 *
 *     var interact = require('interact.js')(windowObject);
 *
 * See https://github.com/taye/interact.js/issues/187
 */

import { init } from '@interactjs/interact';
import * as snappers from '@interactjs/utils/snappers';
import extend from '@interactjs/utils/extend';
import * as modifiers from '@interactjs/modifiers';

const win = typeof window === 'object' && window;
const exported = win
  ? (() => {
    const interact = init(win);

    return interact.use({
      install (scope) {
        interact.modifiers = extend(scope.modifiers, modifiers);
        interact.snappers = snappers;
        interact.createSnapGrid = interact.snappers.grid;
      },
    });
  })(): init;

export default exported;

if (typeof module === 'object' && !!module) {
  module.exports = exported;
}
