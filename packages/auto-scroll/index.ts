import * as domUtils from '@interactjs/utils/domUtils';
import * as is from '@interactjs/utils/is';
import raf from '@interactjs/utils/raf';
import { getStringOptionResult } from '@interactjs/utils/rect';
import { getWindow } from '@interactjs/utils/window';

type Scope = import('@interactjs/core/scope').Scope;

declare module '@interactjs/core/scope' {
  interface Scope {
    autoScroll: typeof autoScroll
  }
}

function install (scope: Scope) {
  const {
    interactions,
    defaults,
    actions,
  } = scope;

  scope.autoScroll = autoScroll;

  interactions.signals.on('new', function (interaction) {
    interaction.autoScroll = null;
  });

  interactions.signals.on('stop', autoScroll.stop);

  interactions.signals.on('action-move', autoScroll.onInteractionMove);

  actions.eventTypes.push('autoscroll');
  defaults.perAction.autoScroll = autoScroll.defaults;
}

const autoScroll = {
  defaults: {
    enabled  : false,
    margin   : 60,

    // the item that is scrolled (Window or HTMLElement)
    container: null as Window | Element,

    // the scroll speed in pixels per second
    speed    : 300,
  },

  interaction: null,
  i: null,    // the handle returned by window.setInterval
  x: 0, y: 0, // Direction each pulse is to scroll in

  isScrolling: false,
  prevTime: 0,
  margin: 0,
  speed: 0,

  start: function (interaction) {
    autoScroll.isScrolling = true;
    raf.cancel(autoScroll.i);

    interaction.autoScroll = autoScroll;
    autoScroll.interaction = interaction;
    autoScroll.prevTime = new Date().getTime();
    autoScroll.i = raf.request(autoScroll.scroll);
  },

  stop: function () {
    autoScroll.isScrolling = false;
    if (autoScroll.interaction) {
      autoScroll.interaction.autoScroll = null;
    }
    raf.cancel(autoScroll.i);
  },

  // scroll the window by the values in scroll.x/y
  scroll: function () {
    const { interaction } = autoScroll;
    const { target: interactable, element } = interaction;
    const options = interactable.options[autoScroll.interaction.prepared.name].autoScroll;
    const container = getContainer(options.container, interactable, element);
    const now = new Date().getTime();
    // change in time in seconds
    const dt = (now - autoScroll.prevTime) / 1000;
    // displacement
    const s = options.speed * dt;

    if (s >= 1) {
      const scrollBy = {
        x: autoScroll.x * s,
        y: autoScroll.y * s,
      };

      if (scrollBy.x || scrollBy.y) {
        const prevScroll = getScroll(container);

        if (is.window(container)) {
          container.scrollBy(scrollBy.x, scrollBy.y);
        }
        else if (container) {
          container.scrollLeft += scrollBy.x;
          container.scrollTop  += scrollBy.y;
        }

        const curScroll = getScroll(container);
        const delta = {
          x: curScroll.x - prevScroll.x,
          y: curScroll.y - prevScroll.y,
        };

        if (delta.x || delta.y) {
          interactable.fire({
            type: 'autoscroll',
            target: element,
            interactable,
            delta,
            interaction,
            container,
          });
        }
      }

      autoScroll.prevTime = now;
    }

    if (autoScroll.isScrolling) {
      raf.cancel(autoScroll.i);
      autoScroll.i = raf.request(autoScroll.scroll);
    }
  },
  check: function (interactable, actionName) {
    const options = interactable.options;

    return options[actionName].autoScroll && options[actionName].autoScroll.enabled;
  },
  onInteractionMove: function ({ interaction, pointer }) {
    if (!(interaction.interacting()
          && autoScroll.check(interaction.target, interaction.prepared.name))) {
      return;
    }

    if (interaction.simulation) {
      autoScroll.x = autoScroll.y = 0;
      return;
    }

    let top;
    let right;
    let bottom;
    let left;

    const { target: interactable, element } = interaction;
    const options = interactable.options[interaction.prepared.name].autoScroll;
    const container = getContainer(options.container, interactable, element);

    if (is.window(container)) {
      left   = pointer.clientX < autoScroll.margin;
      top    = pointer.clientY < autoScroll.margin;
      right  = pointer.clientX > container.innerWidth  - autoScroll.margin;
      bottom = pointer.clientY > container.innerHeight - autoScroll.margin;
    }
    else {
      const rect = domUtils.getElementClientRect(container);

      left   = pointer.clientX < rect.left   + autoScroll.margin;
      top    = pointer.clientY < rect.top    + autoScroll.margin;
      right  = pointer.clientX > rect.right  - autoScroll.margin;
      bottom = pointer.clientY > rect.bottom - autoScroll.margin;
    }

    autoScroll.x = (right ? 1: left? -1: 0);
    autoScroll.y = (bottom? 1:  top? -1: 0);

    if (!autoScroll.isScrolling) {
      // set the autoScroll properties to those of the target
      autoScroll.margin = options.margin;
      autoScroll.speed  = options.speed;

      autoScroll.start(interaction);
    }
  },
};

export function getContainer (value, interactable, element) {
return (is.string(value) ? getStringOptionResult(value, interactable, element) : value) || getWindow(element);
}

export function getScroll (container) {
  if (is.window(container)) { container = window.document.body; }

  return { x: container.scrollLeft, y: container.scrollTop };
}

export function getScrollSize (container) {
  if (is.window(container)) { container = window.document.body; }

  return { x: container.scrollWidth, y: container.scrollHeight };
}

export function getScrollSizeDelta ({ interaction, element }, func) {
  const scrollOptions = interaction && interaction.target.options[interaction.prepared.name].autoScroll;

  if (!scrollOptions || !scrollOptions.enabled) {
    func();
    return { x: 0, y: 0 };
  }

  const scrollContainer = getContainer(
    scrollOptions.container,
    interaction.target,
    element
  );

  const prevSize = getScroll(scrollContainer);
  func();
  const curSize = getScroll(scrollContainer);

  return {
    x: curSize.x - prevSize.x,
    y: curSize.y - prevSize.y,
  };
}

export default { install };
