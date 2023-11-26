const VENDOR_PREFIXES = ['webkit', 'moz'];
export default function pointerExtend(dest, source) {
  dest.__set ||= {};

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
//# sourceMappingURL=pointerExtend.js.map