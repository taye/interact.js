import test from '@interactjs/_dev/test/test'
import * as helpers from './tests/_helpers'

test('scope', (t) => {
  const {
    scope,
    interactable,
    interaction,
    event,
  } = helpers.testEnv()

  interactable.options.test = { enabled: true }

  interaction.pointerDown(event, event, scope.document.body)
  interaction.start({ name: 'test' }, interactable, scope.document.body)

  const started = interaction._interacting

  interactable.unset()

  const stopped = !interaction._interacting

  t.ok(started && stopped, 'interaction is stopped on interactable.unset()')

  t.end()
})
