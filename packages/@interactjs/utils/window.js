"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWindow = getWindow;
exports.init = init;
exports.window = exports.realWindow = void 0;
var _isWindow = _interopRequireDefault(require("./isWindow"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
let realWindow = exports.realWindow = undefined;
let win = exports.window = undefined;
function init(window) {
  // get wrapped window if using Shadow DOM polyfill

  exports.realWindow = realWindow = window;

  // create a TextNode
  const el = window.document.createTextNode('');

  // check if it's wrapped by a polyfill
  if (el.ownerDocument !== window.document && typeof window.wrap === 'function' && window.wrap(el) === el) {
    // use wrapped window
    window = window.wrap(window);
  }
  exports.window = win = window;
}
if (typeof window !== 'undefined' && !!window) {
  init(window);
}
function getWindow(node) {
  if ((0, _isWindow.default)(node)) {
    return node;
  }
  const rootNode = node.ownerDocument || node;
  return rootNode.defaultView || win.window;
}
//# sourceMappingURL=window.js.map