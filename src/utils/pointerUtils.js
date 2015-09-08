const pointerUtils = {};
    // reduce object creation in getXY()
const win = require('./window');
const hypot = require('./hypot');
const extend = require('./extend');
const browser = require('./browser');
const isType = require('./isType');
const InteractEvent = require('../InteractEvent');

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
  targetObj.page.x     = cur.page.x      - prev.page.x;
  targetObj.page.y     = cur.page.y      - prev.page.y;
  targetObj.client.x   = cur.client.x    - prev.client.x;
  targetObj.client.y   = cur.client.y    - prev.client.y;
  targetObj.timeStamp = new Date().getTime() - prev.timeStamp;

  // set pointer velocity
  const dt = Math.max(targetObj.timeStamp / 1000, 0.001);

  targetObj.page.speed   = hypot(targetObj.page.x, targetObj.page.y) / dt;
  targetObj.page.vx      = targetObj.page.x / dt;
  targetObj.page.vy      = targetObj.page.y / dt;

  targetObj.client.speed = hypot(targetObj.client.x, targetObj.page.y) / dt;
  targetObj.client.vx    = targetObj.client.x / dt;
  targetObj.client.vy    = targetObj.client.y / dt;
};

// Get specified X/Y coords for mouse or event.touches[0]
pointerUtils.getXY = function (type, pointer, xy) {
  xy = xy || {};
  type = type || 'page';

  xy.x = pointer[type + 'X'];
  xy.y = pointer[type + 'Y'];

  return xy;
};

pointerUtils.getPageXY = function (pointer, page, interaction) {
  page = page || {};

  if (pointer instanceof InteractEvent) {
    if (/inertiastart/.test(pointer.type)) {
      interaction = interaction || pointer.interaction;

      extend(page, interaction.inertiaStatus.upCoords.page);

      page.x += interaction.inertiaStatus.sx;
      page.y += interaction.inertiaStatus.sy;
    }
    else {
      page.x = pointer.pageX;
      page.y = pointer.pageY;
    }
  }
  // Opera Mobile handles the viewport and scrolling oddly
  else if (browser.isOperaMobile) {
    pointerUtils.getXY('screen', pointer, page);

    page.x += win.window.scrollX;
    page.y += win.window.scrollY;
  }
  else {
    pointerUtils.getXY('page', pointer, page);
  }

  return page;
};

pointerUtils.getClientXY = function (pointer, client, interaction) {
  client = client || {};

  if (pointer instanceof InteractEvent) {
    if (/inertiastart/.test(pointer.type)) {
      extend(client, interaction.inertiaStatus.upCoords.client);

      client.x += interaction.inertiaStatus.sx;
      client.y += interaction.inertiaStatus.sy;
    }
    else {
      client.x = pointer.clientX;
      client.y = pointer.clientY;
    }
  }
  else {
    // Opera Mobile handles the viewport and scrolling oddly
    pointerUtils.getXY(browser.isOperaMobile? 'screen': 'client', pointer, client);
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
