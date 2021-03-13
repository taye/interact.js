import type { ModifierFunction } from '@interactjs/modifiers/base'

const noop = ((() => {}) as unknown) as ModifierFunction<any, any, 'noop'>

noop._defaults = {}

export default noop
