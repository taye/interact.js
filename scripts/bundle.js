#!/usr/bin/env node
const path = require('path')

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${path.resolve(__dirname, '..', 'node_modules')}`
require('module').Module._initPaths()

const argv = require('yargs')
  .config()
  .pkgConf('_dev')
  .default({
    watch: false,
    debug: true,
    headerFile: require.resolve('./header.js'),
    minHeaderFile: require.resolve('./minHeader.js'),
    name: 'index',
  })
  .boolean('watch')
  .boolean('debug')
  .option('entries', {
    required: true,
    array: 'true',
    coerce: entries => {
      return entries.map(entry => path.resolve(entry))
    },
  })
  .option('destDir', {
    required: true,
    coerce: path.resolve,
  })
  .argv

const dir = path.join(__dirname, '..')

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${dir}/node_modules`
require('module')._initPaths()

const browserify      = require('browserify')
const bundleProcessor = require('./bundleProcessor')

const plugins = (() => {
  if (argv.watch) {
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

let babelrc

try {
  babelrc = require(path.join(process.cwd(), '.babelrc'))
} catch (e) {
  babelrc = require('../.babelrc')
}

const b = browserify(argv.entries, {
  extensions: ['.ts', '.tsx'],

  debug: argv.debug,

  standalone: argv.standalone,

  transform: [
    [require('babelify'), {
      babelrc: false,
      sourceType: 'module',
      global: true,
      ...babelrc,
    }],
    [require('envify'), {
      global: true,
      _: 'purge',
    }],
  ],

  plugin: plugins,

  cache: {},
  packageCache: {},
}).exclude('jsdom')

if (argv.watch) {
  const doEsnext = require('./esnext')

  b.on('update', ids => {
    ids = ids.filter(id => /\.js$/.test(id))

    if (!ids.length) { return }

    update(ids)
    doEsnext(ids.filter(id => /\.tsx?/.test(id)).map(id => path.resolve(id)))
  })
  b.on('log', msg => console.log(msg))

  doEsnext()
}
else {
  process.on('beforeExit', () => {
    console.log(' done.')
  })
}

function update (ids) {
  if (argv.watch) {
    console.log('Bundling...')
  }
  else {
    process.stdout.write('Bundling...')
  }

  if (ids) {
    console.log(ids.reduce((formatted, id) => {
      return `${formatted}\n    ${path.relative(process.cwd(), id)}`
    }, ''))
  }

  bundleProcessor({
    ...argv,
    bundleStream: b.bundle(),
  })
}

update()
