import interact, { init } from '@interactjs/interact'
import plugin from '../drop'

if (typeof window === 'object' && !!window) {
  init(window)
}

// eslint-disable-next-line no-undef
if ((process.env.NODE_ENV !== 'production' || process.env.INTERACTJS_ESNEXT) && !(interact as any).__warnedUseImport) {
  (interact as any).__warnedUseImport = true
  // eslint-disable-next-line no-console
  console.warn('[interact.js] The "@interactjs/*/use" packages are not quite stable yet. Use them with caution.')
}

interact.use(plugin)