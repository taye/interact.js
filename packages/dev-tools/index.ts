/* eslint-disable no-console */
/* global process */
import domObjects from '@interactjs/utils/domObjects'
import { parentNode } from '@interactjs/utils/domUtils'
import * as is from '@interactjs/utils/is'
import win from '@interactjs/utils/window'

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
  boxSizing: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing',
}

export const install = process.env.NODE_ENV === 'production'
  ? () => {}
  // eslint-disable-next-line no-restricted-syntax
  : function install (scope: Interact.Scope, { logger }: { logger?: Logger } = {}) {
    logger = logger || console
    if (process.env.NODE_ENV !== 'production') {
      scope.logger = logger
      scope.interactions.signals.on('action-start', ({ interaction }) => {
        touchAction(interaction, scope.logger)
        boxSizing(interaction, scope.logger)
        noListeners(interaction, scope.logger)
      })
    }
  }

export const touchActionMessage = '[interact.js] Consider adding CSS "touch-action: none" to this element\n'
export const boxSizingMessage = '[interact.js] Consider adding CSS "box-sizing: border-box" to this resizable element'
export const noListenersMessage = '[interact.js] There are no listeners set for this action'

export function touchAction ({ element }: Interact.Interaction, logger: Logger) {
  if (!parentHasStyle(element, 'touchAction', /pan-|pinch|none/)) {
    logger.warn(
      touchActionMessage,
      element,
      links.touchAction)
  }
}

export function boxSizing (interaction: Interact.Interaction, logger: Logger) {
  const { element } = interaction

  if (
    interaction.prepared.name === 'resize' &&
    element instanceof domObjects.HTMLElement &&
    !hasStyle(element, 'boxSizing', /border-box/)
  ) {
    logger.warn(
      boxSizingMessage,
      element,
      links.boxSizing)
  }
}

export function noListeners (interaction: Interact.Interaction, logger: Logger) {
  const actionName = interaction.prepared.name
  const moveListeners = interaction.interactable.events.types[`${actionName}move`] || []

  if (!moveListeners.length) {
    logger.warn(
      noListenersMessage,
      actionName,
      interaction.interactable)
  }
}

function hasStyle (element: HTMLElement, prop: keyof CSSStyleDeclaration, styleRe: RegExp) {
  return styleRe.test(element.style[prop] || win.window.getComputedStyle(element)[prop])
}

function parentHasStyle (element: Element, prop: keyof CSSStyleDeclaration, styleRe: RegExp) {
  let parent = element as HTMLElement

  while (is.element(parent)) {
    if (hasStyle(parent, prop, styleRe)) {
      return true
    }

    parent = parentNode(parent)
  }

  return false
}

export default {
  install,
}
