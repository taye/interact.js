const vendors = ['ms', 'moz', 'webkit', 'o'];
let lastTime = 0;
let reqFrame;
let cancelFrame;

for (let x = 0; x < vendors.length && !window.requestAnimationFrame; x++) {
  reqFrame = window[vendors[x] + 'RequestAnimationFrame'];
  cancelFrame = window[vendors[x] +'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
}

if (!reqFrame) {
  reqFrame = function (callback) {
    const currTime = new Date().getTime();
    const timeToCall = Math.max(0, 16 - (currTime - lastTime));
    const id = setTimeout(function () { callback(currTime + timeToCall); },
                          timeToCall);

    lastTime = currTime + timeToCall;
    return id;
  };
}

if (!cancelFrame) {
  cancelFrame = function (id) {
    clearTimeout(id);
  };
}

module.exports = {
  request: reqFrame,
  cancel: cancelFrame,
};
