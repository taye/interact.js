import { JSDOM } from '@interactjs/_dev/test/domator'
import test from '@interactjs/_dev/test/test'

import domObjects from './domObjects'
import { indexOfDeepestElement } from './domUtils'

interface MockNode {
  name: string
  lastChild: any
  parentNode: MockNode | null
  ownerDocument: MockNode | null
  host?: MockNode
}

test('utils/domUtils/indexOfDeepestElement', t => {
  const doc1: Document = new JSDOM(`<div id="topDiv">
    <div id="sib0"></div>
    <div id="sib1"></div>
    <div id="sib2"></div>
  </div>`).window.document

  domObjects.init(doc1.defaultView)

  const ownerDocument: MockNode = {
    name: 'Owner Document',
    lastChild: null as any,
    parentNode: null,
    ownerDocument: null,
  }
  const html: MockNode = {
    name: 'html',
    lastChild: null as any,
    ownerDocument,
    parentNode: ownerDocument,
  }

  const body: MockNode = { name: 'body', lastChild: null, ownerDocument, parentNode: html }

  const wrapper: MockNode = { name: 'wrapper', ownerDocument, parentNode: body, lastChild: null }

  const a: MockNode = { name: 'a', ownerDocument, parentNode: wrapper, lastChild: null }

  const b1: MockNode = { name: 'b1', ownerDocument, parentNode: a, lastChild: null }

  const b2: MockNode = { name: 'b2', ownerDocument, parentNode: a, lastChild: null }

  const c1: MockNode = { name: 'c1', ownerDocument, parentNode: b1, lastChild: null }

  const c2: MockNode = { name: 'c2', ownerDocument, parentNode: b1, lastChild: null }

  const d1: MockNode = { name: 'd1', ownerDocument, parentNode: c1, lastChild: null }

  const d1Comp: MockNode = { name: 'd1_comp', ownerDocument, parentNode: d1, lastChild: null }

  const d2Shadow: MockNode = {
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

  const deepestShadow = ([null, d2Shadow, c1, b1, a] as unknown) as HTMLElement[]
  t.equal(
    indexOfDeepestElement(deepestShadow),
    deepestShadow.indexOf(d2Shadow as any),
    'works with shadow root',
  )

  const noShadow = ([null, d1, c1, b1] as unknown) as HTMLElement[]

  t.equal(
    indexOfDeepestElement(noShadow),
    noShadow.indexOf(d1 as any),
    'only chooses elements that are passed in',
  )

  const siblings: NodeListOf<HTMLElement> = doc1.querySelectorAll('#topDiv > *')

  t.equal(indexOfDeepestElement(siblings), 2, 'last sibling is deepest with equal zIndex')

  siblings[0].style.zIndex = '2'
  siblings[1].style.zIndex = '2'
  siblings[2].style.zIndex = '1'

  t.equal(indexOfDeepestElement(siblings), 1, 'sibling with higher z-index is selected')

  const nodeWithoutParent: MockNode = { name: 'd1', ownerDocument, parentNode: undefined, lastChild: null }
  const brokenElementCollection = ([nodeWithoutParent, d1, c2] as unknown) as HTMLElement[]
  t.equal(indexOfDeepestElement(brokenElementCollection), 0, 'does not break with a node without parent')

  t.end()
})
