import type { InteractEvent } from '@interactjs/core/InteractEvent'
import extend from '@interactjs/utils/extend'

import { DropEvent } from '../drop/DropEvent'

const dz1: any = {
  target: 'dz1',
  fire: jest.fn(),
}
const dz2: any = {
  target: 'dz2',
  fire: jest.fn(),
}
const el1: any = Symbol('el1')
const el2: any = Symbol('el2')
const interactable: any = Symbol('interactable')
const dragElement: any = Symbol('drag-el')

describe('DropEvent', () => {
  describe('constructor', () => {
    const interaction: any = { dropState: {} }
    const dragEvent = Object.freeze({
      interactable,
      _interaction: interaction,
      target: dragElement,
      timeStamp: 10,
    }) as InteractEvent

    extend(interaction.dropState, {
      activeDrops: [
        { dropzone: dz1, element: el1 },
        { dropzone: dz2, element: el2 },
      ],
      cur: { dropzone: dz1, element: el1 },
      prev: { dropzone: dz2, element: el2 },
      events: {},
    })

    test('dropmove target, dropzone, relatedTarget props', () => {
      const dropmove = new DropEvent(interaction.dropState, dragEvent, 'dropmove')

      expect(dropmove.target).toBe(el1)
      expect(dropmove.dropzone).toBe(dz1)
      expect(dropmove.relatedTarget).toBe(dragElement)
    })

    test('dragleave target, dropzone, relatedTarget props', () => {
      const dragleave = new DropEvent(interaction.dropState, dragEvent, 'dragleave')

      expect(dragleave.target).toBe(el2)
      expect(dragleave.dropzone).toBe(dz2)
      expect(dragleave.relatedTarget).toBe(dragElement)
    })
  })

  describe('reject', () => {
    const interaction: any = { dropState: {} }
    const dragEvent = Object.freeze({
      interactable,
      _interaction: interaction,
      target: dragElement,
      timeStamp: 10,
    }) as InteractEvent

    test('dropactivate.reject()', () => {
      extend(interaction.dropState, {
        activeDrops: [
          { dropzone: dz1, element: el1 },
          { dropzone: dz2, element: el2 },
        ],
        cur: { dropzone: null, element: null },
        prev: { dropzone: null, element: null },
        events: {},
      })

      const dropactivate = new DropEvent(interaction.dropState, dragEvent, 'dropactivate')

      dropactivate.dropzone = dz1
      dropactivate.target = el1
      dropactivate.reject()

      // immediate propagation stopped on reject
      expect(dropactivate.propagationStopped && dropactivate.immediatePropagationStopped).toBe(true)

      // dropdeactivate is fired on rejected dropzone
      expect(dz1.fire).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'dropdeactivate' }))

      // activeDrop of rejected dropactivate event is removed
      expect(interaction.dropState.activeDrops).toEqual([{ dropzone: dz2, element: el2 }])
      expect(interaction.dropState.cur).toEqual({ dropzone: null, element: null })
    })

    test('dropmove.reject()', () => {
      extend(interaction.dropState, {
        cur: { dropzone: dz1, element: el1 },
        prev: { dropzone: null, element: null },
        events: {},
      })

      const dropmove = new DropEvent(interaction.dropState, dragEvent, 'dropmove')

      dropmove.reject()

      // dropState.cur remains the same after rejecting non activate event,
      expect(interaction.dropState.cur).toEqual({ dropzone: dz1, element: el1 })
      expect(interaction.dropState.rejected).toBe(true)

      // dragleave is fired on rejected dropzone
      expect(dz1.fire).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'dragleave' }))
    })
  })

  test('stop[Immediate]Propagation()', () => {
    const dropEvent = new DropEvent({ cur: {} } as any, {} as any, 'dragmove')

    expect(dropEvent.propagationStopped || dropEvent.immediatePropagationStopped).toBe(false)

    dropEvent.stopPropagation()
    expect(dropEvent.propagationStopped).toBe(true)
    expect(dropEvent.immediatePropagationStopped).toBe(false)

    dropEvent.propagationStopped = false

    dropEvent.stopImmediatePropagation()
    expect(dropEvent.propagationStopped && dropEvent.immediatePropagationStopped).toBe(true)
  })
})
