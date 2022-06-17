// import Vue from 'vue/dist/vue.esm.browser.js'
import interact from '@interactjs/interactjs'
import { h } from 'vue'
import { createApp } from 'vue/dist/vue.esm-browser'

import { getData, sortableOptions, swappableOptions } from './shared.js'

interact.vue.setH(h)

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
