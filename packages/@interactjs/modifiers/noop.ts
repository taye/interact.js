import type { ModifierFunction } from './types'

const noop = (() => {}) as unknown as ModifierFunction<any, any, 'noop'>

noop._defaults = {}

export default noop
