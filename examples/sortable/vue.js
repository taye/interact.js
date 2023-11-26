import '@interactjs/vue'
import { createApp } from 'vue/dist/vue.esm-bundler'

import interact from '@interactjs/interactjs'

import { getData, sortableOptions, swappableOptions } from './shared.js'

const app = createApp({
  data() {
    return {
      ...getData(),
      sortableOptions,
      swappableOptions,
    }
  },
})

app.use(interact.vue)
app.mount('#vue-app')
