"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getOriginXY;
var _rect = require("./rect");
function getOriginXY(target, element, actionName) {
  const actionOptions = actionName && target.options[actionName];
  const actionOrigin = actionOptions && actionOptions.origin;
  const origin = actionOrigin || target.options.origin;
  const originRect = (0, _rect.resolveRectLike)(origin, target, element, [target && element]);
  return (0, _rect.rectToXY)(originRect) || {
    x: 0,
    y: 0
  };
}
//# sourceMappingURL=getOriginXY.js.map