const pointerUtils = require('../utils/pointerUtils');

module.exports = class PointerEvent {
  /** */
  constructor (type, pointer, event, eventTarget, interaction) {
    pointerUtils.pointerExtend(this, event);

    if (event !== pointer) {
      pointerUtils.pointerExtend(this, pointer);
    }

    this.interaction = interaction;

    this.timeStamp     = new Date().getTime();
    this.originalEvent = event;
    this.type          = type;
    this.pointerId     = pointerUtils.getPointerId(pointer);
    this.pointerType   = pointerUtils.getPointerType(pointer);
    this.target        = eventTarget;
    this.currentTarget = null;

    if (type === 'tap') {
      const pointerIndex = interaction.getPointerIndex(pointer);
      this.dt = this.timeStamp - interaction.downTimes[pointerIndex];

      const interval = this.timeStamp - interaction.tapTime;

      this.double = !!(interaction.prevTap
        && interaction.prevTap.type !== 'doubletap'
        && interaction.prevTap.target === this.target
        && interval < 500);
    }
    else if (type === 'doubletap') {
      this.dt = pointer.timeStamp - interaction.tapTime;
    }
  }

  subtractOrigin ({ x: originX, y: originY }) {
    this.pageX   -= originX;
    this.pageY   -= originY;
    this.clientX -= originX;
    this.clientY -= originY;

    return this;
  }

  addOrigin ({ x: originX, y: originY }) {
    this.pageX   += originX;
    this.pageY   += originY;
    this.clientX += originX;
    this.clientY += originY;

    return this;
  }

  /** */
  preventDefault () {
    this.originalEvent.preventDefault();
  }

  /** */
  stopPropagation () {
    this.propagationStopped = true;
  }

  /** */
  stopImmediatePropagation () {
    this.immediatePropagationStopped = this.propagationStopped = true;
  }
};
