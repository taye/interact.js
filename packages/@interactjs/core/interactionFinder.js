"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var dom = _interopRequireWildcard(require("../utils/domUtils.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const finder = {
  methodOrder: ['simulationResume', 'mouseOrPen', 'hasPointer', 'idle'],
  search(details) {
    for (const method of finder.methodOrder) {
      const interaction = finder[method](details);
      if (interaction) {
        return interaction;
      }
    }
    return null;
  },
  // try to resume simulation with a new pointer
  simulationResume({
    pointerType,
    eventType,
    eventTarget,
    scope
  }) {
    if (!/down|start/i.test(eventType)) {
      return null;
    }
    for (const interaction of scope.interactions.list) {
      let element = eventTarget;
      if (interaction.simulation && interaction.simulation.allowResume && interaction.pointerType === pointerType) {
        while (element) {
          // if the element is the interaction element
          if (element === interaction.element) {
            return interaction;
          }
          element = dom.parentNode(element);
        }
      }
    }
    return null;
  },
  // if it's a mouse or pen interaction
  mouseOrPen({
    pointerId,
    pointerType,
    eventType,
    scope
  }) {
    if (pointerType !== 'mouse' && pointerType !== 'pen') {
      return null;
    }
    let firstNonActive;
    for (const interaction of scope.interactions.list) {
      if (interaction.pointerType === pointerType) {
        // if it's a down event, skip interactions with running simulations
        if (interaction.simulation && !hasPointerId(interaction, pointerId)) {
          continue;
        }

        // if the interaction is active, return it immediately
        if (interaction.interacting()) {
          return interaction;
        }
        // otherwise save it and look for another active interaction
        else if (!firstNonActive) {
          firstNonActive = interaction;
        }
      }
    }

    // if no active mouse interaction was found use the first inactive mouse
    // interaction
    if (firstNonActive) {
      return firstNonActive;
    }

    // find any mouse or pen interaction.
    // ignore the interaction if the eventType is a *down, and a simulation
    // is active
    for (const interaction of scope.interactions.list) {
      if (interaction.pointerType === pointerType && !(/down/i.test(eventType) && interaction.simulation)) {
        return interaction;
      }
    }
    return null;
  },
  // get interaction that has this pointer
  hasPointer({
    pointerId,
    scope
  }) {
    for (const interaction of scope.interactions.list) {
      if (hasPointerId(interaction, pointerId)) {
        return interaction;
      }
    }
    return null;
  },
  // get first idle interaction with a matching pointerType
  idle({
    pointerType,
    scope
  }) {
    for (const interaction of scope.interactions.list) {
      // if there's already a pointer held down
      if (interaction.pointers.length === 1) {
        const target = interaction.interactable;
        // don't add this pointer if there is a target interactable and it
        // isn't gesturable
        if (target && !(target.options.gesture && target.options.gesture.enabled)) {
          continue;
        }
      }
      // maximum of 2 pointers per interaction
      else if (interaction.pointers.length >= 2) {
        continue;
      }
      if (!interaction.interacting() && pointerType === interaction.pointerType) {
        return interaction;
      }
    }
    return null;
  }
};
function hasPointerId(interaction, pointerId) {
  return interaction.pointers.some(({
    id
  }) => id === pointerId);
}
var _default = exports.default = finder;
//# sourceMappingURL=interactionFinder.js.map