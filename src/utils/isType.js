const win        = require('./window');
const isWindow   = require('./isWindow');
const domObjects = require('./domObjects');

const isType = {
  isElement  : function (o) {
    if (!o || (typeof o !== 'object')) { return false; }

    const _window = win.getWindow(o) || win.window;

    return (/object|function/.test(typeof _window.Element)
      ? o instanceof _window.Element //DOM2
      : o.nodeType === 1 && typeof o.nodeName === 'string');
  },

  isArray    : null,

  isWindow   : function (thing) { return thing === win.window || isWindow(thing); },

  isDocFrag  : function (thing) { return isType.isObject(thing) && thing.nodeType === 11; },

  isObject   : function (thing) { return !!thing && (typeof thing === 'object'); },

  isFunction : function (thing) { return typeof thing === 'function'; },

  isNumber   : function (thing) { return typeof thing === 'number'  ; },

  isBool     : function (thing) { return typeof thing === 'boolean' ; },

  isString   : function (thing) { return typeof thing === 'string'  ; },

  trySelector: function (value) {
    if (!isType.isString(value)) { return false; }

    // an exception will be raised if it is invalid
    domObjects.document.querySelector(value);
    return true;
  },
};

isType.isArray = function (thing) {
  return (isType.isObject(thing)
      && (typeof thing.length !== 'undefined')
      && isType.isFunction(thing.splice));
};

module.exports = isType;
