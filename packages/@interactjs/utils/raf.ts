let lastTime = 0
let request: typeof requestAnimationFrame
let cancel: typeof cancelAnimationFrame

function init (window: Window) {
  request = window.requestAnimationFrame
  cancel = window.cancelAnimationFrame

  if (!request) {
    const vendors = ['ms', 'moz', 'webkit', 'o']

    for (const vendor of vendors) {
      request = window[`${vendor}RequestAnimationFrame` as 'requestAnimationFrame']
      cancel =
        window[`${vendor}CancelAnimationFrame` as 'cancelAnimationFrame'] ||
        window[`${vendor}CancelRequestAnimationFrame` as 'cancelAnimationFrame']
    }
  }

  request = request && request.bind(window)
  cancel = cancel && cancel.bind(window)

  if (!request) {
    request = callback => {
      const currTime = Date.now()
      const timeToCall = Math.max(0, 16 - (currTime - lastTime))
      const token = window.setTimeout(() => {
        // eslint-disable-next-line node/no-callback-literal
        callback(currTime + timeToCall)
      }, timeToCall)

      lastTime = currTime + timeToCall
      return token
    }

    cancel = token => clearTimeout(token)
  }
}

export default {
  request: (callback: FrameRequestCallback) => request(callback),
  cancel: (token: number) => cancel(token),
  init,
}
