const path = require('path')

function resolve (dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  filenameHashing: false,
  configureWebpack: config => {
    Object.assign(config.resolve.alias, {
      vue$: 'vue/dist/vue.runtime.js',
      '@': resolve('src'),
      plyr: path.join(resolve('plyr'), 'dist', 'plyr.js')
    })
  },
  css: {
    loaderOptions: {
      sass: {
        prependData: '@import "~@/style/bulma-imports.scss";'
      }
    }
  }
}
