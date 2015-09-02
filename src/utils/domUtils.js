'use strict';

var win = require('./window'),
    browser = require('./browser'),
    isType = require('./isType'),
    domObjects = require('./domObjects');

var domUtils = {
    nodeContains: function (parent, child) {
        while (child) {
            if (child === parent) {
                return true;
            }

            child = child.parentNode;
        }

        return false;
    },

    closest: function (child, selector) {
        var parent = domUtils.parentElement(child);

        while (isType.isElement(parent)) {
            if (domUtils.matchesSelector(parent, selector)) { return parent; }

            parent = domUtils.parentElement(parent);
        }

        return null;
    },

    parentElement: function (node) {
        var parent = node.parentNode;

        if (isType.isDocFrag(parent)) {
            // skip past #shado-root fragments
            while ((parent = parent.host) && isType.isDocFrag(parent)) {}

            return parent;
        }

        return parent;
    },

    // taken from http://tanalin.com/en/blog/2012/12/matches-selector-ie8/ and modified
    matchesSelectorPolyfill: (browser.useMatchesSelectorPolyfill? function (element, selector, elems) {
        elems = elems || element.parentNode.querySelectorAll(selector);

        for (var i = 0, len = elems.length; i < len; i++) {
            if (elems[i] === element) {
                return true;
            }
        }

        return false;
    } : null),

    matchesSelector: function (element, selector, nodeList) {
        if (browser.useMatchesSelectorPolyfill) {
            return domUtils.matchesSelectorPolyfill(element, selector, nodeList);
        }

        // remove /deep/ from selectors if shadowDOM polyfill is used
        if (win.window !== win.realWindow) {
            selector = selector.replace(/\/deep\//g, ' ');
        }

        return element[browser.prefixedMatchesSelector](selector);
    },

    // Test for the element that's "above" all other qualifiers
    indexOfDeepestElement: function (elements) {
        var dropzone,
            deepestZone = elements[0],
            index = deepestZone? 0: -1,
            parent,
            deepestZoneParents = [],
            dropzoneParents = [],
            child,
            i,
            n;

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

            var parents = [
                dropzoneParents[n - 1],
                dropzoneParents[n],
                deepestZoneParents[n]
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
        while (domUtils.isElement(element)) {
            if (domUtils.matchesSelector(element, selector)) {
                return true;
            }

            element = domUtils.parentElement(element);

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
            y: relevantWindow.scrollY || relevantWindow.document.documentElement.scrollTop
        };
    },

    getElementClientRect: function (element) {
        var clientRect = (element instanceof domObjects.SVGElement
                            ? element.getBoundingClientRect()
                            : element.getClientRects()[0]);

        return clientRect && {
            left  : clientRect.left,
            right : clientRect.right,
            top   : clientRect.top,
            bottom: clientRect.bottom,
            width : clientRect.width || clientRect.right - clientRect.left,
            height: clientRect.heigh || clientRect.bottom - clientRect.top
        };
    },

    getElementRect: function (element) {
        var clientRect = domUtils.getElementClientRect(element);

        if (!browser.isIOS7orLower && clientRect) {
            var scroll = domUtils.getScrollXY(win.getWindow(element));

            clientRect.left   += scroll.x;
            clientRect.right  += scroll.x;
            clientRect.top    += scroll.y;
            clientRect.bottom += scroll.y;
        }

        return clientRect;
    }
};

module.exports = domUtils;