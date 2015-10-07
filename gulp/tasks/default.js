var gulp = require('gulp');
var mkdirp = require('mkdirp');
var config = require('../config');

gulp.task('mkdest', function () {
  mkdirp.sync(config.dest, 0755);
});

gulp.task('build', ['lint', 'mkdest', 'browserify']);

gulp.task('default', ['build']);
