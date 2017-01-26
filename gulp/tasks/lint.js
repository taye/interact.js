var gulp   = require('gulp');

gulp.task('lint', module.exports = function () {
  var eslint = require('gulp-eslint');
  let sources;

  try {
    var execSync = require('child_process').execSync;
    sources = execSync('git ls-files "src/**.js"').toString().split('\n');
  }
  catch (e) {
    sources = ['src/**/*.js'];
  }

  return gulp.src(sources)
  // eslint() attaches the lint output to the eslint property
  // of the file object so it can be used by other modules.
  .pipe(eslint())
  // eslint.format() outputs the lint results to the console.
  // Alternatively use eslint.formatEach() (see Docs).
  .pipe(eslint.format('table'))
  // To have the process exit with an error code (1) on
  // lint error, return the stream and pipe to failAfterError last.
  .pipe(eslint.failAfterError());
});
