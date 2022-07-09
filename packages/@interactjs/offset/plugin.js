import { _ProxyMethods } from "../core/Interaction.js";
import * as rectUtils from "../utils/rect.js";
;
_ProxyMethods.offsetBy = '';
export function addTotal(interaction) {
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

export function applyPending(interaction) {
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
export default offset;
//# sourceMappingURL=plugin.js.map