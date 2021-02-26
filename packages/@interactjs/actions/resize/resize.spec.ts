import * as helpers from '@interactjs/core/tests/_helpers'

import type { ResizeEvent } from './plugin'
import resize from './plugin'

const { ltrbwh } = helpers

describe('actions/resize', () => {
  test('action init', () => {
    const { scope } = helpers.testEnv({
      plugins: [resize],
    })

    expect(scope.actions.map.resize).toBeTruthy()
    expect(scope.actions.methodDict.resize).toBe('resizable')
    expect(scope.Interactable.prototype.resizable).toEqual(expect.any(Function))
  })

  test('checker', () => {
    const rect = Object.freeze({ left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 })
    const { scope, interactable, interaction, coords, target, down, start, move } = helpers.testEnv({
      plugins: [resize],
      rect,
    })

    const element = target as HTMLElement
    const checkArg = {
      action: null,
      interactable,
      interaction,
      element,
      rect,
      buttons: 0,
    }

    interactable.resizable({
      edges: { left: true, top: true, right: true, bottom: true },
      // use margin greater than width and height
      margin: Infinity,
    })

    // resize top left
    down()
    scope.fire('auto-start:check', checkArg)
    expect(checkArg.action).toEqual({
      name: 'resize',
      edges: { left: true, top: true, right: false, bottom: false },
    })

    // resize top right
    coords.page.x = 10
    move()

    scope.fire('auto-start:check', checkArg)
    expect(checkArg.action).toEqual({
      name: 'resize',
      edges: { left: false, top: true, right: true, bottom: false },
    })

    // resize bottom right
    coords.page.y = 10
    move()

    scope.fire('auto-start:check', checkArg)
    expect(checkArg.action).toEqual({
      name: 'resize',
      edges: { left: false, top: false, right: true, bottom: true },
    })

    const zeroRect = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }
    let resizeEvent: ResizeEvent = null

    interactable.on('resizestart resizemove resizeend', (e) => {
      resizeEvent = e
    })

    coords.page.x = rect.right
    coords.page.y = rect.bottom
    down()
    start({ name: 'resize', edges: { bottom: true, right: true } })

    // sets starting correct interaction._rects
    expect(interaction._rects).toEqual({
      start: rect,
      corrected: rect,
      previous: rect,
      delta: zeroRect,
    })
    // sets starting correct interaction.rect
    expect(interaction.rect).toEqual(rect)
    // resizestart event has extra resize props
    expect(hasResizeProps(resizeEvent)).toBe(true)

    coords.page.x = -100
    coords.page.y = -200
    resizeEvent = null
    move()

    // `invert: 'none'` interaction._rects are correct
    expect(interaction._rects).toEqual({
      start: rect,
      corrected: zeroRect,
      previous: rect,
      delta: ltrbwh(0, 0, -rect.width, -rect.bottom, -rect.width, -rect.height),
    })
    // `invert: 'none'` interaction.rect is correct
    expect(interaction.rect).toEqual(ltrbwh(0, 0, -100, -200, -100, -200))
    // resizemove event has extra resize props
    expect(hasResizeProps(resizeEvent)).toBe(true)

    interactable.options.resize.invert = 'reposition'
    interaction.move()

    // `invert: 'reposition'` interaction._rects
    expect(interaction._rects).toEqual({
      start: rect,
      corrected: ltrbwh(-100, -200, 0, 0, 100, 200),
      previous: interaction._rects.previous, // not testing previous
      delta: ltrbwh(-100, -200, 0, 0, 100, 200),
    })

    interaction.move()
    interactable.options.resize.invert = 'negate'
    interaction.move()

    // invert: 'negate' interaction._rects
    expect(interaction._rects).toEqual({
      start: rect,
      corrected: ltrbwh(0, 0, -100, -200, -100, -200),
      previous: interaction._rects.previous, // not testing previous
      delta: ltrbwh(100, 200, -100, -200, -200, -400),
    })

    resizeEvent = null
    interaction.end()
    // resizeend event has extra resize props
    expect(hasResizeProps(resizeEvent)).toBe(true)
  })
})

function hasResizeProps (event: ResizeEvent) {
  return !!(event.deltaRect && event.rect && event.edges)
}
