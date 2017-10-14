const hypot         = require('./hypot');
const browser       = require('./browser');
const dom           = require('./domObjects');
const domUtils      = require('./domUtils');
const domObjects    = require('./domObjects');
const is            = require('./is');
const pointerExtend = require('./pointerExtend');

const pointerUtils = {
  copyCoords: function (dest, src) {
    dest.page = dest.page || {};
    dest.page.x = src.page.x;
    dest.page.y = src.page.y;

    dest.client = dest.client || {};
    dest.client.x = src.client.x;
    dest.client.y = src.client.y;

    dest.timeStamp = src.timeStamp;
  },

  setCoordDeltas: function (targetObj, prev, cur) {
    targetObj.page.x    = cur.page.x    - prev.page.x;
    targetObj.page.y    = cur.page.y    - prev.page.y;
    targetObj.client.x  = cur.client.x  - prev.client.x;
    targetObj.client.y  = cur.client.y  - prev.client.y;
    targetObj.timeStamp = cur.timeStamp - prev.timeStamp;

    // set pointer velocity
    const dt = Math.max(targetObj.timeStamp / 1000, 0.001);

    targetObj.page.speed   = hypot(targetObj.page.x, targetObj.page.y) / dt;
    targetObj.page.vx      = targetObj.page.x / dt;
    targetObj.page.vy      = targetObj.page.y / dt;

    targetObj.client.speed = hypot(targetObj.client.x, targetObj.page.y) / dt;
    targetObj.client.vx    = targetObj.client.x / dt;
    targetObj.client.vy    = targetObj.client.y / dt;
  },

  isNativePointer: function  (pointer) {
    return (pointer instanceof dom.Event || pointer instanceof dom.Touch);
  },

  // Get specified X/Y coords for mouse or event.touches[0]
  getXY: function (type, pointer, xy) {
    xy = xy || {};
    type = type || 'page';

    xy.x = pointer[type + 'X'];
    xy.y = pointer[type + 'Y'];

    return xy;
  },

  getPageXY: function (pointer, page) {
    page = page || {};

    // Opera Mobile handles the viewport and scrolling oddly
    if (browser.isOperaMobile && pointerUtils.isNativePointer(pointer)) {
      pointerUtils.getXY('screen', pointer, page);

      page.x += window.scrollX;
      page.y += window.scrollY;
    }
    else {
      pointerUtils.getXY('page', pointer, page);
    }

    return page;
  },

  getClientXY: function (pointer, client) {
    client = client || {};

    if (browser.isOperaMobile && pointerUtils.isNativePointer(pointer)) {
      // Opera Mobile handles the viewport and scrolling oddly
      pointerUtils.getXY('screen', pointer, client);
    }
    else {
      pointerUtils.getXY('client', pointer, client);
    }

    return client;
  },

  getPointerId: function (pointer) {
    return is.number(pointer.pointerId)? pointer.pointerId : pointer.identifier;
  },

  setCoords: function (targetObj, pointers, timeStamp) {
    const pointer = (pointers.length > 1
                     ? pointerUtils.pointerAverage(pointers)
                     : pointers[0]);

    const tmpXY = {};

    pointerUtils.getPageXY(pointer, tmpXY);
    targetObj.page.x = tmpXY.x;
    targetObj.page.y = tmpXY.y;

    pointerUtils.getClientXY(pointer, tmpXY);
    targetObj.client.x = tmpXY.x;
    targetObj.client.y = tmpXY.y;

    targetObj.timeStamp = is.number(timeStamp) ? timeStamp :new Date().getTime();
  },

  pointerExtend: pointerExtend,

  getTouchPair: function (event) {
    const touches = [];

    // array of touches is supplied
    if (is.array(event)) {
      touches[0] = event[0];
      touches[1] = event[1];
    }
    // an event
    else {
      if (event.type === 'touchend') {
        if (event.touches.length === 1) {
          touches[0] = event.touches[0];
          touches[1] = event.changedTouches[0];
        }
        else if (event.touches.length === 0) {
          touches[0] = event.changedTouches[0];
          touches[1] = event.changedTouches[1];
        }
      }
      else {
        touches[0] = event.touches[0];
        touches[1] = event.touches[1];
      }
    }

    return touches;
  },

  pointerAverage: function (pointers) {
    const average = {
      pageX  : 0,
      pageY  : 0,
      clientX: 0,
      clientY: 0,
      screenX: 0,
      screenY: 0,
    };

    for (const pointer of pointers) {
      for (const prop in average) {
        average[prop] += pointer[prop];
      }
    }
    for (const prop in average) {
      average[prop] /= pointers.length;
    }

    return average;
  },

  touchBBox: function (event) {
    if (!event.length && !(event.touches && event.touches.length > 1)) {
      return;
    }

    const touches = pointerUtils.getTouchPair(event);
    const minX = Math.min(touches[0].pageX, touches[1].pageX);
    const minY = Math.min(touches[0].pageY, touches[1].pageY);
    const maxX = Math.max(touches[0].pageX, touches[1].pageX);
    const maxY = Math.max(touches[0].pageY, touches[1].pageY);

    return {
      x: minX,
      y: minY,
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  },

  touchDistance: function (event, deltaSource) {
    const sourceX = deltaSource + 'X';
    const sourceY = deltaSource + 'Y';
    const touches = pointerUtils.getTouchPair(event);


    const dx = touches[0][sourceX] - touches[1][sourceX];
    const dy = touches[0][sourceY] - touches[1][sourceY];

    return hypot(dx, dy);
  },

  touchAngle: function (event, prevAngle, deltaSource) {
    const sourceX = deltaSource + 'X';
    const sourceY = deltaSource + 'Y';
    const touches = pointerUtils.getTouchPair(event);
    const dx = touches[1][sourceX] - touches[0][sourceX];
    const dy = touches[1][sourceY] - touches[0][sourceY];
    const angle = 180 * Math.atan2(dy , dx) / Math.PI;

    return  angle;
  },

  getPointerType: function (pointer) {
    return is.string(pointer.pointerType)
      ? pointer.pointerType
      : is.number(pointer.pointerType)
        ? [undefined, undefined,'touch', 'pen', 'mouse'][pointer.pointerType]
          // if the PointerEvent API isn't available, then the "pointer" must
          // be either a MouseEvent, TouchEvent, or Touch object
          : /touch/.test(pointer.type) || pointer instanceof domObjects.Touch
            ? 'touch'
            : 'mouse';
  },

  // [ event.target, event.currentTarget ]
  getEventTargets: function (event) {
    const path = is.function(event.composedPath) ? event.composedPath() : event.path;

    return [
      domUtils.getActualElement(path ? path[0] : event.target),
      domUtils.getActualElement(event.currentTarget),
    ];
  },
};

module.exports = pointerUtils;
