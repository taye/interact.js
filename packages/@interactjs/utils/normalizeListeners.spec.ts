import normalizeListeners from './normalizeListeners'

test('utils/normalizeListeners', () => {
  const a = () => {}
  const b = () => {}
  const c = () => {}

  // single type, single listener function
  expect(normalizeListeners('type1', a)).toEqual({
    type1: [a],
  })

  // multiple types, single listener function
  expect(normalizeListeners('type1 type2', a)).toEqual({
    type1: [a],
    type2: [a],
  })

  // array of types equivalent to space separated string
  expect(normalizeListeners('type1 type2', a)).toEqual(normalizeListeners(['type1', 'type2'], a))

  // single type, multiple listener functions
  expect(normalizeListeners('type1', [a, b])).toEqual({
    type1: [a, b],
  })

  // single type prefix, object of { suffix: [fn, ...] }
  expect(normalizeListeners('prefix', { _1: [a, b], _2: [b, c] })).toEqual({
    prefix_1: [a, b],
    prefix_2: [b, c],
  })

  // multiple type prefixes, single length array of { suffix: [fn, ...] }
  expect(normalizeListeners('prefix1 prefix2', [{ _1: [a, b], _2: [b, c] }])).toEqual({
    prefix1_1: [a, b],
    prefix1_2: [b, c],
    prefix2_1: [a, b],
    prefix2_2: [b, c],
  })

  // object of { suffix: [fn, ...] } as type arg
  expect(normalizeListeners({ _1: [a, b], _2: [b, c] })).toEqual({
    _1: [a, b],
    _2: [b, c],
  })

  // object of { "suffix1 suffix2": [fn, ...], ... } as type arg
  expect(normalizeListeners({ '_1 _2': [a, b], _3: [b, c] })).toEqual({
    _1: [a, b],
    _2: [a, b],
    _3: [b, c],
  })

  // single type prefix, object of { "suffix1 suffix2": [fn, ...], ... }
  expect(normalizeListeners('prefix', { '_1 _2': [a, b], _3: [b, c] })).toEqual({
    prefix_1: [a, b],
    prefix_2: [a, b],
    prefix_3: [b, c],
  })
})
