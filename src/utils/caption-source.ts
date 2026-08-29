export interface CaptionTrackLike {
  src: string
  format?: string
  text?: string
}

export type CaptionSource =
  /** Attach from text already normalised to VTT; build the object URL locally. */
  | { kind: 'text', text: string }
  /** Fetch `src` and convert it before attaching. */
  | { kind: 'convert', src: string }
  /** Attach `src` directly. */
  | { kind: 'src', src: string }

/**
 * Decide what a caption track should be attached with.
 *
 * `text` wins whenever it is present: it is already normalised to VTT, while
 * `src` may still address the PRE-conversion resource — an .srt served as
 * application/octet-stream, which a <track> element will not parse as WebVTT —
 * or a blob URL minted in another document. Choosing on `format` alone inverts
 * this: `format === 'vtt'` describes the text, so it skips conversion exactly
 * when the src is the one that needed it.
 */
export function resolveCaptionSource (track: CaptionTrackLike): CaptionSource {
  if (track.text) {
    return { kind: 'text', text: track.text }
  }
  if (track.format && track.format !== 'vtt') {
    return { kind: 'convert', src: track.src }
  }
  return { kind: 'src', src: track.src }
}

/**
 * Event plyr is told to listen on for processed caption tracks.
 *
 * plyr registers its `addTrack` receiver ONLY when `captions.upload.onProcessed`
 * names an event (see plyr captions.js). Omit it and the dispatch has no
 * listener, so no track is ever added and captions silently never appear.
 */
export const CAPTION_PROCESSED_EVENT = 'ts:caption-processed'

/** plyr `captions` option; `false` disables captions entirely. */
export function captionsConfig (enabled: boolean) {
  if (!enabled) {
    return false as const
  }
  return {
    active: true,
    update: true,
    language: 'en',
    upload: {
      formats: ['srt', 'vtt', 'ssa', 'ass'],
      enabled: true,
      callback: true,
      onProcessed: CAPTION_PROCESSED_EVENT
    }
  }
}

/**
 * Identity for an already-attached caption track.
 *
 * Tracks arrive asynchronously and the list is re-read whenever it changes, so
 * the same track is offered more than once. Two tracks may share a label and
 * language while carrying different bodies, so the source is what distinguishes
 * them.
 */
export function captionTrackKey (track: CaptionTrackLike & { label?: string, srclang?: string }): string {
  if (track.src) {
    return `src:${track.src}`
  }
  return `text:${track.label ?? ''}:${track.srclang ?? ''}:${(track.text ?? '').length}`
}
