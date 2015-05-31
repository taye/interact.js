'use strict';

var lastTime = 0,
    vendors = ['ms', 'moz', 'webkit', 'o'],
    reqFrame,
    cancelFrame;

for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    reqFrame = window[vendors[x]+'RequestAnimationFrame'];
    cancelFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
}

if (!reqFrame) {
    reqFrame = function(callback) {
        var currTime = new Date().getTime(),
            timeToCall = Math.max(0, 16 - (currTime - lastTime)),
            id = setTimeout(function() { callback(currTime + timeToCall); },
          timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
}

if (!cancelFrame) {
    cancelFrame = function(id) {
        clearTimeout(id);
    };
}

module.exports = {
    request: reqFrame,
    cancel: cancelFrame
};
