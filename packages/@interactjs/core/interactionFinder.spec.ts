import finder from './interactionFinder'
import * as helpers from './tests/_helpers'

test('modifiers/snap', () => {
  const { interactable, event, coords, scope } = helpers.testEnv()

  const { body } = scope.document

  const { list } = scope.interactions
  const details = {
    pointer: event,
    get pointerId (): number {
      return details.pointer.pointerId
    },
    get pointerType (): string {
      return details.pointer.pointerType
    },
    eventType: null as string,
    eventTarget: body,
    curEventTarget: scope.document,
    scope,
  }

  scope.interactions.new({ pointerType: 'touch' })
  scope.interactions.new({ pointerType: 'mouse' })

  coords.pointerType = 'mouse'
  list[0].pointerType = 'mouse'
  list[2]._interacting = true

  // [pointerType: mouse] skips inactive mouse and touch interaction
  expect(list.indexOf(finder.search(details))).toBe(2)

  list[2]._interacting = false

  // [pointerType: mouse] returns first idle mouse interaction
  expect(list.indexOf(finder.search(details))).toBe(0)

  coords.pointerId = 4
  list[1].pointerDown({ ...event } as any, { ...event } as any, body)
  coords.pointerType = 'touch'

  // [pointerType: touch] gets interaction with pointerId
  expect(list.indexOf(finder.search(details))).toBe(1)

  coords.pointerId = 5

  // `[pointerType: touch] returns idle touch interaction without matching pointerId and existing touch interaction has pointer and no target`
  expect(list.indexOf(finder.search(details))).toBe(1)

  interactable.options.gesture = { enabled: false }
  list[1].interactable = interactable

  // `[pointerType: touch] no result without matching pointerId and existing touch interaction has a pointer and target not gesturable`
  expect(list.indexOf(finder.search(details))).toBe(-1)

  interactable.options.gesture = { enabled: true }

  // `[pointerType: touch] returns idle touch interaction with gesturable target and existing pointer`
  expect(list.indexOf(finder.search(details))).toBe(1)
})
