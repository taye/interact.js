const hypot   = require('./hypot');
const browser = require('./browser');
const dom     = require('./domObjects');
const isType  = require('./isType');

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

  setEventDeltas: function (targetObj, prev, cur) {
    const now = new Date().getTime();

    targetObj.page.x    = cur.page.x   - prev.page.x;
    targetObj.page.y    = cur.page.y   - prev.page.y;
    targetObj.client.x  = cur.client.x - prev.client.x;
    targetObj.client.y  = cur.client.y - prev.client.y;
    targetObj.timeStamp = now          - prev.timeStamp;

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
    return isType.isNumber(pointer.pointerId)? pointer.pointerId : pointer.identifier;
  },

  prefixedPropREs: {
    webkit: /(Movement[XY]|Radius[XY]|RotationAngle|Force)$/,
  },

  pointerExtend: function (dest, source) {
    for (const prop in source) {
      const prefixedPropREs = pointerUtils.prefixedPropREs;
      let deprecated = false;

      // skip deprecated prefixed properties
      for (const vendor in prefixedPropREs) {
        if (prop.indexOf(vendor) === 0 && prefixedPropREs[vendor].test(prop)) {
          deprecated = true;
          break;
        }
      }

      if (!deprecated) {
        dest[prop] = source[prop];
      }
    }
    return dest;
  },

  getTouchPair: function (event) {
    const touches = [];

    // array of touches is supplied
    if (isType.isArray(event)) {
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
    deltaSource = deltaSource;

    const sourceX = deltaSource + 'X';
    const sourceY = deltaSource + 'Y';
    const touches = pointerUtils.getTouchPair(event);


    const dx = touches[0][sourceX] - touches[1][sourceX];
    const dy = touches[0][sourceY] - touches[1][sourceY];

    return hypot(dx, dy);
  },

  touchAngle: function (event, prevAngle, deltaSource) {
    deltaSource = deltaSource;

    const sourceX = deltaSource + 'X';
    const sourceY = deltaSource + 'Y';
    const touches = pointerUtils.getTouchPair(event);
    const dx = touches[0][sourceX] - touches[1][sourceX];
    const dy = touches[0][sourceY] - touches[1][sourceY];
    let angle = 180 * Math.atan(dy / dx) / Math.PI;

    if (isType.isNumber(prevAngle)) {
      const dr = angle - prevAngle;
      const drClamped = dr % 360;

      if (drClamped > 315) {
        angle -= 360 + (angle / 360)|0 * 360;
      }
      else if (drClamped > 135) {
        angle -= 180 + (angle / 360)|0 * 360;
      }
      else if (drClamped < -315) {
        angle += 360 + (angle / 360)|0 * 360;
      }
      else if (drClamped < -135) {
        angle += 180 + (angle / 360)|0 * 360;
      }
    }

    return  angle;
  },
};

module.exports = pointerUtils;
