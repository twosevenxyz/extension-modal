import HLS, { LoadStats } from 'hls.js'
import { Headers } from "@/components/types"

type MakeRequest = (url: string, headers: Record<string, string>, responseType: string) => Promise<void>

export class ExtensionBGLoader extends HLS.DefaultConfig.loader {
  headers: Record<string, string>
  makeRequest: MakeRequest

  constructor(config: any, headers: Headers, makeRequest: MakeRequest) {
    super(config)
    this.headers = {}
    if (Array.isArray(headers)) {
      // This is an array of type { name: string, value: string}[]
      headers.forEach(entry => {
        this.headers[entry.name] = entry.value
      })
    }
    this.makeRequest = makeRequest
  }

  destroy() {
  }

  abort() {
  }

  async load(context: any, config: any, callbacks: any) {
    const stats = new LoadStats()
    stats.retry = 0
    stats.loading.start = performance.now()

    const { url, rangeStart, rangeEnd, responseType = '' } = context
    const headers = { ...this.headers }
    if (rangeEnd) {
      headers.Range = `bytes=${rangeStart}-${rangeEnd - 1}`
    }
    const response: any = await this.makeRequest(url, headers, responseType)
    if (response.ok) {
      stats.loading.first = Math.max(stats.loading.start, performance.now())
    } else {
      callbacks.onError({ text: 'Failed to make request' }, context)
    }
    let loadResult: any = { url }
    let len
    if (context.responseType === 'arraybuffer') {
      const buffer = new Uint8Array(response.buffer).buffer
      len = buffer.byteLength
      loadResult.data = buffer
    } else {
      len = response.text.length
      loadResult.data = response.text
    }
    stats.loading.end = Math.max(stats.loading.first, performance.now())
    stats.loaded = stats.total = len
    callbacks.onSuccess(loadResult, stats, context)
  }
}
