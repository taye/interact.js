#!/usr/bin/env node
const path = require('path');

const dir = path.join(__dirname, '..');
process.chdir(dir);
process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${dir}/node_modules`;
require('module')._initPaths();

const browserify      = require('browserify');
const bundleProcessor = require('./bundleProcessor');

const config = {
  debug: true,
  entries: '../../index.js',
  standalone: 'interact',

  transform: [[ 'babelify', {
    babelrc: false,
    sourceType: 'module',
    global: true,
    ...require('../.babelrc'),
  } ]],

  cache: {},
  packageCache: {},
};

const b = browserify(config);

const noMetadata = process.argv.includes('--no-metadata');
const watch      = process.argv.includes('--watch');
const docs       = process.argv.includes('--docs')? require('./docs') : null;

if (watch) {
  b.plugin(require('watchify'));
  b.plugin(require('errorify'));

  b.on('update', update);
  b.on('log', msg => console.log(msg));
}
else {
  process.on('beforeExit', () => {
    console.log(' done.');
  });
}

function update (ids) {
  if (docs) {
    docs({
      stdio: ['ignore', 'ignore', 'inherit'],
    });
  }

  if (watch) {
    console.log('Bundling...');
  }
  else {
    process.stdout.write('Bundling...');
  }

  if (ids) {
    console.log(ids.reduce((formatted, id) => {
      return `${formatted}\n    ${path.relative(process.cwd(), id)}`;
    }, ''));
  }

  bundleProcessor({
    noMetadata,
    bundleStream: b.bundle(),
    headerFile: require.resolve('./header.js'),
    minHeaderFile: require.resolve('./minHeader.js'),
  });
}

update();
