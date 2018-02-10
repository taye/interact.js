// This module allows snapping of the size of targets during resize
// interactions.

const extend = require('../utils/extend');
const is = require('../utils/is');
const snap = require('./snap');

function init (scope) {
  const {
    modifiers,
    defaults,
    actions,
  } = scope;

  modifiers.snapSize = module.exports;
  modifiers.names.push('snapSize');

  defaults.perAction.snapSize = module.exports.defaults;
  actions.resize.defaults.snapSize  = module.exports.defaults;
}

function setOffset (arg) {
  const { interaction, options } = arg;
  const edges = interaction.prepared.edges;

  if (!edges) { return; }

  arg.options = {
    relativePoints: [{
      x: edges.left? 0 : 1,
      y: edges.top ? 0 : 1,
    }],
    origin: { x: 0, y: 0 },
    offset: 'self',
    range: options.range,
  };

  const offsets = snap.setOffset(arg);
  arg.options = options;

  return offsets;
}

function set (arg) {
  const { interaction, options, offset, modifiedCoords } = arg;
  const page = extend({}, modifiedCoords);
  const relativeX = page.x - offset[0].x;
  const relativeY = page.y - offset[0].y;

  arg.options = extend({}, options);
  arg.options.targets = [];

  for (const snapTarget of (options.targets || [])) {
    let target;

    if (is.function(snapTarget)) {
      target = snapTarget(relativeX, relativeY, interaction);
    }
    else {
      target = snapTarget;
    }

    if (!target) { continue; }

    if ('width' in target && 'height' in target) {
      target.x = target.width;
      target.y = target.height;
    }

    arg.options.targets.push(target);
  }

  snap.set(arg);
}

function modifyCoords (arg) {
  const { options } = arg;

  arg.options = extend({}, options);
  arg.options.enabled = options.enabled;
  arg.options.relativePoints = [null];

  snap.modifyCoords(arg);
}

module.exports = {
  init,
  setOffset,
  set,
  modifyCoords,
  defaults: {
    enabled: false,
    endOnly: false,
    range  : Infinity,
    targets: null,
    offsets: null,
  },
};
