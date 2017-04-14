const extend = require('./extend');
const is = require('./is');
const {
  closest,
  parentNode,
  getElementRect,
} = require('./domUtils');

const rectUtils = {
  getStringOptionResult: function (value, interactable, element) {
    if (!is.string(value)) {
      return null;
    }

    if (value === 'parent') {
      value = parentNode(element);
    }
    else if (value === 'self') {
      value = interactable.getRect(element);
    }
    else {
      value = closest(element, value);
    }

    return value;
  },

  resolveRectLike: function (value, interactable, element, functionArgs) {
    value = rectUtils.getStringOptionResult(value, interactable, element) || value;

    if (is.function(value)) {
      value = value.apply(null, functionArgs);
    }

    if (is.element(value)) {
      value = getElementRect(value);
    }

    return value;
  },

  rectToXY: function (rect) {
    return  rect && {
      x: 'x' in rect ? rect.x : rect.left,
      y: 'y' in rect ? rect.y : rect.top,
    };
  },

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

module.exports = rectUtils;
