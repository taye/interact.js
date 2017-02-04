'use strict';

const combineSourceMap = require('combine-source-map');
const through = require('through2');
const fs = require('fs');

module.exports = function (options) {
  options.source = options.source || fs.readFileSync(options.sourceFile).toString();

  const headerLines = newlinesIn(options.source);
  let source = options.source;

  return through(write, end);

  function write (buf, enc, next) {
    source += buf;
    next();
  }

  function end (done) {
    const combiner = combineSourceMap.create();

    combiner.addFile(options, { line: 1 });
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
