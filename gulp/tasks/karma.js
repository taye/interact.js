var gulp = require('gulp');
var karma = require('karma');

var karmaTask = function(done) {
  new karma.Server({
    configFile: process.cwd() + '/karma.conf.js',
    singleRun: true
  }, done).start();
};

var karmaContinuosTask = function(done) {
  new karma.Server({
    configFile: process.cwd() + '/karma.conf.js',
    action: 'watch'
  }, done).start();
};


gulp.task('karma', karmaTask);

gulp.task('test', karmaContinuosTask);

module.exports = karmaTask;
