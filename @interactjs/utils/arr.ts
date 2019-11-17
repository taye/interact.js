export function contains (array, target) {
  return array.indexOf(target) !== -1
}

export function remove (array, target) {
  return array.splice(array.indexOf(target), 1)
}

export function merge (target, source) {
  for (const item of source) {
    target.push(item)
  }

  return target
}

export function from (source) {
  return merge([], source)
}

export function findIndex (array, func) {
  for (let i = 0; i < array.length; i++) {
    if (func(array[i], i, array)) {
      return i
    }
  }

  return -1
}

export function find (array, func) {
  return array[findIndex(array, func)]
}
