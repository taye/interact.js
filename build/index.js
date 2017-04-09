const browserify      = require('browserify');
const bundleProcessor = require('./bundleProcessor');

const config = {
  debug: true,
  entries: 'index.js',
  standalone: 'interact',

  transform: [[ 'babelify', { compact: false } ]],

  cache: {},
  packageCache: {},
};

const b = browserify(config);

const pwdRegex   = new RegExp(`^${process.env.PWD}.`);
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
      return `${formatted}\n    ${id.replace(pwdRegex, '')}`;
    }, ''));
  }

  bundleProcessor({
    noMetadata,
    bundleStream: b.bundle(),
    headerFile: 'src/header.js',
    minHeaderFile: 'src/minHeader.js',
  });
}

update();
