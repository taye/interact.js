// import Vue from 'vue/dist/vue.esm.browser.js'
import interact from '@interactjs/interactjs'
import { createApp } from 'vue/dist/vue.esm-browser'

import { getData, sortableOptions, swappableOptions } from './shared.js'

// eslint-disable-next-line no-new
createApp({
  data () {
    return {
      ...getData(),
      sortableOptions,
      swappableOptions,
    }
  },
  components: {
    ...interact.vue.components,
  },
}).mount('#vue-app')
