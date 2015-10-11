const base = require('./base');
const scope = require('../scope');
const utils = require('../utils');
const browser = require('../utils/browser');
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

    axis: 'xy',
  },

  checker: function (pointer, event, interactable) {
    return interactable.options.drag.enabled
      ? { name: 'drag' }
      : null;
  },

  getCursor: function () {
    return 'move';
  },
};

Interaction.signals.on('before-start-drag',  function ({ interaction, eventTarget, dx, dy }) {
  // check if a drag is in the correct axis
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const targetAxis = interaction.target.options.drag.axis;
  const axis = (absX > absY ? 'x' : absX < absY ? 'y' : 'xy');

  // if the movement isn't in the axis of the interactable
  if (axis !== 'xy' && targetAxis !== 'xy' && targetAxis !== axis) {
    // cancel the prepared action
    interaction.prepared.name = null;

    // then try to get a drag from another ineractable

    let element = eventTarget;

    // check element interactables
    while (utils.isElement(element)) {
      const elementInteractable = scope.interactables.get(element);

      if (elementInteractable
          && elementInteractable !== interaction.target
          && !elementInteractable.options.drag.manualStart
          && elementInteractable.getAction(interaction.downPointer, interaction.downEvent, interaction, element).name === 'drag'
          && checkAxis(axis, elementInteractable)) {

        interaction.prepared.name = 'drag';
        interaction.target = elementInteractable;
        interaction.element = element;
        break;
      }

      element = utils.parentElement(element);
    }

    // if there's no drag from element interactables,
    // check the selector interactables
    if (!interaction.prepared.name) {

      const getDraggable = function (interactable, selector, context) {
        const elements = browser.useMatchesSelectorPolyfill
            ? context.querySelectorAll(selector)
            : undefined;

        if (interactable === interaction.target) { return; }

        if (scope.inContext(interactable, eventTarget)
            && !interactable.options.drag.manualStart
            && !scope.testIgnore(interactable, element, eventTarget)
            && scope.testAllow(interactable, element, eventTarget)
            && utils.matchesSelector(element, selector, elements)
            && interactable.getAction(interaction.downPointer, interaction.downEvent, interaction, element).name === 'drag'
            && checkAxis(axis, interactable)
            && scope.withinInteractionLimit(interactable, element, 'drag')) {

          return interactable;
        }
      };

      element = eventTarget;

      while (utils.isElement(element)) {
        const selectorInteractable = scope.interactables.forEachSelector(getDraggable);

        if (selectorInteractable) {
          interaction.prepared.name = 'drag';
          interaction.target = selectorInteractable;
          interaction.element = element;
          break;
        }

        element = utils.parentElement(element);
      }
    }
  }
});

Interaction.signals.on('start-drag', function ({ interaction, event }) {
  const dragEvent = new InteractEvent(interaction, event, 'drag', 'start', interaction.element);

  interaction._interacting = true;
  interaction.target.fire(dragEvent);
  interaction.prevEvent = dragEvent;
});

Interaction.signals.on('move-drag', function ({ interaction, event }) {
  const dragEvent = new InteractEvent(interaction, event, 'drag', 'move', interaction.element);

  interaction.target.fire(dragEvent);
  interaction.prevEvent = dragEvent;
});

Interaction.signals.on('end-drag', function ({ interaction, event }) {
  const dragEvent = new InteractEvent(interaction, event, 'drag', 'end', interaction.element);

  interaction.target.fire(dragEvent);
  interaction.prevEvent = dragEvent;
});

function checkAxis (axis, interactable) {
  if (!interactable) { return false; }

  const thisAxis = interactable.options.drag.axis;

  return (axis === 'xy' || thisAxis === 'xy' || thisAxis === axis);
}

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
 |     axis: 'x' || 'y' || 'xy',
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

    if (/^x$|^y$|^xy$/.test(options.axis)) {
      this.options.drag.axis = options.axis;
    }
    else if (options.axis === null) {
      delete this.options.drag.axis;
    }

    return this;
  }

  if (utils.isBool(options)) {
    this.options.drag.enabled = options;

    return this;
  }

  return this.options.drag;
};

base.drag = drag;
base.names.push('drag');
utils.merge(scope.eventTypes, [
  'dragstart',
  'dragmove',
  'draginertiastart',
  'dragend',
]);
base.methodDict.drag = 'draggable';

defaultOptions.drag = drag.defaults;

module.exports = drag;
