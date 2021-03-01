export default function shallowEqual (left: any, right: any) {
  if (left === right) {
    return true
  }

  if (!left || !right) {
    return false
  }

  const leftKeys = Object.keys(left)

  if (leftKeys.length !== Object.keys(right).length) {
    return false
  }

  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false
    }
  }

  return true
}
