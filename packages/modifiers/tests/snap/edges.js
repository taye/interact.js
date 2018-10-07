import test from '@interactjs/_dev/test/test';
import { mockSignals, mockInteractable, mockScope } from '@interactjs/core/tests/helpers';
import Interaction from '@interactjs/core/Interaction';
import snapEdges from '../../snap/edges';

test('modifiers/snapEdges', t => {
  mockScope();
  const interaction = new Interaction({ signals: mockSignals() });
  interaction.target = mockInteractable();
  interaction.target.getRect = () => ({ top: 0, left: 0, bottom: 100, right: 100 });
  interaction._interacting = true;

  const target0 = Object.freeze({
    left: 50,
    right: 150,
    top: 0,
    bottom: 100,
  });
  const options = {
    targets: [
      { ...target0 },
    ],
    range: Infinity,
  };
  const pageCoords = Object.freeze({ x: 0, y: 0 });
  const arg = {
    interaction,
    interactable: interaction.target,
    state: null,
    pageCoords,
    coords: { ...pageCoords },
    offset: [{ x: 0, y: 0 }],
  };

  // resize from top left
  interaction.prepared.edges = { top: true, left: true };

  arg.state = { options };
  snapEdges.start(arg);
  snapEdges.set(arg);

  t.deepEqual(
    arg.coords,
    { x: target0.left, y: target0.top },
    'modified coords are correct');

  // resize from bottom right
  interaction.prepared.edges = { bottom: true, right: true };

  arg.state = { options };
  snapEdges.start(arg);
  snapEdges.set(arg);

  t.deepEqual(
    arg.coords,
    { x: target0.right, y: target0.bottom },
    'modified coord are correct');

  t.end();
});
