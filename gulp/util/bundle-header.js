'use strict';

const combineSourceMap = require('combine-source-map');
const through = require('through2');
const fs = require('fs');

module.exports = function (options) {
  const headerOpts = {
    sourceFile: options.headerFile,
    source: options.headerSource || fs.readFileSync(options.headerFile).toString(),
  };

  const headerLines = newlinesIn(headerOpts.source);
  let source = headerOpts.source;

  return through(write, end);

  function write (buf, enc, next) {
    source += buf;
    next();
  }

  function end (done) {
    const combiner = combineSourceMap.create();

    combiner.addFile(headerOpts, { line: 1 });
    combiner.addFile({
      sourceFile: '',
      source: source,
    }, { line: headerLines });

    this.push(combineSourceMap.removeComments(source) + combiner.comment() + '\n');

    done();
  }
};

function newlinesIn (src) {
  if (!src) { return 0; }
  const newlines = src.match(/\n/g);

  return newlines ? newlines.length : 0;
}
