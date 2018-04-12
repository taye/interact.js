import test from '@interactjs/_dev/test/test';
import { mockSignals, mockInteractable, mockScope } from '@interactjs/_dev/test/helpers';
import snapEdges from '@interactjs/modifiers/snapEdges';
import Interaction from '@interactjs/core/Interaction';

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
    status: null,
    pageCoords,
    modifiedCoords: { ...pageCoords },
    offset: [{ x: 0, y: 0 }],
  };

  // resize from top left
  interaction.prepared.edges = { top: true, left: true };

  arg.status = { options, delta: { x: 0, y: 0 } };
  snapEdges.start(arg);
  snapEdges.set(arg);

  t.deepEqual(
    arg.status.delta,
    { x: target0.left - pageCoords.x, y: target0.top - pageCoords.y },
    'modified delta is correct');

  // resize from bottom right
  interaction.prepared.edges = { bottom: true, right: true };

  arg.status = { options, delta: { x: 0, y: 0 } };
  snapEdges.start(arg);
  snapEdges.set(arg);

  t.deepEqual(
    arg.status.delta,
    { x: target0.right - pageCoords.x, y: target0.bottom - pageCoords.y },
    'modified coord is correct');

  t.end();
});
