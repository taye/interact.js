/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import { Modification } from './Modification.js';
import "../utils/clone.js";
import "../utils/extend.js";
import "../utils/rect.js";
function makeModifier(module, name) {
  const {
    defaults
  } = module;
  const methods = {
    start: module.start,
    set: module.set,
    beforeEnd: module.beforeEnd,
    stop: module.stop
  };
  const modifier = _options => {
    const options = _options || {};
    options.enabled = options.enabled !== false;

    // add missing defaults to options
    for (const prop in defaults) {
      if (!(prop in options)) {
        options[prop] = defaults[prop];
      }
    }
    const m = {
      options,
      methods,
      name,
      enable: () => {
        options.enabled = true;
        return m;
      },
      disable: () => {
        options.enabled = false;
        return m;
      }
    };
    return m;
  };
  if (name && typeof name === 'string') {
    // for backwrads compatibility
    modifier._defaults = defaults;
    modifier._methods = methods;
  }
  return modifier;
}
function addEventModifiers(_ref) {
  let {
    iEvent,
    interaction
  } = _ref;
  const result = interaction.modification.result;
  if (result) {
    iEvent.modifiers = result.eventProps;
  }
}
const modifiersBase = {
  id: 'modifiers/base',
  before: ['actions'],
  install: scope => {
    scope.defaults.perAction.modifiers = [];
  },
  listeners: {
    'interactions:new': _ref2 => {
      let {
        interaction
      } = _ref2;
      interaction.modification = new Modification(interaction);
    },
    'interactions:before-action-start': arg => {
      const {
        interaction
      } = arg;
      const modification = arg.interaction.modification;
      modification.start(arg, interaction.coords.start.page);
      interaction.edges = modification.edges;
      modification.applyToInteraction(arg);
    },
    'interactions:before-action-move': arg => {
      const {
        interaction
      } = arg;
      const {
        modification
      } = interaction;
      const ret = modification.setAndApply(arg);
      interaction.edges = modification.edges;
      return ret;
    },
    'interactions:before-action-end': arg => {
      const {
        interaction
      } = arg;
      const {
        modification
      } = interaction;
      const ret = modification.beforeEnd(arg);
      interaction.edges = modification.startEdges;
      return ret;
    },
    'interactions:action-start': addEventModifiers,
    'interactions:action-move': addEventModifiers,
    'interactions:action-end': addEventModifiers,
    'interactions:after-action-start': arg => arg.interaction.modification.restoreInteractionCoords(arg),
    'interactions:after-action-move': arg => arg.interaction.modification.restoreInteractionCoords(arg),
    'interactions:stop': arg => arg.interaction.modification.stop(arg)
  }
};
export { addEventModifiers, modifiersBase as default, makeModifier };
//# sourceMappingURL=base.js.map
