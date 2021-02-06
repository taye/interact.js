import * as arr from './arr'
import is from './is'

// tslint:disable-next-line ban-types
export default function clone<T extends Object> (source: T): Partial<T> {
  const dest = {} as Partial<T>

  for (const prop in source) {
    const value = source[prop]

    if (is.plainObject(value)) {
      dest[prop] = clone(value) as any
    } else if (is.array(value)) {
      dest[prop] = arr.from(value) as typeof value
    } else {
      dest[prop] = value
    }
  }

  return dest
}
