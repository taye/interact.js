const pointerUtils = {};

const win           = require('./window');
const hypot         = require('./hypot');
const extend        = require('./extend');
const browser       = require('./browser');
const isType        = require('./isType');

pointerUtils.copyCoords = function (dest, src) {
  dest.page = dest.page || {};
  dest.page.x = src.page.x;
  dest.page.y = src.page.y;

  dest.client = dest.client || {};
  dest.client.x = src.client.x;
  dest.client.y = src.client.y;

  dest.timeStamp = src.timeStamp;
};

pointerUtils.setEventDeltas = function (targetObj, prev, cur) {
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
};

pointerUtils.isInertiaPointer = function (pointer) {
  return (!!pointer.interaction && /inertiastart/.test(pointer.type));
};

// Get specified X/Y coords for mouse or event.touches[0]
pointerUtils.getXY = function (type, pointer, xy, inertia) {
  xy   = xy   || {};
  type = type || 'page';

  if (inertia) {
    var interaction = pointer.interaction;

    extend(xy, interaction.inertiaStatus.upCoords[type]);

    xy.x += interaction.inertiaStatus.sx;
    xy.y += interaction.inertiaStatus.sy;
  }
  else {
    xy.x = pointer[type + 'X'];
    xy.y = pointer[type + 'Y'];
  }

  return xy;
};

pointerUtils.getPageXY = function (pointer, page) {
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
};

pointerUtils.getClientXY = function (pointer, client) {
  client = client || {};

  const inertia = pointerUtils.isInertiaPointer(pointer);

  // Opera Mobile handles the viewport and scrolling oddly
  if (browser.isOperaMobile && !inertia) {
    client = pointerUtils.getXY('screen', pointer, client, inertia);
  }
  else {
    client = pointerUtils.getXY('client', pointer, client, inertia);
  }

  return client;
};

pointerUtils.getPointerId = function (pointer) {
  return isType.isNumber(pointer.pointerId)? pointer.pointerId : pointer.identifier;
};

pointerUtils.pointerExtend = function (dest, source) {
  for (const prop in source) {
    if (prop !== 'webkitMovementX' && prop !== 'webkitMovementY') {
      dest[prop] = source[prop];
    }
  }
  return dest;
};


module.exports = pointerUtils;
