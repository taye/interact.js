import { jsdom } from '@interactjs/_dev/test/domator'
import test from '@interactjs/_dev/test/test'

test('typings', async (t) => {
  let error

  const doc = jsdom('');

  (global as any).document = doc;
  (global as any).window = doc.defaultView

  try { await import('./interactjs-test') }
  catch (e) { error = e }

  t.error(error, 'interactjs-test.ts compiles without error')
  t.end()
})
