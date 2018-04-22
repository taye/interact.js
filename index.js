/*
 * In a (windowless) server environment this file exports a factory function
 * that takes the window to use.
 *
 *     var interact = require('interact.js')(windowObject);
 *
 * See https://github.com/taye/interact.js/issues/187
 */

import { interact, init } from '@interactjs/interact';

const exported = typeof window === 'object'
  ? interact
  : init;

export default exported;

if (typeof module === 'object' && !!module) {
  module.exports = exported;
}
