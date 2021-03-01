/* global process, __dirname */
const path = require('path')

const PROD_EXT = '.prod'

function fixImportSource ({ node: { source } }, { filename }) {
  if (shouldIgnoreImport(source)) return

  let resolvedShort = ''

  try {
    const paths = [filename && path.dirname(filename), __dirname, process.cwd()].filter((p) => !!p)

    const resolved = require.resolve(source.value, { paths })
    const resolvedWithoutScopePath = resolved.replace(/.*[\\/]@interactjs[\\/]/, '')

    resolvedShort = path
      .join('@interactjs', resolvedWithoutScopePath)
      // windows path to posix
      .replace(/\\/g, '/')
    source.value = resolvedShort.replace(/(\.js)?$/, PROD_EXT)
  } catch (e) {}
}

function babelPluginInteractjsProd () {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn(
      "[@interactjs/dev-tools] You're using the production plugin in the development environment. You might lose out on some helpful hints!",
    )
  }

  return {
    visitor: {
      ImportDeclaration: fixImportSource,
      ExportNamedDeclaration: fixImportSource,
      ExportAllDeclaration: fixImportSource,
      ExportDefaultSpecifier: fixImportSource,
    },
  }
}

function shouldIgnoreImport (source) {
  return (
    !source ||
    // only change @interactjs scoped imports
    !source.value.startsWith('@interactjs/') ||
    // ignore imports of prod files
    source.value.endsWith(PROD_EXT) ||
    source.value.endsWith(PROD_EXT + '.js')
  )
}

module.exports = babelPluginInteractjsProd

Object.assign(module.exports, {
  default: babelPluginInteractjsProd,
  fixImportSource,
})
