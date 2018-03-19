import * as utils from '../../utils';
import DropEvent from './DropEvent';

function init (scope) {
  const {
    actions,
    /** @lends module:interact */
    interact,
    /** @lends Interactable */
    Interactable,
    interactions,
    defaults,
  } = scope;

  let dynamicDrop = false;

  interactions.signals.on('after-action-start', function ({ interaction, event, iEvent: dragEvent }) {
    if (interaction.prepared.name !== 'drag') { return; }

    const { dropStatus } = interaction;

    // reset active dropzones
    dropStatus.activeDrops = null;
    dropStatus.events = null;

    if (!interaction.dynamicDrop) {
      dropStatus.activeDrops = getActiveDrops(scope, interaction.element);
    }

    const dropEvents = getDropEvents(interaction, event, dragEvent);

    if (dropEvents.activate) {
      fireActivationEvents(dropStatus.activeDrops, dropEvents.activate);
    }
  });

  interactions.signals.on('action-move', arg => onEventCreated(arg, scope, dynamicDrop));
  interactions.signals.on('action-end' , arg => onEventCreated(arg, scope, dynamicDrop));

  interactions.signals.on('after-action-move', function ({ interaction }) {
    if (interaction.prepared.name !== 'drag') { return; }

    fireDropEvents(interaction, interaction.dropStatus.events);
    interaction.dropStatus.events = {};
  });

  interactions.signals.on('after-action-end', function ({ interaction }) {
    if (interaction.prepared.name === 'drag') {
      fireDropEvents(interaction, interaction.dropStatus.events);
    }
  });

  interactions.signals.on('stop', function ({ interaction }) {
    interaction.dropStatus.activeDrops = null;
    interaction.dropStatus.events = null;
  });

  /**
   * ```js
   * interact(target)
   * .dropChecker(function(dragEvent,         // related dragmove or dragend event
   *                       event,             // TouchEvent/PointerEvent/MouseEvent
   *                       dropped,           // bool result of the default checker
   *                       dropzone,          // dropzone Interactable
   *                       dropElement,       // dropzone elemnt
   *                       draggable,         // draggable Interactable
   *                       draggableElement) {// draggable element
   *
   *   return dropped && event.target.hasAttribute('allow-drop');
   * }
   * ```
   *
   * ```js
   * interact('.drop').dropzone({
   *   accept: '.can-drop' || document.getElementById('single-drop'),
   *   overlap: 'pointer' || 'center' || zeroToOne
   * }
   * ```
   *
   * Returns or sets whether draggables can be dropped onto this target to
   * trigger drop events
   *
   * Dropzones can receive the following events:
   *  - `dropactivate` and `dropdeactivate` when an acceptable drag starts and ends
   *  - `dragenter` and `dragleave` when a draggable enters and leaves the dropzone
   *  - `dragmove` when a draggable that has entered the dropzone is moved
   *  - `drop` when a draggable is dropped into this dropzone
   *
   * Use the `accept` option to allow only elements that match the given CSS
   * selector or element. The value can be:
   *
   *  - **an Element** - only that element can be dropped into this dropzone.
   *  - **a string**, - the element being dragged must match it as a CSS selector.
   *  - **`null`** - accept options is cleared - it accepts any element.
   *
   * Use the `overlap` option to set how drops are checked for. The allowed
   * values are:
   *
   *   - `'pointer'`, the pointer must be over the dropzone (default)
   *   - `'center'`, the draggable element's center must be over the dropzone
   *   - a number from 0-1 which is the `(intersection area) / (draggable area)`.
   *   e.g. `0.5` for drop to happen when half of the area of the draggable is
   *   over the dropzone
   *
   * Use the `checker` option to specify a function to check if a dragged element
   * is over this Interactable.
   *
   * @param {boolean | object | null} [options] The new options to be set.
   * @return {boolean | Interactable} The current setting or this Interactable
   */
  Interactable.prototype.dropzone = function (options) {
    if (utils.is.object(options)) {
      this.options.drop.enabled = options.enabled === false? false: true;

      if (utils.is.func(options.ondrop)          ) { this.events.ondrop           = options.ondrop          ; }
      if (utils.is.func(options.ondropactivate)  ) { this.events.ondropactivate   = options.ondropactivate  ; }
      if (utils.is.func(options.ondropdeactivate)) { this.events.ondropdeactivate = options.ondropdeactivate; }
      if (utils.is.func(options.ondragenter)     ) { this.events.ondragenter      = options.ondragenter     ; }
      if (utils.is.func(options.ondragleave)     ) { this.events.ondragleave      = options.ondragleave     ; }
      if (utils.is.func(options.ondropmove)      ) { this.events.ondropmove       = options.ondropmove      ; }

      if (/^(pointer|center)$/.test(options.overlap)) {
        this.options.drop.overlap = options.overlap;
      }
      else if (utils.is.number(options.overlap)) {
        this.options.drop.overlap = Math.max(Math.min(1, options.overlap), 0);
      }
      if ('accept' in options) {
        this.options.drop.accept = options.accept;
      }
      if ('checker' in options) {
        this.options.drop.checker = options.checker;
      }


      return this;
    }

    if (utils.is.bool(options)) {
      this.options.drop.enabled = options;

      if (!options) {
        this.ondragenter = this.ondragleave = this.ondrop
          = this.ondropactivate = this.ondropdeactivate = null;
      }

      return this;
    }

    return this.options.drop;
  };

  Interactable.prototype.dropCheck = function (dragEvent, event, draggable, draggableElement, dropElement, rect) {
    let dropped = false;

    // if the dropzone has no rect (eg. display: none)
    // call the custom dropChecker or just return false
    if (!(rect = rect || this.getRect(dropElement))) {
      return (this.options.drop.checker
        ? this.options.drop.checker(dragEvent, event, dropped, this, dropElement, draggable, draggableElement)
        : false);
    }

    const dropOverlap = this.options.drop.overlap;

    if (dropOverlap === 'pointer') {
      const origin = utils.getOriginXY(draggable, draggableElement, 'drag');
      const page = utils.pointer.getPageXY(dragEvent);

      page.x += origin.x;
      page.y += origin.y;

      const horizontal = (page.x > rect.left) && (page.x < rect.right);
      const vertical   = (page.y > rect.top ) && (page.y < rect.bottom);

      dropped = horizontal && vertical;
    }

    const dragRect = draggable.getRect(draggableElement);

    if (dragRect && dropOverlap === 'center') {
      const cx = dragRect.left + dragRect.width  / 2;
      const cy = dragRect.top  + dragRect.height / 2;

      dropped = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
    }

    if (dragRect && utils.is.number(dropOverlap)) {
      const overlapArea  = (Math.max(0, Math.min(rect.right , dragRect.right ) - Math.max(rect.left, dragRect.left))
                            * Math.max(0, Math.min(rect.bottom, dragRect.bottom) - Math.max(rect.top , dragRect.top )));

      const overlapRatio = overlapArea / (dragRect.width * dragRect.height);

      dropped = overlapRatio >= dropOverlap;
    }

    if (this.options.drop.checker) {
      dropped = this.options.drop.checker(dragEvent, event, dropped, this, dropElement, draggable, draggableElement);
    }

    return dropped;
  };

  interactions.signals.on('new', function (interaction) {
    interaction.dropStatus = {
      cur: {
        dropzone : null,  // the dropzone a drag target might be dropped into
        element  : null,  // the element at the time of checking
      },
      prev: {
        dropzone : null,  // the dropzone that was recently dragged away from
        element  : null,  // the element at the time of checking
      },
      rejected   : false, // wheather the potential drop was rejected from a listener
      events     : null,  // the drop events related to the current drag event
      activeDrops: null,  // an array of { dropzone, element, rect }
    };
  });

  interactions.signals.on('stop', function ({ interaction: { dropStatus } }) {
    dropStatus.cur.dropzone = dropStatus.cur.element =
      dropStatus.prev.dropzone = dropStatus.prev.element = null;
    dropStatus.rejected = false;
  });

  /**
   * Returns or sets whether the dimensions of dropzone elements are calculated
   * on every dragmove or only on dragstart for the default dropChecker
   *
   * @param {boolean} [newValue] True to check on each move. False to check only
   * before start
   * @return {boolean | interact} The current setting or interact
   */
  interact.dynamicDrop = function (newValue) {
    if (utils.is.bool(newValue)) {
      //if (dragging && dynamicDrop !== newValue && !newValue) {
      //  calcRects(dropzones);
      //}

      dynamicDrop = newValue;

      return interact;
    }
    return dynamicDrop;
  };

  utils.arr.merge(actions.eventTypes, [
    'dragenter',
    'dragleave',
    'dropactivate',
    'dropdeactivate',
    'dropmove',
    'drop',
  ]);
  actions.methodDict.drop = 'dropzone';

  defaults.drop = drop.defaults;
}

function collectDrops ({ interactables }, draggableElement) {
  const drops = [];

  // collect all dropzones and their elements which qualify for a drop
  for (const dropzone of interactables.list) {
    if (!dropzone.options.drop.enabled) { continue; }

    const accept = dropzone.options.drop.accept;

    // test the draggable draggableElement against the dropzone's accept setting
    if ((utils.is.element(accept) && accept !== draggableElement)
        || (utils.is.string(accept)
        && !utils.dom.matchesSelector(draggableElement, accept))) {

      continue;
    }

    // query for new elements if necessary
    const dropElements = utils.is.string(dropzone.target)
      ? dropzone._context.querySelectorAll(dropzone.target)
      : [dropzone.target];

    for (const dropzoneElement of dropElements) {
      if (dropzoneElement !== draggableElement) {
        drops.push({
          dropzone,
          element: dropzoneElement,
        });
      }
    }
  }

  return drops;
}

function fireActivationEvents (activeDrops, event) {
  let prevElement;

  // loop through all active dropzones and trigger event
  for (const { dropzone, element } of activeDrops) {

    // prevent trigger of duplicate events on same element
    if (element !== prevElement) {
      // set current element as event target
      event.target = element;
      dropzone.fire(event);
    }
    prevElement = element;
  }
}

// return a new array of possible drops. getActiveDrops should always be
// called when a drag has just started or a drag event happens while
// dynamicDrop is true
function getActiveDrops (scope, dragElement) {
  // get dropzones and their elements that could receive the draggable
  const activeDrops = collectDrops(scope, dragElement);

  for (const activeDrop of activeDrops) {
    activeDrop.rect = activeDrop.dropzone.getRect(activeDrop.element);
  }

  return activeDrops;
}

function getDrop ({ dropStatus, target: draggable, element: dragElement }, dragEvent, pointerEvent) {
  const validDrops = [];

  // collect all dropzones and their elements which qualify for a drop
  for (const { dropzone, element: dropzoneElement, rect } of dropStatus.activeDrops) {
    validDrops.push(dropzone.dropCheck(dragEvent, pointerEvent, draggable, dragElement, dropzoneElement, rect)
      ? dropzoneElement
      : null);
  }

  // get the most appropriate dropzone based on DOM depth and order
  const dropIndex = utils.dom.indexOfDeepestElement(validDrops);

  return dropStatus.activeDrops[dropIndex] || null;
}

function getDropEvents (interaction, pointerEvent, dragEvent) {
  const { dropStatus } = interaction;
  const dropEvents = {
    enter     : null,
    leave     : null,
    activate  : null,
    deactivate: null,
    move      : null,
    drop      : null,
  };

  if (dragEvent.type === 'dragstart') {
    dropEvents.activate = new DropEvent(dropStatus, dragEvent, 'dropactivate');

    dropEvents.activate.target   = null;
    dropEvents.activate.dropzone = null;
  }
  if (dragEvent.type === 'dragend') {
    dropEvents.deactivate = new DropEvent(dropStatus, dragEvent, 'dropdeactivate');

    dropEvents.deactivate.target   = null;
    dropEvents.deactivate.dropzone = null;
  }

  if (dropStatus.rejected) {
    return dropEvents;
  }

  if (dropStatus.cur.element !== dropStatus.prev.element) {
    // if there was a previous dropzone, create a dragleave event
    if (dropStatus.prev.dropzone) {
      dropEvents.leave = new DropEvent(dropStatus, dragEvent, 'dragleave');

      dragEvent.dragLeave    = dropEvents.leave.target   = dropStatus.prev.element;
      dragEvent.prevDropzone = dropEvents.leave.dropzone = dropStatus.prev.dropzone;
    }
    // if dropzone is not null, create a dragenter event
    if (dropStatus.cur.dropzone) {
      dropEvents.enter = new DropEvent(dropStatus, dragEvent, 'dragenter');

      dragEvent.dragEnter = dropStatus.cur.element;
      dragEvent.dropzone = dropStatus.cur.dropzone;
    }
  }

  if (dragEvent.type === 'dragend' && dropStatus.cur.dropzone) {
    dropEvents.drop = new DropEvent(dropStatus, dragEvent, 'drop');

    dragEvent.dropzone = dropStatus.cur.dropzone;
    dragEvent.relatedTarget = dropStatus.cur.element;
  }
  if (dragEvent.type === 'dragmove' && dropStatus.cur.dropzone) {
    dropEvents.move = new DropEvent(dropStatus, dragEvent, 'dropmove');

    dropEvents.move.dragmove = dragEvent;
    dragEvent.dropzone = dropStatus.cur.dropzone;
  }

  return dropEvents;
}

function fireDropEvents (interaction, events) {
  const { dropStatus } = interaction;
  const {
    activeDrops,
    cur,
    prev,
  } = dropStatus;

  if (events.leave) { prev.dropzone.fire(events.leave); }
  if (events.move ) { cur.dropzone.fire(events.move ); }
  if (events.enter) { cur.dropzone.fire(events.enter); }
  if (events.drop ) { cur.dropzone.fire(events.drop ); }

  if (events.deactivate) {
    fireActivationEvents(activeDrops, events.deactivate);
  }

  dropStatus.prev.dropzone  = cur.dropzone;
  dropStatus.prev.element = cur.element;
}

function onEventCreated ({ interaction, iEvent, event }, scope, dynamicDrop) {
  if (iEvent.type !== 'dragmove' && iEvent.type !== 'dragend') { return; }

  const { dropStatus } = interaction;

  if (dynamicDrop) {
    dropStatus.activeDrops = getActiveDrops(scope, interaction.target, interaction.element);
  }

  const dragEvent = iEvent;
  const dropResult = getDrop(interaction, dragEvent, event);

  // update rejected status
  dropStatus.rejected = dropStatus.rejected &&
    !!dropResult &&
    dropResult.dropzone === dropStatus.cur.dropzone &&
    dropResult.element === dropStatus.cur.element;

  dropStatus.cur.dropzone  = dropResult && dropResult.dropzone;
  dropStatus.cur.element = dropResult && dropResult.element;

  dropStatus.events = getDropEvents(interaction, event, dragEvent);
}

const drop = {
  init,
  getActiveDrops,
  getDrop,
  getDropEvents,
  fireDropEvents,
  defaults: {
    enabled: false,
    accept : null,
    overlap: 'pointer',
  },
};

export default drop;
