import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'
import Signals from '@interactjs/utils/Signals'
import hold from './hold'
import { autoStart } from './index'

test('autoStart/hold', (t) => {
  const scope = helpers.mockScope({
    autoStart: {
      defaults: {
        perAction: {},
      },
      signals: new Signals(),
    },
  })
  const autoStartHold = hold
  scope.usePlugin(autoStart)
  scope.usePlugin(autoStartHold)

  t.equal(scope.defaults.perAction.hold, 0, 'sets scope.defaults.perAction.hold')
  t.equal(scope.defaults.perAction.delay, 0, 'backwards compatible "delay" alias.')

  const holdDuration = 1000
  const actionName = 'TEST_ACTION'
  const interaction: any = {
    interactable: { options: { [actionName]: { hold: holdDuration } } },
    prepared: { name: actionName },
  }

  t.equal(
    autoStartHold.getHoldDuration(interaction),
    holdDuration,
    'gets holdDuration')

  const delayDuration = 500

  interaction.interactable.options[actionName].delay = delayDuration
  delete interaction.interactable.options[actionName].hold

  t.equal(
    autoStartHold.getHoldDuration(interaction),
    delayDuration,
    'gets holdDuration from "delay" value')

  t.end()
})
