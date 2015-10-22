const hypot         = require('./utils/hypot');
const extend        = require('./utils/extend');
const getOriginXY   = require('./utils/getOriginXY');
const modifiers     = require('./modifiers/base');
const scope         = require('./scope');

const signals = new (require('./utils/Signals'));

class InteractEvent {
  constructor (interaction, event, action, phase, element, related) {
    const target      = interaction.target;
    const deltaSource = (target && target.options || scope.defaultOptions).deltaSource;
    const sourceX     = deltaSource + 'X';
    const sourceY     = deltaSource + 'Y';
    const origin      = getOriginXY(target, element);
    const starting    = phase === 'start';
    const ending      = phase === 'end';
    const coords      = starting? interaction.startCoords : interaction.curCoords;

    element = element || interaction.element;

    const page   = extend({}, coords.page);
    const client = extend({}, coords.client);

    page.x -= origin.x;
    page.y -= origin.y;

    client.x -= origin.x;
    client.y -= origin.y;

    this.ctrlKey       = event.ctrlKey;
    this.altKey        = event.altKey;
    this.shiftKey      = event.shiftKey;
    this.metaKey       = event.metaKey;
    this.button        = event.button;
    this.buttons       = event.buttons;
    this.target        = element;
    this.relatedTarget = related || null;
    this.t0            = interaction.downTimes[interaction.downTimes.length - 1];
    this.type          = action + (phase || '');
    this.interaction   = interaction;
    this.interactable  = target;

    for (let i = 0; i < modifiers.names.length; i++) {
      const modifierName = modifiers.names[i];
      const modifier = modifiers[modifierName];

      this[modifierName] = modifier.modifyCoords(page, client, target, interaction.modifierStatuses[modifierName], action, phase);
    }

    this.pageX     = page.x;
    this.pageY     = page.y;
    this.clientX   = client.x;
    this.clientY   = client.y;

    this.x0        = interaction.startCoords.page.x - origin.x;
    this.y0        = interaction.startCoords.page.y - origin.y;
    this.clientX0  = interaction.startCoords.client.x - origin.x;
    this.clientY0  = interaction.startCoords.client.y - origin.y;

    const signalArg = {
      interaction,
      event,
      action,
      phase,
      element,
      related,
      page,
      client,
      coords,
      starting,
      ending,
      deltaSource,
      iEvent: this,
    };

    const inertiaStatus = interaction.inertiaStatus;

    if (inertiaStatus.active) {
      this.detail = 'inertia';
    }

    signals.fire('set-delta', signalArg);
    signals.fire(action, signalArg);

    if (starting) {
      this.timeStamp = interaction.downTimes[0];
      this.dt        = 0;
      this.duration  = 0;
      this.speed     = 0;
      this.velocityX = 0;
      this.velocityY = 0;
    }
    else if (phase === 'inertiastart') {
      this.timeStamp = interaction.prevEvent.timeStamp;
      this.dt        = interaction.prevEvent.dt;
      this.duration  = interaction.prevEvent.duration;
      this.speed     = interaction.prevEvent.speed;
      this.velocityX = interaction.prevEvent.velocityX;
      this.velocityY = interaction.prevEvent.velocityY;
    }
    else {
      this.timeStamp = new Date().getTime();
      this.dt        = this.timeStamp - interaction.prevEvent.timeStamp;
      this.duration  = this.timeStamp - interaction.downTimes[0];

      if (event instanceof InteractEvent) {
        const dx = this[sourceX] - interaction.prevEvent[sourceX];
        const dy = this[sourceY] - interaction.prevEvent[sourceY];
        const dt = this.dt / 1000;

        this.speed = hypot(dx, dy) / dt;
        this.velocityX = dx / dt;
        this.velocityY = dy / dt;
      }
      // if normal move or end event, use previous user event coords
      else {
        // speed and velocity in pixels per second
        this.speed = interaction.pointerDelta[deltaSource].speed;
        this.velocityX = interaction.pointerDelta[deltaSource].vx;
        this.velocityY = interaction.pointerDelta[deltaSource].vy;
      }
    }

    if ((ending || phase === 'inertiastart')
        && interaction.prevEvent.speed > 600
        && this.timeStamp - interaction.prevEvent.timeStamp < 150) {

      let angle = 180 * Math.atan2(interaction.prevEvent.velocityY, interaction.prevEvent.velocityX) / Math.PI;
      const overlap = 22.5;

      if (angle < 0) {
        angle += 360;
      }

      const left = 135 - overlap <= angle && angle < 225 + overlap;
      const up   = 225 - overlap <= angle && angle < 315 + overlap;

      const right = !left && (315 - overlap <= angle || angle <  45 + overlap);
      const down  = !up   &&   45 - overlap <= angle && angle < 135 + overlap;

      this.swipe = {
        up,
        down,
        left,
        right,
        angle,
        speed: interaction.prevEvent.speed,
        velocity: {
          x: interaction.prevEvent.velocityX,
          y: interaction.prevEvent.velocityY,
        },
      };
    }

    signals.fire('new', signalArg);
    signals.fire('new-' + action, signalArg);
  }

  preventDefault () {}

  stopImmediatePropagation () {
    this.immediatePropagationStopped = this.propagationStopped = true;
  }

  stopPropagation () {
    this.propagationStopped = true;
  }
}

signals.on('set-delta', function ({ iEvent, interaction, action, phase, ending, starting,
                                            page, client, deltaSource }) {
  // end event dx, dy is difference between start and end points
  if (ending) {
    if (deltaSource === 'client') {
      iEvent.dx = client.x - interaction.startCoords.client.x;
      iEvent.dy = client.y - interaction.startCoords.client.y;
    }
    else {
      iEvent.dx = page.x - interaction.startCoords.page.x;
      iEvent.dy = page.y - interaction.startCoords.page.y;
    }
  }
  else if (starting) {
    iEvent.dx = 0;
    iEvent.dy = 0;
  }
  // copy properties from previousmove if starting inertia
  else if (phase === 'inertiastart') {
    iEvent.dx = interaction.prevEvent.dx;
    iEvent.dy = interaction.prevEvent.dy;
  }
  else {
    if (deltaSource === 'client') {
      iEvent.dx = client.x - interaction.prevEvent.clientX;
      iEvent.dy = client.y - interaction.prevEvent.clientY;
    }
    else {
      iEvent.dx = page.x - interaction.prevEvent.pageX;
      iEvent.dy = page.y - interaction.prevEvent.pageY;
    }
  }

  const options = interaction.target.options;
  const inertiaStatus = interaction.inertiaStatus;

  if (interaction.prevEvent && interaction.prevEvent.detail === 'inertia'
      && !inertiaStatus.active
      && options[action].inertia && options[action].inertia.zeroResumeDelta) {

    inertiaStatus.resumeDx += iEvent.dx;
    inertiaStatus.resumeDy += iEvent.dy;

    iEvent.dx = iEvent.dy = 0;
  }
});

InteractEvent.signals = signals;

module.exports = InteractEvent;
