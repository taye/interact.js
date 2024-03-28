/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import * as domUtils from "../../utils/domUtils.js";
import extend from "../../utils/extend.js";
import getOriginXY from "../../utils/getOriginXY.js";
import is from "../../utils/is.js";
import normalizeListeners from "../../utils/normalizeListeners.js";
import * as pointerUtils from "../../utils/pointerUtils.js";
import drag from '../drag/plugin.js';
import { DropEvent } from './DropEvent.js';
import "../../core/BaseEvent.js";
import "../../utils/arr.js";
function install(scope) {
  const {
    actions,
    interactStatic: interact,
    Interactable,
    defaults
  } = scope;
  scope.usePlugin(drag);
  Interactable.prototype.dropzone = function (options) {
    return dropzoneMethod(this, options);
  };
  Interactable.prototype.dropCheck = function (dragEvent, event, draggable, draggableElement, dropElement, rect) {
    return dropCheckMethod(this, dragEvent, event, draggable, draggableElement, dropElement, rect);
  };
  interact.dynamicDrop = function (newValue) {
    if (is.bool(newValue)) {
      // if (dragging && scope.dynamicDrop !== newValue && !newValue) {
      //  calcRects(dropzones)
      // }

      scope.dynamicDrop = newValue;
      return interact;
    }
    return scope.dynamicDrop;
  };
  extend(actions.phaselessTypes, {
    dragenter: true,
    dragleave: true,
    dropactivate: true,
    dropdeactivate: true,
    dropmove: true,
    drop: true
  });
  actions.methodDict.drop = 'dropzone';
  scope.dynamicDrop = false;
  defaults.actions.drop = drop.defaults;
}
function collectDropzones(_ref, draggableElement) {
  let {
    interactables
  } = _ref;
  const drops = [];

  // collect all dropzones and their elements which qualify for a drop
  for (const dropzone of interactables.list) {
    if (!dropzone.options.drop.enabled) {
      continue;
    }
    const accept = dropzone.options.drop.accept;

    // test the draggable draggableElement against the dropzone's accept setting
    if (is.element(accept) && accept !== draggableElement || is.string(accept) && !domUtils.matchesSelector(draggableElement, accept) || is.func(accept) && !accept({
      dropzone,
      draggableElement
    })) {
      continue;
    }
    for (const dropzoneElement of dropzone.getAllElements()) {
      if (dropzoneElement !== draggableElement) {
        drops.push({
          dropzone,
          element: dropzoneElement,
          rect: dropzone.getRect(dropzoneElement)
        });
      }
    }
  }
  return drops;
}
function fireActivationEvents(activeDrops, event) {
  // loop through all active dropzones and trigger event
  for (const {
    dropzone,
    element
  } of activeDrops.slice()) {
    event.dropzone = dropzone;

    // set current element as event target
    event.target = element;
    dropzone.fire(event);
    event.propagationStopped = event.immediatePropagationStopped = false;
  }
}

// return a new array of possible drops. getActiveDrops should always be
// called when a drag has just started or a drag event happens while
// dynamicDrop is true
function getActiveDrops(scope, dragElement) {
  // get dropzones and their elements that could receive the draggable
  const activeDrops = collectDropzones(scope, dragElement);
  for (const activeDrop of activeDrops) {
    activeDrop.rect = activeDrop.dropzone.getRect(activeDrop.element);
  }
  return activeDrops;
}
function getDrop(_ref2, dragEvent, pointerEvent) {
  let {
    dropState,
    interactable: draggable,
    element: dragElement
  } = _ref2;
  const validDrops = [];

  // collect all dropzones and their elements which qualify for a drop
  for (const {
    dropzone,
    element: dropzoneElement,
    rect
  } of dropState.activeDrops) {
    const isValid = dropzone.dropCheck(dragEvent, pointerEvent, draggable, dragElement, dropzoneElement, rect);
    validDrops.push(isValid ? dropzoneElement : null);
  }

  // get the most appropriate dropzone based on DOM depth and order
  const dropIndex = domUtils.indexOfDeepestElement(validDrops);
  return dropState.activeDrops[dropIndex] || null;
}
function getDropEvents(interaction, _pointerEvent, dragEvent) {
  const dropState = interaction.dropState;
  const dropEvents = {
    enter: null,
    leave: null,
    activate: null,
    deactivate: null,
    move: null,
    drop: null
  };
  if (dragEvent.type === 'dragstart') {
    dropEvents.activate = new DropEvent(dropState, dragEvent, 'dropactivate');
    dropEvents.activate.target = null;
    dropEvents.activate.dropzone = null;
  }
  if (dragEvent.type === 'dragend') {
    dropEvents.deactivate = new DropEvent(dropState, dragEvent, 'dropdeactivate');
    dropEvents.deactivate.target = null;
    dropEvents.deactivate.dropzone = null;
  }
  if (dropState.rejected) {
    return dropEvents;
  }
  if (dropState.cur.element !== dropState.prev.element) {
    // if there was a previous dropzone, create a dragleave event
    if (dropState.prev.dropzone) {
      dropEvents.leave = new DropEvent(dropState, dragEvent, 'dragleave');
      dragEvent.dragLeave = dropEvents.leave.target = dropState.prev.element;
      dragEvent.prevDropzone = dropEvents.leave.dropzone = dropState.prev.dropzone;
    }
    // if dropzone is not null, create a dragenter event
    if (dropState.cur.dropzone) {
      dropEvents.enter = new DropEvent(dropState, dragEvent, 'dragenter');
      dragEvent.dragEnter = dropState.cur.element;
      dragEvent.dropzone = dropState.cur.dropzone;
    }
  }
  if (dragEvent.type === 'dragend' && dropState.cur.dropzone) {
    dropEvents.drop = new DropEvent(dropState, dragEvent, 'drop');
    dragEvent.dropzone = dropState.cur.dropzone;
    dragEvent.relatedTarget = dropState.cur.element;
  }
  if (dragEvent.type === 'dragmove' && dropState.cur.dropzone) {
    dropEvents.move = new DropEvent(dropState, dragEvent, 'dropmove');
    dragEvent.dropzone = dropState.cur.dropzone;
  }
  return dropEvents;
}
function fireDropEvents(interaction, events) {
  const dropState = interaction.dropState;
  const {
    activeDrops,
    cur,
    prev
  } = dropState;
  if (events.leave) {
    prev.dropzone.fire(events.leave);
  }
  if (events.enter) {
    cur.dropzone.fire(events.enter);
  }
  if (events.move) {
    cur.dropzone.fire(events.move);
  }
  if (events.drop) {
    cur.dropzone.fire(events.drop);
  }
  if (events.deactivate) {
    fireActivationEvents(activeDrops, events.deactivate);
  }
  dropState.prev.dropzone = cur.dropzone;
  dropState.prev.element = cur.element;
}
function onEventCreated(_ref3, scope) {
  let {
    interaction,
    iEvent,
    event
  } = _ref3;
  if (iEvent.type !== 'dragmove' && iEvent.type !== 'dragend') {
    return;
  }
  const dropState = interaction.dropState;
  if (scope.dynamicDrop) {
    dropState.activeDrops = getActiveDrops(scope, interaction.element);
  }
  const dragEvent = iEvent;
  const dropResult = getDrop(interaction, dragEvent, event);

  // update rejected status
  dropState.rejected = dropState.rejected && !!dropResult && dropResult.dropzone === dropState.cur.dropzone && dropResult.element === dropState.cur.element;
  dropState.cur.dropzone = dropResult && dropResult.dropzone;
  dropState.cur.element = dropResult && dropResult.element;
  dropState.events = getDropEvents(interaction, event, dragEvent);
}
function dropzoneMethod(interactable, options) {
  if (is.object(options)) {
    interactable.options.drop.enabled = options.enabled !== false;
    if (options.listeners) {
      const normalized = normalizeListeners(options.listeners);
      // rename 'drop' to '' as it will be prefixed with 'drop'
      const corrected = Object.keys(normalized).reduce((acc, type) => {
        const correctedType = /^(enter|leave)/.test(type) ? `drag${type}` : /^(activate|deactivate|move)/.test(type) ? `drop${type}` : type;
        acc[correctedType] = normalized[type];
        return acc;
      }, {});
      const prevListeners = interactable.options.drop.listeners;
      prevListeners && interactable.off(prevListeners);
      interactable.on(corrected);
      interactable.options.drop.listeners = corrected;
    }
    if (is.func(options.ondrop)) {
      interactable.on('drop', options.ondrop);
    }
    if (is.func(options.ondropactivate)) {
      interactable.on('dropactivate', options.ondropactivate);
    }
    if (is.func(options.ondropdeactivate)) {
      interactable.on('dropdeactivate', options.ondropdeactivate);
    }
    if (is.func(options.ondragenter)) {
      interactable.on('dragenter', options.ondragenter);
    }
    if (is.func(options.ondragleave)) {
      interactable.on('dragleave', options.ondragleave);
    }
    if (is.func(options.ondropmove)) {
      interactable.on('dropmove', options.ondropmove);
    }
    if (/^(pointer|center)$/.test(options.overlap)) {
      interactable.options.drop.overlap = options.overlap;
    } else if (is.number(options.overlap)) {
      interactable.options.drop.overlap = Math.max(Math.min(1, options.overlap), 0);
    }
    if ('accept' in options) {
      interactable.options.drop.accept = options.accept;
    }
    if ('checker' in options) {
      interactable.options.drop.checker = options.checker;
    }
    return interactable;
  }
  if (is.bool(options)) {
    interactable.options.drop.enabled = options;
    return interactable;
  }
  return interactable.options.drop;
}
function dropCheckMethod(interactable, dragEvent, event, draggable, draggableElement, dropElement, rect) {
  let dropped = false;

  // if the dropzone has no rect (eg. display: none)
  // call the custom dropChecker or just return false
  if (!(rect = rect || interactable.getRect(dropElement))) {
    return interactable.options.drop.checker ? interactable.options.drop.checker(dragEvent, event, dropped, interactable, dropElement, draggable, draggableElement) : false;
  }
  const dropOverlap = interactable.options.drop.overlap;
  if (dropOverlap === 'pointer') {
    const origin = getOriginXY(draggable, draggableElement, 'drag');
    const page = pointerUtils.getPageXY(dragEvent);
    page.x += origin.x;
    page.y += origin.y;
    const horizontal = page.x > rect.left && page.x < rect.right;
    const vertical = page.y > rect.top && page.y < rect.bottom;
    dropped = horizontal && vertical;
  }
  const dragRect = draggable.getRect(draggableElement);
  if (dragRect && dropOverlap === 'center') {
    const cx = dragRect.left + dragRect.width / 2;
    const cy = dragRect.top + dragRect.height / 2;
    dropped = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
  }
  if (dragRect && is.number(dropOverlap)) {
    const overlapArea = Math.max(0, Math.min(rect.right, dragRect.right) - Math.max(rect.left, dragRect.left)) * Math.max(0, Math.min(rect.bottom, dragRect.bottom) - Math.max(rect.top, dragRect.top));
    const overlapRatio = overlapArea / (dragRect.width * dragRect.height);
    dropped = overlapRatio >= dropOverlap;
  }
  if (interactable.options.drop.checker) {
    dropped = interactable.options.drop.checker(dragEvent, event, dropped, interactable, dropElement, draggable, draggableElement);
  }
  return dropped;
}
const drop = {
  id: 'actions/drop',
  install,
  listeners: {
    'interactions:before-action-start': _ref4 => {
      let {
        interaction
      } = _ref4;
      if (interaction.prepared.name !== 'drag') {
        return;
      }
      interaction.dropState = {
        cur: {
          dropzone: null,
          element: null
        },
        prev: {
          dropzone: null,
          element: null
        },
        rejected: null,
        events: null,
        activeDrops: []
      };
    },
    'interactions:after-action-start': (_ref5, scope) => {
      let {
        interaction,
        event,
        iEvent: dragEvent
      } = _ref5;
      if (interaction.prepared.name !== 'drag') {
        return;
      }
      const dropState = interaction.dropState;

      // reset active dropzones
      dropState.activeDrops = [];
      dropState.events = {};
      dropState.activeDrops = getActiveDrops(scope, interaction.element);
      dropState.events = getDropEvents(interaction, event, dragEvent);
      if (dropState.events.activate) {
        fireActivationEvents(dropState.activeDrops, dropState.events.activate);
        scope.fire('actions/drop:start', {
          interaction,
          dragEvent
        });
      }
    },
    'interactions:action-move': onEventCreated,
    'interactions:after-action-move': (_ref6, scope) => {
      let {
        interaction,
        iEvent: dragEvent
      } = _ref6;
      if (interaction.prepared.name !== 'drag') {
        return;
      }
      const dropState = interaction.dropState;
      fireDropEvents(interaction, dropState.events);
      scope.fire('actions/drop:move', {
        interaction,
        dragEvent
      });
      dropState.events = {};
    },
    'interactions:action-end': (arg, scope) => {
      if (arg.interaction.prepared.name !== 'drag') {
        return;
      }
      const {
        interaction,
        iEvent: dragEvent
      } = arg;
      onEventCreated(arg, scope);
      fireDropEvents(interaction, interaction.dropState.events);
      scope.fire('actions/drop:end', {
        interaction,
        dragEvent
      });
    },
    'interactions:stop': _ref7 => {
      let {
        interaction
      } = _ref7;
      if (interaction.prepared.name !== 'drag') {
        return;
      }
      const {
        dropState
      } = interaction;
      if (dropState) {
        dropState.activeDrops = null;
        dropState.events = null;
        dropState.cur.dropzone = null;
        dropState.cur.element = null;
        dropState.prev.dropzone = null;
        dropState.prev.element = null;
        dropState.rejected = false;
      }
    }
  },
  getActiveDrops,
  getDrop,
  getDropEvents,
  fireDropEvents,
  filterEventType: type => type.search('drag') === 0 || type.search('drop') === 0,
  defaults: {
    enabled: false,
    accept: null,
    overlap: 'pointer'
  }
};
export { drop as default };
//# sourceMappingURL=plugin.js.map
