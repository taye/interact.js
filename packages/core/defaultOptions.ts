export interface Defaults {
  base: BaseDefaults;
  perAction: PerActionDefaults;
}

export interface BaseDefaults extends SubDefaults {
  preventDefault?: 'auto' | 'never' | string;
  deltaSource?: 'page' | 'client';
}
export interface PerActionDefaults extends SubDefaults {
  enabled?: boolean;
  origin?: Interact.Point | string | Element;
}

export interface SubDefaults {
  [key: string]: any;
}

export interface Options extends BaseDefaults, PerActionDefaults {}

export const defaults: Defaults = {
  base: {
    preventDefault: 'auto',
    deltaSource: 'page',
  },

  perAction: {
    enabled: false,
    origin: { x: 0, y: 0 },
  },
};

export default defaults;
