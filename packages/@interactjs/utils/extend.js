/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

function extend(dest, source) {
  for (const prop in source) {
    dest[prop] = source[prop];
  }
  const ret = dest;
  return ret;
}
export { extend as default };
//# sourceMappingURL=extend.js.map
