import test from '@interactjs/_dev/test/test';
import { mockSignals } from '@interactjs/_dev/test/helpers';

import RestrictSize from '@interactjs/modifiers/restrictSize';
import Interaction from '@interactjs/core/Interaction';

test('restrictSize', t => {
  const interaction = new Interaction({ signals: mockSignals() });
  interaction.prepared = {};
  interaction.prepared.edges = { top: true, bottom: true, left: true, right: true };
  interaction.resizeRects = {};
  interaction.resizeRects.inverted = { x: 10, y: 20, width: 300, height: 200 };
  interaction._interacting = true;

  t.test('works with min and max options', tt => {
    const options = {
      min: { width:  60, height:  50 },
      max: { width: 600, height: 500 },
    };
    const pageCoords = { x: 5, y: 15 };
    const offset = { top: 0, bottom: 0, left: 0, right: 0 };
    const status = {
      options,
      offset,
    };
    const arg = { interaction, status, pageCoords };

    RestrictSize.set(arg);
    tt.deepEqual(arg.options.inner, { top: 170, left: 250, bottom: -Infinity, right: -Infinity });
    tt.deepEqual(arg.options.outer, { top: -280, left: -290, bottom: Infinity, right: Infinity });
    tt.end();
  });

  t.test('works with min option only', tt => {
    const options = {
      min: { width: 60, height: 50 },
    };
    const pageCoords = { x: 5, y: 15 };
    const offset = { top: 0, bottom: 0, left: 0, right: 0 };
    const status = {
      options,
      offset,
    };
    const arg = { interaction, status, pageCoords };

    RestrictSize.set(arg);
    tt.deepEqual(arg.options.inner, { top:       170, left:       250, bottom: -Infinity, right: -Infinity });
    tt.deepEqual(arg.options.outer, { top: -Infinity, left: -Infinity, bottom:  Infinity, right:  Infinity });
    tt.end();
  });

  t.test('works with max option only', tt => {
    const options = {
      max: { width: 600, height: 500 },
    };
    const pageCoords = { x: 5, y: 15 };
    const offset = { top: 0, bottom: 0, left: 0, right: 0 };
    const status = {
      options,
      offset,
    };
    const arg = { interaction, options, status, pageCoords, offset };

    RestrictSize.set(arg);
    tt.deepEqual(arg.options.inner, { top: Infinity, left: Infinity, bottom: -Infinity, right: -Infinity });
    tt.deepEqual(arg.options.outer, { top: -280, left: -290, bottom: Infinity, right: Infinity });
    tt.end();
  });

  t.end();
}, { skip: true });
