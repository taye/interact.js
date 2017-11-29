// This module allows snapping of the size of targets during resize
// interactions.

const modifiers      = require('./base');
const snap           = require('./snap');
const defaultOptions = require('../defaultOptions');
const resize         = require('../actions/resize');
const utils          = require('../utils/');

const snapSize = {
  defaults: {
    enabled: false,
    endOnly: false,
    range  : Infinity,
    targets: null,
    offsets: null,
  },

  setOffset: function (arg) {
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
  },

  set: function (arg) {
    const { interaction, options, offset, modifiedCoords } = arg;
    const page = utils.extend({}, modifiedCoords);
    const relativeX = page.x - offset[0].x;
    const relativeY = page.y - offset[0].y;

    arg.options = utils.extend({}, options);
    arg.options.targets = [];

    for (const snapTarget of (options.targets || [])) {
      let target;

      if (utils.is.function(snapTarget)) {
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
  },

  modifyCoords: function (arg) {
    const { options } = arg;

    arg.options = utils.extend({}, options);
    arg.options.enabled = options.enabled;
    arg.options.relativePoints = [null];

    snap.modifyCoords(arg);
  },
};

modifiers.snapSize = snapSize;
modifiers.names.push('snapSize');

defaultOptions.perAction.snapSize = snapSize.defaults;
resize.defaults.snapSize          = snapSize.defaults;

module.exports = snapSize;
