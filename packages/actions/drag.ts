import { ActionName, Scope } from '@interactjs/core/scope'
import * as arr from '@interactjs/utils/arr'
import * as is from '@interactjs/utils/is'

declare module '@interactjs/core/Interactable' {
  interface Interactable {
    draggable: DraggableMethod
  }
}

declare module '@interactjs/core/defaultOptions' {
  interface ActionDefaults {
    drag: Interact.DraggableOptions
  }
}

declare module '@interactjs/core/scope' {
  interface Actions {
    [ActionName.Drag]?: typeof drag
  }

  // eslint-disable-next-line no-shadow
  enum ActionName {
    Drag = 'drag'
  }
}

(ActionName as any).Drag = 'drag'

export type DragEvent = Interact.InteractEvent<ActionName.Drag>

export type DraggableMethod = Interact.ActionMethod<Interact.DraggableOptions>

function install (scope: Scope) {
  const {
    actions,
    Interactable,
    interactions,
    defaults,
  } = scope

  interactions.signals.on('before-action-move', beforeMove)
  interactions.signals.on('action-resume', beforeMove)

  // dragmove
  interactions.signals.on('action-move', move)

  Interactable.prototype.draggable = drag.draggable

  actions[ActionName.Drag] = drag
  actions.names.push(ActionName.Drag)
  arr.merge(actions.eventTypes, [
    'dragstart',
    'dragmove',
    'draginertiastart',
    'dragresume',
    'dragend',
  ])
  actions.methodDict.drag = 'draggable'

  defaults.actions.drag = drag.defaults
}

function beforeMove ({ interaction }) {
  if (interaction.prepared.name !== 'drag') { return }

  const axis = interaction.prepared.axis

  if (axis === 'x') {
    interaction.coords.cur.page.y   = interaction.coords.start.page.y
    interaction.coords.cur.client.y = interaction.coords.start.client.y

    interaction.coords.velocity.client.y = 0
    interaction.coords.velocity.page.y   = 0
  }
  else if (axis === 'y') {
    interaction.coords.cur.page.x   = interaction.coords.start.page.x
    interaction.coords.cur.client.x = interaction.coords.start.client.x

    interaction.coords.velocity.client.x = 0
    interaction.coords.velocity.page.x   = 0
  }
}

function move ({ iEvent, interaction }) {
  if (interaction.prepared.name !== 'drag') { return }

  const axis = interaction.prepared.axis

  if (axis === 'x' || axis === 'y') {
    const opposite = axis === 'x' ? 'y' : 'x'

    iEvent.page[opposite]   = interaction.coords.start.page[opposite]
    iEvent.client[opposite] = interaction.coords.start.client[opposite]
    iEvent.delta[opposite] = 0
  }
}

/**
 * ```js
 * interact(element).draggable({
 *     onstart: function (event) {},
 *     onmove : function (event) {},
 *     onend  : function (event) {},
 *
 *     // the axis in which the first movement must be
 *     // for the drag sequence to start
 *     // 'xy' by default - any direction
 *     startAxis: 'x' || 'y' || 'xy',
 *
 *     // 'xy' by default - don't restrict to one axis (move in any direction)
 *     // 'x' or 'y' to restrict movement to either axis
 *     // 'start' to restrict movement to the axis the drag started in
 *     lockAxis: 'x' || 'y' || 'xy' || 'start',
 *
 *     // max number of drags that can happen concurrently
 *     // with elements of this Interactable. Infinity by default
 *     max: Infinity,
 *
 *     // max number of drags that can target the same element+Interactable
 *     // 1 by default
 *     maxPerElement: 2
 * })
 *
 * var isDraggable = interact('element').draggable(); // true
 * ```
 *
 * Get or set whether drag actions can be performed on the target
 *
 * @alias Interactable.prototype.draggable
 *
 * @param {boolean | object} [options] true/false or An object with event
 * listeners to be fired on drag events (object makes the Interactable
 * draggable)
 * @return {boolean | Interactable} boolean indicating if this can be the
 * target of drag events, or this Interctable
 */
const draggable: DraggableMethod = function draggable (this: Interact.Interactable, options?: Interact.DraggableOptions | boolean): any {
  if (is.object(options)) {
    this.options.drag.enabled = options.enabled !== false
    this.setPerAction('drag', options)
    this.setOnEvents('drag', options)

    if (/^(xy|x|y|start)$/.test(options.lockAxis)) {
      this.options.drag.lockAxis = options.lockAxis
    }
    if (/^(xy|x|y)$/.test(options.startAxis)) {
      this.options.drag.startAxis = options.startAxis
    }

    return this
  }

  if (is.bool(options)) {
    this.options.drag.enabled = options

    return this
  }

  return this.options.drag
}

const drag: Interact.Plugin = {
  id: 'actions/drag',
  install,
  draggable,
  beforeMove,
  move,
  defaults: {
    startAxis : 'xy',
    lockAxis  : 'xy',
  } as Interact.DropzoneOptions,

  checker (_pointer, _event, interactable) {
    const dragOptions = interactable.options.drag

    return dragOptions.enabled
      ? {
        name: 'drag',
        axis: (dragOptions.lockAxis === 'start'
          ? dragOptions.startAxis
          : dragOptions.lockAxis),
      }
      : null
  },

  getCursor () {
    return 'move'
  },
}

export default drag
