const path = require('path')

function resolve (dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  filenameHashing: false,
  configureWebpack: config => {
    Object.assign(config.resolve.alias, {
      'vue$': 'vue/dist/vue.runtime.js',
      '@': resolve('src'),
      'plyr': path.join(resolve('plyr'), 'src', 'js', 'plyr')
    })
  },
  css: {
    loaderOptions: {
      sass: {
        data: `@import "./src/style/bulma-imports.scss";`
      }
    }
  }
}
