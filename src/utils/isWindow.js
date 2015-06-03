'use strict';

module.exports = function isWindow (thing) {
    return !!(thing && thing.Window) && (thing instanceof thing.Window);
};
