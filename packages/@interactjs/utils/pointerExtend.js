export default function pointerExtend(dest, source) {
  dest.__set ||= {};

  for (const prop in source) {
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