const actions        = require('./index');
const utils          = require('../utils');
const browser        = require('../utils/browser');
const InteractEvent  = require('../InteractEvent');
const Interactable   = require('../Interactable');
const Interaction    = require('../Interaction');
const defaultOptions = require('../defaultOptions');

// Less Precision with touch input
const defaultMargin = browser.supportsTouch || browser.supportsPointerEvent? 20: 10;

const resize = {
  defaults: {
    enabled     : false,
    mouseButtons: null,

    origin    : null,
    snap      : null,
    restrict  : null,
    inertia   : null,
    autoScroll: null,

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
    invert: 'none',
  },

  checker: function (pointer, event, interactable, element, interaction, rect) {
    if (!rect) { return null; }

    const page = utils.extend({}, interaction.curCoords.page);
    const options = interactable.options;

    if (options.resize.enabled) {
      const resizeOptions = options.resize;
      const resizeEdges = {
        left: false,
        right: false,
        top: false,
        bottom: false,
        topleft: false,
        topright: false,
        bottomleft: false,
        bottomright: false,
      };

      // if using resize.edges
      if (utils.isObject(resizeOptions.edges)) {
        for (const edge in resizeEdges) {
          resizeEdges[edge] = checkResizeEdge(edge,
                                              resizeOptions.edges[edge],
                                              page,
                                              interaction._eventTarget,
                                              element,
                                              rect,
                                              resizeOptions.margin || defaultMargin);
        }

        resizeEdges.left = resizeEdges.left && !resizeEdges.right;
        resizeEdges.top  = resizeEdges.top  && !resizeEdges.bottom;

        if (resizeEdges.left || resizeEdges.right || resizeEdges.top || resizeEdges.bottom ||
            resizeEdges.topleft || resizeEdges.topright || resizeEdges.bottomleft || resizeEdges.bottomright) {
          return {
            name: 'resize',
            edges: resizeEdges,
          };
        }
      }
      else {
        const right  = options.resize.axis !== 'y' && page.x > (rect.right  - defaultMargin);
        const bottom = options.resize.axis !== 'x' && page.y > (rect.bottom - defaultMargin);

        if (right || bottom) {
          return {
            name: 'resize',
            axes: (right? 'x' : '') + (bottom? 'y' : ''),
          };
        }
      }
    }

    return null;
  },

  cursors: (browser.isIe9OrOlder ? {
    x : 'e-resize',
    y : 's-resize',
    xy: 'se-resize',

    top        : 'n-resize',
    left       : 'w-resize',
    bottom     : 's-resize',
    right      : 'e-resize',
    topleft    : 'se-resize',
    bottomright: 'se-resize',
    topright   : 'ne-resize',
    bottomleft : 'ne-resize',
  } : {
    x : 'ew-resize',
    y : 'ns-resize',
    xy: 'nwse-resize',

    top        : 'ns-resize',
    left       : 'ew-resize',
    bottom     : 'ns-resize',
    right      : 'ew-resize',
    topleft    : 'nwse-resize',
    bottomright: 'nwse-resize',
    topright   : 'nesw-resize',
    bottomleft : 'nesw-resize',
  }),

  getCursor: function (action) {
    if (action.axis) {
      return resize.cursors[action.name + action.axis];
    }
    else if (action.edges) {
      let cursorKey = '';
      const edgeNames = ['top', 'bottom', 'left', 'right', 'topleft', 'bottomleft', 'topright', 'bottomright'];

      for (let i = 0; i < edgeNames.length; i++) {
        if (action.edges[edgeNames[i]]) {
          cursorKey += edgeNames[i];
        }
      }

      return resize.cursors[cursorKey];
    }
  },
};

Interaction.signals.on('action-start', function ({ interaction, event }) {
  if (interaction.prepared.name !== 'resize') { return; }

  const resizeEvent = new InteractEvent(interaction, event, 'resize', 'start', interaction.element);

  if (interaction.prepared.edges) {
    const startRect = interaction.target.getRect(interaction.element);
    const resizeOptions = interaction.target.options.resize;

    /*
     * When using the `resizable.square` or `resizable.preserveAspectRatio` options, resizing from one edge
     * will affect another. E.g. with `resizable.square`, resizing to make the right edge larger will make
     * the bottom edge larger by the same amount. We call these 'linked' edges. Any linked edges will depend
     * on the active edges and the edge being interacted with.
     */
    if (resizeOptions.square || resizeOptions.preserveAspectRatio) {
      const linkedEdges = utils.extend({}, interaction.prepared.edges);

      linkedEdges.top    = linkedEdges.top    || (linkedEdges.left   && !linkedEdges.bottom);
      linkedEdges.left   = linkedEdges.left   || (linkedEdges.top    && !linkedEdges.right );
      linkedEdges.bottom = linkedEdges.bottom || (linkedEdges.right  && !linkedEdges.top   );
      linkedEdges.right  = linkedEdges.right  || (linkedEdges.bottom && !linkedEdges.left  );

      interaction.prepared._linkedEdges = linkedEdges;
    }
    else {
      interaction.prepared._linkedEdges = null;
    }

    // if using `resizable.preserveAspectRatio` option, record aspect ratio at the start of the resize
    if (resizeOptions.preserveAspectRatio) {
      interaction.resizeStartAspectRatio = startRect.width / startRect.height;
    }

    interaction.resizeRects = {
      start     : startRect,
      current   : utils.extend({}, startRect),
      restricted: utils.extend({}, startRect),
      previous  : utils.extend({}, startRect),
      delta     : {
        left: 0, right : 0, width : 0,
        top : 0, bottom: 0, height: 0,
      },
    };

    resizeEvent.rect = interaction.resizeRects.restricted;
    resizeEvent.deltaRect = interaction.resizeRects.delta;
  }

  interaction.target.fire(resizeEvent);

  interaction._interacting = true;

  interaction.prevEvent = resizeEvent;
});

Interaction.signals.on('action-move', function ({ interaction, event }) {
  if (interaction.prepared.name !== 'resize') { return; }

  const resizeEvent = new InteractEvent(interaction, event, 'resize', 'move', interaction.element);
  const resizeOptions = interaction.target.options.resize;
  const invert = resizeOptions.invert;
  const invertible = invert === 'reposition' || invert === 'negate';

  let edges = interaction.prepared.edges;

  if (edges) {
    const start      = interaction.resizeRects.start;
    const current    = interaction.resizeRects.current;
    const restricted = interaction.resizeRects.restricted;
    const delta      = interaction.resizeRects.delta;
    const previous   = utils.extend(interaction.resizeRects.previous, restricted);
    const originalEdges = edges;

    let dx = resizeEvent.dx;
    let dy = resizeEvent.dy;

    if (resizeOptions.preserveAspectRatio || resizeOptions.square) {
      // `resize.preserveAspectRatio` takes precedence over `resize.square`
      const startAspectRatio = resizeOptions.preserveAspectRatio
        ? interaction.resizeStartAspectRatio
        : 1;

      edges = interaction.prepared._linkedEdges;

      if ((originalEdges.left && originalEdges.bottom)
          || (originalEdges.right && originalEdges.top)
          || originalEdges.bottomleft || originalEdges.topright) {
        dy = -dx / startAspectRatio;
      }
      else if (originalEdges.bottomright || originalEdges.topleft) {
        dx = dy / startAspectRatio;
      }
      else if (originalEdges.left || originalEdges.right ) { dy = dx / startAspectRatio; }
      else if (originalEdges.top  || originalEdges.bottom) { dx = dy * startAspectRatio; }
    }

    // update the 'current' rect without modifications
    if (edges.top        ) { current.top    += dy; }
    if (edges.bottom     ) { current.bottom += dy; }
    if (edges.left       ) { current.left   += dx; }
    if (edges.right      ) { current.right  += dx; }
    if (edges.topleft    ) { current.left   += dx; current.top    += dy; }
    if (edges.bottomleft ) { current.left   += dx; current.bottom += dy; }
    if (edges.topright   ) { current.right  += dx; current.top    += dy; }
    if (edges.bottomright) { current.right  += dx; current.bottom += dy; }

    if (invertible) {
      // if invertible, copy the current rect
      utils.extend(restricted, current);

      if (invert === 'reposition') {
        // swap edge values if necessary to keep width/height positive
        let swap;

        if (restricted.top > restricted.bottom) {
          swap = restricted.top;

          restricted.top = restricted.bottom;
          restricted.bottom = swap;
        }
        if (restricted.left > restricted.right) {
          swap = restricted.left;

          restricted.left = restricted.right;
          restricted.right = swap;
        }
      }
    }
    else {
      // if not invertible, restrict to minimum of 0x0 rect
      restricted.top    = Math.min(current.top, start.bottom);
      restricted.bottom = Math.max(current.bottom, start.top);
      restricted.left   = Math.min(current.left, start.right);
      restricted.right  = Math.max(current.right, start.left);
    }

    restricted.width  = restricted.right  - restricted.left;
    restricted.height = restricted.bottom - restricted.top ;

    for (const edge in restricted) {
      delta[edge] = restricted[edge] - previous[edge];
    }

    resizeEvent.edges = interaction.prepared.edges;
    resizeEvent.rect = restricted;
    resizeEvent.deltaRect = delta;
  }

  interaction.target.fire(resizeEvent);

  interaction.prevEvent = resizeEvent;

  // if the action was ended in a resizemove listener
  if (!interaction.interacting()) { return false; }
});

Interaction.signals.on('action-end', function ({ interaction, event }) {
  if (interaction.prepared.name !== 'resize') { return; }

  const resizeEvent = new InteractEvent(interaction, event, 'resize', 'end', interaction.element);

  interaction.target.fire(resizeEvent);
  interaction.prevEvent = resizeEvent;
});

/*\
 * Interactable.resizable
 [ method ]
 *
 * Gets or sets whether resize actions can be performed on the
 * Interactable
 *
 = (boolean) Indicates if this can be the target of resize elements
   | var isResizeable = interact('input[type=text]').resizable();
 * or
 - options (boolean | object) #optional true/false or An object with event listeners to be fired on resize events (object makes the Interactable resizable)
 = (object) This Interactable
   | interact(element).resizable({
   |   onstart: function (event) {},
   |   onmove : function (event) {},
   |   onend  : function (event) {},
   |
   |   edges: {
   |     top   : true,       // Use pointer coords to check for resize.
   |     left  : false,      // Disable resizing from left edge.
   |     bottom: '.resize-s',// Resize if pointer target matches selector
   |     right : handleEl    // Resize if pointer target is the given Element
   |   },
   |
   |     // Width and height can be adjusted independently. When `true`, width and
   |     // height are adjusted at a 1:1 ratio.
   |     square: false,
   |
   |     // Width and height can be adjusted independently. When `true`, width and
   |     // height maintain the aspect ratio they had when resizing started.
   |     preserveAspectRatio: false,
   |
   |   // a value of 'none' will limit the resize rect to a minimum of 0x0
   |   // 'negate' will allow the rect to have negative width/height
   |   // 'reposition' will keep the width/height positive by swapping
   |   // the top and bottom edges and/or swapping the left and right edges
   |   invert: 'none' || 'negate' || 'reposition'
   |
   |   // limit multiple resizes.
   |   // See the explanation in the @Interactable.draggable example
   |   max: Infinity,
   |   maxPerElement: 1,
   | });
  \*/
Interactable.prototype.resizable = function (options) {
  if (utils.isObject(options)) {
    this.options.resize.enabled = options.enabled === false? false: true;
    this.setPerAction('resize', options);
    this.setOnEvents('resize', options);

    if (/^x$|^y$|^xy$/.test(options.axis)) {
      this.options.resize.axis = options.axis;
    }
    else if (options.axis === null) {
      this.options.resize.axis = defaultOptions.resize.axis;
    }

    if (utils.isBool(options.preserveAspectRatio)) {
      this.options.resize.preserveAspectRatio = options.preserveAspectRatio;
    }
    else if (utils.isBool(options.square)) {
      this.options.resize.square = options.square;
    }

    return this;
  }
  if (utils.isBool(options)) {
    this.options.resize.enabled = options;

    if (!options) {
      this.onresizestart = this.onresizestart = this.onresizeend = null;
    }

    return this;
  }
  return this.options.resize;
};

function checkResizeEdge (name, value, page, element, interactableElement, rect, margin) {
  // false, '', undefined, null
  if (!value) { return false; }

  // true value, use pointer coords and element rect
  if (value === true) {
    // if dimensions are negative, "switch" edges
    const width    = utils.isNumber(rect.width )? rect.width  : rect.right  - rect.left;
    const height   = utils.isNumber(rect.height)? rect.height : rect.bottom - rect.top ;
    // define if cursor is beyond resize edge
    const isLeft   = page.x < ((width  >= 0 ? rect.left: rect.right ) + margin);
    const isTop    = page.y < ((height >= 0 ? rect.top : rect.bottom) + margin);
    const isRight  = page.x > ((width  >= 0 ? rect.right : rect.left) - margin);
    const isBottom = page.y > ((height >= 0 ? rect.bottom: rect.top ) - margin);

    if (width < 0) {
      if      (name === 'left' ) { name = 'right'; }
      else if (name === 'right') { name = 'left' ; }
    }
    if (height < 0) {
      if      (name === 'top'   ) { name = 'bottom'; }
      else if (name === 'bottom') { name = 'top'   ; }
    }

    if (name === 'left'       ) { return isLeft; }
    if (name === 'top'        ) { return isTop; }

    if (name === 'right'      ) { return isRight; }
    if (name === 'bottom'     ) { return isBottom; }

    if (name === 'topleft'    ) { return isLeft && isTop; }
    if (name === 'topright'   ) { return isTop && isRight; }

    if (name === 'bottomright') { return isRight && isBottom; }
    if (name === 'bottomleft' ) { return isLeft && isBottom; }
  }

  // the remaining checks require an element
  if (!utils.isElement(element)) { return false; }

  return utils.isElement(value)
  // the value is an element to use as a resize handle
    ? value === element
    // otherwise check if element matches value as selector
    : utils.matchesUpTo(element, value, interactableElement);
}

Interaction.signals.on('new', function (interaction) {
  interaction.resizeAxes = 'xy';
});

InteractEvent.signals.on('set-delta', function ({ interaction, iEvent, action }) {
  if (action !== 'resize' || !interaction.resizeAxes) { return; }

  const options = interaction.target.options;

  if (options.resize.square) {
    if (interaction.resizeAxes === 'y') {
      iEvent.dx = iEvent.dy;
    }
    else {
      iEvent.dy = iEvent.dx;
    }
    iEvent.axes = 'xy';
  }
  else {
    iEvent.axes = interaction.resizeAxes;

    if (interaction.resizeAxes === 'x') {
      iEvent.dy = 0;
    }
    else if (interaction.resizeAxes === 'y') {
      iEvent.dx = 0;
    }
  }
});

actions.resize = resize;
actions.names.push('resize');
utils.merge(Interactable.eventTypes, [
  'resizestart',
  'resizemove',
  'resizeinertiastart',
  'resizeinertiaresume',
  'resizeend',
]);
actions.methodDict.resize = 'resizable';

defaultOptions.resize = resize.defaults;

module.exports = resize;
