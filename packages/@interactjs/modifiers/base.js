import Modification from './Modification';
export function makeModifier(module, name) {
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
    options.enabled = options.enabled !== false; // add missing defaults to options

    for (const prop in defaults) {
      if (!(prop in options)) {
        ;
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
export function addEventModifiers({
  iEvent,
  interaction
}) {
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
    'interactions:new': ({
      interaction
    }) => {
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
export default modifiersBase;
//# sourceMappingURL=base.js.map