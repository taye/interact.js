const path = require('path')

module.exports = (cwd = process.cwd()) => {
  const rootPkg = require(path.resolve(cwd, 'package.json'))

  return rootPkg.version
}
