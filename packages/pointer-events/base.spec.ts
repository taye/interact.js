import test from '@interactjs/_dev/test/test'
import Eventable from '@interactjs/core/Eventable'
import Interaction from '@interactjs/core/Interaction'
import * as helpers from '@interactjs/core/tests/_helpers'
import pointerEvents, { EventTargetList } from './base'
import interactableTargets from './interactableTargets'

test('pointerEvents.types', (t) => {
  t.deepEqual(pointerEvents.types,
    [
      'down',
      'move',
      'up',
      'cancel',
      'tap',
      'doubletap',
      'hold',
    ],
    'pointerEvents.types is as expected')

  t.end()
})

test('pointerEvents.fire', (t) => {
  const scope: Interact.Scope = helpers.mockScope()

  const eventable = new Eventable(pointerEvents.defaults)
  const type = 'TEST'
  const element = {}
  const eventTarget = {}
  const TEST_PROP = ['TEST_PROP']
  let firedEvent
  const targets: EventTargetList = [{
    eventable,
    node: element as Node,
    props: {
      TEST_PROP,
    },
  }]

  eventable.on(type, (event) => { firedEvent = event })

  pointerEvents.fire({
    type,
    eventTarget,
    pointer: {},
    event: {},
    interaction: {},
    targets,
  } as any, scope)

  t.ok(firedEvent instanceof pointerEvents.PointerEvent,
    'Fired event is an instance of pointerEvents.PointerEvent')
  t.equal(firedEvent.type, type,
    'Fired event type is correct')
  t.equal(firedEvent.currentTarget, element,
    'Fired event currentTarget is correct')
  t.equal(firedEvent.target, eventTarget,
    'Fired event target is correct')
  t.equal(firedEvent.TEST_PROP, TEST_PROP,
    'Fired event has props from target.props')

  const tapTime = 500
  const interaction = Object.assign(
    scope.interactions.new({}),
    { tapTime: -1, prevTap: null })

  interaction.updatePointer({} as any, {} as any, null)

  const tapEvent = Object.assign(new pointerEvents.PointerEvent('tap', {} as any, {} as any, null, interaction, 0), {
    timeStamp: tapTime,
  })

  pointerEvents.fire({
    pointerEvent: tapEvent,
    interaction,
    targets: [{
      eventable,
      element,
    }],
  } as any, scope)

  t.equal(interaction.tapTime, tapTime,
    'interaction.tapTime is updated')
  t.equal(interaction.prevTap, tapEvent,
    'interaction.prevTap is updated')

  t.end()
})

test('pointerEvents.collectEventTargets', (t) => {
  const type = 'TEST'
  const TEST_PROP = ['TEST_PROP']
  const target = {
    node: {} as Node,
    props: { TEST_PROP },
    eventable: new Eventable(pointerEvents.defaults),
  }
  let collectedTargets

  function onCollect ({ targets }: { targets: EventTargetList }) {
    targets.push(target)

    collectedTargets = targets
  }

  pointerEvents.signals.on('collect-targets', onCollect)
  pointerEvents.collectEventTargets({
    interaction: new Interaction({ signals: helpers.mockSignals() } as any),
    pointer: {},
    event: {},
    eventTarget: {},
    type,
  } as any)

  t.deepEqual(collectedTargets, [target])

  pointerEvents.signals.off('collect-targets', onCollect)

  t.end()
})

test('pointerEvents Interaction update-pointer signal', (t) => {
  const scope: Interact.Scope = helpers.mockScope()

  scope.usePlugin(pointerEvents)

  const interaction = scope.interactions.new({})
  const initialHold = { duration: Infinity, timeout: null }
  const event = {} as Interact.PointerEventType

  interaction.updatePointer(helpers.newPointer(0), event, null, false)
  t.deepEqual(interaction.pointers.map((p) => p.hold), [initialHold], 'set hold info for move on new pointer')

  interaction.removePointer(helpers.newPointer(0), event)

  interaction.updatePointer(helpers.newPointer(0), event, null, true)
  t.deepEqual(interaction.pointers.map((p) => p.hold), [initialHold])

  interaction.updatePointer(helpers.newPointer(5), event, null, true)
  t.deepEqual(interaction.pointers.map((p) => p.hold), [initialHold, initialHold])

  t.end()
})

test('pointerEvents Interaction remove-pointer signal', (t) => {
  const scope: Interact.Scope = helpers.mockScope()

  scope.usePlugin(pointerEvents)

  const interaction = scope.interactions.new({})

  const ids = [0, 1, 2, 3]
  const removals = [
    { id: 0, remain: [1, 2, 3], message: 'first of 4'  },
    { id: 2, remain: [1,    3], message: 'middle of 3' },
    { id: 3, remain: [1      ], message: 'last of 2'   },
    { id: 1, remain: [       ], message: 'final'       },
  ]

  for (const id of ids) {
    const index = interaction.updatePointer({ pointerId: id } as Interact.PointerType, {} as Interact.PointerEventType, null, true)
    // use the ids as the pointerInfo.hold value for this test
    interaction.pointers[index].hold = id as any
  }

  for (const removal of removals) {
    interaction.removePointer({ pointerId: removal.id } as any, null)

    t.deepEqual(interaction.pointers.map((p) => p.hold as unknown as number), removal.remain,
      `${removal.message} - remaining interaction.holdTimers is correct`)
  }

  t.end()
})

test('pointerEvents down hold up tap', async (t) => {
  const {
    interaction,
    event,
    interactable,
  } = helpers.testEnv({ plugins: [pointerEvents, interactableTargets ] })

  const fired: PointerEvent[] = []

  for (const type of pointerEvents.types) {
    interactable.on(type, (e) => fired.push(e))
  }

  interaction.pointerDown(event, event, event.target)
  interaction.pointerMove(event, event, event.target)

  t.deepEqual(
    fired.map((e) => e.type),
    ['down'],
    'duplicate move event is not fired')

  const holdTimer = interaction.pointers[0].hold

  t.ok(!!holdTimer.timeout, 'hold timeout is set')

  await helpers.timeout(holdTimer.duration)

  interaction.pointerUp(event, event, event.target, event.target)

  t.deepEqual(
    fired.map((e) => e.type),
    ['down', 'hold', 'up', 'tap'],
    'tap event is fired after down, hold and up events')

  t.end()
})
