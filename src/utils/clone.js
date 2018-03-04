import { plainObject } from './is';

export default function clone (source) {
  const dest = {};
  for (const prop in source) {
    if (plainObject(source[prop])) {
      dest[prop] = clone(source[prop]);
    } else {
      dest[prop] = source[prop];
    }
  }
  return dest;
}
