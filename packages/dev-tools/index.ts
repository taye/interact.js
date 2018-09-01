/* eslint-disable no-console */
/* global process */
import * as utils from '@interactjs/utils'

export function _touchAction (element) {
  let parent = element

  while (utils.is.element(parent)) {
    const style = utils.win.window.getComputedStyle(parent)

    if (style.touchAction === 'none') {
      return
    }

    parent = utils.dom.parentNode(parent)
  }

  console.warn(
    '[interact.js] Consider adding CSS "touch-action: none" to this element\n',
    element,
    '\nhttps://developer.mozilla.org/en-US/docs/Web/CSS/touch-action')
}

export const touchAction = (element) => {
  if (process.env.NODE_ENV !== 'production') {
    _touchAction(element)
  }
}
