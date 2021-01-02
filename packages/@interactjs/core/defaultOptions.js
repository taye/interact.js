// eslint-disable-next-line @typescript-eslint/no-empty-interface
// export interface Options extends BaseDefaults, PerActionDefaults {}
export const defaults = {
  base: {
    preventDefault: 'auto',
    deltaSource: 'page'
  },
  perAction: {
    enabled: false,
    origin: {
      x: 0,
      y: 0
    }
  },
  actions: {}
};
//# sourceMappingURL=defaultOptions.js.map