import Interactable from "../core/Interactable.js";
import { Interaction } from "../core/Interaction.js";
import { arr, extend, is, pointer as pointerUtils, rect as rectUtils, win } from "../utils/index.js";
export function install(scope) {
  const {
    /** @lends Interactable */
    // eslint-disable-next-line no-shadow
    Interactable
  } = scope;
  scope.actions.phases.reflow = true;
  /**
   * ```js
   * const interactable = interact(target)
   * const drag = { name: drag, axis: 'x' }
   * const resize = { name: resize, edges: { left: true, bottom: true }
   *
   * interactable.reflow(drag)
   * interactable.reflow(resize)
   * ```
   *
   * Start an action sequence to re-apply modifiers, check drops, etc.
   *
   * @param { Object } action The action to begin
   * @param { string } action.name The name of the action
   * @returns { Promise } A promise that resolves to the `Interactable` when actions on all targets have ended
   */

  Interactable.prototype.reflow = function (action) {
    return reflow(this, action, scope);
  };
}

function reflow(interactable, action, scope) {
  const elements = is.string(interactable.target) ? arr.from(interactable._context.querySelectorAll(interactable.target)) : [interactable.target]; // tslint:disable-next-line variable-name

  const Promise = win.window.Promise;
  const promises = Promise ? [] : null;

  for (const element of elements) {
    const rect = interactable.getRect(element);

    if (!rect) {
      break;
    }

    const runningInteraction = arr.find(scope.interactions.list, interaction => {
      return interaction.interacting() && interaction.interactable === interactable && interaction.element === element && interaction.prepared.name === action.name;
    });
    let reflowPromise;

    if (runningInteraction) {
      runningInteraction.move();

      if (promises) {
        reflowPromise = runningInteraction._reflowPromise || new Promise(resolve => {
          runningInteraction._reflowResolve = resolve;
        });
      }
    } else {
      const xywh = rectUtils.tlbrToXywh(rect);
      const coords = {
        page: {
          x: xywh.x,
          y: xywh.y
        },
        client: {
          x: xywh.x,
          y: xywh.y
        },
        timeStamp: scope.now()
      };
      const event = pointerUtils.coordsToEvent(coords);
      reflowPromise = startReflow(scope, interactable, element, action, event);
    }

    if (promises) {
      promises.push(reflowPromise);
    }
  }

  return promises && Promise.all(promises).then(() => interactable);
}

function startReflow(scope, interactable, element, action, event) {
  const interaction = scope.interactions.new({
    pointerType: 'reflow'
  });
  const signalArg = {
    interaction,
    event,
    pointer: event,
    eventTarget: element,
    phase: 'reflow'
  };
  interaction.interactable = interactable;
  interaction.element = element;
  interaction.prepared = extend({}, action);
  interaction.prevEvent = event;
  interaction.updatePointer(event, event, element, true);

  interaction._doPhase(signalArg);

  const reflowPromise = win.window.Promise ? new win.window.Promise(resolve => {
    interaction._reflowResolve = resolve;
  }) : null;
  interaction._reflowPromise = reflowPromise;
  interaction.start(action, interactable, element);

  if (interaction._interacting) {
    interaction.move(signalArg);
    interaction.end(event);
  } else {
    interaction.stop();
  }

  interaction.removePointer(event, event);
  interaction.pointerIsDown = false;
  return reflowPromise;
}

export default {
  id: 'reflow',
  install,
  listeners: {
    // remove completed reflow interactions
    'interactions:stop': ({
      interaction
    }, scope) => {
      if (interaction.pointerType === 'reflow') {
        if (interaction._reflowResolve) {
          interaction._reflowResolve();
        }

        arr.remove(scope.interactions.list, interaction);
      }
    }
  }
};
//# sourceMappingURL=index.js.map