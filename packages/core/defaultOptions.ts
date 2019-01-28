export interface Defaults {
  base: BaseDefaults
  perAction: PerActionDefaults
}

export interface BaseDefaults extends SubDefaults {}
export interface PerActionDefaults extends SubDefaults {}

export interface SubDefaults {
  [key: string]: any
}

export const defaults: Defaults = {
  base: {
    preventDefault: 'auto',
    deltaSource   : 'page',
  } as BaseDefaults,

  perAction: {
    enabled     : false,
    origin: { x: 0, y: 0 },
  } as PerActionDefaults,
}

export default defaults
