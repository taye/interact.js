const path = require('path')
const os = require('os')
const { createWriteStream, promises: fs } = require('fs')
const babel = require('@babel/core')
const PQueue = require('p-queue').default
const Terser = require('terser')
const mkdirp = require('mkdirp')
const glob = require('glob')

const {
  getSources,
  getBabelOptions,
  extendBabelOptions,
  getModuleName,
  getPackageDir,
  getRelativeToRoot,
  transformRelativeImports,
  transformInlineEnvironmentVariables,
} = require('./utils')

const OUTPUT_VERSIONS = [
  // development
  {
    extension: '.js',
    env: {
      NODE_ENV: 'development',
    },
  },
  // production
  {
    extension: '.min.js',
    env: {
      NODE_ENV: 'production',
    },
    async post (result) {
      const { code, map, error } = Terser.minify(result.code, {
        module: true,
        sourceMap: { content: result.map },
        mangle: {
          module: true,
        },
        compress: {
          ecma: 8,
          unsafe: true,
          unsafe_Function: true,
          unsafe_arrows: true,
          unsafe_methods: true,
        },
        output: {
          beautify: true,
        },
      })

      if (error) {
        throw error
      }

      return {
        code,
        map: JSON.parse(map),
      }
    },
  },
]

const queue = new PQueue({ concurrency: os.cpus().length })

async function generate ({
  sources,
  shim = () => {},
  babelOptions = getBabelOptions(),
  filter,
  outDir = process.cwd(),
  moduleDirectory = [process.cwd(), path.join(__dirname, '..')],
  serve = false,
  watch = false,
} = {}) {
  sources = sources || await getSources()

  if (filter) {
    sources = sources.filter(filter)
  }

  console.log(`generating javascript files for ${sources.length} modules...`)

  const initialRun = _generate(sources)

  if (!watch && !serve) {
    return initialRun
  }

  const watcher = require('chokidar').watch(sources, {
    persistent: true,
    ignoreInitial: true,
    disableGlobbing: true,
    usePolling: true,
  })
  const onChange = path => {
    console.log(`regenerating ${path}`)
    _generate([path])
  }

  watcher.on('change', onChange)
  watcher.on('add', onChange)

  console.log('watching for changes')

  if (!serve) { return }

  const serverWatch = [
    ...OUTPUT_VERSIONS.map(v => sources.map(
      s => `${getModuleName(s)}${v.extension}`)
    ).flat(),
    glob.sync('**/*.{html,css}', { ignore: ['**/node_modules/**'] }),
  ]

  const sync = require('browser-sync').create()

  sync.init({
    files: serverWatch,
    port: 8081,
    open: false,
    server: process.cwd(),
  })

  sync.pause()
  await initialRun
  sync.resume()

  function _generate (changedSources) {
    for (const sourceFilename of changedSources) {
      queue.add(async () => {
        const shimResult = await shim(sourceFilename)
        const moduleName = getModuleName(sourceFilename)
        const rootRelativeModuleName = getRelativeToRoot(moduleName, moduleDirectory)
        const outModuleName = path.join(outDir, rootRelativeModuleName)

        if (shimResult) {
          await mkdirp(path.dirname(outModuleName))
          return Promise.all(OUTPUT_VERSIONS.map(
            ({ extension }) => fs.writeFile(`${outModuleName}${extension}`, shimResult))
          )
        }

        const sourceCode = (await fs.readFile(sourceFilename)).toString()
        const ast = babel.parseSync(sourceCode, { ...babelOptions, filename: sourceFilename })

        return Promise.all(OUTPUT_VERSIONS.map(async (version) => {
          const { extension, env } = version
          const finalBabelOptions = extendBabelOptions({
            filename: sourceFilename,
            plugins: [
              [transformInlineEnvironmentVariables, { env }],
              [transformRelativeImports, { extension, moduleDirectory }],
            ],
          }, babelOptions)
          const result = await babel.transformFromAstSync(ast, sourceCode, finalBabelOptions)

          const { code, map } = version.post ? await version.post(result) : result
          const jsFilename = `${outModuleName}${extension}`
          const mapFilename = `${jsFilename}.map`

          await mkdirp(path.dirname(jsFilename))

          const jsStream = createWriteStream(jsFilename)

          jsStream.write(code)
          jsStream.end(`\n//# sourceMappingURL=${path.basename(mapFilename)}`)

          await Promise.all([
            new Promise((resolve, reject) => {
              jsStream.on('close', resolve)
              jsStream.on('error', reject)
            }),
            fs.writeFile(mapFilename, JSON.stringify(map, null, '\t')),
          ])
        }))
      }).catch(error => {
        queue.clear()
        console.error(error)
        process.exit
      })
    }

    return queue.onIdle()
  }
}

module.exports = generate
