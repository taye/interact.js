const gulp     = require('gulp');

gulp.task('watch', ['watchify'], function () {
  gulp.watch('./{src,test}/**/*.js', ['lint']);
});
