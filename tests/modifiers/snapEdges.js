import test from '../test';
import { mockSignals, mockInteractable } from '../helpers';
import snapEdges from '@interactjs/modifiers/snapEdges';
import Interaction from '@interactjs/core/Interaction';
import { mockScope } from '../helpers';

test('modifiers/snapEdges', t => {
  mockScope();
  const interaction = new Interaction({ signals: mockSignals() });
  interaction.target = mockInteractable();
  interaction.target.getRect = () =>
    ({ top: 0, left: 0, bottom: 100, right: 100 });

  // resize from top left
  interaction.prepared.edges = { top: true, left: true };
  interaction._interacting = true;

  const target0 = Object.freeze({
    left: 50,
    right: 150,
    top: 0,
    bottom: 100,
  });
  const options = {
    targets: [
      target0,
    ],
    range: Infinity,
  };
  const status = {
    delta: { x: 0, y: 0 },
  };
  const pageCoords = Object.freeze({ x: 0, y: 0 });
  const arg = {
    interaction,
    options,
    status,
    pageCoords,
    modifiedCoords: { ...pageCoords },
    offset: [{ x: 0, y: 0 }],
  };

  snapEdges.set(arg);

  t.deepEqual(
    [status.modifiedX, status.modifiedY],
    [target0.left - pageCoords.x, target0.top - pageCoords.y],
    'modified delta is correct');

  // resize from bottom right
  interaction.prepared.edges = { bottom: true, right: true };

  snapEdges.set({
    ...arg,
    options,
  });

  t.deepEqual(
    [status.modifiedX, status.modifiedY],
    [target0.right  - pageCoords.x, target0.bottom - pageCoords.y],
    'modified coord is correct');

  t.end();
});
