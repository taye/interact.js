'use strict';

if (typeof window === 'undefined') {
    module.exports.window     = undefined;
    module.exports.realWindow = undefined;
}
else {
    module.exports.realWindow = window;

    // create a TextNode
    var el = window.document.createTextNode('');

    // check if it's wrapped by a polyfill
    if (el.ownerDocument !== window.document
        && typeof window.wrap === 'function'
        && window.wrap(el) === el) {
        // return wrapped window
        module.exports.window = window.wrap(window);
    }

    // no Shadow DOM polyfil or native implementation
    module.exports.window = window;
}
