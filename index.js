/*
 * In a (windowless) server environment this file exports a factory function
 * that takes the window to use.
 *
 *     var interact = require('interact.js')(windowObject);
 *
 * See https://github.com/taye/interact.js/issues/187
 */

import { init } from './src/index';

const exported = typeof window === 'undefined'
  ? window => {
    return init(window);
  }
  : init(window);

// export default exported;
module.exports = exported;
