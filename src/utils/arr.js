'use strict';

function indexOf (array, target) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (array[i] === target) {
            return i;
        }
    }

    return -1;
}

function contains (array, target) {
    return indexOf(array, target) !== -1;
}

function merge (target, source) {
    for (var i = 0; i < source.length; i++) {
        target.push(source[i]);
    }

    return target;
}

module.exports = {
    indexOf: indexOf,
    contains: contains,
    merge: merge
};
