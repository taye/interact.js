/**
 * interact.js 1.10.29
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import * as arr from "../utils/arr.js";
import extend from "../utils/extend.js";
import is from "../utils/is.js";
class InteractableSet {
  constructor(scope) {
    // all set interactables
    this.list = [];
    this.selectorMap = {};
    this.scope = void 0;
    this.scope = scope;
    scope.addListeners({
      'interactable:unset': _ref => {
        let {
          interactable
        } = _ref;
        const {
          target
        } = interactable;
        const interactablesOnTarget = is.string(target) ? this.selectorMap[target] : target[this.scope.id];
        const targetIndex = arr.findIndex(interactablesOnTarget, i => i === interactable);
        interactablesOnTarget.splice(targetIndex, 1);
      }
    });
  }
  new(target, options) {
    options = extend(options || {}, {
      actions: this.scope.actions
    });
    const interactable = new this.scope.Interactable(target, options, this.scope.document, this.scope.events);
    this.scope.addDocument(interactable._doc);
    this.list.push(interactable);
    if (is.string(target)) {
      if (!this.selectorMap[target]) {
        this.selectorMap[target] = [];
      }
      this.selectorMap[target].push(interactable);
    } else {
      if (!interactable.target[this.scope.id]) {
        Object.defineProperty(target, this.scope.id, {
          value: [],
          configurable: true
        });
      }
      target[this.scope.id].push(interactable);
    }
    this.scope.fire('interactable:new', {
      target,
      options,
      interactable,
      win: this.scope._win
    });
    return interactable;
  }
  getExisting(target, options) {
    if (options != null && options.unique) return undefined;
    const context = options && options.context || this.scope.document;
    const isSelector = is.string(target);
    const targetMappings = isSelector ? this.selectorMap[target] : target[this.scope.id];
    if (!targetMappings) return undefined;
    return arr.find(targetMappings, interactable => interactable._context === context && (isSelector || !is.element(target) || interactable.inContext(target)) && !interactable._unique);
  }
  forEachMatch(target, callback) {
    for (const interactable of this.list) {
      let ret;
      if (interactable._matches(target) && (is.string(target) || is.func(target) || interactable.inContext(target))) {
        ret = callback(interactable);
      }
      if (ret !== undefined) return ret;
    }
  }
}
export { InteractableSet };
//# sourceMappingURL=InteractableSet.js.map
