const fs = require('fs').promises
const path = require('path')

const mkdirp = require('mkdirp')

module.exports = plugins => {
  return Promise.all(plugins.map(async modulePath => {
    const [scopePath] = modulePath.split('/')
    const packagePath = path.join('packages', '@interactjs', scopePath)
    const pluginPath = path.join('packages', '@interactjs', modulePath)
    const dest = path.join(packagePath, path.dirname(path.relative(packagePath, pluginPath)), 'index.ts')
    const destDir = path.dirname(dest)

    await mkdirp(destDir)

    await fs.writeFile(dest, `
      /* eslint-disable import/order, no-console, eol-last */
      import interact, { init } from '@interactjs/interact'
      import plugin from '${pluginPath.replace(/^packages./, '')}'

      if (typeof window === 'object' && !!window) {
        init(window)
      }

      // eslint-disable-next-line no-undef
      if ((process.env.NODE_ENV !== 'production' || process.env.INTERACTJS_ESNEXT) && !(interact as any).__warnedUseImport) {
        (interact as any).__warnedUseImport = true
        console.warn('[interact.js] The "@interactjs/*/index" packages are not quite stable yet. Use them with caution.')
      }

      interact.use(plugin)
    `.replace(/^ {6}/mg, '').trim())

    console.log(`wrote ${dest}`)
  }))
}
