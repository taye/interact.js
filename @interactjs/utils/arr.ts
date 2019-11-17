type Filter<T> = (element: T, index: number, array: T[]) => boolean

export function contains<T> (array: T[], target: T) {
  return array.indexOf(target) !== -1
}

export function remove<T> (array: T[], target: T) {
  return array.splice(array.indexOf(target), 1)
}

export function merge<T, U> (target: Array<T | U>, source: U[]) {
  for (const item of source) {
    target.push(item)
  }

  return target
}

export function from<T = any> (source: ArrayLike<T>) {
  return merge([] as T[], source as T[])
}

export function findIndex<T> (array: T[], func: Filter<T>) {
  for (let i = 0; i < array.length; i++) {
    if (func(array[i], i, array)) {
      return i
    }
  }

  return -1
}

export function find<T = any> (array: T[], func: Filter<T>) {
  return array[findIndex(array, func)]
}
