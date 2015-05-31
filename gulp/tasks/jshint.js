var gulp = require('gulp');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var config = require('../config').jshint;

var jshintTask = function() {

    gulp.src(config.src)
        .pipe(jshint(config.settings))
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'));

};

gulp.task('jshint', jshintTask);

module.exports = jshintTask;
