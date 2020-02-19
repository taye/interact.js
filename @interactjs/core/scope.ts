import domObjects from '@interactjs/utils/domObjects'
import * as utils from '@interactjs/utils/index'
import defaults from './defaultOptions'
import Eventable from './Eventable'
import InteractableBase from './Interactable'
import InteractableSet from './InteractableSet'
import InteractEvent, { PhaseMap } from './InteractEvent'
import interactions from './interactions'

export interface SignalArgs {
  'scope:add-document': DocSignalArg
  'scope:remove-document': DocSignalArg
  'interactable:unset': { interactable: InteractableBase }
  'interactable:set': { interactable: InteractableBase, options: Interact.Options }
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

const {
  win,
  browser,
  raf,
  events,
} = utils

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

export function createScope () {
  return new Scope()
}

export type Defaults = typeof defaults

export interface Plugin {
  [key: string]: any
  id?: string
  listeners?: ListenerMap
  before?: string[]
  install? (scope: Scope, options?: any): void
}

export class Scope {
  id = `__interact_scope_${Math.floor(Math.random() * 100)}`
  listenerMaps: Array<{
    map: ListenerMap
    id: string
  }> = []

  browser = browser
  events = events
  utils = utils
  defaults: Defaults = utils.clone(defaults) as Defaults
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

  _plugins: {
    list: Plugin[]
    map: { [id: string]: Plugin }
  } = {
    list: [],
    map: {},
  }

  constructor () {
    const scope = this as Scope

    ;(this as { Interactable: typeof InteractableBase }).Interactable = class Interactable extends InteractableBase implements InteractableBase {
      get _defaults () { return scope.defaults }

      set (options: Interact.Options) {
        super.set(options)

        scope.fire('interactable:set', {
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
            scope.fire('interactions:destroy', { interaction })
            interaction.destroy()

            if (scope.interactions.list.length > 2) {
              scope.interactions.list.splice(i, 1)
            }
          }
        }

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
    return initScope(this, window)
  }

  pluginIsInstalled (plugin: Plugin) {
    return this._plugins.map[plugin.id] || this._plugins.list.indexOf(plugin) !== -1
  }

  usePlugin (plugin: Plugin, options?: { [key: string]: any }) {
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
        return acc
      }, {})

      for (; index < len; index++) {
        const otherId = this.listenerMaps[index].id

        if (before[otherId]) { break }
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

    options = options ? utils.extend({}, options) : {}

    this.documents.push({ doc, options })
    events.documents.push(doc)

    // don't add an unload event for the main document
    // so that the page may be cached in browser history
    if (doc !== this.document) {
      events.add(window, 'unload', this.onWindowUnload)
    }

    this.fire('scope:add-document', { doc, window, scope: this, options })
  }

  removeDocument (doc: Document) {
    const index = this.getDocIndex(doc)

    const window = win.getWindow(doc)
    const options = this.documents[index].options

    events.remove(window, 'unload', this.onWindowUnload)

    this.documents.splice(index, 1)
    events.documents.splice(index, 1)

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

export function isNonNativeEvent (type: string, actions: Actions) {
  if (actions.phaselessTypes[type]) { return true }

  for (const name in actions.map) {
    if (type.indexOf(name) === 0 && type.substr(name.length) in actions.phases) {
      return true
    }
  }

  return false
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
