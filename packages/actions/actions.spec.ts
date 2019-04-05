import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'
import pointerUtils from '@interactjs/utils/pointerUtils'
import * as actions from './index'

test('actions integration', (t) => {
  const scope: Interact.Scope = helpers.mockScope()
  const event = pointerUtils.coordsToEvent(pointerUtils.newCoords())
  const element = scope.document.body

  scope.usePlugin(actions)

  const interactable = scope.interactables.new(element)
  // make a dropzone
  scope.interactables.new(scope.document.documentElement).dropzone({})
  const interaction1 = scope.interactions.new({})

  interaction1.pointerDown(event, event, element)

  for (const name of scope.actions.names) {
    interaction1.start({ name }, interactable, element)
    interaction1.stop()

    t.doesNotThrow(() => {
      t.notOk(interaction1.interacting(), `${name} interaction starts and stops as expected`)
    }, `${name} start and stop does not throw`)
  }

  for (const order of [scope.actions.names, [...scope.actions.names].reverse()]) {
    const interaction2 = scope.interactions.new({})

    for (const name of order) {
      t.doesNotThrow(() => {
        interaction2.start({ name }, interactable, element)
        interaction2.pointerMove(event, event, element)
        interaction2.pointerUp(event, event, element, element)

        t.notOk(interaction2.interacting(), `${name} interaction starts, moves and ends as expected`)
      }, `${name} sequence does not throw`)
    }
  }

  t.end()
})
