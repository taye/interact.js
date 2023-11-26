const os = require('os')
const path = require('path')

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

async function bundle(shimConfig) {
  const { source } = shimConfig

  console.log(`Bundling ${source}`)

  await bundleShim({ ...shimConfig, destDir })
}

queue.onIdle().then((bundled) => {
  console.log('Done.')
})
