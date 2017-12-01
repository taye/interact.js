const test = require('./test');
const helpers = require('./helpers');

test('docEvents', t => {
  const scope = helpers.mockScope();
  const docEvents = require('../src/docEvents');
  const interaction = docEvents.newInteraction(
    { pointerType: 'TEST' },
    scope
  );

  t.equal(scope.interactions[0], interaction,
    'new Interaction is pushed to scope.interactions');

  docEvents.init(scope);

  t.ok(scope.docEvents instanceof Object, 'docEvents object added to scope');

  const listeners = scope.docEvents.listeners;

  t.ok(docEvents.methodNames.reduce((acc, m) => acc && typeof listeners[m] === 'function', true),
    'docEvents object added to scope');

  t.end();
});

