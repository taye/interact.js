import * as arr from './arr'
import * as is from './is'

export default function clone<T extends { [key: string]: any }> (source: T): Partial<T> {
  const dest = {} as Partial<T>

  for (const prop in source) {
    const value = source[prop]

    if (is.plainObject(value)) {
      dest[prop] = clone(value) as any
    }
    else if (is.array(value)) {
      dest[prop] = arr.from(value)
    }
    else {
      dest[prop] = value
    }
  }

  return dest
}
