import extend from '@interactjs/utils/extend'
import restrictPointer from './pointer'

const defaults = extend({
  get elementRect () {
    return { top: 0, left: 0, bottom: 1, right: 1 }
  },
  set elementRect (_) {},
}, restrictPointer.defaults)

const restrictRect = {
  start: restrictPointer.start,
  set: restrictPointer.set,
  defaults,
}

export default restrictRect
