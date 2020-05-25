import * as arr from "../utils/arr.js";
import * as domUtils from "../utils/domUtils.js";
import extend from "../utils/extend.js";
import is from "../utils/is.js";
export class InteractableSet {
  // all set interactables
  constructor(scope) {
    this.list = [];
    this.selectorMap = {};
    this.scope = void 0;
    this.scope = scope;
    scope.addListeners({
      'interactable:unset': ({
        interactable
      }) => {
        const {
          target,
          _context: context
        } = interactable;
        const targetMappings = is.string(target) ? this.selectorMap[target] : target[this.scope.id];
        const targetIndex = targetMappings.findIndex(m => m.context === context);

        if (targetMappings[targetIndex]) {
          // Destroying mappingInfo's context and interactable
          targetMappings[targetIndex].context = null;
          targetMappings[targetIndex].interactable = null;
        }

        targetMappings.splice(targetIndex, 1);
      }
    });
  }

  new(target, options) {
    options = extend(options || {}, {
      actions: this.scope.actions
    });
    const interactable = new this.scope.Interactable(target, options, this.scope.document, this.scope.events);
    const mappingInfo = {
      context: interactable._context,
      interactable
    };
    this.scope.addDocument(interactable._doc);
    this.list.push(interactable);

    if (is.string(target)) {
      if (!this.selectorMap[target]) {
        this.selectorMap[target] = [];
      }

      this.selectorMap[target].push(mappingInfo);
    } else {
      if (!interactable.target[this.scope.id]) {
        Object.defineProperty(target, this.scope.id, {
          value: [],
          configurable: true
        });
      }

      target[this.scope.id].push(mappingInfo);
    }

    this.scope.fire('interactable:new', {
      target,
      options,
      interactable,
      win: this.scope._win
    });
    return interactable;
  }

  get(target, options) {
    const context = options && options.context || this.scope.document;
    const isSelector = is.string(target);
    const targetMappings = isSelector ? this.selectorMap[target] : target[this.scope.id];

    if (!targetMappings) {
      return null;
    }

    const found = arr.find(targetMappings, m => m.context === context && (isSelector || m.interactable.inContext(target)));
    return found && found.interactable;
  }

  forEachMatch(node, callback) {
    for (const interactable of this.list) {
      let ret;

      if ((is.string(interactable.target) // target is a selector and the element matches
      ? is.element(node) && domUtils.matchesSelector(node, interactable.target) : // target is the element
      node === interactable.target) && // the element is in context
      interactable.inContext(node)) {
        ret = callback(interactable);
      }

      if (ret !== undefined) {
        return ret;
      }
    }
  }

}
//# sourceMappingURL=InteractableSet.js.map