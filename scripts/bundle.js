#!/usr/bin/env node
const path = require('path')

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${path.resolve(__dirname, '..', 'node_modules')}`
require('module').Module._initPaths()

const options = require('yargs')
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

const bundler = require('./bundler')

if (options.watch) {
  console.log('Bundling...')
}
else {
  process.stdout.write('Bundling...')
  process.on('beforeExit', () => {
    console.log(' done.')
  })
}

bundler(options)
