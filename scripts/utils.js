const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const glob = promisify(require('glob'))
const resolveSync = require('resolve').sync

const sourcesGlob = 'packages/{,@}interactjs/**/**/*{.ts,.tsx,.vue}'
const lintSourcesGlob = `{${sourcesGlob},{scripts,examples,jsdoc}/**/*.js,bin/**/*}`
const commonIgnoreGlobs = ['**/node_modules/**', '**/*_*', '**/*.d.ts', '**/dist/**', 'examples/js/**']
const lintIgnoreGlobs = [...commonIgnoreGlobs]
const sourcesIgnoreGlobs = [...commonIgnoreGlobs, '**/*.spec.ts']
const builtFilesGlob =
  '{{**/dist/**,packages/{,@}interactjs/**/**/*.js{,.map}},packages/@interactjs/**/index.ts}'
const builtFilesIgnoreGlobs = [
  '**/node_modules/**',
  'packages/@interactjs/{dev-tools/babel-plugin-prod.js,{types,interact,interactjs,rebound}/index.ts}',
]

const getSources = ({ cwd = process.cwd(), ...options } = {}) =>
  glob(sourcesGlob, {
    cwd,
    ignore: sourcesIgnoreGlobs,
    strict: false,
    nodir: true,
    absolute: true,
    ...options,
  })

const getBuiltJsFiles = ({ cwd = process.cwd() } = {}) =>
  glob(builtFilesGlob, {
    cwd,
    ignore: builtFilesIgnoreGlobs,
    strict: false,
    nodir: true,
  })

function getBabelConfig () {
  let babelConfig

  try {
    babelConfig = require(path.join(process.cwd(), 'babel.config.js'))
  } catch (e) {
    babelConfig = require('../babel.config.js')
  }

  return babelConfig
}

function getEsnextBabelOptions () {
  return {
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    presets: [[require.resolve('@babel/preset-typescript'), { allExtensions: true }]],
    plugins: [
      require.resolve('./babel/vue-sfc'),
      require.resolve('@babel/plugin-proposal-optional-catch-binding'),
      [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
      [require.resolve('@babel/plugin-proposal-optional-chaining'), { loose: true }],
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
  return [path.join(__dirname, '..', 'packages'), path.join(process.cwd(), 'node_modules')]
}

async function getPackages (options) {
  const packageJsonPaths = await glob('packages/{@interactjs/*,interactjs}/package.json', {
    ignore: commonIgnoreGlobs,
    ...options,
  })
  const packageDirs = packageJsonPaths.map(path.dirname)

  return [...new Set(packageDirs)]
}

async function getPackageJsons (packages = getPackages()) {
  return Promise.all(
    (await packages).map(async (p) => {
      const jsonPath = path.resolve(p, 'package.json')
      const pkg = JSON.parse((await fs.promises.readFile(jsonPath)).toString())
      return [jsonPath, pkg]
    }),
  )
}

function shouldIgnoreImport (sourceValue, filename, moduleDirectory) {
  return (
    !/^(\.{1-2}|(@interactjs))[\\/]/.test(sourceValue) && !moduleDirectory.some((d) => filename.startsWith(d))
  )
}

const isPro = process.env.INTERACTJS_TIER === 'pro'
const registryUrl = isPro ? 'https://registry.interactjs.io' : undefined

function extendBabelOptions (
  { ignore = [], plugins = [], presets = [], ...others },
  base = getEsnextBabelOptions(),
) {
  return {
    ...base,
    ...others,
    ignore: [...(base.ignore || []), ...ignore],
    presets: [...(base.presets || []), ...presets],
    plugins: [...(base.plugins || []), ...plugins],
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

  const ret = withBestRoot((root) => {
    const valid = filename.startsWith(root)
    const result = valid && path.join(prefix, path.relative(root, filename))
    const priority = valid && -result.length

    return { valid, result, priority }
  }, moduleDirectory)

  if (!ret.result) {
    throw new Error(`Couldn't find module ${filename} in ${moduleDirectory.join(' or')}.`)
  }

  return ret
}

/**
 * use the result of `func` most shallow valid root
 */
function withBestRoot (func, moduleDirectory) {
  const roots = moduleDirectory.map(path.normalize)

  return (
    roots.reduce((best, root) => {
      const { result, valid, priority } = func(root)

      if (!valid) {
        return best
      }

      if (!best || priority > best.priority) {
        return { result, priority, root }
      }

      return best
    }, null) || {}
  )
}

function resolveImport (specifier, basedir, moduleDirectory) {
  if (specifier.startsWith('.')) {
    specifier = path.join(basedir, specifier)
  }

  return resolveSync(specifier, {
    extensions: ['.ts', '.tsx'],
    moduleDirectory,
  })
}

function getShims () {
  try {
    return require('../scripts/shims')
  } catch {
    return []
  }
}

function errorExit (error) {
  console.error(error)
  process.exit(1)
}

module.exports = {
  getSources,
  sourcesGlob,
  lintSourcesGlob,
  commonIgnoreGlobs,
  sourcesIgnoreGlobs,
  lintIgnoreGlobs,
  getBuiltJsFiles,
  getBabelConfig,
  getEsnextBabelOptions,
  extendBabelOptions,
  getDevPackageDir,
  getPackages,
  getPackageJsons,
  getModuleName,
  getModuleDirectories,
  getPackageDir,
  getRelativeToRoot,
  withBestRoot,
  resolveImport,
  isPro,
  registryUrl,
  shouldIgnoreImport,
  getShims,
  errorExit,
}
