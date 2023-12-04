"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.closest = closest;
exports.getActualElement = getActualElement;
exports.getElementClientRect = getElementClientRect;
exports.getElementRect = getElementRect;
exports.getPath = getPath;
exports.getScrollXY = getScrollXY;
exports.indexOfDeepestElement = indexOfDeepestElement;
exports.matchesSelector = matchesSelector;
exports.matchesUpTo = matchesUpTo;
exports.nodeContains = nodeContains;
exports.parentNode = parentNode;
exports.trySelector = trySelector;
var _browser = _interopRequireDefault(require("./browser"));
var _domObjects = _interopRequireDefault(require("./domObjects"));
var _is = _interopRequireDefault(require("./is"));
var win = _interopRequireWildcard(require("./window"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function nodeContains(parent, child) {
  if (parent.contains) {
    return parent.contains(child);
  }
  while (child) {
    if (child === parent) {
      return true;
    }
    child = child.parentNode;
  }
  return false;
}
function closest(element, selector) {
  while (_is.default.element(element)) {
    if (matchesSelector(element, selector)) {
      return element;
    }
    element = parentNode(element);
  }
  return null;
}
function parentNode(node) {
  let parent = node.parentNode;
  if (_is.default.docFrag(parent)) {
    // skip past #shado-root fragments
    // tslint:disable-next-line
    while ((parent = parent.host) && _is.default.docFrag(parent)) {
      continue;
    }
    return parent;
  }
  return parent;
}
function matchesSelector(element, selector) {
  // remove /deep/ from selectors if shadowDOM polyfill is used
  if (win.window !== win.realWindow) {
    selector = selector.replace(/\/deep\//g, ' ');
  }
  return element[_browser.default.prefixedMatchesSelector](selector);
}
const getParent = el => el.parentNode || el.host;

// Test for the element that's "above" all other qualifiers
function indexOfDeepestElement(elements) {
  let deepestNodeParents = [];
  let deepestNodeIndex;
  for (let i = 0; i < elements.length; i++) {
    const currentNode = elements[i];
    const deepestNode = elements[deepestNodeIndex];

    // node may appear in elements array multiple times
    if (!currentNode || i === deepestNodeIndex) {
      continue;
    }
    if (!deepestNode) {
      deepestNodeIndex = i;
      continue;
    }
    const currentNodeParent = getParent(currentNode);
    const deepestNodeParent = getParent(deepestNode);

    // check if the deepest or current are document.documentElement/rootElement
    // - if the current node is, do nothing and continue
    if (currentNodeParent === currentNode.ownerDocument) {
      continue;
    }
    // - if deepest is, update with the current node and continue to next
    else if (deepestNodeParent === currentNode.ownerDocument) {
      deepestNodeIndex = i;
      continue;
    }

    // compare zIndex of siblings
    if (currentNodeParent === deepestNodeParent) {
      if (zIndexIsHigherThan(currentNode, deepestNode)) {
        deepestNodeIndex = i;
      }
      continue;
    }

    // populate the ancestry array for the latest deepest node
    deepestNodeParents = deepestNodeParents.length ? deepestNodeParents : getNodeParents(deepestNode);
    let ancestryStart;

    // if the deepest node is an HTMLElement and the current node is a non root svg element
    if (deepestNode instanceof _domObjects.default.HTMLElement && currentNode instanceof _domObjects.default.SVGElement && !(currentNode instanceof _domObjects.default.SVGSVGElement)) {
      // TODO: is this check necessary? Was this for HTML elements embedded in SVG?
      if (currentNode === deepestNodeParent) {
        continue;
      }
      ancestryStart = currentNode.ownerSVGElement;
    } else {
      ancestryStart = currentNode;
    }
    const currentNodeParents = getNodeParents(ancestryStart, deepestNode.ownerDocument);
    let commonIndex = 0;

    // get (position of closest common ancestor) + 1
    while (currentNodeParents[commonIndex] && currentNodeParents[commonIndex] === deepestNodeParents[commonIndex]) {
      commonIndex++;
    }
    const parents = [currentNodeParents[commonIndex - 1], currentNodeParents[commonIndex], deepestNodeParents[commonIndex]];
    if (parents[0]) {
      let child = parents[0].lastChild;
      while (child) {
        if (child === parents[1]) {
          deepestNodeIndex = i;
          deepestNodeParents = currentNodeParents;
          break;
        } else if (child === parents[2]) {
          break;
        }
        child = child.previousSibling;
      }
    }
  }
  return deepestNodeIndex;
}
function getNodeParents(node, limit) {
  const parents = [];
  let parent = node;
  let parentParent;
  while ((parentParent = getParent(parent)) && parent !== limit && parentParent !== parent.ownerDocument) {
    parents.unshift(parent);
    parent = parentParent;
  }
  return parents;
}
function zIndexIsHigherThan(higherNode, lowerNode) {
  const higherIndex = parseInt(win.getWindow(higherNode).getComputedStyle(higherNode).zIndex, 10) || 0;
  const lowerIndex = parseInt(win.getWindow(lowerNode).getComputedStyle(lowerNode).zIndex, 10) || 0;
  return higherIndex >= lowerIndex;
}
function matchesUpTo(element, selector, limit) {
  while (_is.default.element(element)) {
    if (matchesSelector(element, selector)) {
      return true;
    }
    element = parentNode(element);
    if (element === limit) {
      return matchesSelector(element, selector);
    }
  }
  return false;
}
function getActualElement(element) {
  return element.correspondingUseElement || element;
}
function getScrollXY(relevantWindow) {
  relevantWindow = relevantWindow || win.window;
  return {
    x: relevantWindow.scrollX || relevantWindow.document.documentElement.scrollLeft,
    y: relevantWindow.scrollY || relevantWindow.document.documentElement.scrollTop
  };
}
function getElementClientRect(element) {
  const clientRect = element instanceof _domObjects.default.SVGElement ? element.getBoundingClientRect() : element.getClientRects()[0];
  return clientRect && {
    left: clientRect.left,
    right: clientRect.right,
    top: clientRect.top,
    bottom: clientRect.bottom,
    width: clientRect.width || clientRect.right - clientRect.left,
    height: clientRect.height || clientRect.bottom - clientRect.top
  };
}
function getElementRect(element) {
  const clientRect = getElementClientRect(element);
  if (!_browser.default.isIOS7 && clientRect) {
    const scroll = getScrollXY(win.getWindow(element));
    clientRect.left += scroll.x;
    clientRect.right += scroll.x;
    clientRect.top += scroll.y;
    clientRect.bottom += scroll.y;
  }
  return clientRect;
}
function getPath(node) {
  const path = [];
  while (node) {
    path.push(node);
    node = parentNode(node);
  }
  return path;
}
function trySelector(value) {
  if (!_is.default.string(value)) {
    return false;
  }

  // an exception will be raised if it is invalid
  _domObjects.default.document.querySelector(value);
  return true;
}
//# sourceMappingURL=domUtils.js.map