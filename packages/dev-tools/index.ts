/* eslint-disable no-console */
/* global process */
import * as utils from '@interactjs/utils'

declare module '@interactjs/core/scope' {
  interface Scope {
    logger: Logger
  }
}

export interface Logger {
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  log: (...args: any[]) => void
}

export const links = {
  touchAction: '\nhttps://developer.mozilla.org/en-US/docs/Web/CSS/touch-action',
}

// eslint-disable-next-line no-restricted-syntax
export function install (scope: Interact.Scope, { logger = console }: { logger?: Logger } = {}) {
  scope.logger = logger
  scope.interactions.signals.on('action-start', ({ interaction }) => {
    touchAction(interaction.element, scope.logger)
  })
}

export const touchActionMessage = '[interact.js] Consider adding CSS "touch-action: none" to this element\n'

export function _touchAction (element, logger: Console) {
  let parent = element

  while (utils.is.element(parent)) {
    const style = utils.win.window.getComputedStyle(parent)

    if (style.touchAction === 'none') {
      return
    }

    parent = utils.dom.parentNode(parent)
  }

  logger.warn(
    '[interact.js] Consider adding CSS "touch-action: none" to this element\n',
    element,
    links.touchAction)
}

export const touchAction = (element, logger) => {
  if (process.env.NODE_ENV !== 'production') {
    _touchAction(element, logger)
  }
}

export default {
  install,
}
