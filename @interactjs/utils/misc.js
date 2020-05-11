import win from "./window.js";
export function warnOnce(method, message) {
  let warned = false;
  return function () {
    if (!warned) {
      win.window.console.warn(message);
      warned = true;
    }

    return method.apply(this, arguments);
  };
}
export function copyAction(dest, src) {
  dest.name = src.name;
  dest.axis = src.axis;
  dest.edges = src.edges;
  return dest;
}
//# sourceMappingURL=misc.js.map