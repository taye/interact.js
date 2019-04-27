import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'
import pointerUtils from '@interactjs/utils/pointerUtils'
import resize from './resize'

test('resize', (t) => {
  const scope = helpers.mockScope()

  scope.usePlugin(resize)

  t.ok(scope.actions.names.includes('resize'), '"resize" in actions.names')
  t.equal(scope.actions.methodDict.resize, 'resizable')
  t.equal(typeof scope.Interactable.prototype.resizable, 'function', 'Interactable.resizable method is added')

  const page = { x: 0, y: 0 }
  const event = pointerUtils.coordsToEvent({ page, client: page })
  const interactable = scope.interactables.new('test', {})
    .resizable({
      edges: { left: true, top: true, right: true, bottom: true },
      // use margin greater than width and height
      margin: Infinity,
    })
  const interaction = scope.interactions.new({})
  const rect = { left: 0, top: 0, right: 10, bottom: 10 }

  interaction.updatePointer(event, event, {}, true)

  t.deepEqual(
    scope.actions.resize.checker(event, event, interactable, {}, interaction, rect),
    {
      name: 'resize',
      edges: { left: true, top: true, right: false, bottom: false },
    },
  )

  page.x = 10
  interaction.updatePointer(event, event, {}, true)

  t.deepEqual(
    scope.actions.resize.checker(event, event, interactable, {}, interaction, rect),
    {
      name: 'resize',
      edges: { left: false, top: true, right: true, bottom: false },
    },
  )

  page.y = 10
  interaction.updatePointer(event, event, {}, true)

  t.deepEqual(
    scope.actions.resize.checker(event, event, interactable, {}, interaction, rect),
    {
      name: 'resize',
      edges: { left: false, top: false, right: true, bottom: true },
    },
  )

  t.end()
})
