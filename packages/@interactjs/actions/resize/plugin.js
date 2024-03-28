/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import * as domUtils from "../../utils/domUtils.js";
import extend from "../../utils/extend.js";
import is from "../../utils/is.js";
function install(scope) {
  const {
    actions,
    browser,
    Interactable,
    // tslint:disable-line no-shadowed-variable
    defaults
  } = scope;

  // Less Precision with touch input

  resize.cursors = initCursors(browser);
  resize.defaultMargin = browser.supportsTouch || browser.supportsPointerEvent ? 20 : 10;
  Interactable.prototype.resizable = function (options) {
    return resizable(this, options, scope);
  };
  actions.map.resize = resize;
  actions.methodDict.resize = 'resizable';
  defaults.actions.resize = resize.defaults;
}
function resizeChecker(arg) {
  const {
    interaction,
    interactable,
    element,
    rect,
    buttons
  } = arg;
  if (!rect) {
    return undefined;
  }
  const page = extend({}, interaction.coords.cur.page);
  const resizeOptions = interactable.options.resize;
  if (!(resizeOptions && resizeOptions.enabled) ||
  // check mouseButton setting if the pointer is down
  interaction.pointerIsDown && /mouse|pointer/.test(interaction.pointerType) && (buttons & resizeOptions.mouseButtons) === 0) {
    return undefined;
  }

  // if using resize.edges
  if (is.object(resizeOptions.edges)) {
    const resizeEdges = {
      left: false,
      right: false,
      top: false,
      bottom: false
    };
    for (const edge in resizeEdges) {
      resizeEdges[edge] = checkResizeEdge(edge, resizeOptions.edges[edge], page, interaction._latestPointer.eventTarget, element, rect, resizeOptions.margin || resize.defaultMargin);
    }
    resizeEdges.left = resizeEdges.left && !resizeEdges.right;
    resizeEdges.top = resizeEdges.top && !resizeEdges.bottom;
    if (resizeEdges.left || resizeEdges.right || resizeEdges.top || resizeEdges.bottom) {
      arg.action = {
        name: 'resize',
        edges: resizeEdges
      };
    }
  } else {
    const right = resizeOptions.axis !== 'y' && page.x > rect.right - resize.defaultMargin;
    const bottom = resizeOptions.axis !== 'x' && page.y > rect.bottom - resize.defaultMargin;
    if (right || bottom) {
      arg.action = {
        name: 'resize',
        axes: (right ? 'x' : '') + (bottom ? 'y' : '')
      };
    }
  }
  return arg.action ? false : undefined;
}
function resizable(interactable, options, scope) {
  if (is.object(options)) {
    interactable.options.resize.enabled = options.enabled !== false;
    interactable.setPerAction('resize', options);
    interactable.setOnEvents('resize', options);
    if (is.string(options.axis) && /^x$|^y$|^xy$/.test(options.axis)) {
      interactable.options.resize.axis = options.axis;
    } else if (options.axis === null) {
      interactable.options.resize.axis = scope.defaults.actions.resize.axis;
    }
    if (is.bool(options.preserveAspectRatio)) {
      interactable.options.resize.preserveAspectRatio = options.preserveAspectRatio;
    } else if (is.bool(options.square)) {
      interactable.options.resize.square = options.square;
    }
    return interactable;
  }
  if (is.bool(options)) {
    interactable.options.resize.enabled = options;
    return interactable;
  }
  return interactable.options.resize;
}
function checkResizeEdge(name, value, page, element, interactableElement, rect, margin) {
  // false, '', undefined, null
  if (!value) {
    return false;
  }

  // true value, use pointer coords and element rect
  if (value === true) {
    // if dimensions are negative, "switch" edges
    const width = is.number(rect.width) ? rect.width : rect.right - rect.left;
    const height = is.number(rect.height) ? rect.height : rect.bottom - rect.top;

    // don't use margin greater than half the relevent dimension
    margin = Math.min(margin, Math.abs((name === 'left' || name === 'right' ? width : height) / 2));
    if (width < 0) {
      if (name === 'left') {
        name = 'right';
      } else if (name === 'right') {
        name = 'left';
      }
    }
    if (height < 0) {
      if (name === 'top') {
        name = 'bottom';
      } else if (name === 'bottom') {
        name = 'top';
      }
    }
    if (name === 'left') {
      const edge = width >= 0 ? rect.left : rect.right;
      return page.x < edge + margin;
    }
    if (name === 'top') {
      const edge = height >= 0 ? rect.top : rect.bottom;
      return page.y < edge + margin;
    }
    if (name === 'right') {
      return page.x > (width >= 0 ? rect.right : rect.left) - margin;
    }
    if (name === 'bottom') {
      return page.y > (height >= 0 ? rect.bottom : rect.top) - margin;
    }
  }

  // the remaining checks require an element
  if (!is.element(element)) {
    return false;
  }
  return is.element(value) ?
  // the value is an element to use as a resize handle
  value === element :
  // otherwise check if element matches value as selector
  domUtils.matchesUpTo(element, value, interactableElement);
}

/* eslint-disable multiline-ternary */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
function initCursors(browser) {
  return browser.isIe9 ? {
    x: 'e-resize',
    y: 's-resize',
    xy: 'se-resize',
    top: 'n-resize',
    left: 'w-resize',
    bottom: 's-resize',
    right: 'e-resize',
    topleft: 'se-resize',
    bottomright: 'se-resize',
    topright: 'ne-resize',
    bottomleft: 'ne-resize'
  } : {
    x: 'ew-resize',
    y: 'ns-resize',
    xy: 'nwse-resize',
    top: 'ns-resize',
    left: 'ew-resize',
    bottom: 'ns-resize',
    right: 'ew-resize',
    topleft: 'nwse-resize',
    bottomright: 'nwse-resize',
    topright: 'nesw-resize',
    bottomleft: 'nesw-resize'
  };
}
/* eslint-enable multiline-ternary */

function start(_ref) {
  let {
    iEvent,
    interaction
  } = _ref;
  if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) {
    return;
  }
  const resizeEvent = iEvent;
  const rect = interaction.rect;
  interaction._rects = {
    start: extend({}, rect),
    corrected: extend({}, rect),
    previous: extend({}, rect),
    delta: {
      left: 0,
      right: 0,
      width: 0,
      top: 0,
      bottom: 0,
      height: 0
    }
  };
  resizeEvent.edges = interaction.prepared.edges;
  resizeEvent.rect = interaction._rects.corrected;
  resizeEvent.deltaRect = interaction._rects.delta;
}
function move(_ref2) {
  let {
    iEvent,
    interaction
  } = _ref2;
  if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) return;
  const resizeEvent = iEvent;
  const resizeOptions = interaction.interactable.options.resize;
  const invert = resizeOptions.invert;
  const invertible = invert === 'reposition' || invert === 'negate';
  const current = interaction.rect;
  const {
    start: startRect,
    corrected,
    delta: deltaRect,
    previous
  } = interaction._rects;
  extend(previous, corrected);
  if (invertible) {
    // if invertible, copy the current rect
    extend(corrected, current);
    if (invert === 'reposition') {
      // swap edge values if necessary to keep width/height positive
      if (corrected.top > corrected.bottom) {
        const swap = corrected.top;
        corrected.top = corrected.bottom;
        corrected.bottom = swap;
      }
      if (corrected.left > corrected.right) {
        const swap = corrected.left;
        corrected.left = corrected.right;
        corrected.right = swap;
      }
    }
  } else {
    // if not invertible, restrict to minimum of 0x0 rect
    corrected.top = Math.min(current.top, startRect.bottom);
    corrected.bottom = Math.max(current.bottom, startRect.top);
    corrected.left = Math.min(current.left, startRect.right);
    corrected.right = Math.max(current.right, startRect.left);
  }
  corrected.width = corrected.right - corrected.left;
  corrected.height = corrected.bottom - corrected.top;
  for (const edge in corrected) {
    deltaRect[edge] = corrected[edge] - previous[edge];
  }
  resizeEvent.edges = interaction.prepared.edges;
  resizeEvent.rect = corrected;
  resizeEvent.deltaRect = deltaRect;
}
function end(_ref3) {
  let {
    iEvent,
    interaction
  } = _ref3;
  if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) return;
  const resizeEvent = iEvent;
  resizeEvent.edges = interaction.prepared.edges;
  resizeEvent.rect = interaction._rects.corrected;
  resizeEvent.deltaRect = interaction._rects.delta;
}
function updateEventAxes(_ref4) {
  let {
    iEvent,
    interaction
  } = _ref4;
  if (interaction.prepared.name !== 'resize' || !interaction.resizeAxes) return;
  const options = interaction.interactable.options;
  const resizeEvent = iEvent;
  if (options.resize.square) {
    if (interaction.resizeAxes === 'y') {
      resizeEvent.delta.x = resizeEvent.delta.y;
    } else {
      resizeEvent.delta.y = resizeEvent.delta.x;
    }
    resizeEvent.axes = 'xy';
  } else {
    resizeEvent.axes = interaction.resizeAxes;
    if (interaction.resizeAxes === 'x') {
      resizeEvent.delta.y = 0;
    } else if (interaction.resizeAxes === 'y') {
      resizeEvent.delta.x = 0;
    }
  }
}
const resize = {
  id: 'actions/resize',
  before: ['actions/drag'],
  install,
  listeners: {
    'interactions:new': _ref5 => {
      let {
        interaction
      } = _ref5;
      interaction.resizeAxes = 'xy';
    },
    'interactions:action-start': arg => {
      start(arg);
      updateEventAxes(arg);
    },
    'interactions:action-move': arg => {
      move(arg);
      updateEventAxes(arg);
    },
    'interactions:action-end': end,
    'auto-start:check': resizeChecker
  },
  defaults: {
    square: false,
    preserveAspectRatio: false,
    axis: 'xy',
    // use default margin
    margin: NaN,
    // object with props left, right, top, bottom which are
    // true/false values to resize when the pointer is over that edge,
    // CSS selectors to match the handles for each direction
    // or the Elements for each handle
    edges: null,
    // a value of 'none' will limit the resize rect to a minimum of 0x0
    // 'negate' will alow the rect to have negative width/height
    // 'reposition' will keep the width/height positive by swapping
    // the top and bottom edges and/or swapping the left and right edges
    invert: 'none'
  },
  cursors: null,
  getCursor(_ref6) {
    let {
      edges,
      axis,
      name
    } = _ref6;
    const cursors = resize.cursors;
    let result = null;
    if (axis) {
      result = cursors[name + axis];
    } else if (edges) {
      let cursorKey = '';
      for (const edge of ['top', 'bottom', 'left', 'right']) {
        if (edges[edge]) {
          cursorKey += edge;
        }
      }
      result = cursors[cursorKey];
    }
    return result;
  },
  filterEventType: type => type.search('resize') === 0,
  defaultMargin: null
};
export { resize as default };
//# sourceMappingURL=plugin.js.map
