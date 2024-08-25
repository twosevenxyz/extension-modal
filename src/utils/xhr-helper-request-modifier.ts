import Hls from 'hls.js'
import type { HlsConfig } from 'hls.js'

export type XHRSetup = (xhr: XMLHttpRequest, url: string) => Promise<() => void>

export class XHRHelperRequestModifierLoader extends Hls.DefaultConfig.loader {
  xhrSetup: XHRSetup
  config: HlsConfig
  constructor (xhrSetup: XHRSetup, config: HlsConfig) {
    super(config)
    this.xhrSetup = xhrSetup
    this.config = config
  }

  async loadInternal () {
    const context = this.context!
    const xhr = new XMLHttpRequest()
    ;(this as any).loader = xhr

    const stats = this.stats
    stats.loaded = 0
    const { xhrSetup } = this

    let cleanup: () => void
    try {
      if (xhrSetup) {
        try {
          cleanup = await xhrSetup(xhr, context.url)
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
      (this as any).callbacks.onError({ code: xhr.status, text: (e as any).message }, context, xhr)
      return
    }

    if (context.rangeEnd) {
      xhr.setRequestHeader('Range', 'bytes=' + context.rangeStart + '-' + (context.rangeEnd - 1))
    }

    xhr.onreadystatechange = (this as any).readystatechange.bind(this)
    xhr.onprogress = (this as any).loadprogress.bind(this)
    xhr.responseType = context.responseType as any

    xhr.addEventListener('readystatechange', async () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (cleanup) {
          cleanup()
        }
      }
    })

    // setup timeout before we perform request
    ;(this as any).requestTimeout = window.setTimeout((this as any).loadtimeout.bind(this), (this.config as any).timeout)
    xhr.send()
  }
}
