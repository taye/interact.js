/*
 * browserify task
 * ---------------
 * Bundle javascripty things with browserify
 *
 * This task is set up to generate multiple separate bundles, from
 * different sources, and to use Watchify when run from the default task.
 *
 * See browserify.bundleConfigs in gulp/config.js
 */

'use strict';

var browserify   = require('browserify');
var watchify     = require('watchify');
var gulp         = require('gulp');
var gulpUtil     = require('gulp-util');
var rename       = require('gulp-rename');
var uglify       = require('gulp-uglify');
var sourcemaps   = require('gulp-sourcemaps');
var exorcist     = require('exorcist');
var mergeStream  = require('merge-stream');
var source       = require('vinyl-source-stream');
var buffer       = require('vinyl-buffer');
var path         = require('path');
var fs           = require('fs');
var _            = require('lodash');
var bundleLogger = require('../util/bundleLogger');
var bundleHeader = require('../util/bundle-header');
var handleErrors = require('../util/handleErrors');
var config       = require('../config').browserify;

function browserifyTask (devMode) {

  // Start bundling with Browserify for each bundleConfig specified
  return mergeStream.apply(gulp, _.map(config.bundleConfigs, browserifyThis));

  function browserifyThis (bundleConfig) {
    // caches for watchify
    _.defaults(bundleConfig, {
      cache: {},
      packageCache: {},
    });

    var b = browserify(bundleConfig);

    if (devMode) {
      // Enable watchify plugin
      b.plugin(watchify);
      // Rebundle on update
      b.on('update', bundle);

      bundleLogger.watch(bundleConfig.outputName);
    }

    return bundle();

    function bundle () {
      // Log when bundling starts
      bundleLogger.start(bundleConfig.outputName);

      var bundleStream = b.bundle().on('error', handleErrors);

      // add header to bundle output and adjust source map
      if (bundleConfig.headerFile) {
        var headerFile = bundleConfig.headerFile;
        var headerSource = (bundleConfig.headerSource || fs.readFileSync(headerFile).toString())
                            .replace(/[{]VERSION[}]/g, devMode ? '[dev build]' : process.env.npm_package_version);

        bundleStream = bundleStream.pipe(bundleHeader({
          headerFile: headerFile,
          headerSource: headerSource,
        }));
      }

      // source map file name for exorcist output
      var outputMapName = path.join(bundleConfig.dest, bundleConfig.outputName + '.map');

      bundleStream = bundleStream
        // extract source map
        .pipe(exorcist(outputMapName, undefined, '', './'))
        // Use vinyl-source-stream to make the stream gulp compatible.
        .pipe(source(bundleConfig.outputName))
        // output unminified bundle
        .pipe(gulp.dest(bundleConfig.dest))
        .pipe(buffer())
        // init source-map and read extracted source map file
        .pipe(sourcemaps.init({loadMaps: true}))
          // minify
          .pipe(uglify())
          .on('error', gulpUtil.log)
          // use minified file name
          .pipe(rename(bundleConfig.outputNameMin))
          // write source map for minified file
          .pipe(sourcemaps.write('./'))
          // output minified file
          .pipe(gulp.dest(bundleConfig.dest));
        /*
        .pipe(browserSync.reload({
          stream: true,
        }));
       */

      return bundleStream;
    }
  }
}

gulp.task('browserify', function () {
  return browserifyTask();
});

// Export the task so the watch task can call it with the 'devMode' option
module.exports = browserifyTask;
