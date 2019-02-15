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
  touchAction: 'https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action',
}

// eslint-disable-next-line no-restricted-syntax
export function install (scope: Interact.Scope, { logger = console }: { logger?: Logger } = {}) {
  scope.logger = logger
  scope.interactions.signals.on('action-start', ({ interaction }) => {
    touchAction(interaction, scope.logger)
    noListeners(interaction, scope.logger)
  })
}

export const touchActionMessage = '[interact.js] Consider adding CSS "touch-action: none" to this element\n'
export const noListenersMessage = '[interact.js] There are no listeners set for this action'

export function _touchAction ({ element }: Interact.Interaction, logger: Logger) {
  let parent = element

  while (utils.is.element(parent)) {
    const style = utils.win.window.getComputedStyle(parent)

    if (/pan-|pinch|none/.test(style.touchAction)) {
      return
    }

    parent = utils.dom.parentNode(parent)
  }

  logger.warn(
    touchActionMessage,
    element,
    links.touchAction)
}

export function _noListeners (interaction: Interact.Interaction, logger: Logger) {
  const actionName = interaction.prepared.name
  const moveListeners = interaction.interactable.events.types[`${actionName}move`] || []

  if (!moveListeners.length) {
    logger.warn(
      noListenersMessage,
      actionName,
      interaction.interactable)
  }
}

export const touchAction = (element, logger) => {
  if (process.env.NODE_ENV !== 'production') {
    _touchAction(element, logger)
  }
}

export const noListeners = (element, logger) => {
  if (process.env.NODE_ENV !== 'production') {
    _noListeners(element, logger)
  }
}

export default {
  install,
}
