import type Plyr from '@twosevenxyz/plyr'

export interface Header {
  name: string
  value: string
}
export type Headers = Header[]

export interface PartialVideoData {
  hash: string
  title: string
  premiumContent?: boolean
  isLocked?: {
    reason: string
    tier?: number
    until?: number
    value?: string
  }
  language?: any // FIXME: What is this
  plyrProvider: Plyr.Provider
  tracks?: { format: string, src: string, text?: string }[]
  plyrContentType: string
  poster?: string
  duration?: number
}

export interface Entry {
  entryType: 'playlist' | 'media'
  videoSelector: string
  videoURL: string
  videoData: PartialVideoData
  extensionProperties?: { warnText: string }
  headers: Headers
}

export interface Profile {
  isPatron?: boolean
  privileges?: Record<string, any>
  tier?: number
}
