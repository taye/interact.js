const fs = require('fs-extra');
const path = require('path');

const confPath = require.resolve('../docs/jsdoc.conf');
const destination = path.join(confPath, '..', require(confPath).opts.destination);

module.exports = ({ stdio = 'inherit' } = {}) => {
  process.stdout.write('Docs...');

  fs.removeSync(destination);

  require('child_process').spawnSync('jsdoc', ['-c', 'jsdoc.conf.js'], {
    stdio,
    cwd: 'docs',
  });

  fs.copySync('img', `${destination}/img`);

  console.log(' done.');
};

if (process.argv.includes('--go'))  {
  module.exports();
}
