import test from '@interactjs/_dev/test/test'
import normalizeListeners from './normalizeListeners'

test('utils/normalizeListeners', (t) => {
  const a = () => {}
  const b = () => {}
  const c = () => {}

  t.deepEqual(
    normalizeListeners('type1', a),
    {
      type1: [a],
    },
    'single type, single listener function')

  t.deepEqual(
    normalizeListeners('type1 type2', a),
    {
      type1: [a],
      type2: [a],
    },
    'multiple types, single listener function')

  t.deepEqual(
    normalizeListeners('type1 type2', a),
    normalizeListeners(['type1', 'type2'], a),
    'array of types equivalent to space separated string')

  t.deepEqual(
    normalizeListeners('type1', [a, b]),
    {
      type1: [a, b],
    },
    'single type, multiple listener functions')

  t.deepEqual(
    normalizeListeners('prefix', { _1: [a, b], _2: [b, c] }),
    {
      prefix_1: [a, b],
      prefix_2: [b, c],
    },
    'single type prefix, object of { suffix: [fn, ...] }')

  t.deepEqual(
    normalizeListeners('prefix1 prefix2', [{ _1: [a, b], _2: [b, c] }]),
    {
      prefix1_1: [a, b],
      prefix1_2: [b, c],
      prefix2_1: [a, b],
      prefix2_2: [b, c],
    },
    'multiple type prefixes, single length array of { suffix: [fn, ...] }')

  t.deepEqual(
    normalizeListeners({ _1: [a, b], _2: [b, c] }),
    {
      _1: [a, b],
      _2: [b, c],
    },
    'object of { suffix: [fn, ...] } as type arg')

  t.deepEqual(
    normalizeListeners({ '_1 _2': [a, b], '_3': [b, c] }),
    {
      _1: [a, b],
      _2: [a, b],
      _3: [b, c],
    },
    'object of { "suffix1 suffix2": [fn, ...], ... } as type arg')

  t.deepEqual(
    normalizeListeners('prefix', { '_1 _2': [a, b], '_3': [b, c] }),
    {
      prefix_1: [a, b],
      prefix_2: [a, b],
      prefix_3: [b, c],
    },
    'single type prefix, object of { "suffix1 suffix2": [fn, ...], ... }')

  t.end()
})
