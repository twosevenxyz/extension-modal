import Vue from 'vue'
import App from './App.vue'

import { randomMediaEntry, randomMedia } from '@/js/test'

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')

window.randomMedia = randomMedia
window.randomMediaEntry = randomMediaEntry
