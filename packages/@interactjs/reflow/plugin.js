/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import * as arr from "../utils/arr.js";
import { copyAction } from "../utils/misc.js";
import * as pointerUtils from "../utils/pointerUtils.js";
import { tlbrToXywh } from "../utils/rect.js";
function install(scope) {
  const {
    Interactable
  } = scope;
  scope.actions.phases.reflow = true;
  Interactable.prototype.reflow = function (action) {
    return doReflow(this, action, scope);
  };
}
function doReflow(interactable, action, scope) {
  const elements = interactable.getAllElements();

  // tslint:disable-next-line variable-name
  const Promise = scope.window.Promise;
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
      const xywh = tlbrToXywh(rect);
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
  interaction.prevEvent = event;
  interaction.updatePointer(event, event, element, true);
  pointerUtils.setZeroCoords(interaction.coords.delta);
  copyAction(interaction.prepared, action);
  interaction._doPhase(signalArg);
  const {
    Promise
  } = scope.window;
  const reflowPromise = Promise ? new Promise(resolve => {
    interaction._reflowResolve = resolve;
  }) : undefined;
  interaction._reflowPromise = reflowPromise;
  interaction.start(action, interactable, element);
  if (interaction._interacting) {
    interaction.move(signalArg);
    interaction.end(event);
  } else {
    interaction.stop();
    interaction._reflowResolve();
  }
  interaction.removePointer(event, event);
  return reflowPromise;
}
const reflow = {
  id: 'reflow',
  install,
  listeners: {
    // remove completed reflow interactions
    'interactions:stop': (_ref, scope) => {
      let {
        interaction
      } = _ref;
      if (interaction.pointerType === 'reflow') {
        if (interaction._reflowResolve) {
          interaction._reflowResolve();
        }
        arr.remove(scope.interactions.list, interaction);
      }
    }
  }
};
export { reflow as default };
//# sourceMappingURL=plugin.js.map
