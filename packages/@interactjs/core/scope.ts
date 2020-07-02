import * as Interact from '@interactjs/types/index'
import browser from '@interactjs/utils/browser'
import clone from '@interactjs/utils/clone'
import domObjects from '@interactjs/utils/domObjects'
import extend from '@interactjs/utils/extend'
import raf from '@interactjs/utils/raf'
import win from '@interactjs/utils/window'

import { Eventable } from './Eventable'
import { InteractEvent, PhaseMap } from './InteractEvent'
import { Interactable as InteractableBase } from './Interactable'
import { InteractableSet } from './InteractableSet'
import { defaults } from './defaultOptions'
import events from './events'
import { createInteractStatic } from './interactStatic'
import interactions from './interactions'

export interface SignalArgs {
  'scope:add-document': DocSignalArg
  'scope:remove-document': DocSignalArg
  'interactable:unset': { interactable: InteractableBase }
  'interactable:set': { interactable: InteractableBase, options: Interact.OptionsArg }
  'interactions:destroy': { interaction: Interact.Interaction }
}

export type ListenerName = keyof SignalArgs

export type ListenerMap = {
  [P in ListenerName]?: (arg: SignalArgs[P], scope: Scope, signalName: P) => void | boolean
}

interface DocSignalArg {
  doc: Document
  window: Window
  scope: Scope
  options?: { [index: string]: any }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ActionMap { // tslint:disable-line no-empty-interface
}

export type ActionName = keyof ActionMap

export interface Actions {
  map: ActionMap
  phases: PhaseMap
  methodDict: { [P in ActionName]?: string }
  phaselessTypes: { [type: string]: true }
}

/**
 * plugin typedef
 * @typedef Plugin
 */
export interface Plugin {
  [key: string]: any
  id?: string
  listeners?: ListenerMap
  before?: string[]
  install? (scope: Scope, options?: any): void
}

export class Scope {
  id = `__interact_scope_${Math.floor(Math.random() * 100)}`
  isInitialized = false
  listenerMaps: Array<{
    map: ListenerMap
    id: string
  }> = []

  browser = browser
  defaults = clone(defaults) as typeof defaults
  Eventable = Eventable
  actions: Actions = {
    map: {},
    phases: {
      start: true,
      move: true,
      end: true,
    },
    methodDict: {},
    phaselessTypes: {},
  }

  interactStatic = createInteractStatic(this)
  InteractEvent = InteractEvent
  Interactable: typeof InteractableBase
  interactables = new InteractableSet(this)

  // main window
  _win!: Window

  // main document
  document!: Document

  // main window
  window!: Window

  // all documents being listened to
  documents: Array<{ doc: Document, options: any }> = []

  _plugins: {
    list: Plugin[]
    map: { [id: string]: Plugin }
  } = {
    list: [],
    map: {},
  }

  constructor () {
    const scope = this

    this.Interactable = class extends InteractableBase {
      get _defaults () { return scope.defaults }

      set <T extends InteractableBase> (this: T, options: Interact.OptionsArg) {
        super.set(options)

        scope.fire('interactable:set', {
          options,
          interactable: this,
        })

        return this
      }

      unset (this: InteractableBase) {
        super.unset()
        scope.interactables.list.splice(scope.interactables.list.indexOf(this), 1)

        scope.fire('interactable:unset', { interactable: this })
      }
    }
  }

  addListeners (map: ListenerMap, id?: string) {
    this.listenerMaps.push({ id, map })
  }

  fire<T extends ListenerName> (name: T, arg: SignalArgs[T]): void | false {
    for (const { map: { [name]: listener } } of this.listenerMaps) {
      if (!!listener && listener(arg as any, this, name as never) === false) {
        return false
      }
    }
  }

  onWindowUnload = (event: BeforeUnloadEvent) => this.removeDocument(event.target as Document)

  init (window: Window) {
    return this.isInitialized
      ? this
      : initScope(this, window)
  }

  pluginIsInstalled (plugin: Plugin) {
    return this._plugins.map[plugin.id] || this._plugins.list.indexOf(plugin) !== -1
  }

  usePlugin (plugin: Plugin, options?: { [key: string]: any }) {
    if (!this.isInitialized) {
      return this
    }

    if (this.pluginIsInstalled(plugin)) {
      return this
    }

    if (plugin.id) { this._plugins.map[plugin.id] = plugin }
    this._plugins.list.push(plugin)

    if (plugin.install) {
      plugin.install(this, options)
    }

    if (plugin.listeners && plugin.before) {
      let index = 0
      const len = this.listenerMaps.length
      const before = plugin.before.reduce((acc, id) => {
        acc[id] = true
        acc[pluginIdRoot(id)] = true
        return acc
      }, {})

      for (; index < len; index++) {
        const otherId = this.listenerMaps[index].id

        if (before[otherId] || before[pluginIdRoot(otherId)]) { break }
      }

      this.listenerMaps.splice(index, 0, { id: plugin.id, map: plugin.listeners })
    }
    else if (plugin.listeners) {
      this.listenerMaps.push({ id: plugin.id, map: plugin.listeners })
    }

    return this
  }

  addDocument (doc: Document, options?: any): void | false {
    // do nothing if document is already known
    if (this.getDocIndex(doc) !== -1) { return false }

    const window = win.getWindow(doc)

    options = options ? extend({}, options) : {}

    this.documents.push({ doc, options })
    this.events.documents.push(doc)

    // don't add an unload event for the main document
    // so that the page may be cached in browser history
    if (doc !== this.document) {
      this.events.add(window, 'unload', this.onWindowUnload)
    }

    this.fire('scope:add-document', { doc, window, scope: this, options })
  }

  removeDocument (doc: Document) {
    const index = this.getDocIndex(doc)

    const window = win.getWindow(doc)
    const options = this.documents[index].options

    this.events.remove(window, 'unload', this.onWindowUnload)

    this.documents.splice(index, 1)
    this.events.documents.splice(index, 1)

    this.fire('scope:remove-document', { doc, window, scope: this, options })
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
  scope.isInitialized = true
  win.init(window)
  domObjects.init(window)
  browser.init(window)
  raf.init(window)

  scope.window = window
  scope.document = window.document

  scope.usePlugin(interactions)
  scope.usePlugin(events)

  return scope
}

function pluginIdRoot (id: string) {
  return id && id.replace(/\/.*$/, '')
}
