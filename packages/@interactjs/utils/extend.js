export default function extend(dest, source) {
  for (const prop in source) {
    ;
    dest[prop] = source[prop];
  }

  const ret = dest;
  return ret;
}
//# sourceMappingURL=extend.js.map