import tape from 'tape'

type TapeExport = typeof tape

/**
 * Create a new test with an optional name string and optional opts object.
 * cb(t) fires with the new test object t once all preceeding tests have finished.
 * Tests execute serially.
 */
interface Tape extends TapeExport {
  (name: string, cb: TestCase): void
  (name: string, opts: tape.TestOptions, cb: TestCase): void
  (cb: TestCase): void
  (opts: tape.TestOptions, cb: TestCase): void // tslint:disable-line unified-signatures
}

interface Test extends tape.Test {
  /**
   * Assert that a === b with an optional description msg.
   */
  equal<T> (actual: T, expected: T extends infer P ? P & T : never, msg?: string): void
  equals<T> (actual: T, expected: T extends infer P ? P & T : never, msg?: string): void
  isEqual<T> (actual: T, expected: T extends infer P ? P & T : never, msg?: string): void
  is<T> (actual: T, expected: T extends infer P ? P & T : never, msg?: string): void
  strictEqual<T> (actual: T, expected: T extends infer P ? P & T : never, msg?: string): void
  strictEquals<T> (actual: T, expected: T extends infer P ? P & T : never, msg?: string): void

  /**
   * Assert that a and b have the same structure and nested values using node's deepEqual() algorithm with strict comparisons (===) on leaf nodes and an optional description msg.
   */
  deepEqual<T> (actual: T, expected: T extends infer P ? P & T : never, msg?: string): void
  deepEquals<T> (actual: T, expected: T extends infer P ? P & T : never, msg?: string): void
  isEquivalent<T> (actual: T, expected: T extends infer P ? P & T : never, msg?: string): void
  same<T> (actual: T, expected: T extends infer P ? P & T : never, msg?: string): void

  /**
   * Assert that a and b have the same structure and nested values using node's deepEqual() algorithm with loose comparisons (==) on leaf nodes and an optional description msg.
   */
  deepLooseEqual<T> (actual: T, expected: T extends infer P ? P & T : never, msg?: string): void
  looseEqual<T> (actual: T, expected: T extends infer P ? P & T : never, msg?: string): void
  looseEquals<T> (actual: T, expected: T extends infer P ? P & T : never, msg?: string): void

}

type TestCase = (test: Test) => void

const test: Tape = tape

export default test
