import type Interaction from '@interactjs/core/Interaction'
import { _ProxyMethods } from '@interactjs/core/Interaction'
import type { Plugin } from '@interactjs/core/scope'
import type { Point } from '@interactjs/types/index'
import * as rectUtils from '@interactjs/utils/rect'

declare module '@interactjs/core/Interaction' {
  interface Interaction {
    offsetBy?: typeof offsetBy
    offset: {
      total: Point
      pending: Point
    }
  }

  enum _ProxyMethods {
    offsetBy = '',
  }
}

;(_ProxyMethods as any).offsetBy = ''

export function addTotal (interaction: Interaction) {
  if (!interaction.pointerIsDown) {
    return
  }

  addToCoords(interaction.coords.cur, interaction.offset.total)

  interaction.offset.pending.x = 0
  interaction.offset.pending.y = 0
}

function beforeAction ({ interaction }: { interaction: Interaction }) {
  applyPending(interaction)
}

function beforeEnd ({ interaction }: { interaction: Interaction }): boolean | void {
  const hadPending = applyPending(interaction)

  if (!hadPending) return

  interaction.move({ offset: true })
  interaction.end()

  return false
}

function end ({ interaction }: { interaction: Interaction }) {
  interaction.offset.total.x = 0
  interaction.offset.total.y = 0
  interaction.offset.pending.x = 0
  interaction.offset.pending.y = 0
}

export function applyPending (interaction: Interaction) {
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

function offsetBy (this: Interaction, { x, y }: Point) {
  this.offset.pending.x += x
  this.offset.pending.y += y

  this.offset.total.x += x
  this.offset.total.y += y
}

function addToCoords ({ page, client }, { x, y }: Point) {
  page.x += x
  page.y += y
  client.x += x
  client.y += y
}

function hasPending (interaction: Interaction) {
  return !!(interaction.offset.pending.x || interaction.offset.pending.y)
}

const offset: Plugin = {
  id: 'offset',
  before: ['modifiers', 'pointer-events', 'actions', 'inertia'],
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
