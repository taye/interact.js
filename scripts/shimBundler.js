const path = require('path')

const resolveSync = require('resolve').sync

const bundler = require('./bundler')
const { getModuleDirectories } = require('./utils')

const moduleDirectory = getModuleDirectories()

const destDir = path.join(__dirname, '..', 'dist', 'shims')

module.exports = async ({ source }) => {
  const sourcePath = resolveSync(source, {
    moduleDirectory,
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  })
  const ext = path.extname(source)
  const name = source.slice(0, source.length - ext.length)

  await bundler({
    entry: sourcePath,
    name,
    ext,
    destDir,
    format: 'es',
    minOnly: true,
  })
}
