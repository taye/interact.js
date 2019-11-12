let lastTime = 0;
let request;
let cancel;

function init(window) {
  request = window.requestAnimationFrame;
  cancel = window.cancelAnimationFrame;

  if (!request) {
    const vendors = ['ms', 'moz', 'webkit', 'o'];

    for (const vendor of vendors) {
      request = window[`${vendor}RequestAnimationFrame`];
      cancel = window[`${vendor}CancelAnimationFrame`] || window[`${vendor}CancelRequestAnimationFrame`];
    }
  }

  if (!request) {
    request = callback => {
      const currTime = Date.now();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime)); // eslint-disable-next-line standard/no-callback-literal

      const token = setTimeout(() => {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return token;
    };

    cancel = token => clearTimeout(token);
  }
}

export default {
  request: callback => request(callback),
  cancel: token => cancel(token),
  init
};
//# sourceMappingURL=raf.js.map