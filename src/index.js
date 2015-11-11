// browser entry point

// Legacy browser support
require('./legacyBrowsers');

// actions
require('./actions/gesture');
require('./actions/resize');
require('./actions/drag');
require('./actions/drop');

// autoScroll
require('./autoScroll');

// pointerEvents
require('./pointerEvents');

// modifiers
require('./modifiers/snap');
require('./modifiers/restrict');

require('./Interaction');

// autoStart
require('./autoStart');
require('./autoStart/drag');
require('./autoStart/delay');

module.exports = require('./interact');
