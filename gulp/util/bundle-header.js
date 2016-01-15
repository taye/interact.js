'use strict';

var combineSourceMap = require('combine-source-map');
var through = require('through2');
var fs = require('fs');

module.exports = function (options) {
  var headerOpts = {
    sourceFile: options.headerFile,
    source: options.headerSource || fs.readFileSync(options.headerFile).toString(),
  };

  var headerLines = newlinesIn(headerOpts.source);
  var source = headerOpts.source;

  return through(write, end);

  function write (buf, enc, next) {
    source += buf;
    next();
  }

  function end (done) {
    var combiner = combineSourceMap.create();

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
  var newlines = src.match(/\n/g);

  return newlines ? newlines.length : 0;
}
