import Modification from "../modifiers/Modification.js";
import * as modifiers from "../modifiers/base.js";
import offset from "../offset/plugin.js";
import * as dom from "../utils/domUtils.js";
import hypot from "../utils/hypot.js";
import is from "../utils/is.js";
import { copyCoords } from "../utils/pointerUtils.js";
import raf from "../utils/raf.js";

function install(scope) {
  const {
    defaults
  } = scope;
  scope.usePlugin(offset);
  scope.usePlugin(modifiers.default);
  scope.actions.phases.inertiastart = true;
  scope.actions.phases.resume = true;
  defaults.perAction.inertia = {
    enabled: false,
    resistance: 10,
    // the lambda in exponential decay
    minSpeed: 100,
    // target speed must be above this for inertia to start
    endSpeed: 10,
    // the speed at which inertia is slow enough to stop
    allowResume: true,
    // allow resuming an action in inertia phase
    smoothEndDuration: 300 // animate to snap/restrict endOnly if there's no inertia

  };
}

export class InertiaState {
  // eslint-disable-line camelcase
  // eslint-disable-line camelcase
  constructor(interaction) {
    this.active = false;
    this.isModified = false;
    this.smoothEnd = false;
    this.allowResume = false;
    this.modification = void 0;
    this.modifierCount = 0;
    this.modifierArg = void 0;
    this.startCoords = void 0;
    this.t0 = 0;
    this.v0 = 0;
    this.te = 0;
    this.targetOffset = void 0;
    this.modifiedOffset = void 0;
    this.currentOffset = void 0;
    this.lambda_v0 = 0;
    this.one_ve_v0 = 0;
    this.timeout = void 0;
    this.interaction = void 0;
    this.interaction = interaction;
  }

  start(event) {
    const {
      interaction
    } = this;
    const options = getOptions(interaction);

    if (!options || !options.enabled) {
      return false;
    }

    const {
      client: velocityClient
    } = interaction.coords.velocity;
    const pointerSpeed = hypot(velocityClient.x, velocityClient.y);
    const modification = this.modification || (this.modification = new Modification(interaction));
    modification.copyFrom(interaction.modification);
    this.t0 = interaction._now();
    this.allowResume = options.allowResume;
    this.v0 = pointerSpeed;
    this.currentOffset = {
      x: 0,
      y: 0
    };
    this.startCoords = interaction.coords.cur.page;
    this.modifierArg = modification.fillArg({
      pageCoords: this.startCoords,
      preEnd: true,
      phase: 'inertiastart'
    });
    const thrown = this.t0 - interaction.coords.cur.timeStamp < 50 && pointerSpeed > options.minSpeed && pointerSpeed > options.endSpeed;

    if (thrown) {
      this.startInertia();
    } else {
      modification.result = modification.setAll(this.modifierArg);

      if (!modification.result.changed) {
        return false;
      }

      this.startSmoothEnd();
    } // force modification change


    interaction.modification.result.rect = null; // bring inertiastart event to the target coords

    interaction.offsetBy(this.targetOffset);

    interaction._doPhase({
      interaction,
      event,
      phase: 'inertiastart'
    });

    interaction.offsetBy({
      x: -this.targetOffset.x,
      y: -this.targetOffset.y
    }); // force modification change

    interaction.modification.result.rect = null;
    this.active = true;
    interaction.simulation = this;
    return true;
  }

  startInertia() {
    const startVelocity = this.interaction.coords.velocity.client;
    const options = getOptions(this.interaction);
    const lambda = options.resistance;
    const inertiaDur = -Math.log(options.endSpeed / this.v0) / lambda;
    this.targetOffset = {
      x: (startVelocity.x - inertiaDur) / lambda,
      y: (startVelocity.y - inertiaDur) / lambda
    };
    this.te = inertiaDur;
    this.lambda_v0 = lambda / this.v0;
    this.one_ve_v0 = 1 - options.endSpeed / this.v0;
    const {
      modification,
      modifierArg
    } = this;
    modifierArg.pageCoords = {
      x: this.startCoords.x + this.targetOffset.x,
      y: this.startCoords.y + this.targetOffset.y
    };
    modification.result = modification.setAll(modifierArg);

    if (modification.result.changed) {
      this.isModified = true;
      this.modifiedOffset = {
        x: this.targetOffset.x + modification.result.delta.x,
        y: this.targetOffset.y + modification.result.delta.y
      };
    }

    this.onNextFrame(() => this.inertiaTick());
  }

  startSmoothEnd() {
    this.smoothEnd = true;
    this.isModified = true;
    this.targetOffset = {
      x: this.modification.result.delta.x,
      y: this.modification.result.delta.y
    };
    this.onNextFrame(() => this.smoothEndTick());
  }

  onNextFrame(tickFn) {
    this.timeout = raf.request(() => {
      if (this.active) {
        tickFn();
      }
    });
  }

  inertiaTick() {
    const {
      interaction
    } = this;
    const options = getOptions(interaction);
    const lambda = options.resistance;
    const t = (interaction._now() - this.t0) / 1000;

    if (t < this.te) {
      const progress = 1 - (Math.exp(-lambda * t) - this.lambda_v0) / this.one_ve_v0;
      let newOffset;

      if (this.isModified) {
        newOffset = getQuadraticCurvePoint(0, 0, this.targetOffset.x, this.targetOffset.y, this.modifiedOffset.x, this.modifiedOffset.y, progress);
      } else {
        newOffset = {
          x: this.targetOffset.x * progress,
          y: this.targetOffset.y * progress
        };
      }

      const delta = {
        x: newOffset.x - this.currentOffset.x,
        y: newOffset.y - this.currentOffset.y
      };
      this.currentOffset.x += delta.x;
      this.currentOffset.y += delta.y;
      interaction.offsetBy(delta);
      interaction.move();
      this.onNextFrame(() => this.inertiaTick());
    } else {
      interaction.offsetBy({
        x: this.modifiedOffset.x - this.currentOffset.x,
        y: this.modifiedOffset.y - this.currentOffset.y
      });
      this.end();
    }
  }

  smoothEndTick() {
    const {
      interaction
    } = this;
    const t = interaction._now() - this.t0;
    const {
      smoothEndDuration: duration
    } = getOptions(interaction);

    if (t < duration) {
      const newOffset = {
        x: easeOutQuad(t, 0, this.targetOffset.x, duration),
        y: easeOutQuad(t, 0, this.targetOffset.y, duration)
      };
      const delta = {
        x: newOffset.x - this.currentOffset.x,
        y: newOffset.y - this.currentOffset.y
      };
      this.currentOffset.x += delta.x;
      this.currentOffset.y += delta.y;
      interaction.offsetBy(delta);
      interaction.move({
        skipModifiers: this.modifierCount
      });
      this.onNextFrame(() => this.smoothEndTick());
    } else {
      interaction.offsetBy({
        x: this.targetOffset.x - this.currentOffset.x,
        y: this.targetOffset.y - this.currentOffset.y
      });
      this.end();
    }
  }

  resume({
    pointer,
    event,
    eventTarget
  }) {
    const {
      interaction
    } = this; // undo inertia changes to interaction coords

    interaction.offsetBy({
      x: -this.currentOffset.x,
      y: -this.currentOffset.y
    }); // update pointer at pointer down position

    interaction.updatePointer(pointer, event, eventTarget, true); // fire resume signals and event

    interaction._doPhase({
      interaction,
      event,
      phase: 'resume'
    });

    copyCoords(interaction.coords.prev, interaction.coords.cur);
    this.stop();
  }

  end() {
    this.interaction.move();
    this.interaction.end();
    this.stop();
  }

  stop() {
    this.active = this.smoothEnd = false;
    this.interaction.simulation = null;
    raf.cancel(this.timeout);
  }

}

function start({
  interaction,
  event
}) {
  if (!interaction._interacting || interaction.simulation) {
    return null;
  }

  const started = interaction.inertia.start(event); // prevent action end if inertia or smoothEnd

  return started ? false : null;
} // Check if the down event hits the current inertia target
// control should be return to the user


function resume(arg) {
  const {
    interaction,
    eventTarget
  } = arg;
  const state = interaction.inertia;
  if (!state.active) return;
  let element = eventTarget; // climb up the DOM tree from the event target

  while (is.element(element)) {
    // if interaction element is the current inertia target element
    if (element === interaction.element) {
      state.resume(arg);
      break;
    }

    element = dom.parentNode(element);
  }
}

function stop({
  interaction
}) {
  const state = interaction.inertia;

  if (state.active) {
    state.stop();
  }
}

function getOptions({
  interactable,
  prepared
}) {
  return interactable && interactable.options && prepared.name && interactable.options[prepared.name].inertia;
}

const inertia = {
  id: 'inertia',
  before: ['modifiers', 'actions'],
  install,
  listeners: {
    'interactions:new': ({
      interaction
    }) => {
      interaction.inertia = new InertiaState(interaction);
    },
    'interactions:before-action-end': start,
    'interactions:down': resume,
    'interactions:stop': stop,
    'interactions:before-action-resume': arg => {
      const {
        modification
      } = arg.interaction;
      modification.stop(arg);
      modification.start(arg, arg.interaction.coords.cur.page);
      modification.applyToInteraction(arg);
    },
    'interactions:before-action-inertiastart': arg => arg.interaction.modification.setAndApply(arg),
    'interactions:action-resume': modifiers.addEventModifiers,
    'interactions:action-inertiastart': modifiers.addEventModifiers,
    'interactions:after-action-inertiastart': arg => arg.interaction.modification.restoreInteractionCoords(arg),
    'interactions:after-action-resume': arg => arg.interaction.modification.restoreInteractionCoords(arg)
  }
}; // http://stackoverflow.com/a/5634528/2280888

function _getQBezierValue(t, p1, p2, p3) {
  const iT = 1 - t;
  return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
}

function getQuadraticCurvePoint(startX, startY, cpX, cpY, endX, endY, position) {
  return {
    x: _getQBezierValue(position, startX, cpX, endX),
    y: _getQBezierValue(position, startY, cpY, endY)
  };
} // http://gizma.com/easing/


function easeOutQuad(t, b, c, d) {
  t /= d;
  return -c * t * (t - 2) + b;
}

export default inertia;
//# sourceMappingURL=plugin.js.map