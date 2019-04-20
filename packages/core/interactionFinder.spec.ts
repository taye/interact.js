import test from '@interactjs/_dev/test/test'
import finder from './interactionFinder'
import * as helpers from './tests/_helpers'

test('modifiers/snap', (t) => {
  const {
    interactable,
    event,
    coords,
    scope,
  } = helpers.testEnv()

  const { body } = scope.document

  const { list } = scope.interactions
  const details = {
    pointer: event,
    get pointerId () { return details.pointer.pointerId },
    get pointerType () { return details.pointer.pointerType },
    eventType: null,
    eventTarget: body,
    curEventTarget: scope.document,
    scope,
  }

  scope.interactions.new({ pointerType: 'touch' })
  scope.interactions.new({ pointerType: 'mouse' })

  coords.pointerType = 'mouse'
  list[0].pointerType = 'mouse'
  list[2]._interacting = true

  t.equal(
    list.indexOf(finder.search(details)),
    2,
    '[pointerType: mouse] skips inactive mouse and touch interaction'
  )

  list[2]._interacting = false

  t.equal(
    list.indexOf(finder.search(details)),
    0,
    '[pointerType: mouse] returns first idle mouse interaction'
  )

  coords.pointerId = 4
  list[1].pointerDown({ ...event } as any, { ...event } as any, body)
  coords.pointerType = 'touch'

  t.equal(
    list.indexOf(finder.search(details)),
    1,
    '[pointerType: touch] gets interaction with pointerId'
  )

  coords.pointerId = 5

  t.equal(
    list.indexOf(finder.search(details)),
    1,
    `[pointerType: touch] returns idle touch interaction without matching pointerId
    and existing touch interaction has pointer and no target`
  )

  interactable.options.gesture = { enabled: false }
  list[1].interactable = interactable

  t.equal(
    list.indexOf(finder.search(details)),
    -1,
    `[pointerType: touch] no result without matching pointerId
    and existing touch interaction has a pointer and target not gesturable`
  )

  interactable.options.gesture = { enabled: true }

  t.equal(
    list.indexOf(finder.search(details)),
    1,
    `[pointerType: touch] returns idle touch interaction with gesturable target
    and existing pointer`
  )

  t.end()
})
