/* eslint-disable no-console */
/* global process */
import domObjects from '@interactjs/utils/domObjects'
import { parentNode } from '@interactjs/utils/domUtils'
import extend from '@interactjs/utils/extend'
import * as is from '@interactjs/utils/is'
import win from '@interactjs/utils/window'

declare module '@interactjs/core/scope' {
  interface Scope {
    logger: Logger
  }
}

declare module '@interactjs/core/defaultOptions' {
  interface BaseDefaults {
    devTools?: DevToolsOptions
  }
}

declare module '@interactjs/core/Interactable' {
  interface Interactable {
    devTools?: Interact.OptionMethod<DevToolsOptions>
  }
}

export interface DevToolsOptions {
  ignore: { [P in keyof typeof CheckName]?: boolean }
}

export interface Logger {
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  log: (...args: any[]) => void
}

export interface Check {
  name: string
  text: string
  perform: (interaction: Interact.Interaction) => boolean
  getInfo: (interaction: Interact.Interaction) => any[]
}

enum CheckName {
  touchAction = '',
  boxSizing = '',
  noListeners = '',
}

const prefix  = '[interact.js] '
const links = {
  touchAction: 'https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action',
  boxSizing: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing',
}

const isProduction = process.env.NODE_ENV === 'production'

// eslint-disable-next-line no-restricted-syntax
function install (scope: Interact.Scope, { logger }: { logger?: Logger } = {}) {
  const {
    interactions,
    Interactable,
    defaults,
  } = scope
  logger = logger || console

  interactions.signals.on('action-start', ({ interaction }) => {
    for (const check of checks) {
      const options = interaction.interactable && interaction.interactable.options[interaction.prepared.name]

      if (
        !(options && options.devTools && options.devTools.ignore[check.name]) &&
        check.perform(interaction)
      ) {
        logger.warn(prefix + check.text, ...check.getInfo(interaction))
      }
    }
  })

  defaults.base.devTools = {
    ignore: {},
  }

  Interactable.prototype.devTools = function (options?) {
    if (options) {
      extend(this.options.devTools, options)
      return this
    }

    return this.options.devTools
  }
}

const checks: Check[] = [
  {
    name: 'touchAction',
    perform ({ element }) {
      return !parentHasStyle(element, 'touchAction', /pan-|pinch|none/)
    },
    getInfo ({ element }) {
      return [
        element,
        links.touchAction,
      ]
    },
    text: 'Consider adding CSS "touch-action: none" to this element\n',
  },

  {
    name: 'boxSizing',
    perform (interaction) {
      const { element } = interaction

      return interaction.prepared.name === 'resize' &&
        element instanceof domObjects.HTMLElement &&
        !hasStyle(element, 'boxSizing', /border-box/)
    },
    text: 'Consider adding CSS "box-sizing: border-box" to this resizable element',
    getInfo ({ element }) {
      return [
        element,
        links.boxSizing,
      ]
    },
  },

  {
    name: 'noListeners',
    perform (interaction) {
      const actionName = interaction.prepared.name
      const moveListeners = interaction.interactable.events.types[`${actionName}move`] || []

      return !moveListeners.length
    },
    getInfo (interaction) {
      return [
        interaction.prepared.name,
        interaction.interactable,
      ]
    },
    text: 'There are no listeners set for this action',
  },
]

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

const id = 'dev-tools'
const defaultExport = isProduction
  ? { id, install: () => {} }
  : {
    id,
    install,
    checks,
    CheckName,
    links,
    prefix,
  }

export default defaultExport
