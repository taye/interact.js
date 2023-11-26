const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  presets: [
    [require.resolve('@babel/preset-env'), { exclude: ['transform-regenerator'] }],
    [
      require.resolve('@babel/preset-typescript'),
      { isTsx: false, onlyRemoveTypeImports: true, allExtensions: true, allowDeclareFields: true },
    ],
  ],

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
    isProd && require.resolve('@babel/plugin-transform-optional-catch-binding'),
    isProd && [require.resolve('@babel/plugin-transform-optional-chaining'), { loose: true }],
    isProd && [require.resolve('@babel/plugin-transform-nullish-coalescing-operator'), { loose: true }],
  ].filter(Boolean),
}
