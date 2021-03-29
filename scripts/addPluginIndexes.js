const fs = require('fs').promises
const path = require('path')

const mkdirp = require('mkdirp')

module.exports = (plugins) => {
  return Promise.all(
    plugins.map(async (modulePath) => {
      const [scopePath] = modulePath.split('/')
      const packagePath = path.join('packages', '@interactjs', scopePath)
      const pluginPath = path.join('packages', '@interactjs', modulePath)
      const dest = path.join(packagePath, path.dirname(path.relative(packagePath, pluginPath)), 'index.ts')
      const destDir = path.dirname(dest)

      await mkdirp(destDir)

      await fs.writeFile(
        dest,
        [
          '/* eslint-disable import/order, no-console, eol-last */',
          "import interact from '@interactjs/interact/index'",
          `import plugin from '${pluginPath.replace(/^packages./, '')}'`,
          'interact.use(plugin)',
        ].join('\n'),
      )

      console.log(`wrote ${dest}`)
    }),
  )
}
