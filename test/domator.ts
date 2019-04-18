import domator from 'domator'

let JSDOM
let doc

if (typeof window === 'undefined') {
  // tslint:disable-next-line no-var-requires
  JSDOM = require('jsdom').JSDOM
  doc = new JSDOM('<!DOCTYPE html><html><body></body></html>').window.document
} else {
  doc = window.document
}

domator.setDocument(doc)

export {
  domator,
  doc,
  JSDOM,
}

export default domator
