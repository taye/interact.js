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

const browserify   = require('browserify');
const watchify     = require('watchify');
const gulp         = require('gulp');
const gulpUtil     = require('gulp-util');
const rename       = require('gulp-rename');
const uglify       = require('gulp-uglify');
const sourcemaps   = require('gulp-sourcemaps');
const exorcist     = require('exorcist');
const mergeStream  = require('merge-stream');
const source       = require('vinyl-source-stream');
const buffer       = require('vinyl-buffer');
const path         = require('path');
const fs           = require('fs');
const _            = require('lodash');
const bundleLogger = require('../util/bundleLogger');
const bundleHeader = require('../util/bundle-header');
const handleErrors = require('../util/handleErrors');
const config       = require('../config').browserify;

function browserifyTask (devMode) {

  // Start bundling with Browserify for each bundleConfig specified
  return mergeStream.apply(gulp, _.map(config.bundleConfigs, browserifyThis));

  function browserifyThis (bundleConfig) {
    // caches for watchify
    _.defaults(bundleConfig, {
      cache: {},
      packageCache: {},
    });

    const b = browserify(bundleConfig);

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

      let bundleStream = b.bundle().on('error', handleErrors);

      // add header to bundle output and adjust source map
      if (bundleConfig.headerFile) {
        const headerFile = bundleConfig.headerFile;
        const headerSource = (bundleConfig.headerSource || fs.readFileSync(headerFile).toString())
                            .replace(/[{]VERSION[}]/g, devMode ? '[dev build]' : process.env.npm_package_version);

        bundleStream = bundleStream.pipe(bundleHeader({
          headerFile: headerFile,
          headerSource: headerSource,
        }));
      }

      // source map file name for exorcist output
      const outputMapName = path.join(bundleConfig.dest, bundleConfig.outputName + '.map');

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
