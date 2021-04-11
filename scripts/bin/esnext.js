const path = require('path')

const generate = require('../esnext')
const bundleShim = require('../shimBundler')
const { getEsnextBabelOptions, getSources, getShims } = require('../utils')

const [, , ...args] = process.argv

const fileArgs = []
let watch = false
let serve = false

for (const arg of args) {
  if (arg === '--watch') {
    watch = true
  } else if (arg === '--serve') {
    serve = true
  } else {
    fileArgs.push(path.resolve(arg))
  }
}

const babelOptions = getEsnextBabelOptions()
const shims = getShims()

const cwd = process.cwd()

const sourcesPromise = fileArgs.length ? Promise.resolve(fileArgs) : getSources({ cwd })

sourcesPromise.then(async (sources) => {
  await generate({
    sources,
    async shim (filename) {
      const shimConfig = shims.find((s) => filename.endsWith(s.source))

      if (shimConfig) {
        const code = await bundleShim(shimConfig)

        return { code }
      }
    },
    babelOptions,
    watch,
    serve,
  })
})
