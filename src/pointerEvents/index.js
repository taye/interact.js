import pointerEvents from './base';
import holdRepeat from './holdRepeat';
import interactableTargets from './interactableTargets';

function init (scope) {
  pointerEvents.init(scope);
  holdRepeat.init(scope);
  interactableTargets.init(scope);
}

export {
  pointerEvents,
  holdRepeat,
  interactableTargets,
  init,
};
