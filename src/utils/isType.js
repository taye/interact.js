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
    
    isWindow   : function (thing) { return !!(thing && thing.Window) && (thing instanceof thing.Window); },

    isDocFrag  : function (thing) { return !!thing && thing instanceof domObjects.DocumentFragment; },

    isArray    : function (thing) {
        return isObject(thing)
            && (typeof thing.length !== 'undefined')
            && isFunction(thing.splice);
    },

    isObject   : function (thing) { return !!thing && (typeof thing === 'object'); },

    isFunction : function (thing) { return typeof thing === 'function'; },

    isNumber   : function (thing) { return typeof thing === 'number'  ; },

    isBool     : function (thing) { return typeof thing === 'boolean' ; },

    isString   : function (thing) { return typeof thing === 'string'  ; }
    
};

module.exports = isType;