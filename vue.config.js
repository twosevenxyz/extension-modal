module.exports = {
  filenameHashing: false,
  configureWebpack: {
    node: false,
    resolve: {
      alias: {
        'vue$': 'vue/dist/vue.runtime.js'
      }
    }
  },
  css: {
    loaderOptions: {
      sass: {
        data: `@import "./src/style/bulma-imports.scss";`
      }
    }
  }
}
