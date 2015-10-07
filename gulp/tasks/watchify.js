var gulp           = require('gulp');
var browserifyTask = require('./browserify');

gulp.task('watchify', function() {
  // Start browserify task with devMode === true
  return browserifyTask(true);
});
