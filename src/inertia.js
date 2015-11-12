const InteractEvent  = require('./InteractEvent');
const Interaction    = require('./Interaction');
const modifiers      = require('./modifiers');
const utils          = require('./utils');
const animationFrame = utils.raf;

Interaction.signals.on('new', function (interaction) {
  interaction.inertiaStatus = {
    active   : false,
    smoothEnd: false,
    ending   : false,

    startEvent: null,
    upCoords  : {},

    xe: 0, ye: 0,
    sx: 0, sy: 0,

    t0: 0,
    vx0: 0, vys: 0,
    duration: 0,

    resumeDx: 0,
    resumeDy: 0,

    lambda_v0: 0,
    one_ve_v0: 0,
    i  : null,
  };

  interaction.boundInertiaFrame   = () => inertiaFrame  .apply(interaction);
  interaction.boundSmoothEndFrame = () => smoothEndFrame.apply(interaction);
});

Interaction.signals.on('down', function ({ interaction, eventTarget }) {
  // Check if the down event hits the current inertia target
  if (interaction.inertiaStatus.active) {
    let element = eventTarget;

    // climb up the DOM tree from the event target
    while (utils.isElement(element)) {

      // if interaction element is the current inertia target element
      if (element === interaction.element) {

        // stop inertia so that the next move will be a normal one
        animationFrame.cancel(interaction.inertiaStatus.i);
        interaction.inertiaStatus.active = false;

        interaction.doMove();
        break;
      }
      element = utils.parentElement(element);
    }
  }
});

Interaction.signals.on('up', function ({ interaction }) {
  const target = interaction.target;
  const options = target && target.options;
  const inertiaOptions = options && interaction.prepared.name && options[interaction.prepared.name].inertia;
  const inertiaStatus = interaction.inertiaStatus;

  if (interaction.interacting()) {

    if (inertiaStatus.active && !inertiaStatus.ending) { return; }

    const now = new Date().getTime();
    const statuses = {};
    const page = utils.extend({}, interaction.curCoords.page);
    const pointerSpeed = interaction.pointerDelta.client.speed;
    let inertiaPossible = false;
    let inertia = false;
    let smoothEnd = false;
    let modifierResult;

    // check if inertia should be started
    inertiaPossible = (inertiaOptions && inertiaOptions.enabled
                       && interaction.prepared.name !== 'gesture'
                       && event !== inertiaStatus.startEvent);

    inertia = (inertiaPossible
              && (now - interaction.curCoords.timeStamp) < 50
              && pointerSpeed > inertiaOptions.minSpeed
              && pointerSpeed > inertiaOptions.endSpeed);

    // smoothEnd
    if (inertiaPossible && !inertia) {
      modifiers.resetStatuses(statuses);

      modifierResult = modifiers.setAll(interaction, page, statuses, true);

      if (modifierResult.shouldMove && modifierResult.locked) {
        smoothEnd = true;
      }
    }

    if (inertia || smoothEnd) {
      utils.copyCoords(inertiaStatus.upCoords, interaction.curCoords);

      interaction.pointers[0] = inertiaStatus.startEvent =
        new InteractEvent(interaction, event, interaction.prepared.name, 'inertiastart', interaction.element);

      inertiaStatus.t0 = now;

      target.fire(inertiaStatus.startEvent);

      if (inertia) {
        inertiaStatus.vx0 = interaction.pointerDelta.client.vx;
        inertiaStatus.vy0 = interaction.pointerDelta.client.vy;
        inertiaStatus.v0 = pointerSpeed;

        interaction.calcInertia(inertiaStatus);

        utils.extend(page, interaction.curCoords.page);

        page.x += inertiaStatus.xe;
        page.y += inertiaStatus.ye;

        modifiers.resetStatuses(statuses);

        modifierResult = modifiers.setAll(interaction, page, statuses, true, true);

        inertiaStatus.modifiedXe += modifierResult.dx;
        inertiaStatus.modifiedYe += modifierResult.dy;

        inertiaStatus.i = animationFrame.request(interaction.boundInertiaFrame);
      }
      else {
        inertiaStatus.smoothEnd = true;
        inertiaStatus.xe = modifierResult.dx;
        inertiaStatus.ye = modifierResult.dy;

        inertiaStatus.sx = inertiaStatus.sy = 0;

        inertiaStatus.i = animationFrame.request(interaction.boundSmoothEndFrame);
      }

      inertiaStatus.active = true;
      return;
    }
  }
});

function inertiaFrame () {
  const inertiaStatus = this.inertiaStatus;
  const options = this.target.options[this.prepared.name].inertia;
  const lambda = options.resistance;
  const t = new Date().getTime() / 1000 - inertiaStatus.t0;

  if (t < inertiaStatus.te) {

    const progress =  1 - (Math.exp(-lambda * t) - inertiaStatus.lambda_v0) / inertiaStatus.one_ve_v0;

    if (inertiaStatus.modifiedXe === inertiaStatus.xe && inertiaStatus.modifiedYe === inertiaStatus.ye) {
      inertiaStatus.sx = inertiaStatus.xe * progress;
      inertiaStatus.sy = inertiaStatus.ye * progress;
    }
    else {
      const quadPoint = utils.getQuadraticCurvePoint(0, 0,
                                                     inertiaStatus.xe,
                                                     inertiaStatus.ye,
                                                     inertiaStatus.modifiedXe,
                                                     inertiaStatus.modifiedYe,
                                                     progress);

      inertiaStatus.sx = quadPoint.x;
      inertiaStatus.sy = quadPoint.y;
    }

    this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

    inertiaStatus.i = animationFrame.request(this.boundInertiaFrame);
  }
  else {
    inertiaStatus.ending = true;

    inertiaStatus.sx = inertiaStatus.modifiedXe;
    inertiaStatus.sy = inertiaStatus.modifiedYe;

    this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

    this.end(inertiaStatus.startEvent);
    inertiaStatus.active = inertiaStatus.ending = false;
  }
}

function smoothEndFrame () {
  const inertiaStatus = this.inertiaStatus;
  const t = new Date().getTime() - inertiaStatus.t0;
  const duration = this.target.options[this.prepared.name].inertia.smoothEndDuration;

  if (t < duration) {
    inertiaStatus.sx = utils.easeOutQuad(t, 0, inertiaStatus.xe, duration);
    inertiaStatus.sy = utils.easeOutQuad(t, 0, inertiaStatus.ye, duration);

    this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);

    inertiaStatus.i = animationFrame.request(this.boundSmoothEndFrame);
  }
  else {
    inertiaStatus.ending = true;

    inertiaStatus.sx = inertiaStatus.xe;
    inertiaStatus.sy = inertiaStatus.ye;

    this.pointerMove(inertiaStatus.startEvent, inertiaStatus.startEvent);
    this.end(inertiaStatus.startEvent);

    inertiaStatus.smoothEnd =
      inertiaStatus.active = inertiaStatus.ending = false;
  }
}
