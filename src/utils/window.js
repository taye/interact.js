const win = module.exports;
const isWindow = require('./isWindow');

function init (window) {
  // get wrapped window if using Shadow DOM polyfill

  win.realWindow = window;

  // create a TextNode
  const el = window.document.createTextNode('');

  // check if it's wrapped by a polyfill
  if (el.ownerDocument !== window.document
      && typeof window.wrap === 'function'
    && window.wrap(el) === el) {
    // use wrapped window
    window = window.wrap(window);
  }

  win.window = window;
}

if (typeof window === 'undefined') {
  win.window     = undefined;
  win.realWindow = undefined;
}
else {
  init(window);
}

win.getWindow = function getWindow (node) {
  if (isWindow(node)) {
    return node;
  }

  const rootNode = (node.ownerDocument || node);

  return rootNode.defaultView || rootNode.parentWindow || win.window;
};

win.init = init;
