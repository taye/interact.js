import * as arr from '@interactjs/utils/arr'
import * as domUtils from '@interactjs/utils/domUtils'
import extend from '@interactjs/utils/extend'
import is from '@interactjs/utils/is'

import type { Interactable } from '@interactjs/core/Interactable'
import type { OptionsArg, Options } from '@interactjs/core/options'
import type { Scope } from '@interactjs/core/scope'
import type { Target } from '@interactjs/core/types'

declare module '@interactjs/core/scope' {
  interface SignalArgs {
    'interactable:new': {
      interactable: Interactable
      target: Target
      options: OptionsArg
      win: Window
    }
  }
}

export class InteractableSet {
  // all set interactables
  list: Interactable[] = []

  selectorMap: {
    [selector: string]: Interactable[]
  } = {}

  scope: Scope

  constructor(scope: Scope) {
    this.scope = scope
    scope.addListeners({
      'interactable:unset': ({ interactable }) => {
        const { target } = interactable
        const interactablesOnTarget: Interactable[] = is.string(target)
          ? this.selectorMap[target]
          : (target as any)[this.scope.id]

        const targetIndex = arr.findIndex(interactablesOnTarget, (i) => i === interactable)
        interactablesOnTarget.splice(targetIndex, 1)
      },
    })
  }

  new(target: Target, options?: any): Interactable {
    options = extend(options || {}, {
      actions: this.scope.actions,
    })
    const interactable = new this.scope.Interactable(target, options, this.scope.document, this.scope.events)

    this.scope.addDocument(interactable._doc)
    this.list.push(interactable)

    if (is.string(target)) {
      if (!this.selectorMap[target]) {
        this.selectorMap[target] = []
      }
      this.selectorMap[target].push(interactable)
    } else {
      if (!(interactable.target as any)[this.scope.id]) {
        Object.defineProperty(target, this.scope.id, {
          value: [],
          configurable: true,
        })
      }

      ;(target as any)[this.scope.id].push(interactable)
    }

    this.scope.fire('interactable:new', {
      target,
      options,
      interactable,
      win: this.scope._win,
    })

    return interactable
  }

  getExisting(target: Target, options?: Options) {
    const context = (options && options.context) || this.scope.document
    const isSelector = is.string(target)
    const interactablesOnTarget: Interactable[] = isSelector
      ? this.selectorMap[target as string]
      : (target as any)[this.scope.id]

    if (!interactablesOnTarget) return undefined

    return arr.find(
      interactablesOnTarget,
      (interactable) =>
        interactable._context === context && (isSelector || interactable.inContext(target as any)),
    )
  }

  forEachMatch<T>(node: Node, callback: (interactable: Interactable) => T): T | void {
    for (const interactable of this.list) {
      let ret: T

      if (
        (is.string(interactable.target)
          ? // target is a selector and the element matches
            is.element(node) && domUtils.matchesSelector(node, interactable.target)
          : // target is the element
            node === interactable.target) &&
        // the element is in context
        interactable.inContext(node)
      ) {
        ret = callback(interactable)
      }

      if (ret !== undefined) {
        return ret
      }
    }
  }
}
