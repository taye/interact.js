import type Interaction from '@interactjs/core/Interaction'
import * as helpers from '@interactjs/core/tests/_helpers'

import drop from '../drop/plugin'

describe('actions/drop', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

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
      const activeDrops = [...arg.interaction.dropState!.activeDrops]
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

    // rejected dropzones are removed from activeDrops
    expect(interaction.dropState!.activeDrops.map((d) => d.element)).toEqual([dropEl3])

    // rejected dropzones are deactivated
    expect(onDeactivate.mock.calls.map((arg) => arg[0].target)).toEqual([dropEl1, dropEl2])

    interaction.end()
  })

  test('targeting', () => {
    const interactionTarget = document.body.appendChild(document.createElement('div'))
    interactionTarget.id = 'target'
    const { scope, interactable, down, start, move, up, coords } = helpers.testEnv({
      plugins: [drop],
      target: interactionTarget,
    })

    interactable.draggable({})

    const [dropElA, dropElB, dropElC] = ['a', 'b', 'c'].map((id) => {
      const dropEl = scope.document.createElement('div')

      dropEl.dataset.drop = id
      scope.document.body.appendChild(dropEl)

      return dropEl
    })

    const onActivate = jest.fn((event) => event.target)
    const onDeactivate = jest.fn((event) => event.target)
    const onDragenter = jest.fn()
    const dropzone = scope.interactables
      .new('[data-drop]')
      .dropzone({
        checker: () => true,
      })
      .on({ dropactivate: onActivate, dropdeactivate: onDeactivate, dragenter: onDragenter })

    down()
    start({ name: 'drag' })
    expect(onActivate.mock.results.map(({ value }) => value)).toEqual([dropElA, dropElB, dropElC])
    expect(onDeactivate.mock.calls).toEqual([])
    expect(onDragenter.mock.calls).toEqual([])

    coords.page.x++
    move()

    expect(onDragenter.mock.calls.map(([{ target, relatedTarget }]) => [target, relatedTarget])).toEqual([
      [dropElC, interactionTarget],
    ])

    onDragenter.mockClear()

    // only b drop
    dropzone.dropzone({
      checker: (_dragEvent, _event, _dropped, _dropzone, dropElement) => dropElement.dataset.drop === 'b',
    })

    coords.page.x++
    move()

    expect(onDragenter.mock.calls.map((args) => [args[0].target, args[0].relatedTarget])).toEqual([
      [dropElB, interactionTarget],
    ])

    up()

    // all dropzones are deactivated
    expect(onDeactivate.mock.results.map(({ value }) => value)).toEqual([dropElA, dropElB, dropElC])
  })
})
