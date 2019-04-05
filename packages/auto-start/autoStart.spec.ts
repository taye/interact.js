import test from '@interactjs/_dev/test/test'
import drag from '@interactjs/actions/drag'
import * as helpers from '@interactjs/core/tests/_helpers'
import * as utils from '@interactjs/utils'
import autoStart from './base'

test('autoStart', (t) => {
  const scope: Interact.Scope = helpers.mockScope()

  scope.usePlugin(autoStart)
  scope.usePlugin(drag)

  const interaction = scope.interactions.new({})
  const element = scope.document.body
  const interactable = scope.interactables.new(element).draggable(true)
  const event = utils.pointer.coordsToEvent(utils.pointer.newCoords())
  const rect = { top: 100, left: 200, bottom: 300, right: 400 }
  interactable.rectChecker(() => ({ ...rect }))

  interaction.pointerDown(event, event, element)

  t.deepEqual(
    interaction.prepared,
    { name: 'drag', axis: 'xy', edges: undefined },
    'prepares action'
  )

  t.deepEqual(
    interaction.rect,
    rect as any,
    'set interaction.rect'
  )

  t.end()
})
