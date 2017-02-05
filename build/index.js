'use strict';

const watchify = require('watchify');
const errorify = require('errorify');
const bundle = require('./bundle');
const version = process.env.npm_package_version || require('../package.json').version;
const b = bundle.b;

const pwdRegex = new RegExp(`^${process.env.PWD}.`);
const release = process.argv.includes('--release');

bundle.watch = process.argv.includes('--watch');

if (bundle.watch) {
  b.plugin(watchify);
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

  bundle.version = release
    ? version
    : (require('child_process')
      .execSync('echo "@$(git rev-parse --short HEAD)$(git diff-index --quiet HEAD || echo -dirty)"')
      .toString().trim());

  bundle.write(b.bundle());
}

update();
