let lastTime = 0;
let request;
let cancel;

function init(global) {
  request = global.requestAnimationFrame;
  cancel = global.cancelAnimationFrame;

  if (!request) {
    const vendors = ['ms', 'moz', 'webkit', 'o'];

    for (const vendor of vendors) {
      request = global[`${vendor}RequestAnimationFrame`];
      cancel = global[`${vendor}CancelAnimationFrame`] || global[`${vendor}CancelRequestAnimationFrame`];
    }
  }

  request = request && request.bind(global);
  cancel = cancel && cancel.bind(global);

  if (!request) {
    request = callback => {
      const currTime = Date.now();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      const token = global.setTimeout(() => {
        // eslint-disable-next-line node/no-callback-literal
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