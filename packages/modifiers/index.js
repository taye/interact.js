import snapModule from './snap';
import snapSizeModule from './snapSize';
import snapEdgesModule from './snapEdges';
import restrictModule from './restrict';
import restrictEdgesModule from './restrictEdges';
import restrictSizeModule from './restrictSize';

export const snap = makeModifier('snap', snapModule);
export const snapSize = makeModifier('snapSize', snapSizeModule);
export const snapEdges = makeModifier('snapEdges', snapEdgesModule);
export const restrict = makeModifier('restrict', restrictModule);
export const restrictEdges = makeModifier('restrictEdges', restrictEdgesModule);
export const restrictSize = makeModifier('restrictSize', restrictSizeModule);

function makeModifier (name, module) {
  const methods = { start: module.start, set: module.set };
  const { defaults } = module;

  const modifier = options => {
    // add missing defaults to options
    options.enabled = options.enabled !== false;

    for (const prop in defaults) {
      if (!(prop in options)) {
        options[prop] = defaults[prop];
      }
    }

    return { options, methods };
  };

  Object.defineProperty(
    modifier,
    'name',
    { value: name });

  // for backwrads compatibility
  modifier._defaults = defaults;
  modifier._methods = methods;

  return modifier;
}
