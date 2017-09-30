const fs = require('fs-extra');
const destination = require('../jsdoc.conf').opts.destination;

module.exports = ({ stdio = 'inherit' } = {}) => {
  process.stdout.write('Docs...');

  fs.removeSync(destination);
  fs.copySync('img', `${destination}/img`);

  require('child_process').spawnSync('jsdoc', ['-c', 'jsdoc.conf.js'], {
    stdio,
  });

  console.log(' done.');
};

if (process.argv.includes('--go'))  {
  module.exports();
}
