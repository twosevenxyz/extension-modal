import { describe, expect, test } from 'vitest'
import { CAPTION_PROCESSED_EVENT, captionTrackKey, captionsConfig, resolveCaptionSource } from './caption-source'

describe('resolveCaptionSource', () => {
  test('prefers text over a src that addresses the pre-conversion resource', () => {
    expect(resolveCaptionSource({ src: 'https://cdn/subs/en.srt?v=9', format: 'vtt', text: 'WEBVTT\n\n' }))
      .toEqual({ kind: 'text', text: 'WEBVTT\n\n' })
  })

  test('prefers text over a blob src minted in another document', () => {
    expect(resolveCaptionSource({ src: 'blob:https://kisskh.do/abc', format: 'vtt', text: 'WEBVTT\n\n' }))
      .toEqual({ kind: 'text', text: 'WEBVTT\n\n' })
  })

  test('converts when there is no text and the format is not vtt', () => {
    expect(resolveCaptionSource({ src: 'https://cdn/subs/en.srt', format: 'srt' }))
      .toEqual({ kind: 'convert', src: 'https://cdn/subs/en.srt' })
  })

  test('attaches the src directly when there is no text and it is already vtt', () => {
    expect(resolveCaptionSource({ src: 'https://cdn/subs/en.vtt', format: 'vtt' }))
      .toEqual({ kind: 'src', src: 'https://cdn/subs/en.vtt' })
  })

  test('attaches the src directly when nothing is known about the format', () => {
    expect(resolveCaptionSource({ src: 'https://cdn/subs/en.vtt' }))
      .toEqual({ kind: 'src', src: 'https://cdn/subs/en.vtt' })
  })

  test('ignores empty text rather than attaching a blank track', () => {
    expect(resolveCaptionSource({ src: 'https://cdn/subs/en.srt', format: 'srt', text: '' }))
      .toEqual({ kind: 'convert', src: 'https://cdn/subs/en.srt' })
  })
})

describe('captionsConfig', () => {
  test('disables captions entirely when there is no plyr provider', () => {
    expect(captionsConfig(false)).toBe(false)
  })

  test('names an onProcessed event, without which plyr never registers addTrack', () => {
    const config = captionsConfig(true)
    expect(config).not.toBe(false)
    expect((config as any).upload.onProcessed).toBe(CAPTION_PROCESSED_EVENT)
    expect(typeof CAPTION_PROCESSED_EVENT).toBe('string')
    expect(CAPTION_PROCESSED_EVENT.length).toBeGreaterThan(0)
  })

  test('keeps upload enabled with the convertible formats', () => {
    const upload = (captionsConfig(true) as any).upload
    expect(upload.enabled).toBe(true)
    expect(upload.formats).toContain('vtt')
    expect(upload.formats).toContain('srt')
  })
})

describe('captionTrackKey', () => {
  test('separates two same-labelled tracks that carry different sources', () => {
    const a = { src: 'https://cdn/en.srt', label: 'English', srclang: 'en', text: 'WEBVTT a' }
    const b = { src: 'blob:https://site/abc', label: 'English', srclang: 'en', text: 'WEBVTT b' }
    expect(captionTrackKey(a)).not.toBe(captionTrackKey(b))
  })

  test('is stable for the same track across re-reads', () => {
    const t = { src: 'https://cdn/en.vtt', label: 'English', srclang: 'en' }
    expect(captionTrackKey(t)).toBe(captionTrackKey({ ...t }))
  })

  test('falls back to label/lang/length when there is no src', () => {
    expect(captionTrackKey({ src: '', label: 'English', srclang: 'en', text: 'WEBVTT' }))
      .toBe('text:English:en:6')
  })
})
