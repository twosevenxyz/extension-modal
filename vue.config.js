module.exports = {
  filenameHashing: false,
  configureWebpack: {
    node: false,
    resolve: {
      alias: {
        'vue$': 'vue/dist/vue.runtime.js'
      }
    }
  }
}
