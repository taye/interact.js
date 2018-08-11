#!/usr/bin/env node
const path = require('path');
const argv = require('yargs')
  .config()
  .pkgConf('_dev')
  .default({
    watch: false,
    docs: false,
    metadata: true,
    debug: true,
    headerFile: require.resolve('./header.js'),
    minHeaderFile: require.resolve('./minHeader.js'),
    name: 'index',
  })
  .option('entries', {
    required: true,
    array: 'true',
    coerce: entries => {
      return entries.map(entry => path.resolve(entry));
    },
  })
  .option('destDir', {
    required: true,
    coerce: path.resolve,
  })
  .argv;

const dir = path.join(__dirname, '..');

process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${dir}/node_modules`;
require('module')._initPaths();

const browserify      = require('browserify');
const bundleProcessor = require('./bundleProcessor');

const plugins = (() => {
  if (argv.watch) {
    return [
      require('watchify'),
      require('errorify'),
    ];
  }
  return [
    require('browser-pack-flat/plugin'),
    require('common-shakeify'),
  ];
})();


const b = browserify(argv.entries, {
  debug: argv.debug,

  standalone: argv.standalone,

  transform: [
    [ require('babelify'), {
      babelrc: false,
      sourceType: 'module',
      global: true,
      ...require('../.babelrc'),
    } ],
    [ require('envify'), {
      global: true,
      _: 'purge',
    } ],
  ],

  plugin: plugins,

  cache: {},
  packageCache: {},
});

if (argv.watch) {
  b.on('update', update);
  b.on('log', msg => console.log(msg));
}
else {
  process.on('beforeExit', () => {
    console.log(' done.');
  });
}

function update (ids) {
  if (argv.docs) {
    require('../docs')({
      stdio: ['ignore', 'ignore', 'inherit'],
    });
  }

  if (argv.watch) {
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
    ...argv,
    bundleStream: b.bundle(),
  });
}

update();
