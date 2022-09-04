/* global MODE */
import { createApp } from 'vue'
import App from './App.vue'

;(async () => {
  if (MODE === 'dev') {
    await import('@/js/fake-bg')
    const Tests = await import('@/js/test')
    const { randomMediaEntry, randomMedia, fakeInitialize } = Tests
    ;(window as any).randomMedia = randomMedia
    ;(window as any).randomMediaEntry = randomMediaEntry
    ;(window as any).fakeInitialize = fakeInitialize
  }

  const app = createApp(App)
  app.mount('#app')
})()
