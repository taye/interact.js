const path = require('path')

const writer = require('../bundleWriter')
const bundler = require('../bundler')
const headers = require('../headers')
const { errorExit } = require('../utils')

const [, , entry = 'packages/interactjs', standalone = 'interact', name = standalone] = process.argv
const entryPkgDir = path.join(process.cwd(), entry)

const options = {
  headers,
  entry: path.join(entryPkgDir, 'index.ts'),
  destDir: path.join(entryPkgDir, 'dist'),
  standalone,
  name,
  browserify: {
    bare: true,
  },
}

process.stdout.write('Bundling...')

bundler(options)
  .then(async (code) => {
    await writer(code, options)
    console.log(' done.')
  })
  .catch(errorExit)
