/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import isWindow from './isWindow.js';
let realWindow = undefined;
let win = undefined;
function init(window) {
  // get wrapped window if using Shadow DOM polyfill

  realWindow = window;

  // create a TextNode
  const el = window.document.createTextNode('');

  // check if it's wrapped by a polyfill
  if (el.ownerDocument !== window.document && typeof window.wrap === 'function' && window.wrap(el) === el) {
    // use wrapped window
    window = window.wrap(window);
  }
  win = window;
}
if (typeof window !== 'undefined' && !!window) {
  init(window);
}
function getWindow(node) {
  if (isWindow(node)) {
    return node;
  }
  const rootNode = node.ownerDocument || node;
  return rootNode.defaultView || win.window;
}
export { getWindow, init, realWindow, win as window };
//# sourceMappingURL=window.js.map
