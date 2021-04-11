const fs = require('fs')
const os = require('os')
const path = require('path')

const mkdirp = require('mkdirp')
const { default: PQueue } = require('p-queue')

const bundleShim = require('../shimBundler')
const { getShims, errorExit } = require('../utils')

const destDir = path.join(__dirname, '..', 'dist', 'shims')

const queue = new PQueue({ concurrency: os.cpus().length })

const shims = getShims()

if (!shims.length) process.exit()

for (const shimConfig of shims) {
  queue.add(() => bundle(shimConfig).catch(errorExit))
}

async function bundle (shimConfig) {
  const { source } = shimConfig
  const outFile = `${destDir}/${source}`

  if (fs.existsSync(outFile)) {
    console.log(`${source} bundle already exists`)
    return
  }

  console.log(`Bundling ${source}`)

  const code = await bundleShim({ ...shimConfig })
  await mkdirp(path.dirname(outFile))

  await fs.promises.writeFile(outFile, code)
}

queue.onIdle().then((bundled) => {
  console.log('Done.')
})
