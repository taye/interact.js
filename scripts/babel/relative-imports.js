const path = require('path')

const resolveSync = require('resolve').sync

const { getModuleDirectories, shouldIgnoreImport, getRelativeToRoot } = require('../utils')

module.exports = function transformImportsToRelative () {
  const fixImportSource = ({ node: { source } }, { opts, filename }) => {
    if (!source || (opts.ignore && opts.ignore(filename))) return

    const { moduleDirectory = getModuleDirectories() } = opts

    if (shouldIgnoreImport(source.value, filename, moduleDirectory)) return

    const { extension = '.js' } = opts

    const basedir = path.dirname(getRelativeToRoot(filename, moduleDirectory).result)
    let resolvedImport = ''

    for (const root of moduleDirectory) {
      try {
        resolvedImport = resolveSync(source.value, {
          extensions: ['.ts', '.tsx'],
          basedir: path.join(root, basedir),
          moduleDirectory,
        })
        break
      } catch {}
    }

    if (!resolvedImport) {
      throw new Error(`Couldn't find module "${source.value}" from "${filename}"`)
    }

    const relativeImport = path.relative(basedir, getRelativeToRoot(resolvedImport, moduleDirectory).result)

    const importWithDir = /^[./\\]/.test(relativeImport) ? relativeImport : `${path.sep}${relativeImport}`

    source.value = importWithDir.replace(/^\//, `.${path.sep}`).replace(/\.tsx?$/, extension)
  }

  return {
    name: '@interactjs/_dev:relative-imports',
    visitor: {
      ImportDeclaration: fixImportSource,
      ExportNamedDeclaration: fixImportSource,
      ExportAllDeclaration: fixImportSource,
    },
  }
}
