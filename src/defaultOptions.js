module.exports = {
  base: {
    accept        : null,
    actionChecker : null,
    styleCursor   : true,
    preventDefault: 'auto',
    origin        : { x: 0, y: 0 },
    deltaSource   : 'page',
    allowFrom     : null,
    ignoreFrom    : null,
    checker       : null,
  },

  perAction: {
    manualStart: false,
    max: Infinity,
    maxPerElement: 1,

    inertia: {
      enabled          : false,
      resistance       : 10,    // the lambda in exponential decay
      minSpeed         : 100,   // target speed must be above this for inertia to start
      endSpeed         : 10,    // the speed at which inertia is slow enough to stop
      allowResume      : true,  // allow resuming an action in inertia phase
      zeroResumeDelta  : true,  // if an action is resumed after launch, set dx/dy to 0
      smoothEndDuration: 300,   // animate to snap/restrict endOnly if there's no inertia
    },
  },

  _holdDuration: 600,
};
