const path = require('path')

const { getBabelrc } = require('./utils')

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${path.resolve(__dirname, '..', 'node_modules')}`
require('module').Module._initPaths()

const dir = path.join(__dirname, '..')

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${dir}/node_modules`
require('module')._initPaths()

module.exports = function (options) {
  const browserify = require('browserify')
  const plugins = (options.watch)
    ? [
      require('watchify'),
      require('errorify'),
    ]
    : process.env.NODE_ENV === 'production'
      ? [
        require('browser-pack-flat/plugin'),
      ]
      : []

  const babelrc = getBabelrc()

  const b = browserify(options.entry, {
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

    cache: options.watch ? {} : null,
    packageCache: {},
  }).exclude('jsdom')

  if (options.watch) {
    b.on('update', ids => {
      ids = ids.filter(id => !/\.js$/.test(id))

      if (!ids.length) { return }

      console.log(ids)
      update(ids)
    })
    b.on('log', msg => console.log(msg))
  }

  function update (ids) {
    if (ids) {
      console.log(ids.reduce((formatted, id) => {
        return `${formatted}\n    ${path.relative(process.cwd(), id)}`
      }, ''))
    }

    let bundleCode = ''

    return new Promise((resolve, reject) => {
      b.bundle()
        .on('data', chunk => { bundleCode += chunk })
        .on('end', () => resolve(bundleCode))
        .on('error', reject)
    })
  }

  return update()
}
