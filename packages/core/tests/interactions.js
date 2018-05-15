import test from '@interactjs/_dev/test/test';
import * as helpers from '@interactjs/_dev/test/helpers';
import { jsdom } from 'jsdom';

import Interaction from '@interactjs/core/Interaction';
import Signals from '@interactjs/utils/Signals';
import interactions from '@interactjs/core/interactions';

test('interactions', t => {
  let scope = helpers.mockScope();

  interactions.init(scope);

  const interaction = interactions.newInteraction(
    { pointerType: 'TEST' },
    scope
  );

  t.equal(scope.interactions.list[0], interaction,
    'new Interaction is pushed to scope.interactions');

  interactions.init(scope);

  t.ok(scope.interactions instanceof Object, 'interactions object added to scope');

  const listeners = scope.interactions.listeners;

  t.ok(interactions.methodNames.reduce((acc, m) => acc && typeof listeners[m] === 'function', true),
    'interactions object added to scope');

  scope = helpers.mockScope();

  interactions.init(scope);
  const newInteraction = scope.interactions.new({});

  t.assert(typeof scope.interactions === 'object');
  t.assert(scope.interactions.signals instanceof Signals);
  t.assert(typeof scope.interactions.new === 'function');
  t.assert(newInteraction instanceof Interaction);
  t.equal(newInteraction._signals, scope.interactions.signals);

  t.assert(typeof scope.actions === 'object');
  t.deepEqual(scope.actions.names, []);
  t.deepEqual(scope.actions.methodDict, {});

  t.end();
});

test('interactions document event options', t => {
  const scope = helpers.mockScope();
  const doc = scope.document;

  let options = {};
  scope.browser = { isIOS: false };
  scope.signals.fire('add-document', { doc, scope, options });

  t.deepEqual(
    options,
    {},
    'no doc options.event.passive is added when not iOS');

  options = {};

  scope.browser.isIOS = true;
  scope.signals.fire('add-document', { doc, scope, options });

  t.deepEqual(
    options,
    { events: { passive: false } },
    'doc options.event.passive is set to false for iOS');

  t.end();
});
