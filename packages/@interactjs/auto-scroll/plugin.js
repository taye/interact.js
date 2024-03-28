/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import * as domUtils from "../utils/domUtils.js";
import is from "../utils/is.js";
import raf from "../utils/raf.js";
import { getStringOptionResult } from "../utils/rect.js";
import { getWindow } from "../utils/window.js";
function install(scope) {
  const {
    defaults,
    actions
  } = scope;
  scope.autoScroll = autoScroll;
  autoScroll.now = () => scope.now();
  actions.phaselessTypes.autoscroll = true;
  defaults.perAction.autoScroll = autoScroll.defaults;
}
const autoScroll = {
  defaults: {
    enabled: false,
    margin: 60,
    // the item that is scrolled (Window or HTMLElement)
    container: null,
    // the scroll speed in pixels per second
    speed: 300
  },
  now: Date.now,
  interaction: null,
  i: 0,
  // the handle returned by window.setInterval

  // Direction each pulse is to scroll in
  x: 0,
  y: 0,
  isScrolling: false,
  prevTime: 0,
  margin: 0,
  speed: 0,
  start(interaction) {
    autoScroll.isScrolling = true;
    raf.cancel(autoScroll.i);
    interaction.autoScroll = autoScroll;
    autoScroll.interaction = interaction;
    autoScroll.prevTime = autoScroll.now();
    autoScroll.i = raf.request(autoScroll.scroll);
  },
  stop() {
    autoScroll.isScrolling = false;
    if (autoScroll.interaction) {
      autoScroll.interaction.autoScroll = null;
    }
    raf.cancel(autoScroll.i);
  },
  // scroll the window by the values in scroll.x/y
  scroll() {
    const {
      interaction
    } = autoScroll;
    const {
      interactable,
      element
    } = interaction;
    const actionName = interaction.prepared.name;
    const options = interactable.options[actionName].autoScroll;
    const container = getContainer(options.container, interactable, element);
    const now = autoScroll.now();
    // change in time in seconds
    const dt = (now - autoScroll.prevTime) / 1000;
    // displacement
    const s = options.speed * dt;
    if (s >= 1) {
      const scrollBy = {
        x: autoScroll.x * s,
        y: autoScroll.y * s
      };
      if (scrollBy.x || scrollBy.y) {
        const prevScroll = getScroll(container);
        if (is.window(container)) {
          container.scrollBy(scrollBy.x, scrollBy.y);
        } else if (container) {
          container.scrollLeft += scrollBy.x;
          container.scrollTop += scrollBy.y;
        }
        const curScroll = getScroll(container);
        const delta = {
          x: curScroll.x - prevScroll.x,
          y: curScroll.y - prevScroll.y
        };
        if (delta.x || delta.y) {
          interactable.fire({
            type: 'autoscroll',
            target: element,
            interactable,
            delta,
            interaction,
            container
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
  check(interactable, actionName) {
    var _options$actionName$a;
    const options = interactable.options;
    return (_options$actionName$a = options[actionName].autoScroll) == null ? void 0 : _options$actionName$a.enabled;
  },
  onInteractionMove(_ref) {
    let {
      interaction,
      pointer
    } = _ref;
    if (!(interaction.interacting() && autoScroll.check(interaction.interactable, interaction.prepared.name))) {
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
    const {
      interactable,
      element
    } = interaction;
    const actionName = interaction.prepared.name;
    const options = interactable.options[actionName].autoScroll;
    const container = getContainer(options.container, interactable, element);
    if (is.window(container)) {
      left = pointer.clientX < autoScroll.margin;
      top = pointer.clientY < autoScroll.margin;
      right = pointer.clientX > container.innerWidth - autoScroll.margin;
      bottom = pointer.clientY > container.innerHeight - autoScroll.margin;
    } else {
      const rect = domUtils.getElementClientRect(container);
      left = pointer.clientX < rect.left + autoScroll.margin;
      top = pointer.clientY < rect.top + autoScroll.margin;
      right = pointer.clientX > rect.right - autoScroll.margin;
      bottom = pointer.clientY > rect.bottom - autoScroll.margin;
    }
    autoScroll.x = right ? 1 : left ? -1 : 0;
    autoScroll.y = bottom ? 1 : top ? -1 : 0;
    if (!autoScroll.isScrolling) {
      // set the autoScroll properties to those of the target
      autoScroll.margin = options.margin;
      autoScroll.speed = options.speed;
      autoScroll.start(interaction);
    }
  }
};
function getContainer(value, interactable, element) {
  return (is.string(value) ? getStringOptionResult(value, interactable, element) : value) || getWindow(element);
}
function getScroll(container) {
  if (is.window(container)) {
    container = window.document.body;
  }
  return {
    x: container.scrollLeft,
    y: container.scrollTop
  };
}
function getScrollSize(container) {
  if (is.window(container)) {
    container = window.document.body;
  }
  return {
    x: container.scrollWidth,
    y: container.scrollHeight
  };
}
function getScrollSizeDelta(_ref2, func) {
  let {
    interaction,
    element
  } = _ref2;
  const scrollOptions = interaction && interaction.interactable.options[interaction.prepared.name].autoScroll;
  if (!scrollOptions || !scrollOptions.enabled) {
    func();
    return {
      x: 0,
      y: 0
    };
  }
  const scrollContainer = getContainer(scrollOptions.container, interaction.interactable, element);
  const prevSize = getScroll(scrollContainer);
  func();
  const curSize = getScroll(scrollContainer);
  return {
    x: curSize.x - prevSize.x,
    y: curSize.y - prevSize.y
  };
}
const autoScrollPlugin = {
  id: 'auto-scroll',
  install,
  listeners: {
    'interactions:new': _ref3 => {
      let {
        interaction
      } = _ref3;
      interaction.autoScroll = null;
    },
    'interactions:destroy': _ref4 => {
      let {
        interaction
      } = _ref4;
      interaction.autoScroll = null;
      autoScroll.stop();
      if (autoScroll.interaction) {
        autoScroll.interaction = null;
      }
    },
    'interactions:stop': autoScroll.stop,
    'interactions:action-move': arg => autoScroll.onInteractionMove(arg)
  }
};
export { autoScrollPlugin as default, getContainer, getScroll, getScrollSize, getScrollSizeDelta };
//# sourceMappingURL=plugin.js.map
