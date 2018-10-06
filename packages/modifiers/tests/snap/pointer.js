import test from '@interactjs/_dev/test/test';
import { mockSignals, mockInteractable } from '@interactjs/core/tests/helpers';

import Interaction from '@interactjs/core/Interaction';
import snap from '../../snap/pointer';

test('modifiers/snap', t => {

  const interaction = new Interaction({ signals: mockSignals() });
  interaction.target = mockInteractable();
  interaction.prepared = {};
  interaction._interacting = true;

  let funcArgs = null;
  const target0 = Object.freeze({ x:  50, y:  100 });
  // eslint-disable-next-line no-restricted-syntax, no-shadow
  const targetFunc = (x, y, interaction, offset, index, ...unexpected) => {
    funcArgs = { x, y, interaction, offset, index, unexpected };
    return target0;
  };
  const relativePoint = { x: 0, y: 0 };
  const options = {
    targets: [
      target0,
      targetFunc,
    ],
    range: Infinity,
    relativePoints: [relativePoint],
    origin: { x: 0, y: 0 },
  };

  const state = {
    options,
    delta: { x: 0, y: 0 },
  };
  const pageCoords = Object.freeze({ x: 10, y: 20 });
  const arg = {
    interaction,
    state,
    pageCoords,
    coords: { ...pageCoords },
    rect: { top: 0, left: 0, bottom: 100, right: 100, width: 100, height: 100 },
    startOffset: { top: 0, left: 0, bottom: 0, right: 0 },
  };

  snap.start(arg);
  snap.set(arg);

  t.deepEqual(
    arg.coords,
    target0,
    'snap.set single target, zereo offset'
  );

  t.deepEqual(
    funcArgs,
    {
      x: pageCoords.x,
      y: pageCoords.y,
      interaction,
      offset: {
        x: relativePoint.x,
        y: relativePoint.y,
        relativePoint,
        index: 0,
      },
      index: 1,
      unexpected: [],
    },
    ' x, y, interaction, offset, index are passed to target function'
  );

  t.end();
});
