const fs = require('fs');
const mkdirp = require('mkdirp');

mkdirp.sync('dist');

const drjson = require('./replacer')(fs.readFileSync('dr.json').toString());

fs.writeFileSync('_dr.json', drjson);

require('child_process').spawnSync('npm', ['run', '_dr.js'], {
  stdio: 'inherit',
});

fs.unlinkSync('_dr.json');
