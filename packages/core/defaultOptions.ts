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
}

export interface Options extends BaseDefaults, PerActionDefaults {}
export interface OptionsArg extends BaseDefaults, Interact.OrBoolean<PerActionDefaults> {}

export const defaults: Defaults = {
  base: {
    preventDefault: 'auto',
    deltaSource: 'page',
  },

  perAction: {
    enabled: false,
    origin: { x: 0, y: 0 },
  },

  actions: {} as ActionDefaults,
}

export default defaults
