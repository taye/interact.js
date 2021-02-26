import Vue from 'vue/dist/vue.esm.browser.js'

import interact from '@interactjs/interactjs/index.js'

import { getData, sortableOptions, swappableOptions } from './shared.js'

// eslint-disable-next-line no-new
new Vue({
  el: '#vue-app',
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
})
