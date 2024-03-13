import { Headers } from "@/components/types"

type MakeRequest = (url: string, headers: Headers, responseType: string) => Promise<void>

export class ExtensionBGLoader {
  headers: Record<string, string>
  makeRequest: MakeRequest

  constructor(config: any, headers: Headers, makeRequest: MakeRequest) {
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
    const stats: any = {
      trequest: performance.now(),
      retry: 0
    }

    const { url, rangeStart, rangeEnd, responseType = '' } = context
    const headers = { ...this.headers }
    if (rangeEnd) {
      headers.Range = `bytes=${rangeStart}-${rangeEnd - 1}`
    }
    const response: any = await this.makeRequest(url, headers, responseType)
    if (response.ok) {
      stats.tfirst = Math.max(stats.trequest, performance.now())
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
    stats.tload = Math.max(stats.tfirst, performance.now())
    stats.loaded = stats.total = len
    callbacks.onSuccess(loadResult, stats, context)
  }
}
