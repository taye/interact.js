import test from '@interactjs/_dev/test/test';
import { mockSignals, mockInteractable } from '@interactjs/_dev/test/helpers';
import snapSize from '@interactjs/modifiers/snapSize';
import Interaction from '@interactjs/core/Interaction';

test('modifiers/snapSize', t => {

  const interaction = new Interaction({ signals: mockSignals() });
  interaction.target = mockInteractable();
  interaction.target.getRect = () => ({ top: 0, left: 0, bottom: 100, right: 100 });
  interaction.prepared = {
    edges: { top: true, left: true, bottom: false, right: false },
  };
  interaction._interacting = true;

  const target0 = Object.freeze({ x:  50, y:  100 });
  const options = {
    targets: [
      { ...target0 },
    ],
    range: Infinity,
  };
  const status = {
    options,
    delta: { x: 0, y: 0 },
    offset: [{ x: 0, y: 0 }],
  };
  const pageCoords = Object.freeze({ x: 10, y: 20 });
  const arg = {
    interaction,
    interactable: interaction.target,
    status,
    pageCoords,
    coords: { ...pageCoords },
  };

  snapSize.start(arg);
  snapSize.set(arg);

  t.deepEqual(
    arg.coords,
    target0,
    'snapSize.set single target, zereo offset'
  );

  t.end();
});
