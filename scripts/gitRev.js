const childProcess = require('child_process')

function run (cmd) {
  return childProcess.execSync(cmd).toString().trim()
}

module.exports = {
  short: () => run('git rev-parse --short HEAD'),
}
