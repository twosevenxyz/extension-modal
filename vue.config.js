const path = require('path')
const webpack = require('webpack')

function resolve (dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  filenameHashing: false,
  configureWebpack: config => {
    Object.assign(config.resolve.alias, {
      vue$: 'vue/dist/vue.runtime.js',
      '@': resolve('src'),
      plyr: path.join(resolve('plyr'), 'src', 'js', 'plyr')
    })
    config.plugins.push(...[
      new webpack.DefinePlugin({
        MODE: `"${process.env.NODE_ENV === 'development' ? 'dev' : 'prod'}"`
      })
    ])
  },
  css: {
    loaderOptions: {
      sass: {
        prependData: '@import "~@/style/bulma-imports.scss";'
      }
    }
  }
}
