import interact, { init } from '@interactjs/interactjs/index'
export * from '@interactjs/interactjs/index'

if (typeof module === 'object' && !!module) {
  module.exports = interact
}

(interact as any).default = interact // tslint:disable-line no-string-literal
;(interact as any).init = init // tslint:disable-line no-string-literal

export default interact
