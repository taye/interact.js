const uglify       = require('uglify-js');
const mkdirp       = require('mkdirp');
const path         = require('path');
const fs           = require('fs');
const bundleHeader = require('./bundle-header');
const replacer     = require('./replacer');

const pwd = process.env.PWD;

const destDir = 'dist';
const filenames = {
  raw:   'interact.js',
  rawMap: 'interact.js.map',
  min: 'interact.min.js',
  minMap: 'interact.min.js.map',
};

module.exports = function bundleProcessor ({ bundleStream, headerFile, minHeaderFile, noMetadata }) {
  mkdirp(destDir);

  let streamCode = '';

  bundleStream.on('data', chunk => streamCode += chunk);
  bundleStream.on('end', function () {
    let raw;

    try {
      raw = bundleHeader(getHeaderOpts(headerFile, filenames.raw, streamCode));
    }
    catch (e) {
      for (const name in filenames) {
        write({
          filename: filenames[name],
          code: streamCode,
          map: { sources: [] },
        });
      }

      return;
    }

    write(raw);

    const minifiedResult = uglify.minify(raw.code, {
      fromString: true,
      inSourceMap: raw.map,
      outSourceMap: `${filenames.min}.map`,
      sourceMapIncludeSources: true,
    });

    const headerOpts = getHeaderOpts(minHeaderFile, filenames.min, minifiedResult.code, JSON.parse(minifiedResult.map));
    const min = bundleHeader(headerOpts);

    write(min);
  });

  function getHeaderOpts (headerFilename, filename, code, map) {
    return {
      filename,
      code,
      map,
      headerFilename,
      replacer: input => replacer(input, { updateMetadata: !noMetadata }),
    };
  }
};

function write ({ filename, code, map }) {
  map.sources = map.sources.map(source => path.relative(pwd, source));
  map.file = filename;

  const codeFilename = path.join(destDir, filename);
  const codeStream = fs.createWriteStream(codeFilename);

  codeStream.end(code);
  fs.createWriteStream(`${codeFilename}.map`).end(JSON.stringify(map));
}
