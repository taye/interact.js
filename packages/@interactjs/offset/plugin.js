/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import { _ProxyMethods } from "../core/Interaction.js";
import * as rectUtils from "../utils/rect.js";
_ProxyMethods.offsetBy = '';
function addTotal(interaction) {
  if (!interaction.pointerIsDown) {
    return;
  }
  addToCoords(interaction.coords.cur, interaction.offset.total);
  interaction.offset.pending.x = 0;
  interaction.offset.pending.y = 0;
}
function beforeAction(_ref) {
  let {
    interaction
  } = _ref;
  applyPending(interaction);
}
function beforeEnd(_ref2) {
  let {
    interaction
  } = _ref2;
  const hadPending = applyPending(interaction);
  if (!hadPending) return;
  interaction.move({
    offset: true
  });
  interaction.end();
  return false;
}
function end(_ref3) {
  let {
    interaction
  } = _ref3;
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
function offsetBy(_ref4) {
  let {
    x,
    y
  } = _ref4;
  this.offset.pending.x += x;
  this.offset.pending.y += y;
  this.offset.total.x += x;
  this.offset.total.y += y;
}
function addToCoords(_ref5, _ref6) {
  let {
    page,
    client
  } = _ref5;
  let {
    x,
    y
  } = _ref6;
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
    'interactions:new': _ref7 => {
      let {
        interaction
      } = _ref7;
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
    'interactions:update-pointer': _ref8 => {
      let {
        interaction
      } = _ref8;
      return addTotal(interaction);
    },
    'interactions:before-action-start': beforeAction,
    'interactions:before-action-move': beforeAction,
    'interactions:before-action-end': beforeEnd,
    'interactions:stop': end
  }
};
export { addTotal, applyPending, offset as default };
//# sourceMappingURL=plugin.js.map
