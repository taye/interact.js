import gesture from './gesture';
import resize from './resize';
import drag from './drag';
import drop from './drop';

function install (scope) {
  gesture.install(scope);
  resize.install(scope);
  drag.install(scope);
  drop.install(scope);
}

export {
  gesture,
  resize,
  drag,
  drop,
  install,
};
