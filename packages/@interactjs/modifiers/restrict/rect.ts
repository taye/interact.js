import extend from '@interactjs/utils/extend'

import { makeModifier } from '../base'

import { restrict } from './pointer'

const defaults = extend(
  {
    get elementRect() {
      return { top: 0, left: 0, bottom: 1, right: 1 }
    },
    set elementRect(_) {},
  },
  restrict.defaults,
)

const restrictRect = {
  start: restrict.start,
  set: restrict.set,
  defaults,
}

export default makeModifier(restrictRect, 'restrictRect')
export { restrictRect }
