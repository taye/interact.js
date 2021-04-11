const path = require('path')

const { getModuleDirectories, getBabelConfig, extendBabelOptions, errorExit } = require('./utils')

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${path.resolve(__dirname, '..', 'node_modules')}`
require('module').Module._initPaths()

const dir = path.join(__dirname, '..')

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${dir}/node_modules`
require('module')._initPaths()

module.exports = function (options) {
  const browserify = require('browserify')
  const plugins = process.env.NODE_ENV === 'production' ? [require('browser-pack-flat/plugin')] : []

  const babelConfig = extendBabelOptions(
    {
      babelrc: false,
      configFile: false,
      sourceType: 'module',
      global: true,
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue'],
    },
    getBabelConfig(),
  )

  const b = browserify({
    debug: true,
    bare: true,
    standalone: options.standalone,
    transform: [[require('babelify'), babelConfig]],
    plugin: plugins,
    extensions: ['.ts', '.tsx'],
    paths: getModuleDirectories(),
    ...options.browserify,
  })

  b.add(options.entry)

  b.on('error', errorExit)

  function update (ids) {
    if (ids) {
      console.log(
        ids.reduce((formatted, id) => {
          return `${formatted}\n    ${path.relative(process.cwd(), id)}`
        }, ''),
      )
    }

    let bundleCode = ''

    return new Promise((resolve, reject) => {
      b.bundle()
        .on('data', (chunk) => {
          bundleCode += chunk
        })
        .on('end', () => resolve(bundleCode))
        .on('error', reject)
    })
  }

  return update()
}
