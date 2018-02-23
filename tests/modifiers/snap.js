const test = require('../test');
const { mockSignals, mockInteractable } = require('../helpers');

test('modifiers/snap', t => {
  const snap = require('../../src/modifiers/snap');
  const Interaction = require('../../src/Interaction');

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
  const status = {};
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
      changed: true,
      locked: true,
      range: Infinity,
      realX: pageCoords.x,
      realY: pageCoords.y,
      dx: target0.x - pageCoords.x,
      dy: target0.y - pageCoords.y,
      modifiedX: target0.x,
      modifiedY: target0.y,
    },
    'snap.set single target, zereo offset'
  );

  t.end();
});
