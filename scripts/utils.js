const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const glob = promisify(require('glob'))
const resolveSync = require('resolve').sync

const sourcesGlob = 'packages/{,@}interactjs/**/**/*{.ts,.tsx}'
const lintSourcesGlob = `{${sourcesGlob},{scripts,examples,jsdoc}/**/*.js,bin/**/*}`
const commonIgnoreGlobs = ['**/node_modules/**', '**/*_*', '**/*.d.ts', '**/dist/**', 'examples/js/**']
const lintIgnoreGlobs = [...commonIgnoreGlobs]
const sourcesIgnoreGlobs = [...commonIgnoreGlobs, '**/*.spec.ts']
const builtFilesGlob = '{{**/dist/**,packages/{,@}interactjs/**/**/*.js{,.map}},packages/@interactjs/**/index.ts}'
const builtFilesIgnoreGlobs = ['**/node_modules/**', 'packages/@interactjs/{types,interact,interactjs}/index.ts']

const getSources = ({ cwd = process.cwd(), ...options } = {}) => glob(
  sourcesGlob,
  {
    cwd,
    ignore: sourcesIgnoreGlobs,
    strict: false,
    nodir: true,
    absolute: true,
    ...options,
  },
)

const getBuiltJsFiles = ({ cwd = process.cwd() } = {}) => glob(
  builtFilesGlob,
  {
    cwd,
    ignore: builtFilesIgnoreGlobs,
    strict: false,
    nodir: true,
  })

function getBabelrc () {
  let babelrc

  try {
    babelrc = require(path.join(process.cwd(), '.babelrc'))
  } catch (e) {
    babelrc = require('../.babelrc')
  }

  return babelrc
}

function getBabelOptions () {
  const babelrc = getBabelrc()

  return {
    ignore: babelrc.ignore,
    babelrc: false,
    sourceMaps: true,
    presets: [
      [require('@babel/preset-typescript'), {
        allExtensions: true,
        isTSX: true,
      }],
    ],
    plugins: [
      [require('@babel/plugin-proposal-class-properties'), { loose: true }],
    ],
  }
}

function getDevPackageDir () {
  return path.join(__dirname, '..')
}

function getModuleName (tsName) {
  return tsName.replace(/\.[jt]sx?$/, '')
}

function getModuleDirectories () {
  return [
    path.join(process.cwd(), 'packages'),
    path.join(process.cwd(), 'node_modules'),
    path.join(__dirname, '..', 'packages'),
  ]
}

async function getPackages (options) {
  const packageJsonPaths = await glob('packages/{@interactjs/*,interactjs}/package.json', { ignore: commonIgnoreGlobs, ...options })
  const packageDirs = packageJsonPaths.map(p => path.join(p, '..'))

  return [...new Set(packageDirs)]
}

function shouldIgnoreImport (sourceValue, filename, moduleDirectory) {
  return !/^(\.{1-2}|(@interactjs))\//.test(sourceValue) &&
    !moduleDirectory.some(d => filename.startsWith(d))
}

function transformImportsToRelative () {
  const resolve = require('resolve')

  const fixImportSource = ({ node: { source } }, { opts, filename }) => {
    if (!source || (opts.ignore && opts.ignore(filename))) { return }

    const { moduleDirectory } = opts

    if (shouldIgnoreImport(source.value, filename, moduleDirectory)) { return }

    const { extension = '.js' } = opts

    const basedir = path.dirname(getRelativeToRoot(filename, moduleDirectory).result)
    let resolvedImport = ''

    for (const root of moduleDirectory) {
      try {
        resolvedImport = resolve.sync(source.value, {
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

    const relativeImport = path.relative(
      basedir,
      getRelativeToRoot(resolvedImport, moduleDirectory).result,
    )

    const importWithDir = /^[./]/.test(relativeImport)
      ? relativeImport
      : `/${relativeImport}`

    source.value = importWithDir
      .replace(/^\//, './')
      .replace(/\.tsx?$/, extension)
  }

  return {
    visitor: {
      ImportDeclaration: fixImportSource,
      ExportNamedDeclaration: fixImportSource,
      ExportAllDeclaration: fixImportSource,
    },
  }
}

function transformImportsToAbsolute () {
  const resolve = require('resolve')

  const fixImportSource = ({ node: { source } }, { opts, filename }) => {
    if (!source || (opts.ignore && opts.ignore(filename, source.value))) { return }

    const { moduleDirectory } = opts

    if (shouldIgnoreImport(source.value, filename, moduleDirectory)) { return }

    const { extension = '', prefix } = opts
    const basedir = path.dirname(filename)

    let resolvedImport = ''

    resolvedImport = resolve.sync(source.value, {
      extensions: ['.ts', '.tsx', '.js'],
      basedir,
      moduleDirectory,
    })

    try {
      const unrootedImport = getRelativeToRoot(resolvedImport, moduleDirectory, prefix).result

      source.value = extension === null
        ? unrootedImport
        : unrootedImport.replace(/\.[jt]sx?$/, extension)
    } catch (error) {
      source.value = resolve.sync(source.value, {
        basedir,
        moduleDirectory,
      })
    }
  }

  return {
    visitor: {
      ImportDeclaration: fixImportSource,
      ExportNamedDeclaration: fixImportSource,
    },
  }
}

function transformInlineEnvironmentVariables ({ types: t }) {
  return {
    visitor: {
      // eslint-disable-next-line no-shadow
      MemberExpression (path, { opts: { include, exclude, env } = {} }) {
        if (path.get('object').matchesPattern('process.env')) {
          const key = path.toComputedKey()
          if (
            t.isStringLiteral(key) &&
            (!include || include.indexOf(key.value) !== -1) &&
            (!exclude || exclude.indexOf(key.value) === -1)
          ) {
            const name = key.value
            const value = env && name in env ? env[name] : process.env[name]
            path.replaceWith(t.valueToNode(value))
          }
        }
      },
    },
  }
};

function extendBabelOptions ({ ignore = [], plugins = [], presets = [], ...others }, base = getBabelOptions()) {
  return {
    ...base,
    ...others,
    ignore: [...base.ignore || [], ...ignore],
    presets: [...base.presets || [], ...presets],
    plugins: [...base.plugins || [], ...plugins],
  }
}

function getPackageDir (filename) {
  let packageDir = filename

  while (!fs.existsSync(path.join(packageDir, 'package.json'))) {
    packageDir = path.dirname(packageDir)

    if (packageDir === path.sep) {
      throw new Error(`Couldn't find a package for ${filename}`)
    }
  }

  return packageDir
}

function getRelativeToRoot (filename, moduleDirectory, prefix = '/') {
  filename = path.normalize(filename)

  const ret = withBestRoot(
    root => {
      const valid = filename.startsWith(root)
      const result = valid && path.join(prefix, path.relative(root, filename))
      const priority = valid && -result.length

      return { valid, result, priority }
    },
    moduleDirectory,
  )

  if (!ret.result) {
    throw new Error(`Couldn't find module ${filename} in ${moduleDirectory.join(' or')}.`)
  }

  return ret
}

/**
 * use the result of `func` most shallow valid root
 */
function withBestRoot (func, moduleDirectory) {
  const roots = moduleDirectory
    .map(path.normalize)
    .map(root => path.normalize(root))

  return roots.reduce((best, root) => {
    const { result, valid, priority } = func(root)

    if (!valid) { return best }

    if (!best || priority > best.priority) {
      return { result, priority, root }
    }

    return best
  }, null) || {}
}

function resolveImport (specifier, basedir, moduleDirectory) {
  if (specifier.startsWith('.')) {
    specifier = path.join(basedir, specifier)
  }

  return resolveSync(specifier, { extensions: ['.ts', '.tsx'], moduleDirectory })
}

module.exports = {
  getSources,
  sourcesGlob,
  lintSourcesGlob,
  commonIgnoreGlobs,
  sourcesIgnoreGlobs,
  lintIgnoreGlobs,
  getBuiltJsFiles,
  getBabelrc,
  getBabelOptions,
  extendBabelOptions,
  getDevPackageDir,
  getPackages,
  getModuleName,
  getModuleDirectories,
  getPackageDir,
  getRelativeToRoot,
  withBestRoot,
  resolveImport,
  transformImportsToRelative,
  transformImportsToAbsolute,
  transformInlineEnvironmentVariables,
}
