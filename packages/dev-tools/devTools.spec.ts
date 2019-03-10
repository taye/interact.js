import test from '@interactjs/_dev/test/test'
import { drag, resize } from '@interactjs/actions'
import * as helpers from '@interactjs/core/tests/_helpers'
import * as utils from '@interactjs/utils'
import * as devTools from './'

test('devTools', (t) => {
  const scope: Interact.Scope = helpers.mockScope()
  const logs: Array<{ args: any[], type: keyof devTools.Logger }> = []

  function log (args, type) {
    logs.push({ args, type })
  }

  devTools.install(scope, {
    logger: {
      warn (...args) { log(args, 'warn') },
      log (...args) { log(args, 'log') },
      error (...args) { log(args, 'error') },
    },
  })

  drag.install(scope)
  resize.install(scope)

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
    { args: [devTools.touchActionMessage, element, devTools.links.touchAction], type: 'warn' },
    'warning about missing touchAction')

  t.deepEqual(
    logs[1],
    { args: [devTools.noListenersMessage, 'drag', interactable], type: 'warn' },
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
    { args: [devTools.boxSizingMessage, element, devTools.links.boxSizing], type: 'warn' },
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

  t.end()
})
