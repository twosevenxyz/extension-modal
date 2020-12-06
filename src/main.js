/* global MODE */
import Vue from 'vue'
import App from './App.vue'

;(async () => {
  if (MODE === 'dev') {
    await import('@/js/fake-bg')
    const Tests = await import('@/js/test')
    const { randomMediaEntry, randomMedia, fakeInitialize } = Tests
    window.randomMedia = randomMedia
    window.randomMediaEntry = randomMediaEntry
    window.fakeInitialize = fakeInitialize
  }

  Vue.config.productionTip = false

  new Vue({
    render: h => h(App)
  }).$mount('#app')
})()
