module.exports = {
  presets: [
    ...process.env.NODE_ENV === 'test'
      ? []
      : [require('@babel/preset-env').default],
    require('@babel/preset-typescript').default,
  ],

  plugins:
    process.env.NODE_ENV !== 'production'
      ? [
        require('./babel-transform-for-of-array'),
        require('@babel/plugin-proposal-class-properties').default,
        require('@babel/plugin-transform-modules-commonjs').default,
      ]
      : [
        require('./babel-transform-for-of-array'),
        [require('@babel/plugin-transform-runtime').default, {
          helpers: false,
          regenerator: false,
        }],
        require('@babel/plugin-proposal-class-properties').default,
      ],

  ignore: [/\/node_modules\/(?!@interactjs\/)/],

  extensions: [
    '.ts',
    '.js',
  ]
}
