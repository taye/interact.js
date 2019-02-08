import domator from 'domator'
import { JSDOM } from 'jsdom'

const doc = typeof window === 'undefined'
  ? new JSDOM('<!DOCTYPE html><html><body></body></html>').window.document
  : window.document

domator.setDocument(doc)

export {
  domator,
  doc,
  JSDOM,
}

export default domator
