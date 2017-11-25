module.exports = {
  base: {
    accept        : null,
    preventDefault: 'auto',
    deltaSource   : 'page',
  },

  perAction: {
    origin: { x: 0, y: 0 },

    inertia: {
      enabled          : false,
      resistance       : 10,    // the lambda in exponential decay
      minSpeed         : 100,   // target speed must be above this for inertia to start
      endSpeed         : 10,    // the speed at which inertia is slow enough to stop
      allowResume      : true,  // allow resuming an action in inertia phase
      smoothEndDuration: 300,   // animate to snap/restrict endOnly if there's no inertia
    },
  },
};
