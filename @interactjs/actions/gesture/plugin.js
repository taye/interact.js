import is from "../../utils/is.js";
import * as pointerUtils from "../../utils/pointerUtils.js";

function install(scope) {
  const {
    actions,
    Interactable,
    defaults
  } = scope;
  /**
   * ```js
   * interact(element).gesturable({
   *     onstart: function (event) {},
   *     onmove : function (event) {},
   *     onend  : function (event) {},
   *
   *     // limit multiple gestures.
   *     // See the explanation in {@link Interactable.draggable} example
   *     max: Infinity,
   *     maxPerElement: 1,
   * })
   *
   * var isGestureable = interact(element).gesturable()
   * ```
   *
   * Gets or sets whether multitouch gestures can be performed on the target
   *
   * @param {boolean | object} [options] true/false or An object with event
   * listeners to be fired on gesture events (makes the Interactable gesturable)
   * @return {boolean | Interactable} A boolean indicating if this can be the
   * target of gesture events, or this Interactable
   */

  Interactable.prototype.gesturable = function (options) {
    if (is.object(options)) {
      this.options.gesture.enabled = options.enabled !== false;
      this.setPerAction('gesture', options);
      this.setOnEvents('gesture', options);
      return this;
    }

    if (is.bool(options)) {
      this.options.gesture.enabled = options;
      return this;
    }

    return this.options.gesture;
  };

  actions.map.gesture = gesture;
  actions.methodDict.gesture = 'gesturable';
  defaults.actions.gesture = gesture.defaults;
}

function updateGestureProps({
  interaction,
  iEvent,
  phase
}) {
  if (interaction.prepared.name !== 'gesture') {
    return;
  }

  const pointers = interaction.pointers.map(p => p.pointer);
  const starting = phase === 'start';
  const ending = phase === 'end';
  const deltaSource = interaction.interactable.options.deltaSource;
  iEvent.touches = [pointers[0], pointers[1]];

  if (starting) {
    iEvent.distance = pointerUtils.touchDistance(pointers, deltaSource);
    iEvent.box = pointerUtils.touchBBox(pointers);
    iEvent.scale = 1;
    iEvent.ds = 0;
    iEvent.angle = pointerUtils.touchAngle(pointers, deltaSource);
    iEvent.da = 0;
    interaction.gesture.startDistance = iEvent.distance;
    interaction.gesture.startAngle = iEvent.angle;
  } else if (ending) {
    const prevEvent = interaction.prevEvent;
    iEvent.distance = prevEvent.distance;
    iEvent.box = prevEvent.box;
    iEvent.scale = prevEvent.scale;
    iEvent.ds = 0;
    iEvent.angle = prevEvent.angle;
    iEvent.da = 0;
  } else {
    iEvent.distance = pointerUtils.touchDistance(pointers, deltaSource);
    iEvent.box = pointerUtils.touchBBox(pointers);
    iEvent.scale = iEvent.distance / interaction.gesture.startDistance;
    iEvent.angle = pointerUtils.touchAngle(pointers, deltaSource);
    iEvent.ds = iEvent.scale - interaction.gesture.scale;
    iEvent.da = iEvent.angle - interaction.gesture.angle;
  }

  interaction.gesture.distance = iEvent.distance;
  interaction.gesture.angle = iEvent.angle;

  if (is.number(iEvent.scale) && iEvent.scale !== Infinity && !isNaN(iEvent.scale)) {
    interaction.gesture.scale = iEvent.scale;
  }
}

const gesture = {
  id: 'actions/gesture',
  before: ['actions/drag', 'actions/resize'],
  install,
  listeners: {
    'interactions:action-start': updateGestureProps,
    'interactions:action-move': updateGestureProps,
    'interactions:action-end': updateGestureProps,
    'interactions:new': ({
      interaction
    }) => {
      interaction.gesture = {
        angle: 0,
        distance: 0,
        scale: 1,
        startAngle: 0,
        startDistance: 0
      };
    },
    'auto-start:check': arg => {
      if (arg.interaction.pointers.length < 2) {
        return undefined;
      }

      const gestureOptions = arg.interactable.options.gesture;

      if (!(gestureOptions && gestureOptions.enabled)) {
        return undefined;
      }

      arg.action = {
        name: 'gesture'
      };
      return false;
    }
  },
  defaults: {},

  getCursor() {
    return '';
  }

};
export default gesture;
//# sourceMappingURL=plugin.js.map