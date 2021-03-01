import * as helpers from '@interactjs/core/tests/_helpers'

import hold from './hold'

test('autoStart/hold', () => {
  const { scope } = helpers.testEnv({ plugins: [hold] })

  // sets scope.defaults.perAction.hold
  expect(scope.defaults.perAction.hold).toBe(0)
  // backwards compatible "delay" alias.
  expect(scope.defaults.perAction.delay).toBe(0)

  const holdDuration = 1000
  const actionName = 'TEST_ACTION'
  const interaction: any = {
    interactable: { options: { [actionName]: { hold: holdDuration } } },
    prepared: { name: actionName },
  }

  // gets holdDuration
  expect(hold.getHoldDuration(interaction)).toBe(holdDuration)

  const delayDuration = 500

  interaction.interactable.options[actionName].delay = delayDuration
  delete interaction.interactable.options[actionName].hold

  // gets holdDuration from "delay" value
  expect(hold.getHoldDuration(interaction)).toBe(delayDuration)
})
