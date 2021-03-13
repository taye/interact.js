// import Vue from 'vue/dist/vue.esm.browser.js'
import { createApp } from 'vue/dist/vue.esm-browser'

import interact from '@interactjs/interactjs'

import { getData, sortableOptions, swappableOptions } from './shared.js'

// eslint-disable-next-line no-new
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
