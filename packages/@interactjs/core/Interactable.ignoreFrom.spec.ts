import * as helpers from '@interactjs/core/tests/_helpers'

import type { Interactable } from './Interactable'

describe('Interactable.testIgnore with callback function', () => {
  let interactable: Interactable
  let targetNode: HTMLElement
  let eventTarget: HTMLElement

  beforeEach(() => {
    // Create DOM elements for testing
    targetNode = document.createElement('div')
    targetNode.className = 'target'

    eventTarget = document.createElement('span')
    eventTarget.className = 'event-target'

    targetNode.appendChild(eventTarget)

    // Create interactable using testEnv
    const { interactable: testInteractable } = helpers.testEnv({ target: targetNode })
    interactable = testInteractable
  })

  test('should work with string selector (existing functionality)', () => {
    const ignoreFrom = '.ignore-class'
    eventTarget.className = 'ignore-class'

    const result = interactable.testIgnore(ignoreFrom, targetNode, eventTarget)
    expect(result).toBe(true)
  })

  test('should work with element (existing functionality)', () => {
    const ignoreElement = document.createElement('div')
    ignoreElement.appendChild(eventTarget)

    const result = interactable.testIgnore(ignoreElement, targetNode, eventTarget)
    expect(result).toBe(true)
  })

  test('should work with callback function returning true', () => {
    const ignoreFrom = (_targetNode: Node, eventTarget: Node) => {
      return eventTarget instanceof Element && eventTarget.hasAttribute('data-ignore')
    }

    eventTarget.setAttribute('data-ignore', 'true')

    const result = interactable.testIgnore(ignoreFrom, targetNode, eventTarget)
    expect(result).toBe(true)
  })

  test('should work with callback function returning false', () => {
    const ignoreFrom = (_targetNode: Node, eventTarget: Node) => {
      return eventTarget instanceof Element && eventTarget.hasAttribute('data-ignore')
    }

    // No data-ignore attribute, so should return false

    const result = interactable.testIgnore(ignoreFrom, targetNode, eventTarget)
    expect(result).toBe(false)
  })

  test('should work with complex callback logic', () => {
    const ignoreFrom = (_targetNode: Node, eventTarget: Node) => {
      if (eventTarget instanceof Element) {
        // Ignore input elements
        if (eventTarget.tagName === 'INPUT' || eventTarget.tagName === 'TEXTAREA') {
          return true
        }

        // Ignore elements with no-drag class in parent chain
        let parent = eventTarget.parentElement
        while (parent && parent !== targetNode) {
          if (parent.classList.contains('no-drag')) {
            return true
          }
          parent = parent.parentElement
        }
      }
      return false
    }

    // Test with input element
    const inputElement = document.createElement('input')
    targetNode.appendChild(inputElement)

    let result = interactable.testIgnore(ignoreFrom, targetNode, inputElement)
    expect(result).toBe(true)

    // Test with element having no-drag parent
    const noDragParent = document.createElement('div')
    noDragParent.className = 'no-drag'
    const childElement = document.createElement('span')
    noDragParent.appendChild(childElement)
    targetNode.appendChild(noDragParent)

    result = interactable.testIgnore(ignoreFrom, targetNode, childElement)
    expect(result).toBe(true)

    // Test with normal element (should not ignore)
    const normalElement = document.createElement('div')
    targetNode.appendChild(normalElement)

    result = interactable.testIgnore(ignoreFrom, targetNode, normalElement)
    expect(result).toBe(false)
  })

  test('should return false for undefined ignoreFrom', () => {
    const result = interactable.testIgnore(undefined, targetNode, eventTarget)
    expect(result).toBe(false)
  })

  test('should return false for non-element eventTarget', () => {
    const ignoreFrom = () => true
    const textNode = document.createTextNode('text')

    const result = interactable.testIgnore(ignoreFrom, targetNode, textNode)
    expect(result).toBe(false)
  })
})
