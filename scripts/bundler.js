const path = require('path')
const { getBabelrc } = require('./utils')

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${path.resolve(__dirname, '..', 'node_modules')}`
require('module').Module._initPaths()

const dir = path.join(__dirname, '..')

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${dir}/node_modules`
require('module')._initPaths()

module.exports = function (options) {
  const browserify = require('browserify')
  const writer = options.writer || require('./bundleProcessor')

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

    debug: options.debug,

    standalone: options.standalone,

    transform: [
      [require('babelify'), {
        babelrc: false,
        sourceType: 'module',
        global: true,
        ...babelrc,
      }],
    ],

    plugin: plugins,

    cache: {},
    packageCache: {},
  }).exclude('jsdom')

  if (options.watch) {
    const doEsnext = require('./esnext')

    b.on('update', ids => {
      ids = ids.filter(id => !/\.js$/.test(id))

      if (!ids.length) { return }

      update(ids)
      doEsnext(ids.filter(id => /\.tsx?/.test(id)).map(id => path.resolve(id)))
        .then(() => console.log('Generated esnext files'))
    })
    b.on('log', msg => console.log(msg))

    doEsnext()
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
