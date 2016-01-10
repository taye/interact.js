/* browser entry point */

// Legacy browser support
require('./legacyBrowsers');

// pointerEvents
require('./pointerEvents');
require('./pointerEvents/interactableTargets');

// inertia
require('./inertia');

// modifiers
require('./modifiers/snap');
require('./modifiers/restrict');

// actions
require('./actions/gesture');
require('./actions/resize');
require('./actions/drag');
require('./actions/drop');

// autoStart
const autoStart = require('./autoStart');
require('./autoStart/drag');
require('./autoStart/delay');
autoStart.setActionDefaults('drag');
autoStart.setActionDefaults('resize');
autoStart.setActionDefaults('gesture');

// Interactable preventDefault setting
require('./interactablePreventDefault.js');

// autoScroll
require('./autoScroll');

// export interact
module.exports = require('./interact');
