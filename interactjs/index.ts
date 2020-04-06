import interact from '@interactjs/interactjs/index'

if (typeof module === 'object' && !!module) {
  try { module.exports = interact }
  catch {}
}

(interact as any).default = interact

export default interact
