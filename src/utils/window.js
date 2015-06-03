'use strict';

var isWindow = require('./isWindow');

var isShadowDom = function() {
    // create a TextNode
    var el = window.document.createTextNode('');

    // check if it's wrapped by a polyfill
    return el.ownerDocument !== window.document
        && typeof window.wrap === 'function'
        && window.wrap(el) === el;
};

var win = {

    window: undefined,

    realWindow: window,

    getWindow: function getWindow (node) {
        if (isWindow(node)) {
            return node;
        }

        var rootNode = (node.ownerDocument || node);

        return rootNode.defaultView || rootNode.parentWindow || win.window;
    }
};

if (typeof window !== 'undefined') {
    if (isShadowDom()) {
        win.window = window.wrap(window);
    } else {
        win.window = window;
    }
}

module.exports = win;
