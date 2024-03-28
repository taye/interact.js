/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

function isNonNativeEvent(type, actions) {
  if (actions.phaselessTypes[type]) {
    return true;
  }
  for (const name in actions.map) {
    if (type.indexOf(name) === 0 && type.substr(name.length) in actions.phases) {
      return true;
    }
  }
  return false;
}
export { isNonNativeEvent as default };
//# sourceMappingURL=isNonNativeEvent.js.map
