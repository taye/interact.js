import test from '@interactjs/_dev/test/test'
import { indexOfDeepestElement } from './domUtils'

test('utils/domUtils/indexOfDeepestElement', t => {
  const ownerDocument = {
    name: 'Owner Document',
    lastChild: null,
  }
  const html = {
    name: 'html',
    lastChild: null,
    ownerDocument,
    parentNode: ownerDocument,
  }

  const body = {
    name: 'body',
    lastChild: null,
    ownerDocument,
    parentNode: html,

  }

  const wrapper = {
    name: 'wrapper',
    ownerDocument,
    parentNode: body,
    lastChild: null,
  }

  const a = {
    name: 'a',
    ownerDocument,
    parentNode: wrapper,
    lastChild: null,
  }

  const b1 = {
    name: 'b1',
    ownerDocument,
    parentNode: a,
    lastChild: null,
  }

  const b2 = {
    name: 'b2',
    ownerDocument,
    parentNode: a,
    lastChild: null,
  }

  const c1 = {
    name: 'c1',
    ownerDocument,
    parentNode: b1,
    lastChild: null,
  }

  const c2 = {
    name: 'c2',
    ownerDocument,
    parentNode: b1,
    lastChild: null,
  }

  const d1 = {
    name: 'd1',
    ownerDocument,
    parentNode: c1,
    lastChild: null,
  }

  const d1Comp = {
    name: 'd1_comp',
    ownerDocument,
    parentNode: d1,
    lastChild: null,
  }

  const d2Shadow = {
    name: 'd2_shadow',
    ownerDocument,
    parentNode: null,
    lastChild: null,
    host: d1Comp,
  }

  ownerDocument.lastChild = html
  html.lastChild = body
  body.lastChild = wrapper
  a.lastChild = b2
  b1.lastChild = c2
  b2.lastChild = null
  c1.lastChild = d1
  c2.lastChild = null
  d1.lastChild = d1
  wrapper.lastChild = a

  const deepestShadow = [null, d2Shadow, c1, b1, a]
  t.equal(indexOfDeepestElement(deepestShadow), deepestShadow.indexOf(d2Shadow), 'works with shadow root')

  const noShadow = [null, d1, c1, b1]

  t.equal(indexOfDeepestElement(noShadow), noShadow.indexOf(d1), 'only chooses elements that are passed in')

  t.end()
})
