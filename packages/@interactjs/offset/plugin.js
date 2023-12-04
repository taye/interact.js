"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addTotal = addTotal;
exports.applyPending = applyPending;
exports.default = void 0;
var _Interaction = require("../core/Interaction.js");
var rectUtils = _interopRequireWildcard(require("../utils/rect.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
;
_Interaction._ProxyMethods.offsetBy = '';
function addTotal(interaction) {
  if (!interaction.pointerIsDown) {
    return;
  }
  addToCoords(interaction.coords.cur, interaction.offset.total);
  interaction.offset.pending.x = 0;
  interaction.offset.pending.y = 0;
}
function beforeAction({
  interaction
}) {
  applyPending(interaction);
}
function beforeEnd({
  interaction
}) {
  const hadPending = applyPending(interaction);
  if (!hadPending) return;
  interaction.move({
    offset: true
  });
  interaction.end();
  return false;
}
function end({
  interaction
}) {
  interaction.offset.total.x = 0;
  interaction.offset.total.y = 0;
  interaction.offset.pending.x = 0;
  interaction.offset.pending.y = 0;
}
function applyPending(interaction) {
  if (!hasPending(interaction)) {
    return false;
  }
  const {
    pending
  } = interaction.offset;
  addToCoords(interaction.coords.cur, pending);
  addToCoords(interaction.coords.delta, pending);
  rectUtils.addEdges(interaction.edges, interaction.rect, pending);
  pending.x = 0;
  pending.y = 0;
  return true;
}
function offsetBy({
  x,
  y
}) {
  this.offset.pending.x += x;
  this.offset.pending.y += y;
  this.offset.total.x += x;
  this.offset.total.y += y;
}
function addToCoords({
  page,
  client
}, {
  x,
  y
}) {
  page.x += x;
  page.y += y;
  client.x += x;
  client.y += y;
}
function hasPending(interaction) {
  return !!(interaction.offset.pending.x || interaction.offset.pending.y);
}
const offset = {
  id: 'offset',
  before: ['modifiers', 'pointer-events', 'actions', 'inertia'],
  install(scope) {
    scope.Interaction.prototype.offsetBy = offsetBy;
  },
  listeners: {
    'interactions:new': ({
      interaction
    }) => {
      interaction.offset = {
        total: {
          x: 0,
          y: 0
        },
        pending: {
          x: 0,
          y: 0
        }
      };
    },
    'interactions:update-pointer': ({
      interaction
    }) => addTotal(interaction),
    'interactions:before-action-start': beforeAction,
    'interactions:before-action-move': beforeAction,
    'interactions:before-action-end': beforeEnd,
    'interactions:stop': end
  }
};
var _default = exports.default = offset;
//# sourceMappingURL=plugin.js.map