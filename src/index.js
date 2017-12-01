/* browser entry point */

const scope = require('./scope');

scope.Interactable = require('./Interactable');
scope.InteractEvent = require('./InteractEvent');
require('./interactablePreventDefault.js');

const interact = require('./interact');

// modifiers
interact.use(require('./modifiers/base'));
interact.use(require('./modifiers/snap'));
interact.use(require('./modifiers/restrict'));

// inertia
interact.use(require('./inertia'));

// pointerEvents
interact.use(require('./pointerEvents/base'));
interact.use(require('./pointerEvents/holdRepeat'));
interact.use(require('./pointerEvents/interactableTargets'));

// autoStart hold
interact.use(require('./autoStart/base'));
interact.use(require('./autoStart/hold'));

// actions
interact.use(require('./actions/gesture'));
interact.use(require('./actions/resize'));
interact.use(require('./actions/drag'));
interact.use(require('./actions/drop'));

// load these modifiers after resize is loaded
interact.use(require('./modifiers/snapSize'));
interact.use(require('./modifiers/restrictEdges'));
interact.use(require('./modifiers/restrictSize'));

// autoStart actions
interact.use(require('./autoStart/gesture'));
interact.use(require('./autoStart/resize'));
interact.use(require('./autoStart/drag'));

// autoScroll
interact.use(require('./autoScroll'));

// export interact
module.exports = interact;
