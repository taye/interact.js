// tslint:disable no-empty-interface

export interface Defaults {
  base: BaseDefaults
  perAction: PerActionDefaults
  actions: ActionDefaults
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ActionDefaults {
}

export interface BaseDefaults {
  preventDefault?: 'auto' | 'never' | string
  deltaSource?: 'page' | 'client'
  context?: Window | Document | Element
   [key: string]: any
}

export interface PerActionDefaults {
  enabled?: boolean
  origin?: Interact.Point | string | Element
  listeners?: Interact.Listeners
  allowFrom?: string | Element
  ignoreFrom?: string | Element
}

export type Options = Partial<BaseDefaults> & Partial<PerActionDefaults> & {
  [P in keyof ActionDefaults]?: Partial<ActionDefaults[P]>
}

// export interface Options extends BaseDefaults, PerActionDefaults {}

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
