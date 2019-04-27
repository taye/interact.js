#!/usr/bin/env node
const path = require('path')

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${path.resolve(__dirname, '..', 'node_modules')}`
require('module').Module._initPaths()

const argv = require('yargs')
  .config()
  .pkgConf('_dev')
  .default({
    watch: false,
    docs: false,
    debug: true,
    headerFile: require.resolve('./header.js'),
    minHeaderFile: require.resolve('./minHeader.js'),
    name: 'index',
  })
  .boolean('watch')
  .boolean('docs')
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
  .string('babelrc')
  .argv

const dir = path.join(__dirname, '..')
const extensions = ['.ts', '.js']

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
  babelrc = require(path.resolve(argv.babelrc))
} catch (e) {
  babelrc = require('../.babelrc')
}

const b = browserify(argv.entries, {
  extensions,

  debug: argv.debug,

  standalone: argv.standalone,

  transform: [
    [ require('babelify'), {
      babelrc: false,
      sourceType: 'module',
      global: true,
      extensions,
      ...babelrc,
    } ],
    [ require('envify'), {
      global: true,
      _: 'purge',
    } ],
  ],

  plugin: plugins,

  cache: {},
  packageCache: {},
}).exclude('jsdom')

if (argv.watch) {
  b.on('update', update)
  b.on('log', msg => console.log(msg))
}
else {
  process.on('beforeExit', () => {
    console.log(' done.')
  })
}

function update (ids) {
  if (argv.docs) {
    require('../jsdoc')({
      stdio: ['ignore', 'ignore', 'inherit'],
    })
  }

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
