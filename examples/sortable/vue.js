import '@interactjs/vue'
import interact from '@interactjs/interactjs'
import { createApp } from 'vue'

import { getData, sortableOptions, swappableOptions } from './shared.js'

createApp({
  components: {
    ...interact.vue.components,
  },
  data () {
    return {
      ...getData(),
      sortableOptions,
      swappableOptions,
    }
  },
}).mount('#vue-app')
