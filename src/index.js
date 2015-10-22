// browser entry point

// Legacy browser support
require('./legacyBrowsers');

// actions
require('./actions/gesture');
require('./actions/resize');
require('./actions/drag');
require('./actions/drop');

require('./delay.js');

// autoScroll
require('./autoScroll');

// pointerEvents
require('./pointerEvents');

// modifiers
require('./modifiers/snap');
require('./modifiers/restrict');

require('./Interaction');
require('./autoStart');

module.exports = require('./interact');
