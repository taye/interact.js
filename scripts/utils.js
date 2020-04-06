const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const glob = promisify(require('glob'))

const sourcesGlob = '{,@}interactjs/**/**/*{.ts,.tsx}'
const lintSourcesGlob = `{${sourcesGlob},{scripts,examples}/**/*.js,bin/**/*}`
const commonIgnoreGlobs = ['**/node_modules/**', '**/*_*', '**/*.d.ts', '**/dist/**', 'examples/js/**']
const lintIgnoreGlobs = [...commonIgnoreGlobs, '**/@interactjs/*/use/**']
const sourcesIgnoreGlobs = [...commonIgnoreGlobs, '**/*.spec.ts']
const builtFilesGlob = '{{**/dist/**,{,@}interactjs/**/**/*.js{,.map}},@interactjs/*/use/**}'
const builtFilesIgnoreGlobs = ['**/node_modules/**']

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
    process.cwd(),
    path.join(process.cwd(), 'node_modules'),
    path.join(__dirname, '..'),
  ]
}

async function getPackages () {
  const packageJsonPaths = await glob('{@interactjs/*,interactjs}/package.json', { ignore: commonIgnoreGlobs })
  const packageDirs = packageJsonPaths.map(getPackageDir)

  return [...new Set(packageDirs)]
}

function transformRelativeImports () {
  const resolve = require('resolve')

  const fixImportSource = ({ node: { source } }, { opts, filename }) => {
    if (!source) { return }

    const {
      moduleDirectory,
      extension = '.js',
    } = opts

    const basedir = path.dirname(getRelativeToRoot(filename, moduleDirectory))
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
      path.dirname(getRelativeToRoot(filename, moduleDirectory)),
      getRelativeToRoot(resolvedImport, moduleDirectory),
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
      packageDir = process.cwd()
      break
    }
  }

  return packageDir
}

function getRelativeToRoot (filename, moduleDirectory) {
  filename = path.normalize(filename)

  return withBestRoot(
    root => {
      const valid = filename.startsWith(root)
      const result = valid && path.join('/', path.relative(root, filename))

      return { valid, result }
    },
    moduleDirectory,
  )
}

/**
 * use the result of `func` most shallow valid root
 */
function withBestRoot (func, moduleDirectory) {
  const roots = moduleDirectory
    .map(path.normalize)
    .map(root => path.normalize(root))

  const { result: bestResult } = roots.reduce((best, root) => {
    const { result, valid } = func(root)

    if (!valid) { return best }

    const depth = (root.match(new RegExp(`[\\${path.sep}]`, 'g')) || []).length

    if (!best || best.depth < depth) {
      return { depth, result }
    }

    return best
  }, null) || {}

  return bestResult
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
  transformRelativeImports,
  transformInlineEnvironmentVariables,
}
