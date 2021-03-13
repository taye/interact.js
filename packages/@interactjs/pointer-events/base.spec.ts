import { Eventable } from '@interactjs/core/Eventable'
import type { Scope } from '@interactjs/core/scope'
import * as helpers from '@interactjs/core/tests/_helpers'
import type { PointerEventType, PointerType } from '@interactjs/types/index'

import type { EventTargetList } from './base'
import pointerEvents from './base'
import interactableTargets from './interactableTargets'

test('pointerEvents.types', () => {
  expect(pointerEvents.types).toEqual({
    down: true,
    move: true,
    up: true,
    cancel: true,
    tap: true,
    doubletap: true,
    hold: true,
  })
})

test('pointerEvents.fire', () => {
  const { scope, interaction, event, coords } = helpers.testEnv({ plugins: [pointerEvents] })

  const eventable = new Eventable(pointerEvents.defaults)
  const type = 'TEST'
  const element = {}
  const eventTarget = {}
  const TEST_PROP = ['TEST_PROP']
  let firedEvent: any
  const targets: EventTargetList = [
    {
      eventable,
      node: element as Node,
      props: {
        TEST_PROP,
      },
    },
  ]

  eventable.on(type, (e) => {
    firedEvent = e
  })

  pointerEvents.fire(
    {
      type,
      eventTarget,
      pointer: {},
      event: {},
      interaction: {},
      targets,
    } as any,
    scope,
  )

  // Fired event is an instance of pointerEvents.PointerEvent
  expect(firedEvent instanceof pointerEvents.PointerEvent).toBe(true)
  // Fired event type is correct
  expect(firedEvent.type).toBe(type)
  // Fired event currentTarget is correct
  expect(firedEvent.currentTarget).toBe(element)
  // Fired event target is correct
  expect(firedEvent.target).toBe(eventTarget)
  // Fired event has props from target.props
  expect(firedEvent.TEST_PROP).toBe(TEST_PROP)

  scope.now = () => coords.timeStamp

  coords.timeStamp = 0
  interaction.pointerDown(event, event, scope.document)
  coords.timeStamp = 500
  interaction.pointerUp(event, event, scope.document, scope.document)

  // interaction.tapTime is updated
  expect(interaction.tapTime).toBe(500)
  // interaction.prevTap is updated
  expect(interaction.prevTap.type).toBe('tap')
})

test('pointerEvents.collectEventTargets', () => {
  const { scope, interaction } = helpers.testEnv()

  const type = 'TEST'
  const TEST_PROP = ['TEST_PROP']
  const target = {
    node: {} as Node,
    props: { TEST_PROP },
    eventable: new Eventable(pointerEvents.defaults),
  }
  let collectedTargets: EventTargetList

  function onCollect ({ targets }: { targets?: EventTargetList }) {
    targets.push(target)

    collectedTargets = targets
  }

  scope.addListeners({
    'pointerEvents:collect-targets': onCollect,
  })

  pointerEvents.collectEventTargets(
    {
      interaction,
      pointer: {},
      event: {},
      eventTarget: {},
      type,
    } as any,
    scope,
  )

  expect(collectedTargets).toEqual([target])
})

test('pointerEvents Interaction update-pointer signal', () => {
  const scope: Scope = helpers.mockScope()

  scope.usePlugin(pointerEvents)

  const interaction = scope.interactions.new({})
  const initialHold = { duration: Infinity, timeout: null as number }
  const event = {} as PointerEventType

  interaction.updatePointer(helpers.newPointer(0), event, null, false)
  // set hold info for move on new pointer
  expect(interaction.pointers.map((p) => p.hold)).toEqual([initialHold])

  interaction.removePointer(helpers.newPointer(0), event)

  interaction.updatePointer(helpers.newPointer(0), event, null, true)
  expect(interaction.pointers.map((p) => p.hold)).toEqual([initialHold])

  interaction.updatePointer(helpers.newPointer(5), event, null, true)
  expect(interaction.pointers.map((p) => p.hold)).toEqual([initialHold, initialHold])
})

test('pointerEvents Interaction remove-pointer signal', () => {
  const scope: Scope = helpers.mockScope()

  scope.usePlugin(pointerEvents)

  const interaction = scope.interactions.new({})

  const ids = [0, 1, 2, 3]
  const removals = [
    { id: 0, remain: [1, 2, 3], message: 'first of 4' },
    { id: 2, remain: [1, 3], message: 'middle of 3' },
    { id: 3, remain: [1], message: 'last of 2' },
    { id: 1, remain: [], message: 'final' },
  ]

  for (const id of ids) {
    const index = interaction.updatePointer(
      { pointerId: id } as PointerType,
      {} as PointerEventType,
      null,
      true,
    )
    // use the ids as the pointerInfo.hold value for this test
    interaction.pointers[index].hold = id as any
  }

  for (const removal of removals) {
    interaction.removePointer({ pointerId: removal.id } as any, null)

    // `${removal.message} - remaining interaction.pointers[i].hold are correct`
    expect(interaction.pointers.map((p) => (p.hold as unknown) as number)).toEqual(removal.remain)
  }
})

test('pointerEvents down hold up tap', async () => {
  const { interaction, event, interactable } = helpers.testEnv({
    plugins: [pointerEvents, interactableTargets],
  })

  const fired: PointerEvent[] = []

  for (const type in pointerEvents.types) {
    interactable.on(type, (e) => fired.push(e))
  }

  interaction.pointerDown(event, event, event.target)
  interaction.pointerMove(event, event, event.target)

  // duplicate move event is not fired
  expect(fired.map((e) => e.type)).toEqual(['down'])

  const holdTimer = interaction.pointers[0].hold

  // hold timeout is set
  expect(holdTimer.timeout).toBeTruthy()

  await helpers.timeout(holdTimer.duration)

  interaction.pointerUp(event, event, event.target, event.target)

  // tap event is fired after down, hold and up events
  expect(fired.map((e) => e.type)).toEqual(['down', 'hold', 'up', 'tap'])
})
