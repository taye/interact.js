const browserify   = require('browserify');
const errorify = require('errorify');
const bundleProcessor = require('./bundleProcessor');
const getVersion = require('./getVersion');

const config = {
  debug: true,
  entries: 'index.js',
  standalone: 'interact',

  transform: [[ 'babelify', {} ]],

  cache: {},
  packageCache: {},
};

const b = browserify(config);

const pwdRegex = new RegExp(`^${process.env.PWD}.`);
const release = process.argv.includes('--release');
const watch = process.argv.includes('--watch');

if (watch) {
  b.plugin(require('watchify'));
  b.plugin(errorify);

  b.on('update', update);
  b.on('log', msg => console.log(msg));
}

function update (ids) {
  if (ids) {
    console.log(ids.reduce((formatted, id) => {
      return `${formatted}\n    ${id.replace(pwdRegex, '')}`;
    }, ''));
  }
  else {
    console.log('Bundling...');
  }

  const version = release
    ? getVersion()
    : (require('child_process')
      .execSync('echo "@$(git rev-parse --short HEAD)$(git diff-index --quiet HEAD || echo -dirty)"')
      .toString().trim());

  bundleProcessor({
    bundleStream: b.bundle(),
    headerFile: 'src/header.js',
    minHeaderFile: 'src/minHeader.js',
    version,
  });
}

update();
