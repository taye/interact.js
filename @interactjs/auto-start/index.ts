/* eslint-disable import/order, no-console, eol-last */
import interact, { init } from '@interactjs/interact'
import plugin from '@interactjs/auto-start/plugin'

if (typeof window === 'object' && !!window) {
  init(window)
}

// eslint-disable-next-line no-undef
if ((process.env.NODE_ENV !== 'production' || process.env.INTERACTJS_ESNEXT) && !(interact as any).__warnedUseImport) {
  (interact as any).__warnedUseImport = true
  console.warn('[interact.js] The "@interactjs/*/index" packages are not quite stable yet. Use them with caution.')
}

interact.use(plugin)