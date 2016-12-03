/* browser entry point */

// Legacy browser support
require('./legacyBrowsers');

// pointerEvents
require('./pointerEvents');
require('./pointerEvents/holdRepeat');
require('./pointerEvents/interactableTargets');

// inertia
require('./inertia');

// modifiers
require('./modifiers/snap');
require('./modifiers/restrict');

// delay
require('./autoStart/delay');

// actions
require('./actions/gesture');
require('./actions/resize');
require('./actions/drag');
require('./actions/drop');

// load these modifiers after resize is loaded
require('./modifiers/restrictEdges');
require('./modifiers/restrictSize');

// autoStart actions
require('./autoStart/gesture');
require('./autoStart/resize');
require('./autoStart/drag');

// Interactable preventDefault setting
require('./interactablePreventDefault.js');

// autoScroll
require('./autoScroll');

// export interact
module.exports = require('./interact');
