import interact, { init } from '@interactjs/interactjs/index'

if (typeof module === 'object' && !!module) {
  try { module.exports = interact }
  catch {}
}

(interact as any).default = interact
;(interact as any).init = init

export default interact
export { init }
