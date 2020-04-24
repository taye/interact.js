const { createWriteStream, promises: fs } = require('fs')
const os = require('os')
const path = require('path')

const babel = require('@babel/core')
const glob = require('glob')
const mkdirp = require('mkdirp')
const PQueue = require('p-queue').default
const temp = require('temp').track()
const Terser = require('terser')

const {
  getSources,
  getBabelOptions,
  extendBabelOptions,
  getModuleName,
  getModuleDirectories,
  getRelativeToRoot,
  transformImportsToRelative,
  transformInlineEnvironmentVariables,
} = require('./utils')

const OUTPUT_VERSIONS = [
  // development
  {
    extension: '.js',
    nodeEnv: 'development',
  },
  // production
  {
    extension: '.min.js',
    nodeEnv: 'production',
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
          beautify: false,
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
  moduleDirectory = getModuleDirectories(),
  serve = false,
  watch = false,
  outDir = serve ? temp.mkdirSync('ijs-serve') : process.cwd(),
} = {}) {
  sources = sources || await getSources()
  watch = watch || serve
  moduleDirectory = [outDir, ...moduleDirectory]

  if (filter) {
    sources = sources.filter(filter)
  }

  console.log(`generating javascript files for ${sources.length} modules...`)

  const initialRun = _generate(sources)

  if (!watch) {
    return initialRun
  }

  const watcher = require('chokidar').watch(sources, {
    persistent: true,
    ignoreInitial: true,
    disableGlobbing: true,
    usePolling: true,
  })
  const onChange = p => {
    console.log(`regenerating ${p}`)
    _generate([p])
  }

  watcher.on('change', onChange)
  watcher.on('add', onChange)

  console.log('watching for changes')

  if (!serve) { return }

  const serverWatch = [
    ...OUTPUT_VERSIONS.map(v => sources.map(s => {
      const outModuleName = path.join(outDir, getRelativeToRoot(s, moduleDirectory).result)

      return `${getModuleName(outModuleName)}${v.extension}`
    }),
    ).flat(),
    glob.sync('**/*.{html,css}', { ignore: ['**/node_modules/**'] }),
  ]

  const sync = require('browser-sync').create()

  sync.init({
    files: serverWatch,
    watch: true,
    port: 8081,
    open: false,
    server: outDir,
    serveStatic: [process.cwd()],
  })

  sync.pause()
  await initialRun
  sync.resume()

  function _generate (changedSources) {
    for (const sourceFilename of changedSources) {
      queue.add(async () => {
        const shimResult = await shim(sourceFilename)
        const moduleName = getModuleName(sourceFilename)
        const rootRelativeModuleName = getRelativeToRoot(moduleName, moduleDirectory).result
        const outModuleName = path.join(outDir, rootRelativeModuleName)

        if (shimResult) {
          await mkdirp(path.dirname(outModuleName))
          return Promise.all(OUTPUT_VERSIONS.map(
            ({ extension }) => fs.writeFile(`${outModuleName}${extension}`, shimResult)),
          )
        }

        const sourceCode = (await fs.readFile(sourceFilename)).toString()
        const ast = babel.parseSync(sourceCode, { ...babelOptions, filename: sourceFilename })

        return Promise.all(OUTPUT_VERSIONS.map(async (version) => {
          const { extension, nodeEnv } = version
          const env = { NODE_ENV: nodeEnv, INTERACTJS_ESNEXT: true }
          const finalBabelOptions = extendBabelOptions({
            filename: sourceFilename,
            plugins: [
              [transformInlineEnvironmentVariables, { env }],
              [transformImportsToRelative, { extension, moduleDirectory }],
            ],
          }, babelOptions)
          const result = await babel.transformFromAst(ast, sourceCode, finalBabelOptions)

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
        console.error(error)

        if (!watch) {
          queue.clear()
          process.exit(1)
        }
      })
    }

    return queue.onIdle()
  }
}

module.exports = generate
