import isWindow from './isWindow'

export let realWindow = undefined as Window

let win = undefined as Window
export { win as window }

export function init (window: Window & { wrap?: (...args: any[]) => any }) {
  // get wrapped window if using Shadow DOM polyfill

  realWindow = window

  // create a TextNode
  const el = window.document.createTextNode('')

  // check if it's wrapped by a polyfill
  if (el.ownerDocument !== window.document && typeof window.wrap === 'function' && window.wrap(el) === el) {
    // use wrapped window
    window = window.wrap(window)
  }

  win = window
}

if (typeof window !== 'undefined' && !!window) {
  init(window)
}

export function getWindow (node: any) {
  if (isWindow(node)) {
    return node
  }

  const rootNode = node.ownerDocument || node

  return rootNode.defaultView || win.window
}
