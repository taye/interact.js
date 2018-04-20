import modifiers from './base';
import snap from './snap';
import snapSize from './snapSize';
import snapEdges from './snapEdges';
import restrict from './restrict';
import restrictEdges from './restrictEdges';
import restrictSize from './restrictSize';

function init (scope) {
  modifiers.init(scope);
  snap.init(scope);
  snapSize.init(scope);
  snapEdges.init(scope);
  restrict.init(scope);
  restrictEdges.init(scope);
  restrictSize.init(scope);
}

export {
  modifiers,
  snap,
  snapSize,
  snapEdges,
  restrict,
  restrictEdges,
  restrictSize,
  init,
};
