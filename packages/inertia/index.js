import modifiers  from '@interactjs/modifiers/base';
import * as utils from '@interactjs/utils';
import raf        from '@interactjs/utils/raf';

function install (scope) {
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
  const state = interaction.inertia;

  // Check if the down event hits the current inertia target
  if (state.active) {
    let element = eventTarget;

    // climb up the DOM tree from the event target
    while (utils.is.element(element)) {

      // if interaction element is the current inertia target element
      if (element === interaction.element) {
        // stop inertia
        raf.cancel(state.i);
        state.active = false;
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

function release ({ interaction, event, noPreEnd }, scope) {
  const state = interaction.inertia;

  if (!interaction.interacting() ||
    (interaction.simulation && interaction.simulation.active) ||
  noPreEnd) {
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
                     && event !== state.startEvent);

  const inertia = (inertiaPossible
    && (now - interaction.coords.cur.timeStamp) < 50
    && pointerSpeed > options.minSpeed
    && pointerSpeed > options.endSpeed);

  const modifierArg = {
    interaction,
    pageCoords: utils.extend({}, interaction.coords.cur.page),
    states: inertiaPossible && interaction.modifiers.states.map(
      modifierStatus => utils.extend({}, modifierStatus)
    ),
    preEnd: true,
    requireEndOnly: true,
  };

  // smoothEnd
  if (inertiaPossible && !inertia) {
    modifierResult = modifiers.setAll(modifierArg);

    if (modifierResult.shouldMove) {
      smoothEnd = true;
    }
  }

  if (!(inertia || smoothEnd)) { return; }

  utils.pointer.copyCoords(state.upCoords, interaction.coords.cur);

  interaction.pointers[0].pointer = state.startEvent = new scope.InteractEvent(
    interaction, event, interaction.prepared.name, 'inertiastart', interaction.element);

  state.t0 = now;

  state.active = true;
  state.allowResume = options.allowResume;
  interaction.simulation = state;

  interaction.target.fire(state.startEvent);

  if (inertia) {
    state.vx0 = interaction.coords.velocity.client.x;
    state.vy0 = interaction.coords.velocity.client.y;
    state.v0 = pointerSpeed;

    calcInertia(interaction, state);

    utils.extend(modifierArg.pageCoords, interaction.coords.cur.page);

    modifierArg.pageCoords.x += state.xe;
    modifierArg.pageCoords.y += state.ye;

    modifierResult = modifiers.setAll(modifierArg);

    state.modifiedXe += modifierResult.delta.x;
    state.modifiedYe += modifierResult.delta.y;

    state.i = raf.request(() => inertiaTick(interaction));
  }
  else {
    state.smoothEnd = true;
    state.xe = modifierResult.delta.x;
    state.ye = modifierResult.delta.y;

    state.sx = state.sy = 0;

    state.i = raf.request(() => smothEndTick(interaction));
  }

  return false;
}

function stop ({ interaction }) {
  const state = interaction.inertia;

  if (state.active) {
    raf.cancel(state.i);
    state.active = false;
    interaction.simulation = null;
  }
}

function calcInertia (interaction, state) {
  const options = getOptions(interaction);
  const lambda = options.resistance;
  const inertiaDur = -Math.log(options.endSpeed / state.v0) / lambda;

  state.x0 = interaction.prevEvent.page.x;
  state.y0 = interaction.prevEvent.page.y;
  state.t0 = state.startEvent.timeStamp / 1000;
  state.sx = state.sy = 0;

  state.modifiedXe = state.xe = (state.vx0 - inertiaDur) / lambda;
  state.modifiedYe = state.ye = (state.vy0 - inertiaDur) / lambda;
  state.te = inertiaDur;

  state.lambda_v0 = lambda / state.v0;
  state.one_ve_v0 = 1 - options.endSpeed / state.v0;
}

function inertiaTick (interaction) {
  updateInertiaCoords(interaction);
  utils.pointer.setCoordDeltas(interaction.coords.delta, interaction.coords.prev, interaction.coords.cur);
  utils.pointer.setCoordVelocity(interaction.coords.velocity, interaction.coords.delta);

  const state = interaction.inertia;
  const options = getOptions(interaction);
  const lambda = options.resistance;
  const t = new Date().getTime() / 1000 - state.t0;

  if (t < state.te) {

    const progress =  1 - (Math.exp(-lambda * t) - state.lambda_v0) / state.one_ve_v0;

    if (state.modifiedXe === state.xe && state.modifiedYe === state.ye) {
      state.sx = state.xe * progress;
      state.sy = state.ye * progress;
    }
    else {
      const quadPoint = utils.getQuadraticCurvePoint(
        0, 0,
        state.xe, state.ye,
        state.modifiedXe, state.modifiedYe,
        progress);

      state.sx = quadPoint.x;
      state.sy = quadPoint.y;
    }

    interaction.move();

    state.i = raf.request(() => inertiaTick(interaction));
  }
  else {
    state.sx = state.modifiedXe;
    state.sy = state.modifiedYe;

    interaction.move();
    interaction.end(state.startEvent);
    state.active = false;
    interaction.simulation = null;
  }

  utils.pointer.copyCoords(interaction.coords.prev, interaction.coords.cur);
}

function smothEndTick (interaction) {
  updateInertiaCoords(interaction);

  const state = interaction.inertia;
  const t = new Date().getTime() - state.t0;
  const { smoothEndDuration: duration } = getOptions(interaction);

  if (t < duration) {
    state.sx = utils.easeOutQuad(t, 0, state.xe, duration);
    state.sy = utils.easeOutQuad(t, 0, state.ye, duration);

    interaction.move();

    state.i = raf.request(() => smothEndTick(interaction));
  }
  else {
    state.sx = state.xe;
    state.sy = state.ye;

    interaction.move();
    interaction.end(state.startEvent);

    state.smoothEnd =
      state.active = false;
    interaction.simulation = null;
  }
}

function updateInertiaCoords (interaction) {
  const state = interaction.inertia;

  // return if inertia isn't running
  if (!state.active) { return; }

  const pageUp   = state.upCoords.page;
  const clientUp = state.upCoords.client;

  utils.pointer.setCoords(interaction.coords.cur, [ {
    pageX  : pageUp.x   + state.sx,
    pageY  : pageUp.y   + state.sy,
    clientX: clientUp.x + state.sx,
    clientY: clientUp.y + state.sy,
  } ]);
}

function getOptions ({ target, prepared }) {
  return target && target.options && prepared.name && target.options[prepared.name].inertia;
}

export default {
  install,
  calcInertia,
  inertiaTick,
  smothEndTick,
  updateInertiaCoords,
};
