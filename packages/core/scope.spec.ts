import test from '@interactjs/_dev/test/test'
import * as helpers from '@interactjs/core/tests/_helpers'

test('scope', (t) => {
  const {
    scope,
    interactable,
    interaction,
    event,
  } = helpers.testEnv()

  interactable.options.test = { enabled: true }

  console.log(scope.interactions.list.length)
  interaction.pointerDown(event, event, scope.document.body)
  interaction.start({ name: 'test' }, interactable, scope.document.body)

  const started = interaction._interacting

  interactable.unset()

  const stopped = !interaction._interacting

  console.log({ started, stopped })
  t.ok(started && stopped, 'interaction is stopped on interactable.unset()')

  t.end()
})
