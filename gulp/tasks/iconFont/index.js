var gulp             = require('gulp');
var iconfont         = require('gulp-iconfont');
var config           = require('../../config').iconFonts;
var generateIconSass = require('./generateIconSass');

gulp.task('iconFont', function() {
  return gulp.src(config.src)
    .pipe(iconfont(config.options))
    .on('codepoints', generateIconSass)
    .pipe(gulp.dest(config.dest));
});
