// browser entry point

// Legacy browser support
require('./ie8');

module.exports = require('./interact');

// actions
require('./actions/resize');
require('./actions/drag');
require('./actions/gesture');

// autoScroll
require('./autoScroll');

// pointerEvents
require('./pointerEvents');

// modifiers
require('./modifiers/snap');
require('./modifiers/restrict');
