'use strict';

var win = require('./window'),
    domObjects = require('./domObjects');

module.exports.isElement = function (o) {
    if (!o || (typeof o !== 'object')) { return false; }

    var _window = win.getWindow(o) || win.window;

    return (/object|function/.test(typeof _window.Element)
        ? o instanceof _window.Element //DOM2
        : o.nodeType === 1 && typeof o.nodeName === "string");
};

module.exports.isWindow   = function (thing) { return !!(thing && thing.Window) && (thing instanceof thing.Window); };
module.exports.isDocFrag  = function (thing) { return !!thing && thing instanceof domObjects.DocumentFragment; };
module.exports.isArray    = function (thing) {
    return module.exports.isObject(thing)
    && (typeof thing.length !== undefined)
    && module.exports.isFunction(thing.splice);
};
module.exports.isObject   = function (thing) { return !!thing && (typeof thing === 'object'); };
module.exports.isFunction = function (thing) { return typeof thing === 'function'; };
module.exports.isNumber   = function (thing) { return typeof thing === 'number'  ; };
module.exports.isBool     = function (thing) { return typeof thing === 'boolean' ; };
module.exports.isString   = function (thing) { return typeof thing === 'string'  ; };

