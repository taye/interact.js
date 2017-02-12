const fs = require('fs');
const mkdirp = require('mkdirp');
const replacer = require('./replacer');

mkdirp.sync('dist');

const drjson = replacer(fs.readFileSync('dr.json').toString(), {
  decorate: false,
});

fs.writeFileSync('_dr.json', drjson);

require('child_process').spawnSync('npm', ['run', '_dr.js'], {
  stdio: 'inherit',
});

fs.unlinkSync('_dr.json');
