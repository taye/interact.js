/* browser entry point */

// Interaction
require('./Interaction');

// Legacy browser support
require('./legacyBrowsers');

// pointerEvents
require('./pointerEvents');

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
require('./autoStart');
require('./autoStart/drag');
require('./autoStart/delay');

// export interact
module.exports = require('./interact');
