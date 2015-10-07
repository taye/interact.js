var gulp   = require('gulp');

gulp.task('docs', module.exports = function () {
  require('child_process').execSync('./node_modules/.bin/dr.js docs/dr.json');
});
