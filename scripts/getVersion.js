module.exports = () => {
  const rootPkg = require(path.resolve('package.json'))

  return rootPkg.version
}
