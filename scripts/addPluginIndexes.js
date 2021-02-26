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
        `
      /* eslint-disable import/order, no-console, eol-last */
      import interact, { init } from '@interactjs/interact'
      import plugin from '${pluginPath.replace(/^packages./, '')}'

      if (typeof window === 'object' && !!window) {
        init(window)
      }

      interact.use(plugin)
    `
          .replace(/^ {6}/gm, '')
          .trim(),
      )

      console.log(`wrote ${dest}`)
    }),
  )
}
