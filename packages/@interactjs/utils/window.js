import isWindow from "./isWindow.js";
export let realWindow = undefined;
let win = undefined;
export { win as window };
export function init(window) {
  // get wrapped window if using Shadow DOM polyfill
  realWindow = window; // create a TextNode

  const el = window.document.createTextNode(''); // check if it's wrapped by a polyfill

  if (el.ownerDocument !== window.document && typeof window.wrap === 'function' && window.wrap(el) === el) {
    // use wrapped window
    window = window.wrap(window);
  }

  win = window;
}

if (typeof window !== 'undefined' && !!window) {
  init(window);
}

export function getWindow(node) {
  if (isWindow(node)) {
    return node;
  }

  const rootNode = node.ownerDocument || node;
  return rootNode.defaultView || win.window;
}
//# sourceMappingURL=window.js.map