import gesture from './gesture';
import resize from './resize';
import drag from './drag';
import drop from './drop';

function init (scope) {
  gesture.init(scope);
  resize.init(scope);
  drag.init(scope);
  drop.init(scope);
}

export {
  gesture,
  resize,
  drag,
  drop,
  init,
};
