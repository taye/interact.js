const path = require('path')
const os = require('os')
const fs = require('fs')
const babel = require('@babel/core')
const PQueue = require('p-queue').default
const Terser = require('terser')

const {
  getSources,
  getBabelOptions,
  extendBabelOptions,
  getModuleName,
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

      debugger
      return {
        code,
        map: JSON.parse(map),
      }
    },
  },
]

const queue = new PQueue({ concurrency: os.cpus().length })

async function generate (sources, babelOptions = getBabelOptions(), filter) {
  sources = sources || await getSources()

  if (filter) {
    sources = sources.filter(filter)
  }

  queue.clear()

  for (const sourceFilename of sources) {
    queue.add(async () => {
      const sourceCode = (await fs.promises.readFile(sourceFilename)).toString()
      const moduleName = getModuleName(sourceFilename)
      const ast = babel.parseSync(sourceCode, { ...babelOptions, filename: sourceFilename })

      return Promise.all(OUTPUT_VERSIONS.map(async (version) => {
        const { extension, env } = version
        const finalBabelOptions = extendBabelOptions({
          filename: sourceFilename,
          plugins: [
            [transformInlineEnvironmentVariables, { env }],
            [transformRelativeImports, { extension }],
          ],
        }, babelOptions)
        const result = await babel.transformFromAstSync(ast, sourceCode, finalBabelOptions)

        const { code, map } = version.post ? await version.post(result) : result
        const jsFilename = `${moduleName}${extension}`
        const mapFilename = `${jsFilename}.map`

        const jsStream = fs.createWriteStream(jsFilename)

        jsStream.write(code)
        jsStream.end(`\n//# sourceMappingURL=${path.basename(mapFilename)}`)

        return Promise.all([
          new Promise((resolve, reject) => {
            jsStream.on('close', resolve)
            jsStream.on('error', reject)
          }),
          fs.promises.writeFile(mapFilename, JSON.stringify(map, null, '\t')),
        ])
      }))
    })
  }

  await queue.onIdle()
}

module.exports = generate
