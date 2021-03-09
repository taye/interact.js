module.exports = {
  presets: [
    process.env.NODE_ENV !== 'test' && [require.resolve('@babel/preset-env'), { loose: true }],
    [
      require('@babel/preset-typescript').default,
      {
        allExtensions: true,
        isTSX: true,
      },
    ],
  ].filter(Boolean),

  plugins:
    process.env.NODE_ENV === 'production'
      ? [
        require.resolve('./scripts/babelTransformForOfArray'),
        require.resolve('@babel/plugin-proposal-class-properties'),
        [
          require.resolve('@babel/plugin-transform-modules-commonjs'),
          {
            noInterop: true,
          },
        ],
        require.resolve('@babel/plugin-proposal-optional-catch-binding'),
        [require.resolve('@babel/plugin-proposal-optional-chaining'), { loose: true }],
        [
          require.resolve('@babel/plugin-transform-runtime'),
          {
            helpers: false,
            regenerator: false,
          },
        ],
      ]
      : [
        require.resolve('@babel/plugin-transform-modules-commonjs'),
        require.resolve('@babel/plugin-proposal-class-properties'),
      ],

  ignore: [
    (filename) => {
      if (!/node_modules/.test(filename)) {
        return false
      }

      if (/@interactjs/.test(filename) || /symbol-tree|rebound/.test(filename)) {
        return false
      }

      return true
    },
  ],
}
