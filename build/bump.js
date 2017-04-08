const child_process = require('child_process');
const argv          = require('yargs')
  .boolean(['commit'])
  .default('commit', true)
  .argv;
const version       = require('./version');

console.log(process.argv);
const [release, prereleaseId] = argv._;

const newVersion = version.bump({
  release,
  prereleaseId,
  write: true,
});

if (argv.commit) {
  child_process.exec(`git commit -m 'Mark version ${newVersion}' -- package.json`);
}
