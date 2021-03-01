import drag from '@interactjs/actions/drag/plugin'
import drop from '@interactjs/actions/drop/plugin'
import autoStart from '@interactjs/auto-start/base'
import type { PointerType } from '@interactjs/types/index'
import extend from '@interactjs/utils/extend'
import * as pointerUtils from '@interactjs/utils/pointerUtils'

import type { EventPhase } from './InteractEvent'
import { InteractEvent } from './InteractEvent'
import { Interaction } from './Interaction'
import * as helpers from './tests/_helpers'

describe('core/Interaction', () => {
  test('constructor', () => {
    const testType = 'test'
    const dummyScopeFire = () => {}
    const interaction = new Interaction({
      pointerType: testType,
      scopeFire: dummyScopeFire,
    })
    const zeroCoords = {
      page: { x: 0, y: 0 },
      client: { x: 0, y: 0 },
      timeStamp: 0,
    }

    // scopeFire option is set assigned to interaction._scopeFire
    expect(interaction._scopeFire).toBe(dummyScopeFire)

    expect(interaction.prepared).toEqual(expect.any(Object))
    expect(interaction.downPointer).toEqual(expect.any(Object))

    // `interaction.coords.${coordField} set to zero`
    expect(interaction.coords).toEqual({
      start: zeroCoords,
      cur: zeroCoords,
      prev: zeroCoords,
      delta: zeroCoords,
      velocity: zeroCoords,
    })

    // interaction.pointerType is set
    expect(interaction.pointerType).toBe(testType)
    // interaction.pointers is initially an empty array
    expect(interaction.pointers).toEqual([])
    // false properties
    expect(interaction).toMatchObject({ pointerIsDown: false, pointerWasMoved: false, _interacting: false })
    expect(interaction.pointerType).not.toBe('mouse')
  })

  test('Interaction destroy', () => {
    const { interaction } = helpers.testEnv()
    const pointer = { pointerId: 10 } as any
    const event = {} as any

    interaction.updatePointer(pointer, event, null)

    interaction.destroy()

    // interaction._latestPointer.pointer is null
    expect(interaction._latestPointer.pointer).toBeNull()

    // interaction._latestPointer.event is null
    expect(interaction._latestPointer.event).toBeNull()

    // interaction._latestPointer.eventTarget is null
    expect(interaction._latestPointer.eventTarget).toBeNull()
  })

  test('Interaction.getPointerIndex', () => {
    const { interaction } = helpers.testEnv()

    interaction.pointers = [2, 4, 5, 0, -1].map((id) => ({ id })) as any

    interaction.pointers.forEach(({ id }, index) => {
      expect(interaction.getPointerIndex({ pointerId: id } as any)).toBe(index)
    })
  })

  describe('Interaction.updatePointer', () => {
    test('no existing pointers', () => {
      const { interaction } = helpers.testEnv()
      const pointer = { pointerId: 10 } as any
      const event = {} as any

      const ret = interaction.updatePointer(pointer, event, null)

      // interaction.pointers == [{ pointer, ... }]
      expect(interaction.pointers).toEqual([
        {
          id: pointer.pointerId,
          pointer,
          event,
          downTime: null,
          downTarget: null,
        },
      ])
      // new pointer index is returned
      expect(ret).toBe(0)
    })

    test('new pointer with exisiting pointer', () => {
      const { interaction } = helpers.testEnv()
      const existing: any = { pointerId: 0 }
      const event: any = {}

      interaction.updatePointer(existing, event, null)

      const newPointer: any = { pointerId: 10 }
      const ret = interaction.updatePointer(newPointer, event, null)

      // interaction.pointers == [{ pointer: existing, ... }, { pointer: newPointer, ... }]
      expect(interaction.pointers).toEqual([
        {
          id: existing.pointerId,
          pointer: existing,
          event,
          downTime: null,
          downTarget: null,
        },
        {
          id: newPointer.pointerId,
          pointer: newPointer,
          event,
          downTime: null,
          downTarget: null,
        },
      ])

      // second pointer index is 1
      expect(ret).toBe(1)
    })

    test('update existing pointers', () => {
      const { interaction } = helpers.testEnv()

      const oldPointers = [-3, 10, 2].map((pointerId) => ({ pointerId }))
      const newPointers = oldPointers.map((pointer) => ({ ...pointer, new: true }))

      oldPointers.forEach((pointer: any) => interaction.updatePointer(pointer, pointer, null))
      newPointers.forEach((pointer: any) => interaction.updatePointer(pointer, pointer, null))

      // number of pointers is unchanged
      expect(interaction.pointers).toHaveLength(oldPointers.length)

      interaction.pointers.forEach((pointerInfo, i) => {
        // `pointer[${i}].id is the same`
        expect(pointerInfo.id).toBe(oldPointers[i].pointerId)
        // `new pointer ${i} !== old pointer object`
        expect(pointerInfo.pointer).not.toBe(oldPointers[i])
      })
    })
  })

  test('Interaction.removePointer', () => {
    const { interaction } = helpers.testEnv()
    const ids = [0, 1, 2, 3]
    const removals = [
      { id: 0, remain: [1, 2, 3], message: 'first of 4' },
      { id: 2, remain: [1, 3], message: 'middle of 3' },
      { id: 3, remain: [1], message: 'last of 2' },
      { id: 1, remain: [], message: 'final' },
    ]

    ids.forEach((pointerId) => interaction.updatePointer({ pointerId } as any, {} as any, null))

    for (const removal of removals) {
      interaction.removePointer({ pointerId: removal.id } as PointerType, null)

      // `${removal.message} - remaining interaction.pointers is correct`
      expect(interaction.pointers.map((p) => p.id)).toEqual(removal.remain)
    }
  })

  test('Interaction.pointer{Down,Move,Up} updatePointer', () => {
    const { scope, interaction } = helpers.testEnv()
    const eventTarget: any = {}
    const pointer: any = {
      target: eventTarget,
      pointerId: 0,
    }
    let info: any = {}

    scope.addListeners({
      'interactions:update-pointer': (arg) => {
        info.updated = arg.pointerInfo
      },
      'interactions:remove-pointer': (arg) => {
        info.removed = arg.pointerInfo
      },
    })

    interaction.coords.cur.timeStamp = 0
    const commonPointerInfo: any = {
      id: 0,
      pointer,
      event: pointer,
      downTime: null,
      downTarget: null,
    }

    interaction.pointerDown(pointer, pointer, eventTarget)
    // interaction.pointerDown updates pointer
    expect(info.updated).toEqual({
      ...commonPointerInfo,
      downTime: interaction.coords.cur.timeStamp,
      downTarget: eventTarget,
    })
    // interaction.pointerDown doesn't remove pointer
    expect(info.removed).toBeUndefined()
    interaction.removePointer(pointer, null)
    info = {}

    interaction.pointerMove(pointer, pointer, eventTarget)
    // interaction.pointerMove updates pointer
    expect(info.updated).toEqual(commonPointerInfo)
    // interaction.pointerMove doesn't remove pointer
    expect(info.removed).toBeUndefined()
    info = {}

    interaction.pointerUp(pointer, pointer, eventTarget, null)
    // interaction.pointerUp doesn't update existing pointer
    expect(info.updated).toBeUndefined()
    info = {}

    interaction.pointerUp(pointer, pointer, eventTarget, null)
    // interaction.pointerUp updates non existing pointer
    expect(info.updated).toEqual(commonPointerInfo)
    // interaction.pointerUp also removes pointer
    expect(info.removed).toEqual(commonPointerInfo)
    info = {}
  })

  test('Interaction.pointerDown', () => {
    const { interaction, scope, coords, event, target } = helpers.testEnv()
    let signalArg: any

    const coordsSet = helpers.newCoordsSet()
    scope.now = () => coords.timeStamp

    extend(coords, {
      target,
      type: 'down',
    })

    const signalListener = (arg: any) => {
      signalArg = arg
    }

    scope.addListeners({
      'interactions:down': signalListener,
    })

    const pointerCoords: any = { page: {}, client: {} }
    pointerUtils.setCoords(pointerCoords, [event], event.timeStamp)

    for (const prop in coordsSet) {
      pointerUtils.copyCoords(
        interaction.coords[prop as keyof typeof coordsSet],
        coordsSet[prop as keyof typeof coordsSet],
      )
    }

    // downPointer is initially empty
    expect(interaction.downPointer).toEqual({} as any)

    // test while interacting
    interaction._interacting = true
    interaction.pointerDown(event, event, target)

    // downEvent is not updated
    expect(interaction.downEvent).toBeNull()
    // pointer is added
    expect(interaction.pointers).toEqual([
      {
        id: event.pointerId,
        event,
        pointer: event,
        downTime: 0,
        downTarget: target,
      },
    ])

    // downPointer is updated
    expect(interaction.downPointer).not.toEqual({} as any)

    // coords.start are not modified
    expect(interaction.coords.start).toEqual(coordsSet.start)
    // coords.prev  are not modified
    expect(interaction.coords.prev).toEqual(coordsSet.prev)

    // coords.cur   *are* modified
    expect(interaction.coords.cur).toEqual(helpers.getProps(event, ['page', 'client', 'timeStamp']))

    // pointerIsDown
    expect(interaction.pointerIsDown).toBe(true)
    // !pointerWasMoved
    expect(interaction.pointerWasMoved).toBe(false)

    // pointer      in down signal arg
    expect(signalArg.pointer).toBe(event)
    // event        in down signal arg
    expect(signalArg.event).toBe(event)
    // eventTarget  in down signal arg
    expect(signalArg.eventTarget).toBe(target)
    // pointerIndex in down signal arg
    expect(signalArg.pointerIndex).toBe(0)

    // test while not interacting
    interaction._interacting = false
    // reset pointerIsDown
    interaction.pointerIsDown = false
    // pretend pointer was moved
    interaction.pointerWasMoved = true
    // reset signalArg object
    signalArg = undefined

    interaction.removePointer(event, null)
    interaction.pointerDown(event, event, target)

    // timeStamp is assigned with new Date.getTime()
    // don't let it cause deepEaual to fail
    pointerCoords.timeStamp = interaction.coords.start.timeStamp

    // downEvent is updated
    expect(interaction.downEvent).toBe(event)

    // interaction.pointers is updated
    expect(interaction.pointers).toEqual([
      {
        id: event.pointerId,
        event,
        pointer: event,
        downTime: pointerCoords.timeStamp,
        downTarget: target,
      },
    ])

    // coords.start are set to pointer
    expect(interaction.coords.start).toEqual(pointerCoords)
    // coords.cur   are set to pointer
    expect(interaction.coords.cur).toEqual(pointerCoords)
    // coords.prev  are set to pointer
    expect(interaction.coords.prev).toEqual(pointerCoords)

    // down signal was fired again
    expect(signalArg).toBeInstanceOf(Object)
    // pointerIsDown
    expect(interaction.pointerIsDown).toBe(true)
    // pointerWasMoved should always change to false
    expect(interaction.pointerWasMoved).toBe(false)
  })

  test('Interaction.start', () => {
    const { interaction, interactable, scope, event, target: element, down, stop } = helpers.testEnv({
      plugins: [drag],
    })
    const action = { name: 'drag' } as const

    interaction.start(action, interactable, element)
    // do nothing if !pointerIsDown
    expect(interaction.prepared.name).toBeNull()

    // pointers is still empty
    interaction.pointerIsDown = true
    interaction.start(action, interactable, element)
    // do nothing if too few pointers are down
    expect(interaction.prepared.name).toBeNull()

    down()

    interaction._interacting = true
    interaction.start(action, interactable, element)
    // do nothing if already interacting
    expect(interaction.prepared.name).toBeNull()

    interaction._interacting = false

    interactable.options[action.name] = { enabled: false }
    interaction.start(action, interactable, element)
    // do nothing if action is not enabled
    expect(interaction.prepared.name).toBeNull()
    interactable.options[action.name] = { enabled: true }

    let signalArg: any

    // let interactingInStartListener
    const signalListener = (arg: any) => {
      signalArg = arg
      // interactingInStartListener = arg.interaction.interacting()
    }

    scope.addListeners({
      'interactions:action-start': signalListener,
    })
    interaction.start(action, interactable, element)

    // action is prepared
    expect(interaction.prepared.name).toBe(action.name)
    // interaction.interactable is updated
    expect(interaction.interactable).toBe(interactable)
    // interaction.element is updated
    expect(interaction.element).toBe(element)

    // t.assert(interactingInStartListener, 'interaction is interacting during action-start signal')
    // interaction is interacting after start method
    expect(interaction.interacting()).toBe(true)
    // interaction in signal arg
    expect(signalArg.interaction).toBe(interaction)
    // event (interaction.downEvent) in signal arg
    expect(signalArg.event).toBe(event)

    stop()
  })

  test('interaction move() and stop() from start event', () => {
    const { interaction, interactable, target, down } = helpers.testEnv({ plugins: [drag, drop, autoStart] })

    let stoppedBeforeStartFired: boolean

    interactable.draggable({
      listeners: {
        start (event) {
          stoppedBeforeStartFired = interaction._stopped

          // interaction.move() doesn't throw from start event
          expect(() => event.interaction.move()).not.toThrow()

          // interaction.stop() doesn't throw from start event
          expect(() => event.interaction.stop()).not.toThrow()
        },
      },
    })

    down()
    interaction.start({ name: 'drag' }, interactable, target as HTMLElement)

    // !interaction._stopped in start listener
    expect(stoppedBeforeStartFired).toBe(false)
    // interaction can be stopped from start event listener
    expect(interaction.interacting()).toBe(false)
    // interaction._stopped after stop() in start listener
    expect(interaction._stopped).toBe(true)
  })

  test('Interaction createPreparedEvent', () => {
    const { interaction, interactable, target } = helpers.testEnv()

    const action = { name: 'resize' } as const
    const phase = 'TEST_PHASE' as EventPhase

    interaction.prepared = action
    interaction.interactable = interactable
    interaction.element = target
    interaction.prevEvent = { page: {}, client: {}, velocity: {} } as any

    const iEvent = interaction._createPreparedEvent({} as any, phase)

    expect(iEvent).toBeInstanceOf(InteractEvent)

    expect(iEvent.type).toBe(action.name + phase)

    expect(iEvent.interactable).toBe(interactable)

    expect(iEvent.target).toBe(interactable.target)
  })

  test('Interaction fireEvent', () => {
    const { interaction, interactable } = helpers.testEnv()
    const iEvent = {} as InteractEvent

    // this method should be called from actions.firePrepared
    interactable.fire = jest.fn()

    interaction.interactable = interactable
    interaction._fireEvent(iEvent)

    // target interactable's fire method is called
    expect(interactable.fire).toHaveBeenCalledWith(iEvent)

    // interaction.prevEvent is updated
    expect(interaction.prevEvent).toBe(iEvent)
  })
})
