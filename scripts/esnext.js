const { createWriteStream, promises: fs } = require('fs')
const os = require('os')
const path = require('path')

const babel = require('@babel/core')
const mkdirp = require('mkdirp')
const PQueue = require('p-queue').default
const temp = require('temp').track()

const minify = require('./minify')
const {
  getSources,
  getEsnextBabelOptions,
  extendBabelOptions,
  getModuleName,
  getModuleDirectories,
  getRelativeToRoot,
  resolveImport,
} = require('./utils')

const OUTPUT_VERSIONS = [
  // development
  {
    extension: '.js',
    nodeEnv: 'development',
  },
  // production
  {
    extension: '.prod.js',
    nodeEnv: 'production',
    async post (result) {
      const { code, map, error } = await minify(result)

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
const packagesDir = path.join(process.cwd(), 'packages')
const sourcePromises = new Map()

async function generate ({
  sources,
  shim,
  babelOptions = getEsnextBabelOptions(),
  moduleDirectory = getModuleDirectories(),
  serve = false,
  watch = false,
  serverOptions,
  outDir = serve ? temp.mkdirSync('ijs-serve') : packagesDir,
} = {}) {
  sources = serve ? [] : sources || (await getSources())
  sources = sources
    .filter((s) => moduleDirectory.some((dir) => s.startsWith(dir)))
    .filter((s) => !s.endsWith('.stub.ts'))
  moduleDirectory = [outDir, ...moduleDirectory]

  if (watch && !serve && !sources.length) {
    // eslint-disable-next-line no-throw-literal
    throw 'no files to watch'
  }

  if (!serve) {
    if (sources.length) {
      console.log(`generating javascript files for ${sources.length} modules...`)
    }

    return Promise.all(sources.map((s) => queueFile(s, watch)))
      .then(() => queue.onIdle())
      .catch((error) => {
        console.error(error)

        if (!watch) {
          queue.clear()
          process.exit(1)
        }
      })
  }

  const browserSync = require('browser-sync').create()

  browserSync.init({
    port: 8081,
    open: false,
    server: outDir,
    serveStatic: [packagesDir, process.cwd()],
    reloadOnRestart: true,
    middleware: async ({ url }, _res, next) => {
      if (url.startsWith('/@interactjs/') && !url.endsWith('.map')) {
        const source = resolveImport(url.substring(1).replace(/\.js$/, ''), null, moduleDirectory)
        if (!sourcePromises.has(source)) {
          queueFile(source, true)
        }

        await sourcePromises.get(source)
      }

      next()
    },
  })

  const watcher = require('chokidar').watch(sources, {
    persistent: true,
    ignoreInitial: true,
    disableGlobbing: true,
    usePolling: true,
  })

  const onChange = (source) => {
    queueFile(source).catch((error) => {
      console.error(source)
      console.error(error)
      sourcePromises.delete(source)
    })

    browserSync.reload()
  }

  watcher.on('change', onChange)

  if (!serve) {
    console.log('watching for changes')
  }

  async function queueFile (source, initial) {
    if (initial) {
      watcher.add(source)
    }

    const promise = queue.add(async () => {
      const shimResult = await shim?.(source)
      const moduleName = getModuleName(source)
      const rootRelativeModuleName = getRelativeToRoot(moduleName, moduleDirectory).result
      const outModuleName = path.join(outDir, rootRelativeModuleName)

      if (shimResult) {
        await mkdirp(path.dirname(outModuleName))

        return Promise.all(
          OUTPUT_VERSIONS.map(({ extension }) =>
            Promise.all([
              fs.writeFile(`${outModuleName}${extension}`, shimResult.code),
              shimResult.map &&
                fs.writeFile(`${outModuleName}${extension}.map`, JSON.stringify(shimResult.map)),
            ]),
          ),
        )
      }

      const sourceCode = (await fs.readFile(source)).toString()
      const ast = babel.parseSync(sourceCode, { ...babelOptions, filename: source })

      return Promise.all(
        OUTPUT_VERSIONS.map(async (version) => {
          const { extension, nodeEnv } = version
          const env = { NODE_ENV: nodeEnv, INTERACTJS_ESNEXT: true }
          const finalBabelOptions = extendBabelOptions(
            {
              filename: source,
              plugins: [
                [require.resolve('./babel/inline-env-vars'), { env }],
                [require.resolve('./babel/relative-imports'), { extension, moduleDirectory }],
              ],
            },
            babelOptions,
          )
          const result = {
            ...(await babel.transformFromAst(ast, sourceCode, finalBabelOptions)),
            modern: true,
          }

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
        }),
      )
    })

    sourcePromises.set(source, promise)
    return promise
  }
}

module.exports = generate
