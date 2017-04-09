const fs = require('fs');
const mkdirp = require('mkdirp');
const replacer = require('./replacer');

module.exports = ({ stdio = 'inherit' } = {}) => {
  process.stdout.write('Docs...');
  mkdirp.sync('dist');

  const drjson = replacer(fs.readFileSync('dr.json').toString());

  fs.writeFileSync('_dr.json', drjson);

  require('child_process').spawnSync('npm', ['run', '_dr.js'], {
    stdio,
  });

  fs.unlinkSync('_dr.json');
  console.log(' done.');
};

if (process.argv.includes('--go'))  {
  module.exports();
}
