const path = require('path')
const { getBabelrc } = require('./utils')

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${path.resolve(__dirname, '..', 'node_modules')}`
require('module').Module._initPaths()

const dir = path.join(__dirname, '..')

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${dir}/node_modules`
require('module')._initPaths()

module.exports = function (options) {
  const browserify = require('browserify')
  const writer = options.writer || require('./bundleWriter')

  const plugins = (() => {
    if (options.watch) {
      return [
        require('watchify'),
        require('errorify'),
      ]
    }

    return process.env.NODE_ENV === 'production'
      ? [
        require('browser-pack-flat/plugin'),
        require('common-shakeify'),
      ]
      : []
  })()

  const babelrc = getBabelrc()

  const b = browserify(options.entries, {
    extensions: ['.ts', '.tsx'],
    debug: true,

    standalone: options.standalone,

    transform: [
      [require('babelify'), {
        babelrc: false,
        sourceType: 'module',
        global: true,
        ...babelrc,
        extensions: [
          '.ts',
          '.tsx',
          '.js',
          '.jsx',
        ],
      }],
    ],

    plugin: plugins,

    cache: {},
    packageCache: {},
  }).exclude('jsdom')

  if (options.watch) {
    const generateEsnext = require('./esnext')

    b.on('update', ids => {
      ids = ids.filter(id => !/\.js$/.test(id))

      if (!ids.length) { return }

      console.log(ids)
      update(ids)
      generateEsnext({
        sources: ids.filter(id => /\.tsx?/.test(id)).map(id => path.resolve(id)),
      })
    })
    b.on('log', msg => console.log(msg))

    generateEsnext()
  }
  else {
  }

  function update (ids) {
    if (ids) {
      console.log(ids.reduce((formatted, id) => {
        return `${formatted}\n    ${path.relative(process.cwd(), id)}`
      }, ''))
    }

    writer({
      ...options,
      bundleStream: b.bundle(),
    })
  }

  update()
}
