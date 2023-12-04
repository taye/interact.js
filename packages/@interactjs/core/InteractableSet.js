"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.InteractableSet = void 0;
var arr = _interopRequireWildcard(require("../utils/arr.js"));
var domUtils = _interopRequireWildcard(require("../utils/domUtils.js"));
var _extend = _interopRequireDefault(require("../utils/extend.js"));
var _is = _interopRequireDefault(require("../utils/is.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
class InteractableSet {
  // all set interactables
  list = [];
  selectorMap = {};
  scope;
  constructor(scope) {
    this.scope = scope;
    scope.addListeners({
      'interactable:unset': ({
        interactable
      }) => {
        const {
          target
        } = interactable;
        const interactablesOnTarget = _is.default.string(target) ? this.selectorMap[target] : target[this.scope.id];
        const targetIndex = arr.findIndex(interactablesOnTarget, i => i === interactable);
        interactablesOnTarget.splice(targetIndex, 1);
      }
    });
  }
  new(target, options) {
    options = (0, _extend.default)(options || {}, {
      actions: this.scope.actions
    });
    const interactable = new this.scope.Interactable(target, options, this.scope.document, this.scope.events);
    this.scope.addDocument(interactable._doc);
    this.list.push(interactable);
    if (_is.default.string(target)) {
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
      ;
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
    const context = options && options.context || this.scope.document;
    const isSelector = _is.default.string(target);
    const interactablesOnTarget = isSelector ? this.selectorMap[target] : target[this.scope.id];
    if (!interactablesOnTarget) return undefined;
    return arr.find(interactablesOnTarget, interactable => interactable._context === context && (isSelector || interactable.inContext(target)));
  }
  forEachMatch(node, callback) {
    for (const interactable of this.list) {
      let ret;
      if ((_is.default.string(interactable.target) ?
      // target is a selector and the element matches
      _is.default.element(node) && domUtils.matchesSelector(node, interactable.target) :
      // target is the element
      node === interactable.target) &&
      // the element is in context
      interactable.inContext(node)) {
        ret = callback(interactable);
      }
      if (ret !== undefined) {
        return ret;
      }
    }
  }
}
exports.InteractableSet = InteractableSet;
//# sourceMappingURL=InteractableSet.js.map