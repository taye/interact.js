import type { ActionName } from '@interactjs/core/scope'

import * as helpers from './tests/_helpers'

test('core/scope', () => {
  const { scope, interactable, interaction, event } = helpers.testEnv()

  ;(interactable.options as any).test = { enabled: true }

  interaction.pointerDown(event, event, scope.document.body)
  interaction.start({ name: 'test' as ActionName }, interactable, scope.document.body)

  const started = interaction._interacting

  interactable.unset()

  const stopped = !interaction._interacting

  // interaction is stopped on interactable.unset()
  expect(started && stopped).toBe(true)

  const plugin1 = { id: '1', listeners: {} }
  const plugin2 = { id: '2', listeners: {} }
  const plugin3 = { id: '3', listeners: {}, before: ['2'] }
  const plugin4 = { id: '4', listeners: {}, before: ['2', '3'] }

  const initialListeners = scope.listenerMaps.map((l) => l.id)

  scope.usePlugin(plugin1)
  scope.usePlugin(plugin2)
  scope.usePlugin(plugin3)
  scope.usePlugin(plugin4)

  expect(scope.listenerMaps.map((l) => l.id)).toEqual([...initialListeners, '1', '4', '3', '2'])
})
