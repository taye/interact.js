import _ from 'lodash';
import win from '../src/utils/window';
import * as utils from '../src/utils';
import defaults  from '../src/defaultOptions';
import Signals from '../src/utils/Signals';
import Eventable from '../src/Eventable';


const document = win.window.document;

let counter = 0;

export function unique () {
  return (counter++);
}

export function uniqueProps (obj) {
  for (const prop in obj) {
    if (!obj.hasOwnProperty(prop)) { continue; }

    if (_.isObject(obj)) {
      uniqueProps(obj[obj]);
    }
    else {
      obj[prop] = (counter++);
    }
  }
}

export function newCoordsSet (n = 0) {
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
}

export function newPointer (n = 50) {
  return {
    pointerId: n++,
    pageX: n++,
    pageY: n++,
    clientX: n++,
    clientY: n++,
  };
}

export function $ (selector, context) {
  return (context || document).querySelector(selector);
}

export function $$ (selector, context) {
  return Array.from((context || document).querySelectorAll(selector));
}

export function createEl (name) {
  return document.createElement(name);
}

export function mockScope (options) {
  return Object.assign({
    documents: [],
    defaults,
    interactions: [],
    signals: new Signals(),
    Interaction: {
      signals: new Signals(),
      new () {
        return {};
      },
    },
    Interactable: {
      signals: new Signals(),
    },
  }, options);
}

export function mockSignals () {
  return {
    on () {},
    off () {},
    fire () {},
  };
}

export function mockInteractable (props) {
  return Object.assign(
    {
      options: {
        deltaSource: 'page',
      },
      target: {},
      events: new Eventable(),
      getRect () {
        return this.element
          ? utils.dom.getClientRect(this.element)
          : { left: 0, top: 0, right: 0, bottom: 0 };
      },
      fire (event) {
        this.events.fire(event);
      },
    },
    props);
}

export { _ };
