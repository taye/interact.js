import type { Interactable } from '@interactjs/core/Interactable'
import type { OptionsArg, Options } from '@interactjs/core/options'
import type { Scope } from '@interactjs/core/scope'
import type { Target, Context } from '@interactjs/types/index'
import * as arr from '@interactjs/utils/arr'
import * as domUtils from '@interactjs/utils/domUtils'
import extend from '@interactjs/utils/extend'
import is from '@interactjs/utils/is'

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

interface InteractableScopeProp {
  context: Context
  interactable: Interactable
}

export class InteractableSet {
  // all set interactables
  list: Interactable[] = []

  selectorMap: {
    [selector: string]: InteractableScopeProp[]
  } = {}

  scope: Scope

  constructor (scope: Scope) {
    this.scope = scope
    scope.addListeners({
      'interactable:unset': ({ interactable }) => {
        const { target, _context: context } = interactable
        const targetMappings: InteractableScopeProp[] = is.string(target)
          ? this.selectorMap[target]
          : (target as any)[this.scope.id]

        const targetIndex = arr.findIndex(targetMappings, (m) => m.context === context)
        if (targetMappings[targetIndex]) {
          // Destroying mappingInfo's context and interactable
          targetMappings[targetIndex].context = null
          targetMappings[targetIndex].interactable = null
        }
        targetMappings.splice(targetIndex, 1)
      },
    })
  }

  new (target: Target, options?: any): Interactable {
    options = extend(options || {}, {
      actions: this.scope.actions,
    })
    const interactable = new this.scope.Interactable(target, options, this.scope.document, this.scope.events)
    const mappingInfo = { context: interactable._context, interactable }

    this.scope.addDocument(interactable._doc)
    this.list.push(interactable)

    if (is.string(target)) {
      if (!this.selectorMap[target]) {
        this.selectorMap[target] = []
      }
      this.selectorMap[target].push(mappingInfo)
    } else {
      if (!(interactable.target as any)[this.scope.id]) {
        Object.defineProperty(target, this.scope.id, {
          value: [],
          configurable: true,
        })
      }

      ;(target as any)[this.scope.id].push(mappingInfo)
    }

    this.scope.fire('interactable:new', {
      target,
      options,
      interactable,
      win: this.scope._win,
    })

    return interactable
  }

  get (target: Target, options?: Options) {
    const context = (options && options.context) || this.scope.document
    const isSelector = is.string(target)
    const targetMappings: InteractableScopeProp[] = isSelector
      ? this.selectorMap[target as string]
      : (target as any)[this.scope.id]

    if (!targetMappings) {
      return null
    }

    const found = arr.find(
      targetMappings,
      (m) => m.context === context && (isSelector || m.interactable.inContext(target as any)),
    )

    return found && found.interactable
  }

  forEachMatch<T> (node: Node, callback: (interactable: Interactable) => T) {
    for (const interactable of this.list) {
      let ret: void | T

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
