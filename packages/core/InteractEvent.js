import extend      from '@interactjs/utils/extend';
import getOriginXY from '@interactjs/utils/getOriginXY';
import defaults    from './defaultOptions';
import hypot       from '@interactjs/utils/hypot';

class InteractEvent {
  /** */
  constructor (interaction, event, actionName, phase, element, related, preEnd, type) {
    element = element || interaction.element;

    const target      = interaction.target;
    const deltaSource = (target && target.options || defaults).deltaSource;
    const origin      = getOriginXY(target, element, actionName);
    const starting    = phase === 'start';
    const ending      = phase === 'end';
    const prevEvent   = starting? this : interaction.prevEvent;
    const coords      = starting
      ? interaction.coords.start
      : ending
        ? { page: prevEvent.page, client: prevEvent.client, timeStamp: interaction.coords.cur.timeStamp }
        : interaction.coords.cur;

    this.page      = extend({}, coords.page);
    this.client    = extend({}, coords.client);
    this.timeStamp = coords.timeStamp;

    if (!ending) {
      this.page.x -= origin.x;
      this.page.y -= origin.y;

      this.client.x -= origin.x;
      this.client.y -= origin.y;
    }

    this.ctrlKey       = event.ctrlKey;
    this.altKey        = event.altKey;
    this.shiftKey      = event.shiftKey;
    this.metaKey       = event.metaKey;
    this.button        = event.button;
    this.buttons       = event.buttons;
    this.target        = element;
    this.currentTarget = element;
    this.relatedTarget = related || null;
    this.preEnd        = preEnd;
    this.type          = type || (actionName + (phase || ''));
    this.interaction   = interaction;
    this.interactable  = target;

    this.t0 = starting
      ? interaction.pointers[interaction.pointers.length - 1].downTime
      : prevEvent.t0;

    this.x0       = interaction.coords.start.page.x - origin.x;
    this.y0       = interaction.coords.start.page.y - origin.y;
    this.clientX0 = interaction.coords.start.client.x - origin.x;
    this.clientY0 = interaction.coords.start.client.y - origin.y;

    if (starting || ending) {
      this.delta = { x: 0, y: 0 };
    }
    else {
      this.delta = {
        x: this[deltaSource].x - prevEvent[deltaSource].x,
        y: this[deltaSource].y - prevEvent[deltaSource].y,
      };
    }

    this.dt        = interaction.coords.delta.timeStamp;
    this.duration  = this.timeStamp - this.t0;

    // velocity and speed in pixels per second
    this.velocity = extend({}, interaction.coords.velocity[deltaSource]);
    this.speed = hypot(this.velocity.x, this.velocity.y);

    this.swipe = (ending || phase === 'inertiastart')? this.getSwipe() : null;
  }

  get pageX () { return this.page.x; }
  get pageY () { return this.page.y; }
  set pageX (value) { this.page.x = value; }
  set pageY (value) { this.page.y = value; }

  get clientX () { return this.client.x; }
  get clientY () { return this.client.y; }
  set clientX (value) { this.client.x = value; }
  set clientY (value) { this.client.y = value; }

  get dx () { return this.delta.x; }
  get dy () { return this.delta.y; }
  set dx (value) { this.delta.x = value; }
  set dy (value) { this.delta.y = value; }

  get velocityX () { return this.velocity.x; }
  get velocityY () { return this.velocity.y; }
  set velocityX (value) { this.velocity.x = value; }
  set velocityY (value) { this.velocity.y = value; }

  getSwipe () {
    const interaction = this.interaction;

    if (interaction.prevEvent.speed < 600
        || this.timeStamp - interaction.prevEvent.timeStamp > 150) {
      return null;
    }

    let angle = 180 * Math.atan2(interaction.prevEvent.velocityY, interaction.prevEvent.velocityX) / Math.PI;
    const overlap = 22.5;

    if (angle < 0) {
      angle += 360;
    }

    const left = 135 - overlap <= angle && angle < 225 + overlap;
    const up   = 225 - overlap <= angle && angle < 315 + overlap;

    const right = !left && (315 - overlap <= angle || angle <  45 + overlap);
    const down  = !up   &&   45 - overlap <= angle && angle < 135 + overlap;

    return {
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

  preventDefault () {}

  /** */
  stopImmediatePropagation () {
    this.immediatePropagationStopped = this.propagationStopped = true;
  }

  /** */
  stopPropagation () {
    this.propagationStopped = true;
  }
}

export default InteractEvent;
