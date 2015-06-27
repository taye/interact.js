'use strict';

var win = require('./window'),
    browser = require('./browser'),
    isType = require('./isType');

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
};

module.exports = domUtils;
