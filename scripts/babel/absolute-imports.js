const path = require('path')

const resolveSync = require('resolve').sync

const { getModuleDirectories, shouldIgnoreImport, getRelativeToRoot } = require('../utils')

module.exports = function transformImportsToAbsolute () {
  const fixImportSource = ({ node: { source } }, { opts, filename }) => {
    if (!source || (opts.ignore && opts.ignore(filename, source.value))) return

    const { moduleDirectory = getModuleDirectories() } = opts

    if (shouldIgnoreImport(source.value, filename, moduleDirectory)) return

    const { extension = '', prefix } = opts
    const basedir = path.dirname(filename)

    let resolvedImport = ''

    resolvedImport = resolveSync(source.value, {
      extensions: ['.ts', '.tsx', '.js'],
      basedir,
      moduleDirectory,
    })

    try {
      const unrootedImport = getRelativeToRoot(resolvedImport, moduleDirectory, prefix).result

      source.value = extension === null ? unrootedImport : unrootedImport.replace(/\.[jt]sx?$/, extension)
    } catch (error) {
      source.value = resolveSync(source.value, {
        basedir,
        moduleDirectory,
      })
    }
  }

  return {
    name: '@interactjs/_dev:absolute-imports',
    visitor: {
      ImportDeclaration: fixImportSource,
      ExportNamedDeclaration: fixImportSource,
    },
  }
}
