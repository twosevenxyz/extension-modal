/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist'),
    watch: process.env.NODE_ENV === 'development' ? {} : undefined,
    lib: {
      entry: resolve(__dirname, 'src/lib.ts'),
      name: 'Modal',
      fileName: format => `modal.${format}.js`
    },
    rollupOptions: {
      // external: [
      //   'vue'
      // ],
      // output: {
      //   globals: {
      //     vue: 'Vue'
      //   }
      // }
    }
  },
  plugins: [
    vue(),
    Components({
      resolvers: [IconsResolver()]
    }),
    Icons()
  ]
})
