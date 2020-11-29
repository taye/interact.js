module.exports = {
  presets: [
    process.env.NODE_ENV !== 'test' && [require('@babel/preset-env').default, { loose: true }],
    [require('@babel/preset-typescript').default, {
      allExtensions: true,
      isTSX: true,
    }],
  ].filter(Boolean),

  plugins:
    process.env.NODE_ENV === 'production'
      ? [
        require('./scripts/babelTransformForOfArray'),
        require('@babel/plugin-proposal-class-properties').default,
        [require('@babel/plugin-transform-modules-commonjs').default, {
          noInterop: true,
        }],
        require('@babel/plugin-proposal-optional-catch-binding').default,
        [require('@babel/plugin-proposal-optional-chaining').default, { loose: true }],
        [require('@babel/plugin-transform-runtime').default, {
          helpers: false,
          regenerator: false,
        }],
      ]
      : [
        require('@babel/plugin-transform-modules-commonjs').default,
        require('@babel/plugin-proposal-class-properties').default,
      ],

  ignore: [/\/node_modules\/(?!@interactjs\/)/],
}
