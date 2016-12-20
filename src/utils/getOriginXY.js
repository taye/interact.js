const { closest, parentNode, getElementRect } = require('./domUtils');
const { isElement, isFunction, trySelector }  = require('./isType');

module.exports = function (target, element, action) {
  const actionOptions = target.options[action];
  const actionOrigin = actionOptions && actionOptions.origin;
  let origin = actionOrigin || target.options.origin;

  if (origin === 'parent') {
    origin = parentNode(element);
  }
  else if (origin === 'self') {
    origin = target.getRect(element);
  }
  else if (trySelector(origin)) {
    origin = closest(element, origin) || { x: 0, y: 0 };
  }

  if (isFunction(origin)) {
    origin = origin(target && element);
  }

  if (isElement(origin))  {
    origin = getElementRect(origin);
  }

  origin.x = ('x' in origin)? origin.x : origin.left;
  origin.y = ('y' in origin)? origin.y : origin.top;

  return origin;
};
