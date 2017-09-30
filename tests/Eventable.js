const test = require('./test');
const Eventable = require('../src/Eventable');

test('Eventable.{on,fire}', t => {
  const eventable = new Eventable();
  const type = 'TEST';

  const testEvent = { type };
  let firedEvent;

  eventable.on(type, event => { firedEvent = event; });

  eventable.fire(testEvent);

  t.equal(firedEvent, testEvent);

  t.end();
});

test('Eventable.off', t => {
  const eventable = new Eventable();
  const type = 'TEST';

  const testEvent = { type };
  let firedEvent;
  const listener = event => { firedEvent = event; };

  eventable.on(type, listener);
  eventable.off(type, listener);
  eventable.fire(testEvent);

  t.equal(firedEvent, undefined);

  t.end();
});
