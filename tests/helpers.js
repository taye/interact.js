const _ = require('lodash');
const { window: { document } } = require('../src/utils/window');

let counter = 0;

const helpers = {
  unique () {
    return (counter++);
  },

  uniqueProps (obj) {
    for (const prop in obj) {
      if (!obj.hasOwnProperty(prop)) { continue; }

      if (_.isObject(obj)) {
        helpers.uniqueProps(obj[obj]);
      }
      else {
        obj[prop] = (counter++);
      }
    }
  },

  newCoordsSet (n = 0) {
    return {
      start: {
        page     : { x: n++, y: n++ },
        client   : { x: n++, y: n++ },
        timeStamp: n++,
      },
      cur: {
        page     : { x: n++, y: n++ },
        client   : { x: n++, y: n++ },
        timeStamp: n++,
      },
      prev: {
        page     : { x: n++, y: n++ },
        client   : { x: n++, y: n++ },
        timeStamp: n++,
      },
    };
  },

  newPointer (n = 50) {
    return {
      pointerId: n++,
      pageX: n++,
      pageY: n++,
      clientX: n++,
      clientY: n++,
    };
  },

  _,

  $ (selector, context) {
    return (context || document).querySelector(selector);
  },

  $$ (selector, context) {
    return Array.from((context || document).querySelectorAll(selector));
  },

  createEl (name) {
    return document.createElement(name);
  },
};

module.exports = helpers;
