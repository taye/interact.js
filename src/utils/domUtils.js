const win        = require('./window');
const browser    = require('./browser');
const is         = require('./is');
const domObjects = require('./domObjects');

const domUtils = {
  nodeContains: function (parent, child) {
    while (child) {
      if (child === parent) {
        return true;
      }

      child = child.parentNode;
    }

    return false;
  },

  closest: function (element, selector) {
    while (is.element(element)) {
      if (domUtils.matchesSelector(element, selector)) { return element; }

      element = domUtils.parentNode(element);
    }

    return null;
  },

  parentNode: function (node) {
    let parent = node.parentNode;

    if (is.docFrag(parent)) {
      // skip past #shado-root fragments
      while ((parent = parent.host) && is.docFrag(parent)) {
        continue;
      }

      return parent;
    }

    return parent;
  },

  matchesSelector: function (element, selector) {
    // remove /deep/ from selectors if shadowDOM polyfill is used
    if (win.window !== win.realWindow) {
      selector = selector.replace(/\/deep\//g, ' ');
    }

    return element[browser.prefixedMatchesSelector](selector);
  },

  // Test for the element that's "above" all other qualifiers
  indexOfDeepestElement: function (elements) {
    let deepestZoneParents = [];
    let dropzoneParents = [];
    let dropzone;
    let deepestZone = elements[0];
    let index = deepestZone? 0: -1;
    let parent;
    let child;
    let i;
    let n;

    for (i = 1; i < elements.length; i++) {
      dropzone = elements[i];

      // an element might belong to multiple selector dropzones
      if (!dropzone || dropzone === deepestZone) {
        continue;
      }

      if (!deepestZone) {
        deepestZone = dropzone;
        index = i;
        continue;
      }

      // check if the deepest or current are document.documentElement or document.rootElement
      // - if the current dropzone is, do nothing and continue
      if (dropzone.parentNode === dropzone.ownerDocument) {
        continue;
      }
      // - if deepest is, update with the current dropzone and continue to next
      else if (deepestZone.parentNode === dropzone.ownerDocument) {
        deepestZone = dropzone;
        index = i;
        continue;
      }

      if (!deepestZoneParents.length) {
        parent = deepestZone;
        while (parent.parentNode && parent.parentNode !== parent.ownerDocument) {
          deepestZoneParents.unshift(parent);
          parent = parent.parentNode;
        }
      }

      // if this element is an svg element and the current deepest is
      // an HTMLElement
      if (deepestZone instanceof domObjects.HTMLElement
          && dropzone instanceof domObjects.SVGElement
          && !(dropzone instanceof domObjects.SVGSVGElement)) {

        if (dropzone === deepestZone.parentNode) {
          continue;
        }

        parent = dropzone.ownerSVGElement;
      }
      else {
        parent = dropzone;
      }

      dropzoneParents = [];

      while (parent.parentNode !== parent.ownerDocument) {
        dropzoneParents.unshift(parent);
        parent = parent.parentNode;
      }

      n = 0;

      // get (position of last common ancestor) + 1
      while (dropzoneParents[n] && dropzoneParents[n] === deepestZoneParents[n]) {
        n++;
      }

      const parents = [
        dropzoneParents[n - 1],
        dropzoneParents[n],
        deepestZoneParents[n],
      ];

      child = parents[0].lastChild;

      while (child) {
        if (child === parents[1]) {
          deepestZone = dropzone;
          index = i;
          deepestZoneParents = [];

          break;
        }
        else if (child === parents[2]) {
          break;
        }

        child = child.previousSibling;
      }
    }

    return index;
  },

  matchesUpTo: function (element, selector, limit) {
    while (is.element(element)) {
      if (domUtils.matchesSelector(element, selector)) {
        return true;
      }

      element = domUtils.parentNode(element);

      if (element === limit) {
        return domUtils.matchesSelector(element, selector);
      }
    }

    return false;
  },

  getActualElement: function (element) {
    return (element instanceof domObjects.SVGElementInstance
      ? element.correspondingUseElement
      : element);
  },

  getScrollXY: function (relevantWindow) {
    relevantWindow = relevantWindow || win.window;
    return {
      x: relevantWindow.scrollX || relevantWindow.document.documentElement.scrollLeft,
      y: relevantWindow.scrollY || relevantWindow.document.documentElement.scrollTop,
    };
  },

  getElementClientRect: function (element) {
    const clientRect = (element instanceof domObjects.SVGElement
      ? element.getBoundingClientRect()
      : element.getClientRects()[0]);

    return clientRect && {
      left  : clientRect.left,
      right : clientRect.right,
      top   : clientRect.top,
      bottom: clientRect.bottom,
      width : clientRect.width  || clientRect.right  - clientRect.left,
      height: clientRect.height || clientRect.bottom - clientRect.top,
    };
  },

  getElementRect: function (element) {
    const clientRect = domUtils.getElementClientRect(element);

    if (!browser.isIOS7 && clientRect) {
      const scroll = domUtils.getScrollXY(win.getWindow(element));

      clientRect.left   += scroll.x;
      clientRect.right  += scroll.x;
      clientRect.top    += scroll.y;
      clientRect.bottom += scroll.y;
    }

    return clientRect;
  },

  getPath: function (element) {
    const path = [];

    while (element) {
      path.push(element);
      element = domUtils.parentNode(element);
    }

    return path;
  },

  trySelector: value => {
    if (!is.string(value)) { return false; }

    // an exception will be raised if it is invalid
    domObjects.document.querySelector(value);
    return true;
  },
};

module.exports = domUtils;
