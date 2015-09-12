const win     = require('./window');
const hypot   = require('./hypot');
const extend  = require('./extend');
const browser = require('./browser');
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

  isInertiaPointer: function (pointer) {
    return (!!pointer.interaction && /inertiastart/.test(pointer.type));
  },

  // Get specified X/Y coords for mouse or event.touches[0]
  getXY: function (type, pointer, xy, inertia) {
    xy   = xy   || {};
    type = type || 'page';

    if (inertia) {
      const interaction = pointer.interaction;

      extend(xy, interaction.inertiaStatus.upCoords[type]);

      xy.x += interaction.inertiaStatus.sx;
      xy.y += interaction.inertiaStatus.sy;
    }
    else {
      xy.x = pointer[type + 'X'];
      xy.y = pointer[type + 'Y'];
    }

    return xy;
  },

  getPageXY: function (pointer, page) {
    page = page || {};

    const inertia = pointerUtils.isInertiaPointer(pointer);

    // Opera Mobile handles the viewport and scrolling oddly
    if (browser.isOperaMobile && !inertia) {
      pointerUtils.getXY('screen', pointer, page, inertia);

      page.x += win.window.scrollX;
      page.y += win.window.scrollY;
    }
    else {
      pointerUtils.getXY('page', pointer, page, inertia);
    }

    return page;
  },

  getClientXY: function (pointer, client) {
    client = client || {};

    const inertia = pointerUtils.isInertiaPointer(pointer);

    // Opera Mobile handles the viewport and scrolling oddly
    if (browser.isOperaMobile && !inertia) {
      client = pointerUtils.getXY(browser.isOperaMobile? 'screen': 'client', pointer, client, inertia);
    }
    else {
      client = pointerUtils.getXY('client', pointer, client, inertia);
    }

    return client;
  },

  getPointerId: function (pointer) {
    return isType.isNumber(pointer.pointerId)? pointer.pointerId : pointer.identifier;
  },

  pointerExtend: function (dest, source) {
    for (const prop in source) {
      if (prop !== 'webkitMovementX' && prop !== 'webkitMovementY') {
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

  touchAverage: function (event) {
    const touches = pointerUtils.getTouchPair(event);

    return {
      pageX: (touches[0].pageX + touches[1].pageX) / 2,
      pageY: (touches[0].pageY + touches[1].pageY) / 2,
      clientX: (touches[0].clientX + touches[1].clientX) / 2,
      clientY: (touches[0].clientY + touches[1].clientY) / 2,
    };
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
