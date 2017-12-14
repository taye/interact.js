require('./Interactable');
require('./Interaction');

// Legacy browser support
//require('./legacyBrowsers');

require('./Eventable');

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
require('./modifiers/restrictSize');

// autoStart hold
require('./autoStart/hold');

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
