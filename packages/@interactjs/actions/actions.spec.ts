import type { Scope, ActionName } from '@interactjs/core/scope'
import * as helpers from '@interactjs/core/tests/_helpers'
import * as pointerUtils from '@interactjs/utils/pointerUtils'

import actions from './plugin'

describe('actions integration', () => {
  const scope: Scope = helpers.mockScope()
  const event = pointerUtils.coordsToEvent(pointerUtils.newCoords())
  const element = scope.document.body

  scope.usePlugin(actions)

  const interactable = scope.interactables.new(element)
  // make a dropzone
  scope.interactables.new(scope.document.documentElement).dropzone({})
  const interaction1 = scope.interactions.new({})

  interaction1.pointerDown(event, event, element)

  for (const name in scope.actions.map) {
    test(`${name} interaction starts and stops as expected`, () => {
      interaction1.start({ name: name as ActionName }, interactable, element)
      interaction1.stop()

      expect(() => {
        interaction1.interacting()
      }).not.toThrow()

      expect(interaction1.interacting()).toBe(false)
    })
  }

  const actionNames = Object.keys(scope.actions.map)

  for (const order of [actionNames, [...actionNames].reverse()] as ActionName[][]) {
    const interaction2 = scope.interactions.new({})

    for (const name of order) {
      test(`${name} interaction starts, moves and ends as expected`, () => {
        expect(() => {
          interaction2.start({ name }, interactable, element)
          interaction2.pointerMove(event, event, element)
          interaction2.pointerUp(event, event, element, element)
        }).not.toThrow()

        expect(interaction2.interacting()).toBe<boolean>(false)
      })
    }
  }
})
