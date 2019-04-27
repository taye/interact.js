import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'
import pointerUtils from '@interactjs/utils/pointerUtils'
import drag from '../drag'
import drop from '../drop'

test('actions/drop options', (t) => {
  const scope = helpers.mockScope()
  scope.interact = {}
  scope.usePlugin(drop)

  const interactable = scope.interactables.new({ pointerType: 'test' })

  const funcs = Object.freeze({
    drop () {},
    activate () {},
    deactivate () {},
    dropmove () {},
    dragenter () {},
    dragleave () {},
  })

  interactable.dropzone({
    listeners: [funcs],
  })

  t.equal(interactable.events.types.drop[0], funcs.drop)
  t.equal(interactable.events.types.dropactivate[0], funcs.activate)
  t.equal(interactable.events.types.dropdeactivate[0], funcs.deactivate)
  t.equal(interactable.events.types.dropmove[0], funcs.dropmove)
  t.equal(interactable.events.types.dragenter[0], funcs.dragenter)
  t.equal(interactable.events.types.dragleave[0], funcs.dragleave)

  t.end()
})

test('actions/drop start', (t) => {
  const scope: Interact.Scope = helpers.mockScope()
  scope.interact = {} as any
  scope.usePlugin(drag)
  scope.usePlugin(drop)

  let interaction
  const draggable = scope.interactables.new(scope.document.body).draggable({})

  const event = pointerUtils.coordsToEvent(pointerUtils.newCoords())

  t.doesNotThrow(() => {
    scope.interact.dynamicDrop(false)

    interaction = scope.interactions.new({})
    interaction.pointerDown(event, event, scope.document.body)
    interaction.start({ name: 'drag' }, draggable, scope.document.documentElement)
    interaction.move()
    interaction.end()
  }, 'no error with dynamicDrop === false')

  t.doesNotThrow(() => {
    interaction = scope.interactions.new({})
    scope.interact.dynamicDrop(true)
    interaction.pointerDown(event, event, scope.document.body)
    interaction.start({ name: 'drag' }, draggable, scope.document.documentElement)
    interaction.move()
    interaction.end()
  }, 'no error with dynamicDrop === true')

  t.end()
})
