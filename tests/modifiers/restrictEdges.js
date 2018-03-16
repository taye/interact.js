import test from '../test';
import { mockSignals } from '../helpers';
import restrictEdges from '../../src/modifiers/restrictEdges';
import Interaction from '../../src/Interaction';

test('restrictEdges', t => {

  const interaction = new Interaction({ signals: mockSignals() });
  interaction.prepared = {};
  interaction.prepared.edges = { top: true, bottom: true, left: true, right: true };
  interaction.resizeRects = {};
  interaction.resizeRects.inverted = { x: 10, y: 20, width: 300, height: 200 };
  interaction._interacting = true;

  const options = { enabled: true };
  const status = {
    delta: { x: 0, y: 0 },
  };
  const coords = { x: 40, y: 40 };
  const offset = { top: 0, left: 0, bottom: 0, right: 0 };
  const arg = { interaction, options, status, modifiedCoords: coords, offset };

  // outer restriction
  options.outer = { top: 100, left: 100, bottom: 200, right: 200 };
  restrictEdges.set(arg);

  t.deepEqual(
    status,
    {
      delta: { x: 60, y: 60 },
      locked: true,
    },
    'outer restriction is applied correctly'
  );

  // inner restriction
  options.outer = null;
  options.inner = { top: 0, left: 0, bottom: 10, right: 10 };
  restrictEdges.set(arg);

  t.deepEqual(
    status,
    {
      delta: { x: -40, y: -40 },
      locked: true,
    },
    'inner restriction is applied correctly'
  );

  // offset
  Object.assign(offset, {
    top: 100,
    left: 100,
    bottom: 200,
    right: 200,
  });

  options.outer = { top: 100, left: 100, bottom: 200, right: 200 };
  options.inner = null;
  restrictEdges.set(arg);

  t.deepEqual(
    status,
    {
      delta: { x: 160, y: 160 },
      locked: true,
    },
    'outer restriction is applied correctly with offset'
  );

  // setOffset
  interaction.modifiers = {};
  interaction.modifiers.startOffset = { top: 5, left: 10, bottom: -8, right: -16 };
  interaction.target = {
    getRect () {
      return { top: 500, left: 900 };
    },
  };

  options.offset = 'self';

  t.deepEqual(
    restrictEdges.setOffset(arg),
    { top: 505, left: 910, bottom: 508, right: 916 },
    'setOffset gets x/y from selector string'
  );

  // modifyCoords
  arg.page = { x: 50, y: 100 };
  arg.status = {
    delta: { x: 150, y: 100 },
    locked: true,
  };
  arg.phase = 'start';
  restrictEdges.modifyCoords(arg);

  t.ok(arg.page, { x: 200, y: 200 });

  t.end();
});
