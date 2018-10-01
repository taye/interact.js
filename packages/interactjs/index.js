/*
 * In a (windowless) server environment this file exports a factory function
 * that takes the window to use.
 *
 *     var interact = require('interact.js')(windowObject);
 *
 * See https://github.com/taye/interact.js/issues/187
 */

import { init } from '@interactjs/interact';

const win = typeof window === 'object' && window;
const exported = win ? init(win) : init;

export default exported;

if (typeof module === 'object' && !!module) {
  module.exports = exported;
}
