const path = require('path')

const babel = require('@rollup/plugin-babel')
const nodeResolve = require('@rollup/plugin-node-resolve')
const replace = require('@rollup/plugin-replace')
const terser = require('@rollup/plugin-terser')
const { rollup, defineConfig } = require('rollup')
const cjs = require('rollup-plugin-cjs-es')

const { getModuleDirectories, getBabelConfig, extendBabelOptions, errorExit } = require('./utils')

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${path.resolve(__dirname, '..', 'node_modules')}`
require('module').Module._initPaths()

const dir = path.join(__dirname, '..')

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${dir}/node_modules`
require('module')._initPaths()

const createRollupConfigs = async ({
  entry,
  destDir,
  name,
  headers,
  format = 'umd',
  ext: ext_ = '.js',
  minOnly = false,
}) => {
  const variations = minOnly
    ? [{ minify: true, env: { NODE_ENV: 'production' }, ext: ext_ }]
    : [
        { minify: false, env: { NODE_ENV: 'development' }, ext: ext_ },
        { minify: true, env: { NODE_ENV: 'production' }, ext: `.min${ext_}` },
      ]

  const globals = {
    react: 'React',
    vue: 'Vue',
  }
  const external = Object.keys(globals)

  return variations.map(({ minify, ext, env }) => {
    const babelConfig = extendBabelOptions(
      {
        babelrc: false,
        configFile: false,
        babelHelpers: 'bundled',
        skipPreflightCheck: true,
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue'],
        plugins: [require.resolve('@babel/plugin-transform-logical-assignment-operators')].filter(Boolean),
      },
      getBabelConfig(),
    )

    return defineConfig({
      input: entry,
      external,
      plugins: [
        nodeResolve({
          modulePaths: getModuleDirectories(),
          extensions: ['.mjs', '.js', '.json', '.node', '.ts', '.tsx', '.jsx', '.vue'],
        }),
        cjs({
          include: '**/node_modules/{rebound,symbol-tree}/**',
          nested: true,
        }),
        babel(babelConfig),
        replace({
          preventAssignment: true,
          values: Object.entries({
            npm_package_version: process.env.npm_package_version,
            IJS_BUNDLE: 'true',
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
        file: path.resolve(destDir, `${name}${ext}`),
        format,
        name,
        banner: minify ? undefined : headers?.raw,
        minifyInternalExports: true,
        inlineDynamicImports: true,
        sourcemap: true,
        globals,
      },
    })
  })
}

module.exports = async function (options) {
  try {
    const rollupConfigs = await createRollupConfigs(options)
    await Promise.all(
      rollupConfigs.map(async (config) => {
        const bundle = await rollup(config)
        return bundle.write(config.output)
      }),
    )
  } catch (error) {
    errorExit(error)
  }
}
