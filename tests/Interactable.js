const test = require('./test');
const d = require('./domator');

const Interactable = require('../src/Interactable');
const actions = require('../src/actions/base');

test('Interactable copies and extends defaults', t => {
  actions.methodDict.test = 'testize';
  Interactable.prototype.testize = function (options) {
    this.setPerAction('test', options);
  };

  const defaults = require('../src/defaultOptions');
  defaults.test = {
    fromDefault: { a: 1, b: 2 },
    specified: { c: 1, d: 2 },
  };

  const specified = { specified: 'parent' };

  const div = d('div');
  const interactable = new Interactable(div, { test: specified });

  t.deepEqual(interactable.options.test.specified, specified.specified,
    'specified options are properly set');
  t.deepEqual(interactable.options.test.fromDefault, defaults.test.fromDefault,
    'default options are properly set');
  t.notEqual(interactable.options.test.fromDefault, defaults.test.fromDefault,
    'defaults are not aliased');

  defaults.test.fromDefault.c = 3;
  t.notOk('c' in interactable.options.test.fromDefault,
    'modifying defaults does not affect constructed interactables');

  // Undo global changes
  delete actions.methodDict.test;
  delete Interactable.prototype.testize;
  delete defaults.test;

  t.end();
});

test('Interactable copies and extends per action defaults', t => {
  actions.methodDict.test = 'testize';
  Interactable.prototype.testize = function (options) {
    this.setPerAction('test', options);
  };

  const defaults = require('../src/defaultOptions');
  defaults.perAction.testModifier = {
    fromDefault: { a: 1, b: 2 },
    specified: null,
  };
  defaults.test = { testModifier: defaults.perAction.testModifier };

  const div = d('div');
  const interactable = new Interactable(div, {});
  interactable.testize({ testModifier: { specified: 'parent' } });

  t.deepEqual(interactable.options.test, { testModifier: {
    fromDefault: { a: 1, b: 2},
    specified: 'parent',
  }}, 'specified options are properly set');
  t.deepEqual(
    interactable.options.test.testModifier.fromDefault,
    defaults.perAction.testModifier.fromDefault,
    'default options are properly set');
  t.notEqual(
    interactable.options.test.testModifier.fromDefault,
    defaults.perAction.testModifier.fromDefault,
    'defaults are not aliased');

  defaults.perAction.testModifier.fromDefault.c = 3;
  t.notOk('c' in interactable.options.test.testModifier.fromDefault,
    'modifying defaults does not affect constructed interactables');

  // Undo global changes
  delete actions.methodDict.test;
  delete Interactable.prototype.test;
  delete defaults.test;
  delete defaults.perAction.testModifier;

  t.end();
});
