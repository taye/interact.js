import test from '@interactjs/_dev/test/test'
import Eventable from '@interactjs/core/Eventable'
import * as helpers from '@interactjs/core/tests/_helpers'
import Signals from '@interactjs/utils/Signals'
import pointerEvents from './base'
import holdRepeat from './holdRepeat'

function mockScope () {
  return helpers.mockScope({
    pointerEvents: {
      defaults: {},
      signals: new Signals(),
      types: [],
      fire: () => {},
    },
  })
}

test('holdRepeat count', (t) => {
  const pointerEvent = {
    type: 'hold',
    count: 0,
  }

  const { scope } = helpers.testEnv({ plugins: [pointerEvents, holdRepeat] })

  scope.pointerEvents.signals.fire('new', { pointerEvent })
  t.equal(pointerEvent.count, 1, 'first hold count is 1 with count previously undefined')

  const count = 20
  pointerEvent.count = count
  scope.pointerEvents.signals.fire('new', { pointerEvent })
  t.equal(pointerEvent.count, count + 1, 'existing hold count is incremented')

  t.end()
})

test('holdRepeat onFired', (t) => {
  const scope = mockScope()
  scope.usePlugin(pointerEvents)
  scope.usePlugin(holdRepeat)

  const interaction = scope.interactions.new({})
  const pointerEvent = {
    type: 'hold',
  }
  const eventTarget = {}
  const eventable = new Eventable(Object.assign({}, scope.pointerEvents.defaults, {
    holdRepeatInterval: 0,
  }))
  const signalArg = {
    interaction,
    pointerEvent,
    eventTarget,
    targets: [{
      eventable,
    }],
  }

  scope.pointerEvents.signals.fire('fired', signalArg)
  t.notOk('holdIntervalHandle' in interaction,
    'interaction interval handle was not saved with 0 holdRepeatInterval')

  eventable.options.holdRepeatInterval = 10
  scope.pointerEvents.signals.fire('fired', signalArg)
  t.ok('holdIntervalHandle' in interaction,
    'interaction interval handle was saved with interval > 0')

  clearInterval(interaction.holdIntervalHandle)

  pointerEvent.type = 'NOT_HOLD'
  delete interaction.holdIntervalHandle
  scope.pointerEvents.signals.fire('fired', signalArg)
  t.notOk('holdIntervalHandle' in interaction,
    'interaction interval handle is not saved if pointerEvent.type is not "hold"')

  t.end()
})
