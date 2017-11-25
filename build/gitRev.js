const child_process = require('child_process');

function run (cmd) {
  return child_process.execSync(cmd).toString().trim();
}

module.exports = {
  short: () => run('git rev-parse --short HEAD'),
};
