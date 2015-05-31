'use strict';

module.exports = function extend (dest, source) {
    for (var prop in source) {
        dest[prop] = source[prop];
    }
    return dest;
};
