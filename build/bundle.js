'use strict';

const browserify   = require('browserify');
const uglify       = require('uglify-js');
const exorcist     = require('exorcist');
const path         = require('path');
const fs           = require('fs');
const bundleHeader = require('./bundle-header');

const destDir = 'dist';
const fileNames = {
  dev:   'interact.js',
  devMap: 'interact.js.map',
  prod: 'interact.min.js',
  prodMap: 'interact.min.js.map',
};
const dests = Object.entries(fileNames).reduce((result, [ key, filename ]) => {

  result[key] = path.join(destDir, filename);

  return result;
}, {});

const config = {
  debug: true,
  entries: 'index.js',
  standalone: 'interact',

  transform: [[ 'babelify', {} ]],

  cache: {},
  packageCache: {},
};

function write (bundleStream) {
  const outDev = fs.createWriteStream(dests.dev);

  // add header to bundle output and adjust source map
  if (module.exports.headerFile && !module.exports.watch) {
    const headerSource = (fs.readFileSync(module.exports.headerFile).toString())
      .replace(/[{]VERSION[}]/g, module.exports.version);

    bundleStream = bundleStream.pipe(bundleHeader({
      sourceFile: module.exports.headerFile,
      source: headerSource,
    }));
  }

  bundleStream
    .pipe(exorcist(dests.devMap, undefined, '', './'))
    .pipe(outDev);

  if (!module.exports.watch) {
    const outProd = fs.createWriteStream(dests.prod);
    const outProdMap = fs.createWriteStream(dests.prodMap);

    outDev.on('finish', function () {
      const { code, map } = uglify.minify(dests.dev, {
        inSourceMap: `${dests.dev}.map`,
        outSourceMap: `${fileNames.prod}.map`,
      });

      outProd.write(code);
      outProdMap.write(map);
    });
  }
}

module.exports = {
  write,
  fileNames,
  b: browserify(config),
  version: process.env.npm_package_version,
  headerFile: 'src/header.js',
  watch: false,
};
