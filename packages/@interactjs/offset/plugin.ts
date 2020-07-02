import { _ProxyMethods } from '@interactjs/core/Interaction'
import * as Interact from '@interactjs/types/index'
import * as rectUtils from '@interactjs/utils/rect'

declare module '@interactjs/core/Interaction' {
  interface Interaction {
    offsetBy?: typeof offsetBy
    offset: {
      total: Interact.Point
      pending: Interact.Point
    }
  }

  // eslint-disable-next-line no-shadow
  enum _ProxyMethods {
    // eslint-disable-next-line no-shadow
    offsetBy = ''
  }
}

(_ProxyMethods as any).offsetBy = ''

export function addTotal (interaction: Interact.Interaction) {
  if (!interaction.pointerIsDown) { return }

  addToCoords(interaction.coords.cur, interaction.offset.total)

  interaction.offset.pending.x = 0
  interaction.offset.pending.y = 0
}

function beforeAction ({ interaction }: { interaction: Interact.Interaction }) {
  applyPending(interaction)
}

function beforeEnd ({ interaction }: { interaction: Interact.Interaction }): boolean | void {
  const hadPending = applyPending(interaction)

  if (!hadPending) { return }

  interaction.move({ offset: true })
  interaction.end()

  return false
}

function end ({ interaction }: { interaction: Interact.Interaction }) {
  interaction.offset.total.x = 0
  interaction.offset.total.y = 0
  interaction.offset.pending.x = 0
  interaction.offset.pending.y = 0
}

export function applyPending (interaction: Interact.Interaction) {
  if (!hasPending(interaction)) {
    return false
  }

  const { pending } = interaction.offset

  addToCoords(interaction.coords.cur, pending)
  addToCoords(interaction.coords.delta, pending)
  rectUtils.addEdges(interaction.edges, interaction.rect, pending)

  pending.x = 0
  pending.y = 0

  return true
}

function offsetBy (this: Interact.Interaction, { x, y }: Interact.Point) {
  this.offset.pending.x += x
  this.offset.pending.y += y

  this.offset.total.x += x
  this.offset.total.y += y
}

function addToCoords ({ page, client }, { x, y }: Interact.Point) {
  page.x += x
  page.y += y
  client.x += x
  client.y += y
}

function hasPending (interaction) {
  return !!(interaction.offset.pending.x || interaction.offset.pending.y)
}

const offset: Interact.Plugin = {
  id: 'offset',
  before: ['modifiers'],
  install (scope) {
    scope.Interaction.prototype.offsetBy = offsetBy
  },
  listeners: {
    'interactions:new': ({ interaction }) => {
      interaction.offset = {
        total: { x: 0, y: 0 },
        pending: { x: 0, y: 0 },
      }
    },
    'interactions:update-pointer': ({ interaction }) => addTotal(interaction),
    'interactions:before-action-start': beforeAction,
    'interactions:before-action-move': beforeAction,
    'interactions:before-action-end': beforeEnd,
    'interactions:stop': end,
  },
}

export default offset
