/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs')
const path = require('path')
const { PassThrough } = require('stream')

const derequire = require('derequire')
const resolveSync = require('resolve').sync

const bundler = require('./bundler')
const { getModuleDirectories, errorExit } = require('./utils')

const moduleDirectory = getModuleDirectories()

module.exports = async ({ source, sourceType, exports = [] }) => {
  const sourcePath = resolveSync(source, {
    moduleDirectory,
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  })
  const fileStream = fs.createReadStream(sourcePath)
  const codeStream = new PassThrough()

  fileStream.pipe(codeStream, { end: false })
  fileStream.once('end', () => codeStream.end(';__exports__ = module.exports'))

  try {
    const bundle = await bundler({
      sourceType,
      entry: codeStream,
      browserify: {
        debug: false,
        basedir: path.dirname(sourcePath),
        bare: false,
      },
    })

    return [
      'let __exports__',
      derequire(bundle),
      'const __default__ = __exports__.default || __exports__',
      'export default __default__',
      ...exports.map((e) => `export const ${e} = __exports__["${e}"] || __exports__.default["${e}"]`),
    ].join(';')
  } catch (error) {
    errorExit(error)
  }
}
