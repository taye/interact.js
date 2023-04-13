const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  presets: [
    [require.resolve('@babel/preset-env'), { exclude: ['transform-regenerator'] }],
    [
      require.resolve('@babel/preset-typescript'),
      { isTSX: false, onlyRemoveTypeImports: true, allExtensions: true, allowDeclareFields: true },
    ],
  ].filter(Boolean),

  plugins: [
    require.resolve('./scripts/babel/vue-sfc'),
    [
      require.resolve('@babel/plugin-transform-runtime'),
      {
        helpers: false,
        regenerator: false,
      },
    ],
    isProd && require.resolve('./scripts/babel/for-of-array'),
    isProd && require.resolve('@babel/plugin-proposal-optional-catch-binding'),
    isProd && [require.resolve('@babel/plugin-proposal-optional-chaining'), { loose: true }],
    [require.resolve('@babel/plugin-transform-modules-commonjs'), { noInterop: isProd }],
  ].filter(Boolean),
}
