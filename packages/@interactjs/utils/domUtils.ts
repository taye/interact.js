import type { Rect, Target, Element } from '@interactjs/types/index'

import browser from './browser'
import domObjects from './domObjects'
import is from './is'
import * as win from './window'

export function nodeContains (parent: Node, child: Node) {
  if (parent.contains) {
    return parent.contains(child as Node)
  }

  while (child) {
    if (child === parent) {
      return true
    }

    child = (child as Node).parentNode
  }

  return false
}

export function closest (element: Node, selector: string) {
  while (is.element(element)) {
    if (matchesSelector(element, selector)) {
      return element
    }

    element = parentNode(element)
  }

  return null
}

export function parentNode (node: Node | Document) {
  let parent = node.parentNode

  if (is.docFrag(parent)) {
    // skip past #shado-root fragments
    // tslint:disable-next-line
    while ((parent = (parent as any).host) && is.docFrag(parent)) {
      continue
    }

    return parent
  }

  return parent
}

export function matchesSelector (element: Element, selector: string) {
  // remove /deep/ from selectors if shadowDOM polyfill is used
  if (win.window !== win.realWindow) {
    selector = selector.replace(/\/deep\//g, ' ')
  }

  return element[browser.prefixedMatchesSelector](selector)
}

const getParent = (el: Node | Document | ShadowRoot) => el.parentNode || (el as ShadowRoot).host

// Test for the element that's "above" all other qualifiers
export function indexOfDeepestElement (elements: Element[] | NodeListOf<globalThis.Element>) {
  let deepestNodeParents: Node[] = []
  let deepestNodeIndex: number

  for (let i = 0; i < elements.length; i++) {
    const currentNode = elements[i]
    const deepestNode: Node = elements[deepestNodeIndex]

    // node may appear in elements array multiple times
    if (!currentNode || i === deepestNodeIndex) {
      continue
    }

    if (!deepestNode) {
      deepestNodeIndex = i
      continue
    }

    const currentNodeParent = getParent(currentNode)
    const deepestNodeParent = getParent(deepestNode)

    // check if the deepest or current are document.documentElement/rootElement
    // - if the current node is, do nothing and continue
    if (currentNodeParent === currentNode.ownerDocument) {
      continue
    }
    // - if deepest is, update with the current node and continue to next
    else if (deepestNodeParent === currentNode.ownerDocument) {
      deepestNodeIndex = i
      continue
    }

    // compare zIndex of siblings
    if (currentNodeParent === deepestNodeParent) {
      if (zIndexIsHigherThan(currentNode, deepestNode)) {
        deepestNodeIndex = i
      }

      continue
    }

    // populate the ancestry array for the latest deepest node
    deepestNodeParents = deepestNodeParents.length ? deepestNodeParents : getNodeParents(deepestNode)

    let ancestryStart: Node

    // if the deepest node is an HTMLElement and the current node is a non root svg element
    if (
      deepestNode instanceof domObjects.HTMLElement &&
      currentNode instanceof domObjects.SVGElement &&
      !(currentNode instanceof domObjects.SVGSVGElement)
    ) {
      // TODO: is this check necessary? Was this for HTML elements embedded in SVG?
      if (currentNode === deepestNodeParent) {
        continue
      }

      ancestryStart = currentNode.ownerSVGElement
    } else {
      ancestryStart = currentNode
    }

    const currentNodeParents = getNodeParents(ancestryStart, deepestNode.ownerDocument)
    let commonIndex = 0

    // get (position of closest common ancestor) + 1
    while (
      currentNodeParents[commonIndex] &&
      currentNodeParents[commonIndex] === deepestNodeParents[commonIndex]
    ) {
      commonIndex++
    }

    const parents = [
      currentNodeParents[commonIndex - 1],
      currentNodeParents[commonIndex],
      deepestNodeParents[commonIndex],
    ]

    if (parents[0]) {
      let child = parents[0].lastChild

      while (child) {
        if (child === parents[1]) {
          deepestNodeIndex = i
          deepestNodeParents = currentNodeParents

          break
        } else if (child === parents[2]) {
          break
        }

        child = child.previousSibling
      }
    }
  }

  return deepestNodeIndex
}

function getNodeParents (node: Node, limit?: Node) {
  const parents: Node[] = []
  let parent: Node = node
  let parentParent: Node

  while ((parentParent = getParent(parent)) && parent !== limit && parentParent !== parent.ownerDocument) {
    parents.unshift(parent)
    parent = parentParent
  }

  return parents
}

function zIndexIsHigherThan (higherNode: Node, lowerNode: Node) {
  const higherIndex = parseInt(win.getWindow(higherNode).getComputedStyle(higherNode).zIndex, 10) || 0
  const lowerIndex = parseInt(win.getWindow(lowerNode).getComputedStyle(lowerNode).zIndex, 10) || 0

  return higherIndex >= lowerIndex
}

export function matchesUpTo (element: Element, selector: string, limit: Node) {
  while (is.element(element)) {
    if (matchesSelector(element, selector)) {
      return true
    }

    element = parentNode(element) as Element

    if (element === limit) {
      return matchesSelector(element, selector)
    }
  }

  return false
}

export function getActualElement (element: Element) {
  return (element as SVGElement).correspondingUseElement || element
}

export function getScrollXY (relevantWindow?: Window) {
  relevantWindow = relevantWindow || win.window
  return {
    x: relevantWindow.scrollX || relevantWindow.document.documentElement.scrollLeft,
    y: relevantWindow.scrollY || relevantWindow.document.documentElement.scrollTop,
  }
}

export function getElementClientRect (element: Element): Required<Rect> {
  const clientRect =
    element instanceof domObjects.SVGElement ? element.getBoundingClientRect() : element.getClientRects()[0]

  return (
    clientRect && {
      left: clientRect.left,
      right: clientRect.right,
      top: clientRect.top,
      bottom: clientRect.bottom,
      width: clientRect.width || clientRect.right - clientRect.left,
      height: clientRect.height || clientRect.bottom - clientRect.top,
    }
  )
}

export function getElementRect (element: Element) {
  const clientRect = getElementClientRect(element)

  if (!browser.isIOS7 && clientRect) {
    const scroll = getScrollXY(win.getWindow(element))

    clientRect.left += scroll.x
    clientRect.right += scroll.x
    clientRect.top += scroll.y
    clientRect.bottom += scroll.y
  }

  return clientRect
}

export function getPath (node: Node | Document) {
  const path = []

  while (node) {
    path.push(node)
    node = parentNode(node)
  }

  return path
}

export function trySelector (value: Target) {
  if (!is.string(value)) {
    return false
  }

  // an exception will be raised if it is invalid
  domObjects.document.querySelector(value)
  return true
}
