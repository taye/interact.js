import type Interaction from '@interactjs/core/Interaction'
import * as helpers from '@interactjs/core/tests/_helpers'

import drop from '../drop/plugin'

describe('actions/drop', () => {
  test('options', () => {
    const { interactable } = helpers.testEnv({ plugins: [drop] })

    const funcs = Object.freeze({
      drop () {},
      activate () {},
      deactivate () {},
      dropmove () {},
      dragenter () {},
      dragleave () {},
    })

    interactable.dropzone({
      listeners: [funcs],
    })

    expect(interactable.events.types.drop[0]).toBe(funcs.drop)
    expect(interactable.events.types.dropactivate[0]).toBe(funcs.activate)
    expect(interactable.events.types.dropdeactivate[0]).toBe(funcs.deactivate)
    expect(interactable.events.types.dropmove[0]).toBe(funcs.dropmove)
    expect(interactable.events.types.dragenter[0]).toBe(funcs.dragenter)
    expect(interactable.events.types.dragleave[0]).toBe(funcs.dragleave)
  })

  test('dynamicDrop', () => {
    const { scope, interactable, down, start, move, interaction } = helpers.testEnv({ plugins: [drop] })
    interactable.draggable({})

    // no error with dynamicDrop === false
    expect(() => {
      scope.interactStatic.dynamicDrop(false)

      down()
      start({ name: 'drag' })
      move()
      interaction.end()
    }).not.toThrow()

    //  no error with dynamicDrop === true
    expect(() => {
      scope.interactStatic.dynamicDrop(true)
      down()
      start({ name: 'drag' })
      move()
      interaction.end()
    }).not.toThrow()
  })

  test('start', () => {
    const { scope, interactable, down, start, move, interaction } = helpers.testEnv({ plugins: [drop] })

    interactable.draggable({})
    const dropzone = scope.interactables.new('[data-drop]').dropzone({})

    const [dropEl1, dropEl2, dropEl3] = ['a', 'b', 'c'].map((id) => {
      const dropEl = scope.document.createElement('div')

      dropEl.dataset.drop = id
      scope.document.body.appendChild(dropEl)

      return dropEl
    })

    // rejet imeediately on activate
    dropzone.on('dropactivate', (event) => {
      if (event.target === dropEl1 || event.target === dropEl2) {
        event.reject()
      }
    })

    const onActionsDropStart = jest.fn((arg: { interaction: Interaction }) => {
      const activeDrops = [...arg.interaction.dropState.activeDrops]
      // actions/drop:start is fired with all activeDrops
      expect(activeDrops.map((activeDrop) => activeDrop.element)).toEqual([dropEl3])
    })

    scope.addListeners({ 'actions/drop:start': onActionsDropStart })

    const onDeactivate = jest.fn()
    dropzone.on('dropdeactivate', onDeactivate)

    down()
    start({ name: 'drag' })
    move()

    expect(onActionsDropStart).toHaveBeenCalledTimes(1)

    // rejected dropzones are removed from activeDrops,
    expect(interaction.dropState.activeDrops.map((d) => d.element)).toEqual([dropEl3])

    // rejected dropzones are deactivated,
    expect(onDeactivate).toHaveBeenNthCalledWith(1, expect.objectContaining({ target: dropEl1 }))
    expect(onDeactivate).toHaveBeenNthCalledWith(2, expect.objectContaining({ target: dropEl2 }))

    interaction.end()
  })
})
