import pointerEvents from './base';
import holdRepeat from './holdRepeat';
import interactableTargets from './interactableTargets';

function install (scope) {
  pointerEvents.install(scope);
  holdRepeat.install(scope);
  interactableTargets.install(scope);
}

export {
  pointerEvents,
  holdRepeat,
  interactableTargets,
  install,
};
