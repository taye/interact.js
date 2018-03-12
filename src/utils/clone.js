import * as is from './is';
import * as arr from './arr';

export default function clone (source) {
  const dest = {};

  for (const prop in source) {
    const value = source[prop];

    if (is.plainObject(value)) {
      dest[prop] = clone(value);
    }
    else if (is.array(value)) {
      dest[prop] = arr.from(value);
    }
    else {
      dest[prop] = value;
    }
  }

  return dest;
}
