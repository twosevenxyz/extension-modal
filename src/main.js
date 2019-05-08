import Vue from 'vue'
import App from './App.vue'

import { randomMediaEntry, randomMedia, fakeInitialize } from '@/js/test'

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')

window.randomMedia = randomMedia
window.randomMediaEntry = randomMediaEntry
window.fakeInitialize = fakeInitialize
