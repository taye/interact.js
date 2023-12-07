/* eslint-disable import/no-extraneous-dependencies */
const { resolve } = require('path')

const babel = require('@rollup/plugin-babel')
const commonjs = require('@rollup/plugin-commonjs')
const nodeResolve = require('@rollup/plugin-node-resolve')
const replace = require('@rollup/plugin-replace')
const terser = require('@rollup/plugin-terser')
const { defineConfig } = require('rollup')

const headers = require('./scripts/headers')
const { extendBabelOptions, getModuleDirectories, isPro } = require('./scripts/utils')

const globals = {
  react: 'React',
  vue: 'Vue',
}
const external = Object.keys(globals)
const INPUT_EXTENSIONS = ['.ts', '.tsx', '.vue']

module.exports = defineConfig(async () => {
  const variations = [
    { env: { NODE_ENV: 'development' }, ext: '.js', minify: isPro },
    { env: { NODE_ENV: 'production' }, ext: '.min.js', minify: true },
  ]

  return variations.map(({ minify, ext, env }) => {
    const babelConfig = extendBabelOptions({
      babelrc: false,
      configFile: false,
      browserslistConfigFile: false,
      targets: { ie: 9 },
      babelHelpers: 'bundled',
      skipPreflightCheck: true,
      extensions: INPUT_EXTENSIONS,
      plugins: [[require.resolve('@babel/plugin-transform-runtime'), { helpers: false, regenerator: true }]],
    })

    return defineConfig({
      input: resolve(__dirname, 'packages', 'interactjs', 'index.ts'),
      external,
      plugins: [
        nodeResolve({
          modulePaths: getModuleDirectories(),
          extensions: INPUT_EXTENSIONS,
        }),
        commonjs({ include: '**/node_modules/{rebound,symbol-tree}/**' }),
        babel(babelConfig),
        replace({
          preventAssignment: true,
          values: Object.entries({
            npm_package_version: process.env.npm_package_version,
            IJS_BUNDLE: '1',
            ...env,
          }).reduce((acc, [key, value]) => {
            acc[`process.env.${key}`] = JSON.stringify(value)
            return acc
          }, {}),
        }),
        minify &&
          terser({
            module: false,
            mangle: true,
            compress: {
              ecma: 5,
              unsafe: true,
              unsafe_Function: true,
              unsafe_arrows: false,
              unsafe_methods: true,
            },
            format: {
              preamble: headers?.min,
            },
          }),
      ],
      context: 'window',
      moduleContext: 'window',
      output: {
        file: resolve(__dirname, 'packages', 'interactjs', 'dist', `interact${ext}`),
        format: 'umd',
        name: 'interact',
        banner: minify ? headers.min : headers.raw,
        minifyInternalExports: true,
        inlineDynamicImports: true,
        sourcemap: true,
        globals,
      },
    })
  })
})
