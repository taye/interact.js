// browser entry point

// Legacy browser support
require('./legacyBrowsers');

// actions
require('./actions/resize');
require('./actions/drag');
require('./actions/drop');
require('./actions/gesture');

require('./delay.js');

// autoScroll
require('./autoScroll');

// pointerEvents
require('./pointerEvents');

// modifiers
require('./modifiers/snap');
require('./modifiers/restrict');

require('./Interaction.js');

module.exports = require('./interact');
