export default function pointerExtend<T> (dest: Partial<T & { __set?: Partial<T> }>, source: T) {
  dest.__set ||= {} as any

  for (const prop in source) {
    if (typeof dest[prop] !== 'function' && prop !== '__set') {
      Object.defineProperty(dest, prop, {
        get () {
          if (prop in dest.__set) return dest.__set[prop]

          return (dest.__set[prop] = source[prop] as any)
        },
        set (value: any) {
          dest.__set[prop] = value
        },
        configurable: true,
      })
    }
  }
  return dest
}
