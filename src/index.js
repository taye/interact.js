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

// delay
require('./autoStart/delay');

// actions
require('./autoStart/gesture');
require('./autoStart/resize');
require('./autoStart/drag');

require('./actions/drop');

// Interactable preventDefault setting
require('./interactablePreventDefault.js');

// autoScroll
require('./autoScroll');

// export interact
module.exports = require('./interact');
