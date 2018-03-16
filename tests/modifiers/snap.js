import test from '../test';
import { mockSignals, mockInteractable } from '../helpers';

import snap from '../../src/modifiers/snap';
import Interaction from '../../src/Interaction';

test('modifiers/snap', t => {

  const interaction = new Interaction({ signals: mockSignals() });
  interaction.target = mockInteractable();
  interaction.prepared = {};
  interaction._interacting = true;

  const target0 = Object.freeze({ x:  50, y:  100 });
  const options = {
    targets: [
      target0,
    ],
    range: Infinity,
  };
  const status = {
    delta: { x: 0, y: 0 },
  };
  const pageCoords = Object.freeze({ x: 10, y: 20 });
  const arg = {
    interaction,
    options,
    status,
    pageCoords,
    modifiedCoords: { ...pageCoords },
    offset: [{ x: 0, y: 0 }],
  };

  snap.set(arg);

  t.deepEqual(
  status,
    {
      locked: true,
      range: Infinity,
      realX: pageCoords.x,
      realY: pageCoords.y,
      delta: {
        x: target0.x - pageCoords.x,
        y: target0.y - pageCoords.y,
      },
      modifiedX: target0.x,
      modifiedY: target0.y,
    },
    'snap.set single target, zereo offset'
  );

  t.end();
});
