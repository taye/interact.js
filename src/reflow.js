import interactions from './interactions';
import autoStart from './autoStart/base';
import {
  arr,
  is,
  extend,
  rect as rectUtils,
  pointer as pointerUtils,
} from './utils';

export function init (scope) {
  const {
    actions,
    Interaction,
    /** @lends Interactable */
    Interactable,
  } = scope;

  // add action reflow event types
  for (const actionName of actions.names) {
    Interactable.eventTypes.push(`${actionName}reflow`);
  }

  // remove completed reflow interactions
  Interaction.signals.on('stop', ({ interaction }) => {
    if (interaction.pointerType === 'reflow') {
      arr.remove(scope.interactions, interaction);
    }
  });

  /**
   * ```js
   * const interactable = interact(target);
   * const drag = { name: drag, axis: 'x' };
   * const resize = { name: resize, edges: { left: true, bottom: true };
   *
   * interactable.reflow(drag);
   * interactable.reflow(resize);
   * ```
   *
   * Start an action sequence to re-apply modifiers, check drops, etc.
   *
   * @param { Object } action The action to begin
   * @param { string } action.name The name of the action
   */
  Interactable.prototype.reflow = function (action) {
    return reflow(this, action, scope);
  };
}

function reflow (interactable, action, scope) {
  let elements = is.string(interactable.target)
    ? arr.from(interactable._context.querySelectorAll(interactable.target))
    : [interactable.target];

  // ignore elements that are currently being interacted with
  elements = elements.filter(
    element => autoStart.withinInteractionLimit(interactable, element, action, scope));

  for (const element of elements) {
    const interaction = interactions.newInteraction({ pointerType: 'reflow' }, scope);

    const rect = interactable.getRect(element);

    if (!rect) { break; }

    const xywh = rectUtils.tlbrToXywh(rect);
    const coords = {
      page: xywh,
      client: xywh,
    };
    const event = extend(pointerUtils.coordsToEvent(coords), coords);
    const signalArg = {
      interaction,
      event,
      pointer: event,
      eventTarget: element,
      phase: 'reflow',
    };

    interaction.target = interactable;
    interaction.element = element;
    interaction.prepared = extend({}, action);
    interaction.prevEvent = event;
    interaction.updatePointer(event, event, element, true);

    interaction._doPhase(signalArg);

    signalArg.phase = 'start';
    interaction._interacting = interaction._doPhase(signalArg);

    if (interaction._interacting) {
      interaction.move(signalArg);
      interaction.end(event);
    }
    else {
      interaction.stop();
    }
  }
}

export default { init };
