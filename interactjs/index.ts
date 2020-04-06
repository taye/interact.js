import interact from '@interactjs/interactjs/index'
// eslint-disable-next-line import/named
export { default as Interact } from '@interactjs/types/types'

if (typeof module === 'object' && !!module) {
  try { module.exports = interact }
  catch {}
}

(interact as any).default = interact

export default interact
