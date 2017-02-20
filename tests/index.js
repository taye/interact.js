require('./Interaction');

// Legacy browser support
//require('./legacyBrowsers');

// pointerEvents
require('./pointerEvents/base');
require('./pointerEvents/PointerEvent');
require('./pointerEvents/holdRepeat');
//require('./pointerEvents/interactableTargets');

// inertia
//require('./inertia');

// modifiers
//require('./modifiers/snap');
//require('./modifiers/restrict');

// delay
//require('./autoStart/delay');

// actions
require('./actions/base');
//require('./actions/gesture');
//require('./actions/resize');
require('./actions/drag');
//require('./actions/drop');

// autoStart actions
//require('./autoStart/gesture');
//require('./autoStart/resize');
//require('./autoStart/drag');

// Interactable preventDefault setting
//require('./interactablePreventDefault.js');

// autoScroll
//require('./autoScroll');

// export interact
//require('./interact');

//const index = require('../src/index');
//const test = require('tape');

//test('module export', function (t) {
  //t.equal(index, require('../src/interact'));
//});
