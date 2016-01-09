const { closest, parentNode, getElementRect } = require('./domUtils');
const { isElement, isFunction, trySelector }  = require('./isType');

module.exports = function (interactable, element) {
  let origin = interactable.options.origin;

  if (origin === 'parent') {
    origin = parentNode(element);
  }
  else if (origin === 'self') {
    origin = interactable.getRect(element);
  }
  else if (trySelector(origin)) {
    origin = closest(element, origin) || { x: 0, y: 0 };
  }

  if (isFunction(origin)) {
    origin = origin(interactable && element);
  }

  if (isElement(origin))  {
    origin = getElementRect(origin);
  }

  origin.x = ('x' in origin)? origin.x : origin.left;
  origin.y = ('y' in origin)? origin.y : origin.top;

  return origin;
};
