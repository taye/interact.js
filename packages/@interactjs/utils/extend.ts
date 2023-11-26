export default function extend<T, U extends object>(dest: U & Partial<T>, source: T): T & U {
  for (const prop in source) {
    ;(dest as unknown as T)[prop] = source[prop]
  }

  const ret = dest as T & U

  return ret
}
