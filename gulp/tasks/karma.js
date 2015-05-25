var gulp = require('gulp');
var karma = require('karma');

var karmaTask = function(done) {
  karma.server.start({
    configFile: process.cwd() + '/karma.conf.js',
    singleRun: true
  }, done);
};

var karmaContinuosTask = function(done) {
    karma.server.start({
        configFile: process.cwd() + '/karma.conf.js',
        action: 'watch'
    }, done);
};


gulp.task('karma', karmaTask);

gulp.task('test', karmaContinuosTask);

module.exports = karmaTask;
