import * as utils from '@interactjs/utils'
import domObjects from '@interactjs/utils/domObjects'
import defaults from './defaultOptions'
import Eventable from './Eventable'
import InteractableBase from './Interactable'
import InteractableSet from './InteractableSet'
import InteractEvent from './InteractEvent'
import interactions from './interactions'

const {
  win,
  browser,
  raf,
  Signals,
  events,
} = utils

export enum ActionName {
}

export interface Actions {
  names: ActionName[]
  methodDict: { [key: string]: string }
  eventTypes: string[]
}

export function createScope () {
  return new Scope()
}

export type Defaults = typeof defaults

export interface Plugin {
  id?: string
  install (scope: Scope, options?: any): void
  [key: string]: any
}

export class Scope {
  id = `__interact_scope_${Math.floor(Math.random() * 100)}`
  signals = new Signals()
  browser = browser
  events = events
  utils = utils
  defaults: Defaults = utils.clone(defaults) as Defaults
  Eventable = Eventable
  actions: Actions = {
    names: [],
    methodDict: {},
    eventTypes: [],
  }

  InteractEvent = InteractEvent
  Interactable!: typeof InteractableBase
  interactables = new InteractableSet(this)

  // main window
  _win!: Window

  // main document
  document!: Document

  // main window
  window!: Window

  // all documents being listened to
  documents: Array<{ doc: Document, options: any }> = []

  _plugins: Plugin[] = []
  _pluginMap: { [id: string]: Plugin } = {}

  constructor () {
    const scope = this as Scope

    ; (this as { Interactable: typeof InteractableBase }).Interactable = class Interactable extends InteractableBase implements InteractableBase {
      get _defaults () { return scope.defaults }

      set (options: any) {
        super.set(options)

        scope.interactables.signals.fire('set', {
          options,
          interactable: this,
        })

        return this
      }

      unset () {
        super.unset()
        for (let i = scope.interactions.list.length - 1; i >= 0; i--) {
          const interaction = scope.interactions.list[i]

          if (interaction.interactable === this) {
            interaction.stop()
            scope.interactions.signals.fire('destroy', { interaction })
            interaction.destroy()

            if (scope.interactions.list.length > 2) {
              scope.interactions.list.splice(i, 1)
            }
          }
        }

        scope.interactables.signals.fire('unset', { interactable: this })
      }
    }
  }

  onWindowUnload = (event: BeforeUnloadEvent) => this.removeDocument(event.target as Document)

  init (window: Window) {
    return initScope(this, window)
  }

  pluginIsInstalled (plugin: Plugin) {
    return this._pluginMap[plugin.id] || this._plugins.indexOf(plugin) !== -1
  }

  usePlugin (plugin: Plugin, options?: { [key: string]: any }) {
    if (this.pluginIsInstalled(plugin)) {
      return this
    }

    if (plugin.id) { this._pluginMap[plugin.id] = plugin }

    plugin.install(this, options)
    this._plugins.push(plugin)

    return this
  }

  addDocument (doc: Document, options?: any): void | false {
    // do nothing if document is already known
    if (this.getDocIndex(doc) !== -1) { return false }

    const window = win.getWindow(doc)

    options = options ? utils.extend({}, options) : {}

    this.documents.push({ doc, options })
    events.documents.push(doc)

    // don't add an unload event for the main document
    // so that the page may be cached in browser history
    if (doc !== this.document) {
      events.add(window, 'unload', this.onWindowUnload)
    }

    this.signals.fire('add-document', { doc, window, scope: this, options })
  }

  removeDocument (doc: Document) {
    const index = this.getDocIndex(doc)

    const window = win.getWindow(doc)
    const options = this.documents[index].options

    events.remove(window, 'unload', this.onWindowUnload)

    this.documents.splice(index, 1)
    events.documents.splice(index, 1)

    this.signals.fire('remove-document', { doc, window, scope: this, options })
  }

  getDocIndex (doc: Document) {
    for (let i = 0; i < this.documents.length; i++) {
      if (this.documents[i].doc === doc) {
        return i
      }
    }

    return -1
  }

  getDocOptions (doc: Document) {
    const docIndex = this.getDocIndex(doc)

    return docIndex === -1 ? null : this.documents[docIndex].options
  }

  now () {
    return ((this.window as any).Date as typeof Date || Date).now()
  }
}

export function initScope (scope: Scope, window: Window) {
  win.init(window)
  domObjects.init(window)
  browser.init(window)
  raf.init(window)
  events.init(window)

  scope.usePlugin(interactions)
  scope.document = window.document
  scope.window = window

  return scope
}
