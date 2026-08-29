import * as helpers from '@interactjs/core/tests/_helpers'

import type { Interactable } from './Interactable'

describe('Interactable.testAllow with callback function', () => {
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
    const allowFrom = '.allow-class'
    eventTarget.className = 'allow-class'

    const result = interactable.testAllow(allowFrom, targetNode, eventTarget)
    expect(result).toBe(true)
  })

  test('should work with element (existing functionality)', () => {
    const allowElement = document.createElement('div')
    allowElement.appendChild(eventTarget)

    const result = interactable.testAllow(allowElement, targetNode, eventTarget)
    expect(result).toBe(true)
  })

  test('should work with callback function returning true', () => {
    const allowFrom = (_targetNode: Node, eventTarget: Node) => {
      return eventTarget instanceof Element && eventTarget.hasAttribute('data-allow')
    }

    eventTarget.setAttribute('data-allow', 'true')

    const result = interactable.testAllow(allowFrom, targetNode, eventTarget)
    expect(result).toBe(true)
  })

  test('should work with callback function returning false', () => {
    const allowFrom = (_targetNode: Node, eventTarget: Node) => {
      return eventTarget instanceof Element && eventTarget.hasAttribute('data-allow')
    }

    // No data-allow attribute, so should return false

    const result = interactable.testAllow(allowFrom, targetNode, eventTarget)
    expect(result).toBe(false)
  })

  test('should work with complex callback logic for drag handles', () => {
    const allowFrom = (_targetNode: Node, eventTarget: Node) => {
      if (eventTarget instanceof Element) {
        // Only allow dragging from elements with 'drag-handle' class
        if (eventTarget.classList.contains('drag-handle')) {
          return true
        }

        // Or allow dragging from specific data attributes
        if (eventTarget.hasAttribute('data-draggable')) {
          return true
        }

        // Check parent elements for drag handle
        let parent = eventTarget.parentElement
        while (parent && parent !== targetNode) {
          if (parent.classList.contains('drag-handle')) {
            return true
          }
          parent = parent.parentElement
        }
      }
      return false
    }

    // Test with drag handle element
    const handleElement = document.createElement('div')
    handleElement.className = 'drag-handle'
    targetNode.appendChild(handleElement)

    let result = interactable.testAllow(allowFrom, targetNode, handleElement)
    expect(result).toBe(true)

    // Test with element having data-draggable
    const draggableElement = document.createElement('span')
    draggableElement.setAttribute('data-draggable', 'true')
    targetNode.appendChild(draggableElement)

    result = interactable.testAllow(allowFrom, targetNode, draggableElement)
    expect(result).toBe(true)

    // Test with child of drag handle
    const childElement = document.createElement('span')
    handleElement.appendChild(childElement)

    result = interactable.testAllow(allowFrom, targetNode, childElement)
    expect(result).toBe(true)

    // Test with normal element (should not allow)
    const normalElement = document.createElement('div')
    targetNode.appendChild(normalElement)

    result = interactable.testAllow(allowFrom, targetNode, normalElement)
    expect(result).toBe(false)
  })

  test('should return true for undefined allowFrom (default behavior)', () => {
    const result = interactable.testAllow(undefined, targetNode, eventTarget)
    expect(result).toBe(true)
  })

  test('should return false for non-element eventTarget', () => {
    const allowFrom = () => true
    const textNode = document.createTextNode('text')

    const result = interactable.testAllow(allowFrom, targetNode, textNode)
    expect(result).toBe(false)
  })

  test('should work with role-based access control', () => {
    const allowFrom = (_targetNode: Node, eventTarget: Node) => {
      if (eventTarget instanceof Element) {
        const role = eventTarget.getAttribute('data-role')
        const allowedRoles = ['admin', 'editor']
        return allowedRoles.includes(role || '')
      }
      return false
    }

    // Test with allowed role
    eventTarget.setAttribute('data-role', 'admin')
    let result = interactable.testAllow(allowFrom, targetNode, eventTarget)
    expect(result).toBe(true)

    // Test with forbidden role
    eventTarget.setAttribute('data-role', 'viewer')
    result = interactable.testAllow(allowFrom, targetNode, eventTarget)
    expect(result).toBe(false)

    // Test with no role
    eventTarget.removeAttribute('data-role')
    result = interactable.testAllow(allowFrom, targetNode, eventTarget)
    expect(result).toBe(false)
  })
})
