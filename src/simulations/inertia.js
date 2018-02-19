const modifiers = require('../modifiers/base');
const utils     = require('../utils');
const raf       = require('../utils/raf');

function init (scope) {
  const {
    Interaction,
    defaults,
  } = scope;

  Interaction.signals.on('new', function (interaction) {
    interaction.simulations.inertia = {
      active     : false,
      smoothEnd  : false,
      allowResume: false,

      startEvent: null,
      upCoords  : {},

      xe: 0, ye: 0,
      sx: 0, sy: 0,

      t0: 0,
      vx0: 0, vys: 0,
      duration: 0,

      lambda_v0: 0,
      one_ve_v0: 0,
      i  : null,
    };
  });

  Interaction.signals.on('up'  , arg => release(arg, scope));
  Interaction.signals.on('down', arg => resume (arg, scope));
  Interaction.signals.on('stop', arg => stop   (arg, scope));

  defaults.perAction.inertia = {
    enabled          : false,
    resistance       : 10,    // the lambda in exponential decay
    minSpeed         : 100,   // target speed must be above this for inertia to start
    endSpeed         : 10,    // the speed at which inertia is slow enough to stop
    allowResume      : true,  // allow resuming an action in inertia phase
    smoothEndDuration: 300,   // animate to snap/restrict endOnly if there's no inertia
  };
}

function resume ({ interaction, event, pointer, eventTarget }, scope) {
  const status = interaction.simulations.inertia;

  // Check if the down event hits the current inertia target
  if (status.active) {
    let element = eventTarget;

    // climb up the DOM tree from the event target
    while (utils.is.element(element)) {

      // if interaction element is the current inertia target element
      if (element === interaction.element) {
        // stop inertia
        raf.cancel(status.i);
        status.active = false;
        interaction.simulation = null;

        // update pointers to the down event's coordinates
        interaction.updatePointer(pointer, event, eventTarget, true);
        utils.pointer.setCoords(interaction.curCoords, interaction.pointers);

        // fire appropriate signals
        const signalArg = {
          interaction,
        };

        scope.Interaction.signals.fire('action-resume', signalArg);

        // fire a reume event
        const resumeEvent = new scope.InteractEvent(
          interaction, event, interaction.prepared.name, 'inertiaresume', interaction.element);

        interaction.target.fire(resumeEvent);
        interaction.prevEvent = resumeEvent;
        modifiers.resetStatuses(interaction.modifierStatuses, scope.modifiers);

        utils.pointer.copyCoords(interaction.prevCoords, interaction.curCoords);
        break;
      }

      element = utils.dom.parentNode(element);
    }
  }
}

function release ({ interaction, event }, scope) {
  const status = interaction.simulations.inertia;

  if (!interaction.interacting() || (interaction.simulation && interaction.simulation.active)) {
    return;
  }

  const options = getOptions(interaction);

  const now = new Date().getTime();
  const pointerSpeed = interaction.pointerDelta.client.speed;

  let smoothEnd = false;
  let modifierResult;

  // check if inertia should be started
  const inertiaPossible = (options && options.enabled
                     && interaction.prepared.name !== 'gesture'
                     && event !== status.startEvent);

  const inertia = (inertiaPossible
    && (now - interaction.curCoords.timeStamp) < 50
    && pointerSpeed > options.minSpeed
    && pointerSpeed > options.endSpeed);

  const modifierArg = {
    interaction,
    pageCoords: utils.extend({}, interaction.curCoords.page),
    statuses: {},
    preEnd: true,
    requireEndOnly: true,
  };

  // smoothEnd
  if (inertiaPossible && !inertia) {
    modifiers.resetStatuses(modifierArg.statuses, scope.modifiers);

    modifierResult = modifiers.setAll(modifierArg, scope.modifiers);

    if (modifierResult.shouldMove && modifierResult.locked) {
      smoothEnd = true;
    }
  }

  if (!(inertia || smoothEnd)) { return; }

  utils.pointer.copyCoords(status.upCoords, interaction.curCoords);

  interaction.pointers[0] = status.startEvent = new scope.InteractEvent(
    interaction, event, interaction.prepared.name, 'inertiastart', interaction.element);

  status.t0 = now;

  status.active = true;
  status.allowResume = options.allowResume;
  interaction.simulation = status;

  interaction.target.fire(status.startEvent);

  if (inertia) {
    status.vx0 = interaction.pointerDelta.client.vx;
    status.vy0 = interaction.pointerDelta.client.vy;
    status.v0 = pointerSpeed;

    calcInertia(interaction, status);

    utils.extend(modifierArg.pageCoords, interaction.curCoords.page);

    modifierArg.pageCoords.x += status.xe;
    modifierArg.pageCoords.y += status.ye;

    modifiers.resetStatuses(modifierArg.statuses, scope.modifiers);

    modifierResult = modifiers.setAll(modifierArg, scope.modifiers);

    status.modifiedXe += modifierResult.dx;
    status.modifiedYe += modifierResult.dy;

    status.i = raf.request(() => inertiaTick(interaction));
  }
  else {
    status.smoothEnd = true;
    status.xe = modifierResult.dx;
    status.ye = modifierResult.dy;

    status.sx = status.sy = 0;

    status.i = raf.request(() => smothEndTick(interaction));
  }
}

function stop ({ interaction }) {
  const status = interaction.simulations.inertia;

  if (status.active) {
    raf.cancel(status.i);
    status.active = false;
    interaction.simulation = null;
  }
}

function calcInertia (interaction, status) {
  const options = getOptions(interaction);
  const lambda = options.resistance;
  const inertiaDur = -Math.log(options.endSpeed / status.v0) / lambda;

  status.x0 = interaction.prevEvent.pageX;
  status.y0 = interaction.prevEvent.pageY;
  status.t0 = status.startEvent.timeStamp / 1000;
  status.sx = status.sy = 0;

  status.modifiedXe = status.xe = (status.vx0 - inertiaDur) / lambda;
  status.modifiedYe = status.ye = (status.vy0 - inertiaDur) / lambda;
  status.te = inertiaDur;

  status.lambda_v0 = lambda / status.v0;
  status.one_ve_v0 = 1 - options.endSpeed / status.v0;
}

function inertiaTick (interaction) {
  updateInertiaCoords(interaction);
  utils.pointer.setCoordDeltas(interaction.pointerDelta, interaction.prevCoords, interaction.curCoords);

  const status = interaction.simulations.inertia;
  const options = getOptions(interaction);
  const lambda = options.resistance;
  const t = new Date().getTime() / 1000 - status.t0;

  if (t < status.te) {

    const progress =  1 - (Math.exp(-lambda * t) - status.lambda_v0) / status.one_ve_v0;

    if (status.modifiedXe === status.xe && status.modifiedYe === status.ye) {
      status.sx = status.xe * progress;
      status.sy = status.ye * progress;
    }
    else {
      const quadPoint = utils.getQuadraticCurvePoint(
        0, 0,
        status.xe, status.ye,
        status.modifiedXe, status.modifiedYe,
        progress);

      status.sx = quadPoint.x;
      status.sy = quadPoint.y;
    }

    interaction.doMove();

    status.i = raf.request(() => inertiaTick(interaction));
  }
  else {
    status.sx = status.modifiedXe;
    status.sy = status.modifiedYe;

    interaction.doMove();
    interaction.end(status.startEvent);
    status.active = false;
    interaction.simulation = null;
  }

  utils.pointer.copyCoords(interaction.prevCoords, interaction.curCoords);
}

function smothEndTick (interaction) {
  updateInertiaCoords(interaction);

  const status = interaction.simulations.inertia;
  const t = new Date().getTime() - status.t0;
  const { smoothEndDuration: duration } = getOptions(interaction);

  if (t < duration) {
    status.sx = utils.easeOutQuad(t, 0, status.xe, duration);
    status.sy = utils.easeOutQuad(t, 0, status.ye, duration);

    interaction.doMove();

    status.i = raf.request(() => smothEndTick(interaction));
  }
  else {
    status.sx = status.xe;
    status.sy = status.ye;

    interaction.doMove();
    interaction.end(status.startEvent);

    status.smoothEnd =
      status.active = false;
    interaction.simulation = null;
  }
}

function updateInertiaCoords (interaction) {
  const status = interaction.simulations.inertia;

  // return if inertia isn't running
  if (!status.active) { return; }

  const pageUp   = status.upCoords.page;
  const clientUp = status.upCoords.client;

  utils.pointer.setCoords(interaction.curCoords, [ {
    pageX  : pageUp.x   + status.sx,
    pageY  : pageUp.y   + status.sy,
    clientX: clientUp.x + status.sx,
    clientY: clientUp.y + status.sy,
  } ]);
}

function getOptions ({ target, prepared }) {
  return target && target.options && prepared.name && target.options[prepared.name].inertia;
}

module.exports = {
  init,
  calcInertia,
  inertiaTick,
  smothEndTick,
  updateInertiaCoords,
};
