/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

const VENDOR_PREFIXES = ['webkit', 'moz'];
function pointerExtend(dest, source) {
  dest.__set || (dest.__set = {});
  for (const prop in source) {
    // skip deprecated prefixed properties
    if (VENDOR_PREFIXES.some(prefix => prop.indexOf(prefix) === 0)) continue;
    if (typeof dest[prop] !== 'function' && prop !== '__set') {
      Object.defineProperty(dest, prop, {
        get() {
          if (prop in dest.__set) return dest.__set[prop];
          return dest.__set[prop] = source[prop];
        },
        set(value) {
          dest.__set[prop] = value;
        },
        configurable: true
      });
    }
  }
  return dest;
}
export { pointerExtend as default };
//# sourceMappingURL=pointerExtend.js.map
