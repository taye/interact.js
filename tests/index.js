import './Interactable';
import './Interaction';
import './interactions';

// Legacy browser support
//import './legacyBrowsers';

import './Eventable';

// pointerEvents
import '@interactjs/pointerEvents/base';
import '@interactjs/pointerEvents/PointerEvent';
import '@interactjs/pointerEvents/holdRepeat';
//import '@interactjs/pointerEvents/interactableTargets';

// inertia
//import './inertia';

// modifiers
import '@interactjs/modifiers/snap';
import '@interactjs/modifiers/snapSize';
//import '@interactjs/modifiers/restrict';
import '@interactjs/modifiers/restrictSize';
import '@interactjs/modifiers/restrictEdges';

// autoStart hold
import '@interactjs/autoStart/hold';

// actions
//import './actions/gesture';
//import './actions/resize';
import './actions/drag';
//import './actions/drop';

// autoStart actions
//import '@interactjs/autoStart/gesture';
//import '@interactjs/autoStart/resize';
//import '@interactjs/autoStart/drag';

// Interactable preventDefault setting
//import './interactablePreventDefault.js';

// autoScroll
//import '@interactjs/autoScroll';

import '@interactjs/reflow';

import './interact';

//const index = import '@interactjs/core/index';
//const test = import 'tape';

//test('module export', function (t) {
//t.equal(index, import '@interactjs/interact');
//});
