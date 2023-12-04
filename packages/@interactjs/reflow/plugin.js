"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var arr = _interopRequireWildcard(require("../utils/arr.js"));
var _misc = require("../utils/misc.js");
var pointerUtils = _interopRequireWildcard(require("../utils/pointerUtils.js"));
var _rect = require("../utils/rect.js");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
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
      const xywh = (0, _rect.tlbrToXywh)(rect);
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
  (0, _misc.copyAction)(interaction.prepared, action);
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
var _default = exports.default = reflow;
//# sourceMappingURL=plugin.js.map