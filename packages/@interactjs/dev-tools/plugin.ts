import type Interaction from '@interactjs/core/Interaction'
import type { Scope, Plugin } from '@interactjs/core/scope'
import visualizer from '@interactjs/dev-tools/visualizer/plugin'
import type { Element, OptionMethod } from '@interactjs/types/index'
import domObjects from '@interactjs/utils/domObjects'
import { parentNode } from '@interactjs/utils/domUtils'
import extend from '@interactjs/utils/extend'
import is from '@interactjs/utils/is'
import * as win from '@interactjs/utils/window'

declare module '@interactjs/core/scope' {
  interface Scope {
    logger: Logger
  }
}

declare module '@interactjs/core/InteractStatic' {
  export interface InteractStatic {
    visializer: typeof visualizer
  }
}

declare module '@interactjs/core/options' {
  interface BaseDefaults {
    devTools?: DevToolsOptions
  }
}

declare module '@interactjs/core/Interactable' {
  interface Interactable {
    devTools: OptionMethod<DevToolsOptions>
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
  name: CheckName
  text: string
  perform: (interaction: Interaction) => boolean
  getInfo: (interaction: Interaction) => any[]
}

enum CheckName {
  touchAction = 'touchAction',
  boxSizing = 'boxSizing',
  noListeners = 'noListeners',
}

const prefix = '[interact.js] '
const links = {
  touchAction: 'https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action',
  boxSizing: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing',
}

// eslint-disable-next-line no-undef
const isProduction = process.env.NODE_ENV === 'production'

function install (scope: Scope, { logger }: { logger?: Logger } = {}) {
  const { Interactable, defaults } = scope

  scope.logger = logger || console

  defaults.base.devTools = {
    ignore: {},
  }

  Interactable.prototype.devTools = function (options?: object) {
    if (options) {
      extend(this.options.devTools, options)
      return this
    }

    return this.options.devTools
  }

  scope.usePlugin(visualizer)
}

const checks: Check[] = [
  {
    name: CheckName.touchAction,
    perform ({ element }) {
      return !parentHasStyle(element, 'touchAction', /pan-|pinch|none/)
    },
    getInfo ({ element }) {
      return [element, links.touchAction]
    },
    text: 'Consider adding CSS "touch-action: none" to this element\n',
  },

  {
    name: CheckName.boxSizing,
    perform (interaction) {
      const { element } = interaction

      return (
        interaction.prepared.name === 'resize' &&
        element instanceof domObjects.HTMLElement &&
        !hasStyle(element, 'boxSizing', /border-box/)
      )
    },
    text: 'Consider adding CSS "box-sizing: border-box" to this resizable element',
    getInfo ({ element }) {
      return [element, links.boxSizing]
    },
  },

  {
    name: CheckName.noListeners,
    perform (interaction) {
      const actionName = interaction.prepared.name
      const moveListeners = interaction.interactable.events.types[`${actionName}move`] || []

      return !moveListeners.length
    },
    getInfo (interaction) {
      return [interaction.prepared.name, interaction.interactable]
    },
    text: 'There are no listeners set for this action',
  },
]

function hasStyle (element: HTMLElement, prop: keyof CSSStyleDeclaration, styleRe: RegExp) {
  const value = element.style[prop] || win.window.getComputedStyle(element)[prop]
  return styleRe.test((value || '').toString())
}

function parentHasStyle (element: Element, prop: keyof CSSStyleDeclaration, styleRe: RegExp) {
  let parent = element as HTMLElement

  while (is.element(parent)) {
    if (hasStyle(parent, prop, styleRe)) {
      return true
    }

    parent = parentNode(parent) as HTMLElement
  }

  return false
}

const id = 'dev-tools'
const defaultExport: Plugin = isProduction
  ? { id, install: () => {} }
  : {
    id,
    install,
    listeners: {
      'interactions:action-start': ({ interaction }, scope) => {
        for (const check of checks) {
          const options = interaction.interactable && interaction.interactable.options

          if (
            !(options && options.devTools && options.devTools.ignore[check.name]) &&
              check.perform(interaction)
          ) {
            scope.logger.warn(prefix + check.text, ...check.getInfo(interaction))
          }
        }
      },
    },
    checks,
    CheckName,
    links,
    prefix,
  }

export default defaultExport
