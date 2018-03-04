export function contains (array, target) {
  return array.indexOf(target) !== -1;
}

export function merge (target, source) {
  for (const item of source) {
    target.push(item);
  }

  return target;
}

export function from (source) {
  return merge([], source);
}
