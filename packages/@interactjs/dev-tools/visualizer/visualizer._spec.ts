// eslint-disable import/first
import drag from '@interactjs/actions/drag/plugin'
import * as helpers from '@interactjs/core/tests/_helpers'
import type { PointerType } from '@interactjs/types'
import extend from '@interactjs/utils/extend'
import { newCoords, coordsToEvent } from '@interactjs/utils/pointerUtils'

// @ts-expect-error
import { Visualizer } from './Visualizer'

// import { mount } from '@vue/test-utils'
const mount: any = {}

// eslint-disable-next-line jest/no-disabled-tests
test.skip('devTools visualizer', async () => {
  const rect = Object.freeze({ top: 100, left: 200, bottom: 300, right: 400 })
  const { scope, interactable, interaction, target } = helpers.testEnv({ plugins: [drag], rect })
  const element = target as HTMLElement

  const wrapper = mount(Visualizer, {
    attachToDocument: true,
    propsData: { scope, show: true },
  })
  const nextTick = wrapper.vm.$nextTick

  const touches = [coordsToEvent(newCoords()), coordsToEvent(newCoords())].map(
    (touch, index) =>
      Object.assign(touch.coords, {
        pointerId: index,
        client: touch.page,
      }) as PointerType & typeof touch,
  )
  interactable.rectChecker(() => ({ ...rect }))

  await nextTick()

  // visualizer root is added to document
  expect(wrapper.findAll('#i-vis')).toHaveLength(1)

  interaction.pointerDown(touches[0], touches[0], element)
  await nextTick()
  // first crosshair is added to document
  expect(wrapper.findAll('.i-vis-crosshair[data-pointer-id="0"]')).toHaveLength(1)

  interaction.pointerDown(touches[1], touches[1], element)
  await nextTick()
  // second crosshair is added to document
  expect(wrapper.findAll('.i-vis-crosshair[data-pointer-id="1"]')).toHaveLength(2)

  extend(touches[0].page, { x: 100, y: 200 })
  extend(touches[1].page, { x: 300, y: 400 })
  interaction.pointerMove(touches[0], touches[0], element)
  interaction.pointerMove(touches[1], touches[1], element)

  await nextTick()
  touches.forEach((touch, id) => {
    // `pointer ${id} crosshair is at correct coordinates`
    expect(wrapper.find(`.i-vis-crosshair[data-pointer-id="${id}"]`).element.dataset).toEqual({
      x: touch.client.x.toString(),
      y: touch.client.y.toString(),
    })
  })

  interaction.start({ name: 'drag' }, interactable, element)
})
