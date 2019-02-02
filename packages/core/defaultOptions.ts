export interface Defaults {
  base: BaseDefaults
  perAction: PerActionDefaults
  actions: ActionDefaults
}

export interface ActionDefaults {
  [key: string]: Options
}

export interface BaseDefaults {
  preventDefault?: 'auto' | 'never' | string
  deltaSource?: 'page' | 'client'
  [key: string]: any
}

export interface PerActionDefaults {
  enabled?: boolean
  origin?: Interact.Point | string | Element
  listeners?: Interact.Listeners
  [key: string]: any
}

export interface Options extends BaseDefaults, PerActionDefaults, ActionDefaults {}

export const defaults: Defaults = {
  base: {
    preventDefault: 'auto',
    deltaSource: 'page',
  },

  perAction: {
    enabled: false,
    origin: { x: 0, y: 0 },
  },

  actions: {},
}

export default defaults
