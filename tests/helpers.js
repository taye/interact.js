import _ from 'lodash';
import win from '../src/utils/window';
import * as utils from '../src/utils';
import clone from '../src/utils/clone';
import defaults  from '../src/defaultOptions';
import Signals from '../src/utils/Signals';
import Eventable from '../src/Eventable';
import Interactable from '../src/Interactable';
import Interaction from '../src/Interaction';

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
    defaults: clone(defaults),
    actions: {
      names: [],
      methodDict: {},
      eventTypes: [],
    },
    interactions: {
      list: {},
    },
    interactables: {
      signals: new Signals(),
    },
    signals: new Signals(),
    Interaction: {
      signals: new Signals(),
      new (props) {
        return new Interaction({ signals: this.signals, ...props });
      },
    },
    Interactable: class extends Interactable {},
  }, options);
}

export function mockSignals () {
  return {
    on () {},
    off () {},
    fire () {},
  };
}

export function newInteractable (scope, target, options = {}, defaultContext) {
  options.signals = scope.interactables.signals;
  options.actions = scope.actions;

  return new scope.Interactable(target, options, defaultContext);
}

export function mockInteractable (props) {
  return Object.assign(
    {
      _signals: new Signals(),
      _actions: {
        names: [],
        methodDict: {},
      },
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
