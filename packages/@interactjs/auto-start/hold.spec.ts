import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'

import hold from './hold'

test('autoStart/hold', t => {
  const { scope } = helpers.testEnv({ plugins: [hold] })

  t.equal(scope.defaults.perAction.hold, 0, 'sets scope.defaults.perAction.hold')
  t.equal(scope.defaults.perAction.delay, 0, 'backwards compatible "delay" alias.')

  const holdDuration = 1000
  const actionName = 'TEST_ACTION'
  const interaction: any = {
    interactable: { options: { [actionName]: { hold: holdDuration } } },
    prepared: { name: actionName },
  }

  t.equal(
    hold.getHoldDuration(interaction),
    holdDuration,
    'gets holdDuration')

  const delayDuration = 500

  interaction.interactable.options[actionName].delay = delayDuration
  delete interaction.interactable.options[actionName].hold

  t.equal(
    hold.getHoldDuration(interaction),
    delayDuration,
    'gets holdDuration from "delay" value')

  t.end()
})
