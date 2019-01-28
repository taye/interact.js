import test from '@interactjs/_dev/test/test';
import * as utils from '@interactjs/utils';
import DropEvent from '../../drop/DropEvent';

const dz1 = { target: 'dz1', fire (event) { this.fired = event; } };
const dz2 = { target: 'dz2', fire (event) { this.fired = event; } };
const el1 = Symbol('el1');
const el2 = Symbol('el2');
const interactable = Symbol('interactable');
const dragElement = Symbol('drag-el');

test('DropEvent constructor', t => {
  const interaction = { dropStatus: {} };
  const dragEvent = Object.freeze({ interaction, interactable, target: dragElement, timeStamp: 10 });

  utils.extend(interaction.dropStatus, {
    activeDrops: [
      { dropzone: dz1, element: el1 },
      { dropzone: dz2, element: el2 },
    ],
    cur : { dropzone: dz1, element: el1 },
    prev: { dropzone: dz2, element: el2 },
    events: {},
  });

  const dropmove = new DropEvent(interaction.dropStatus, dragEvent, 'dropmove');

  t.equal(dropmove.target, el1, 'dropmove uses dropStatus.cur.element');
  t.equal(dropmove.dropzone, dz1, 'dropmove uses dropStatus.cur.dropzone');
  t.equal(dropmove.relatedTarget, dragElement);

  const dragleave = new DropEvent(interaction.dropStatus, dragEvent, 'dragleave');

  t.equal(dragleave.target, el2, 'dropmove uses dropStatus.prev.element');
  t.equal(dragleave.dropzone, dz2, 'dropmove uses dropStatus.prev.dropzone');
  t.equal(dragleave.relatedTarget, dragElement);

  t.end();
});

test('DropEvent.reject()', t => {
  const interaction = { dropStatus: {} };
  const dragEvent = Object.freeze({ interaction, interactable, target: dragElement, timeStamp: 10 });

  utils.extend(interaction.dropStatus, {
    activeDrops: [
      { dropzone: dz1, element: el1 },
      { dropzone: dz2, element: el2 },
    ],
    cur : { dropzone: null, element: null },
    prev: { dropzone: null, element: null },
    events: {},
  });

  const dropactivate = new DropEvent(interaction.dropStatus, dragEvent, 'dropactivate');

  dropactivate.dropzone = dz1;
  dropactivate.target = el1;
  dropactivate.reject();

  t.ok(dropactivate.propagationStopped && dropactivate.immediatePropagationStopped,
    'rejected event propagation is stopped');

  t.equal(dz1.fired.type, 'dropdeactivate', 'dropdeactivate is fired on rejected dropzone');

  t.deepEqual(
    interaction.dropStatus.activeDrops,
    [{ dropzone: dz2, element: el2 }],
    'activeDrop of rejected dropactivate event is removed');

  t.deepEqual(
    interaction.dropStatus.cur,
    { dropzone: null, element: null },
    'dropStatus.cur dropzone and element are set to null after rejecting dropactivate');

  utils.extend(interaction.dropStatus, {
    cur : { dropzone: dz1, element: el1 },
    prev: { dropzone: null, element: null },
    events: {},
  });

  const dropmove = new DropEvent(interaction.dropStatus, dragEvent, 'dropmove');

  dropmove.reject();

  t.deepEqual(
    interaction.dropStatus.cur,
    { dropzone: dz1, element: el1 },
    'dropStatus.cur remains the same after rejecting non activate event');

  t.ok(interaction.dropStatus.rejected, 'dropStatus.rejected === true');

  t.equal(dz1.fired.type, 'dragleave', 'dragleave is fired on rejected dropzone');

  t.end();
});

test('DropEvent.stop[Immediate]Propagation()', t => {
  const dropEvent = new DropEvent({ cur: {} }, {}, 'dragmove');

  t.notOk(dropEvent.propagationStopped || dropEvent.immediatePropagationStopped);

  dropEvent.stopPropagation();
  t.ok(dropEvent.propagationStopped);
  t.notOk(dropEvent.immediatePropagationStopped);

  dropEvent.propagationStopped = false;

  dropEvent.stopImmediatePropagation();
  t.ok(dropEvent.propagationStopped && dropEvent.immediatePropagationStopped);

  t.end();
});
