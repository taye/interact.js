var gulp = require('gulp');

// Run this to compress all the things!
gulp.task('production', ['karma'], function(){
  // This runs only if the karma tests pass
  gulp.start(['markup', 'images', 'iconFont', 'minifyCss', 'uglifyJs'])
});
