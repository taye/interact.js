const test = require('../test');

test('autoStart/hold', t => {
  const autoStart = require('../../src/autoStart/base');
  const autoStartHold = require('../../src/autoStart/hold');

  t.equal(autoStart.defaults.perAction.hold, 0, 'sets autoStart.defaults.perAction.hold');
  t.equal(autoStart.defaults.perAction.delay, 0, 'backwards compatible "delay" alias.');

  const holdDuration = 1000;
  const actionName = 'TEST_ACTION';
  const interaction = {
    target: { options: { [actionName]: { hold: holdDuration } } },
    prepared: { name: actionName },
  };

  t.equal(
    autoStartHold.getHoldDuration(interaction, 'drag'),
    holdDuration,
    'gets holdDuration');

  const delayDuration = 500;

  interaction.target.options[actionName].delay = delayDuration;
  delete interaction.target.options[actionName].hold;

  t.equal(
    autoStartHold.getHoldDuration(interaction, 'drag'),
    delayDuration,
    'gets holdDuration from "delay" value');

  t.end();
});
