import test from '@interactjs/_dev/test/test'
import InteractEvent from '@interactjs/core/InteractEvent'
import * as utils from '@interactjs/utils'
import DropEvent from '../drop/DropEvent'

const dz1: any = { target: 'dz1', fire (event) { this.fired = event } }
const dz2: any = { target: 'dz2', fire (event) { this.fired = event } }
const el1: any = Symbol('el1')
const el2: any = Symbol('el2')
const interactable: any = Symbol('interactable')
const dragElement: any = Symbol('drag-el')

test('DropEvent constructor', (t) => {
  const interaction: any = { dropState: {} }
  const dragEvent = Object.freeze({
    interactable,
    _interaction: interaction,
    target: dragElement,
    timeStamp: 10,
  }) as InteractEvent

  utils.extend(interaction.dropState, {
    activeDrops: [
      { dropzone: dz1, element: el1 },
      { dropzone: dz2, element: el2 },
    ],
    cur : { dropzone: dz1, element: el1 },
    prev: { dropzone: dz2, element: el2 },
    events: {},
  })

  const dropmove = new DropEvent(interaction.dropState, dragEvent, 'dropmove')

  t.equal(dropmove.target, el1, 'dropmove uses dropState.cur.element')
  t.equal(dropmove.dropzone, dz1, 'dropmove uses dropState.cur.dropzone')
  t.equal(dropmove.relatedTarget, dragElement)

  const dragleave = new DropEvent(interaction.dropState, dragEvent, 'dragleave')

  t.equal(dragleave.target, el2, 'dropmove uses dropState.prev.element')
  t.equal(dragleave.dropzone, dz2, 'dropmove uses dropState.prev.dropzone')
  t.equal(dragleave.relatedTarget, dragElement)

  t.end()
})

test('DropEvent.reject()', (t) => {
  const interaction: any = { dropState: {} }
  const dragEvent = Object.freeze({
    interactable,
    _interaction: interaction,
    target: dragElement,
    timeStamp: 10,
  }) as InteractEvent

  utils.extend(interaction.dropState, {
    activeDrops: [
      { dropzone: dz1, element: el1 },
      { dropzone: dz2, element: el2 },
    ],
    cur : { dropzone: null, element: null },
    prev: { dropzone: null, element: null },
    events: {},
  })

  const dropactivate = new DropEvent(interaction.dropState, dragEvent, 'dropactivate')

  dropactivate.dropzone = dz1
  dropactivate.target = el1
  dropactivate.reject()

  t.ok(dropactivate.propagationStopped && dropactivate.immediatePropagationStopped,
    'rejected event propagation is stopped')

  t.equal(dz1.fired.type, 'dropdeactivate', 'dropdeactivate is fired on rejected dropzone')

  t.deepEqual(
    interaction.dropState.activeDrops,
    [{ dropzone: dz2, element: el2 }],
    'activeDrop of rejected dropactivate event is removed')

  t.deepEqual(
    interaction.dropState.cur,
    { dropzone: null, element: null },
    'dropState.cur dropzone and element are set to null after rejecting dropactivate')

  utils.extend(interaction.dropState, {
    cur : { dropzone: dz1, element: el1 },
    prev: { dropzone: null, element: null },
    events: {},
  })

  const dropmove = new DropEvent(interaction.dropState, dragEvent, 'dropmove')

  dropmove.reject()

  t.deepEqual(
    interaction.dropState.cur,
    { dropzone: dz1, element: el1 },
    'dropState.cur remains the same after rejecting non activate event')

  t.ok(interaction.dropState.rejected, 'dropState.rejected === true')

  t.equal(dz1.fired.type, 'dragleave', 'dragleave is fired on rejected dropzone')

  t.end()
})

test('DropEvent.stop[Immediate]Propagation()', (t) => {
  const dropEvent = new DropEvent({ cur: {} } as any, {} as any, 'dragmove')

  t.notOk(dropEvent.propagationStopped || dropEvent.immediatePropagationStopped)

  dropEvent.stopPropagation()
  t.ok(dropEvent.propagationStopped)
  t.notOk(dropEvent.immediatePropagationStopped)

  dropEvent.propagationStopped = false

  dropEvent.stopImmediatePropagation()
  t.ok(dropEvent.propagationStopped && dropEvent.immediatePropagationStopped)

  t.end()
})
