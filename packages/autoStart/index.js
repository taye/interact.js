import autoStart from './base';
import hold from './hold';
import dragAxis from './dragAxis';

function install (scope) {
  autoStart.install(scope);
  hold.install(scope);
  dragAxis.install(scope);
}

export {
  autoStart,
  hold,
  dragAxis,
  install,
};
