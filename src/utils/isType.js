'use strict';

var win = require('./window'),
    domObjects = require('./domObjects');

var isType = {
    isElement : function (o) {
        if (!o || (typeof o !== 'object')) { return false; }
    
        var _window = win.getWindow(o) || win.window;
    
        return (/object|function/.test(typeof _window.Element)
            ? o instanceof _window.Element //DOM2
            : o.nodeType === 1 && typeof o.nodeName === "string");
    },

    isArray    : null,
    
    isWindow   : require('./isWindow'),

    isDocFrag  : function (thing) { return !!thing && thing instanceof domObjects.DocumentFragment; },

    isObject   : function (thing) { return !!thing && (typeof thing === 'object'); },

    isFunction : function (thing) { return typeof thing === 'function'; },

    isNumber   : function (thing) { return typeof thing === 'number'  ; },

    isBool     : function (thing) { return typeof thing === 'boolean' ; },

    isString   : function (thing) { return typeof thing === 'string'  ; }
    
};

isType.isArray = function (thing) {
    return isType.isObject(thing)
        && (typeof thing.length !== 'undefined')
        && isType.isFunction(thing.splice);
};

module.exports = isType;
