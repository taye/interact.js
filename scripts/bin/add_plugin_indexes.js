const { isPro } = require('../utils')

require('../addPluginIndexes')([
  'actions/plugin',
  'actions/drag/plugin',
  'actions/drop/plugin',
  'actions/resize/plugin',
  'actions/gesture/plugin',
  'auto-scroll/plugin',
  'auto-start/plugin',
  'dev-tools/plugin',
  'inertia/plugin',
  'modifiers/plugin',
  'pointer-events/plugin',
  'reflow/plugin',
  'snappers/plugin',
  ...(isPro
    ? [
      'react/plugin',
      // 'vue/plugin',
      'multi-target/plugin',
      'feedback/plugin',
      'clone/plugin',
      'arrange/plugin',
      'iframes/plugin',
    ]
    : []),
])
