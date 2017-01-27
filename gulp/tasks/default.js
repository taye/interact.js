const gulp = require('gulp');
const mkdirp = require('mkdirp');
const config = require('../config');

gulp.task('mkdest', function () {
  /* eslint no-octal: "off" */
  mkdirp.sync(config.dest, 0755);
});

gulp.task('build', ['lint', 'mkdest', 'browserify']);

gulp.task('default', ['build']);
