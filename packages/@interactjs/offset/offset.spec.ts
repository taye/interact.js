import * as helpers from '@interactjs/core/tests/_helpers'

import offset from './plugin'

test('plugins/spring', () => {
  const { interaction, event, coords, target } = helpers.testEnv({ plugins: [offset] })

  const body = target as HTMLBodyElement

  interaction.pointerMove(event, event, body)
  interaction.offsetBy({ x: 100, y: 100 })
  interaction.pointerMove(event, event, body)

  // coords are not updated when pointer is not down
  expect(interaction.coords.cur.page).toEqual(coords.page)

  interaction.pointerUp(event, event, body, body)
  interaction.stop()
  interaction.pointerDown(event, event, body)
  interaction.offsetBy({ x: 100, y: 50 })
  interaction.pointerMove(event, event, body)

  // coords are not updated when pointer is not down
  expect(interaction.coords.cur.page).toEqual({ x: coords.page.x + 100, y: coords.page.y + 50 })
})
