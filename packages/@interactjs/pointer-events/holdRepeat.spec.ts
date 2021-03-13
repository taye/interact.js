import { Eventable } from '@interactjs/core/Eventable'
import * as helpers from '@interactjs/core/tests/_helpers'

import holdRepeat from './holdRepeat'

test('holdRepeat count', () => {
  const pointerEvent = {
    type: 'hold',
    count: 0,
  }

  const { scope } = helpers.testEnv({ plugins: [holdRepeat] })

  scope.fire('pointerEvents:new', { pointerEvent } as any)
  // first hold count is 1 with count previously undefined
  expect(pointerEvent.count).toBe(1)

  const count = 20
  pointerEvent.count = count
  scope.fire('pointerEvents:new', { pointerEvent } as any)
  // existing hold count is incremented
  expect(pointerEvent.count).toBe(count + 1)
})

test('holdRepeat onFired', () => {
  const { scope, interaction } = helpers.testEnv({ plugins: [holdRepeat] })

  const pointerEvent = {
    type: 'hold',
  }
  const eventTarget = {}
  const eventable = new Eventable(
    Object.assign({}, scope.pointerEvents.defaults, {
      holdRepeatInterval: 0,
    }),
  )
  const signalArg = {
    interaction,
    pointerEvent,
    eventTarget,
    targets: [
      {
        eventable,
      },
    ],
  }

  scope.fire('pointerEvents:fired', signalArg as any)
  // interaction interval handle was not saved with 0 holdRepeatInterval
  expect('holdIntervalHandle' in interaction).toBe(false)

  eventable.options.holdRepeatInterval = 10
  scope.fire('pointerEvents:fired', signalArg as any)
  // interaction interval handle was saved with interval > 0
  expect('holdIntervalHandle' in interaction).toBe(true)

  clearInterval(interaction.holdIntervalHandle)

  pointerEvent.type = 'NOT_HOLD'
  delete interaction.holdIntervalHandle
  scope.fire('pointerEvents:fired', signalArg as any)
  // interaction interval handle is not saved if pointerEvent.type is not "hold"
  expect('holdIntervalHandle' in interaction).toBe(false)
})
