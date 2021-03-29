let lastTime = 0
let request: typeof requestAnimationFrame
let cancel: typeof cancelAnimationFrame

function init (global: Window | typeof globalThis) {
  request = global.requestAnimationFrame
  cancel = global.cancelAnimationFrame

  if (!request) {
    const vendors = ['ms', 'moz', 'webkit', 'o']

    for (const vendor of vendors) {
      request = global[`${vendor}RequestAnimationFrame` as 'requestAnimationFrame']
      cancel =
        global[`${vendor}CancelAnimationFrame` as 'cancelAnimationFrame'] ||
        global[`${vendor}CancelRequestAnimationFrame` as 'cancelAnimationFrame']
    }
  }

  request = request && request.bind(global)
  cancel = cancel && cancel.bind(global)

  if (!request) {
    request = (callback) => {
      const currTime = Date.now()
      const timeToCall = Math.max(0, 16 - (currTime - lastTime))
      const token = global.setTimeout(() => {
        // eslint-disable-next-line node/no-callback-literal
        callback(currTime + timeToCall)
      }, timeToCall)

      lastTime = currTime + timeToCall
      return token as any
    }

    cancel = (token) => clearTimeout(token)
  }
}

export default {
  request: (callback: FrameRequestCallback) => request(callback),
  cancel: (token: number) => cancel(token),
  init,
}
