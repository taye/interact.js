var gulp = require('gulp');

gulp.task('build', ['lint', 'browserify']);
gulp.task('default', ['build']);
