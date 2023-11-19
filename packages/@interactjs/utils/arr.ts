type Filter<T> = (element: T, index: number, array: T[]) => boolean

export const contains = <T>(array: T[], target: T) => array.indexOf(target) !== -1

export const remove = <T>(array: T[], target: T) => array.splice(array.indexOf(target), 1)

export const merge = <T, U>(target: Array<T | U>, source: U[]) => {
  for (const item of source) {
    target.push(item)
  }

  return target
}

export const from = <T = any>(source: ArrayLike<T>) => merge([] as T[], source as T[])

export const findIndex = <T>(array: T[], func: Filter<T>) => {
  for (let i = 0; i < array.length; i++) {
    if (func(array[i], i, array)) {
      return i
    }
  }

  return -1
}

export const find = <T = any>(array: T[], func: Filter<T>): T | undefined => array[findIndex(array, func)]
