const VENDOR_PREFIXES = ['webkit', 'moz']

export default function pointerExtend<T>(dest: Partial<T & { __set?: Partial<T> }>, source: T) {
  dest.__set ||= {} as any

  for (const prop in source) {
    // skip deprecated prefixed properties
    if (VENDOR_PREFIXES.some((prefix) => prop.indexOf(prefix) === 0)) continue

    if (typeof dest[prop] !== 'function' && prop !== '__set') {
      Object.defineProperty(dest, prop, {
        get() {
          if (prop in dest.__set) return dest.__set[prop]

          return (dest.__set[prop] = source[prop] as any)
        },
        set(value: any) {
          dest.__set[prop] = value
        },
        configurable: true,
      })
    }
  }
  return dest
}
