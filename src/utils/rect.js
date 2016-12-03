const extend = require('./extend');

module.exports = {
  xywhToTlbr: function (rect) {
    if (rect && !('left' in rect && 'top' in rect)) {
      rect = extend({}, rect);

      rect.left   = rect.x || 0;
      rect.top    = rect.y || 0;
      rect.right  = rect.right   || (rect.left + rect.width);
      rect.bottom = rect.bottom  || (rect.top + rect.height);
    }

    return rect;
  },

  tlbrToXywh: function (rect) {
    if (rect && !('x' in rect && 'y' in rect)) {
      rect = extend({}, rect);

      rect.x      = rect.left || 0;
      rect.top    = rect.top  || 0;
      rect.width  = rect.width  || (rect.right  - rect.x);
      rect.height = rect.height || (rect.bottom - rect.y);
    }

    return rect;
  },
};
