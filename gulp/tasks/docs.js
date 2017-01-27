const gulp = require('gulp');
const path = require('path');

gulp.task('docs', module.exports = function () {
  const fs = require('fs');
  const drjson = require('../../dr.json');
  const outputDir = path.dirname(drjson.output);

  require('child_process').execSync('./node_modules/.bin/dr.js dr.json');
  fs.writeFileSync(outputDir + '/img/ijs-anim-short.svg', fs.readFileSync('img/ijs-anim-short.svg'));
  fs.writeFileSync(outputDir + '/img/ijs-32.png'        , fs.readFileSync('img/ijs-32.png'));
});
