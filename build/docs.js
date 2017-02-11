const fs = require('fs');
const mkdirp = require('mkdirp');

mkdirp.sync('dist');

const drjson = fs.readFileSync('dr.json')
  .toString()
  .replace(/[{]VERSION[}]/g, require('./getVersion')());

fs.writeFileSync('_dr.json', drjson);

require('child_process').spawnSync('npm', ['run', '_dr.js'], {
  stdio: 'inherit',
});

fs.unlinkSync('_dr.json');
