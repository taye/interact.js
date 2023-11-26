const path = require('path')

const bundler = require('../bundler')
const headers = require('../headers')
const { errorExit } = require('../utils')

const [, , entry = 'packages/interactjs', name = 'interact'] = process.argv
const entryPkgDir = path.join(process.cwd(), entry)

const options = {
  headers,
  entry: path.join(entryPkgDir, 'index.ts'),
  destDir: path.join(entryPkgDir, 'dist'),
  name,
}

process.stdout.write('Bundling...')

bundler(options)
  .then(async (code) => console.log(' done.'))
  .catch(errorExit)
