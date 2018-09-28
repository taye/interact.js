import test from '@interactjs/_dev/test/test';
import * as helpers from '@interactjs/core/tests/helpers';
import interactions from '@interactjs/core/interactions';
import drop from '../../drop';

test('actions/drop options', t => {
  const scope = helpers.mockScope();
  scope.interact = {};
  interactions.install(scope);
  drop.install(scope);

  const interactable = scope.interactables.new('test');

  const funcs = Object.freeze({
    drop () {},
    activate () {},
    deactivate () {},
    dropmove () {},
    dragenter () {},
    dragleave () {},
  });

  interactable.dropzone({
    listeners: [funcs],
  });

  t.equal(interactable.events.types.drop[0], funcs.drop);
  t.equal(interactable.events.types.dropactivate[0], funcs.activate);
  t.equal(interactable.events.types.dropdeactivate[0], funcs.deactivate);
  t.equal(interactable.events.types.dropmove[0], funcs.dropmove);
  t.equal(interactable.events.types.dragenter[0], funcs.dragenter);
  t.equal(interactable.events.types.dragleave[0], funcs.dragleave);

  t.end();
});
