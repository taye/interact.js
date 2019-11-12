function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import extend from "../utils/extend.js";
import getOriginXY from "../utils/getOriginXY.js";
import hypot from "../utils/hypot.js";
import BaseEvent from "./BaseEvent.js";
import defaults from "./defaultOptions.js";
export let EventPhase;

(function (EventPhase) {
  EventPhase["Start"] = "start";
  EventPhase["Move"] = "move";
  EventPhase["End"] = "end";
  EventPhase["_NONE"] = "";
})(EventPhase || (EventPhase = {}));

export class InteractEvent extends BaseEvent {
  // drag
  // resize

  /** */
  constructor(interaction, event, actionName, phase, element, related, preEnd, type) {
    super(interaction);

    _defineProperty(this, "target", void 0);

    _defineProperty(this, "currentTarget", void 0);

    _defineProperty(this, "relatedTarget", void 0);

    _defineProperty(this, "screenX", void 0);

    _defineProperty(this, "screenY", void 0);

    _defineProperty(this, "button", void 0);

    _defineProperty(this, "buttons", void 0);

    _defineProperty(this, "ctrlKey", void 0);

    _defineProperty(this, "shiftKey", void 0);

    _defineProperty(this, "altKey", void 0);

    _defineProperty(this, "metaKey", void 0);

    _defineProperty(this, "page", void 0);

    _defineProperty(this, "client", void 0);

    _defineProperty(this, "delta", void 0);

    _defineProperty(this, "rect", void 0);

    _defineProperty(this, "x0", void 0);

    _defineProperty(this, "y0", void 0);

    _defineProperty(this, "t0", void 0);

    _defineProperty(this, "dt", void 0);

    _defineProperty(this, "duration", void 0);

    _defineProperty(this, "clientX0", void 0);

    _defineProperty(this, "clientY0", void 0);

    _defineProperty(this, "velocity", void 0);

    _defineProperty(this, "speed", void 0);

    _defineProperty(this, "swipe", void 0);

    _defineProperty(this, "timeStamp", void 0);

    _defineProperty(this, "dragEnter", void 0);

    _defineProperty(this, "dragLeave", void 0);

    _defineProperty(this, "axes", void 0);

    _defineProperty(this, "preEnd", void 0);

    element = element || interaction.element;
    const target = interaction.interactable;
    const deltaSource = (target && target.options || defaults).deltaSource;
    const origin = getOriginXY(target, element, actionName);
    const starting = phase === 'start';
    const ending = phase === 'end';
    const prevEvent = starting ? this : interaction.prevEvent;
    const coords = starting ? interaction.coords.start : ending ? {
      page: prevEvent.page,
      client: prevEvent.client,
      timeStamp: interaction.coords.cur.timeStamp
    } : interaction.coords.cur;
    this.page = extend({}, coords.page);
    this.client = extend({}, coords.client);
    this.rect = extend({}, interaction.rect);
    this.timeStamp = coords.timeStamp;

    if (!ending) {
      this.page.x -= origin.x;
      this.page.y -= origin.y;
      this.client.x -= origin.x;
      this.client.y -= origin.y;
    }

    this.ctrlKey = event.ctrlKey;
    this.altKey = event.altKey;
    this.shiftKey = event.shiftKey;
    this.metaKey = event.metaKey;
    this.button = event.button;
    this.buttons = event.buttons;
    this.target = element;
    this.currentTarget = element;
    this.relatedTarget = related || null;
    this.preEnd = preEnd;
    this.type = type || actionName + (phase || '');
    this.interactable = target;
    this.t0 = starting ? interaction.pointers[interaction.pointers.length - 1].downTime : prevEvent.t0;
    this.x0 = interaction.coords.start.page.x - origin.x;
    this.y0 = interaction.coords.start.page.y - origin.y;
    this.clientX0 = interaction.coords.start.client.x - origin.x;
    this.clientY0 = interaction.coords.start.client.y - origin.y;

    if (starting || ending) {
      this.delta = {
        x: 0,
        y: 0
      };
    } else {
      this.delta = {
        x: this[deltaSource].x - prevEvent[deltaSource].x,
        y: this[deltaSource].y - prevEvent[deltaSource].y
      };
    }

    this.dt = interaction.coords.delta.timeStamp;
    this.duration = this.timeStamp - this.t0; // velocity and speed in pixels per second

    this.velocity = extend({}, interaction.coords.velocity[deltaSource]);
    this.speed = hypot(this.velocity.x, this.velocity.y);
    this.swipe = ending || phase === 'inertiastart' ? this.getSwipe() : null;
  }

  get pageX() {
    return this.page.x;
  }

  set pageX(value) {
    this.page.x = value;
  }

  get pageY() {
    return this.page.y;
  }

  set pageY(value) {
    this.page.y = value;
  }

  get clientX() {
    return this.client.x;
  }

  set clientX(value) {
    this.client.x = value;
  }

  get clientY() {
    return this.client.y;
  }

  set clientY(value) {
    this.client.y = value;
  }

  get dx() {
    return this.delta.x;
  }

  set dx(value) {
    this.delta.x = value;
  }

  get dy() {
    return this.delta.y;
  }

  set dy(value) {
    this.delta.y = value;
  }

  get velocityX() {
    return this.velocity.x;
  }

  set velocityX(value) {
    this.velocity.x = value;
  }

  get velocityY() {
    return this.velocity.y;
  }

  set velocityY(value) {
    this.velocity.y = value;
  }

  getSwipe() {
    const interaction = this._interaction;

    if (interaction.prevEvent.speed < 600 || this.timeStamp - interaction.prevEvent.timeStamp > 150) {
      return null;
    }

    let angle = 180 * Math.atan2(interaction.prevEvent.velocityY, interaction.prevEvent.velocityX) / Math.PI;
    const overlap = 22.5;

    if (angle < 0) {
      angle += 360;
    }

    const left = 135 - overlap <= angle && angle < 225 + overlap;
    const up = 225 - overlap <= angle && angle < 315 + overlap;
    const right = !left && (315 - overlap <= angle || angle < 45 + overlap);
    const down = !up && 45 - overlap <= angle && angle < 135 + overlap;
    return {
      up,
      down,
      left,
      right,
      angle,
      speed: interaction.prevEvent.speed,
      velocity: {
        x: interaction.prevEvent.velocityX,
        y: interaction.prevEvent.velocityY
      }
    };
  }

  preventDefault() {}
  /**
   * Don't call listeners on the remaining targets
   */


  stopImmediatePropagation() {
    this.immediatePropagationStopped = this.propagationStopped = true;
  }
  /**
   * Don't call any other listeners (even on the current target)
   */


  stopPropagation() {
    this.propagationStopped = true;
  }

}
export default InteractEvent;
//# sourceMappingURL=InteractEvent.js.map