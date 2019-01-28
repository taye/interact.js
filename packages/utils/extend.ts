export default function extend<T, U extends Partial<T>> (dest: U, source: T) {
  for (const prop in source) {
    dest[prop] = source[prop];
  }
  return dest as T & U;
}
