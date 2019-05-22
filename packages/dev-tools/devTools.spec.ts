import test from '@interactjs/_dev/test/test'
import { drag, resize } from '@interactjs/actions'
import * as helpers from '@interactjs/core/tests/_helpers'
import * as utils from '@interactjs/utils'
import devTools, { Check, Logger } from './'

const { checks, links, prefix } = devTools
const checkMap = checks.reduce((acc, check) => {
  acc[check.name] = check
  return acc
}, {} as { [name: string]: Check})

test('devTools', (t) => {
  const scope: Interact.Scope = helpers.mockScope()
  const logs: Array<{ args: any[], type: keyof Logger }> = []

  function log (args, type) {
    logs.push({ args, type })
  }

  scope.usePlugin(devTools, {
    logger: {
      warn (...args) { log(args, 'warn') },
      log (...args) { log(args, 'log') },
      error (...args) { log(args, 'error') },
    },
  })

  scope.usePlugin(drag)
  scope.usePlugin(resize)

  const element = scope.document.body.appendChild(scope.document.createElement('div'))
  const event = utils.pointer.coordsToEvent(utils.pointer.newCoords())
  const interactable = scope.interactables.new(element)
    .draggable(true)
    .resizable({ onmove: () => {} })
  const interaction = scope.interactions.new({})

  interaction.pointerDown(event, event, element)
  interaction.start({ name: 'drag' }, interactable, element)
  t.deepEqual(
    logs[0],
    { args: [prefix + checkMap.touchAction.text, element, links.touchAction], type: 'warn' },
    'warning about missing touchAction')

  t.deepEqual(
    logs[1],
    { args: [prefix + checkMap.noListeners.text, 'drag', interactable], type: 'warn' },
    'warning about missing move listeners')

  interaction.stop()

  // resolve touchAction
  element.style.touchAction = 'none'
  // resolve missing listeners
  interactable.on('dragmove', () => {})

  interaction.start({ name: 'resize' }, interactable, element)
  interaction.pointerMove(event, event, element)
  interaction.end()

  t.deepEqual(
    logs[2],
    { args: [prefix + checkMap.boxSizing.text, element, links.boxSizing], type: 'warn' },
    'warning about resizing without "box-sizing: none"')

  // resolve boxSizing
  element.style.boxSizing = 'border-box'

  interaction.start({ name: 'resize' }, interactable, element)
  interaction.move({ event, pointer: event })
  interaction.end()

  interaction.start({ name: 'drag' }, interactable, element)
  interaction.pointerMove(event, event, element)
  interaction.end()

  t.equal(
    logs.length,
    3,
    'no warnings when issues are resolved')

  // re-introduce boxSizing issue
  element.style.boxSizing = ''

  interaction.start({ name: 'drag' }, interactable, element)
  interaction.end()

  interactable.options.devTools.ignore = { boxSizing: true }

  interaction.start({ name: 'drag' }, interactable, element)
  interaction.end()

  t.equal(
    logs.length,
    3,
    'no warning with options.devTools.ignore')

  t.end()
})
