import browser from './browser'
import domObjects from './domObjects'
import * as is from './is'
import win from './window'

export function nodeContains (parent: Node, child: Node) {
  while (child) {
    if (child === parent) {
      return true
    }

    child = child.parentNode
  }

  return false
}

export function closest (element, selector) {
  while (is.element(element)) {
    if (matchesSelector(element, selector)) { return element }

    element = parentNode(element)
  }

  return null
}

export function parentNode (node) {
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

export function matchesSelector (element, selector) {
  // remove /deep/ from selectors if shadowDOM polyfill is used
  if (win.window !== win.realWindow) {
    selector = selector.replace(/\/deep\//g, ' ')
  }

  return element[browser.prefixedMatchesSelector](selector)
}

const getParent = (el) => el.parentNode ? el.parentNode : el.host

// Test for the element that's "above" all other qualifiers
export function indexOfDeepestElement (elements) {
  let deepestZoneParents = []
  let dropzoneParents = []
  let dropzone
  let deepestZone = elements[0]
  let index = deepestZone ? 0 : -1
  let parent
  let child
  let i
  let n

  for (i = 1; i < elements.length; i++) {
    dropzone = elements[i]

    // an element might belong to multiple selector dropzones
    if (!dropzone || dropzone === deepestZone) {
      continue
    }

    if (!deepestZone) {
      deepestZone = dropzone
      index = i
      continue
    }

    // check if the deepest or current are document.documentElement or document.rootElement
    // - if the current dropzone is, do nothing and continue
    if (dropzone.parentNode === dropzone.ownerDocument) {
      continue
    }
    // - if deepest is, update with the current dropzone and continue to next
    else if (deepestZone.parentNode === dropzone.ownerDocument) {
      deepestZone = dropzone
      index = i
      continue
    }

    if (!deepestZoneParents.length) {
      parent = deepestZone
      while (getParent(parent) && getParent(parent) !== parent.ownerDocument) {
        deepestZoneParents.unshift(parent)
        parent = getParent(parent)
      }
    }

    // if this element is an svg element and the current deepest is
    // an HTMLElement
    if (deepestZone instanceof domObjects.HTMLElement &&
        dropzone instanceof domObjects.SVGElement &&
        !(dropzone instanceof domObjects.SVGSVGElement)) {
      if (dropzone === deepestZone.parentNode) {
        continue
      }

      parent = dropzone.ownerSVGElement
    }
    else {
      parent = dropzone
    }

    dropzoneParents = []

    while (parent.parentNode !== parent.ownerDocument) {
      dropzoneParents.unshift(parent)
      parent = getParent(parent)
    }

    n = 0

    // get (position of last common ancestor) + 1
    while (dropzoneParents[n] && dropzoneParents[n] === deepestZoneParents[n]) {
      n++
    }

    const parents = [
      dropzoneParents[n - 1],
      dropzoneParents[n],
      deepestZoneParents[n],
    ]

    child = parents[0].lastChild

    while (child) {
      if (child === parents[1]) {
        deepestZone = dropzone
        index = i
        deepestZoneParents = []

        break
      }
      else if (child === parents[2]) {
        break
      }

      child = child.previousSibling
    }
  }

  return index
}

export function matchesUpTo (element: Element, selector: string, limit: Node) {
  while (is.element(element)) {
    if (matchesSelector(element, selector)) {
      return true
    }

    element = parentNode(element)

    if (element === limit) {
      return matchesSelector(element, selector)
    }
  }

  return false
}

export function getActualElement (element) {
  return (element instanceof domObjects.SVGElementInstance
    ? element.correspondingUseElement
    : element)
}

export function getScrollXY (relevantWindow) {
  relevantWindow = relevantWindow || win.window
  return {
    x: relevantWindow.scrollX || relevantWindow.document.documentElement.scrollLeft,
    y: relevantWindow.scrollY || relevantWindow.document.documentElement.scrollTop,
  }
}

export function getElementClientRect (element) {
  const clientRect = (element instanceof domObjects.SVGElement
    ? element.getBoundingClientRect()
    : element.getClientRects()[0])

  return clientRect && {
    left  : clientRect.left,
    right : clientRect.right,
    top   : clientRect.top,
    bottom: clientRect.bottom,
    width : clientRect.width  || clientRect.right  - clientRect.left,
    height: clientRect.height || clientRect.bottom - clientRect.top,
  }
}

export function getElementRect (element) {
  const clientRect = getElementClientRect(element)

  if (!browser.isIOS7 && clientRect) {
    const scroll = getScrollXY(win.getWindow(element))

    clientRect.left   += scroll.x
    clientRect.right  += scroll.x
    clientRect.top    += scroll.y
    clientRect.bottom += scroll.y
  }

  return clientRect
}

export function getPath (node) {
  const path = []

  while (node) {
    path.push(node)
    node = parentNode(node)
  }

  return path
}

export function trySelector (value) {
  if (!is.string(value)) { return false }

  // an exception will be raised if it is invalid
  domObjects.document.querySelector(value)
  return true
}
