import { JSDOM } from '@interactjs/_dev/test/domator'
import test from '@interactjs/_dev/test/test'

test('typings', async (t) => {
  let error

  const { window } = new JSDOM('')

  ; (global as any).window = window
  ; (global as any).document = window.document

  try { require('./interactjs-test') }
  catch (e) { error = e }

  delete (global as any).window
  delete (global as any).document

  t.error(error, 'interactjs-test.ts compiles without error')
  t.end()
})
