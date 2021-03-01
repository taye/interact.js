import type { Point, Listeners, OrBoolean, Element } from '@interactjs/types/index'

export interface Defaults {
  base: BaseDefaults
  perAction: PerActionDefaults
  actions: ActionDefaults
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ActionDefaults {}

export interface BaseDefaults {
  preventDefault?: 'auto' | 'never' | string
  deltaSource?: 'page' | 'client'
  context?: Node
}

export interface PerActionDefaults {
  enabled?: boolean
  origin?: Point | string | Element
  listeners?: Listeners
  allowFrom?: string | Element
  ignoreFrom?: string | Element
}

export type Options = Partial<BaseDefaults> &
Partial<PerActionDefaults> &
{
  [P in keyof ActionDefaults]?: Partial<ActionDefaults[P]>
}

// export interface Options extends BaseDefaults, PerActionDefaults {}

export interface OptionsArg extends BaseDefaults, OrBoolean<Partial<ActionDefaults>> {}

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
