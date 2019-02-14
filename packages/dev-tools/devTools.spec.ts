import test from '@interactjs/_dev/test/test'
import drag from '@interactjs/actions/drag'
import * as helpers from '@interactjs/core/tests/_helpers'
import * as utils from '@interactjs/utils'
import * as devTools from './'

test('devTools "touch-action: none"', (t) => {
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

  const element = scope.document.body
  const event = utils.pointer.coordsToEvent(utils.pointer.newCoords())
  const interactable = scope.interactables.new(element).draggable(true)
  const interaction = scope.interactions.new({})

  interaction.pointerDown(event, event, element)
  interaction.start({ name: 'drag' }, interactable, element)

  t.deepEqual(
    logs[0],
    { args: [devTools.touchActionMessage, element, devTools.links.touchAction], type: 'warn' },
    'warning about missing touchAction')

  t.end()
})
