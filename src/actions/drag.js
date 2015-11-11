const actions = require('./index');
const scope = require('../scope');
const utils = require('../utils');
const InteractEvent = require('../InteractEvent');
const Interactable = require('../Interactable');
const Interaction = require('../Interaction');
const defaultOptions = require('../defaultOptions');

const drag = {
  defaults: {
    enabled      : false,
    manualStart  : true,
    max          : Infinity,
    maxPerElement: 1,

    snap      : null,
    restrict  : null,
    inertia   : null,
    autoScroll: null,

    startAxis: 'xy',
    lockAxis : 'xy',
  },

  checker: function (pointer, event, interactable) {
    const dragOptions = interactable.options.drag;

    return dragOptions.enabled
      ? { name: 'drag', axis: (dragOptions.lockAxis === 'start'
                               ? dragOptions.startAxis
                               : dragOptions.lockAxis)}
      : null;
  },

  getCursor: function () {
    return 'move';
  },
};

Interaction.signals.on('start-drag', function ({ interaction, event }) {
  const dragEvent = new InteractEvent(interaction, event, 'drag', 'start', interaction.element);

  interaction._interacting = true;
  interaction.target.fire(dragEvent);
  interaction.prevEvent = dragEvent;
});

Interaction.signals.on('before-action-move', function ({ interaction }) {
  if (interaction.prepared.name !== 'drag') { return; }

  const axis = interaction.prepared.axis;

  if (axis === 'x') {
    interaction.curCoords.page.y   = interaction.startCoords.page.y;
    interaction.curCoords.client.y = interaction.startCoords.client.y;
  }
  else if (axis === 'y') {
    interaction.curCoords.page.x   = interaction.startCoords.page.x;
    interaction.curCoords.client.x = interaction.startCoords.client.x;
  }
});

Interaction.signals.on('move-drag', function ({ interaction, event }) {
  const dragEvent = new InteractEvent(interaction, event, 'drag', 'move', interaction.element);

  interaction.target.fire(dragEvent);
  interaction.prevEvent = dragEvent;

  // if the action was ended in a dragmove listener
  if (!interaction.interacting()) { return false; }
});

Interaction.signals.on('action-end', function ({ interaction, event }) {
  if (interaction.prepared.name !== 'drag') { return; }

  const dragEvent = new InteractEvent(interaction, event, 'drag', 'end', interaction.element);

  interaction.target.fire(dragEvent);
  interaction.prevEvent = dragEvent;
});

/*\
 * Interactable.draggable
 [ method ]
 *
 * Gets or sets whether drag actions can be performed on the
 * Interactable
 *
 = (boolean) Indicates if this can be the target of drag events
 | var isDraggable = interact('ul li').draggable();
 * or
 - options (boolean | object) #optional true/false or An object with event listeners to be fired on drag events (object makes the Interactable draggable)
 = (object) This Interactable
 | interact(element).draggable({
 |     onstart: function (event) {},
 |     onmove : function (event) {},
 |     onend  : function (event) {},
 |
 |     // the axis in which the first movement must be
 |     // for the drag sequence to start
 |     // 'xy' by default - any direction
 |     startAxis: 'x' || 'y' || 'xy',
 |
 |     // 'xy' by default - don't restrict to one axis (move in any direction)
 |     // 'x' or 'y' to restrict movement to either axis
 |     // 'start' to restrict movement to the axis the drag started in
 |     lockAxis: 'x' || 'y' || 'xy' || 'start',
 |
 |     // max number of drags that can happen concurrently
 |     // with elements of this Interactable. Infinity by default
 |     max: Infinity,
 |
 |     // max number of drags that can target the same element+Interactable
 |     // 1 by default
 |     maxPerElement: 2
 | });
\*/
Interactable.prototype.draggable = function (options) {
  if (utils.isObject(options)) {
    this.options.drag.enabled = options.enabled === false? false: true;
    this.setPerAction('drag', options);
    this.setOnEvents('drag', options);

    if (/^(xy|x|y|start)$/.test(options.lockAxis)) {
      this.options.drag.lockAxis = options.lockAxis;
    }
    if (/^(xy|x|y)$/.test(options.startAxis)) {
      this.options.drag.startAxis = options.startAxis;
    }

    return this;
  }

  if (utils.isBool(options)) {
    this.options.drag.enabled = options;

    return this;
  }

  return this.options.drag;
};

actions.drag = drag;
actions.names.push('drag');
utils.merge(scope.eventTypes, [
  'dragstart',
  'dragmove',
  'draginertiastart',
  'dragend',
]);
actions.methodDict.drag = 'draggable';

defaultOptions.drag = drag.defaults;

module.exports = drag;
