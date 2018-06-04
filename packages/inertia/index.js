import modifiers  from '@interactjs/modifiers/base';
import * as utils from '@interactjs/utils';
import raf        from '@interactjs/utils/raf';

function init (scope) {
  const {
    interactions,
    defaults,
  } = scope;

  interactions.signals.on('new', function (interaction) {
    interaction.inertia = {
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

  interactions.signals.on('before-action-end', arg => release(arg, scope));
  interactions.signals.on('down'             , arg => resume (arg, scope));
  interactions.signals.on('stop'             , arg => stop   (arg, scope));

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
  const status = interaction.inertia;

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
        utils.pointer.setCoords(
          interaction.coords.cur,
          interaction.pointers.map(p => p.pointer)
        );

        // fire appropriate signals
        const signalArg = {
          interaction,
        };

        scope.interactions.signals.fire('action-resume', signalArg);

        // fire a reume event
        const resumeEvent = new scope.InteractEvent(
          interaction, event, interaction.prepared.name, 'resume', interaction.element);

        interaction._fireEvent(resumeEvent);

        utils.pointer.copyCoords(interaction.coords.prev, interaction.coords.cur);
        break;
      }

      element = utils.dom.parentNode(element);
    }
  }
}

function release ({ interaction, event }, scope) {
  const status = interaction.inertia;

  if (!interaction.interacting() || (interaction.simulation && interaction.simulation.active)) {
    return;
  }

  const options = getOptions(interaction);

  const now = new Date().getTime();
  const { client: velocityClient } = interaction.coords.velocity;
  const pointerSpeed = utils.hypot(velocityClient.x, velocityClient.y);

  let smoothEnd = false;
  let modifierResult;

  // check if inertia should be started
  const inertiaPossible = (options && options.enabled
                     && interaction.prepared.name !== 'gesture'
                     && event !== status.startEvent);

  const inertia = (inertiaPossible
    && (now - interaction.coords.cur.timeStamp) < 50
    && pointerSpeed > options.minSpeed
    && pointerSpeed > options.endSpeed);

  const modifierArg = {
    interaction,
    pageCoords: utils.extend({}, interaction.coords.cur.page),
    statuses: inertiaPossible && interaction.modifiers.statuses.map(
      modifierStatus => utils.extend({}, modifierStatus)
    ),
    preEnd: true,
    requireEndOnly: true,
  };

  // smoothEnd
  if (inertiaPossible && !inertia) {
    modifierResult = modifiers.setAll(modifierArg, scope.modifiers);

    if (modifierResult.shouldMove && modifierResult.locked) {
      smoothEnd = true;
    }
  }

  if (!(inertia || smoothEnd)) { return; }

  utils.pointer.copyCoords(status.upCoords, interaction.coords.cur);

  interaction.pointers[0].pointer = status.startEvent = new scope.InteractEvent(
    interaction, event, interaction.prepared.name, 'inertiastart', interaction.element);

  status.t0 = now;

  status.active = true;
  status.allowResume = options.allowResume;
  interaction.simulation = status;

  interaction.target.fire(status.startEvent);

  if (inertia) {
    status.vx0 = interaction.coords.velocity.client.x;
    status.vy0 = interaction.coords.velocity.client.y;
    status.v0 = pointerSpeed;

    calcInertia(interaction, status);

    utils.extend(modifierArg.pageCoords, interaction.coords.cur.page);

    modifierArg.pageCoords.x += status.xe;
    modifierArg.pageCoords.y += status.ye;

    modifierResult = modifiers.setAll(modifierArg, scope.modifiers);

    status.modifiedXe += modifierResult.delta.x;
    status.modifiedYe += modifierResult.delta.y;

    status.i = raf.request(() => inertiaTick(interaction));
  }
  else {
    status.smoothEnd = true;
    status.xe = modifierResult.delta.x;
    status.ye = modifierResult.delta.y;

    status.sx = status.sy = 0;

    status.i = raf.request(() => smothEndTick(interaction));
  }

  return false;
}

function stop ({ interaction }) {
  const status = interaction.inertia;

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

  status.x0 = interaction.prevEvent.page.x;
  status.y0 = interaction.prevEvent.page.y;
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
  utils.pointer.setCoordDeltas(interaction.coords.delta, interaction.coords.prev, interaction.coords.cur);
  utils.pointer.setCoordVelocity(interaction.coords.velocity, interaction.coords.delta);

  const status = interaction.inertia;
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

    interaction.move();

    status.i = raf.request(() => inertiaTick(interaction));
  }
  else {
    status.sx = status.modifiedXe;
    status.sy = status.modifiedYe;

    interaction.move();
    interaction.end(status.startEvent);
    status.active = false;
    interaction.simulation = null;
  }

  utils.pointer.copyCoords(interaction.coords.prev, interaction.coords.cur);
}

function smothEndTick (interaction) {
  updateInertiaCoords(interaction);

  const status = interaction.inertia;
  const t = new Date().getTime() - status.t0;
  const { smoothEndDuration: duration } = getOptions(interaction);

  if (t < duration) {
    status.sx = utils.easeOutQuad(t, 0, status.xe, duration);
    status.sy = utils.easeOutQuad(t, 0, status.ye, duration);

    interaction.move();

    status.i = raf.request(() => smothEndTick(interaction));
  }
  else {
    status.sx = status.xe;
    status.sy = status.ye;

    interaction.move();
    interaction.end(status.startEvent);

    status.smoothEnd =
      status.active = false;
    interaction.simulation = null;
  }
}

function updateInertiaCoords (interaction) {
  const status = interaction.inertia;

  // return if inertia isn't running
  if (!status.active) { return; }

  const pageUp   = status.upCoords.page;
  const clientUp = status.upCoords.client;

  utils.pointer.setCoords(interaction.coords.cur, [ {
    pageX  : pageUp.x   + status.sx,
    pageY  : pageUp.y   + status.sy,
    clientX: clientUp.x + status.sx,
    clientY: clientUp.y + status.sy,
  } ]);
}

function getOptions ({ target, prepared }) {
  return target && target.options && prepared.name && target.options[prepared.name].inertia;
}

export default {
  init,
  calcInertia,
  inertiaTick,
  smothEndTick,
  updateInertiaCoords,
};
