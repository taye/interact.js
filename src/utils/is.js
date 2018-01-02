const win        = require('./window');
const isWindow   = require('./isWindow');

const is = {
  array   : () => {},

  window  : thing => thing === win.window || isWindow(thing),

  docFrag : thing => is.object(thing) && thing.nodeType === 11,

  object  : thing => !!thing && (typeof thing === 'object'),

  function: thing => typeof thing === 'function',

  number  : thing => typeof thing === 'number'  ,

  bool    : thing => typeof thing === 'boolean' ,

  string  : thing => typeof thing === 'string'  ,

  element: thing => {
    if (!thing || (typeof thing !== 'object')) { return false; }

    const _window = win.getWindow(thing) || win.window;

    return (/object|function/.test(typeof _window.Element)
      ? thing instanceof _window.Element //DOM2
      : thing.nodeType === 1 && typeof thing.nodeName === 'string');
  },

  plainObject: thing => is.object(thing) && thing.constructor.name === 'Object',
};

is.array = thing => (is.object(thing)
  && (typeof thing.length !== 'undefined')
  && is.function(thing.splice));

module.exports = is;
