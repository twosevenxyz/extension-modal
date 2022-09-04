import Hls from 'hls.js'

class XhrHelpLoader extends Hls.DefaultConfig.loader { // eslint-disable-line no-unused-vars
  async loadInternal () {
    const context = this.context
    const xhr = (this as any).loader = new XMLHttpRequest()

    const stats = this.stats
    ;(stats as any).tfirst = 0
    ;(stats as any).loaded = 0
    const xhrSetup = (this as any).xhrSetup

    try {
      if (xhrSetup) {
        try {
          await xhrSetup(xhr, context.url)
        } catch (e) {
          // fix xhrSetup: (xhr, url) => {xhr.setRequestHeader("Content-Language", "test");}
          // not working, as xhr.setRequestHeader expects xhr.readyState === OPEN
          xhr.open('GET', context.url, true)
          xhrSetup(xhr, context.url)
        }
      }
      if (!xhr.readyState) {
        xhr.open('GET', context.url, true)
      }
    } catch (e) {
      // IE11 throws an exception on xhr.open if attempting to access an HTTP resource over HTTPS
      (this as any).callbacks.onError({ code: xhr.status, text: e.message }, context, xhr)
      return
    }

    if (context.rangeEnd) {
      xhr.setRequestHeader('Range', 'bytes=' + context.rangeStart + '-' + (context.rangeEnd - 1))
    }

    xhr.onreadystatechange = (this as any).readystatechange.bind(this)
    xhr.onprogress = (this as any).loadprogress.bind(this) as typeof xhr.onprogress
    (xhr as any).responseType = (context as any).responseType

    // setup timeout before we perform request
    ;(this as any).requestTimeout = window.setTimeout((this as any).loadtimeout.bind(this), (this as any).config.timeout)
    xhr.send()
  }
}

export default XhrHelpLoader
