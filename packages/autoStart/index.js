import autoStart from './base';
import hold from './hold';
import dragAxis from './dragAxis';

function init (scope) {
  autoStart.init(scope);
  hold.init(scope);
  dragAxis.init(scope);
}

export {
  autoStart,
  hold,
  dragAxis,
  init,
};
