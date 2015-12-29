/* browser entry point */

// Interaction
require('./Interaction');

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

// autoScroll
require('./autoScroll');

// autoStart
const autoStart = require('./autoStart');
require('./autoStart/drag');
require('./autoStart/delay');
autoStart.setActionDefaults('drag');
autoStart.setActionDefaults('resize');
autoStart.setActionDefaults('gesture');

// export interact
module.exports = require('./interact');
